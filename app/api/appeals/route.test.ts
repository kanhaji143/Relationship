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

import { GET, POST } from "./route";

const ORIGIN = "http://localhost";

function documents(): Record<string, DocData> {
  return {
    "moderationActions/ma-1": { moderatorUid: "staff", targetUid: "bob" },
    "reports/r-1": { reporterUid: "alice", targetUid: "bob", status: "open" },
  };
}

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
  mocks.consumeRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
});

describe("POST /api/appeals", () => {
  it("files an appeal against a moderation action", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/appeals`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "moderation_action",
          targetId: "ma-1",
          reason: "I did nothing wrong.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    const appeal = fake.writes.find(
      (write) => write.kind === "set" && write.path.startsWith("appeals/"),
    );
    expect(appeal?.value).toMatchObject({
      appellantUid: "alice",
      targetType: "moderation_action",
      targetId: "ma-1",
      status: "open",
    });
  });

  it("rejects appeals for missing targets", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/appeals`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "moderation_action",
          targetId: "missing",
          reason: "nope",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(fake.writes).toHaveLength(0);
  });

  it("rejects duplicate open appeals", async () => {
    const fake = createFakeDb({
      ...documents(),
      "appeals/existing": {
        appellantUid: "alice",
        targetType: "moderation_action",
        targetId: "ma-1",
        status: "open",
      },
    });
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/appeals`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "moderation_action",
          targetId: "ma-1",
          reason: "again",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(fake.writes).toHaveLength(0);
  });

  it("requires a session and same-origin request", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    mocks.getSessionUser.mockResolvedValue(null);
    const anonymous = await POST(
      new Request(`${ORIGIN}/api/appeals`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ targetType: "report", targetId: "r-1", reason: "x" }),
      }),
    );
    expect(anonymous.status).toBe(401);

    mocks.getSessionUser.mockResolvedValue({ uid: "alice" });
    const crossOrigin = new Request(`${ORIGIN}/api/appeals`, {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ targetType: "report", targetId: "r-1", reason: "x" }),
    });
    expect((await POST(crossOrigin)).status).toBe(403);
  });
});

describe("GET /api/appeals", () => {
  it("returns only the caller's appeals", async () => {
    const fake = createFakeDb({
      ...documents(),
      "appeals/a1": {
        appellantUid: "alice",
        targetType: "report",
        targetId: "r-1",
        reason: "mine",
        status: "open",
        createdAt: { toDate: () => new Date("2026-10-29T10:00:00Z") },
      },
      "appeals/a2": {
        appellantUid: "bob",
        targetType: "report",
        targetId: "r-1",
        reason: "not mine",
        status: "open",
        createdAt: { toDate: () => new Date("2026-10-29T11:00:00Z") },
      },
    });
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET();
    const body = (await response.json()) as { appeals: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.appeals.map((appeal) => appeal.id)).toEqual(["a1"]);
  });
});
