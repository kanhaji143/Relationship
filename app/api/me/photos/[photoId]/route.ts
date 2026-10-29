import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { deletePhoto, photoStoragePath } from "@/lib/storage/server";
import { getSessionUser } from "@/lib/session";

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

type Context = { params: Promise<{ photoId: string }> };

/** Soft-deletes a photo owned by the signed-in user. */
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const { photoId } = await context.params;
  const ref = getAdminDb().collection(COLLECTIONS.profilePhotos).doc(photoId);
  const doc = await ref.get();
  if (!doc.exists || doc.get("uid") !== session.uid) return jsonError(404, "not_found");

  await deletePhoto(photoStoragePath(session.uid, photoId));
  await ref.update({ deletedAt: FieldValue.serverTimestamp() });

  return Response.json({ ok: true });
}
