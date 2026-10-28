import { FieldValue } from "firebase-admin/firestore";

import { regionLabel } from "@/lib/config/onboarding";
import { getAdminDb } from "@/lib/firebase/admin/app";
import {
  COLLECTIONS,
  preferencesDoc,
  profileDoc,
  userDoc,
  userPrivateDoc,
} from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { clientIp, requestOrigin } from "@/lib/http/request";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { onboardingSchema } from "@/lib/validation/onboarding";

const SAVE_LIMIT = { limit: 20, windowMs: 5 * 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/**
 * Saves onboarding. The session cookie is the only identity source; the uid is
 * never accepted from the browser.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`onboarding:${session.uid}`, SAVE_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = onboardingSchema.safeParse(body.data);
  if (!parsed.success) {
    const underage = parsed.error.issues.some(
      (issue) => issue.path.includes("birthDate") && /18/.test(issue.message),
    );
    if (underage) return jsonError(403, "underage");

    return Response.json(
      {
        error: "invalid_input",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const uid = session.uid;
  const db = getAdminDb();
  const userRef = db.doc(userDoc(uid));
  const profileRef = db.doc(profileDoc(uid));
  const preferencesRef = db.doc(preferencesDoc(uid));
  const ageAssuranceRef = db.doc(userPrivateDoc(uid, "ageAssurance"));
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  try {
    await db.runTransaction(async (transaction) => {
      const [profileSnapshot, preferencesSnapshot] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(preferencesRef),
      ]);

      const now = FieldValue.serverTimestamp();
      const existingProfile = profileSnapshot.data() ?? {};
      const existingPreferences = preferencesSnapshot.data() ?? {};
      const createdAt = existingProfile.createdAt ?? now;

      transaction.set(
        profileRef,
        {
          uid,
          displayName: input.displayName,
          birthDate: input.birthDate,
          pronouns: existingProfile.pronouns ?? null,
          bio: input.bio,
          countryCode: input.countryCode,
          regionCode: input.region,
          broadLocationLabel: regionLabel(input.region),
          languages: input.languages,
          visibility: existingProfile.visibility ?? "visible",
          moderationStatus: existingProfile.moderationStatus ?? "pending",
          photoCount:
            typeof existingProfile.photoCount === "number" ? existingProfile.photoCount : 0,
          interestIds: input.interestIds,
          createdAt,
          updatedAt: now,
        },
        { merge: true },
      );

      transaction.set(
        preferencesRef,
        {
          uid,
          intent: input.intent,
          desiredIntents: [input.intent],
          ageMin: typeof existingPreferences.ageMin === "number" ? existingPreferences.ageMin : 18,
          ageMax: typeof existingPreferences.ageMax === "number" ? existingPreferences.ageMax : 99,
          distanceLimitKm: existingPreferences.distanceLimitKm ?? null,
          preferredRegions: input.region ? [input.region] : [],
          preferredLanguages: input.languages,
          dealbreakers: Array.isArray(existingPreferences.dealbreakers)
            ? existingPreferences.dealbreakers
            : [],
          discoveryPaused:
            typeof existingPreferences.discoveryPaused === "boolean"
              ? existingPreferences.discoveryPaused
              : false,
          updatedAt: now,
        },
        { merge: true },
      );

      // Self-declared for the MVP; document verification is a later slice.
      transaction.set(
        ageAssuranceRef,
        {
          ageAssurance: {
            method: "self_declared",
            status: "unverified",
            verifiedAt: null,
          },
          updatedAt: now,
        },
        { merge: true },
      );

      transaction.set(userRef, { updatedAt: now, accountStatus: "active" }, { merge: true });

      transaction.create(auditRef, {
        actorUid: uid,
        action: "profile.onboarding_completed",
        targetType: "user",
        targetId: uid,
        reasonCode: null,
        metadata: null,
        createdAt: now,
      });
    });
  } catch (error) {
    logger.error("profile.onboarding.write_failed", {
      reason: error instanceof Error ? error.name : "unknown",
      ip: clientIp(request),
    });
    return jsonError(503, "onboarding_unavailable");
  }

  logger.info("profile.onboarding.completed");
  return Response.json({ ok: true });
}
