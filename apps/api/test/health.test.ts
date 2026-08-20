import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootTestApp } from "./helpers.js";

let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ app, cleanup } = await bootTestApp());
});

afterAll(async () => {
  await cleanup();
});

describe("GET /health", () => {
  it("returns ok with database status and an ISO timestamp", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; database: string; time: string };
    expect(body.status).toBe("ok");
    expect(["up", "down"]).toContain(body.database);
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  it("returns database: up when the test DB is reachable", async () => {
    const res = await app.request("/health");
    const body = (await res.json()) as { database: string };
    // The test DB is expected to be reachable in CI / local docker.
    expect(body.database).toBe("up");
  });
});

describe("unknown routes", () => {
  it("returns a structured 404", async () => {
    const res = await app.request("/no-such-route");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});
