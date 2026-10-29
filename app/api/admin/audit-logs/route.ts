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

  const toIso = (value: unknown): string | null =>
    value && typeof (value as { toDate?: unknown }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate().toISOString()
      : null;

  const logs = snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown> | undefined;
      return {
        id: doc.id,
        actorUid: String(data?.actorUid ?? ""),
        action: String(data?.action ?? ""),
        targetType: (data?.targetType as string | null) ?? null,
        targetId: (data?.targetId as string | null) ?? null,
        reasonCode: (data?.reasonCode as string | null) ?? null,
        createdAt: toIso(data?.createdAt),
      };
    })
    .sort((a: { createdAt: string | null }, b: { createdAt: string | null }) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );

  return Response.json({ role, logs }, { headers: { "cache-control": "no-store" } });
}
