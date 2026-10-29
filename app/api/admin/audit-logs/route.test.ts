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
    "users/staff": { role: "admin" },
    "users/regular": { role: "user" },
    "auditLogs/a1": {
      actorUid: "alice",
      action: "safety.report",
      targetType: "user",
      targetId: "bob",
      reasonCode: "spam",
      createdAt: { toDate: () => new Date("2026-10-29T10:00:00Z") },
    },
  };
}

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "staff" });
});

describe("GET /api/admin/audit-logs", () => {
  it("returns logs for staff", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/audit-logs`));
    const body = (await response.json()) as { role: string; logs: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.role).toBe("admin");
    expect(body.logs.map((log) => log.id)).toEqual(["a1"]);
  });

  it("rejects non-staff and unauthenticated callers", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    mocks.getSessionUser.mockResolvedValue({ uid: "regular" });
    expect((await GET(new Request(`${ORIGIN}/api/admin/audit-logs`))).status).toBe(403);

    mocks.getSessionUser.mockResolvedValue(null);
    expect((await GET(new Request(`${ORIGIN}/api/admin/audit-logs`))).status).toBe(401);
  });
});
