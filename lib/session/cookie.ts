/**
 * Session cookie constants and options.
 *
 * The cookie holds a Firebase session cookie (opaque, server-issued). It is
 * never readable by JavaScript and is only sent over HTTPS outside local dev.
 */

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // Firebase max is 14 days; 5 keeps revocation tight.

export type SessionCookieOptions = {
  name: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export function sessionCookieOptions(isProduction: boolean): SessionCookieOptions {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
