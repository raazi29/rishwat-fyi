import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Base36 alphabet — lowercase digits+letters — so ids match the validation
// package's publicIdSchema: /^R-[a-z0-9]{8}$/.
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

/** SHA-256 hex digest. PII rule: only digests are ever persisted, never raw values. */
export function sha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Keyed HMAC-SHA256 hex digest. Use this instead of {@link sha256Hex} for any
 * value drawn from a small, enumerable space — above all IP addresses. A bare
 * SHA-256 of an IPv4 address is effectively reversible: the entire
 * ~4.3-billion-address space can be precomputed into a lookup table in minutes,
 * so an unkeyed digest leaks the raw IP. Keying the hash with a server-side
 * secret the attacker does not hold makes that precomputation impossible.
 *
 * The key must be kept secret and stable — rotating it re-buckets every future
 * digest, so old and new hashes of the same input no longer match (any existing
 * ip_hash / device_fingerprint_hash values would need rehashing).
 */
export function hmacHex(key: string, input: string): string {
  return createHmac("sha256", key).update(input).digest("hex");
}

/** URL-safe random token (default 24 bytes → 32-char base64url). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Constant-time comparison of two hex digests. Use this whenever a
 * submitter-supplied secret is checked against a stored digest, so response
 * timing never leaks how much of the value matched.
 */
export function digestEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Public report identifier: "R-" + 8 base36 chars, e.g. "R-a1b2c3d4". */
export function publicReportId(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) {
    out += BASE36.charAt(b % 36);
  }
  return `R-${out}`;
}
