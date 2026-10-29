import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.privacyRequests)
    .where("uid", "==", session.uid)
    .limit(50)
    .get();

  const requests = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      type: String(doc.get("requestType")),
      status: String(doc.get("status")),
      createdAt:
        doc.get("createdAt") && typeof doc.get("createdAt").toDate === "function"
          ? doc.get("createdAt").toDate().toISOString()
          : null,
      dueAt:
        doc.get("dueAt") && typeof doc.get("dueAt").toDate === "function"
          ? doc.get("dueAt").toDate().toISOString()
          : null,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return Response.json({ requests }, { headers: { "cache-control": "no-store" } });
}
