import {
  evidenceReviewSchema,
  moderationDecisionSchema,
  moderationQueueQuerySchema,
} from "@rishwat/validation";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env.js";
import { badRequest, notFound } from "../../errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  canTransition,
  transitionReport,
  type ReportStatus,
} from "../../services/verification.service.js";
import { redactText } from "../../utils/redaction.js";
import { execRows, isoUtc } from "../../utils/sql.js";

export const moderation = new Hono<AppEnv>();

// Every moderation endpoint requires an authenticated moderator (admins too).
moderation.use("*", requireAuth);
moderation.use("*", requireRole("moderator"));

// citizen-facing action -> internal target status.
const ACTION_TO_STATUS = {
  mark_validated: "validated",
  reject: "rejected",
  acknowledge_officially: "officially_acknowledged",
  withdraw: "withdrawn",
} as const satisfies Record<string, ReportStatus>;

interface QueueRow {
  public_id: string;
  status: ReportStatus;
  description: string;
  abuse_score: string;
  duplicate_group_id: string | null;
  service_name: string;
  state_name: string;
  district_name: string;
  pending_evidence: number;
  created_at: string;
  status_changed_at: string;
}

interface QueueCountRow {
  total_count: number;
}

// GET /queue — triage list, highest abuse score first, then oldest. Descriptions
// are PII-redacted (privacy rule); filter by status via ?status=.
moderation.get("/queue", async (c) => {
  const parsed = moderationQueueQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw badRequest("Invalid query parameters", parsed.error.flatten());
  const { status, page, per_page } = parsed.data;
  const offset = (page - 1) * per_page;
  const statusCond = status ? sql`where r.status = ${status}::report_status` : sql``;

  const db = c.get("db");
  const [countRows, rows] = await Promise.all([
    execRows<QueueCountRow>(
      db,
      sql`
        select count(*)::int as total_count
        from reports r
        ${statusCond}
      `,
    ),
    execRows<QueueRow>(
      db,
      sql`
        select r.public_id, r.status, r.description, r.abuse_score::text as abuse_score,
          r.duplicate_group_id::text as duplicate_group_id,
          s.name as service_name, st.name as state_name, di.name as district_name,
          (select count(*)::int from evidence e
             where e.report_id = r.id and e.status = 'pending_review') as pending_evidence,
          ${isoUtc("r.created_at")} as created_at,
          ${isoUtc("r.status_changed_at")} as status_changed_at
        from reports r
        join services s on s.id = r.service_id
        join states st on st.id = r.state_id
        join districts di on di.id = r.district_id
        ${statusCond}
        order by r.abuse_score desc, r.created_at asc
        limit ${per_page} offset ${offset}
      `,
    ),
  ]);

  const total = countRows[0]?.total_count ?? 0;
  const items = rows.map((r) => ({
    public_id: r.public_id,
    status: r.status,
    service_name: r.service_name,
    state_name: r.state_name,
    district_name: r.district_name,
    abuse_score: r.abuse_score,
    duplicate_group_id: r.duplicate_group_id,
    pending_evidence: r.pending_evidence,
    description: redactText(r.description),
    created_at: r.created_at,
    status_changed_at: r.status_changed_at,
  }));
  return c.json({ total, page, per_page, items });
});

// POST /reports/decide — apply a moderator decision atomically: transition the
// report (validating the state machine) and log the moderation_actions audit row.
moderation.post("/reports/decide", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body === null) throw badRequest("Invalid JSON body");
  const parsed = moderationDecisionSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Validation failed", parsed.error.flatten());
  const { public_id, action, reason, source_url } = parsed.data;
  const user = c.get("user");
  const toStatus = ACTION_TO_STATUS[action];

  const result = await c.get("db").transaction(async (tx) => {
    const t = await transitionReport(tx, public_id, toStatus, `moderator_${action}`, {
      moderatorId: user.id,
      note: reason ?? null,
    });
    await tx.execute(sql`
      insert into moderation_actions (report_id, moderator_id, action, reason, source_url)
      values (${t.id}::uuid, ${user.id}::uuid, ${action}, ${reason ?? null}, ${source_url ?? null})
    `);
    return t;
  });

  return c.json({
    public_id: result.public_id,
    action,
    from_status: result.from_status,
    to_status: result.to_status,
  });
});

// POST /evidence/review — accept or reject a piece of evidence. Accepting it
// promotes the linked report to `evidence_backed` when that move is legal.
moderation.post("/evidence/review", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body === null) throw badRequest("Invalid JSON body");
  const parsed = evidenceReviewSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Validation failed", parsed.error.flatten());
  const { evidence_id, status, reason } = parsed.data;
  const user = c.get("user");

  const result = await c.get("db").transaction(async (tx) => {
    const [ev] = await execRows<{ report_public_id: string; report_status: ReportStatus }>(
      tx,
      sql`
        select r.public_id as report_public_id, r.status as report_status
        from evidence e join reports r on r.id = e.report_id
        where e.id = ${evidence_id}::uuid
        limit 1
      `,
    );
    if (!ev) throw notFound("Evidence not found");

    await tx.execute(sql`
      update evidence set status = ${status}::evidence_status, updated_at = now()
      where id = ${evidence_id}::uuid
    `);

    let promoted: ReportStatus | null = null;
    if (status === "accepted" && canTransition(ev.report_status, "evidence_backed")) {
      const t = await transitionReport(tx, ev.report_public_id, "evidence_backed", "evidence_review", {
        moderatorId: user.id,
        note: reason ?? null,
      });
      promoted = t.to_status;
    }
    return { report: ev.report_public_id, promoted };
  });

  return c.json({ evidence_id, status, report: result.report, promoted: result.promoted });
});
