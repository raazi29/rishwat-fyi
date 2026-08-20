import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://rishwat:rishwat_dev@db:5432/rishwat_test";

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
  client = postgres(TEST_DB_URL, { max: 1 });
  db = drizzle(client);
});

afterAll(async () => {
  await client.end();
});

describe("database schema", () => {
  it("has all expected tables", async () => {
    const rows = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const names = rows.map((r: any) => r.table_name);
    const expected = [
      "aggregate_metrics",
      "cities",
      "departments",
      "districts",
      "evidence",
      "government_sources",
      "moderation_actions",
      "offices",
      "reports",
      "services",
      "states",
      "users",
      "verification_events",
    ];
    for (const t of expected) {
      expect(names).toContain(t);
    }
  });

  it("report_status enum contains officially_acknowledged", async () => {
    const rows = await db.execute(sql`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'report_status'
    `);
    const labels = rows.map((r: any) => r.enumlabel);
    expect(labels).toContain("officially_acknowledged");
    expect(labels).toContain("submitted");
    expect(labels).toContain("rejected");
  });

  it("search trigger exists on services table", async () => {
    const rows = await db.execute(sql`
      SELECT trigger_name FROM information_schema.triggers
      WHERE event_object_table = 'services'
        AND trigger_name = 'services_search_vector_trigger'
    `);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

describe("seed data", () => {
  it("has 36 states/UTs", async () => {
    const rows = await db.execute(sql`SELECT count(*)::int as c FROM states`);
    expect((rows[0] as any).c).toBe(36);
  });

  it("has >= 700 districts", async () => {
    const rows = await db.execute(sql`SELECT count(*)::int as c FROM districts`);
    expect((rows[0] as any).c).toBeGreaterThanOrEqual(700);
  });

  it("has 12 services seeded", async () => {
    const rows = await db.execute(sql`SELECT count(*)::int as c FROM services`);
    expect((rows[0] as any).c).toBe(12);
  });
});
