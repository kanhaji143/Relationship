/** Request metadata helpers for route handlers. */

const MAX_IP_LENGTH = 64;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, MAX_IP_LENGTH);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, MAX_IP_LENGTH) : "unknown";
}

export function requestOrigin(request: Request): string {
  // Prefer the Host header: Next normalizes `request.url` to localhost, which
  // must still be comparable to the browser's Origin header in production.
  const host = request.headers.get("host");
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto = forwardedProto === "https" ? "https" : "http";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 && token.length <= 8192 ? token : null;
}
