import { jsonError } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";
import { getStaffRole } from "@/lib/admin/server";
import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";

/** Staff-only appeal queue. */
export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const role = await getStaffRole(session.uid);
  if (!role) return jsonError(403, "forbidden");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "open";
  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.appeals)
    .where("status", "==", status)
    .limit(50)
    .get();

  const appeals = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      appellantUid: String(doc.get("appellantUid")),
      targetType: String(doc.get("targetType")),
      targetId: String(doc.get("targetId")),
      reason: String(doc.get("reason")),
      status: String(doc.get("status")),
      createdAt:
        doc.get("createdAt") && typeof doc.get("createdAt").toDate === "function"
          ? doc.get("createdAt").toDate().toISOString()
          : null,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return Response.json({ role, appeals }, { headers: { "cache-control": "no-store" } });
}
