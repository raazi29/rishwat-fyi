import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootTestApp, createTestAdmin, createTestModerator } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let adminToken: string;
let moderatorToken: string;

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  adminToken = (await createTestAdmin(boot.db, boot.config)).token;
  moderatorToken = (await createTestModerator(boot.db, boot.config)).token;
});

afterAll(async () => {
  await boot.cleanup();
});

describe("GET /admin/stats/overview", () => {
  it("returns aggregate counts for an admin token", async () => {
    const res = await app.request("/admin/stats/overview", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reports: { total_reports: number } };
    expect(body.reports).toBeDefined();
    expect(typeof body.reports.total_reports).toBe("number");
  });

  it("returns 403 for a moderator token (stats is admin-only)", async () => {
    const res = await app.request("/admin/stats/overview", {
      headers: { authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});
