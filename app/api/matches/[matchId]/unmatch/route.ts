import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { isParticipant } from "@/lib/messaging/authorization";
import { getSessionUser } from "@/lib/session";
import { conversationIdSchema } from "@/lib/validation/messaging";

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

type Context = { params: Promise<{ matchId: string }> };

/**
 * Ends a match for both participants. Idempotent: a second call reports
 * `already_ended` without writing again. Chat becomes read-only.
 */
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const { matchId } = await context.params;
  if (!conversationIdSchema.safeParse(matchId).success) return jsonError(404, "not_found");

  const db = getAdminDb();
  const matchRef = db.collection(COLLECTIONS.matches).doc(matchId);
  const conversationRef = db.collection(COLLECTIONS.conversations).doc(matchId);
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  const result = await db.runTransaction(async (transaction) => {
    const [match, conversation] = await Promise.all([
      transaction.get(matchRef),
      transaction.get(conversationRef),
    ]);
    if (!match.exists) return { status: "not_found" as const };

    const participants = [String(match.get("userA")), String(match.get("userB"))];
    if (!isParticipant(session.uid, participants)) return { status: "not_found" as const };

    if (match.get("status") !== "active") return { status: "already_ended" as const };

    const now = FieldValue.serverTimestamp();
    transaction.update(matchRef, { status: "unmatched", endedAt: now, updatedAt: now });
    if (conversation.exists) {
      transaction.update(conversationRef, { status: "closed", updatedAt: now });
    }
    transaction.create(auditRef, {
      actorUid: session.uid,
      action: "match.unmatch",
      targetType: "match",
      targetId: matchId,
      reasonCode: null,
      metadata: null,
      createdAt: now,
    });

    return { status: "ended" as const };
  });

  if (result.status === "not_found") return jsonError(404, "not_found");
  return Response.json({ ok: true, status: result.status });
}
