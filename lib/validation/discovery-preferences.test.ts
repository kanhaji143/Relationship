import { describe, expect, it } from "vitest";

import { discoveryPreferencesSchema } from "./discovery-preferences";

const valid = {
  ageMin: 24,
  ageMax: 38,
  desiredIntents: ["serious", "casual"] as const,
  preferredRegions: ["south", "west"],
  preferredLanguages: ["en-IN", "hi-IN"],
  discoveryPaused: false,
};

describe("discoveryPreferencesSchema", () => {
  it("accepts bounded, listed discovery filters", () => {
    expect(discoveryPreferencesSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the age range to stay between 18 and 99 and in order", () => {
    expect(discoveryPreferencesSchema.safeParse({ ...valid, ageMin: 17 }).success).toBe(false);
    expect(discoveryPreferencesSchema.safeParse({ ...valid, ageMax: 100 }).success).toBe(false);
    expect(discoveryPreferencesSchema.safeParse({ ...valid, ageMin: 39, ageMax: 38 }).success).toBe(
      false,
    );
  });

  it("requires at least one compatible intent and rejects duplicate values", () => {
    expect(discoveryPreferencesSchema.safeParse({ ...valid, desiredIntents: [] }).success).toBe(
      false,
    );
    expect(
      discoveryPreferencesSchema.safeParse({ ...valid, desiredIntents: ["serious", "serious"] })
        .success,
    ).toBe(false);
  });

  it("rejects regions/languages outside allow-lists and duplicates", () => {
    expect(
      discoveryPreferencesSchema.safeParse({ ...valid, preferredRegions: ["Mumbai"] }).success,
    ).toBe(false);
    expect(
      discoveryPreferencesSchema.safeParse({ ...valid, preferredLanguages: ["xx-XX"] }).success,
    ).toBe(false);
    expect(
      discoveryPreferencesSchema.safeParse({ ...valid, preferredRegions: ["south", "south"] })
        .success,
    ).toBe(false);
  });

  it("allows empty optional region and language preferences", () => {
    expect(
      discoveryPreferencesSchema.safeParse({
        ...valid,
        preferredRegions: [],
        preferredLanguages: [],
      }).success,
    ).toBe(true);
  });
});
