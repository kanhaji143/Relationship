import { createHash } from "node:crypto";

/**
 * Deterministic, non-reversible key for the `emailLookup` collection.
 * The raw email never becomes a document id.
 */
export function emailLookupKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");
}
