import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { findCoordinatedClusters } from "../../services/abuse.service.js";
import { execRows, isoUtc } from "../../utils/sql.js";

export const adminStats = new Hono<AppEnv>();

// Operational dashboards are moderator-only; the abuse clusters view (which
// exposes IP-hash prefixes) is tightened to admins on its own route below.
adminStats.use("*", requireAuth);
adminStats.use("*", requireRole("moderator"));

interface OverviewRow {
  total_reports: number;
  submitted: number;
  validated: number;
  corroborated: number;
  evidence_backed: number;
  officially_acknowledged: number;
  rejected: number;
  withdrawn: number;
  publishable: number;
  last_24h: number;
  last_7d: number;
}

const EMPTY_OVERVIEW: OverviewRow = {
  total_reports: 0,
  submitted: 0,
  validated: 0,
  corroborated: 0,
  evidence_backed: 0,
  officially_acknowledged: 0,
  rejected: 0,
  withdrawn: 0,
  publishable: 0,
  last_24h: 0,
  last_7d: 0,
};

// GET /overview — report counts by status, throughput windows, evidence and
// active-staff tallies, plus derived publish / rejection rates.
adminStats.get("/overview", async (c) => {
  const db = c.get("db");
  const [reports] = await execRows<OverviewRow>(
    db,
    sql`
      select
        count(*)::int as total_reports,
        (count(*) filter (where status = 'submitted'))::int as submitted,
        (count(*) filter (where status = 'validated'))::int as validated,
        (count(*) filter (where status = 'corroborated'))::int as corroborated,
        (count(*) filter (where status = 'evidence_backed'))::int as evidence_backed,
        (count(*) filter (where status = 'officially_acknowledged'))::int as officially_acknowledged,
        (count(*) filter (where status = 'rejected'))::int as rejected,
        (count(*) filter (where status = 'withdrawn'))::int as withdrawn,
        (count(*) filter (where status in
          ('validated','corroborated','evidence_backed','officially_acknowledged')))::int as publishable,
        (count(*) filter (where created_at >= now() - interval '24 hours'))::int as last_24h,
        (count(*) filter (where created_at >= now() - interval '7 days'))::int as last_7d
      from reports
    `,
  );
  const [evidence] = await execRows<{ pending: number; accepted: number; rejected: number }>(
    db,
    sql`
      select
        (count(*) filter (where status = 'pending_review'))::int as pending,
        (count(*) filter (where status = 'accepted'))::int as accepted,
        (count(*) filter (where status = 'rejected'))::int as rejected
      from evidence
    `,
  );
  const [staff] = await execRows<{ moderators: number; admins: number }>(
    db,
    sql`
      select
        (count(*) filter (where role = 'moderator'))::int as moderators,
        (count(*) filter (where role = 'admin'))::int as admins
      from users where is_active = true
    `,
  );

  const r = reports ?? EMPTY_OVERVIEW;
  const total = r.total_reports;
  const rate = (n: number): number => (total > 0 ? Math.round((n / total) * 1000) / 1000 : 0);

  return c.json({
    reports: r,
    rates: {
      publish_rate: rate(r.publishable),
      rejection_rate: rate(r.rejected),
      official_acknowledgement_rate: rate(r.officially_acknowledged),
    },
    evidence: evidence ?? { pending: 0, accepted: 0, rejected: 0 },
    staff: staff ?? { moderators: 0, admins: 0 },
    generated_at: new Date().toISOString(),
  });
});

interface DuplicateGroupRow {
  duplicate_group_id: string;
  report_count: number;
  service_name: string;
  district_name: string;
  latest_at: string;
}

// GET /duplicates — near-duplicate report groups (pg_trgm clustering), largest
// first. Only groups with more than one member are returned.
adminStats.get("/duplicates", async (c) => {
  const groups = await execRows<DuplicateGroupRow>(
    c.get("db"),
    sql`
      select r.duplicate_group_id::text as duplicate_group_id,
        count(*)::int as report_count,
        s.name as service_name, di.name as district_name,
        ${isoUtc("max(r.created_at)")} as latest_at
      from reports r
      join services s on s.id = r.service_id
      join districts di on di.id = r.district_id
      where r.duplicate_group_id is not null
      group by r.duplicate_group_id, s.name, di.name
      having count(*) > 1
      order by count(*) desc
      limit 200
    `,
  );
  return c.json({ total: groups.length, groups });
});

// GET /clusters — coordinated (IP bucket + service) campaigns. Admin-only, since
// the response includes IP-hash prefixes. ?window_hours= (1..720, default 24).
adminStats.get("/clusters", requireRole("admin"), async (c) => {
  const raw = Number.parseInt(c.req.query("window_hours") ?? "24", 10);
  const windowHours = Number.isInteger(raw) && raw > 0 && raw <= 720 ? raw : 24;
  const clusters = await findCoordinatedClusters(c.get("db"), windowHours);
  return c.json({ window_hours: windowHours, total: clusters.length, clusters });
});
