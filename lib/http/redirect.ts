/**
 * Open-redirect protection for post-auth navigation.
 * Only same-site absolute paths are allowed.
 */

export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/account",
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(candidate)) return fallback;
  return candidate;
}
