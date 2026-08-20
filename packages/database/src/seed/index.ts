import { and, eq, sql } from "drizzle-orm";
import { createDb } from "../db.js";
import * as schema from "../schema/index.js";
import { allStates } from "./locations/index.js";
import { allDepartments, allServices, allSources } from "./services/index.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const { db, client } = createDb(url);

type Row = { id: string };

/**
 * Idempotent upsert: look up by natural key first; insert only when missing.
 * `onConflictDoNothing()` on the insert covers the (single-process) race where
 * a unique constraint fires anyway — we then re-select to fetch the id.
 */
async function upsertBy(
  find: () => Promise<Row[]>,
  create: () => Promise<Row[]>,
): Promise<{ id: string; created: boolean }> {
  const existing = await find();
  if (existing[0]) return { id: existing[0].id, created: false };
  const inserted = await create();
  if (inserted[0]) return { id: inserted[0].id, created: true };
  const again = await find();
  if (again[0]) return { id: again[0].id, created: false };
  throw new Error("upsert failed to produce a row");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tableCount(table: any): Promise<number> {
  const rows = await db.select({ c: sql<number>`count(*)::int` }).from(table);
  return rows[0]?.c ?? 0;
}

async function main() {
  let newStates = 0;
  let newDistricts = 0;
  let newCities = 0;

  for (const s of allStates) {
    const st = await upsertBy(
      () => db.select({ id: schema.states.id }).from(schema.states).where(eq(schema.states.code, s.code)),
      () =>
        db.insert(schema.states).values({ code: s.code, name: s.name })
          .onConflictDoNothing().returning({ id: schema.states.id }),
    );
    if (st.created) newStates++;

    for (const dist of s.districts) {
      const di = await upsertBy(
        () =>
          db.select({ id: schema.districts.id }).from(schema.districts)
            .where(and(eq(schema.districts.state_id, st.id), eq(schema.districts.code, dist.code))),
        () =>
          db.insert(schema.districts).values({ state_id: st.id, code: dist.code, name: dist.name })
            .onConflictDoNothing().returning({ id: schema.districts.id }),
      );
      if (di.created) newDistricts++;

      for (const cityName of dist.cities) {
        const ci = await upsertBy(
          () =>
            db.select({ id: schema.cities.id }).from(schema.cities)
              .where(and(eq(schema.cities.district_id, di.id), eq(schema.cities.name, cityName))),
          () =>
            db.insert(schema.cities).values({ district_id: di.id, name: cityName })
              .onConflictDoNothing().returning({ id: schema.cities.id }),
        );
        if (ci.created) newCities++;
      }
    }
  }

  // Departments (by slug) → id map for service FK resolution.
  const deptIdBySlug = new Map<string, string>();
  let newDepartments = 0;
  for (const dep of allDepartments) {
    const r = await upsertBy(
      () => db.select({ id: schema.departments.id }).from(schema.departments).where(eq(schema.departments.slug, dep.slug)),
      () =>
        db.insert(schema.departments)
          .values({ slug: dep.slug, name: dep.name, description: dep.description, category: dep.category })
          .onConflictDoNothing().returning({ id: schema.departments.id }),
    );
    deptIdBySlug.set(dep.slug, r.id);
    if (r.created) newDepartments++;
  }

  // Government sources (by url — no unique constraint, so select-first only).
  const sourceIdByUrl = new Map<string, string>();
  let newSources = 0;
  for (const src of allSources) {
    const r = await upsertBy(
      () => db.select({ id: schema.governmentSources.id }).from(schema.governmentSources).where(eq(schema.governmentSources.url, src.url)),
      () =>
        db.insert(schema.governmentSources)
          .values({ url: src.url, title: src.title, department: src.department })
          .returning({ id: schema.governmentSources.id }),
    );
    sourceIdByUrl.set(src.url, r.id);
    if (r.created) newSources++;
  }

  // Services (by slug) with resolved department_id + fee/timeline source ids.
  let newServices = 0;
  for (const svc of allServices) {
    const departmentId = deptIdBySlug.get(svc.departmentSlug);
    if (!departmentId) throw new Error(`Unknown department slug "${svc.departmentSlug}" for service "${svc.slug}"`);
    const feeSourceId = sourceIdByUrl.get(svc.feeSourceUrl) ?? null;
    const timelineSourceId = sourceIdByUrl.get(svc.timelineSourceUrl) ?? null;

    const r = await upsertBy(
      () => db.select({ id: schema.services.id }).from(schema.services).where(eq(schema.services.slug, svc.slug)),
      () =>
        db.insert(schema.services).values({
          slug: svc.slug,
          name: svc.name,
          department_id: departmentId,
          description: svc.description,
          official_fee_inr: svc.official_fee_inr === "" ? null : svc.official_fee_inr,
          official_timeline_days: svc.official_timeline_days,
          official_visits: svc.official_visits,
          official_documents: svc.official_documents,
          process_steps: svc.process_steps,
          official_fee_source_id: feeSourceId,
          official_timeline_source_id: timelineSourceId,
        }).onConflictDoNothing({ target: schema.services.slug }).returning({ id: schema.services.id }),
    );
    if (r.created) newServices++;
  }

  console.log("Seed complete (idempotent):");
  console.log(`  states:            ${await tableCount(schema.states)} total (+${newStates} new)`);
  console.log(`  districts:         ${await tableCount(schema.districts)} total (+${newDistricts} new)`);
  console.log(`  cities:            ${await tableCount(schema.cities)} total (+${newCities} new)`);
  console.log(`  departments:       ${await tableCount(schema.departments)} total (+${newDepartments} new)`);
  console.log(`  government_sources:${await tableCount(schema.governmentSources)} total (+${newSources} new)`);
  console.log(`  services:          ${await tableCount(schema.services)} total (+${newServices} new)`);

  await client.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await client.end().catch(() => {});
  process.exit(1);
});
