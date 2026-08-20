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

describe("GET /datasets", () => {
  it("returns the dataset index with download links", async () => {
    const res = await app.request("/datasets");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { datasets: { name: string }[]; license: string };
    expect(Array.isArray(body.datasets)).toBe(true);
    expect(body.datasets.length).toBeGreaterThan(0);
    expect(body.datasets[0]?.name).toBe("reports");
  });

  it("returns publishable reports as a JSON array", async () => {
    const res = await app.request("/datasets/reports.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; rows: unknown[] };
    expect(Array.isArray(body.rows)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(body.total).toBe(body.rows.length);
  });
});
