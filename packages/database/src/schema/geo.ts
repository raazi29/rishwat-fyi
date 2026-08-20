import {
  pgTable, uuid, text, geometry, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";
// offices.service_id references services.id. This is the ONLY cross-module edge
// out of geo, and it is safe (non-circular): catalog.ts imports solely from
// shared.ts and never from geo.ts, so the dependency graph geo -> catalog is
// strictly one-directional. Always import the specific module (./catalog.js),
// never the barrel (./index.js), to keep it that way.
import { services } from "./catalog.js";

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // ISO 3166-2:IN, e.g. "UP"
  name: text("name").notNull().unique(),
  ...timestamps,
});

export const districts = pgTable("districts", {
  id: uuid("id").primaryKey().defaultRandom(),
  state_id: uuid("state_id").notNull().references(() => states.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("districts_state_code_idx").on(t.state_id, t.code),
  index("districts_state_idx").on(t.state_id),
]);

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  district_id: uuid("district_id").notNull().references(() => districts.id),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("cities_district_name_idx").on(t.district_id, t.name),
]);

export const offices = pgTable("offices", {
  id: uuid("id").primaryKey().defaultRandom(),
  service_id: uuid("service_id").notNull().references(() => services.id),
  state_id: uuid("state_id").notNull().references(() => states.id),
  district_id: uuid("district_id").references(() => districts.id),
  name: text("name").notNull(),
  address: text("address"),
  location: geometry("location", { type: "point", srid: 4326 }),
  ...timestamps,
}, (t) => [
  index("offices_service_idx").on(t.service_id),
  index("offices_location_idx").using("gist", t.location),
]);
