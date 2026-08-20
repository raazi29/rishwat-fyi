import type { Db } from "@rishwat/database";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { standardRateLimit } from "../middleware/rate-limit.js";
import { redactText } from "../utils/redaction.js";
import { execRows, isoUtc, PUBLISHABLE_STATUSES } from "../utils/sql.js";

export const datasets = new Hono<AppEnv>();

// General read throughput cap (no-op under tests).
datasets.use("*", standardRateLimit);

interface ExportRow {
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

const COLUMNS: (keyof ExportRow)[] = [
  "public_id", "service_slug", "service_name", "department", "state", "district",
  "period_start", "period_end", "official_fee_reported_inr",
  "additional_amount_reported_inr", "amount_paid_inr", "paid", "delay_days",
  "visits", "status", "description", "created_at",
];

// Only publishable reports leave the system, and free-text descriptions are
// PII-redacted before export (see docs/data-dictionary.md).
async function exportRows(db: Db): Promise<ExportRow[]> {
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

function toCsv(rows: ExportRow[]): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [COLUMNS.join(",")];
  for (const r of rows) lines.push(COLUMNS.map((col) => esc(r[col])).join(","));
  return lines.join("\n");
}

// GET / — dataset index with download links.
datasets.get("/", (c) => {
  const base = c.get("config").publicBaseUrl.replace(/\/$/, "");
  return c.json({
    datasets: [
      {
        name: "reports",
        description: "Publishable citizen reports, PII-redacted.",
        formats: {
          csv: `${base}/datasets/reports.csv`,
          json: `${base}/datasets/reports.json`,
        },
      },
    ],
    license: "Open data — see docs/governance.md",
    generated_at: new Date().toISOString(),
  });
});

// GET /reports.json — publishable reports as JSON.
datasets.get("/reports.json", async (c) => {
  const rows = await exportRows(c.get("db"));
  return c.json({ total: rows.length, rows });
});

// GET /reports.csv — publishable reports as a CSV download.
datasets.get("/reports.csv", async (c) => {
  const csv = toCsv(await exportRows(c.get("db")));
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="rishwat-reports.csv"');
  return c.body(csv);
});
