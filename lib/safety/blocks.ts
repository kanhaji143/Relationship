import { createHash } from "node:crypto";

/**
 * Deterministic one-way block id, so blocking the same person twice is
 * idempotent (and the pair order stays meaningful: A→B ≠ B→A).
 */
export function blockDocumentId(blockerUid: string, blockedUid: string): string {
  return createHash("sha256")
    .update(JSON.stringify([blockerUid, blockedUid]))
    .digest("hex");
}
