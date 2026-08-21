import { users } from "@rishwat/database";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { jwtVerify, type JWTPayload } from "jose";
import { forbidden, unauthorized } from "../errors.js";
import type { AppEnv, AuthUser, Role } from "../env.js";

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toUser(payload: JWTPayload): AuthUser | null {
  const id = typeof payload.sub === "string" ? payload.sub : undefined;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const role = payload.role;
  if (!id || !email) return null;
  if (role !== "moderator" && role !== "admin") return null;
  return { id, email, role };
}

// Verifies a Bearer JWT (HS256) with the configured secret and puts the caller
// on the context as `user`. Requires `config` and `db` to be present on the
// context (injected by createApp).
//
// A valid signature only proves the token was minted by us; its role/active
// claims are a snapshot that can be up to 12h stale. So after the signature
// checks out we re-read the account's CURRENT state from the database, keyed on
// the token's `sub` (the user id), and treat that row — not the claims — as the
// source of truth. This is what makes session revocation immediate: deleting a
// user, flipping `is_active` to false, or demoting an admin to moderator all
// take effect on the very next request instead of lingering until token expiry.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = bearerToken(c.req.header("authorization"));
  if (!token) throw unauthorized("Missing bearer token");

  const secret = new TextEncoder().encode(c.get("config").jwtSecret);
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    throw unauthorized("Invalid or expired token");
  }

  const claims = toUser(payload);
  if (!claims) throw unauthorized("Invalid token payload");

  // One indexed primary-key lookup. Only authenticated /admin traffic reaches
  // here (a handful of staff), never the public read API, so this is not a hot
  // path — correctness over a sub-millisecond save, hence no cache.
  const [row] = await c
    .get("db")
    .select({ email: users.email, role: users.role, is_active: users.is_active })
    .from(users)
    .where(eq(users.id, claims.id))
    .limit(1);

  // Deleted (no row) or deactivated (is_active=false) => reject. A single
  // generic 401 that matches the bad-token message above deliberately does not
  // reveal which case occurred (deleted vs deactivated vs forged).
  if (!row || !row.is_active) throw unauthorized("Invalid or expired token");

  // Role comes from the DB row, so a demotion is enforced on the next request:
  // requireRole("admin") will then correctly 403 a just-demoted moderator.
  c.set("user", { id: claims.id, email: row.email, role: row.role });
  await next();
});

// Enforces a minimum role. `admin` implicitly satisfies `moderator`.
export function requireRole(role: Role) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) throw unauthorized("Authentication required");
    const satisfies = user.role === role || (role === "moderator" && user.role === "admin");
    if (!satisfies) throw forbidden("Insufficient role");
    await next();
  });
}
