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
// on the context as `user`. Requires `config` to be present on the context
// (injected by createApp).
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

  const user = toUser(payload);
  if (!user) throw unauthorized("Invalid token payload");
  c.set("user", user);
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
