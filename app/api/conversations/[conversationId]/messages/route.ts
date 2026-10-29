import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError, readJson } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { canSendMessage, otherParticipantUid } from "@/lib/messaging/authorization";
import { getConversationThread } from "@/lib/messaging/server";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { conversationIdSchema, sendMessageSchema } from "@/lib/validation/messaging";

const SEND_LIMIT = { limit: 30, windowMs: 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

type Context = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, context: Context) {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const { conversationId } = await context.params;
  if (!conversationIdSchema.safeParse(conversationId).success) {
    return jsonError(404, "not_found");
  }

  const thread = await getConversationThread(session.uid, conversationId);
  if (!thread) return jsonError(404, "not_found");

  return Response.json(thread, { headers: { "cache-control": "no-store" } });
}

/** Sends a text message into an active, unblocked conversation. */
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`messages:${session.uid}`, SEND_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  const { conversationId } = await context.params;
  if (!conversationIdSchema.safeParse(conversationId).success) {
    return jsonError(404, "not_found");
  }

  const body = await readJson<unknown>(request);
  if (!body.ok) return body.response;

  const parsed = sendMessageSchema.safeParse(body.data);
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
  const db = getAdminDb();
  const conversationRef = db.collection(COLLECTIONS.conversations).doc(conversationId);
  const matchRef = db.collection(COLLECTIONS.matches).doc(conversationId);
  const messageRef = conversationRef.collection("messages").doc();

  const result = await db.runTransaction(async (transaction) => {
    const conversation = await transaction.get(conversationRef);
    if (!conversation.exists) return { status: "not_found" as const };

    const participantUids = (conversation.get("participantUids") as string[]) ?? [];
    const partnerUid = otherParticipantUid(uid, participantUids);
    if (!partnerUid) return { status: "not_found" as const };

    const [match, outgoingBlock, incomingBlock] = await Promise.all([
      transaction.get(matchRef),
      transaction.get(db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid).limit(200)),
      transaction.get(
        db.collection(COLLECTIONS.blocks).where("blockerUid", "==", partnerUid).limit(200),
      ),
    ]);

    const blocked =
      outgoingBlock.docs.some((doc) => doc.get("blockedUid") === partnerUid) ||
      incomingBlock.docs.some((doc) => doc.get("blockedUid") === uid);

    const access = canSendMessage(
      uid,
      {
        participantUids,
        conversationStatus:
          typeof conversation.get("status") === "string" ? conversation.get("status") : "closed",
        matchStatus: match.exists ? String(match.get("status")) : "ended",
      },
      blocked,
    );
    if (!access.allowed) return { status: "denied" as const, reason: access.reason };

    const now = FieldValue.serverTimestamp();
    transaction.create(messageRef, {
      senderUid: uid,
      type: "text",
      body: parsed.data.text,
      moderationStatus: "unreviewed",
      createdAt: now,
      deletedAt: null,
    });
    transaction.update(conversationRef, {
      lastMessageAt: now,
      lastMessageSenderUid: uid,
      updatedAt: now,
    });

    return { status: "sent" as const };
  });

  if (result.status === "not_found") return jsonError(404, "not_found");
  if (result.status === "denied") {
    if (result.reason === "blocked") return jsonError(403, "blocked");
    if (result.reason === "not_participant") return jsonError(404, "not_found");
    return jsonError(409, result.reason);
  }

  return Response.json({ ok: true, messageId: messageRef.id }, { status: 201 });
}
