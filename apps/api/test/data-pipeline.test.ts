import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { bootTestApp } from "./helpers.js";

/**
 * Data-pipeline roundtrip.
 *
 * Proves numbers survive the whole journey unchanged:
 *   insert reports (known values) -> GET /datasets/reports.json -> aggregate.
 *
 * The guarantee under test is that the export projection joins foreign keys
 * correctly (state / district / service names), respects the publishable-status
 * filter (submitted + rejected never leave the system), and passes every
 * monetary / count field through byte-for-byte. Finally we recompute the median
 * additional amount from the exported rows and check it equals the median of
 * the values we inserted -- the same figure a mirror would derive from the same
 * public file (see apps/web/src/lib/api/dataset-aggregate.ts).
 */

/** Local mirror of the export contract (export.service.ts ExportRow). Kept
 *  literal on purpose so a change to the projection has to be reflected here. */
interface ExportRow {
  public_id: string;
  service_slug: string;
  service_name: string;
  department: string;
  state: string;
  district: string;
  period_start: string;
  period_end: string;
  official_fee_reported_inr: string | null;
  additional_amount_reported_inr: string | null;
  amount_paid_inr: string | null;
  paid: boolean;
  delay_days: number | null;
  visits: number | null;
  status: string;
  description: string;
  created_at: string;
}

// The reports.json route returns { total, rows } (generated_at is emitted by the
// /datasets index route, not this one), so generated_at is treated as optional.
interface ReportsResponse {
  total: number;
  rows: ExportRow[];
  generated_at?: string;
}

/**
 * Median, deliberately re-implemented here rather than imported from the web
 * package (which uses `@/` path aliases that don't resolve under the API's
 * vitest). This is the reference the export data must reproduce; the derivation
 * logic itself is covered by apps/web dataset-aggregate.test.ts.
 */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// Two distinct IP hashes across the three validated reports satisfy the
// publishing threshold (>= 3 reports from >= 2 distinct submitters). Only
// sha256-style hex is ever stored, never a raw IP.
const IP_HASH_A = "dp0000000000000000000000000000000000000000000000000000000000000a";
const IP_HASH_B = "dp0000000000000000000000000000000000000000000000000000000000000b";
const IP_HASH_C = "dp0000000000000000000000000000000000000000000000000000000000000c";

/** Unique, easy-to-purge public id: `DP-` + random hex. */
const rid = () => `DP-${randomBytes(6).toString("hex")}`;

interface Fixture {
  publicId: string;
  serviceIdx: 0 | 1;
  districtIdx: 0 | 1;
  officialFee: number;
  additionalAmount: number;
  amountPaid: number;
  paid: boolean;
  delayDays: number;
  visits: number;
  status: "validated" | "corroborated" | "submitted" | "rejected";
  ipHash: string;
  expectInExport: boolean;
}

// Known, deterministic values. Only the public_id is random (for uniqueness);
// every asserted field is fixed.
const FIX = {
  // 3 validated reports, same (service, district), amounts 500/1000/1500.
  validated500: {
    publicId: rid(), serviceIdx: 0, districtIdx: 0,
    officialFee: 100, additionalAmount: 500, amountPaid: 600,
    paid: true, delayDays: 10, visits: 2,
    status: "validated", ipHash: IP_HASH_A, expectInExport: true,
  },
  validated1000: {
    publicId: rid(), serviceIdx: 0, districtIdx: 0,
    officialFee: 100, additionalAmount: 1000, amountPaid: 1100,
    paid: true, delayDays: 20, visits: 3,
    status: "validated", ipHash: IP_HASH_B, expectInExport: true,
  },
  validated1500: {
    publicId: rid(), serviceIdx: 0, districtIdx: 0,
    officialFee: 100, additionalAmount: 1500, amountPaid: 1500,
    paid: false, delayDays: 30, visits: 1,
    status: "validated", ipHash: IP_HASH_A, expectInExport: true,
  },
  // Same (service, district) but still under review -> must NOT be exported.
  submitted: {
    publicId: rid(), serviceIdx: 0, districtIdx: 0,
    officialFee: 100, additionalAmount: 9999, amountPaid: 9999,
    paid: true, delayDays: 99, visits: 9,
    status: "submitted", ipHash: IP_HASH_A, expectInExport: false,
  },
  // Different service AND district, publishable -> exported.
  corroborated2000: {
    publicId: rid(), serviceIdx: 1, districtIdx: 1,
    officialFee: 200, additionalAmount: 2000, amountPaid: 2200,
    paid: true, delayDays: 5, visits: 4,
    status: "corroborated", ipHash: IP_HASH_C, expectInExport: true,
  },
  // Rejected -> must NOT be exported.
  rejected: {
    publicId: rid(), serviceIdx: 0, districtIdx: 0,
    officialFee: 100, additionalAmount: 7777, amountPaid: 0,
    paid: false, delayDays: 77, visits: 7,
    status: "rejected", ipHash: IP_HASH_A, expectInExport: false,
  },
} satisfies Record<string, Fixture>;

const FIXTURES: Fixture[] = Object.values(FIX);

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];

// Resolved seed rows used to build (and later assert) the joined names.
let services: { id: string; slug: string }[];
let districts: { id: string; district_name: string; state_id: string; state_name: string }[];

async function fetchReportsJson(): Promise<ReportsResponse> {
  const res = await app.request("/datasets/reports.json");
  expect(res.status).toBe(200);
  return (await res.json()) as ReportsResponse;
}

/** Expected joined names for a fixture, from the seed rows it points at. */
function expectedNames(fx: Fixture) {
  return {
    service_slug: services[fx.serviceIdx]!.slug,
    state: districts[fx.districtIdx]!.state_name,
    district: districts[fx.districtIdx]!.district_name,
  };
}

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;

  // Two distinct services and two distinct districts (with their state) from the
  // seeded catalog. order by keeps the pick deterministic across runs.
  services = (await boot.db.execute(
    sql`select id::text as id, slug from services order by slug limit 2`,
  )) as unknown as { id: string; slug: string }[];
  districts = (await boot.db.execute(
    sql`select d.id::text as id, d.name as district_name,
               s.id::text as state_id, s.name as state_name
        from districts d join states s on s.id = d.state_id
        order by d.name limit 2`,
  )) as unknown as {
    id: string; district_name: string; state_id: string; state_name: string;
  }[];

  expect(services.length).toBe(2);
  expect(districts.length).toBe(2);

  // Insert every fixture with known, parameterized values. The report period is
  // fixed; only public_id / ip_hash vary. status is cast to the enum type.
  for (const fx of FIXTURES) {
    const svc = services[fx.serviceIdx]!;
    const dist = districts[fx.districtIdx]!;
    await boot.db.execute(sql`
      insert into reports
        (public_id, service_id, state_id, district_id, period_start, period_end,
         official_fee_reported_inr, additional_amount_reported_inr, amount_paid_inr,
         paid, delay_days, visits, description, status, ip_hash)
      values (
        ${fx.publicId}, ${svc.id}::uuid, ${dist.state_id}::uuid, ${dist.id}::uuid,
        '2024-03-01', '2024-04-01',
        ${fx.officialFee}, ${fx.additionalAmount}, ${fx.amountPaid},
        ${fx.paid}, ${fx.delayDays}, ${fx.visits},
        'Data pipeline roundtrip fixture.', ${fx.status}::report_status, ${fx.ipHash}
      )
    `);
  }
});

afterAll(async () => {
  // Purge every fixture this file inserted, then close the connection. The
  // DP- prefix makes cleanup unambiguous and independent of the random suffix.
  await boot.db.execute(sql`delete from reports where public_id like 'DP-%'`);
  await boot.cleanup();
});

describe("data pipeline roundtrip: insert -> export -> aggregate", () => {
  it("exports exactly the publishable fixtures (submitted & rejected excluded)", async () => {
    const body = await fetchReportsJson();

    expect(Array.isArray(body.rows)).toBe(true);
    expect(body.total).toBe(body.rows.length);

    const ours = body.rows.filter((r) => r.public_id.startsWith("DP-"));
    // 3 validated + 1 corroborated = 4; the submitted and rejected drop out.
    expect(ours.length).toBe(4);

    const exportedIds = new Set(body.rows.map((r) => r.public_id));
    for (const fx of FIXTURES) {
      expect(exportedIds.has(fx.publicId)).toBe(fx.expectInExport);
    }

    // Explicitly: the two non-publishable statuses are absent.
    expect(exportedIds.has(FIX.submitted.publicId)).toBe(false);
    expect(exportedIds.has(FIX.rejected.publicId)).toBe(false);
  });

  it("passes every value through unchanged and joins names correctly", async () => {
    const body = await fetchReportsJson();
    const byId = new Map(body.rows.map((r) => [r.public_id, r]));

    for (const fx of FIXTURES.filter((f) => f.expectInExport)) {
      const row = byId.get(fx.publicId);
      expect(row, `row ${fx.publicId} should be exported`).toBeDefined();
      if (!row) continue;

      // Monetary fields are numeric(12,2) -> decimal strings; compare by value.
      expect(Number(row.additional_amount_reported_inr)).toBe(fx.additionalAmount);
      expect(Number(row.official_fee_reported_inr)).toBe(fx.officialFee);
      expect(Number(row.amount_paid_inr)).toBe(fx.amountPaid);

      // Counts and the boolean flag pass through with their native types.
      expect(row.paid).toBe(fx.paid);
      expect(row.delay_days).toBe(fx.delayDays);
      expect(row.visits).toBe(fx.visits);

      // Status is preserved verbatim.
      expect(row.status).toBe(fx.status);

      // Foreign keys resolve to the right names.
      const names = expectedNames(fx);
      expect(row.service_slug).toBe(names.service_slug);
      expect(row.state).toBe(names.state);
      expect(row.district).toBe(names.district);
      // service_name / department come from the same join and must be non-empty.
      expect(typeof row.service_name).toBe("string");
      expect(row.service_name.length).toBeGreaterThan(0);
      expect(typeof row.department).toBe("string");
      expect(row.department.length).toBeGreaterThan(0);
    }
  });

  it("recomputes the median additional amount from the export unchanged", async () => {
    const body = await fetchReportsJson();
    const byId = new Map(body.rows.map((r) => [r.public_id, r]));

    // The three validated reports for the same (service, district).
    const validated = [FIX.validated500, FIX.validated1000, FIX.validated1500];

    const inserted = validated.map((f) => f.additionalAmount); // [500, 1000, 1500]
    const exported = validated.map((f) => {
      const row = byId.get(f.publicId);
      expect(row, `validated row ${f.publicId} present in export`).toBeDefined();
      return Number(row!.additional_amount_reported_inr);
    });

    // The exported set equals the inserted set (order-independent).
    expect([...exported].sort((a, b) => a - b)).toEqual(
      [...inserted].sort((a, b) => a - b),
    );

    // Median([500, 1000, 1500]) === 1000, computed from the export data.
    expect(median(exported)).toBe(1000);
    // Sanity: same figure straight from the known inputs.
    expect(median(inserted)).toBe(1000);
  });
});
