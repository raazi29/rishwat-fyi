import type { Db } from "@rishwat/database";
import { sql } from "drizzle-orm";
import { redactText } from "../utils/redaction.js";
import { execRows, isoUtc, PUBLISHABLE_STATUSES } from "../utils/sql.js";

export interface ExportRow {
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

// Public dataset column order (docs/data-dictionary.md).
export const EXPORT_COLUMNS: (keyof ExportRow)[] = [
  "public_id",
  "service_slug",
  "service_name",
  "department",
  "state",
  "district",
  "period_start",
  "period_end",
  "official_fee_reported_inr",
  "additional_amount_reported_inr",
  "amount_paid_inr",
  "paid",
  "delay_days",
  "visits",
  "status",
  "description",
  "created_at",
];

/**
 * Publishable reports joined to their service / department / location, with the
 * free-text description PII-redacted. Only the publishable status set ever
 * leaves the system (docs/data-dictionary.md, docs/privacy.md).
 */
export async function exportRows(db: Db): Promise<ExportRow[]> {
  const rows = await execRows<ExportRow>(
    db,
    sql`
      select r.public_id, s.slug as service_slug, s.name as service_name,
        dep.name as department, st.name as state, di.name as district,
        r.period_start, r.period_end,
        r.official_fee_reported_inr, r.additional_amount_reported_inr, r.amount_paid_inr,
        r.paid, r.delay_days, r.visits, r.status, r.description,
        ${isoUtc("r.created_at")} as created_at
      from reports r
      join services s on s.id = r.service_id
      join departments dep on dep.id = s.department_id
      join states st on st.id = r.state_id
      join districts di on di.id = r.district_id
      where r.status in ${PUBLISHABLE_STATUSES}
      order by r.created_at desc
    `,
  );
  return rows.map((r) => ({ ...r, description: redactText(r.description) }));
}

/**
 * RFC 4180 CSV: fields containing a quote, comma, CR or LF are wrapped in double
 * quotes with embedded quotes doubled; records are separated by CRLF and the
 * output is terminated by a trailing CRLF.
 */
export function toCsv(rows: ExportRow[]): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [EXPORT_COLUMNS.join(",")];
  for (const r of rows) lines.push(EXPORT_COLUMNS.map((col) => esc(r[col])).join(","));
  return lines.join("\r\n") + "\r\n";
}
