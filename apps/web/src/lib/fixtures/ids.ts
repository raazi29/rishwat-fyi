/**
 * SAMPLE DATA — deterministic identifiers for the bundled sample dataset.
 *
 * The bundled fixtures are illustrative sample data (see the domain modules).
 * They must be byte-for-byte stable across renders — no `Math.random`, no
 * `Date.now` — yet `@rishwat/validation`'s `reportSubmissionSchema` validates
 * `service_id` / `state_id` / `district_id` as UUIDs. So every sample id is a
 * stable RFC-4122 v4-shaped UUID derived from a seed string by a small
 * deterministic hash: the same seed always yields the same id.
 *
 * These are illustrative sample identifiers, never database primary keys.
 */

/** xmur3 — a tiny deterministic string hash producing a 32-bit stream. */
function hashStream(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** Left-most `width` hex digits of a 32-bit unsigned integer. */
function hex(value: number, width: number): string {
  return (value >>> 0).toString(16).padStart(8, "0").slice(0, width);
}

/**
 * Stable RFC-4122 v4-shaped UUID for `seed`. Version nibble is `4` and the
 * variant nibble is one of `8|9|a|b`, so the result passes `z.string().uuid()`.
 */
export function sampleId(seed: string): string {
  const next = hashStream(seed);
  const timeLow = hex(next(), 8);
  const timeMid = hex(next(), 4);
  const timeHigh = `4${hex(next(), 3)}`;
  const variantNibble = ((next() & 0x3) | 0x8).toString(16);
  const clockSeq = `${variantNibble}${hex(next(), 3)}`;
  const node = `${hex(next(), 8)}${hex(next(), 4)}`;
  return `${timeLow}-${timeMid}-${timeHigh}-${clockSeq}-${node}`;
}
