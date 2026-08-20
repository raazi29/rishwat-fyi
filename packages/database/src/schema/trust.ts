import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";
import { reports, reportStatusEnum } from "./reports.js";
import { users } from "./auth.js";

// Audit trail of every report status transition (plan §8). from_status is null
// for the initial "citizen_submission" event; moderator_id is null for automated
// transitions (e.g. auto_corroboration, auto_flag).
export const verificationEvents = pgTable("verification_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").notNull().references(() => reports.id),
  from_status: reportStatusEnum("from_status"),
  to_status: reportStatusEnum("to_status").notNull(),
  method: text("method").notNull(),
  moderator_id: uuid("moderator_id"),
  note: text("note"),
  ...timestamps,
});

// Moderator decision log (plan §20): every human moderation action is preserved.
export const moderationActions = pgTable("moderation_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").notNull().references(() => reports.id),
  moderator_id: uuid("moderator_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  reason: text("reason"),
  source_url: text("source_url"),
  ...timestamps,
});
