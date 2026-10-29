import { createHash } from "node:crypto";

/** Stable document ID for one direction of a like/pass pair. */
export function likeDocumentId(fromUid: string, toUid: string): string {
  return createHash("sha256")
    .update(JSON.stringify([fromUid, toUid]))
    .digest("hex");
}
