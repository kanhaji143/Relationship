import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeDb, type DocData } from "@/tests/fake-firestore";

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin/app", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/session", () => ({ getSessionUser: mocks.getSessionUser }));

import { GET } from "./route";

const ORIGIN = "http://localhost";

function documents(): Record<string, DocData> {
  return {
    "users/staff": { role: "moderator" },
    "users/regular": { role: "user" },
    "reports/r1": {
      reporterUid: "alice",
      targetUid: "bob",
      category: "spam",
      priority: "low",
      status: "open",
      description: "seed",
      conversationId: null,
      createdAt: { toDate: () => new Date("2026-10-29T10:00:00Z") },
    },
    "reports/r2": {
      reporterUid: "alice",
      targetUid: "carol",
      category: "threats",
      priority: "high",
      status: "resolved",
      description: null,
      conversationId: "conv-1",
      createdAt: { toDate: () => new Date("2026-10-29T11:00:00Z") },
    },
  };
}

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "staff" });
});

describe("GET /api/admin/reports", () => {
  it("returns the queue for staff", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/reports?status=open`));
    const body = (await response.json()) as { role: string; reports: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.role).toBe("moderator");
    expect(body.reports.map((report) => report.id)).toEqual(["r1"]);
  });

  it("filters by status", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/reports?status=resolved`));
    const body = (await response.json()) as { reports: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.reports.map((report) => report.id)).toEqual(["r2"]);
  });

  it("rejects non-staff callers", async () => {
    mocks.getSessionUser.mockResolvedValue({ uid: "regular" });
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/reports`));

    expect(response.status).toBe(403);
  });

  it("requires a session", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/reports`));

    expect(response.status).toBe(401);
  });
});
