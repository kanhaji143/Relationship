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
    "users/staff": { role: "moderator" },
    "users/regular": { role: "user" },
    "reports/r1": {
      reporterUid: "alice",
      targetUid: "bob",
      category: "spam",
      status: "open",
      priority: "low",
    },
  };
}

const context = (reportId = "r1") => ({ params: Promise.resolve({ reportId }) });

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "staff" });
});

describe("POST /api/admin/reports/:id/action", () => {
  it("appends a moderation action, resolves the report and audits it", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/admin/reports/r1/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "resolve", reasonCode: "reviewed", notes: "ok" }),
      }),
      context(),
    );

    expect(response.status).toBe(201);
    expect(fake.data("reports/r1")?.status).toBe("resolved");
    const action = fake.writes.find(
      (write) => write.kind === "create" && write.path.startsWith("moderationActions/"),
    );
    expect(action?.value).toMatchObject({
      moderatorUid: "staff",
      targetUid: "bob",
      reportId: "r1",
      actionType: "resolve",
      reasonCode: "reviewed",
      notes: "ok",
    });
    const audit = fake.writes.find(
      (write) => write.kind === "create" && write.path.startsWith("auditLogs/"),
    );
    expect(audit?.value).toMatchObject({ action: "moderation.resolve", targetId: "r1" });
  });

  it("dismisses a report without applying a user-facing action", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/admin/reports/r1/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "dismiss", reasonCode: "not_actionable" }),
      }),
      context(),
    );

    expect(response.status).toBe(201);
    expect(fake.data("reports/r1")?.status).toBe("dismissed");
  });

  it("rejects invalid action types", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/admin/reports/r1/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "explode", reasonCode: "x" }),
      }),
      context(),
    );

    expect(response.status).toBe(400);
    expect(fake.data("reports/r1")?.status).toBe("open");
  });

  it("returns 404 for an unknown report", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await POST(
      new Request(`${ORIGIN}/api/admin/reports/missing/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "resolve", reasonCode: "reviewed" }),
      }),
      { params: Promise.resolve({ reportId: "missing" }) },
    );

    expect(response.status).toBe(404);
  });

  it("rejects non-staff and unauthenticated callers", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    mocks.getSessionUser.mockResolvedValue({ uid: "regular" });
    const forbidden = await POST(
      new Request(`${ORIGIN}/api/admin/reports/r1/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "resolve", reasonCode: "reviewed" }),
      }),
      context(),
    );
    expect(forbidden.status).toBe(403);

    mocks.getSessionUser.mockResolvedValue(null);
    const anonymous = await POST(
      new Request(`${ORIGIN}/api/admin/reports/r1/action`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ actionType: "resolve", reasonCode: "reviewed" }),
      }),
      context(),
    );
    expect(anonymous.status).toBe(401);
  });
});
