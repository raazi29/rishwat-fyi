import { sql } from "drizzle-orm";
import { conflict, notFound } from "../errors.js";
import { execRows, type Queryable } from "../utils/sql.js";

export type ReportStatus =
  | "submitted"
  | "validated"
  | "corroborated"
  | "evidence_backed"
  | "officially_acknowledged"
  | "rejected"
  | "withdrawn";

/**
 * Allowed report status transitions. Moves generally go forward along the trust
 * ladder; reject/withdraw are reachable from any live state; a rejected report
 * may be re-opened to `validated` on appeal. `withdrawn` is terminal.
 */
export const LEGAL_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: [
    "validated",
    "corroborated",
    "evidence_backed",
    "officially_acknowledged",
    "rejected",
    "withdrawn",
  ],
  validated: ["corroborated", "evidence_backed", "officially_acknowledged", "rejected", "withdrawn"],
  corroborated: ["evidence_backed", "officially_acknowledged", "rejected", "withdrawn"],
  evidence_backed: ["officially_acknowledged", "rejected", "withdrawn"],
  officially_acknowledged: ["rejected", "withdrawn"],
  rejected: ["validated", "withdrawn"],
  withdrawn: [],
};

export interface TransitionOpts {
  moderatorId?: string | null;
  note?: string | null;
}

export interface TransitionResult {
  id: string;
  public_id: string;
  from_status: ReportStatus;
  to_status: ReportStatus;
}

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return (LEGAL_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Move a report to `toStatus` and append a verification_events audit row.
 * Rejects unknown reports (404) and illegal transitions (409). Accepts a `Db`
 * or a transaction handle so callers can compose it in a larger atomic unit.
 */
export async function transitionReport(
  db: Queryable,
  publicId: string,
  toStatus: ReportStatus,
  method: string,
  opts: TransitionOpts = {},
): Promise<TransitionResult> {
  const [report] = await execRows<{ id: string; status: ReportStatus }>(
    db,
    sql`select id::text as id, status from reports where public_id = ${publicId} limit 1`,
  );
  if (!report) throw notFound("Report not found");

  const from = report.status;
  if (!canTransition(from, toStatus)) {
    throw conflict(`Illegal status transition: ${from} -> ${toStatus}`);
  }

  await db.execute(sql`
    update reports
    set status = ${toStatus}::report_status, status_changed_at = now(), updated_at = now()
    where id = ${report.id}::uuid
  `);

  await db.execute(sql`
    insert into verification_events (report_id, from_status, to_status, method, moderator_id, note)
    values (
      ${report.id}::uuid,
      ${from}::report_status,
      ${toStatus}::report_status,
      ${method},
      ${opts.moderatorId ?? null}::uuid,
      ${opts.note ?? null}
    )
  `);

  return { id: report.id, public_id: publicId, from_status: from, to_status: toStatus };
}

/**
 * Auto-promote independently corroborated reports: any (service, district) cell
 * with >= 3 live reports from >= 2 distinct IP buckets promotes its pending
 * (submitted/validated) reports to `corroborated`. Returns the transitions made.
 */
export async function corroborateEligible(db: Queryable): Promise<TransitionResult[]> {
  const eligible = await execRows<{ public_id: string }>(
    db,
    sql`
      with cell as (
        select service_id, district_id
        from reports
        where status in ('submitted','validated','corroborated','evidence_backed','officially_acknowledged')
        group by service_id, district_id
        having count(*) >= 3 and count(distinct ip_hash) >= 2
      )
      select r.public_id
      from reports r
      join cell c on c.service_id = r.service_id and c.district_id = r.district_id
      where r.status in ('submitted','validated')
      order by r.created_at asc
    `,
  );

  const results: TransitionResult[] = [];
  for (const row of eligible) {
    try {
      results.push(await transitionReport(db, row.public_id, "corroborated", "auto_corroboration"));
    } catch {
      // A concurrent change may have moved the report already; skip and continue.
    }
  }
  return results;
}
