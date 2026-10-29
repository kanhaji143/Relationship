import "server-only";

import sharp from "sharp";

import { getAdminStorage } from "@/lib/firebase/admin/app";

export const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_READ_URL_TTL_MS = 15 * 60 * 1000;

export type PhotoValidationResult =
  | { ok: true; buffer: Buffer; mimeType: string }
  | { ok: false; error: "invalid_type" | "too_large" | "unreadable" };

export async function validateAndNormalizePhoto(
  input: Buffer,
  mimeType: string,
): Promise<PhotoValidationResult> {
  if (!ALLOWED_PHOTO_MIME.has(mimeType)) return { ok: false, error: "invalid_type" };
  if (input.byteLength === 0 || input.byteLength > MAX_PHOTO_BYTES) {
    return { ok: false, error: "too_large" };
  }

  try {
    // Re-encode through sharp to strip EXIF/metadata and normalize dimensions.
    const normalized = await sharp(input)
      .rotate() // honour EXIF orientation, then drop it
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .toFormat(mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg", {
        quality: 85,
      })
      .toBuffer();
    return { ok: true, buffer: normalized, mimeType };
  } catch {
    return { ok: false, error: "unreadable" };
  }
}

export function photoStoragePath(uid: string, photoId: string): string {
  return `users/${uid}/photos/${photoId}`;
}

export async function uploadPhoto(
  uid: string,
  photoId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const path = photoStoragePath(uid, photoId);
  const file = getAdminStorage().bucket().file(path);
  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    metadata: {
      metadata: {
        ownerUid: uid,
        photoId,
        moderationStatus: "pending",
      },
    },
  });
  return path;
}

export async function createPhotoReadUrl(path: string): Promise<string> {
  const [url] = await getAdminStorage()
    .bucket()
    .file(path)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + PHOTO_READ_URL_TTL_MS,
    });
  return url;
}

export async function deletePhoto(path: string): Promise<void> {
  await getAdminStorage().bucket().file(path).delete({ ignoreNotFound: true });
}
