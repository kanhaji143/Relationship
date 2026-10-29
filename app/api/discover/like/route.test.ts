import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canonicalMatchId,
  COLLECTIONS,
  conversationDoc,
  preferencesDoc,
  profileDoc,
  userDoc,
  userPrivateDoc,
} from "@/lib/firebase/collections";
import { likeDocumentId } from "@/lib/discovery/like-id";

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

import { POST } from "./route";

type DocData = Record<string, unknown>;
type FakeRef = { path: string };
type FakeQuery = { kind: "query"; collection: string; field: string; value: unknown };
type FakeTarget = FakeRef | FakeQuery;
type FakeBlock = { blockerUid: string; blockedUid: string };

function participantDocuments() {
  const profile = {
    countryCode: "IN",
    regionCode: "south",
    languages: ["en-IN"],
    interestIds: ["books"],
    visibility: "visible",
    moderationStatus: "approved",
    createdAt: { toMillis: () => 1_000 },
  };
  const preferences = {
    intent: "serious",
    desiredIntents: ["serious"],
    ageMin: 18,
    ageMax: 99,
    preferredRegions: [],
    preferredLanguages: [],
    discoveryPaused: false,
  };

  return new Map<string, DocData>([
    [userDoc("viewer"), { accountStatus: "active" }],
    [profileDoc("viewer"), { ...profile, displayName: "Viewer" }],
    [preferencesDoc("viewer"), preferences],
    [userPrivateDoc("viewer", "ageAssurance"), { birthDate: "1990-01-01" }],
    [userDoc("target"), { accountStatus: "active" }],
    [profileDoc("target"), { ...profile, displayName: "Target" }],
    [preferencesDoc("target"), preferences],
    [userPrivateDoc("target", "ageAssurance"), { birthDate: "1992-01-01" }],
  ]);
}

function makeFakeDb(initialDocuments = participantDocuments(), initialBlocks: FakeBlock[] = []) {
  const documents = new Map(initialDocuments);
  const blocks = [...initialBlocks];
  const writes: Array<{ kind: "set" | "create"; path: string; value: DocData }> = [];
  let autoId = 0;

  const snapshot = (path: string) => {
    const data = documents.get(path);
    return {
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
    };
  };

  const db = {
    doc: (path: string): FakeRef => ({ path }),
    collection: (collection: string) => ({
      doc: (id?: string): FakeRef => ({
        path: `${collection}/${id ?? `auto-${++autoId}`}`,
      }),
      where: (field: string, _operator: "==", value: unknown): FakeQuery => ({
        kind: "query",
        collection,
        field,
        value,
      }),
    }),
    runTransaction: async <T>(callback: (transaction: object) => Promise<T>): Promise<T> => {
      const transaction = {
        get: async (target: FakeTarget) => {
          if ("kind" in target) {
            const queryBlocks =
              target.collection === COLLECTIONS.blocks
                ? blocks.filter((block) => block[target.field as keyof FakeBlock] === target.value)
                : [];
            return {
              docs: queryBlocks.map((block, index) => ({
                get: (field: string) => block[field as keyof FakeBlock],
                ref: { path: `${COLLECTIONS.blocks}/block-${index}` },
              })),
            };
          }
          return snapshot(target.path);
        },
        set: (ref: FakeRef, value: DocData) => {
          documents.set(ref.path, { ...documents.get(ref.path), ...value });
          writes.push({ kind: "set", path: ref.path, value });
        },
        create: (ref: FakeRef, value: DocData) => {
          if (documents.has(ref.path)) throw new Error(`already exists: ${ref.path}`);
          documents.set(ref.path, value);
          writes.push({ kind: "create", path: ref.path, value });
        },
      };

      return callback(transaction);
    },
  };

  return { db, documents, writes };
}

function actionRequest(targetUid: string, action: "like" | "pass" = "like") {
  return new Request("http://bondora.test/api/discover/like", {
    method: "POST",
    headers: {
      origin: "http://bondora.test",
      "content-type": "application/json",
    },
    body: JSON.stringify({ targetUid, action }),
  });
}

describe("POST /api/discover/like transaction decisions", () => {
  let fakeDb: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeDb = makeFakeDb();
    mocks.getAdminDb.mockReturnValue(fakeDb.db);
    mocks.getSessionUser.mockResolvedValue({ uid: "viewer", email: null, emailVerified: true });
    mocks.consumeRateLimit.mockReturnValue({ allowed: true });
  });

  it("rejects self-actions before opening a Firestore transaction", async () => {
    const response = await POST(actionRequest("viewer"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "self_action" });
    expect(fakeDb.writes).toHaveLength(0);
  });

  it("returns already_recorded without duplicate writes for the same action", async () => {
    fakeDb.documents.set(`${COLLECTIONS.likes}/${likeDocumentId("viewer", "target")}`, {
      fromUid: "viewer",
      toUid: "target",
      action: "like",
      createdAt: "existing",
    });

    const response = await POST(actionRequest("target"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: "already_recorded" });
    expect(fakeDb.writes).toHaveLength(0);
  });

  it("updates a prior pass to a like and creates a mutual match", async () => {
    const outgoingLikePath = `${COLLECTIONS.likes}/${likeDocumentId("viewer", "target")}`;
    fakeDb.documents.set(outgoingLikePath, {
      fromUid: "viewer",
      toUid: "target",
      action: "pass",
      createdAt: "original-created-at",
    });
    fakeDb.documents.set(`${COLLECTIONS.likes}/${likeDocumentId("target", "viewer")}`, {
      fromUid: "target",
      toUid: "viewer",
      action: "like",
    });

    const response = await POST(actionRequest("target", "like"));
    const result = await response.json();
    const updatedLike = fakeDb.documents.get(outgoingLikePath);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true, status: "updated", matched: true });
    expect(updatedLike).toMatchObject({
      action: "like",
      createdAt: "original-created-at",
      fromUid: "viewer",
      toUid: "target",
    });
    expect(
      fakeDb.documents.has(`${COLLECTIONS.matches}/${canonicalMatchId("viewer", "target")}`),
    ).toBe(true);
  });

  it.each([
    ["viewer blocks target", { blockerUid: "viewer", blockedUid: "target" }],
    ["target blocks viewer", { blockerUid: "target", blockedUid: "viewer" }],
  ])("rejects a pair when %s", async (_description, block) => {
    fakeDb = makeFakeDb(participantDocuments(), [block]);
    mocks.getAdminDb.mockReturnValue(fakeDb.db);

    const response = await POST(actionRequest("target"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "target_not_found" });
    expect(fakeDb.writes).toHaveLength(0);
  });

  it("rejects a pair when reciprocal intent preferences do not match", async () => {
    fakeDb.documents.set(preferencesDoc("target"), {
      ...fakeDb.documents.get(preferencesDoc("target")),
      desiredIntents: ["casual"],
    });

    const response = await POST(actionRequest("target"));

    expect(response.status).toBe(404);
    expect(fakeDb.writes).toHaveLength(0);
  });

  it("atomically records a reciprocal like, canonical match, conversation and audit", async () => {
    const reverseLikeId = likeDocumentId("target", "viewer");
    fakeDb.documents.set(`${COLLECTIONS.likes}/${reverseLikeId}`, {
      fromUid: "target",
      toUid: "viewer",
      action: "like",
    });

    const response = await POST(actionRequest("target"));
    const result = await response.json();
    const matchId = canonicalMatchId("viewer", "target");
    const match = fakeDb.documents.get(`${COLLECTIONS.matches}/${matchId}`);
    const conversation = fakeDb.documents.get(conversationDoc(matchId));
    const auditWrites = fakeDb.writes.filter((write) =>
      write.path.startsWith(`${COLLECTIONS.auditLogs}/`),
    );

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true, status: "recorded", matched: true });
    expect(match).toMatchObject({
      userA: "target",
      userB: "viewer",
      status: "active",
    });
    expect(conversation).toMatchObject({
      participantUids: ["target", "viewer"],
      status: "active",
    });
    expect(auditWrites).toHaveLength(1);
    expect(auditWrites[0]?.value).toMatchObject({
      action: "discover.like",
      targetId: "target",
      metadata: { matched: true },
    });
    expect(
      fakeDb.documents.get(`${COLLECTIONS.likes}/${likeDocumentId("viewer", "target")}`),
    ).toMatchObject({ action: "like", fromUid: "viewer", toUid: "target" });
  });
});
