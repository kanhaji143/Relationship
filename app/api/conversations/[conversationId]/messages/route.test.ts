import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeDb, type DocData } from "@/tests/fake-firestore";

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

import { POST, GET } from "./route";

const ORIGIN = "http://localhost";

function baseDocuments(): Record<string, DocData> {
  return {
    "conversations/conv-1": {
      participantUids: ["alice", "bob"],
      status: "active",
      lastMessageAt: null,
    },
    "matches/conv-1": { userA: "alice", userB: "bob", status: "active" },
    "profiles/bob": { displayName: "Bob", broadLocationLabel: "South India" },
  };
}

function request(body: unknown = { text: "Hello Bob" }): Request {
  return new Request(`${ORIGIN}/api/conversations/conv-1/messages`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ conversationId: "conv-1" }) };

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
  mocks.consumeRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
});

describe("POST conversation messages", () => {
  it("stores a text message and updates the conversation timestamp", async () => {
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(201);
    const written = fake.writes.find((write) => write.kind === "create");
    expect(written?.path).toMatch(/^conversations\/conv-1\/messages\//);
    expect(written?.value).toMatchObject({
      senderUid: "alice",
      type: "text",
      body: "Hello Bob",
      moderationStatus: "unreviewed",
    });
    expect(fake.data("conversations/conv-1")?.lastMessageSenderUid).toBe("alice");
  });

  it("rejects unauthenticated callers", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(401);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects cross-origin writes", async () => {
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);
    const crossOrigin = new Request(`${ORIGIN}/api/conversations/conv-1/messages`, {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ text: "hi" }),
    });

    const response = await POST(crossOrigin, context);

    expect(response.status).toBe(403);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects invalid message input", async () => {
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ text: "" }), context);

    expect(response.status).toBe(400);
    expect(fake.writes).toHaveLength(0);
  });

  it("hides conversations from non-participants", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: "carol" });
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(404);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects writes after either participant blocks", async () => {
    const fake = createFakeDb({
      ...baseDocuments(),
      "blocks/block-1": { blockerUid: "bob", blockedUid: "alice" },
    });
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects writes to a closed conversation", async () => {
    const documents = baseDocuments();
    documents["conversations/conv-1"]!.status = "closed";
    const fake = createFakeDb(documents);
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(409);
    expect(fake.writes).toHaveLength(0);
  });

  it("applies the per-user send rate limit", async () => {
    mocks.consumeRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 30 });
    const fake = createFakeDb(baseDocuments());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
  });
});

describe("GET conversation messages", () => {
  it("returns the participant thread", async () => {
    const fake = createFakeDb({
      ...baseDocuments(),
      "conversations/conv-1/messages/m1": {
        senderUid: "bob",
        body: "Hi Alice",
        createdAt: { toDate: () => new Date("2026-10-29T10:00:00Z") },
      },
    });
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/conversations/conv-1/messages`), context);
    const body = (await response.json()) as {
      partner: { uid: string };
      messages: Array<{ body: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.partner.uid).toBe("bob");
    expect(body.messages.map((message) => message.body)).toEqual(["Hi Alice"]);
  });

  it("returns 404 for non-participants", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: "carol" });
    mocks.getAdminDb.mockReturnValue(createFakeDb(baseDocuments()).db);

    const response = await GET(new Request(`${ORIGIN}/api/conversations/conv-1/messages`), context);

    expect(response.status).toBe(404);
  });
});
