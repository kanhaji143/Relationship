import { describe, expect, it } from "vitest";

import { areMutuallyEligible, filterEligible, isEligible } from "./eligibility";

const viewer = {
  uid: "viewer-1",
  accountStatus: "active" as const,
  intent: "serious" as const,
  desiredIntents: ["serious"] as ("serious" | "casual")[],
  ageMin: 25,
  ageMax: 35,
  preferredRegions: [] as string[],
  preferredLanguages: [] as string[],
  blockedUids: ["blocked-1"] as string[],
  pausedDiscovery: false,
};

const baseCandidate = {
  uid: "candidate-1",
  accountStatus: "active" as const,
  age: 28,
  intent: "serious" as const,
  countryCode: "IN",
  regionCode: "south",
  languages: ["en-IN"],
  interestIds: ["books", "food"],
  visibility: "visible" as const,
  moderationStatus: "approved" as const,
  discoveryPaused: false,
  createdAt: Date.now(),
};

describe("isEligible", () => {
  it("accepts a compatible candidate", () => {
    expect(isEligible(viewer, baseCandidate).eligible).toBe(true);
  });

  it("rejects self", () => {
    expect(isEligible(viewer, { ...baseCandidate, uid: "viewer-1" }).reason).toBe("self");
  });

  it("rejects blocked pairs", () => {
    expect(isEligible(viewer, { ...baseCandidate, uid: "blocked-1" }).reason).toBe("blocked");
  });

  it("rejects inactive, hidden or unapproved profiles", () => {
    expect(isEligible(viewer, { ...baseCandidate, accountStatus: "suspended" }).eligible).toBe(
      false,
    );
    expect(isEligible(viewer, { ...baseCandidate, visibility: "hidden" }).eligible).toBe(false);
    expect(isEligible(viewer, { ...baseCandidate, moderationStatus: "pending" }).eligible).toBe(
      false,
    );
  });

  it("rejects paused discovery on either side", () => {
    expect(isEligible(viewer, { ...baseCandidate, discoveryPaused: true }).reason).toBe(
      "candidate_paused",
    );
    expect(isEligible({ ...viewer, pausedDiscovery: true }, baseCandidate).reason).toBe(
      "viewer_paused",
    );
  });

  it("rejects intent mismatch", () => {
    expect(isEligible(viewer, { ...baseCandidate, intent: "casual" }).reason).toBe(
      "intent_mismatch",
    );
  });

  it("rejects ages outside the viewer range", () => {
    expect(isEligible(viewer, { ...baseCandidate, age: 24 }).reason).toBe("age_out_of_range");
    expect(isEligible(viewer, { ...baseCandidate, age: 36 }).reason).toBe("age_out_of_range");
  });

  it("applies region and language preferences when set", () => {
    const regionalViewer = {
      ...viewer,
      preferredRegions: ["north"],
      preferredLanguages: ["hi-IN"],
    };
    expect(isEligible(regionalViewer, baseCandidate).reason).toBe("region_mismatch");
    const languageCandidate = { ...baseCandidate, regionCode: "north", languages: ["ta-IN"] };
    expect(
      isEligible({ ...regionalViewer, preferredRegions: ["south"] }, languageCandidate).reason,
    ).toBe("region_mismatch");
    expect(
      isEligible(regionalViewer, { ...baseCandidate, regionCode: "north", languages: ["hi-IN"] })
        .eligible,
    ).toBe(true);
  });

  it("allows any region/language when preferences are empty", () => {
    expect(
      isEligible(viewer, { ...baseCandidate, regionCode: "north", languages: ["ta-IN"] }).eligible,
    ).toBe(true);
  });

  it("rejects unknown regions when the viewer selected region preferences", () => {
    expect(
      isEligible({ ...viewer, preferredRegions: ["south"] }, { ...baseCandidate, regionCode: null })
        .reason,
    ).toBe("region_mismatch");
  });

  it("filters a mixed candidate list", () => {
    const candidates = [
      baseCandidate,
      { ...baseCandidate, uid: "blocked-1" },
      { ...baseCandidate, uid: "candidate-2", age: 20 },
    ];
    expect(filterEligible(viewer, candidates)).toHaveLength(1);
  });
});

describe("areMutuallyEligible", () => {
  const viewerProfile = {
    ...baseCandidate,
    uid: viewer.uid,
    age: 30,
  };
  const candidateViewer = {
    ...viewer,
    uid: baseCandidate.uid,
    intent: "serious" as const,
    desiredIntents: ["serious"] as ("serious" | "casual")[],
    ageMin: 25,
    ageMax: 35,
  };

  it("accepts a pair when both sides are compatible", () => {
    expect(
      areMutuallyEligible(viewer, baseCandidate, candidateViewer, viewerProfile).eligible,
    ).toBe(true);
  });

  it("rejects a pair when the candidate's preferences exclude the viewer", () => {
    const restrictiveCandidate = {
      ...candidateViewer,
      desiredIntents: ["casual"] as ("serious" | "casual")[],
    };
    expect(
      areMutuallyEligible(viewer, baseCandidate, restrictiveCandidate, viewerProfile).eligible,
    ).toBe(false);
  });
});
