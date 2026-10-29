import { jsonError } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";
import { getStaffRole } from "@/lib/admin/server";
import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";

/** Staff-only, read-only audit log feed. */
export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const role = await getStaffRole(session.uid);
  if (!role) return jsonError(403, "forbidden");

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const snapshot = await getAdminDb().collection(COLLECTIONS.auditLogs).limit(limit).get();

  const logs = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      actorUid: String(doc.get("actorUid")),
      action: String(doc.get("action")),
      targetType: doc.get("targetType") ?? null,
      targetId: doc.get("targetId") ?? null,
      reasonCode: doc.get("reasonCode") ?? null,
      createdAt:
        doc.get("createdAt") && typeof doc.get("createdAt").toDate === "function"
          ? doc.get("createdAt").toDate().toISOString()
          : null,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return Response.json({ role, logs }, { headers: { "cache-control": "no-store" } });
}
