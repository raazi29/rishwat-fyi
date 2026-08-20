import {
  pgTable, uuid, text, numeric, integer, boolean, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";
import { services } from "./catalog.js";
import { states, districts } from "./geo.js";

// Precomputed public statistics per (service, district, metric_type) cell.
// `value` is null when the publishing threshold is not met (plan §8/§9); the
// raw report_count / ip_bucket_count are still recorded so "no signal" is visible.
export const aggregateMetrics = pgTable("aggregate_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  service_id: uuid("service_id").notNull().references(() => services.id),
  state_id: uuid("state_id").notNull().references(() => states.id),
  district_id: uuid("district_id").notNull().references(() => districts.id),
  metric_type: text("metric_type").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
  report_count: integer("report_count").notNull().default(0),
  ip_bucket_count: integer("ip_bucket_count").notNull().default(0),
  published: boolean("published").notNull().default(false),
  computed_at: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (t) => [
  uniqueIndex("aggregate_metrics_cell_idx").on(t.service_id, t.district_id, t.metric_type),
]);
