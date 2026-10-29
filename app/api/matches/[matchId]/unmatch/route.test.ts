import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeDb, type DocData } from "@/tests/fake-firestore";

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin/app", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/session", () => ({ getSessionUser: mocks.getSessionUser }));

import { POST } from "./route";

const ORIGIN = "http://localhost";

function documents(): Record<string, DocData> {
  return {
    "matches/alice_bob": {
      userA: "alice",
      userB: "bob",
      status: "active",
      matchedAt: null,
      endedAt: null,
    },
    "conversations/alice_bob": { participantUids: ["alice", "bob"], status: "active" },
  };
}

function request(origin = ORIGIN): Request {
  return new Request(`${ORIGIN}/api/matches/alice_bob/unmatch`, {
    method: "POST",
    headers: { origin },
  });
}

const context = { params: Promise.resolve({ matchId: "alice_bob" }) };

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
});

describe("POST /api/matches/:id/unmatch", () => {
  it("ends the match, closes chat and records an audit event", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ended" });
    expect(fake.data("matches/alice_bob")?.status).toBe("unmatched");
    expect(fake.data("conversations/alice_bob")?.status).toBe("closed");
    const audit = fake.writes.find((write) => write.kind === "create");
    expect(audit?.path).toMatch(/^auditLogs\//);
    expect(audit?.value).toMatchObject({
      actorUid: "alice",
      action: "match.unmatch",
      targetId: "alice_bob",
    });
  });

  it("is idempotent for an already-ended match", async () => {
    const existing = documents();
    existing["matches/alice_bob"]!.status = "unmatched";
    const fake = createFakeDb(existing);
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    await expect(response.json()).resolves.toMatchObject({ status: "already_ended" });
    expect(fake.writes).toHaveLength(0);
  });

  it("hides the match from non-participants", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: "carol" });
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request(), context);

    expect(response.status).toBe(404);
    expect(fake.writes).toHaveLength(0);
  });

  it("requires a session and same-origin request", async () => {
    mocks.getAdminDb.mockReturnValue(createFakeDb(documents()).db);

    mocks.getSessionUser.mockResolvedValue(null);
    const anonymous = await POST(request(), context);
    expect(anonymous.status).toBe(401);

    mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
    const crossOrigin = await POST(request("https://evil.example"), context);
    expect(crossOrigin.status).toBe(403);
  });

  it("returns 404 for an unknown match", async () => {
    mocks.getAdminDb.mockReturnValue(createFakeDb({}).db);

    const response = await POST(request(), context);

    expect(response.status).toBe(404);
  });
});
