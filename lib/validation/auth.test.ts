import { describe, expect, it } from "vitest";

import {
  authSignupSchema,
  emailSchema,
  forgotPasswordSchema,
  isAdultBirthDate,
  isPlausibleBirthDate,
  normalizeEmail,
  signupSchema,
} from "./auth";

const validSignup = {
  email: "Asha@Example.com",
  password: "correct-horse-battery",
  displayName: "Asha",
  birthDate: "1997-04-12",
  intent: "serious" as const,
  locale: "en-IN",
  acceptedTerms: true as const,
  acceptedPrivacy: true as const,
  policyVersion: "2026-10-01",
};

const now = new Date("2026-10-27T12:00:00.000Z");

describe("emailSchema", () => {
  it("normalizes case and whitespace", () => {
    expect(emailSchema.parse("  Asha.P@Example.COM ")).toBe("asha.p@example.com");
    expect(normalizeEmail(" A@B.CO ")).toBe("a@b.co");
  });

  it("rejects malformed addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("a@b").success).toBe(false);
  });
});

describe("age gate", () => {
  it("accepts someone whose 18th birthday is today (UTC)", () => {
    expect(isAdultBirthDate("2008-10-27", now)).toBe(true);
  });

  it("rejects someone one day short of 18", () => {
    expect(isAdultBirthDate("2008-10-28", now)).toBe(false);
  });

  it("handles leap-day birthdays", () => {
    expect(isAdultBirthDate("2008-02-29", new Date("2026-02-28T00:00:00Z"))).toBe(false);
    expect(isAdultBirthDate("2008-02-29", new Date("2026-03-01T00:00:00Z"))).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(isAdultBirthDate("1990-02-30", now)).toBe(false);
    expect(isPlausibleBirthDate("1990-02-30", now)).toBe(false);
  });

  it("rejects implausibly old dates", () => {
    expect(isPlausibleBirthDate("1850-01-01", now)).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid adult signup and normalizes the email", () => {
    const result = signupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("asha@example.com");
  });

  it("blocks minors", () => {
    const result = signupSchema.safeParse({ ...validSignup, birthDate: "2012-01-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("birthDate"))).toBe(true);
    }
  });

  it("requires explicit terms and privacy consent", () => {
    expect(signupSchema.safeParse({ ...validSignup, acceptedTerms: false }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, acceptedPrivacy: false }).success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = signupSchema.safeParse({ ...validSignup, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects passwords containing the email local part", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "asha-is-my-name-123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("password"))).toBe(true);
    }
  });

  it("rejects markup characters in display names", () => {
    expect(signupSchema.safeParse({ ...validSignup, displayName: "<script>" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, displayName: "A" }).success).toBe(false);
  });

  it("accepts names in non-Latin scripts", () => {
    expect(signupSchema.safeParse({ ...validSignup, displayName: "आशा" }).success).toBe(true);
  });
});

describe("authSignupSchema", () => {
  const valid = {
    adultConfirmed: true as const,
    acceptedTerms: true as const,
    acceptedPrivacy: true as const,
    locale: "en-IN",
    policyVersion: "2026-10-28",
  };

  it("accepts consents for an adult", () => {
    expect(authSignupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the 18+ confirmation", () => {
    expect(authSignupSchema.safeParse({ ...valid, adultConfirmed: false }).success).toBe(false);
  });

  it("requires both policies", () => {
    expect(authSignupSchema.safeParse({ ...valid, acceptedTerms: false }).success).toBe(false);
    expect(authSignupSchema.safeParse({ ...valid, acceptedPrivacy: false }).success).toBe(false);
  });

  it("rejects an empty policy version", () => {
    expect(authSignupSchema.safeParse({ ...valid, policyVersion: "" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("normalizes the email", () => {
    const result = forgotPasswordSchema.safeParse({ email: " Asha@Example.COM " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("asha@example.com");
  });

  it("rejects invalid emails", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
