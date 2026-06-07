/**
 * In-memory sliding-window rate limiter.
 *
 * Lightweight, no external deps — fine for single-instance Node deployments.
 * For multi-instance (Vercel + multiple regions), swap to Upstash Redis later.
 */

import type { NextRequest } from "next/server";

interface Bucket {
  /** Timestamps (ms) of recent hits inside the window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Background cleanup so the Map doesn't grow forever
let lastSweep = Date.now();
function maybeSweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > 5 * 60_000) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check (and record) a hit against the bucket identified by `key`.
 * Returns ok=false when the request must be blocked.
 */
export function rateLimit(
  key: string,
  options: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop hits that left the window
  bucket.hits = bucket.hits.filter((t) => now - t < options.windowMs);

  if (bucket.hits.length >= options.max) {
    const oldest = bucket.hits[0];
    const retryAfterMs = options.windowMs - (now - oldest);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: options.max - bucket.hits.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client IP extraction. Trusts the standard proxy headers
 * (x-forwarded-for, x-real-ip). Falls back to "unknown" so we still rate-limit
 * the aggregate when no IP is available.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
