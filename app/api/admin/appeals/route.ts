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

  const toIso = (value: unknown): string | null =>
    value && typeof (value as { toDate?: unknown }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate().toISOString()
      : null;

  const appeals = snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown> | undefined;
      return {
        id: doc.id,
        appellantUid: String(data?.appellantUid ?? ""),
        targetType: String(data?.targetType ?? ""),
        targetId: String(data?.targetId ?? ""),
        reason: String(data?.reason ?? ""),
        status: String(data?.status ?? ""),
        createdAt: toIso(data?.createdAt),
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return Response.json({ role, appeals }, { headers: { "cache-control": "no-store" } });
}
