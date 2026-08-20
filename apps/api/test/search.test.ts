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

describe("GET /search", () => {
  it("returns matching services for q=licence (seeded data)", async () => {
    const res = await app.request("/search?q=licence");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: { slug: string }[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("returns paginated results for an empty query", async () => {
    const res = await app.request("/search");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  it("rejects per_page above the maximum with 400", async () => {
    const res = await app.request("/search?per_page=1000");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });
});
