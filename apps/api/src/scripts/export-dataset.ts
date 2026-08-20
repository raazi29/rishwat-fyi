import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDb } from "@rishwat/database";
import { exportRows, toCsv } from "../services/export.service.js";

/**
 * Write the public, PII-redacted dataset (publishable reports only) to
 * data/exports/ as timestamped CSV + JSON. Reads DATABASE_URL from env; the
 * output directory can be overridden with EXPORT_DIR.
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

    await writeFile(csvPath, toCsv(rows), "utf8");
    await writeFile(jsonPath, `${JSON.stringify({ total: rows.length, rows }, null, 2)}\n`, "utf8");

    console.log(`\u2713 Exported ${rows.length} publishable report(s)`);
    console.log(`  CSV:  ${csvPath}`);
    console.log(`  JSON: ${jsonPath}`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("export-dataset failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
