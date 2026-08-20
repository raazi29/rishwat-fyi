import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { tooMany } from "../errors.js";
import type { AppEnv } from "../env.js";

// Simple in-memory fixed-window rate limiter. No external dependency; state is
// per-process (fine for a single API instance — swap for a shared store when
// horizontally scaling). Client key comes from proxy/CDN forwarding headers.

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

function clientKey(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = c.req.header("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

export function rateLimiter(opts: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  return createMiddleware<AppEnv>(async (c, next) => {
    // Read the toggle at request time — the limiters are module-level constants
    // but config is injected per request, so tests (rateLimit.enabled = false)
    // turn them into no-ops without touching the exported instances.
    const config = c.get("config");
    if (config && !config.rateLimit.enabled) {
      await next();
      return;
    }

    const now = Date.now();
    const key = clientKey(c);

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    // Bound memory: occasionally drop expired buckets.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }

    c.header("X-RateLimit-Limit", String(opts.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.limit - bucket.count)));

    if (bucket.count > opts.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header("Retry-After", String(retryAfter));
      throw tooMany("Rate limit exceeded", retryAfter);
    }

    await next();
  });
}

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** Sensitive write endpoints (e.g. report submission): 3 per hour. */
export const strictRateLimit = rateLimiter({ limit: 3, windowMs: HOUR });
/** General read endpoints: 60 per minute. */
export const standardRateLimit = rateLimiter({ limit: 60, windowMs: MINUTE });
/** Evidence uploads: 10 per hour. */
export const evidenceRateLimit = rateLimiter({ limit: 10, windowMs: HOUR });
