import type { Db } from "@rishwat/database";
import { sql } from "drizzle-orm";
import { execRows, PUBLISHABLE_STATUSES } from "../utils/sql.js";

export interface RecomputeSummary {
  cells: number;
  rows: number;
}

interface UpsertedRow {
  service_id: string;
  district_id: string;
}

/**
 * Materialize the public statistics into `aggregate_metrics`. One row is written
 * per (service, district, metric_type) cell, over the *publishable* report set,
 * using exactly the same computations and publishing threshold as the live
 * `serviceAggregates` view (methodology.md §8/§9): a cell is `published` only
 * with >= 3 reports from >= 2 distinct ip_hash buckets. Below the threshold the
 * row is still stored with `published = false` and a null `value`, so "no
 * signal" cells remain visible with their real counts.
 *
 * The four persisted `metric_type`s mirror the documented aggregate definitions
 * and the `CitizenBlock` field names computed by `serviceAggregates`:
 *   - `extra_payment_median`  median additional_amount_reported_inr
 *   - `delay_median`          median delay_days
 *   - `visits_avg`            average visits
 *   - `corroboration_rate`    share at corroborated/evidence_backed/officially_acknowledged
 *
 * Everything is done in a single set-based, fully parameterized statement (no
 * per-cell round trips, no string interpolation) that UPSERTs on the table's
 * existing unique index (service_id, district_id, metric_type).
 */
export async function recomputeAggregates(db: Db): Promise<RecomputeSummary> {
  const upserted = await execRows<UpsertedRow>(
    db,
    sql`
      with cell as (
        select
          r.service_id,
          r.district_id,
          d.state_id as state_id,
          count(*)::int as report_count,
          count(distinct r.ip_hash)::int as ip_bucket_count,
          round(
            (percentile_cont(0.5) within group (order by r.additional_amount_reported_inr::float8))::numeric,
            2
          ) as extra_payment_median,
          round(
            (percentile_cont(0.5) within group (order by r.delay_days::float8))::numeric,
            2
          ) as delay_median,
          round(avg(r.visits)::numeric, 2) as visits_avg,
          round(
            (count(*) filter (
              where r.status in ('corroborated', 'evidence_backed', 'officially_acknowledged')
            ))::numeric / nullif(count(*), 0),
            2
          ) as corroboration_rate
        from reports r
        join districts d on d.id = r.district_id
        where r.status in ${PUBLISHABLE_STATUSES}
        group by r.service_id, r.district_id, d.state_id
      ),
      pub as (
        select *, (report_count >= 3 and ip_bucket_count >= 2) as published
        from cell
      ),
      metric as (
        select service_id, state_id, district_id,
          'extra_payment_median' as metric_type,
          case when published then extra_payment_median end as value,
          report_count, ip_bucket_count, published
        from pub
        union all
        select service_id, state_id, district_id,
          'delay_median',
          case when published then delay_median end,
          report_count, ip_bucket_count, published
        from pub
        union all
        select service_id, state_id, district_id,
          'visits_avg',
          case when published then visits_avg end,
          report_count, ip_bucket_count, published
        from pub
        union all
        select service_id, state_id, district_id,
          'corroboration_rate',
          case when published then corroboration_rate end,
          report_count, ip_bucket_count, published
        from pub
      )
      insert into aggregate_metrics
        (service_id, state_id, district_id, metric_type, value,
         report_count, ip_bucket_count, published, computed_at)
      select service_id, state_id, district_id, metric_type, value,
        report_count, ip_bucket_count, published, now()
      from metric
      on conflict (service_id, district_id, metric_type) do update set
        state_id = excluded.state_id,
        value = excluded.value,
        report_count = excluded.report_count,
        ip_bucket_count = excluded.ip_bucket_count,
        published = excluded.published,
        computed_at = excluded.computed_at,
        updated_at = now()
      returning service_id::text as service_id, district_id::text as district_id
    `,
  );

  const cells = new Set(upserted.map((r) => `${r.service_id}|${r.district_id}`));
  return { cells: cells.size, rows: upserted.length };
}
