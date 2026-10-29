import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { appealSchema } from "@/lib/validation/appeals";

const APPEAL_LIMIT = { limit: 5, windowMs: 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/** Files an appeal against a moderation action or report. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`appeals:${session.uid}`, APPEAL_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = appealSchema.safeParse(body.data);
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
  const { targetType, targetId, reason } = parsed.data;
  const db = getAdminDb();

  const targetRef =
    targetType === "moderation_action"
      ? db.collection(COLLECTIONS.moderationActions).doc(targetId)
      : db.collection(COLLECTIONS.reports).doc(targetId);
  const target = await targetRef.get();
  if (!target.exists) return jsonError(404, "not_found");

  // Duplicate guard: one open appeal per user/target.
  const existing = await db
    .collection(COLLECTIONS.appeals)
    .where("appellantUid", "==", uid)
    .limit(100)
    .get();
  const duplicate = existing.docs.some((doc) => {
    const data = doc.data() as Record<string, unknown> | undefined;
    return (
      data?.targetType === targetType &&
      data?.targetId === targetId &&
      (data?.status === "open" || data?.status === "reviewing")
    );
  });
  if (duplicate) return jsonError(409, "already_appealed");

  const appealRef = db.collection(COLLECTIONS.appeals).doc();
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();
  const now = FieldValue.serverTimestamp();

  await appealRef.set({
    appellantUid: uid,
    targetType,
    targetId,
    reason,
    status: "open",
    createdAt: now,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
  });

  await auditRef.set({
    actorUid: uid,
    action: "safety.appeal",
    targetType,
    targetId,
    reasonCode: null,
    metadata: { targetType },
    createdAt: now,
  });

  return Response.json({ ok: true, appealId: appealRef.id }, { status: 201 });
}

export async function GET() {
  const toIso = (value: unknown): string | null =>
    value && typeof (value as { toDate?: unknown }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate().toISOString()
      : null;

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.appeals)
    .where("appellantUid", "==", session.uid)
    .limit(50)
    .get();

  const appeals = snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown> | undefined;
      return {
        id: doc.id,
        targetType: String(data?.targetType ?? ""),
        targetId: String(data?.targetId ?? ""),
        reason: String(data?.reason ?? ""),
        status: String(data?.status ?? ""),
        createdAt: toIso(data?.createdAt),
        resolvedAt: toIso(data?.resolvedAt),
        resolutionNote: typeof data?.resolutionNote === "string" ? data.resolutionNote : null,
      };
    })
    .sort((a: { createdAt: string | null }, b: { createdAt: string | null }) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );

  return Response.json({ appeals }, { headers: { "cache-control": "no-store" } });
}
