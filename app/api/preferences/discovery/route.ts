import { FieldValue } from "firebase-admin/firestore";

import { isAllowedOrigin } from "@/lib/http/origin";
import { readJson, jsonError } from "@/lib/http/json";
import { requestOrigin } from "@/lib/http/request";
import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, preferencesDoc, userDoc } from "@/lib/firebase/collections";
import { getDiscoveryPreferences } from "@/lib/preferences/server";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { discoveryPreferencesSchema } from "@/lib/validation/discovery-preferences";

const SAVE_LIMIT = { limit: 20, windowMs: 5 * 60 * 1000 };

class MissingAccountRecordError extends Error {}

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  try {
    return Response.json({ preferences: await getDiscoveryPreferences(session.uid) });
  } catch (error) {
    logger.error("preferences.discovery.read_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "preferences_unavailable");
  }
}

/** Updates discovery filters without changing the user's own relationship intent. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`discovery-preferences:${session.uid}`, SAVE_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = discoveryPreferencesSchema.safeParse(body.data);
  if (!parsed.success) {
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

  const db = getAdminDb();
  const uid = session.uid;
  const userRef = db.doc(userDoc(uid));
  const preferenceRef = db.doc(preferencesDoc(uid));
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  try {
    await db.runTransaction(async (transaction) => {
      const [userSnapshot, preferenceSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(preferenceRef),
      ]);
      if (!userSnapshot.exists) throw new MissingAccountRecordError();

      const existing = preferenceSnapshot.data() ?? {};
      const now = FieldValue.serverTimestamp();
      transaction.set(
        preferenceRef,
        {
          uid,
          intent: existing.intent === "casual" ? "casual" : "serious",
          desiredIntents: parsed.data.desiredIntents,
          ageMin: parsed.data.ageMin,
          ageMax: parsed.data.ageMax,
          distanceLimitKm: existing.distanceLimitKm ?? null,
          preferredRegions: parsed.data.preferredRegions,
          preferredLanguages: parsed.data.preferredLanguages,
          dealbreakers: Array.isArray(existing.dealbreakers) ? existing.dealbreakers : [],
          discoveryPaused: parsed.data.discoveryPaused,
          updatedAt: now,
        },
        { merge: true },
      );
      transaction.create(auditRef, {
        actorUid: uid,
        action: "preferences.discovery_updated",
        targetType: "user",
        targetId: uid,
        reasonCode: null,
        metadata: {
          desiredIntentCount: parsed.data.desiredIntents.length,
          discoveryPaused: parsed.data.discoveryPaused,
        },
        createdAt: now,
      });
    });
  } catch (error) {
    if (error instanceof MissingAccountRecordError) return jsonError(409, "registration_required");
    logger.error("preferences.discovery.write_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "preferences_unavailable");
  }

  return Response.json({ ok: true });
}
