import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { standardRateLimit } from "../middleware/rate-limit.js";
import { exportRows, toCsv } from "../services/export.service.js";

export const datasets = new Hono<AppEnv>();

// General read throughput cap (no-op under tests).
datasets.use("*", standardRateLimit);

// Public dataset exports contain only already-published reports, are non-
// sensitive, and change slowly. They are meant to be mirrored and bulk-
// downloaded (docs/mirroring.md), so a short shared cache lets CDNs and mirrors
// serve them without hammering the API while keeping the data reasonably fresh.
const DATASET_CACHE_CONTROL = "public, max-age=300";

// GET / — dataset index with download links.
datasets.get("/", (c) => {
  const base = c.get("config").publicBaseUrl.replace(/\/$/, "");
  c.header("Cache-Control", DATASET_CACHE_CONTROL);
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
    license: "Data: CC BY 4.0 (see LICENSE-DATA). Code: MIT (see LICENSE).",
    generated_at: new Date().toISOString(),
  });
});

// GET /reports.json — publishable reports as { total, rows }. Each row carries
// the columns documented in docs/data-dictionary.md; the row shape and the CSV
// column order share one source of truth (export.service.ts / EXPORT_COLUMNS).
datasets.get("/reports.json", async (c) => {
  const rows = await exportRows(c.get("db"));
  c.header("Cache-Control", DATASET_CACHE_CONTROL);
  return c.json({ total: rows.length, rows });
});

// GET /reports.csv — the same publishable reports as an RFC 4180 CSV download
// (quoted fields, CRLF record separators), produced by the shared toCsv().
datasets.get("/reports.csv", async (c) => {
  const csv = toCsv(await exportRows(c.get("db")));
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="rishwat-reports.csv"');
  c.header("Cache-Control", DATASET_CACHE_CONTROL);
  return c.body(csv);
});
