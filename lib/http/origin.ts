/**
 * Same-origin checks for state-changing requests.
 *
 * Browsers always send `Origin` on cross-site POSTs. We reject missing or
 * foreign origins, allowing only the request's own origin and explicitly
 * configured app origins (for proxy/App Hosting host differences).
 */

export type OriginPolicy = {
  requestOrigin: string;
  allowedOrigins?: readonly string[];
};

function normalize(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string | null, policy: OriginPolicy): boolean {
  if (!origin) return false;

  const candidate = normalize(origin);
  if (!candidate) return false;

  const allowed = new Set<string>();
  const requestOrigin = normalize(policy.requestOrigin);
  if (requestOrigin) allowed.add(requestOrigin);
  for (const entry of policy.allowedOrigins ?? []) {
    const normalized = normalize(entry);
    if (normalized) allowed.add(normalized);
  }

  return allowed.has(candidate);
}
