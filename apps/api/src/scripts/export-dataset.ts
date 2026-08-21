import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createDb } from "@rishwat/database";
import { EXPORT_COLUMNS, exportRows, toCsv } from "../services/export.service.js";

/**
 * Version of the export schema. Bump this whenever EXPORT_COLUMNS changes shape
 * so downstream mirrors can detect a breaking change rather than silently
 * misreading a column (docs/mirroring.md — "The mirror manifest").
 */
const EXPORT_SCHEMA_VERSION = "1.0";

/**
 * Write the public, PII-redacted dataset (publishable reports only) to
 * data/exports/ as timestamped CSV + JSON, plus the manifest.json that mirrors
 * use to tell readers when a snapshot was generated and what it contains.
 * Reads DATABASE_URL from env; the output directory can be overridden with
 * EXPORT_DIR.
 *
 *   DATABASE_URL=... npm run export
 */
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const outDir = process.env.EXPORT_DIR ?? resolve(process.cwd(), "data/exports");
  await mkdir(outDir, { recursive: true });

  const { db, client } = createDb(databaseUrl);
  try {
    const rows = await exportRows(db);
    const stamp = new Date().toISOString().slice(0, 10);
    const csvPath = resolve(outDir, `rishwat-reports-${stamp}.csv`);
    const jsonPath = resolve(outDir, `rishwat-reports-${stamp}.json`);

    const manifestPath = resolve(outDir, "manifest.json");
    const manifest = {
      generated_at: new Date().toISOString(),
      counts: { reports: rows.length },
      schema_version: EXPORT_SCHEMA_VERSION,
      // Column order is part of the dataset contract (docs/data-dictionary.md),
      // so publish it rather than making mirrors infer it from the CSV header.
      columns: EXPORT_COLUMNS,
      files: [basename(csvPath), basename(jsonPath)],
    };

    await writeFile(csvPath, toCsv(rows), "utf8");
    await writeFile(jsonPath, `${JSON.stringify({ total: rows.length, rows }, null, 2)}\n`, "utf8");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    console.log(`\u2713 Exported ${rows.length} publishable report(s)`);
    console.log(`  CSV:      ${csvPath}`);
    console.log(`  JSON:     ${jsonPath}`);
    console.log(`  Manifest: ${manifestPath}`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("export-dataset failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
