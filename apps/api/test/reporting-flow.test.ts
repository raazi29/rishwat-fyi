import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootTestApp } from "./helpers.js";

/**
 * End-to-end regression test for the citizen reporting flow — the core feature.
 *
 * It asserts the flow is completable using ONLY values obtained from public API
 * responses (no direct DB queries to discover ids), which is exactly what a
 * frontend can do. This is the guard against the "no public endpoint exposes a
 * service id, so a report can never be submitted" contract bug ever returning.
 *
 * Rate limiting is disabled under tests (see config.ts / helpers.ts), so the
 * repeated POSTs here are fine.
 */

let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let cleanup: () => Promise<void>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_ID_RE = /^R-[a-z0-9]{8}$/;

const description =
  "I applied for this service and had to make several visits over a few months, " +
  "and was asked to pay extra beyond the official fee before it was processed.";

// Discovered once from public endpoints and reused across cases.
let serviceListItem: { id: string; slug: string };
let stateId: string;
let districtId: string;

// Find a state (with its code + id) that actually has districts, using ONLY the
// public location endpoints — mirrors what a real id/slug-only client can do.
async function firstStateWithDistricts(): Promise<{ stateId: string; districtId: string }> {
  const statesRes = await app.request("/locations/states");
  if (statesRes.status !== 200) throw new Error(`/locations/states -> ${statesRes.status}`);
  const states = ((await statesRes.json()) as { items: { id: string; code: string }[] }).items;

  for (const st of states) {
    const dRes = await app.request(`/locations/states/${st.code}/districts`);
    if (dRes.status !== 200) continue;
    const districts = ((await dRes.json()) as { items: { id: string }[] }).items;
    if (districts.length > 0) {
      const first = districts[0]!;
      return { stateId: st.id, districtId: first.id };
    }
  }
  throw new Error("No seeded state exposes any districts via the public API");
}

function submit(body: unknown) {
  return app.request("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  ({ app, cleanup } = await bootTestApp());

  // 1. Discover a service purely from the public list endpoint.
  const listRes = await app.request("/services");
  const items = ((await listRes.json()) as { items: { id: string; slug: string }[] }).items;
  serviceListItem = items[0]!;

  // 2. Discover a consistent (state, district) pair purely from public endpoints.
  ({ stateId, districtId } = await firstStateWithDistricts());
});

afterAll(async () => {
  await cleanup();
});

describe("citizen reporting flow (public API responses only)", () => {
  it("exposes ids/slugs sufficient to build a valid submission", () => {
    expect(serviceListItem.id).toMatch(UUID_RE);
    expect(typeof serviceListItem.slug).toBe("string");
    expect(stateId).toMatch(UUID_RE);
    expect(districtId).toMatch(UUID_RE);
  });

  it("completes a report using the service UUID (service_id) from GET /services", async () => {
    const res = await submit({
      service_id: serviceListItem.id,
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-01-01",
      period_end: "2024-02-01",
      amount_paid_inr: 500,
      paid: true,
      visits: 3,
      description,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { public_id: string; token: string; status: string };
    expect(body.public_id).toMatch(PUBLIC_ID_RE);
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
    expect(body.status).toBe("submitted");
  });

  it("completes a report using ONLY the service slug (service_slug)", async () => {
    // Confirm the detail endpoint also exposes the uuid, and the slug round-trips.
    const detailRes = await app.request(`/services/${serviceListItem.slug}`);
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as { id: string; slug: string };
    expect(detail.id).toMatch(UUID_RE);
    expect(detail.slug).toBe(serviceListItem.slug);

    const res = await submit({
      service_slug: detail.slug,
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-03-01",
      period_end: "2024-03-15",
      additional_amount_reported_inr: 200,
      description,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { public_id: string; status: string };
    expect(body.public_id).toMatch(PUBLIC_ID_RE);
    expect(body.status).toBe("submitted");
  });

  it("rejects a submission that supplies neither service_id nor service_slug (400)", async () => {
    const res = await submit({
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-01-01",
      period_end: "2024-02-01",
      description,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });

  it("rejects a submission that supplies both service_id and service_slug (400)", async () => {
    const res = await submit({
      service_id: serviceListItem.id,
      service_slug: serviceListItem.slug,
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-01-01",
      period_end: "2024-02-01",
      description,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });

  it("rejects an unknown service_slug with 400", async () => {
    const res = await submit({
      service_slug: "this-service-does-not-exist",
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-01-01",
      period_end: "2024-02-01",
      description,
    });
    expect(res.status).toBe(400);
  });
});
