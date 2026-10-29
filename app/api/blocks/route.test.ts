import { beforeEach, describe, expect, it, vi } from "vitest";

import { blockDocumentId } from "@/lib/safety/blocks";
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

import { POST } from "./route";
import { DELETE } from "./[targetUid]/route";

const ORIGIN = "http://localhost";
const BLOCK_ID = blockDocumentId("alice", "bob");

function documents(): Record<string, DocData> {
  return {
    "users/bob": { accountStatus: "active" },
    "matches/alice_bob": { userA: "alice", userB: "bob", status: "active" },
    "conversations/alice_bob": { participantUids: ["alice", "bob"], status: "active" },
  };
}

function blockRequest(body: unknown = { targetUid: "bob" }): Request {
  return new Request(`${ORIGIN}/api/blocks`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const unblockContext = { params: Promise.resolve({ targetUid: "bob" }) };

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
  mocks.consumeRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
});

describe("POST /api/blocks", () => {
  it("creates a one-way block, closes the match/chat and audits the action", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(blockRequest());

    expect(response.status).toBe(200);
    expect(fake.data(`blocks/${BLOCK_ID}`)).toMatchObject({
      blockerUid: "alice",
      blockedUid: "bob",
    });
    expect(fake.data("matches/alice_bob")?.status).toBe("blocked");
    expect(fake.data("conversations/alice_bob")?.status).toBe("closed");
    const audit = fake.writes.find(
      (write) => write.kind === "create" && write.path.startsWith("auditLogs/"),
    );
    expect(audit?.value).toMatchObject({ action: "safety.block", targetId: "bob" });
  });

  it("is idempotent when the block already exists", async () => {
    const existing = documents();
    existing[`blocks/${BLOCK_ID}`] = { blockerUid: "alice", blockedUid: "bob" };
    const fake = createFakeDb(existing);
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(blockRequest());

    await expect(response.json()).resolves.toMatchObject({ status: "already_blocked" });
    expect(fake.writes).toHaveLength(0);
  });

  it("prevents self-blocks and unknown targets", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const self = await POST(blockRequest({ targetUid: "alice" }));
    expect(self.status).toBe(400);

    const missing = await POST(blockRequest({ targetUid: "nobody" }));
    expect(missing.status).toBe(404);
  });

  it("requires a session and same-origin request", async () => {
    mocks.getAdminDb.mockReturnValue(createFakeDb(documents()).db);

    mocks.getSessionUser.mockResolvedValue(null);
    expect((await POST(blockRequest())).status).toBe(401);

    mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
    const crossOrigin = new Request(`${ORIGIN}/api/blocks`, {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ targetUid: "bob" }),
    });
    expect((await POST(crossOrigin)).status).toBe(403);
  });
});

describe("DELETE /api/blocks/:targetUid", () => {
  it("removes the block and records an audit event", async () => {
    const existing = documents();
    existing[`blocks/${BLOCK_ID}`] = { blockerUid: "alice", blockedUid: "bob" };
    const fake = createFakeDb(existing);
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await DELETE(
      new Request(`${ORIGIN}/api/blocks/bob`, { method: "DELETE", headers: { origin: ORIGIN } }),
      unblockContext,
    );

    expect(response.status).toBe(200);
    expect(fake.exists(`blocks/${BLOCK_ID}`)).toBe(false);
    const audit = fake.writes.find((write) => write.kind === "create");
    expect(audit?.value).toMatchObject({ action: "safety.unblock", targetId: "bob" });
  });

  it("is idempotent when no block exists", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await DELETE(
      new Request(`${ORIGIN}/api/blocks/bob`, { method: "DELETE", headers: { origin: ORIGIN } }),
      unblockContext,
    );

    await expect(response.json()).resolves.toMatchObject({ status: "not_blocked" });
    expect(fake.writes).toHaveLength(0);
  });
});
