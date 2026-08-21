import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { bootTestApp, createTestAdmin } from "./helpers.js";
import { hashPassword, issueToken } from "../src/services/auth.service.js";
import { exec, execRows } from "../src/utils/sql.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let adminToken: string;

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  adminToken = (await createTestAdmin(boot.db, boot.config)).token;
});

afterAll(async () => {
  await boot.cleanup();
});

function login(body: unknown) {
  return app.request("/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /admin/auth/login", () => {
  it("returns a token for correct credentials", async () => {
    const res = await login({ email: "admin@test.com", password: "admin123456" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { role: string } };
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
    expect(body.user.role).toBe("admin");
  });

  it("returns 401 for a wrong password", async () => {
    const res = await login({ email: "admin@test.com", password: "wrong-password-123" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for an unknown email", async () => {
    const res = await login({ email: "nobody@test.com", password: "some-password-123" });
    expect(res.status).toBe(401);
  });
});

describe("admin auth guard", () => {
  it("returns 401 for /admin/queue without a token", async () => {
    const res = await app.request("/admin/queue");
    expect(res.status).toBe(401);
  });

  it("returns 200 for /admin/queue with a valid admin token", async () => {
    const res = await app.request("/admin/queue", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });
});


// Creates (or resets — so the suite is safe to re-run against a persistent test
// DB) a dedicated staff account and mints a valid 12h token for it. Each
// revocation test below uses its own email so the cases cannot interfere.
async function createRevocableUser(opts: { email: string; role: "moderator" | "admin" }) {
  const passwordHash = await hashPassword("revoke-test-123456");
  const [user] = await execRows<{ id: string; email: string; role: string }>(
    boot.db,
    sql`
      INSERT INTO users (email, name, password_hash, role, is_active)
      VALUES (${opts.email}, 'Revocation Test', ${passwordHash}, ${opts.role}::role, true)
      ON CONFLICT (email) DO UPDATE
        SET role = ${opts.role}::role, is_active = true, password_hash = ${passwordHash}
      RETURNING id::text AS id, email, role
    `,
  );
  if (!user) throw new Error("createRevocableUser: insert returned no row");
  const token = await issueToken(
    { id: user.id, email: user.email, role: user.role },
    boot.config.jwtSecret,
  );
  return { id: user.id, token };
}

// These lock in immediate session revocation: a token that was valid a moment
// ago must stop working the instant the account behind it is deactivated,
// demoted or deleted — without waiting for the 12h JWT to expire. requireAuth
// re-reads the user row on every admin request and treats the DB, not the token
// claims, as the source of truth.
describe("admin session revocation (DB is the source of truth)", () => {
  it("rejects a still-valid token once the user is deactivated (is_active=false)", async () => {
    const { id, token } = await createRevocableUser({
      email: "revoke-deactivated@test.com",
      role: "moderator",
    });

    // The freshly minted token works before any change.
    const before = await app.request("/admin/queue", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(before.status).toBe(200);

    // Deactivate the account, then reuse the SAME token.
    await exec(boot.db, sql`UPDATE users SET is_active = false WHERE id = ${id}::uuid`);

    const after = await app.request("/admin/queue", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(after.status).toBe(401);
  });

  it("drops admin privileges (403) when the user is demoted admin -> moderator", async () => {
    const { id, token } = await createRevocableUser({
      email: "revoke-demoted@test.com",
      role: "admin",
    });

    // The admin token can reach an admin-only route (/admin/stats/* is admin-only).
    const before = await app.request("/admin/stats/overview", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(before.status).toBe(200);

    // Demote in the DB; the token itself still carries role=admin.
    await exec(boot.db, sql`UPDATE users SET role = 'moderator'::role WHERE id = ${id}::uuid`);

    const after = await app.request("/admin/stats/overview", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(after.status).toBe(403);
  });

  it("rejects a still-valid token once the user is deleted", async () => {
    const { id, token } = await createRevocableUser({
      email: "revoke-deleted@test.com",
      role: "moderator",
    });

    // The freshly minted token works before deletion.
    const before = await app.request("/admin/queue", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(before.status).toBe(200);

    await exec(boot.db, sql`DELETE FROM users WHERE id = ${id}::uuid`);

    const after = await app.request("/admin/queue", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(after.status).toBe(401);
  });
});
