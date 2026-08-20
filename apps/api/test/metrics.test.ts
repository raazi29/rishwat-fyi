import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { recomputeAggregates } from "../src/services/metrics.service.js";
import { bootTestApp, createTestAdmin, createTestModerator } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let adminToken: string;
let moderatorToken: string;

let serviceId: string;
let stateId: string;
// Two dedicated districts created for this file so the cells under test are
// fully isolated from data other test files write into the shared test DB.
let publishedDistrictId: string;
let singleDistrictId: string;

const DESC = "Seeded report for the aggregate_metrics materialization test cell.";

async function makeDistrict(code: string, name: string): Promise<string> {
  const rows = (await boot.db.execute(sql`
    insert into districts (state_id, code, name)
    values (${stateId}::uuid, ${code}, ${name})
    returning id::text as id
  `)) as unknown as { id: string }[];
  const first = rows[0];
  if (!first) throw new Error(`Failed to create district ${code}`);
  return first.id;
}

async function seedReport(districtId: string, ipHash: string): Promise<void> {
  const publicId = `R-${Math.random().toString(36).slice(2, 10)}`;
  await boot.db.execute(sql`
    insert into reports
      (public_id, service_id, state_id, district_id, period_start, period_end,
       additional_amount_reported_inr, delay_days, visits, description, status, ip_hash)
    values (
      ${publicId}, ${serviceId}::uuid, ${stateId}::uuid, ${districtId}::uuid,
      '2024-01-01', '2024-02-01', 200, 10, 3, ${DESC},
      'validated'::report_status, ${ipHash}
    )
  `);
}

interface MetricRow {
  metric_type: string;
  value: string | null;
  report_count: number;
  ip_bucket_count: number;
  published: boolean;
}

function readCell(districtId: string): Promise<MetricRow[]> {
  return boot.db.execute(sql`
    select metric_type, value::text as value, report_count, ip_bucket_count, published
    from aggregate_metrics
    where service_id = ${serviceId}::uuid and district_id = ${districtId}::uuid
    order by metric_type
  `) as unknown as Promise<MetricRow[]>;
}

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  adminToken = (await createTestAdmin(boot.db, boot.config)).token;
  moderatorToken = (await createTestModerator(boot.db, boot.config)).token;

  const svc = (await boot.db.execute(sql`select id::text as id from services limit 1`)) as any;
  serviceId = svc[0].id;
  const st = (await boot.db.execute(sql`select id::text as id from states limit 1`)) as any;
  stateId = st[0].id;

  const suffix = Date.now().toString(36);
  publishedDistrictId = await makeDistrict(`MTEST-PUB-${suffix}`, `Metrics Pub ${suffix}`);
  singleDistrictId = await makeDistrict(`MTEST-ONE-${suffix}`, `Metrics One ${suffix}`);

  // Publishable cell: 3 reports from 2 distinct ip_hash buckets.
  await seedReport(publishedDistrictId, "metrics-hash-a");
  await seedReport(publishedDistrictId, "metrics-hash-a");
  await seedReport(publishedDistrictId, "metrics-hash-b");
  // Below-threshold cell: a single report (1 bucket).
  await seedReport(singleDistrictId, "metrics-hash-c");

  await recomputeAggregates(boot.db);
});

afterAll(async () => {
  await boot.cleanup();
});

describe("recomputeAggregates materialization", () => {
  it("stores a publishable cell with published=true and the seeded report_count", async () => {
    const rows = await readCell(publishedDistrictId);
    // One row per metric_type (extra_payment_median, delay_median, visits_avg,
    // corroboration_rate).
    expect(rows.length).toBe(4);
    expect(rows.map((r) => r.metric_type).sort()).toEqual([
      "corroboration_rate",
      "delay_median",
      "extra_payment_median",
      "visits_avg",
    ]);
    for (const row of rows) {
      expect(row.published).toBe(true);
      expect(row.report_count).toBe(3);
      expect(row.ip_bucket_count).toBe(2);
    }
    // Published cells expose real values (not suppressed).
    const delay = rows.find((r) => r.metric_type === "delay_median");
    expect(delay?.value).not.toBeNull();
  });

  it("stores a below-threshold single-report cell with published=false and null value", async () => {
    const rows = await readCell(singleDistrictId);
    expect(rows.length).toBe(4);
    for (const row of rows) {
      expect(row.published).toBe(false);
      expect(row.report_count).toBe(1);
      expect(row.ip_bucket_count).toBe(1);
      expect(row.value).toBeNull();
    }
  });

  it("is idempotent — a second run keeps one row per metric_type per cell", async () => {
    await recomputeAggregates(boot.db);
    const rows = await readCell(publishedDistrictId);
    expect(rows.length).toBe(4);
  });
});

describe("POST /admin/jobs/recompute-aggregates", () => {
  it("returns a summary for an admin token", async () => {
    const res = await app.request("/admin/jobs/recompute-aggregates", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cells: number; rows: number };
    expect(typeof body.cells).toBe("number");
    expect(typeof body.rows).toBe("number");
    expect(body.rows).toBeGreaterThanOrEqual(body.cells);
  });

  it("returns 403 for a moderator token (jobs are admin-only)", async () => {
    const res = await app.request("/admin/jobs/recompute-aggregates", {
      method: "POST",
      headers: { authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});

describe("POST /admin/jobs/corroborate", () => {
  it("returns a promotion summary for an admin token", async () => {
    const res = await app.request("/admin/jobs/corroborate", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { promoted_count: number; promoted: unknown[] };
    expect(typeof body.promoted_count).toBe("number");
    expect(Array.isArray(body.promoted)).toBe(true);
  });

  it("returns 403 for a moderator token (jobs are admin-only)", async () => {
    const res = await app.request("/admin/jobs/corroborate", {
      method: "POST",
      headers: { authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});
