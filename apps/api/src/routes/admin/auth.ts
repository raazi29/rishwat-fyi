import { users } from "@rishwat/database";
import { loginSchema } from "@rishwat/validation";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env.js";
import { badRequest, unauthorized } from "../../errors.js";
import { authRateLimit } from "../../middleware/rate-limit.js";
import { issueToken, verifyPassword } from "../../services/auth.service.js";

export const adminAuth = new Hono<AppEnv>();

// Brute-force protection on login (no-op under tests). Uses the dedicated auth
// limiter rather than the strict submission limiter — see rate-limit.ts for why.
adminAuth.use("*", authRateLimit);

// POST /login — exchange email + password for a 12h Bearer JWT. Unknown email
// and wrong password return the same generic 401 so account existence is not
// leaked. `last_login_at` is stamped on success.
adminAuth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body === null) throw badRequest("Invalid JSON body");
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Validation failed", parsed.error.flatten());
  const { email, password } = parsed.data;

  const db = c.get("db");
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      password_hash: users.password_hash,
      is_active: users.is_active,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Timing mitigation: always run bcrypt (~60ms cost 10) even when the user
  // does not exist, so "unknown email" vs "wrong password" cannot be
  // distinguished by response time (see audit MEDIUM-4).
  const DUMMY_BCRYPT_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  if (!user || !user.is_active) {
    await verifyPassword(password, DUMMY_BCRYPT_HASH);
    throw unauthorized("Invalid credentials");
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw unauthorized("Invalid credentials");

  await db.execute(sql`update users set last_login_at = now() where id = ${user.id}::uuid`);

  const token = await issueToken(
    { id: user.id, email: user.email, role: user.role },
    c.get("config").jwtSecret,
  );
  return c.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
