import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

/**
 * Trusted-proxy aware client IP resolution.
 *
 * THREAT MODEL. The address returned here becomes `ip_hash` on a report row, and
 * `count(distinct ip_hash) >= 2` is the ONLY independence check gating both
 * auto-corroboration and public aggregate publication. It is also the rate-limit
 * bucket key for report submission and admin login. Anything a client can freely
 * choose therefore lets one person manufacture a "corroborated" public statistic
 * and walk past every abuse limit.
 *
 * `x-forwarded-for` is client-controlled unless a proxy you operate appends to it,
 * so we never read it on faith. `TRUSTED_PROXY_HOPS` (see config.ts) states how
 * many reverse proxies you actually run in front of this API:
 *
 *   0  no proxy. Forwarding headers are ignored ENTIRELY; only the real TCP peer
 *      address counts. This is the safe default.
 *   n  n trusted proxies. Each appends the address it saw, so the entry `n` from
 *      the RIGHT is the one written by your outermost trusted proxy — i.e. the
 *      last value the client could not forge. Entries further left are attacker
 *      controlled and must never be used.
 *
 * Only the sha256 digest of the result is ever persisted (PII rule, see
 * utils/hashing.ts) — this helper returns the raw value solely so the caller can
 * hash it.
 */

/** `TRUSTED_PROXY_HOPS` value meaning "no reverse proxy — trust only the socket". */
export const NO_TRUSTED_PROXIES = 0;

/**
 * The real TCP peer address, or null when it cannot be determined. Under vitest
 * the app is driven via `app.request(...)` with no socket at all, so `getConnInfo`
 * throws — an unidentifiable client is a null client, never a shared guess.
 */
function socketAddress(c: Context): string | null {
  try {
    const address = getConnInfo(c).remote.address;
    return address !== undefined && address !== "" ? address : null;
  } catch {
    return null;
  }
}

/**
 * Pick the entry `hops` positions from the right of an `x-forwarded-for` list.
 *
 * A list SHORTER than `hops` means the request did not traverse the expected
 * chain (a direct hit, or a proxy that overwrites rather than appends). The
 * remaining entries are then all client-written, so there is nothing
 * trustworthy here and we return null rather than falling back to the leftmost
 * value: `parts[0]` is the most *specific* entry but also the one an attacker
 * chooses outright, and handing it back would let anyone rotate the header to
 * forge ip_hash diversity and walk past every rate limit. Falling through to the
 * socket address (see `clientIp`) is the correct, un-forgeable answer.
 */
function forwardedForHop(header: string, hops: number): string | null {
  const parts = header
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  const index = parts.length - hops;
  if (index < 0) return null;
  const candidate = parts[index];
  if (!candidate) return null;
  // Basic IP sanity: must look like v4 or v6. Rejects tokens like "unknown"
  // or attacker junk that would otherwise become a distinct ip_hash bucket.
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(candidate) && !/^[0-9a-fA-F:]+$/.test(candidate)) return null;
  if (parts.length > hops + 5) return null; // excessive chain → likely injection
  return candidate;
}

/**
 * Resolve the client IP under the configured trust model.
 *
 * @param c    request context
 * @param hops `config.trustedProxyHops` — number of reverse proxies you operate
 * @returns the client address, or null when no trustworthy address exists
 */
export function clientIp(c: Context, hops: number): string | null {
  if (hops <= NO_TRUSTED_PROXIES) {
    // No proxy is trusted: forwarding headers are pure client input. Ignore them.
    return socketAddress(c);
  }

  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const hop = forwardedForHop(xff, hops);
    if (hop) return hop;
  }

  // Deliberately no `cf-connecting-ip` fallback. Cloudflare overwrites that
  // header at its edge — but it also always appends to x-forwarded-for, so if we
  // reached this line the request did NOT come through Cloudflare and any
  // cf-connecting-ip present was written by the client. The branch was therefore
  // only ever reachable in exactly the case where the value is forged.
  return socketAddress(c);
}
