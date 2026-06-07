import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("allows N requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, { max: 5, windowMs: 60_000 });
      expect(r.ok).toBe(true);
    }
  });

  it("blocks the (N+1)th request", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, { max: 3, windowMs: 60_000 });
    const blocked = rateLimit(key, { max: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("returns remaining count correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(key, { max: 5, windowMs: 60_000 });
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit(key, { max: 5, windowMs: 60_000 });
    expect(r2.remaining).toBe(3);
  });
});
