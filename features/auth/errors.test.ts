import { describe, expect, it } from "vitest";

import { authErrorMessage, firebaseErrorCode } from "./errors";
import { registrationErrorMessage, sessionErrorMessage } from "./session-error";

describe("authErrorMessage", () => {
  it("maps known Firebase error codes", () => {
    expect(authErrorMessage("auth/invalid-credential")).toBe("Email or password is incorrect.");
  });

  it("falls back to a generic message without leaking details", () => {
    expect(authErrorMessage("auth/unknown-code")).toBe("Something went wrong. Please try again.");
    expect(authErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});

describe("firebaseErrorCode", () => {
  it("extracts a string code", () => {
    expect(firebaseErrorCode({ code: "auth/too-many-requests" })).toBe("auth/too-many-requests");
  });

  it("returns undefined for non-errors", () => {
    expect(firebaseErrorCode(null)).toBeUndefined();
    expect(firebaseErrorCode("boom")).toBeUndefined();
    expect(firebaseErrorCode({ code: 42 })).toBeUndefined();
  });
});

describe("sessionErrorMessage", () => {
  it("explains missing server configuration", () => {
    expect(sessionErrorMessage(503)).toContain("not configured");
  });

  it("explains rate limiting", () => {
    expect(sessionErrorMessage(429)).toContain("Too many attempts");
  });

  it("falls back for unknown statuses", () => {
    expect(sessionErrorMessage(500)).toBe("Could not start your session. Please try again.");
  });
});

describe("registrationErrorMessage", () => {
  it("keeps the account-created caveat for server failures", () => {
    expect(registrationErrorMessage(503)).toContain("Firebase account was created");
  });

  it("asks the user to sign in again after an expired token", () => {
    expect(registrationErrorMessage(401)).toContain("Sign in again");
  });
});
