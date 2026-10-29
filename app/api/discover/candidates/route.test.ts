import { beforeEach, describe, expect, it, vi } from "vitest";

import { preferencesDoc, profileDoc, userDoc, userPrivateDoc } from "@/lib/firebase/collections";

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  getSessionUser: vi.fn(),
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/lib/firebase/admin/app", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/session", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/lib/rate-limit/fixed-window", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));

import { GET } from "./route";

type DocData = Record<string, unknown>;
type Filter = { field: string; operator: "==" | "in"; value: unknown };
type FakeRef = { path: string };
type FakeQuery = {
  collection: string;
  filters: Filter[];
  maxResults?: number;
};

function profile(displayName: string, interestIds: string[], createdAt: number): DocData {
  return {
    displayName,
    bio: `${displayName} bio`,
    countryCode: "IN",
    regionCode: "south",
    broadLocationLabel: "Southern India",
    languages: ["en-IN"],
    interestIds,
    birthDate: null,
    visibility: "visible",
    moderationStatus: "approved",
    createdAt: { toMillis: () => createdAt },
  };
}

function preferences(overrides: DocData = {}): DocData {
  return {
    intent: "serious",
    desiredIntents: ["serious"],
    ageMin: 18,
    ageMax: 99,
    preferredRegions: [],
    preferredLanguages: [],
    discoveryPaused: false,
    ...overrides,
  };
}

function baseDocuments(): Map<string, DocData> {
  return new Map([
    [userDoc("viewer"), { accountStatus: "active" }],
    [profileDoc("viewer"), profile("Viewer", ["books", "food"], 1_000)],
    [
      preferencesDoc("viewer"),
      preferences({ ageMin: 25, ageMax: 40, preferredLanguages: ["en-IN"] }),
    ],
    [userPrivateDoc("viewer", "ageAssurance"), { birthDate: "1990-01-01" }],
    [userDoc("candidate-a"), { accountStatus: "active" }],
    [profileDoc("candidate-a"), profile("Candidate A", ["books", "food"], 1_000)],
    [preferencesDoc("candidate-a"), preferences()],
    [userPrivateDoc("candidate-a", "ageAssurance"), { birthDate: "1992-01-01" }],
    [userDoc("candidate-b"), { accountStatus: "active" }],
    [profileDoc("candidate-b"), profile("Candidate B", ["music"], 1_000)],
    [preferencesDoc("candidate-b"), preferences()],
    [userPrivateDoc("candidate-b", "ageAssurance"), { birthDate: "1992-01-01" }],
    [
      "prompts/viewer-prompt",
      { uid: "viewer", promptKey: "weekend", moderationStatus: "approved" },
    ],
    [
      "prompts/candidate-a-prompt",
      { uid: "candidate-a", promptKey: "weekend", moderationStatus: "approved" },
    ],
  ]);
}

function makeFakeDb(documents = baseDocuments()) {
  const snapshot = (path: string) => {
    const data = documents.get(path);
    return {
      id: path.split("/").at(-1),
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
    };
  };

  const query = (spec: FakeQuery) => ({
    where: (field: string, operator: Filter["operator"], value: unknown) =>
      query({ ...spec, filters: [...spec.filters, { field, operator, value }] }),
    limit: (maxResults: number) => query({ ...spec, maxResults }),
    get: async () => {
      const prefix = `${spec.collection}/`;
      const docs = [...documents.keys()]
        .filter((path) => path.startsWith(prefix))
        .filter((path) => {
          const data = documents.get(path)!;
          return spec.filters.every(({ field, operator, value }) => {
            if (operator === "in") return Array.isArray(value) && value.includes(data[field]);
            return data[field] === value;
          });
        })
        .slice(0, spec.maxResults);
      return { docs: docs.map(snapshot) };
    },
  });

  return {
    doc: (path: string): FakeRef & { get: () => Promise<ReturnType<typeof snapshot>> } => ({
      path,
      get: async () => snapshot(path),
    }),
    collection: (collectionName: string) => ({
      where: (field: string, operator: Filter["operator"], value: unknown) =>
        query({ collection: collectionName, filters: [{ field, operator, value }] }),
    }),
    getAll: async (...refs: FakeRef[]) => refs.map((ref) => snapshot(ref.path)),
  };
}

describe("GET /api/discover/candidates mapping", () => {
  let documents: Map<string, DocData>;
  let fakeDb: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    documents = baseDocuments();
    fakeDb = makeFakeDb(documents);
    mocks.getAdminDb.mockReturnValue(fakeDb);
    mocks.getSessionUser.mockResolvedValue({ uid: "viewer", email: null, emailVerified: true });
    mocks.consumeRateLimit.mockReturnValue({ allowed: true });
  });

  it("returns ranked public cards with age derived from private DOB", async () => {
    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.candidates.map((candidate: { uid: string }) => candidate.uid)).toEqual([
      "candidate-a",
      "candidate-b",
    ]);
    expect(result.candidates[0]).toMatchObject({
      uid: "candidate-a",
      displayName: "Candidate A",
      intent: "serious",
      broadLocationLabel: "Southern India",
      interestIds: ["books", "food"],
    });
    expect(result.candidates[0].age).toBeGreaterThanOrEqual(18);
    expect(result.candidates[0]).not.toHaveProperty("birthDate");
    expect(result.candidates[0]).not.toHaveProperty("privateAge");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("excludes incoming/outgoing blocks and prior passes from the feed", async () => {
    documents.set("blocks/viewer-block", { blockerUid: "viewer", blockedUid: "candidate-a" });
    documents.set("blocks/incoming-block", { blockerUid: "candidate-b", blockedUid: "viewer" });
    documents.set("likes/previous-pass", {
      fromUid: "viewer",
      toUid: "candidate-b",
      action: "pass",
    });

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.candidates).toEqual([]);
  });

  it("filters inactive accounts, paused profiles and non-reciprocal preferences", async () => {
    documents.set(userDoc("candidate-a"), { accountStatus: "suspended" });
    documents.set(preferencesDoc("candidate-b"), preferences({ discoveryPaused: true }));
    documents.set(userDoc("candidate-c"), { accountStatus: "active" });
    documents.set(profileDoc("candidate-c"), profile("Candidate C", ["books"], 1_000));
    documents.set(preferencesDoc("candidate-c"), preferences({ desiredIntents: ["casual"] }));
    documents.set(userPrivateDoc("candidate-c", "ageAssurance"), { birthDate: "1992-01-01" });

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.candidates).toEqual([]);
  });
});
