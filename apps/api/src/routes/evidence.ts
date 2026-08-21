import { evidence as evidenceTable, reports as reportsTable } from "@rishwat/database";
import { publicIdSchema, uuidSchema } from "@rishwat/validation";
import { eq, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { evidenceRateLimit } from "../middleware/rate-limit.js";
import { evidenceRetentionUntil } from "../services/retention.service.js";
import { digestEquals, sha256Hex } from "../utils/hashing.js";

export const evidence = new Hono<AppEnv>();

// Mirrors evidenceUploadSchema.size_bytes upper bound (20 MiB).
const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
// Evidence is receipts / photos / scanned documents — reject anything else.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

// POST / — multipart upload. Identifies and authorizes the linked report,
// validates size and content type, stores the bytes in the configured backend
// (key = report/sha256) and records an evidence row (status defaults to
// pending_review for moderation).
evidence.post("/", evidenceRateLimit, async (c) => {
  const db = c.get("db");
  const body = await c.req.parseBody();

  // Identify the report. Submitters hold the public id ("R-xxxxxxxx") plus the
  // one-time token handed back by POST /reports — the internal uuid is never
  // exposed publicly — so public_id is the primary path. report_id stays
  // accepted for server-side callers that already know the uuid.
  const publicIdRaw = typeof body.public_id === "string" ? body.public_id : undefined;
  const reportIdRaw = typeof body.report_id === "string" ? body.report_id : undefined;

  let match: SQL | undefined;
  if (publicIdRaw !== undefined) {
    const parsed = publicIdSchema.safeParse(publicIdRaw);
    if (!parsed.success) throw badRequest("Invalid public_id");
    match = eq(reportsTable.public_id, parsed.data);
  } else {
    const parsed = uuidSchema.safeParse(reportIdRaw);
    if (!parsed.success) throw badRequest("Provide either public_id or report_id");
    match = eq(reportsTable.id, parsed.data);
  }

  const token = typeof body.token === "string" ? body.token : undefined;
  if (!token) throw badRequest("Missing report token");

  const file = body.file;
  if (!(file instanceof File)) throw badRequest("Missing file upload (field 'file')");
  if (file.size <= 0) throw badRequest("Empty file");
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw badRequest(`File exceeds maximum size of ${MAX_EVIDENCE_BYTES} bytes`);
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) throw badRequest(`Unsupported content type: ${mime}`);

  const [report] = await db
    .select({ id: reportsTable.id, token_hash: reportsTable.submission_token_hash })
    .from(reportsTable)
    .where(match)
    .limit(1);

  // Ownership check. Only the submitter, who holds the one-time token, may
  // attach evidence: an accepted piece of evidence promotes its report to
  // `evidence_backed`, so without this anyone could bolt fabricated evidence
  // onto someone else's report and manufacture that promotion. A wrong token
  // and an unknown report are deliberately indistinguishable (both 404), the
  // same rule GET /reports/:publicId/status follows.
  if (!report || !report.token_hash || !digestEquals(report.token_hash, sha256Hex(token))) {
    throw notFound("Report not found");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = sha256Hex(bytes);
  const key = `${report.id}/${sha256}`;
  const stored = await c.get("storage").put(key, bytes, mime);

  // Stamp the retention window now (privacy.md: retention_until = now + 90 days)
  // so the scheduled purge (POST /admin/jobs/purge-evidence, `npm run
  // purge-evidence`) can later delete the file from storage and metadata alike.
  const retentionUntil = evidenceRetentionUntil();
  const [row] = await db
    .insert(evidenceTable)
    .values({
      report_id: report.id,
      storage_key: key,
      mime_type: mime,
      size_bytes: stored.size,
      sha256,
      retention_until: retentionUntil,
    })
    .returning({
      id: evidenceTable.id,
      status: evidenceTable.status,
      retention_until: evidenceTable.retention_until,
    });
  if (!row) throw new Error("Evidence insert returned no row");

  return c.json(
    {
      id: row.id,
      report_id: report.id,
      mime_type: mime,
      size_bytes: stored.size,
      sha256,
      status: row.status,
      retention_until: row.retention_until,
    },
    201,
  );
});

// GET /:id — evidence metadata only (never the bytes or internal storage key).
evidence.get("/:id", async (c) => {
  const idParsed = uuidSchema.safeParse(c.req.param("id"));
  if (!idParsed.success) throw badRequest("Invalid evidence id");

  const [row] = await c
    .get("db")
    .select({
      id: evidenceTable.id,
      report_id: evidenceTable.report_id,
      mime_type: evidenceTable.mime_type,
      size_bytes: evidenceTable.size_bytes,
      sha256: evidenceTable.sha256,
      status: evidenceTable.status,
      uploaded_at: evidenceTable.uploaded_at,
    })
    .from(evidenceTable)
    .where(eq(evidenceTable.id, idParsed.data))
    .limit(1);
  if (!row) throw notFound("Evidence not found");
  return c.json(row);
});
