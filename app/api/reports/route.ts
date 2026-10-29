import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS, userDoc } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { isParticipant, otherParticipantUid } from "@/lib/messaging/authorization";
import { reportPriority } from "@/lib/safety/reports";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { reportSchema } from "@/lib/validation/messaging";

const REPORT_LIMIT = { limit: 10, windowMs: 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/**
 * Files a report against a user or conversation. The reporter is derived from
 * the session; self-reports and duplicate open reports are rejected.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`reports:${session.uid}`, REPORT_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = reportSchema.safeParse(body.data);
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

  const uid = session.uid;
  const { category, description } = parsed.data;
  let targetUid = parsed.data.targetUid;
  const conversationId = parsed.data.conversationId;

  const db = getAdminDb();

  // Resolve a conversation-only report to its other participant.
  if (conversationId && !targetUid) {
    const conversation = await db.collection(COLLECTIONS.conversations).doc(conversationId).get();
    if (!conversation.exists) return jsonError(404, "not_found");
    const participants = (conversation.get("participantUids") as string[]) ?? [];
    if (!isParticipant(uid, participants)) return jsonError(404, "not_found");
    targetUid = otherParticipantUid(uid, participants) ?? undefined;
    if (!targetUid) return jsonError(400, "invalid_input");
  }

  if (!targetUid) return jsonError(400, "invalid_input");
  if (targetUid === uid) return jsonError(400, "self_report");

  const targetUser = await db.doc(userDoc(targetUid)).get();
  if (!targetUser.exists) return jsonError(404, "not_found");

  // Duplicate guard: one open report per reporter/target/category.
  const existing = await db
    .collection(COLLECTIONS.reports)
    .where("reporterUid", "==", uid)
    .limit(100)
    .get();
  const duplicate = existing.docs.some((doc) => {
    const status = doc.get("status");
    return (
      doc.get("targetUid") === targetUid &&
      doc.get("category") === category &&
      (status === "open" || status === "reviewing")
    );
  });
  if (duplicate) return jsonError(409, "already_reported");

  const reportRef = db.collection(COLLECTIONS.reports).doc();
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();
  const now = FieldValue.serverTimestamp();

  await reportRef.set({
    reporterUid: uid,
    targetUid,
    targetMessageId: null,
    conversationId: conversationId ?? null,
    category,
    description: description ?? null,
    status: "open",
    priority: reportPriority(category),
    createdAt: now,
    resolvedAt: null,
  });

  await auditRef.set({
    actorUid: uid,
    action: "safety.report",
    targetType: "user",
    targetId: targetUid,
    reasonCode: category,
    metadata: conversationId ? { conversationId } : null,
    createdAt: now,
  });

  return Response.json({ ok: true, reportId: reportRef.id }, { status: 201 });
}
