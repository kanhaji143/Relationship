import { describe, expect, it } from "vitest";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "./cookie";

describe("sessionCookieOptions", () => {
  it("is HttpOnly, SameSite=Lax and scoped to the site root", () => {
    const options = sessionCookieOptions(false);
    expect(options.name).toBe(SESSION_COOKIE_NAME);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });

  it("sets Secure only in production", () => {
    expect(sessionCookieOptions(false).secure).toBe(false);
    expect(sessionCookieOptions(true).secure).toBe(true);
  });
});
