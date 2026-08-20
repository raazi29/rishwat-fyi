import { cookies } from "next/headers";

import type { AdminRole } from "@/lib/api";

/**
 * Session cookie handling for the moderator / admin surface.
 *
 * SECURITY MODEL
 * --------------
 * The API is the ONLY authority on this JWT. It is signed HS256 with a secret
 * this app does not hold, so we deliberately do NOT verify the signature here.
 * We decode the payload solely to read `role` and `exp` (and, when the issuer
 * includes them, `email` / `name`) for UI purposes — choosing which screen to
 * render and treating the session as expired at the right time. Every
 * privileged call still sends the raw token to the API, which authenticates and
 * authorises it independently; nothing here stands in for that server check.
 *
 * The token lives in a single httpOnly cookie so it never reaches client
 * JavaScript, and it is scoped to `/admin` so the public site never receives
 * it. This module imports `next/headers`, so it can never be pulled into a
 * client bundle.
 */

export const SESSION_COOKIE = "rishwat_admin_session";

const TWELVE_HOURS_IN_SECONDS = 12 * 60 * 60;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export interface AdminSession {
  /** The raw JWT. Sent to the API on every privileged call; never exposed to the client. */
  token: string;
  role: AdminRole;
  /** Unix time (seconds) at which the token expires, per its `exp` claim. */
  expiresAt: number;
  /** Read from the token for display only; absent when the issuer omits it. */
  email: string | null;
  name: string | null;
  subject: string | null;
}

interface RawJwtClaims {
  role?: unknown;
  exp?: unknown;
  email?: unknown;
  name?: unknown;
  sub?: unknown;
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "moderator";
}

/**
 * Decode a JWT payload WITHOUT verifying its signature. Returns `null` when the
 * token is malformed or is missing the `role` / `exp` claims the UI relies on.
 * The API — not this function — is the authority on the token's validity.
 */
export function decodeSession(token: string): AdminSession | null {
  const segments = token.split(".");
  if (segments.length < 2) return null;
  const payloadSegment = segments[1];
  if (!payloadSegment) return null;

  let claims: RawJwtClaims;
  try {
    const json = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    claims = parsed as RawJwtClaims;
  } catch {
    return null;
  }

  if (!isAdminRole(claims.role)) return null;
  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) return null;

  return {
    token,
    role: claims.role,
    expiresAt: claims.exp,
    email: typeof claims.email === "string" ? claims.email : null,
    name: typeof claims.name === "string" ? claims.name : null,
    subject: typeof claims.sub === "string" ? claims.sub : null,
  };
}

export function isExpired(expiresAt: number, nowMs: number = Date.now()): boolean {
  return nowMs >= expiresAt * 1000;
}

/** Read the raw token from the cookie, or `null` when it is absent. */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * The current session, or `null` when there is no token or it has expired.
 * Expiry is checked against the token's own `exp` claim; the API remains the
 * final authority and will reject any token it considers invalid.
 */
export async function readSession(): Promise<AdminSession | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const session = decodeSession(token);
  if (!session) return null;
  if (isExpired(session.expiresAt)) return null;
  return session;
}

/**
 * Persist the JWT in an httpOnly cookie. Called only from a server action.
 * Flags: httpOnly (never readable by client JS), sameSite=lax (survives the
 * post-login redirect and resists cross-site POST CSRF), path=/admin (the
 * public site never receives the token). `secure` is enabled in production;
 * it is intentionally omitted in development so the cookie works over
 * http://localhost, where the browser drops Secure cookies.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  const decoded = decodeSession(token);
  const remaining = decoded ? decoded.expiresAt - Math.floor(Date.now() / 1000) : TWELVE_HOURS_IN_SECONDS;

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/admin",
    maxAge: remaining > 0 ? remaining : TWELVE_HOURS_IN_SECONDS,
  });
}

/** Clear the session cookie (sign out). Called only from a server action. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}
