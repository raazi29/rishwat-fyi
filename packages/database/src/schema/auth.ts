import {
  pgEnum, pgTable, uuid, text, boolean, timestamp, customType,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";

// Case-insensitive text. The `citext` extension is created in migrate.ts before
// migrations run, so the users table can be built against it. This makes email
// uniqueness case-insensitive at the database level (no separate lower() index).
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const roleEnum = pgEnum("role", ["moderator", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  name: text("name"),
  password_hash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("moderator"),
  is_active: boolean("is_active").notNull().default(true),
  last_login_at: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});
