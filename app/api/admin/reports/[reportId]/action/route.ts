import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { getSessionUser } from "@/lib/session";
import { getStaffRole } from "@/lib/admin/server";
import { moderationActionSchema } from "@/lib/validation/moderation";

type Context = { params: Promise<{ reportId: string }> };

const SUSPENSION_DAYS = 7;

/**
 * Append-only moderation action. Staff only. The report is marked resolved or
 * dismissed in the same transaction; the action and an audit row are always
 * appended, never updated.
 */
export async function POST(request: Request, context: Context) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const role = await getStaffRole(session.uid);
  if (!role) return jsonError(403, "forbidden");

  const { reportId } = await context.params;
  if (!reportId || reportId.length > 256) return jsonError(404, "not_found");

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = moderationActionSchema.safeParse(body.data);
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
  const reportRef = db.collection(COLLECTIONS.reports).doc(reportId);
  const actionRef = db.collection(COLLECTIONS.moderationActions).doc();
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  const result = await db.runTransaction(async (transaction: Transaction) => {
    const report = await transaction.get(reportRef);
    if (!report.exists) return { status: "not_found" as const };

    const targetUid = String(report.get("targetUid"));
    const now = FieldValue.serverTimestamp();
    const expiresAt =
      parsed.data.actionType === "suspend" || parsed.data.actionType === "ban"
        ? Timestamp.fromDate(new Date(Date.now() + SUSPENSION_DAYS * 24 * 60 * 60 * 1000))
        : null;

    const nextStatus = parsed.data.actionType === "dismiss" ? "dismissed" : "resolved";

    transaction.update(reportRef, { status: nextStatus, resolvedAt: now });
    transaction.create(actionRef, {
      moderatorUid: session.uid,
      targetUid,
      reportId,
      actionType: parsed.data.actionType,
      reasonCode: parsed.data.reasonCode,
      notes: parsed.data.notes ?? null,
      createdAt: now,
      expiresAt,
    });
    transaction.create(auditRef, {
      actorUid: session.uid,
      action: `moderation.${parsed.data.actionType}`,
      targetType: "report",
      targetId: reportId,
      reasonCode: parsed.data.reasonCode,
      metadata: { targetUid },
      createdAt: now,
    });

    return { status: "applied" as const, actionId: actionRef.id };
  });

  if (result.status === "not_found") return jsonError(404, "not_found");
  return Response.json({ ok: true, actionId: result.actionId }, { status: 201 });
}
