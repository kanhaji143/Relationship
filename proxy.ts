import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session/cookie";

/**
 * Fast-path guard for authenticated areas.
 *
 * Presence-only check so the proxy stays cheap; the page itself verifies the
 * session cookie server-side. Keeps unauthenticated visitors out before any
 * HTML is streamed.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/settings/prompts",
    "/settings/prompts/:path*",
    "/settings/discovery",
    "/settings/discovery/:path*",
    "/discover",
    "/discover/:path*",
    "/likes",
    "/likes/:path*",
    "/matches",
    "/matches/:path*",
    "/messages",
    "/messages/:path*",
  ],
};
