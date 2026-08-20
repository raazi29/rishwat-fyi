import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootTestApp, createTestAdmin } from "./helpers.js";

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
