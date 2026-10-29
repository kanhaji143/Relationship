import { describe, expect, it } from "vitest";

import { buildCandidateFeed, type CandidateSource } from "./build-feed";
import { toDiscoveryParticipant } from "./participant";

function source(
  uid: string,
  options: {
    birthDate?: string;
    intent?: "serious" | "casual";
    desiredIntents?: ("serious" | "casual")[];
    ageMin?: number;
    ageMax?: number;
    regionCode?: string | null;
    preferredRegions?: string[];
    preferredLanguages?: string[];
    languages?: string[];
    interestIds?: string[];
    promptKeys?: string[];
    createdAt?: number;
    blockedUids?: string[];
  } = {},
): CandidateSource {
  const intent = options.intent ?? "serious";
  const participant = toDiscoveryParticipant({
    uid,
    user: { accountStatus: "active" },
    profile: {
      countryCode: "IN",
      regionCode: options.regionCode === undefined ? "south" : options.regionCode,
      languages: options.languages ?? ["en-IN"],
      interestIds: options.interestIds ?? ["books"],
      visibility: "visible",
      moderationStatus: "approved",
      createdAt: { toMillis: () => options.createdAt ?? 1_000 },
    },
    preferences: {
      intent,
      desiredIntents: options.desiredIntents ?? ["serious"],
      ageMin: options.ageMin ?? 18,
      ageMax: options.ageMax ?? 99,
      preferredRegions: options.preferredRegions ?? [],
      preferredLanguages: options.preferredLanguages ?? [],
      discoveryPaused: false,
    },
    privateAge: { birthDate: options.birthDate ?? "1992-01-01" },
    blockedUids: options.blockedUids ?? [],
  });

  if (!participant) throw new Error(`test participant ${uid} is invalid`);
  return {
    participant,
    displayName: uid,
    bio: `Bio for ${uid}`,
    broadLocationLabel: "Southern India",
    promptKeys: options.promptKeys ?? [],
  };
}

const viewer = source("viewer", {
  birthDate: "1990-01-01",
  ageMin: 25,
  ageMax: 40,
  preferredLanguages: ["en-IN"],
  interestIds: ["books", "food"],
  promptKeys: ["weekend"],
});

describe("buildCandidateFeed", () => {
  it("filters seen/ineligible people and returns only public cards", () => {
    const blockedViewer = source("viewer", {
      birthDate: "1990-01-01",
      ageMin: 25,
      ageMax: 40,
      preferredLanguages: ["en-IN"],
      interestIds: ["books", "food"],
      blockedUids: ["blocked"],
    }).participant;

    const feed = buildCandidateFeed(
      blockedViewer,
      [
        source("visible"),
        source("blocked"),
        source("seen"),
        source("wrong-intent", { intent: "casual" }),
      ],
      new Set(["seen"]),
      new Set(),
      2_000,
    );

    expect(feed.map((candidate) => candidate.uid)).toEqual(["visible"]);
    expect(feed[0]).not.toHaveProperty("birthDate");
    expect(feed[0]).not.toHaveProperty("privateAge");
  });

  it("requires reciprocal age, region and language compatibility", () => {
    const candidates = [
      source("good", { birthDate: "1992-01-01", preferredRegions: ["south"] }),
      source("age-excluded", { birthDate: "2005-01-01" }),
      source("region-excluded", { preferredRegions: ["north"] }),
      source("language-excluded", { preferredLanguages: ["hi-IN"] }),
    ];

    const feed = buildCandidateFeed(viewer.participant, candidates, new Set(), new Set(), 2_000);

    expect(feed.map((candidate) => candidate.uid)).toEqual(["good"]);
  });

  it("ranks by weighted score and uses UID as a deterministic tie-breaker", () => {
    const candidates = [
      source("z-strong", {
        interestIds: ["books", "food"],
        promptKeys: ["weekend"],
      }),
      source("a-strong", {
        interestIds: ["books", "food"],
        promptKeys: ["weekend"],
      }),
      source("weak", {
        interestIds: ["music"],
        promptKeys: ["travel"],
        createdAt: 1,
      }),
    ];

    const feed = buildCandidateFeed(
      viewer.participant,
      candidates,
      new Set(),
      new Set(["weekend"]),
      2_000,
    );

    expect(feed.map((candidate) => candidate.uid)).toEqual(["a-strong", "z-strong", "weak"]);
    expect(feed[0]?.score).toBeGreaterThan(feed[2]?.score ?? 0);
  });
});
