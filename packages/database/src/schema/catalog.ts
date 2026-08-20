import {
  pgTable, uuid, text, integer, numeric, jsonb, timestamp, date, index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  ...timestamps,
});

// Government source registry (plan §14): every official number should be
// traceable to url / title / department / publication_date / last_verified / retrieved_at.
export const governmentSources = pgTable("government_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  department: text("department"),
  publication_date: date("publication_date"),
  last_verified_at: timestamp("last_verified_at", { withTimezone: true }),
  retrieved_at: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  department_id: uuid("department_id").notNull().references(() => departments.id),
  description: text("description"),
  official_fee_inr: numeric("official_fee_inr", { precision: 12, scale: 2 }),
  official_timeline_days: integer("official_timeline_days"),
  official_visits: integer("official_visits"),
  official_documents: jsonb("official_documents").$type<{ name: string; required: boolean }[]>(),
  process_steps: jsonb("process_steps").$type<{ order: number; title: string; description: string }[]>(),
  official_fee_source_id: uuid("official_fee_source_id").references(() => governmentSources.id),
  official_timeline_source_id: uuid("official_timeline_source_id").references(() => governmentSources.id),
  search_vector: text("search_vector"),
  ...timestamps,
}, (t) => [
  // Plain btree on the text search vector: it is kept in sync by a trigger
  // (see migrate.ts). A GIN index here would need an opclass and fail to build.
  index("services_search_idx").on(t.search_vector),
  index("services_department_idx").on(t.department_id),
]);
