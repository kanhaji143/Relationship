import { describe, expect, it } from "vitest";

import { toDiscoveryParticipant } from "./participant";

const validParticipant = {
  uid: "user-1",
  user: { accountStatus: "active" },
  profile: {
    displayName: "Asha",
    birthDate: null,
    countryCode: "IN",
    regionCode: "south",
    languages: ["en-IN"],
    interestIds: ["books"],
    visibility: "visible",
    moderationStatus: "approved",
    createdAt: { toMillis: () => 1_000 },
  },
  preferences: {
    intent: "serious",
    desiredIntents: ["serious"],
    ageMin: 25,
    ageMax: 35,
    preferredRegions: [],
    preferredLanguages: [],
    discoveryPaused: false,
  },
  privateAge: { birthDate: "1990-10-29" },
  blockedUids: [],
};

describe("toDiscoveryParticipant", () => {
  it("normalizes server-owned account, profile, preferences and private age", () => {
    const participant = toDiscoveryParticipant(validParticipant);

    expect(participant?.viewer.uid).toBe("user-1");
    expect(participant?.viewer.intent).toBe("serious");
    expect(participant?.profile.age).toBeGreaterThanOrEqual(18);
    expect(participant?.profile.regionCode).toBe("south");
    expect(participant?.profile.createdAt).toBe(1_000);
    expect("birthDate" in (participant?.profile ?? {})).toBe(false);
  });

  it("rejects missing or invalid private age data", () => {
    expect(
      toDiscoveryParticipant({ ...validParticipant, privateAge: { birthDate: "1990-02-30" } }),
    ).toBeNull();
  });

  it("never treats underage declarations as eligible participants", () => {
    expect(
      toDiscoveryParticipant({ ...validParticipant, privateAge: { birthDate: "2010-10-29" } }),
    ).toBeNull();
  });

  it("keeps pause and block state in the viewer context", () => {
    const participant = toDiscoveryParticipant({
      ...validParticipant,
      preferences: { ...validParticipant.preferences, discoveryPaused: true },
      blockedUids: ["user-2"],
    });

    expect(participant?.viewer.pausedDiscovery).toBe(true);
    expect(participant?.viewer.blockedUids).toEqual(["user-2"]);
  });
});
