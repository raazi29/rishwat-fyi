import { evidence as evidenceTable, reports as reportsTable } from "@rishwat/database";
import { uuidSchema } from "@rishwat/validation";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { evidenceRateLimit } from "../middleware/rate-limit.js";
import { sha256Hex } from "../utils/hashing.js";

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

// POST / — multipart upload. Validates the linked report, size and content type,
// stores the bytes in the configured backend (key = report/sha256) and records
// an evidence row (status defaults to pending_review for moderation).
evidence.post("/", evidenceRateLimit, async (c) => {
  const db = c.get("db");
  const body = await c.req.parseBody();

  const reportId = typeof body.report_id === "string" ? body.report_id : undefined;
  const idParsed = uuidSchema.safeParse(reportId);
  if (!idParsed.success) throw badRequest("Invalid or missing report_id");

  const file = body.file;
  if (!(file instanceof File)) throw badRequest("Missing file upload (field 'file')");
  if (file.size <= 0) throw badRequest("Empty file");
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw badRequest(`File exceeds maximum size of ${MAX_EVIDENCE_BYTES} bytes`);
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) throw badRequest(`Unsupported content type: ${mime}`);

  const [report] = await db
    .select({ id: reportsTable.id })
    .from(reportsTable)
    .where(eq(reportsTable.id, idParsed.data))
    .limit(1);
  if (!report) throw notFound("Report not found");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = sha256Hex(bytes);
  const key = `${report.id}/${sha256}`;
  const stored = await c.get("storage").put(key, bytes, mime);

  const [row] = await db
    .insert(evidenceTable)
    .values({
      report_id: report.id,
      storage_key: key,
      mime_type: mime,
      size_bytes: stored.size,
      sha256,
    })
    .returning({ id: evidenceTable.id, status: evidenceTable.status });
  if (!row) throw new Error("Evidence insert returned no row");

  return c.json(
    { id: row.id, report_id: report.id, mime_type: mime, size_bytes: stored.size, sha256, status: row.status },
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
