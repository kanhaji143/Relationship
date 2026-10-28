import { afterEach, describe, expect, it } from "vitest";

import { consumeRateLimit, resetRateLimits } from "./fixed-window";

afterEach(() => {
  resetRateLimits();
});

describe("consumeRateLimit", () => {
  it("allows requests up to the limit", () => {
    const options = { limit: 2, windowMs: 1000, now: 1000 };
    expect(consumeRateLimit("a", options).allowed).toBe(true);
    expect(consumeRateLimit("a", options).allowed).toBe(true);
  });

  it("blocks the request after the limit and reports remaining 0", () => {
    const options = { limit: 1, windowMs: 1000, now: 1000 };
    consumeRateLimit("a", options);
    const blocked = consumeRateLimit("a", options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("isolates keys", () => {
    const options = { limit: 1, windowMs: 1000, now: 1000 };
    consumeRateLimit("a", options);
    expect(consumeRateLimit("b", options).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    consumeRateLimit("a", { limit: 1, windowMs: 1000, now: 1000 });
    expect(consumeRateLimit("a", { limit: 1, windowMs: 1000, now: 2000 }).allowed).toBe(true);
  });

  it("uses Date.now when no clock is injected", () => {
    expect(consumeRateLimit("clock", { limit: 1, windowMs: 60_000 }).allowed).toBe(true);
  });
});
