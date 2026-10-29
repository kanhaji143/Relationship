import "server-only";

import { getAdminStorage } from "@/lib/firebase/admin/app";

export const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_READ_URL_TTL_MS = 15 * 60 * 1000;

export type PhotoValidationResult =
  | { ok: true; buffer: Buffer; mimeType: string }
  | { ok: false; error: "invalid_type" | "too_large" | "unreadable" };

function hasValidMagic(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === "image/jpeg")
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png")
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  if (mimeType === "image/webp")
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export async function validateAndNormalizePhoto(
  input: Buffer,
  mimeType: string,
): Promise<PhotoValidationResult> {
  if (!ALLOWED_PHOTO_MIME.has(mimeType)) return { ok: false, error: "invalid_type" };
  if (input.byteLength === 0 || input.byteLength > MAX_PHOTO_BYTES) {
    return { ok: false, error: "too_large" };
  }
  if (!hasValidMagic(input, mimeType)) return { ok: false, error: "unreadable" };

  try {
    const stripped = stripMetadata(input, mimeType);
    return { ok: true, buffer: stripped, mimeType };
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
        metadataStripped: "true",
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

// ---------------------------------------------------------------------------
// Pure-JavaScript metadata stripping (no native dependencies, so the Firebase
// Hosting/Functions bundle does not need platform-specific binaries).
// ---------------------------------------------------------------------------

const STRIPPED_PNG_CHUNKS = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "caBX"]);

function stripJpeg(buffer: Buffer): Buffer {
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      for (let j = i; j < buffer.length; j++) out.push(buffer[j]);
      break;
    }
    while (i < buffer.length && buffer[i] === 0xff) i++;
    if (i >= buffer.length) break;
    const marker = buffer[i++];
    if (marker === 0xd9) {
      out.push(0xff, 0xd9);
      break;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(0xff, marker);
      continue;
    }
    if (i + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(i);
    const segmentEnd = i + length;
    if (marker === 0xda) {
      out.push(0xff, marker);
      for (let j = i; j < segmentEnd && j < buffer.length; j++) out.push(buffer[j]);
      i = segmentEnd;
      while (i < buffer.length) {
        if (buffer[i] === 0xff) {
          let j = i;
          while (j < buffer.length && buffer[j] === 0xff) j++;
          if (j >= buffer.length) break;
          const nextMarker = buffer[j];
          if (nextMarker === 0xd9) {
            out.push(0xff, 0xd9);
            i = j + 1;
            break;
          }
          if (nextMarker >= 0xd0 && nextMarker <= 0xd7) {
            for (let k = i; k <= j; k++) out.push(buffer[k]);
            i = j + 1;
            continue;
          }
          break;
        }
        out.push(buffer[i]);
        i++;
      }
      break;
    }
    if (marker === 0xe1) {
      i = segmentEnd;
      continue;
    }
    out.push(0xff, marker);
    for (let j = i; j < segmentEnd && j < buffer.length; j++) out.push(buffer[j]);
    i = segmentEnd;
  }
  return Buffer.from(out);
}

function stripPng(buffer: Buffer): Buffer {
  const signature = buffer.subarray(0, 8);
  const out: Buffer[] = [Buffer.from(signature)];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buffer.length) break;
    if (!STRIPPED_PNG_CHUNKS.has(type)) {
      out.push(Buffer.from(buffer.subarray(offset, chunkEnd)));
    }
    offset = chunkEnd;
    if (type === "IEND") break;
  }
  return Buffer.concat(out);
}

function stripWebp(buffer: Buffer): Buffer {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return buffer;
  }
  const out: Buffer[] = [Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")];
  let offset = 12;
  const total = buffer.length;
  while (offset + 8 <= total) {
    const fourcc = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset;
    const chunkEnd = offset + 8 + size + (size % 2);
    if (chunkEnd > total) break;
    if (fourcc !== "EXIF" && fourcc !== "XMP ") {
      out.push(Buffer.from(buffer.subarray(chunkStart, chunkEnd)));
    }
    offset = chunkEnd;
  }
  const bodyLength = out.slice(1).reduce((sum, chunk) => sum + chunk.length, 0) + 4;
  out[1].writeUInt32LE(bodyLength, 0);
  return Buffer.concat(out);
}

function stripMetadata(buffer: Buffer, mimeType: string): Buffer {
  if (mimeType === "image/jpeg") return stripJpeg(buffer);
  if (mimeType === "image/png") return stripPng(buffer);
  if (mimeType === "image/webp") return stripWebp(buffer);
  return buffer;
}
