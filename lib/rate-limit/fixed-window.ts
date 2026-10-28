/**
 * Fixed-window rate limiter.
 *
 * Single-instance, in-memory: suitable for local dev and as a safe default.
 * Production must use a shared store (Firestore/Redis) so limits hold across
 * instances — tracked as a Phase 1 follow-up.
 */

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(key);
  const bucket =
    !existing || existing.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, options.limit - bucket.count);
  return {
    allowed: bucket.count <= options.limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Test helper and dev escape hatch. */
export function resetRateLimits(): void {
  buckets.clear();
}
