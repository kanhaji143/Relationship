import { FieldValue, type Transaction } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";
import { getStaffRole } from "@/lib/admin/server";
import { appealResolutionSchema } from "@/lib/validation/appeals";

type Context = { params: Promise<{ appealId: string }> };

/** Staff-only appeal resolution. Append-only audit row. */
export async function POST(request: Request, context: Context) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const role = await getStaffRole(session.uid);
  if (!role) return jsonError(403, "forbidden");

  const { appealId } = await context.params;
  if (!appealId || appealId.length > 256) return jsonError(404, "not_found");

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = appealResolutionSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_input",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const appealRef = db.collection(COLLECTIONS.appeals).doc(appealId);
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  const result = await db.runTransaction(async (transaction: Transaction) => {
    const appeal = await transaction.get(appealRef);
    if (!appeal.exists) return { status: "not_found" as const };
    if (appeal.get("status") !== "open" && appeal.get("status") !== "reviewing") {
      return { status: "already_resolved" as const };
    }

    const now = FieldValue.serverTimestamp();
    transaction.update(appealRef, {
      status: parsed.data.status,
      resolvedAt: now,
      resolvedBy: session.uid,
      resolutionNote: parsed.data.note ?? null,
    });
    transaction.create(auditRef, {
      actorUid: session.uid,
      action: `appeal.${parsed.data.status}`,
      targetType: "appeal",
      targetId: appealId,
      reasonCode: null,
      metadata: null,
      createdAt: now,
    });

    return { status: "resolved" as const };
  });

  if (result.status === "not_found") return jsonError(404, "not_found");
  if (result.status === "already_resolved") return jsonError(409, "already_resolved");
  return Response.json({ ok: true }, { status: 200 });
}
