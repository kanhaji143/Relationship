import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAuth } from "@/lib/firebase/admin/app";

import { SESSION_COOKIE_NAME } from "./cookie";

export type SessionUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};

export async function getSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Resolves the session from the HttpOnly cookie, checking revocation.
 * Returns null for missing, expired or revoked sessions. Never throws for
 * ordinary auth failures, so callers can render a signed-out state.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookie = await getSessionCookie();
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : null,
      emailVerified: decoded.email_verified === true,
    };
  } catch {
    return null;
  }
}

/** Data Access Layer guard: use in Server Components that require a session. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
