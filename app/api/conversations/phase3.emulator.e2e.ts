import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";

import { COLLECTIONS, conversationDoc, profileDoc, userDoc } from "@/lib/firebase/collections";
import { blockDocumentId } from "@/lib/safety/blocks";

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

import { GET as listConversations } from "./route";
import { GET as readMessages, POST as sendMessage } from "./[conversationId]/messages/route";
import { POST as unmatch } from "../matches/[matchId]/unmatch/route";
import { POST as block } from "../blocks/route";

const PROJECT_ID = "demo-bondora";
const ORIGIN = "http://localhost:3000";

function makeUid(label: string): string {
  return `phase3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}`;
}

function post(body?: unknown): Request {
  return new Request(`${ORIGIN}/api`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("Phase 3 chat and safety routes against local Firebase emulators", () => {
  let app: App;
  let db: Firestore;
  let alice: string;
  let bob: string;
  let carol: string;
  let matchId: string;

  beforeAll(() => {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      throw new Error(
        "FIRESTORE_EMULATOR_HOST is required; this suite must never target live Firestore.",
      );
    }
    app = initializeApp({ projectId: PROJECT_ID }, `phase3-emulator-${process.pid}`);
    db = getFirestore(app);
    mocks.getAdminDb.mockReturnValue(db);
  });

  beforeEach(async () => {
    alice = makeUid("alice");
    bob = makeUid("bob");
    carol = makeUid("carol");
    matchId = [alice, bob].sort().join("_");

    mocks.consumeRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getSessionUser.mockResolvedValue({ uid: alice });

    const now = Timestamp.now();
    const batch = db.batch();
    for (const [uid, label] of [
      [alice, "Alice"],
      [bob, "Bob"],
    ] as const) {
      batch.set(db.doc(userDoc(uid)), { uid, accountStatus: "active", createdAt: now });
      batch.set(db.doc(profileDoc(uid)), {
        uid,
        displayName: label,
        broadLocationLabel: "Southern India",
        visibility: "visible",
        moderationStatus: "approved",
        createdAt: now,
      });
    }
    batch.set(db.collection(COLLECTIONS.matches).doc(matchId), {
      userA: [alice, bob].sort()[0],
      userB: [alice, bob].sort()[1],
      status: "active",
      createdAt: now,
      matchedAt: now,
      endedAt: null,
    });
    batch.set(db.doc(conversationDoc(matchId)), {
      participantUids: [alice, bob],
      status: "active",
      createdAt: now,
      lastMessageAt: null,
    });
    await batch.commit();
  });

  afterEach(async () => {
    const paths = new Set<string>([
      userDoc(alice),
      userDoc(bob),
      profileDoc(alice),
      profileDoc(bob),
      conversationDoc(matchId),
      `matches/${matchId}`,
      `blocks/${blockDocumentId(alice, bob)}`,
      `blocks/${blockDocumentId(bob, alice)}`,
    ]);

    const [messages, audits] = await Promise.all([
      db.doc(conversationDoc(matchId)).collection("messages").limit(100).get(),
      db.collection(COLLECTIONS.auditLogs).where("actorUid", "in", [alice, bob]).get(),
    ]);
    messages.docs.forEach((doc) => paths.add(doc.ref.path));
    audits.docs.forEach((doc) => paths.add(doc.ref.path));

    for (const path of paths) {
      await db.doc(path).delete();
    }
  });

  afterAll(async () => {
    if (db) await db.terminate();
    if (app) await deleteApp(app);
  });

  const context = () => ({ params: Promise.resolve({ conversationId: matchId }) });

  it("sends and reads a participant-only text message", async () => {
    const sent = await sendMessage(post({ text: "  Hello Bob  " }), context());
    expect(sent.status).toBe(201);

    const thread = await readMessages(post(), context());
    expect(thread.status).toBe(200);
    const body = (await thread.json()) as {
      partner: { uid: string };
      canSend: boolean;
      messages: Array<{ body: string; senderUid: string }>;
    };
    expect(body.partner.uid).toBe(bob);
    expect(body.canSend).toBe(true);
    expect(body.messages.at(-1)).toMatchObject({ body: "Hello Bob", senderUid: alice });

    const conversation = await db.doc(conversationDoc(matchId)).get();
    expect(conversation.get("lastMessageSenderUid")).toBe(alice);
    expect(conversation.get("lastMessageAt")).toBeTruthy();

    const list = await listConversations();
    expect(list.status).toBe(200);
    const listed = (await list.json()) as {
      conversations: Array<{ id: string; lastMessagePreview: string | null }>;
    };
    expect(listed.conversations).toEqual([
      expect.objectContaining({ id: matchId, lastMessagePreview: "Hello Bob" }),
    ]);
  });

  it("hides the conversation from non-participants", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: carol });

    expect((await readMessages(post(), context())).status).toBe(404);
    expect((await sendMessage(post({ text: "hi" }), context())).status).toBe(404);
  });

  it("returns 409 after an unmatch and audits the unmatch", async () => {
    const ended = await unmatch(post(), { params: Promise.resolve({ matchId }) });
    expect(ended.status).toBe(200);

    const match = await db.collection(COLLECTIONS.matches).doc(matchId).get();
    expect(match.get("status")).toBe("unmatched");
    const conversation = await db.doc(conversationDoc(matchId)).get();
    expect(conversation.get("status")).toBe("closed");

    expect((await sendMessage(post({ text: "still there?" }), context())).status).toBe(409);

    const audits = await db.collection(COLLECTIONS.auditLogs).where("actorUid", "==", alice).get();
    expect(audits.docs.some((doc) => doc.get("action") === "match.unmatch")).toBe(true);
  });

  it("blocks a participant and refuses further messages", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: bob });

    const blocked = await block(post({ targetUid: alice }));
    expect(blocked.status).toBe(200);

    mocks.getSessionUser.mockResolvedValue({ uid: alice });
    expect((await sendMessage(post({ text: "hello?" }), context())).status).toBe(403);

    const thread = await readMessages(post(), context());
    const body = (await thread.json()) as { canSend: boolean; status: string };
    expect(body.canSend).toBe(false);
    expect(body.status).toBe("closed");
  });
});
