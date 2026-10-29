import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import {
  canonicalMatchId,
  COLLECTIONS,
  conversationDoc,
  userDoc,
} from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { blockDocumentId } from "@/lib/safety/blocks";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { blockTargetSchema } from "@/lib/validation/messaging";

const BLOCK_LIMIT = { limit: 20, windowMs: 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/**
 * One-way block. Discovery/matching already exclude both directions; the
 * active match and conversation (if any) are closed in the same transaction.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`blocks:${session.uid}`, BLOCK_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = blockTargetSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "invalid_input");

  const { targetUid } = parsed.data;
  if (targetUid === session.uid) return jsonError(400, "self_action");

  const db = getAdminDb();
  const blockRef = db.collection(COLLECTIONS.blocks).doc(blockDocumentId(session.uid, targetUid));
  const matchId = canonicalMatchId(session.uid, targetUid);
  const matchRef = db.collection(COLLECTIONS.matches).doc(matchId);
  const conversationRef = db.doc(conversationDoc(matchId));
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();
  const targetRef = db.doc(userDoc(targetUid));

  const result = await db.runTransaction(async (transaction) => {
    const [target, block, match, conversation] = await Promise.all([
      transaction.get(targetRef),
      transaction.get(blockRef),
      transaction.get(matchRef),
      transaction.get(conversationRef),
    ]);
    if (!target.exists) return { status: "not_found" as const };
    if (block.exists) return { status: "already_blocked" as const };

    const now = FieldValue.serverTimestamp();
    transaction.create(blockRef, {
      blockerUid: session.uid,
      blockedUid: targetUid,
      createdAt: now,
    });

    if (match.exists && match.get("status") === "active") {
      transaction.update(matchRef, { status: "blocked", endedAt: now, updatedAt: now });
    }
    if (conversation.exists && conversation.get("status") === "active") {
      transaction.update(conversationRef, { status: "closed", updatedAt: now });
    }

    transaction.create(auditRef, {
      actorUid: session.uid,
      action: "safety.block",
      targetType: "user",
      targetId: targetUid,
      reasonCode: null,
      metadata: match.exists ? { closedMatch: true } : null,
      createdAt: now,
    });

    return { status: "blocked" as const };
  });

  if (result.status === "not_found") return jsonError(404, "not_found");
  return Response.json({ ok: true, status: result.status });
}
