import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";

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

import { GET as getCandidates } from "./candidates/route";
import { POST as recordLike } from "./like/route";

const PROJECT_ID = "demo-bondora";

function makeUid(label: string): string {
  return `phase2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}`;
}

function requestLike(targetUid: string, action: "like" | "pass" = "like") {
  return new Request("http://localhost:3000/api/discover/like", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify({ targetUid, action }),
  });
}

describe("Phase 2 route behavior against local Firebase emulators", () => {
  let app: App;
  let db: Firestore;
  let createdPaths: string[];
  let actorUids: string[];

  beforeAll(() => {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    if (!emulatorHost) {
      throw new Error(
        "FIRESTORE_EMULATOR_HOST is required; this suite must never target live Firestore.",
      );
    }

    app = initializeApp({ projectId: PROJECT_ID }, `phase2-emulator-${process.pid}`);
    db = getFirestore(app);
    mocks.getAdminDb.mockReturnValue(db);
  });

  beforeEach(() => {
    createdPaths = [];
    actorUids = [];
    mocks.consumeRateLimit.mockReturnValue({ allowed: true });
  });

  afterEach(async () => {
    if (actorUids.length > 0) {
      const auditDocs = await db
        .collection(COLLECTIONS.auditLogs)
        .where("actorUid", "in", actorUids)
        .get();
      createdPaths.push(...auditDocs.docs.map((document) => document.ref.path));
    }

    for (const path of [...new Set(createdPaths)]) {
      await db.doc(path).delete();
    }
  });

  afterAll(async () => {
    if (db) await db.terminate();
    if (app) await deleteApp(app);
  });

  async function seedParticipant(uid: string, birthDate: string) {
    const records = [
      [userDoc(uid), { uid, accountStatus: "active" }],
      [
        profileDoc(uid),
        {
          uid,
          displayName: uid,
          bio: "Fictional emulator fixture",
          countryCode: "IN",
          regionCode: "south",
          broadLocationLabel: "Southern India",
          languages: ["en-IN"],
          interestIds: ["books"],
          birthDate: null,
          visibility: "visible",
          moderationStatus: "approved",
          createdAt: Timestamp.now(),
        },
      ],
      [
        preferencesDoc(uid),
        {
          uid,
          intent: "serious",
          desiredIntents: ["serious"],
          ageMin: 18,
          ageMax: 99,
          preferredRegions: [],
          preferredLanguages: [],
          discoveryPaused: false,
        },
      ],
      [userPrivateDoc(uid, "ageAssurance"), { birthDate, updatedAt: FieldValue.serverTimestamp() }],
    ] as const;

    for (const [path, data] of records) {
      await db.doc(path).set(data);
      createdPaths.push(path);
    }
  }

  it("writes one canonical match, conversation and audit for mutual likes", async () => {
    const viewerUid = makeUid("viewer");
    const targetUid = makeUid("target");
    actorUids.push(viewerUid);
    await seedParticipant(viewerUid, "1990-01-01");
    await seedParticipant(targetUid, "1992-01-01");

    const reverseLikePath = `${COLLECTIONS.likes}/${likeDocumentId(targetUid, viewerUid)}`;
    const outgoingLikePath = `${COLLECTIONS.likes}/${likeDocumentId(viewerUid, targetUid)}`;
    const matchId = canonicalMatchId(viewerUid, targetUid);
    createdPaths.push(
      reverseLikePath,
      outgoingLikePath,
      `${COLLECTIONS.matches}/${matchId}`,
      conversationDoc(matchId),
    );
    await db.doc(reverseLikePath).set({
      fromUid: targetUid,
      toUid: viewerUid,
      action: "like",
      createdAt: FieldValue.serverTimestamp(),
    });

    mocks.getSessionUser.mockResolvedValue({ uid: viewerUid, email: null, emailVerified: true });
    const response = await recordLike(requestLike(targetUid));
    const responseBody = await response.json();
    const match = await db.doc(`${COLLECTIONS.matches}/${matchId}`).get();
    const conversation = await db.doc(conversationDoc(matchId)).get();
    const audit = await db
      .collection(COLLECTIONS.auditLogs)
      .where("actorUid", "==", viewerUid)
      .get();

    expect(response.status).toBe(200);
    expect(responseBody).toMatchObject({ ok: true, status: "recorded", matched: true });
    expect(match.data()).toMatchObject({ status: "active" });
    expect(conversation.data()).toMatchObject({
      status: "active",
      participantUids: [match.data()?.userA, match.data()?.userB],
    });
    expect(audit.docs).toHaveLength(1);
    expect(audit.docs[0]?.get("metadata")).toEqual({ matched: true });

    const retry = await recordLike(requestLike(targetUid));
    expect(await retry.json()).toMatchObject({
      ok: true,
      status: "already_recorded",
      matched: true,
    });
    const matchRetry = await db.doc(`${COLLECTIONS.matches}/${matchId}`).get();
    expect(matchRetry.exists).toBe(true);
  });

  it("returns only public candidate cards and excludes both directions of a block", async () => {
    const viewerUid = makeUid("candidate-viewer");
    const blockedByViewerUid = makeUid("blocked-by-viewer");
    const blockedViewerUid = makeUid("blocked-viewer");
    actorUids.push(viewerUid);
    await seedParticipant(viewerUid, "1990-01-01");
    await seedParticipant(blockedByViewerUid, "1992-01-01");
    await seedParticipant(blockedViewerUid, "1992-01-01");

    const outgoingBlockPath = `${COLLECTIONS.blocks}/${makeUid("outgoing-block")}`;
    const incomingBlockPath = `${COLLECTIONS.blocks}/${makeUid("incoming-block")}`;
    createdPaths.push(outgoingBlockPath, incomingBlockPath);
    await db.doc(outgoingBlockPath).set({
      blockerUid: viewerUid,
      blockedUid: blockedByViewerUid,
    });
    await db.doc(incomingBlockPath).set({
      blockerUid: blockedViewerUid,
      blockedUid: viewerUid,
    });

    mocks.getSessionUser.mockResolvedValue({ uid: viewerUid, email: null, emailVerified: true });
    const blockedResponse = await getCandidates();
    expect(blockedResponse.status).toBe(200);
    expect((await blockedResponse.json()).candidates).toEqual([]);

    await db.doc(outgoingBlockPath).delete();
    await db.doc(incomingBlockPath).delete();
    createdPaths = createdPaths.filter(
      (path) => path !== outgoingBlockPath && path !== incomingBlockPath,
    );
    const candidateResponse = await getCandidates();
    const body = await candidateResponse.json();
    const candidateUids = body.candidates.map((item: { uid: string }) => item.uid);

    expect(candidateResponse.status).toBe(200);
    expect(candidateUids).toEqual(expect.arrayContaining([blockedByViewerUid, blockedViewerUid]));
    for (const candidate of body.candidates) {
      expect(candidate.age).toBeGreaterThanOrEqual(18);
      expect(candidate).not.toHaveProperty("birthDate");
      expect(candidate).not.toHaveProperty("privateAge");
    }
  });

  it("refuses to record a like when either user has blocked the other", async () => {
    const viewerUid = makeUid("like-viewer");
    const targetUid = makeUid("like-target");
    actorUids.push(viewerUid);
    await seedParticipant(viewerUid, "1990-01-01");
    await seedParticipant(targetUid, "1992-01-01");

    const blockPath = `${COLLECTIONS.blocks}/${makeUid("like-block")}`;
    createdPaths.push(blockPath);
    await db.doc(blockPath).set({ blockerUid: targetUid, blockedUid: viewerUid });
    mocks.getSessionUser.mockResolvedValue({ uid: viewerUid, email: null, emailVerified: true });

    const response = await recordLike(requestLike(targetUid));
    const likePath = `${COLLECTIONS.likes}/${likeDocumentId(viewerUid, targetUid)}`;
    const matchPath = `${COLLECTIONS.matches}/${canonicalMatchId(viewerUid, targetUid)}`;

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("target_not_found");
    expect((await db.doc(likePath).get()).exists).toBe(false);
    expect((await db.doc(matchPath).get()).exists).toBe(false);
  });
});
