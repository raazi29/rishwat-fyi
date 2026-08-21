import {
  districts,
  evidence as evidenceTable,
  reports as reportsTable,
  services as servicesTable,
  states,
  verificationEvents,
} from "@rishwat/database";
import { publicIdSchema, reportSubmissionSchema } from "@rishwat/validation";
import { timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { DEFAULT_TRUSTED_PROXY_HOPS } from "../config.js";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { standardRateLimit, strictRateLimit } from "../middleware/rate-limit.js";
import { evaluateAbuse } from "../services/abuse.service.js";
import { findDuplicateGroup } from "../services/duplication.service.js";
import { clientIp } from "../utils/client-ip.js";
import { publicReportId, randomToken, sha256Hex } from "../utils/hashing.js";
import { redactText } from "../utils/redaction.js";
import { execRows } from "../utils/sql.js";

export const reports = new Hono<AppEnv>();

// numeric(12,2) columns are represented as strings by the driver.
const inr = (n: number | undefined): string | null => (n === undefined ? null : n.toFixed(2));

// Constant-time comparison of two hex digests of equal length.
function hashEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// POST / — submit a report. Body is validated, referential targets are checked
// (400 rather than a raw FK 500), IP/device are hashed, and the report plus its
// initial verification event are inserted. Returns 201 with a one-time token the
// submitter uses to check status later.
reports.post("/", strictRateLimit, async (c) => {
  const db = c.get("db");
  const body = await c.req.json().catch(() => null);
  if (body === null) throw badRequest("Invalid JSON body");

  const parsed = reportSubmissionSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Validation failed", parsed.error.flatten());
  const input = parsed.data;

  const exists = async (table: string, id: string): Promise<boolean> =>
    (await execRows(db, sql`select 1 from ${sql.raw(table)} where id = ${id} limit 1`)).length > 0;

  // Resolve the service to its internal uuid. The schema guarantees exactly one
  // of service_id / service_slug is present; slug is the common case for a
  // slug-first public API, while the uuid path serves clients that already hold
  // it (e.g. from GET /services/:slug). The error names the field the caller
  // actually sent so the message is actionable.
  let serviceId: string;
  if (input.service_id !== undefined) {
    if (!(await exists("services", input.service_id))) throw badRequest("Unknown service_id");
    serviceId = input.service_id;
  } else if (input.service_slug !== undefined) {
    const [svc] = await execRows<{ id: string }>(
      db,
      sql`select id::text as id from services where slug = ${input.service_slug} limit 1`,
    );
    if (!svc) throw badRequest("Unknown service_slug");
    serviceId = svc.id;
  } else {
    // Unreachable: the schema requires exactly one of service_id / service_slug.
    throw badRequest("exactly one of service_id or service_slug is required");
  }

  if (!(await exists("states", input.state_id))) throw badRequest("Unknown state_id");
  const [di] = await db
    .select({ state_id: districts.state_id })
    .from(districts)
    .where(eq(districts.id, input.district_id))
    .limit(1);
  if (!di) throw badRequest("Unknown district_id");
  if (di.state_id !== input.state_id) throw badRequest("district_id does not belong to state_id");
  if (input.office_id && !(await exists("offices", input.office_id))) throw badRequest("Unknown office_id");

  // ip_hash is the independence signal behind `count(distinct ip_hash) >= 2`,
  // which gates auto-corroboration and public aggregate publication. It must
  // therefore come from an address the submitter cannot choose: clientIp() only
  // reads forwarding headers as deep as `trustedProxyHops` permits, and returns
  // null (→ no ip_hash, contributing no independence) when nothing is trustworthy.
  // Only the digest is ever persisted (PII rule).
  const ip = clientIp(c, c.get("config").trustedProxyHops ?? DEFAULT_TRUSTED_PROXY_HOPS);
  const device = c.req.header("x-device-fingerprint");
  const ipHash = ip ? sha256Hex(ip) : null;
  const deviceHash = device ? sha256Hex(device) : null;
  const token = randomToken();

  // Duplicate detection: attach to an existing near-duplicate group if one is
  // found for this (service, district). A unique report keeps a null group —
  // we never invent a group for a report with no match.
  const dup = await findDuplicateGroup(db, serviceId, input.district_id, input.description);

  // Abuse heuristics feed moderation triage only; they never block submission.
  const abuse = await evaluateAbuse(db, {
    serviceId,
    districtId: input.district_id,
    ipHash,
    deviceHash,
    description: input.description,
  });

  const [inserted] = await db
    .insert(reportsTable)
    .values({
      public_id: publicReportId(),
      service_id: serviceId,
      state_id: input.state_id,
      district_id: input.district_id,
      office_id: input.office_id ?? null,
      period_start: input.period_start,
      period_end: input.period_end,
      official_fee_reported_inr: inr(input.official_fee_reported_inr),
      additional_amount_reported_inr: inr(input.additional_amount_reported_inr),
      amount_paid_inr: inr(input.amount_paid_inr),
      paid: input.paid,
      delay_days: input.delay_days ?? null,
      visits: input.visits ?? null,
      description: input.description,
      ip_hash: ipHash,
      device_fingerprint_hash: deviceHash,
      submission_token_hash: sha256Hex(token),
      duplicate_group_id: dup.duplicateGroupId,
      // numeric(5,2) is a string in this driver — format like inr() does.
      abuse_score: abuse.score.toFixed(2),
    })
    .returning({ id: reportsTable.id, public_id: reportsTable.public_id, status: reportsTable.status });
  if (!inserted) throw new Error("Report insert returned no row");

  await db.insert(verificationEvents).values({
    report_id: inserted.id,
    to_status: "submitted",
    method: "citizen_submission",
  });

  // High abuse score → flag for a moderator, but the report STAYS 'submitted';
  // a human decides. No auto-rejection.
  if (abuse.score >= 70) {
    await db.insert(verificationEvents).values({
      report_id: inserted.id,
      to_status: "submitted",
      method: "auto_flag",
      note: abuse.signals.length > 0 ? abuse.signals.join(",") : "suspected_coordinated",
    });
  }

  return c.json({ public_id: inserted.public_id, token, status: inserted.status }, 201);
});

// GET /:publicId/status — submitter-only status check. The one-time token must
// hash to the stored digest; a mismatch returns 404 (existence is not leaked).
reports.get("/:publicId/status", standardRateLimit, async (c) => {
  const idParsed = publicIdSchema.safeParse(c.req.param("publicId"));
  if (!idParsed.success) throw badRequest("Invalid report id");
  const token = c.req.query("token") ?? c.req.header("x-report-token");
  if (!token) throw badRequest("Missing report token");

  const [row] = await c
    .get("db")
    .select({
      status: reportsTable.status,
      status_changed_at: reportsTable.status_changed_at,
      token_hash: reportsTable.submission_token_hash,
    })
    .from(reportsTable)
    .where(eq(reportsTable.public_id, idParsed.data))
    .limit(1);

  if (!row || !row.token_hash || !hashEquals(row.token_hash, sha256Hex(token))) {
    throw notFound("Report not found");
  }
  return c.json({
    public_id: idParsed.data,
    status: row.status,
    status_changed_at: row.status_changed_at,
  });
});

// GET /:publicId — public, shareable view. Description is redacted; only names
// (never internal ids or PII hashes) and non-sensitive evidence metadata leak.
reports.get("/:publicId", standardRateLimit, async (c) => {
  const idParsed = publicIdSchema.safeParse(c.req.param("publicId"));
  if (!idParsed.success) throw badRequest("Invalid report id");
  const db = c.get("db");

  const [row] = await db
    .select({
      id: reportsTable.id,
      public_id: reportsTable.public_id,
      status: reportsTable.status,
      period_start: reportsTable.period_start,
      period_end: reportsTable.period_end,
      official_fee_reported_inr: reportsTable.official_fee_reported_inr,
      additional_amount_reported_inr: reportsTable.additional_amount_reported_inr,
      amount_paid_inr: reportsTable.amount_paid_inr,
      paid: reportsTable.paid,
      delay_days: reportsTable.delay_days,
      visits: reportsTable.visits,
      description: reportsTable.description,
      created_at: reportsTable.created_at,
      service_slug: servicesTable.slug,
      service_name: servicesTable.name,
      state_name: states.name,
      district_name: districts.name,
    })
    .from(reportsTable)
    .innerJoin(servicesTable, eq(servicesTable.id, reportsTable.service_id))
    .innerJoin(states, eq(states.id, reportsTable.state_id))
    .innerJoin(districts, eq(districts.id, reportsTable.district_id))
    .where(eq(reportsTable.public_id, idParsed.data))
    .limit(1);

  if (!row) throw notFound("Report not found");

  const ev = await db
    .select({
      id: evidenceTable.id,
      mime_type: evidenceTable.mime_type,
      size_bytes: evidenceTable.size_bytes,
      sha256: evidenceTable.sha256,
      status: evidenceTable.status,
      uploaded_at: evidenceTable.uploaded_at,
    })
    .from(evidenceTable)
    .where(eq(evidenceTable.report_id, row.id));

  return c.json({
    public_id: row.public_id,
    status: row.status,
    service: { slug: row.service_slug, name: row.service_name },
    location: { state: row.state_name, district: row.district_name },
    period: { start: row.period_start, end: row.period_end },
    experience: {
      official_fee_reported_inr: row.official_fee_reported_inr,
      additional_amount_reported_inr: row.additional_amount_reported_inr,
      amount_paid_inr: row.amount_paid_inr,
      paid: row.paid,
      delay_days: row.delay_days,
      visits: row.visits,
    },
    description: redactText(row.description),
    evidence: ev,
    created_at: row.created_at,
  });
});
