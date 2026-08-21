import { createDb } from "@rishwat/database";
import { loadConfig } from "../config.js";
import { purgeExpiredEvidence } from "../services/retention.service.js";
import { createEvidenceStorage } from "../storage/index.js";

/**
 * Enforce the evidence retention policy (docs/privacy.md): permanently delete
 * every evidence file whose `retention_until` has passed, from BOTH the storage
 * backend and the metadata table. This is what a production cron invokes on a
 * schedule (e.g. daily).
 *
 * It reads the SAME configuration the API uses (`loadConfig`) and builds the
 * storage driver the SAME way (`createEvidenceStorage(config.storage)`), so it
 * purges exactly the backend the API wrote to — local filesystem or Supabase.
 *
 *   DATABASE_URL=... JWT_SECRET=... EVIDENCE_STORAGE_DRIVER=... npm run purge-evidence
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const storage = createEvidenceStorage(config.storage);
  const { db, client } = createDb(config.databaseUrl);
  try {
    const summary = await purgeExpiredEvidence(db, storage);
    console.log(
      `\u2713 Purged expired evidence: ${summary.deleted} deleted, ${summary.failed} failed ` +
        `(of ${summary.examined} examined)`,
    );
    if (summary.failed > 0) {
      // Do not print the keys (internal ids); the count is enough for a cron log.
      console.error(
        `  ${summary.failed} object(s) could not be removed and were left for the next run.`,
      );
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("purge-evidence failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
