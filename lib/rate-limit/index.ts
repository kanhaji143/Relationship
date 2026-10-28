import { consumeRateLimit, type RateLimitResult } from "./fixed-window";

/** Shared auth limits: 10 attempts per IP per 5 minutes. */
export const AUTH_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 } as const;

export function checkAuthRateLimit(key: string, now?: number): RateLimitResult {
  return consumeRateLimit(`auth:${key}`, { ...AUTH_RATE_LIMIT, now });
}
