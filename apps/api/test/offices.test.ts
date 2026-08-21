import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql, type SQL } from "drizzle-orm";
import { bootTestApp } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];

// Varanasi is seeded with offices for five distinct services (see
// seed/offices.ts), which lets the ?service filter meaningfully narrow.
let varanasiId: string;
// A synthetic, point-bearing office is inserted to exercise ST_Y/ST_X
// extraction, then removed in afterAll. The name is unique so cleanup only
// touches this file's rows. Coordinates here are TEST data, not seed data.
const SYNTH_NAME = `TEST-SYNTH-OFFICE ${Date.now().toString(36)}`;
const SYNTH_LAT = 25.3176;
const SYNTH_LON = 82.9739;
let syntheticId: string;

const NONEXISTENT_UUID = "00000000-0000-4000-8000-000000000000";

interface OfficeListItem {
  id: string;
  name: string;
  address: string | null;
  service: { slug: string; name: string };
  location: { lat: number; lon: number } | null;
}

async function firstRow<T>(query: SQL): Promise<T | undefined> {
  const rows = (await boot.db.execute(query)) as unknown as T[];
  return rows[0];
}

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;

  const district = await firstRow<{ id: string; state_id: string }>(sql`
    select d.id::text as id, d.state_id::text as state_id
    from districts d
    join states s on s.id = d.state_id
    where s.code = 'UP' and d.name = 'Varanasi'
    limit 1
  `);
  if (!district) {
    throw new Error("Varanasi district not seeded — seed the test DB before running this suite");
  }
  varanasiId = district.id;

  const svc = await firstRow<{ id: string }>(sql`select id::text as id from services where slug = 'passport' limit 1`);
  if (!svc) throw new Error("passport service not seeded");

  const inserted = await firstRow<{ id: string }>(sql`
    insert into offices (service_id, state_id, district_id, name, location)
    values (
      ${svc.id}::uuid, ${district.state_id}::uuid, ${varanasiId}::uuid, ${SYNTH_NAME},
      ST_SetSRID(ST_MakePoint(${SYNTH_LON}, ${SYNTH_LAT}), 4326)
    )
    returning id::text as id
  `);
  if (!inserted) throw new Error("failed to insert synthetic office");
  syntheticId = inserted.id;
});

afterAll(async () => {
  // Remove only the synthetic office this file created; leave seed data intact.
  await boot.db.execute(sql`delete from offices where name = ${SYNTH_NAME}`);
  await boot.cleanup();
});

describe("GET /locations/districts/:districtId/offices", () => {
  it("returns a non-empty list of offices for a real seeded district", async () => {
    const res = await app.request(`/locations/districts/${varanasiId}/offices`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: OfficeListItem[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    // A known seeded office is present.
    const names = body.items.map((o) => o.name);
    expect(names).toContain("Regional Transport Office, Varanasi");
    // Every item carries a service and a { lat, lon } | null location.
    for (const item of body.items) {
      expect(typeof item.service.slug).toBe("string");
      expect(item.location === null || typeof item.location.lat === "number").toBe(true);
    }
  });

  it("narrows results with the ?service=<slug> filter", async () => {
    const all = (await (await app.request(`/locations/districts/${varanasiId}/offices`)).json()) as {
      items: OfficeListItem[];
    };
    const filtered = (await (
      await app.request(`/locations/districts/${varanasiId}/offices?service=driving-licence`)
    ).json()) as { items: OfficeListItem[] };

    expect(filtered.items.length).toBeGreaterThan(0);
    expect(filtered.items.length).toBeLessThan(all.items.length);
    for (const item of filtered.items) {
      expect(item.service.slug).toBe("driving-licence");
    }
  });

  it("returns 400 for a non-UUID district id", async () => {
    const res = await app.request(`/locations/districts/not-a-uuid/offices`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });

  it("returns 404 for an unknown (well-formed) district id", async () => {
    const res = await app.request(`/locations/districts/${NONEXISTENT_UUID}/offices`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});

describe("GET /locations/offices/:id", () => {
  it("returns the joined detail with service, state and district names", async () => {
    const list = (await (
      await app.request(`/locations/districts/${varanasiId}/offices?service=driving-licence`)
    ).json()) as { items: OfficeListItem[] };
    const target = list.items[0];
    expect(target).toBeDefined();

    const res = await app.request(`/locations/offices/${target!.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      name: string;
      service: { slug: string; name: string };
      state: { code: string; name: string };
      district: { code: string; name: string } | null;
      location: { lat: number; lon: number } | null;
    };
    expect(body.id).toBe(target!.id);
    expect(body.service.slug).toBe("driving-licence");
    expect(body.service.name).toBe("Driving Licence");
    expect(body.state.name).toBe("Uttar Pradesh");
    expect(body.district?.name).toBe("Varanasi");
    // Seeded offices carry no fabricated coordinate.
    expect(body.location).toBeNull();
  });

  it("extracts a stored point as { lat, lon } via ST_Y/ST_X", async () => {
    const res = await app.request(`/locations/offices/${syntheticId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { location: { lat: number; lon: number } | null };
    expect(body.location).not.toBeNull();
    expect(body.location!.lat).toBeCloseTo(SYNTH_LAT, 4);
    expect(body.location!.lon).toBeCloseTo(SYNTH_LON, 4);
  });

  it("returns 404 for an unknown office id", async () => {
    const res = await app.request(`/locations/offices/${NONEXISTENT_UUID}`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});
