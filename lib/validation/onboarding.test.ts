import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

const valid = {
  displayName: "Asha",
  birthDate: "1997-04-12",
  intent: "serious" as const,
  region: "south",
  languages: ["en-IN", "hi-IN"],
  bio: "Books, filter coffee and long walks.",
  interestIds: ["books", "food", "nature"],
  countryCode: "IN" as const,
};

describe("onboardingSchema", () => {
  it("accepts a valid adult profile", () => {
    const result = onboardingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects under-18 birth dates", () => {
    const result = onboardingSchema.safeParse({ ...valid, birthDate: "2015-01-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("birthDate"))).toBe(true);
    }
  });

  it("rejects impossible birth dates", () => {
    expect(onboardingSchema.safeParse({ ...valid, birthDate: "1997-02-30" }).success).toBe(false);
  });

  it("requires 3–8 interests", () => {
    expect(onboardingSchema.safeParse({ ...valid, interestIds: ["books"] }).success).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...valid,
        interestIds: [
          "books",
          "food",
          "nature",
          "music",
          "films",
          "travel",
          "fitness",
          "art",
          "gaming",
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects unlisted interests and duplicate picks", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, interestIds: ["books", "food", "crypto"] }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...valid, interestIds: ["books", "books", "food"] }).success,
    ).toBe(false);
  });

  it("requires 1–4 listed languages", () => {
    expect(onboardingSchema.safeParse({ ...valid, languages: [] }).success).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...valid,
        languages: ["en-IN", "hi-IN", "ta-IN", "te-IN", "bn-IN"],
      }).success,
    ).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, languages: ["xx-XX"] }).success).toBe(false);
  });

  it("only allows India for the MVP", () => {
    expect(onboardingSchema.safeParse({ ...valid, countryCode: "US" }).success).toBe(false);
  });

  it("rejects markup and overlong bios", () => {
    expect(onboardingSchema.safeParse({ ...valid, bio: "<script>alert(1)</script>" }).success).toBe(
      false,
    );
    expect(onboardingSchema.safeParse({ ...valid, bio: "a".repeat(301) }).success).toBe(false);
  });

  it("rejects markup in display names", () => {
    expect(onboardingSchema.safeParse({ ...valid, displayName: "<b>Asha</b>" }).success).toBe(
      false,
    );
  });

  it("defaults a missing region and bio", () => {
    const result = onboardingSchema.safeParse({
      ...valid,
      region: undefined,
      bio: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.region).toBeNull();
      expect(result.data.bio).toBe("");
    }
  });
});
