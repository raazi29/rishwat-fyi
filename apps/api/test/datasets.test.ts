import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { bootTestApp } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let seededPublicId: string;

/**
 * The exact public dataset contract, as documented in docs/data-dictionary.md.
 * Kept as a literal here (deliberately NOT imported from export.service.ts) so
 * that any change to the export projection must be made in this test too — this
 * is the guard that prevents the data dictionary from silently drifting away
 * from what the endpoint really emits.
 */
const EXPECTED_COLUMNS = [
  "public_id",
  "service_slug",
  "service_name",
  "department",
  "state",
  "district",
  "period_start",
  "period_end",
  "official_fee_reported_inr",
  "additional_amount_reported_inr",
  "amount_paid_inr",
  "paid",
  "delay_days",
  "visits",
  "status",
  "description",
  "created_at",
] as const;
const EXPECTED_HEADER = EXPECTED_COLUMNS.join(",");

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;

  // Seed one publishable (validated) report so the exports have at least one
  // data row to inspect for object keys and RFC-4180 record separators. The
  // description carries a phone number and an email to confirm redaction.
  const svc = (await boot.db.execute(
    sql`select id::text as id from services limit 1`,
  )) as unknown as { id: string }[];
  const loc = (await boot.db.execute(
    sql`select id::text as id, state_id::text as state_id from districts limit 1`,
  )) as unknown as { id: string; state_id: string }[];
  seededPublicId = `R-${Math.random().toString(36).slice(2).padEnd(8, "0").slice(0, 8)}`;
  await boot.db.execute(sql`
    insert into reports
      (public_id, service_id, state_id, district_id, period_start, period_end,
       official_fee_reported_inr, additional_amount_reported_inr, amount_paid_inr,
       paid, delay_days, visits, description, status)
    values (
      ${seededPublicId}, ${svc[0]!.id}::uuid, ${loc[0]!.state_id}::uuid, ${loc[0]!.id}::uuid,
      '2024-01-01', '2024-02-01', 600, 1500, 2100, true, 45, 3,
      'Dataset contract row. Contact 9876543210 or a@b.com for the details of this matter.',
      'validated'::report_status
    )
  `);
});

afterAll(async () => {
  // Remove the seeded row so this file leaves the shared test DB as it found it.
  await boot.db.execute(sql`delete from reports where public_id = ${seededPublicId}`);
  await boot.cleanup();
});

describe("GET /datasets", () => {
  it("returns the dataset index with download links", async () => {
    const res = await app.request("/datasets");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { datasets: { name: string }[]; license: string };
    expect(Array.isArray(body.datasets)).toBe(true);
    expect(body.datasets.length).toBeGreaterThan(0);
    expect(body.datasets[0]?.name).toBe("reports");
    // License string names both licenses: data under CC BY 4.0, code under MIT.
    expect(body.license).toContain("CC BY 4.0");
    expect(body.license).toContain("MIT");
  });

  it("returns publishable reports as { total, rows }", async () => {
    const res = await app.request("/datasets/reports.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; rows: unknown[] };
    expect(Array.isArray(body.rows)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(body.total).toBe(body.rows.length);
  });
});

describe("dataset column contract (guards docs/data-dictionary.md)", () => {
  it("serves the exact JSON object keys, in order", async () => {
    const res = await app.request("/datasets/reports.json");
    const body = (await res.json()) as { total: number; rows: Record<string, unknown>[] };
    expect(body.rows.length).toBeGreaterThan(0);
    expect(Object.keys(body.rows[0]!)).toEqual([...EXPECTED_COLUMNS]);
  });

  it("redacts PII in the exported description column", async () => {
    const res = await app.request("/datasets/reports.json");
    const body = (await res.json()) as { rows: { public_id: string; description: string }[] };
    const seeded = body.rows.find((r) => r.public_id === seededPublicId);
    expect(seeded).toBeDefined();
    expect(seeded!.description).not.toContain("9876543210");
    expect(seeded!.description).not.toContain("a@b.com");
    expect(seeded!.description).toContain("[REDACTED]");
  });

  it("serves the exact CSV header row", async () => {
    const res = await app.request("/datasets/reports.csv");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const csv = await res.text();
    const header = csv.split("\r\n")[0];
    expect(header).toBe(EXPECTED_HEADER);
  });

  it("emits RFC 4180 CSV (CRLF record separators and a trailing CRLF)", async () => {
    const res = await app.request("/datasets/reports.csv");
    const csv = await res.text();
    expect(csv).toContain("\r\n");
    expect(csv.endsWith("\r\n")).toBe(true);
    // Header + the seeded data record → at least two CRLF-separated lines.
    const records = csv.split("\r\n").filter((line) => line.length > 0);
    expect(records.length).toBeGreaterThanOrEqual(2);
    expect(records[0]).toBe(EXPECTED_HEADER);
  });

  it("sets Cache-Control: public, max-age=300 on both exports", async () => {
    const jsonRes = await app.request("/datasets/reports.json");
    expect(jsonRes.headers.get("cache-control")).toBe("public, max-age=300");
    const csvRes = await app.request("/datasets/reports.csv");
    expect(csvRes.headers.get("cache-control")).toBe("public, max-age=300");
  });
});
