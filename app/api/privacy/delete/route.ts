import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { getSessionUser } from "@/lib/session";

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

const DUE_DAYS = 30;

/** Creates an account-deletion request (does not delete immediately). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const db = getAdminDb();
  const due = new Date(Date.now() + DUE_DAYS * 24 * 60 * 60 * 1000);

  const ref = db.collection(COLLECTIONS.privacyRequests).doc();
  await ref.set({
    uid: session.uid,
    requestType: "delete",
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    dueAt: Timestamp.fromDate(due),
    completedAt: null,
    resolutionNote: null,
  });

  return Response.json({ ok: true, requestId: ref.id }, { status: 201 });
}
