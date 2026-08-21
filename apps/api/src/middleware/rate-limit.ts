import { createMiddleware } from "hono/factory";
import { DEFAULT_TRUSTED_PROXY_HOPS } from "../config.js";
import { tooMany } from "../errors.js";
import type { AppEnv } from "../env.js";
import { clientIp } from "../utils/client-ip.js";

// Simple in-memory fixed-window rate limiter. No external dependency; state is
// per-process (fine for a single API instance — swap for a shared store when
// horizontally scaling).
//
// The bucket key is the trusted client IP (see utils/client-ip.ts): forwarding
// headers are only consulted as far as `config.trustedProxyHops` allows. If the
// key were client-controlled, rotating a fake `x-forwarded-for` would defeat both
// the 3-per-hour report limit and the admin-login brute-force limit outright.

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

/**
 * Shared bucket for clients whose address cannot be established (no socket peer,
 * no trusted forwarding header). They are limited together rather than let
 * through — an unidentifiable client must not get a free lane.
 */
export const UNKNOWN_CLIENT_KEY = "unknown";

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
    // Hops must also be read per request for the same reason as the toggle above:
    // these limiters are module-level constants, so there is no config at import
    // time. Missing config (unit tests mounting the middleware bare) = trust nothing.
    const hops = config?.trustedProxyHops ?? DEFAULT_TRUSTED_PROXY_HOPS;
    const key = clientIp(c, hops) ?? UNKNOWN_CLIENT_KEY;

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
/**
 * Moderator/admin login. Deliberately NOT the same bucket as report submission:
 * this needs to stop credential stuffing without locking a legitimate operator
 * out for an hour over a couple of typos. The key is the client IP, so a whole
 * office behind one NAT shares this bucket — 3/hour would be unusable there.
 * 10 attempts per 15 minutes still makes online password guessing hopeless
 * (bcrypt cost 10 already makes each attempt expensive) while leaving room for
 * ordinary human error.
 */
export const authRateLimit = rateLimiter({ limit: 10, windowMs: 15 * MINUTE });
