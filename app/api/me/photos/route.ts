import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { jsonError } from "@/lib/http/json";
import { isAllowedOrigin } from "@/lib/http/origin";
import { requestOrigin } from "@/lib/http/request";
import { createPhotoReadUrl, uploadPhoto, validateAndNormalizePhoto } from "@/lib/storage/server";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";

const UPLOAD_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

function isSameOrigin(request: Request): boolean {
  return isAllowedOrigin(request.headers.get("origin"), {
    requestOrigin: requestOrigin(request),
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""],
  });
}

/** Lists the signed-in user's private photos with short-lived read URLs. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.profilePhotos)
    .where("uid", "==", session.uid)
    .limit(50)
    .get();

  const photos = await Promise.all(
    snapshot.docs
      .filter((doc) => !doc.get("deletedAt"))
      .map(async (doc) => ({
        photoId: doc.id,
        moderationStatus: String(doc.get("moderationStatus") ?? "pending"),
        url: await createPhotoReadUrl(String(doc.get("storagePath"))),
      })),
  );

  return Response.json({ photos }, { headers: { "cache-control": "no-store" } });
}

/** Uploads a photo through the server pipeline (private path, EXIF stripped). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const limit = consumeRateLimit(`photos:${session.uid}`, UPLOAD_LIMIT);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", { "retry-after": String(limit.retryAfterSeconds) });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "invalid_body");
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) return jsonError(400, "missing_photo");

  const validated = await validateAndNormalizePhoto(
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );
  if (!validated.ok) return jsonError(400, validated.error);

  const photoId = randomUUID();
  const path = await uploadPhoto(session.uid, photoId, validated.buffer, validated.mimeType);

  await getAdminDb().collection(COLLECTIONS.profilePhotos).doc(photoId).set({
    uid: session.uid,
    storagePath: path,
    moderationStatus: "pending",
    createdAt: FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  const url = await createPhotoReadUrl(path);
  return Response.json({ photoId, url, moderationStatus: "pending" }, { status: 201 });
}
