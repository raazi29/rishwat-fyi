import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { allServices } from "./seed/services/index.js";

/**
 * One-time (idempotent) correction of official fees, timelines and descriptions
 * on EXISTING service rows.
 *
 * Why this exists separately from the seed: the seed runner
 * (src/seed/index.ts) is deliberately insert-only — it finds a service by slug
 * and `onConflictDoNothing()`, so re-running it never overwrites an existing
 * row. That is the right behavior for a seed (a re-run must not clobber
 * hand-edited production data), but it means a corrected fee in the seed files
 * never reaches a database that already has the service.
 *
 * The passport fee was revised ₹1,500 → ₹2,500 (MEA Gazette 20 June 2026), the
 * driving-licence fee corrected ₹1,200 → ₹900 (CMVR Rule 32), and birth/death
 * certificates ₹10 → ₹0 (registration is free within 21 days, CRS FAQ). See
 * docs/official-fee-verification.md for the full audit trail.
 *
 * This script UPDATEs the official fields to match the seed files exactly. It:
 *   - touches only the `services` table (never reports, never citizen data),
 *   - matches by slug (the natural key),
 *   - is idempotent (running twice changes nothing the second time),
 *   - reports every row it changed.
 *
 * Run with:  npm run db:sync-services -w @rishwat/database
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

// Generous timeout: a cold Supabase pooler can take 15-25s to answer the first
// query. `max: 1` — this is a short-lived admin task, not a server.
const client = postgres(url, { max: 1, connect_timeout: 30 });
const db = drizzle(client);

async function main() {
  let changed = 0;
  const updates: string[] = [];

  for (const svc of allServices) {
    const fee = svc.official_fee_inr === "" ? null : svc.official_fee_inr;

    // Update only the official, source-backed fields. Deliberately NOT touching
    // department_id or source ids here — those are relational and handled by the
    // seed; this script's job is the operator-facing official figures + copy.
    const result = (await db.execute(sql`
      update services
      set
        name = ${svc.name},
        description = ${svc.description},
        official_fee_inr = ${fee},
        official_timeline_days = ${svc.official_timeline_days},
        official_visits = ${svc.official_visits},
        official_documents = ${JSON.stringify(svc.official_documents)}::jsonb,
        process_steps = ${JSON.stringify(svc.process_steps)}::jsonb,
        updated_at = now()
      where slug = ${svc.slug}
        and (
          official_fee_inr is distinct from ${fee}
          or official_timeline_days is distinct from ${svc.official_timeline_days}
          or official_visits is distinct from ${svc.official_visits}
          or description is distinct from ${svc.description}
          or name is distinct from ${svc.name}
        )
      returning slug, official_fee_inr
    `)) as unknown as { slug: string; official_fee_inr: string | null }[];

    if (result.length > 0) {
      changed += 1;
      const row = result[0]!;
      updates.push(`  ${row.slug}: fee → ${row.official_fee_inr ?? "(varies)"}`);
    }
  }

  if (changed === 0) {
    console.log("All services already match the seed files. No changes needed.");
  } else {
    console.log(`Updated ${changed} service(s):`);
    console.log(updates.join("\n"));
  }

  await client.end();
}

main().catch((e) => {
  console.error("sync-services failed:", e);
  process.exit(1);
});
