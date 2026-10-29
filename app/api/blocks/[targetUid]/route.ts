import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { blockDocumentId } from "@/lib/safety/blocks";
import { getSessionUser } from "@/lib/session";
import { conversationIdSchema } from "@/lib/validation/messaging";

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

type Context = { params: Promise<{ targetUid: string }> };

/** Removes a block. Idempotent; a removed match is not restored. */
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const { targetUid } = await context.params;
  if (!conversationIdSchema.safeParse(targetUid).success) return jsonError(404, "not_found");

  const db = getAdminDb();
  const blockRef = db.collection(COLLECTIONS.blocks).doc(blockDocumentId(session.uid, targetUid));
  const auditRef = db.collection(COLLECTIONS.auditLogs).doc();

  const result = await db.runTransaction(async (transaction) => {
    const block = await transaction.get(blockRef);
    if (!block.exists) return { status: "not_blocked" as const };

    transaction.delete(blockRef);
    transaction.create(auditRef, {
      actorUid: session.uid,
      action: "safety.unblock",
      targetType: "user",
      targetId: targetUid,
      reasonCode: null,
      metadata: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { status: "unblocked" as const };
  });

  return Response.json({ ok: true, status: result.status });
}
