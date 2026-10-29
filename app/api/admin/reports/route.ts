import { jsonError } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";
import { getStaffRole, listReports } from "@/lib/admin/server";

/** Staff-only report queue. Non-staff callers receive 403. */
export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const role = await getStaffRole(session.uid);
  if (!role) return jsonError(403, "forbidden");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "open";
  const reports = await listReports(status);

  return Response.json({ role, reports }, { headers: { "cache-control": "no-store" } });
}
