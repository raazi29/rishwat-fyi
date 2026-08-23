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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("GET /services", () => {
  it("returns a paginated list of services", async () => {
    const res = await app.request("/services");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: { id: string; slug: string }[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    // Every list item must expose the service UUID (usable as report service_id)
    // alongside its slug — the contract the citizen reporting flow depends on.
    for (const item of body.items) {
      expect(item.id).toMatch(UUID_RE);
      expect(typeof item.slug).toBe("string");
    }
  });

  it("preserves the total when the requested page is beyond the result set", async () => {
    const firstPage = await app.request("/services?per_page=1");
    expect(firstPage.status).toBe(200);
    const firstBody = (await firstPage.json()) as { total: number };
    expect(firstBody.total).toBeGreaterThan(0);

    const beyond = await app.request("/services?page=999999&per_page=1");
    expect(beyond.status).toBe(200);
    const beyondBody = (await beyond.json()) as { total: number; items: unknown[] };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBe(firstBody.total);
  });

  it("returns full detail for driving-licence including the official fee", async () => {
    const res = await app.request("/services/driving-licence");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      slug: string;
      official: { fee_inr: string | null };
    };
    expect(body.slug).toBe("driving-licence");
    // The detail response must expose the service UUID as a top-level `id`.
    expect(body.id).toMatch(UUID_RE);
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
