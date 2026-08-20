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

describe("GET /services", () => {
  it("returns a paginated list of services", async () => {
    const res = await app.request("/services");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("returns full detail for driving-licence including the official fee", async () => {
    const res = await app.request("/services/driving-licence");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      slug: string;
      official: { fee_inr: string | null };
    };
    expect(body.slug).toBe("driving-licence");
    expect(body.official).toBeDefined();
    // Seeded driving-licence has an official fee of "1200.00".
    expect(body.official.fee_inr).not.toBeNull();
  });

  it("returns 404 for an unknown service slug", async () => {
    const res = await app.request("/services/nonexistent");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});
