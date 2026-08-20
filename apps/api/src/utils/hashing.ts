import { createHash, randomBytes } from "node:crypto";

// Base36 alphabet — lowercase digits+letters — so ids match the validation
// package's publicIdSchema: /^R-[a-z0-9]{8}$/.
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

/** SHA-256 hex digest. PII rule: only digests are ever persisted, never raw values. */
export function sha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/** URL-safe random token (default 24 bytes → 32-char base64url). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
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
