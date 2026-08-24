import type { Db } from "@rishwat/database";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { unauthorized } from "../errors.js";
import { execRows } from "../utils/sql.js";

export interface AuthUserRow {
  id: string;
  email: string;
  name: string | null;
  role: "moderator" | "admin";
}

/** bcrypt hash (cost 10). PII rule: only the hash is ever persisted. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Upsert a staff user keyed on the case-insensitive email. On conflict the
 * password, role and active flag are refreshed, which makes the create-admin
 * script idempotent (re-running it rotates the password rather than failing).
 */
export async function createUser(
  db: Db,
  opts: { email: string; password: string; name?: string; role?: "moderator" | "admin" },
): Promise<AuthUserRow> {
  const passwordHash = await hashPassword(opts.password);
  const role = opts.role ?? "moderator";
  const [row] = await execRows<AuthUserRow>(
    db,
    sql`
      insert into users (email, name, password_hash, role, is_active)
      values (${opts.email.toLowerCase()}, ${opts.name ?? null}, ${passwordHash}, ${role}::role, true)
      on conflict (email) do update
        set password_hash = ${passwordHash}, role = ${role}::role, is_active = true
      returning id::text as id, email, name, role
    `,
  );
  if (!row) throw new Error("User upsert returned no row");
  return row;
}

/** Sign a 12h HS256 JWT; `sub` is the user id, with email+role as claims. */
export async function issueToken(
  user: { id: string; email: string; role: string },
  secret: string,
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
}

/** Verify a JWT and return the caller identity, or throw a 401. */
export async function verifyToken(token: string, secret: string) {
  const key = new TextEncoder().encode(secret);
  try {
    // Pin to HS256 to prevent algorithm confusion attacks (alg:none, RS256 with
    // the symmetric secret used as a public key, etc.). jose rejects mismatches.
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload.sub || !payload.email || !payload.role) throw new Error("Invalid payload");
    return { id: payload.sub, email: payload.email as string, role: payload.role as string };
  } catch {
    throw unauthorized("Invalid or expired token");
  }
}
