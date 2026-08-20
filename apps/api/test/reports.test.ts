import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { bootTestApp } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let serviceId: string;
let stateId: string;
let districtId: string;

const description =
  "Renewed my document and was asked to make several visits before it was finally processed.";

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  const svc = (await boot.db.execute(sql`select id::text as id from services limit 1`)) as any;
  serviceId = svc[0].id;
  // A district row carries its owning state_id, guaranteeing they are consistent.
  const loc = (await boot.db.execute(
    sql`select id::text as id, state_id::text as state_id from districts limit 1`,
  )) as any;
  districtId = loc[0].id;
  stateId = loc[0].state_id;
});

afterAll(async () => {
  await boot.cleanup();
});

function validBody() {
  return {
    service_id: serviceId,
    state_id: stateId,
    district_id: districtId,
    period_start: "2024-01-01",
    period_end: "2024-02-01",
    amount_paid_inr: 500,
    paid: true,
    delay_days: 12,
    visits: 3,
    description,
  };
}

function submit(body: unknown) {
  return app.request("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /reports", () => {
  it("creates a report and returns a public_id + one-time token", async () => {
    const res = await submit(validBody());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { public_id: string; token: string; status: string };
    expect(body.public_id).toMatch(/^R-[a-z0-9]{8}$/);
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
    expect(body.status).toBe("submitted");
  });

  it("rejects a description shorter than 30 characters with 400", async () => {
    const res = await submit({ ...validBody(), description: "too short" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });
});

describe("GET /reports/:publicId/status", () => {
  it("returns status for the correct token", async () => {
    const created = (await (await submit(validBody())).json()) as { public_id: string; token: string };
    const res = await app.request(
      `/reports/${created.public_id}/status?token=${encodeURIComponent(created.token)}`,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { public_id: string; status: string };
    expect(body.public_id).toBe(created.public_id);
    expect(body.status).toBe("submitted");
  });

  it("returns 404 for a wrong token (existence is not leaked)", async () => {
    const created = (await (await submit(validBody())).json()) as { public_id: string };
    const res = await app.request(`/reports/${created.public_id}/status?token=wrong-token`);
    expect(res.status).toBe(404);
  });
});

describe("GET /reports/:publicId", () => {
  it("returns the public view without exposing ip_hash", async () => {
    const created = (await (await submit(validBody())).json()) as { public_id: string };
    const res = await app.request(`/reports/${created.public_id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown> & { public_id: string; experience: unknown };
    expect(body.public_id).toBe(created.public_id);
    expect(body.experience).toBeDefined();
    expect("ip_hash" in body).toBe(false);
    expect(JSON.stringify(body)).not.toContain("ip_hash");
  });
});
