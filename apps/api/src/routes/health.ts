import { constants as fsConstants, promises as fs } from "node:fs";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { StorageConfig } from "../config.js";
import type { AppEnv } from "../env.js";

export const health = new Hono<AppEnv>();

type StorageHealth = { driver: StorageConfig["driver"]; status: "up" | "down" | "configured" };

// Cheap, per-driver storage liveness. This must stay cheap because /health may
// be polled every few seconds: we never write a file, and never make a network
// call on this path.
async function probeStorage(cfg: StorageConfig): Promise<StorageHealth> {
  if (cfg.driver === "local") {
    // Verify the evidence directory exists and is writable with a single
    // fs.access() check — no file is ever written on the health path.
    try {
      await fs.access(cfg.dir, fsConstants.W_OK);
      return { driver: "local", status: "up" };
    } catch {
      return { driver: "local", status: "down" };
    }
  }
  // supabase: report a STATIC "configured" verdict derived from config. We
  // deliberately do NOT round-trip to object storage here — an endpoint that
  // hit Supabase Storage on every poll would itself become an outage risk (and a
  // rate-limit / egress-cost sink). Object-storage liveness belongs in a
  // separate, low-frequency deep check, not this hot path.
  return { driver: "supabase", status: "configured" };
}

// Liveness + dependency probe. See docs/api.md for the wire contract.
//
// Status code: 200 when healthy, 503 when a HARD dependency is down. Postgres is
// the only hard dependency — without it the API can serve neither reads, writes,
// nor the public dataset — so a DB failure must take this instance out of a load
// balancer's rotation (returning 200 here would keep routing traffic to a
// database-less API, which is the bug this endpoint used to have).
//
// Storage is reported but is ADVISORY ONLY and never forces a 503: with a dead
// storage backend the API still serves every read endpoint and the full public
// dataset — only evidence *upload* breaks. Failing health on storage alone would
// pull the read API from rotation for a non-fatal condition.
health.get("/", async (c) => {
  const db = c.get("db");
  const config = c.get("config");

  let database: "up" | "down" = "down";
  try {
    await db.execute(sql`select 1`);
    database = "up";
  } catch {
    database = "down";
  }

  const storage = await probeStorage(config.storage);

  const healthy = database === "up";
  return c.json(
    { status: healthy ? "ok" : "degraded", database, storage, time: new Date().toISOString() },
    healthy ? 200 : 503,
  );
});
