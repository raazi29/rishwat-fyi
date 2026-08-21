import { evidence as evidenceTable, type Db } from "@rishwat/database";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import type { EvidenceStorage } from "../storage/evidence.storage.js";

/**
 * Evidence retention policy (docs/privacy.md — "Evidence retention — 90 days").
 * This module is the single source of truth for the window: the upload handler
 * stamps `retention_until` with {@link evidenceRetentionUntil}, and
 * {@link purgeExpiredEvidence} is what actually deletes files once it passes.
 */
export const EVIDENCE_RETENTION_DAYS = 90;

const RETENTION_MS = EVIDENCE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** The instant a file uploaded at `from` (default: now) becomes eligible for purge. */
export function evidenceRetentionUntil(from: Date = new Date()): Date {
  return new Date(from.getTime() + RETENTION_MS);
}

export interface PurgeSummary {
  /** Rows whose retention_until was non-null and in the past. */
  examined: number;
  /** Rows whose file was removed (or already absent) AND metadata row deleted. */
  deleted: number;
  /** Rows left in place because their storage object could not be removed. */
  failed: number;
  /**
   * Storage keys that could not be purged, for operator triage. A key is an
   * internal id (`<report-uuid>/<sha256>`), never PII — but it is still internal,
   * so only expose this on admin/operator surfaces, never a public one.
   */
  failedKeys: string[];
}

/**
 * Enforce the evidence retention promise: for every evidence row whose
 * `retention_until` has passed, delete the object from the storage backend AND
 * the metadata row — exactly the guarantee docs/privacy.md makes.
 *
 * Ordering is deliberate and load-bearing: the storage object is removed FIRST,
 * and the DB row is dropped only if that succeeded (or the object was already
 * absent — `EvidenceStorage.delete` is a documented no-op for a missing key, and
 * both LocalStorage's `fs.rm({ force: true })` and SupabaseStorage's `remove`
 * resolve in that case). Deleting the row first would strand the file with no
 * record to ever find it by. Each object is handled independently so one
 * failure never aborts the sweep; failures are collected and reported.
 */
export async function purgeExpiredEvidence(
  db: Db,
  storage: EvidenceStorage,
  now: Date = new Date(),
): Promise<PurgeSummary> {
  const expired = await db
    .select({ id: evidenceTable.id, storage_key: evidenceTable.storage_key })
    .from(evidenceTable)
    .where(and(isNotNull(evidenceTable.retention_until), lt(evidenceTable.retention_until, now)));

  let deleted = 0;
  const failedKeys: string[] = [];

  for (const row of expired) {
    try {
      await storage.delete(row.storage_key);
      await db.delete(evidenceTable).where(eq(evidenceTable.id, row.id));
      deleted += 1;
    } catch {
      // Storage deletion failed — keep the metadata row so this object is
      // retried on the next run rather than orphaned. Record the key and move on.
      failedKeys.push(row.storage_key);
    }
  }

  return { examined: expired.length, deleted, failed: failedKeys.length, failedKeys };
}
