import { describe, expect, it } from "vitest";

import { emailLookupKey } from "./hash";

describe("emailLookupKey", () => {
  it("is deterministic and case-insensitive", () => {
    expect(emailLookupKey(" Asha@Example.com ")).toBe(emailLookupKey("asha@example.com"));
  });

  it("does not expose the raw email", () => {
    const key = emailLookupKey("asha@example.com");
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain("asha");
  });

  it("differs for different addresses", () => {
    expect(emailLookupKey("a@example.com")).not.toBe(emailLookupKey("b@example.com"));
  });
});
