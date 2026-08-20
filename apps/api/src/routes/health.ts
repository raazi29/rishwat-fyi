import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";

export const health = new Hono<AppEnv>();

// Liveness + DB connectivity probe. The API responding is "ok"; `database`
// reflects whether a trivial round-trip to Postgres succeeded.
health.get("/", async (c) => {
  const db = c.get("db");
  let database: "up" | "down" = "down";
  try {
    await db.execute(sql`select 1`);
    database = "up";
  } catch {
    database = "down";
  }
  return c.json({ status: "ok", database, time: new Date().toISOString() });
});
