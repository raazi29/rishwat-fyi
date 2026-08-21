import { Hono } from "hono";
import type { AppEnv } from "../../env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { recomputeAggregates } from "../../services/metrics.service.js";
import { purgeExpiredEvidence } from "../../services/retention.service.js";
import { corroborateEligible } from "../../services/verification.service.js";

export const adminJobs = new Hono<AppEnv>();

// Maintenance jobs are admin-only (same treatment as /stats). app.ts also
// gates /jobs/* on the admin role; the checks here keep the router correct on
// its own and mirror the other admin routers' defense-in-depth style.
adminJobs.use("*", requireAuth);
adminJobs.use("*", requireRole("admin"));

// POST /corroborate — run the auto-corroboration pass. Any (service, district)
// cell with >= 3 live reports from >= 2 distinct IP buckets promotes its pending
// (submitted/validated) reports to `corroborated`. Returns what was promoted.
adminJobs.post("/corroborate", async (c) => {
  const promoted = await corroborateEligible(c.get("db"));
  return c.json({
    job: "corroborate",
    promoted_count: promoted.length,
    promoted: promoted.map((t) => ({
      public_id: t.public_id,
      from_status: t.from_status,
      to_status: t.to_status,
    })),
    ran_at: new Date().toISOString(),
  });
});

// POST /recompute-aggregates — materialize the public statistics into
// aggregate_metrics (one row per service/district/metric_type cell). Uses the
// same computations and publishing threshold as the live serviceAggregates view.
adminJobs.post("/recompute-aggregates", async (c) => {
  const summary = await recomputeAggregates(c.get("db"));
  return c.json({
    job: "recompute-aggregates",
    cells: summary.cells,
    rows: summary.rows,
    ran_at: new Date().toISOString(),
  });
});

// POST /purge-evidence — enforce the evidence retention policy (privacy.md):
// delete every evidence object whose retention_until has passed from BOTH the
// storage backend and the metadata table. Storage is removed first so a failure
// never orphans a file. `failed_keys` are internal ids, exposed only here on the
// admin-only surface. A production cron runs the same work via `npm run
// purge-evidence`.
adminJobs.post("/purge-evidence", async (c) => {
  const summary = await purgeExpiredEvidence(c.get("db"), c.get("storage"));
  return c.json({
    job: "purge-evidence",
    examined: summary.examined,
    deleted: summary.deleted,
    failed: summary.failed,
    failed_keys: summary.failedKeys,
    ran_at: new Date().toISOString(),
  });
});
