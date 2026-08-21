import { existsSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  EVIDENCE_RETENTION_DAYS,
  purgeExpiredEvidence,
} from "../src/services/retention.service.js";
import { sha256Hex } from "../src/utils/hashing.js";
import { bootTestApp, createTestAdmin, createTestModerator } from "./helpers.js";

/**
 * Proves the evidence-retention promise in docs/privacy.md is actually kept:
 *   1. `POST /evidence` stamps `retention_until` (~90 days out).
 *   2. The purge deletes expired evidence from BOTH the real LocalStorage on
 *      disk AND the metadata table.
 *   3. The purge NEVER touches evidence whose window has not passed.
 *   4. `POST /admin/jobs/purge-evidence` is admin-only.
 *
 * It runs against the real test DB and the real LocalStorage from bootTestApp;
 * on-disk existence is checked with node:fs at the real path, not the return
 * value, because "the file is gone" is the whole point.
 */

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let adminToken: string;
let moderatorToken: string;

let serviceId: string;
let stateId: string;
let districtId: string;
let reportId: string;

const DESC = "Retention test report — long enough to satisfy the description length rule.";

// POST /evidence requires the submitter's one-time token, so the fixture report
// is created with a known token whose digest is what the endpoint checks.
const SUBMISSION_TOKEN = "retention-test-submission-token";

// Absolute on-disk path LocalStorage writes a key to (baseDir/<key>).
function diskPath(key: string): string {
  return path.resolve(boot.storageDir, key);
}

async function insertEvidence(sha: string, retentionSql: ReturnType<typeof sql>): Promise<string> {
  const key = `${reportId}/${sha}`;
  // Put real bytes on disk through the actual storage driver, then record the
  // matching metadata row with the given retention_until.
  await boot.storage.put(key, new Uint8Array([1, 2, 3, 4]), "image/png");
  await boot.db.execute(sql`
    insert into evidence
      (report_id, storage_key, mime_type, size_bytes, sha256, status, retention_until)
    values
      (${reportId}::uuid, ${key}, 'image/png', 4, ${sha}, 'pending_review', ${retentionSql})
  `);
  return key;
}

function evidenceExistsInDb(key: string): Promise<boolean> {
  return (
    boot.db.execute(
      sql`select 1 from evidence where storage_key = ${key} limit 1`,
    ) as unknown as Promise<unknown[]>
  ).then((rows) => rows.length > 0);
}

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  adminToken = (await createTestAdmin(boot.db, boot.config)).token;
  moderatorToken = (await createTestModerator(boot.db, boot.config)).token;

  const svc = (await boot.db.execute(sql`select id::text as id from services limit 1`)) as any;
  serviceId = svc[0].id;
  const loc = (await boot.db.execute(
    sql`select id::text as id, state_id::text as state_id from districts limit 1`,
  )) as any;
  districtId = loc[0].id;
  stateId = loc[0].state_id;

  const publicId = `R-${Math.random().toString(36).slice(2, 10)}`;
  const rep = (await boot.db.execute(sql`
    insert into reports (public_id, service_id, state_id, district_id, period_start, period_end, description, submission_token_hash)
    values (${publicId}, ${serviceId}::uuid, ${stateId}::uuid, ${districtId}::uuid, '2024-01-01', '2024-02-01', ${DESC}, ${sha256Hex(SUBMISSION_TOKEN)})
    returning id::text as id
  `)) as any;
  reportId = rep[0].id;
});

afterAll(async () => {
  // Cascade-delete our report (removes any remaining evidence rows), then drop
  // the temp storage dir and close the client.
  await boot.db.execute(sql`delete from reports where id = ${reportId}::uuid`);
  await boot.cleanup();
});

describe("purgeExpiredEvidence — retention enforcement", () => {
  it("deletes expired evidence from disk and DB, and leaves live evidence untouched", async () => {
    const expiredSha = "e".repeat(64);
    const liveSha = "1".repeat(64);
    const expiredKey = await insertEvidence(expiredSha, sql`now() - interval '1 day'`);
    const liveKey = await insertEvidence(liveSha, sql`now() + interval '90 days'`);

    // Preconditions: both files really exist on disk and both rows exist.
    expect(existsSync(diskPath(expiredKey))).toBe(true);
    expect(existsSync(diskPath(liveKey))).toBe(true);
    expect(await evidenceExistsInDb(expiredKey)).toBe(true);
    expect(await evidenceExistsInDb(liveKey)).toBe(true);

    const summary = await purgeExpiredEvidence(boot.db, boot.storage);

    // The expired object was examined and removed (>= because the shared test DB
    // may hold other rows; we assert precisely on our own two below).
    expect(summary.examined).toBeGreaterThanOrEqual(1);
    expect(summary.deleted).toBeGreaterThanOrEqual(1);
    expect(summary.failed).toBe(0);
    expect(summary.failedKeys).toEqual([]);

    // Expired: gone from BOTH the metadata table and the real filesystem.
    expect(await evidenceExistsInDb(expiredKey)).toBe(false);
    expect(existsSync(diskPath(expiredKey))).toBe(false);
    // ...including the sidecar metadata file LocalStorage writes.
    expect(existsSync(`${diskPath(expiredKey)}.meta`)).toBe(false);

    // Live evidence: completely untouched — row present, file present. Deleting
    // this would be catastrophic, so it matters as much as the deletion above.
    expect(await evidenceExistsInDb(liveKey)).toBe(true);
    expect(existsSync(diskPath(liveKey))).toBe(true);
  });
});

describe("POST /evidence — retention_until stamping", () => {
  it("returns a non-null retention_until roughly 90 days out", async () => {
    const form = new FormData();
    form.append("report_id", reportId);
    form.append("token", SUBMISSION_TOKEN);
    form.append("file", new File([new Uint8Array([9, 8, 7, 6, 5])], "receipt.png", { type: "image/png" }));

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { retention_until: string | null; status: string };
    expect(body.status).toBe("pending_review");
    expect(body.retention_until).not.toBeNull();

    const days = (new Date(body.retention_until as string).getTime() - Date.now()) / 86_400_000;
    // Allow a day of slack around the documented window.
    expect(days).toBeGreaterThan(EVIDENCE_RETENTION_DAYS - 1);
    expect(days).toBeLessThan(EVIDENCE_RETENTION_DAYS + 1);
  });
});

describe("POST /admin/jobs/purge-evidence — authorization", () => {
  it("returns 200 with a purge summary for an admin token", async () => {
    const res = await app.request("/admin/jobs/purge-evidence", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      job: string;
      examined: number;
      deleted: number;
      failed: number;
    };
    expect(body.job).toBe("purge-evidence");
    expect(typeof body.examined).toBe("number");
    expect(typeof body.deleted).toBe("number");
    expect(typeof body.failed).toBe("number");
  });

  it("returns 403 for a moderator token (jobs are admin-only)", async () => {
    const res = await app.request("/admin/jobs/purge-evidence", {
      method: "POST",
      headers: { authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});
