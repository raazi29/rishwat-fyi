import type { Db } from "@rishwat/database";
import { sql, type SQL } from "drizzle-orm";
import { execRows, PUBLISHABLE_STATUSES } from "../utils/sql.js";

export interface CitizenBlock {
  published: boolean;
  report_count: number;
  ip_bucket_count: number;
  extra_payment_median: string | null;
  delay_median: number | null;
  visits_avg: number | null;
  corroboration_rate: number | null;
  recent_issues: string[];
}

// Canonical friction signals (methodology.md) → ILIKE patterns matched against
// the raw report descriptions. Patterns are bound parameters, not inlined.
const ISSUE_PATTERNS: Record<string, string[]> = {
  additional_payment_requested: [
    "%bribe%", "%extra payment%", "%additional payment%", "%asked for money%",
    "%speed money%", "%under the table%", "%pay extra%", "%extra money%",
    "%additional amount%", "%demanded money%", "%asked for a bribe%",
  ],
  multiple_visits: [
    "%multiple visit%", "%several visit%", "%many visit%", "%repeated visit%",
    "%visited again%", "%visit again%", "%went back%", "%multiple trip%",
    "%several trip%", "%go again%", "%come back again%",
  ],
  document_requests_repeated: [
    "%more document%", "%additional document%", "%repeated document%",
    "%again document%", "%more paper%", "%extra document%",
    "%resubmit document%", "%same document%", "%asked for more paper%",
  ],
  unclear_process: [
    "%unclear%", "%not clear%", "%confusing%", "%no information%",
    "%did not know%", "%didn't know%", "%no clarity%", "%complicated process%",
    "%confused%", "%unclear process%",
  ],
  office_staff_unhelpful: [
    "%rude%", "%unhelpful%", "%not helpful%", "%uncooperative%",
    "%behaved badly%", "%misbehav%", "%staff was%", "%harass%",
  ],
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface AggRow {
  report_count: number;
  ip_bucket_count: number;
  extra_payment_median: string | null;
  delay_median: number | null;
  visits_avg: number | null;
  corroboration_rate: number | null;
}

/**
 * Compute the public "citizen experience" block for a (service[, district])
 * cell over the *publishable* report set. Stats are only exposed when the cell
 * has >= 3 reports from >= 2 distinct IP-hash buckets; otherwise every metric
 * is null (but the real counts are still returned, so "no signal" is visible).
 */
export async function serviceAggregates(
  db: Db,
  serviceId: string,
  districtId?: string,
): Promise<CitizenBlock> {
  const districtCond = districtId ? sql`and district_id = ${districtId}` : sql``;
  const [agg] = await execRows<AggRow>(
    db,
    sql`
      select
        count(*)::int as report_count,
        count(distinct ip_hash)::int as ip_bucket_count,
        round(
          (percentile_cont(0.5) within group (order by additional_amount_reported_inr::float8))::numeric,
          2
        )::text as extra_payment_median,
        percentile_cont(0.5) within group (order by delay_days::float8) as delay_median,
        avg(visits)::float8 as visits_avg,
        (count(*) filter (
          where status in ('corroborated', 'evidence_backed', 'officially_acknowledged')
        ))::float8 / nullif(count(*), 0) as corroboration_rate
      from reports
      where service_id = ${serviceId} ${districtCond}
        and status in ${PUBLISHABLE_STATUSES}
    `,
  );

  const report_count = agg?.report_count ?? 0;
  const ip_bucket_count = agg?.ip_bucket_count ?? 0;
  const published = report_count >= 3 && ip_bucket_count >= 2;

  if (!published || !agg) {
    return {
      published: false, report_count, ip_bucket_count,
      extra_payment_median: null, delay_median: null, visits_avg: null,
      corroboration_rate: null, recent_issues: [],
    };
  }

  return {
    published: true,
    report_count,
    ip_bucket_count,
    extra_payment_median: agg.extra_payment_median,
    delay_median: agg.delay_median != null ? round2(agg.delay_median) : null,
    visits_avg: agg.visits_avg != null ? round2(agg.visits_avg) : null,
    corroboration_rate: agg.corroboration_rate != null ? round2(agg.corroboration_rate) : null,
    recent_issues: await scanIssues(db, serviceId, districtId),
  };
}

/** Rank the canonical issue keywords by how many descriptions match each. */
async function scanIssues(db: Db, serviceId: string, districtId?: string): Promise<string[]> {
  const districtCond = districtId ? sql`and district_id = ${districtId}` : sql``;
  const cols = Object.entries(ISSUE_PATTERNS).map(([key, pats]) => {
    const ors = sql.join(pats.map((p) => sql`description ilike ${p}`), sql` or `);
    return sql`(count(*) filter (where ${ors}))::int as ${sql.raw(key)}`;
  });

  const [row] = await execRows<Record<string, number>>(
    db,
    sql`
      select ${sql.join(cols, sql`, `)}
      from reports
      where service_id = ${serviceId} ${districtCond}
        and status in ${PUBLISHABLE_STATUSES}
    `,
  );
  if (!row) return [];

  return Object.keys(ISSUE_PATTERNS)
    .map((k) => ({ k, c: Number(row[k] ?? 0) }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .map((x) => x.k);
}
