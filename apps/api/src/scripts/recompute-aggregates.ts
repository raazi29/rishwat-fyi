import { createDb } from "@rishwat/database";
import { recomputeAggregates } from "../services/metrics.service.js";

/**
 * Recompute and materialize the public statistics into `aggregate_metrics`.
 * Reads DATABASE_URL from env. This is what a production cron invokes on a
 * schedule so served aggregates stay in sync with verified reports.
 *
 *   DATABASE_URL=... npm run recompute
 */
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const { db, client } = createDb(databaseUrl);
  try {
    const summary = await recomputeAggregates(db);
    console.log(
      `\u2713 Recomputed aggregates: ${summary.rows} row(s) across ${summary.cells} cell(s)`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("recompute-aggregates failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
