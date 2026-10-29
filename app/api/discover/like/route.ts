import { FieldValue } from "firebase-admin/firestore";

import { isAllowedOrigin } from "@/lib/http/origin";
import { readJson, jsonError } from "@/lib/http/json";
import { requestOrigin } from "@/lib/http/request";
import { getAdminDb } from "@/lib/firebase/admin/app";
import {
  canonicalMatchId,
  COLLECTIONS,
  conversationDoc,
  profileDoc,
  userDoc,
  userPrivateDoc,
  preferencesDoc,
} from "@/lib/firebase/collections";
import { areMutuallyEligible } from "@/lib/discovery/eligibility";
import { likeDocumentId } from "@/lib/discovery/like-id";
import { toDiscoveryParticipant } from "@/lib/discovery/participant";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { likeActionSchema } from "@/lib/validation/discovery";

const LIKE_LIMIT = { limit: 60, windowMs: 5 * 60 * 1000 };

class IneligiblePairError extends Error {}

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/**
 * Records a like or pass. On mutual like, creates a match document.
 * Idempotent: repeating the same action returns `already_recorded`.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`discover:${session.uid}`, LIKE_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = likeActionSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_input",
        fields: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }

  const { targetUid, action } = parsed.data;
  if (targetUid === session.uid) return jsonError(400, "self_action");

  const db = getAdminDb();
  const uid = session.uid;
  const viewerUserRef = db.doc(userDoc(uid));
  const viewerProfileRef = db.doc(profileDoc(uid));
  const viewerPreferencesRef = db.doc(preferencesDoc(uid));
  const viewerAgeRef = db.doc(userPrivateDoc(uid, "ageAssurance"));
  const targetUserRef = db.doc(userDoc(targetUid));
  const targetProfileRef = db.doc(profileDoc(targetUid));
  const targetPreferencesRef = db.doc(preferencesDoc(targetUid));
  const targetAgeRef = db.doc(userPrivateDoc(targetUid, "ageAssurance"));
  const viewerBlocksQuery = db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid);
  const targetBlocksQuery = db.collection(COLLECTIONS.blocks).where("blockerUid", "==", targetUid);
  const outgoingLikeRef = db.collection(COLLECTIONS.likes).doc(likeDocumentId(uid, targetUid));
  const incomingLikeRef = db.collection(COLLECTIONS.likes).doc(likeDocumentId(targetUid, uid));
  const matchId = canonicalMatchId(uid, targetUid);
  const matchRef = db.doc(`${COLLECTIONS.matches}/${matchId}`);
  const conversationRef = db.doc(conversationDoc(matchId));
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const [
        viewerUser,
        viewerProfile,
        viewerPreferences,
        viewerAge,
        targetUser,
        targetProfile,
        targetPreferences,
        targetAge,
        viewerBlocks,
        targetBlocks,
      ] = await Promise.all([
        transaction.get(viewerUserRef),
        transaction.get(viewerProfileRef),
        transaction.get(viewerPreferencesRef),
        transaction.get(viewerAgeRef),
        transaction.get(targetUserRef),
        transaction.get(targetProfileRef),
        transaction.get(targetPreferencesRef),
        transaction.get(targetAgeRef),
        transaction.get(viewerBlocksQuery),
        transaction.get(targetBlocksQuery),
      ]);

      const viewerBlockedTarget = viewerBlocks.docs.some(
        (block) => block.get("blockedUid") === targetUid,
      );
      const targetBlockedViewer = targetBlocks.docs.some(
        (block) => block.get("blockedUid") === uid,
      );
      if (
        viewerBlockedTarget ||
        targetBlockedViewer ||
        !viewerUser.exists ||
        !viewerProfile.exists ||
        !viewerPreferences.exists ||
        !viewerAge.exists ||
        !targetUser.exists ||
        !targetProfile.exists ||
        !targetPreferences.exists ||
        !targetAge.exists
      ) {
        throw new IneligiblePairError();
      }

      const viewer = toDiscoveryParticipant({
        uid,
        user: viewerUser.data() ?? {},
        profile: viewerProfile.data() ?? {},
        preferences: viewerPreferences.data() ?? {},
        privateAge: viewerAge.data() ?? {},
        blockedUids: viewerBlockedTarget ? [targetUid] : [],
      });
      const target = toDiscoveryParticipant({
        uid: targetUid,
        user: targetUser.data() ?? {},
        profile: targetProfile.data() ?? {},
        preferences: targetPreferences.data() ?? {},
        privateAge: targetAge.data() ?? {},
        blockedUids: targetBlockedViewer ? [uid] : [],
      });

      if (
        !viewer ||
        !target ||
        !areMutuallyEligible(viewer.viewer, target.profile, target.viewer, viewer.profile).eligible
      ) {
        throw new IneligiblePairError();
      }

      const [outgoingLike, incomingLike, match, conversation] = await Promise.all([
        transaction.get(outgoingLikeRef),
        transaction.get(incomingLikeRef),
        transaction.get(matchRef),
        transaction.get(conversationRef),
      ]);

      if (match.exists && match.get("status") === "active" && action === "pass") {
        return { status: "already_matched", matched: true };
      }
      if (outgoingLike.exists && outgoingLike.get("action") === action) {
        return {
          status: "already_recorded",
          matched: match.exists && match.get("status") === "active",
        };
      }

      const now = FieldValue.serverTimestamp();
      transaction.set(
        outgoingLikeRef,
        {
          fromUid: uid,
          toUid: targetUid,
          action,
          createdAt: outgoingLike.get("createdAt") ?? now,
          updatedAt: now,
        },
        { merge: true },
      );

      const activeMatch = match.exists && match.get("status") === "active";
      const reciprocalLike = incomingLike.exists && incomingLike.get("action") === "like";
      const matched = action === "like" && (activeMatch || (!match.exists && reciprocalLike));

      if (matched) {
        const [userA, userB] = [uid, targetUid].sort();
        if (!match.exists) {
          transaction.create(matchRef, {
            userA,
            userB,
            status: "active",
            matchedAt: now,
            endedAt: null,
            createdAt: now,
            updatedAt: now,
          });
        }
        if (!conversation.exists) {
          transaction.create(conversationRef, {
            participantUids: [userA, userB],
            status: "active",
            createdAt: now,
            lastMessageAt: null,
          });
        }
      }

      transaction.create(auditRef, {
        actorUid: uid,
        action: action === "like" ? "discover.like" : "discover.pass",
        targetType: "user",
        targetId: targetUid,
        reasonCode: null,
        metadata: matched ? { matched: true } : null,
        createdAt: now,
      });

      return {
        status: outgoingLike.exists ? "updated" : "recorded",
        matched,
      };
    });

    logger.info("discover.action", { action, matched: result.matched });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof IneligiblePairError) return jsonError(404, "target_not_found");
    logger.error("discover.action_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "discover_unavailable");
  }
}
