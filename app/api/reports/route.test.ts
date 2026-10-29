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

import { POST } from "./route";

const ORIGIN = "http://localhost";

function documents(): Record<string, DocData> {
  return {
    "users/bob": { accountStatus: "active", role: "user" },
    "users/carol": { accountStatus: "active", role: "user" },
    "conversations/conv-1": { participantUids: ["alice", "bob"], status: "active" },
  };
}

function request(body: unknown): Request {
  return new Request(`${ORIGIN}/api/reports`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
  mocks.consumeRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
});

describe("POST /api/reports", () => {
  it("files a report with derived priority and an audit event", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      request({ targetUid: "bob", category: "threats", description: "  danger  " }),
    );

    expect(response.status).toBe(201);
    const report = fake.writes.find(
      (write) => write.kind === "set" && write.path.startsWith("reports/"),
    );
    expect(report?.value).toMatchObject({
      reporterUid: "alice",
      targetUid: "bob",
      category: "threats",
      priority: "high",
      status: "open",
      description: "danger",
    });
    const audit = fake.writes.find(
      (write) => write.kind === "set" && write.path.startsWith("auditLogs/"),
    );
    expect(audit?.value).toMatchObject({
      action: "safety.report",
      targetId: "bob",
      reasonCode: "threats",
    });
  });

  it("resolves a conversation-only report to the other participant", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ conversationId: "conv-1", category: "spam" }));

    expect(response.status).toBe(201);
    const report = fake.writes.find(
      (write) => write.kind === "set" && write.path.startsWith("reports/"),
    );
    expect(report?.value).toMatchObject({
      targetUid: "bob",
      conversationId: "conv-1",
      priority: "low",
    });
  });

  it("rejects self-reports", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ targetUid: "alice", category: "spam" }));

    expect(response.status).toBe(400);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects reports without a target", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ category: "spam" }));

    expect(response.status).toBe(400);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects unknown categories", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ targetUid: "bob", category: "rude" }));

    expect(response.status).toBe(400);
    expect(fake.writes).toHaveLength(0);
  });

  it("hides conversation reports from non-participants", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: "carol" });
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ conversationId: "conv-1", category: "spam" }));

    expect(response.status).toBe(404);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects duplicate open reports", async () => {
    const fake = createFakeDb({
      ...documents(),
      "reports/existing": {
        reporterUid: "alice",
        targetUid: "bob",
        category: "spam",
        status: "open",
      },
    });
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(request({ targetUid: "bob", category: "spam" }));

    expect(response.status).toBe(409);
    expect(fake.writes).toHaveLength(0);
  });

  it("requires a session and same-origin request", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    mocks.getSessionUser.mockResolvedValue(null);
    expect((await POST(request({ targetUid: "bob", category: "spam" }))).status).toBe(401);

    mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
    const crossOrigin = new Request(`${ORIGIN}/api/reports`, {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ targetUid: "bob", category: "spam" }),
    });
    expect((await POST(crossOrigin)).status).toBe(403);
  });
});
