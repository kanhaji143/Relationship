import { FieldValue } from "firebase-admin/firestore";

import { isFirebaseConfigured } from "@/lib/config/env";
import { POLICY_LOCALE, POLICY_VERSION, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/config/legal";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, userDoc } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { bearerToken, clientIp, requestOrigin } from "@/lib/http/request";
import { logger } from "@/lib/logger";
import { emailLookupKey } from "@/lib/privacy/hash";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { authSignupSchema } from "@/lib/validation/auth";

class EmailInUseError extends Error {}

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

/**
 * Creates the server-owned account records for a freshly created Firebase user.
 * Idempotent: a retry with the same uid returns `exists` instead of duplicating.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const limit = checkAuthRateLimit(`register:${clientIp(request)}`);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  if (!isFirebaseConfigured()) return jsonError(503, "auth_not_configured");

  const idToken = bearerToken(request);
  if (!idToken) return jsonError(401, "missing_token");

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = authSignupSchema.safeParse(body.data);
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

  if (parsed.data.policyVersion !== POLICY_VERSION) {
    return jsonError(400, "policy_version_mismatch");
  }

  let uid: string;
  let email: string | undefined;
  let emailVerified = false;

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    uid = decoded.uid;
    email = typeof decoded.email === "string" ? decoded.email : undefined;
    emailVerified = decoded.email_verified === true;
  } catch (error) {
    const code = errorCode(error);
    if (code.startsWith("auth/")) {
      logger.warn("auth.register.rejected", { reason: code });
      return jsonError(401, "invalid_token");
    }
    logger.error("auth.register.unavailable", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "auth_unavailable");
  }

  if (!email) return jsonError(400, "email_required");

  const emailNormalized = email.trim().toLowerCase();
  const db = getAdminDb();
  const userRef = db.doc(userDoc(uid));
  const lookupRef = db.doc(`${COLLECTIONS.emailLookup}/${emailLookupKey(emailNormalized)}`);
  const consentPurposes = [
    { purpose: "terms_of_service" as const, version: TERMS_VERSION },
    { purpose: "privacy_policy" as const, version: PRIVACY_VERSION },
    { purpose: "age_assurance" as const, version: POLICY_VERSION },
  ];
  const consentRefs = consentPurposes.map(() => db.collection(COLLECTIONS.consentRecords).doc());
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  let created = false;

  try {
    await db.runTransaction(async (transaction) => {
      const [userSnapshot, lookupSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(lookupRef),
      ]);

      if (userSnapshot.exists) return;

      if (lookupSnapshot.exists && lookupSnapshot.get("uid") !== uid) {
        throw new EmailInUseError();
      }

      const now = FieldValue.serverTimestamp();

      transaction.create(userRef, {
        uid,
        emailNormalized,
        accountStatus: "active",
        role: "user",
        emailVerifiedAt: emailVerified ? now : null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      });

      transaction.set(lookupRef, { uid, createdAt: now });

      consentPurposes.forEach((entry, index) => {
        const ref = consentRefs[index]!;
        transaction.create(ref, {
          uid,
          purpose: entry.purpose,
          policyVersion: entry.version,
          choice: "granted",
          locale: parsed.data.locale || POLICY_LOCALE,
          capturedAt: now,
          withdrawnAt: null,
        });
      });

      transaction.create(auditRef, {
        actorUid: uid,
        action: "auth.register",
        targetType: "user",
        targetId: uid,
        reasonCode: null,
        metadata: null,
        createdAt: now,
      });

      created = true;
    });
  } catch (error) {
    if (error instanceof EmailInUseError) return jsonError(409, "email_in_use");

    logger.error("auth.register.write_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "registration_unavailable");
  }

  logger.info("auth.register.completed", { created });
  return Response.json(
    { ok: true, status: created ? "created" : "exists" },
    { status: created ? 201 : 200 },
  );
}
