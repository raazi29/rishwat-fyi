/**
 * Deriving public aggregates from the open dataset.
 *
 * There is no per-state aggregate endpoint, but `GET /datasets/reports.json`
 * publishes every publishable report with its state, district, service and
 * amounts (see apps/api/src/services/export.service.ts and
 * docs/data-dictionary.md). Computing the map and the state leaderboard from
 * that export keeps the figures real and keeps the frontend honest: the same
 * numbers any mirror would compute from the same public file.
 *
 * Medians here are medians of the *reported* additional amount over published
 * reports, matching docs/methodology.md. Money stays a decimal string.
 */

import type { StateGap, StateRef } from "./types";

/** One row of `GET /datasets/reports.json`. */
export interface DatasetRow {
  public_id: string;
  service_slug: string;
  service_name: string;
  department: string;
  state: string;
  district: string;
  period_start: string;
  period_end: string;
  official_fee_reported_inr: string | null;
  additional_amount_reported_inr: string | null;
  amount_paid_inr: string | null;
  paid: boolean;
  delay_days: number | null;
  visits: number | null;
  status: string;
  description: string;
  created_at: string;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (lower === undefined || upper === undefined) return null;
  return (lower + upper) / 2;
}

function toDecimalString(value: number | null): string | null {
  return value === null ? null : value.toFixed(2);
}

interface StateBucket {
  amounts: number[];
  delays: number[];
  reports: number;
  services: Set<string>;
  districts: Set<string>;
}

/**
 * Group the dataset by state and compute the published gap figures.
 *
 * `states` supplies the ISO 3166-2:IN code for each state name, because the
 * export carries names. States absent from the export are returned with null
 * statistics and a zero count so the map can show "not enough reports yet"
 * rather than an implied zero gap.
 */
export function deriveStateGaps(rows: DatasetRow[], states: StateRef[]): StateGap[] {
  const codeByName = new Map(states.map((state) => [state.name.toLowerCase(), state.code]));
  const buckets = new Map<string, StateBucket>();

  for (const row of rows) {
    const code = codeByName.get(row.state.toLowerCase());
    if (code === undefined) continue;

    let bucket = buckets.get(code);
    if (bucket === undefined) {
      bucket = { amounts: [], delays: [], reports: 0, services: new Set(), districts: new Set() };
      buckets.set(code, bucket);
    }

    bucket.reports += 1;
    bucket.services.add(row.service_slug);
    bucket.districts.add(row.district);

    const amount = row.additional_amount_reported_inr;
    if (amount !== null) {
      const parsed = Number(amount);
      if (Number.isFinite(parsed)) bucket.amounts.push(parsed);
    }
    if (row.delay_days !== null && Number.isFinite(row.delay_days)) {
      bucket.delays.push(row.delay_days);
    }
  }

  return states.map((state): StateGap => {
    const bucket = buckets.get(state.code);
    if (bucket === undefined) {
      return {
        code: state.code,
        name: state.name,
        additional_amount_median: null,
        report_count: 0,
        services_covered: 0,
        districts_covered: 0,
      };
    }
    return {
      code: state.code,
      name: state.name,
      additional_amount_median: toDecimalString(median(bucket.amounts)),
      report_count: bucket.reports,
      services_covered: bucket.services.size,
      districts_covered: bucket.districts.size,
    };
  });
}

/** Median reported delay per state, for the map's alternate metric. */
export function deriveStateDelays(
  rows: DatasetRow[],
  states: StateRef[],
): Map<string, number | null> {
  const codeByName = new Map(states.map((state) => [state.name.toLowerCase(), state.code]));
  const delays = new Map<string, number[]>();

  for (const row of rows) {
    const code = codeByName.get(row.state.toLowerCase());
    if (code === undefined || row.delay_days === null) continue;
    const list = delays.get(code) ?? [];
    list.push(row.delay_days);
    delays.set(code, list);
  }

  return new Map(states.map((state) => [state.code, median(delays.get(state.code) ?? [])]));
}

/** Platform-wide totals computed from the same public export. */
export function deriveTotals(
  rows: DatasetRow[],
  states: StateRef[],
): { citizen_reports: number; states_covered: number; reports_corroborated: number } {
  const corroborated = new Set(["corroborated", "evidence_backed", "officially_acknowledged"]);
  const stateNames = new Set(states.map((state) => state.name.toLowerCase()));
  const covered = new Set<string>();
  let corroboratedCount = 0;

  for (const row of rows) {
    const name = row.state.toLowerCase();
    if (stateNames.has(name)) covered.add(name);
    if (corroborated.has(row.status)) corroboratedCount += 1;
  }

  return {
    citizen_reports: rows.length,
    states_covered: covered.size,
    reports_corroborated: corroboratedCount,
  };
}

/** One service's reported figures inside a single state. */
export interface DerivedStateService {
  slug: string;
  name: string;
  department: string;
  report_count: number;
  additional_amount_median: string | null;
  delay_median: number | null;
  strongest_status: string | null;
}

const STATUS_RANK: Record<string, number> = {
  submitted: 1,
  validated: 2,
  corroborated: 3,
  evidence_backed: 4,
  officially_acknowledged: 5,
};

/**
 * The services most reported in one state, strongest verification first among
 * equal report counts. Computed from the public export, so a state page shows
 * the same figures a mirror would.
 */
export function deriveStateServices(
  rows: DatasetRow[],
  stateName: string,
  limit = 5,
): DerivedStateService[] {
  const target = stateName.toLowerCase();
  const buckets = new Map<
    string,
    {
      name: string;
      department: string;
      amounts: number[];
      delays: number[];
      reports: number;
      status: string | null;
    }
  >();

  for (const row of rows) {
    if (row.state.toLowerCase() !== target) continue;
    let bucket = buckets.get(row.service_slug);
    if (bucket === undefined) {
      bucket = {
        name: row.service_name,
        department: row.department,
        amounts: [],
        delays: [],
        reports: 0,
        status: null,
      };
      buckets.set(row.service_slug, bucket);
    }
    bucket.reports += 1;
    const amount = row.additional_amount_reported_inr;
    if (amount !== null) {
      const parsed = Number(amount);
      if (Number.isFinite(parsed)) bucket.amounts.push(parsed);
    }
    if (row.delay_days !== null) bucket.delays.push(row.delay_days);
    const currentRank = bucket.status === null ? 0 : (STATUS_RANK[bucket.status] ?? 0);
    if ((STATUS_RANK[row.status] ?? 0) > currentRank) bucket.status = row.status;
  }

  return [...buckets.entries()]
    .map(([slug, bucket]): DerivedStateService => ({
      slug,
      name: bucket.name,
      department: bucket.department,
      report_count: bucket.reports,
      additional_amount_median: toDecimalString(median(bucket.amounts)),
      delay_median: median(bucket.delays),
      strongest_status: bucket.status,
    }))
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, limit);
}
