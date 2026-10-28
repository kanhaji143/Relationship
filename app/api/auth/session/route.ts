import { cookies } from "next/headers";

import { isFirebaseConfigured } from "@/lib/config/env";
import { getAdminAuth } from "@/lib/firebase/admin/app";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { clientIp, requestOrigin } from "@/lib/http/request";
import { logger } from "@/lib/logger";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "@/lib/session/cookie";

const isProduction = process.env.NODE_ENV === "production";

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
 * Exchanges a Firebase ID token for an HttpOnly session cookie.
 * The token is never logged or persisted.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const limit = checkAuthRateLimit(`session:${clientIp(request)}`);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  if (!isFirebaseConfigured()) return jsonError(503, "auth_not_configured");

  const body = await readJson<{ idToken?: unknown }>(request);
  if (!body.ok) return body.response;

  const idToken = body.data?.idToken;
  if (typeof idToken !== "string" || idToken.length < 20 || idToken.length > 8192) {
    return jsonError(400, "invalid_request");
  }

  try {
    const auth = getAdminAuth();
    await auth.verifyIdToken(idToken, true);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    (await cookies()).set({
      ...sessionCookieOptions(isProduction),
      value: sessionCookie,
    });

    logger.info("auth.session.created");
    return Response.json({ ok: true });
  } catch (error) {
    const code = errorCode(error);
    if (code.startsWith("auth/")) {
      logger.warn("auth.session.rejected", { reason: code });
      return jsonError(401, "invalid_token");
    }
    logger.error("auth.session.unavailable", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "auth_unavailable");
  }
}

/** Clears the session cookie. Revocation is handled server-side by version. */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  (await cookies()).set({
    ...sessionCookieOptions(isProduction),
    value: "",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
