import { describe, expect, it } from "vitest";

import sharp from "sharp";

import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES, validateAndNormalizePhoto } from "./server";

describe("validateAndNormalizePhoto", () => {
  it("normalizes a valid JPEG and strips metadata", async () => {
    const input = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "red" },
    })
      .jpeg()
      .toBuffer();

    const result = await validateAndNormalizePhoto(input, "image/jpeg");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.buffer.byteLength).toBeGreaterThan(0);
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.exif).toBeUndefined();
    }
  });

  it("rejects disallowed MIME types", async () => {
    const input = Buffer.from("not an image");
    const result = await validateAndNormalizePhoto(input, "image/gif");
    expect(result).toEqual({ ok: false, error: "invalid_type" });
  });

  it("rejects empty and oversized inputs", async () => {
    expect(await validateAndNormalizePhoto(Buffer.alloc(0), "image/jpeg")).toMatchObject({
      ok: false,
      error: "too_large",
    });
    const oversized = Buffer.alloc(MAX_PHOTO_BYTES + 1);
    expect(await validateAndNormalizePhoto(oversized, "image/jpeg")).toMatchObject({
      ok: false,
      error: "too_large",
    });
  });

  it("rejects corrupt image data", async () => {
    const result = await validateAndNormalizePhoto(Buffer.from("not-an-image"), "image/jpeg");
    expect(result).toEqual({ ok: false, error: "unreadable" });
  });

  it("strips EXIF metadata from a JPEG", async () => {
    const input = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "blue" },
    })
      .jpeg()
      .withExif({ IFD0: { ImageDescription: "secret" } })
      .toBuffer();

    const result = await validateAndNormalizePhoto(input, "image/jpeg");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.exif).toBeUndefined();
    }
  });

  it("exposes the configured allow-list and size limit", () => {
    expect(ALLOWED_PHOTO_MIME.has("image/jpeg")).toBe(true);
    expect(ALLOWED_PHOTO_MIME.has("image/png")).toBe(true);
    expect(ALLOWED_PHOTO_MIME.has("image/webp")).toBe(true);
    expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024);
  });
});
