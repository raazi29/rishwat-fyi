import { sql } from "drizzle-orm";
import {
  pgEnum, pgTable, uuid, text, integer, numeric, boolean, date,
  timestamp, index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";
import { services } from "./catalog.js";
import { states, districts, offices } from "./geo.js";

export const reportStatusEnum = pgEnum("report_status", [
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
  "rejected",
  "withdrawn",
]);

export const evidenceStatusEnum = pgEnum("evidence_status", [
  "pending_review",
  "accepted",
  "rejected",
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  public_id: text("public_id").notNull().unique(),
  service_id: uuid("service_id").notNull().references(() => services.id),
  state_id: uuid("state_id").notNull().references(() => states.id),
  district_id: uuid("district_id").notNull().references(() => districts.id),
  office_id: uuid("office_id").references(() => offices.id),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  official_fee_reported_inr: numeric("official_fee_reported_inr", { precision: 12, scale: 2 }),
  additional_amount_reported_inr: numeric("additional_amount_reported_inr", { precision: 12, scale: 2 }),
  amount_paid_inr: numeric("amount_paid_inr", { precision: 12, scale: 2 }),
  paid: boolean("paid").notNull().default(false),
  delay_days: integer("delay_days"),
  visits: integer("visits"),
  description: text("description").notNull(),
  status: reportStatusEnum("status").notNull().default("submitted"),
  status_changed_at: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
  // PII rule: only sha256 hex digests are ever stored, never raw values.
  ip_hash: text("ip_hash"),
  device_fingerprint_hash: text("device_fingerprint_hash"),
  submission_token_hash: text("submission_token_hash"),
  duplicate_group_id: uuid("duplicate_group_id"),
  abuse_score: numeric("abuse_score", { precision: 5, scale: 2 }).notNull().default("0"),
  ...timestamps,
}, (t) => [
  index("reports_service_status_idx").on(t.service_id, t.status),
  index("reports_district_status_idx").on(t.district_id, t.status),
  index("reports_created_at_idx").on(t.created_at),
  index("reports_duplicate_group_idx").on(t.duplicate_group_id),
  index("reports_ip_hash_idx").on(t.ip_hash),
  // Full-text GIN index over the free-text description (built-in to_tsvector,
  // needs no extension) — powers description search / issue-keyword scans.
  index("reports_description_fts_idx").using("gin", sql`to_tsvector('english', ${t.description})`),
]);

export const evidence = pgTable("evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  storage_key: text("storage_key").notNull(),
  mime_type: text("mime_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  status: evidenceStatusEnum("status").notNull().default("pending_review"),
  retention_until: timestamp("retention_until", { withTimezone: true }),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});
