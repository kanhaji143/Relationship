import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeDb, type DocData } from "@/tests/fake-firestore";

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin/app", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/session", () => ({ getSessionUser: mocks.getSessionUser }));

import { GET } from "./route";
import { POST as resolveAppeal } from "./[appealId]/resolve/route";

const ORIGIN = "http://localhost";

function documents(): Record<string, DocData> {
  return {
    "users/staff": { role: "admin" },
    "users/regular": { role: "user" },
    "appeals/ap-1": {
      appellantUid: "alice",
      targetType: "moderation_action",
      targetId: "ma-1",
      reason: "appeal reason",
      status: "open",
      createdAt: { toDate: () => new Date("2026-10-29T10:00:00Z") },
    },
  };
}

const resolveContext = (appealId = "ap-1") => ({ params: Promise.resolve({ appealId }) });

beforeEach(() => {
  mocks.getSessionUser.mockResolvedValue({ uid: "staff" });
});

describe("GET /api/admin/appeals", () => {
  it("returns the queue for staff", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await GET(new Request(`${ORIGIN}/api/admin/appeals?status=open`));
    const body = (await response.json()) as { role: string; appeals: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.role).toBe("admin");
    expect(body.appeals.map((appeal) => appeal.id)).toEqual(["ap-1"]);
  });

  it("rejects non-staff and unauthenticated callers", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    mocks.getSessionUser.mockResolvedValue({ uid: "regular" });
    expect((await GET(new Request(`${ORIGIN}/api/admin/appeals`))).status).toBe(403);

    mocks.getSessionUser.mockResolvedValue(null);
    expect((await GET(new Request(`${ORIGIN}/api/admin/appeals`))).status).toBe(401);
  });
});

describe("POST /api/admin/appeals/:id/resolve", () => {
  it("resolves an open appeal and audits it", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await resolveAppeal(
      new Request(`${ORIGIN}/api/admin/appeals/ap-1/resolve`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved", note: "upheld" }),
      }),
      resolveContext(),
    );

    expect(response.status).toBe(200);
    expect(fake.data("appeals/ap-1")?.status).toBe("resolved");
    expect(fake.data("appeals/ap-1")?.resolutionNote).toBe("upheld");
    const audit = fake.writes.find(
      (write) => write.kind === "create" && write.path.startsWith("auditLogs/"),
    );
    expect(audit?.value).toMatchObject({ action: "appeal.resolved", targetId: "ap-1" });
  });

  it("rejects resolving an already-resolved appeal", async () => {
    const existing = documents();
    existing["appeals/ap-1"]!.status = "resolved";
    const fake = createFakeDb(existing);
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await resolveAppeal(
      new Request(`${ORIGIN}/api/admin/appeals/ap-1/resolve`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      }),
      resolveContext(),
    );

    expect(response.status).toBe(409);
  });

  it("returns 404 for an unknown appeal", async () => {
    const fake = createFakeDb(documents());
    mocks.getAdminDb.mockReturnValue(fake.db);

    const response = await resolveAppeal(
      new Request(`${ORIGIN}/api/admin/appeals/missing/resolve`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ appealId: "missing" }) },
    );

    expect(response.status).toBe(404);
  });
});
