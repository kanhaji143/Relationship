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

/** Lists the signed-in user's privacy requests. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.privacyRequests)
    .where("uid", "==", session.uid)
    .limit(50)
    .get();

  const requests = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      type: String(doc.get("requestType")),
      status: String(doc.get("status")),
      createdAt:
        doc.get("createdAt") && typeof doc.get("createdAt").toDate === "function"
          ? doc.get("createdAt").toDate().toISOString()
          : null,
      dueAt:
        doc.get("dueAt") && typeof doc.get("dueAt").toDate === "function"
          ? doc.get("dueAt").toDate().toISOString()
          : null,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return Response.json({ requests }, { headers: { "cache-control": "no-store" } });
}

/** Creates a data-export request. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const db = getAdminDb();
  const now = new Date();
  const due = new Date(now.getTime() + DUE_DAYS * 24 * 60 * 60 * 1000);

  const ref = db.collection(COLLECTIONS.privacyRequests).doc();
  await ref.set({
    uid: session.uid,
    requestType: "export",
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    dueAt: Timestamp.fromDate(due),
    completedAt: null,
    resolutionNote: null,
  });

  return Response.json({ ok: true, requestId: ref.id }, { status: 201 });
}
