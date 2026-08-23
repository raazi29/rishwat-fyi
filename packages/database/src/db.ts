import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

/**
 * Hosts that are only reachable from inside the deployment (docker-compose, a
 * local dev box, CI's service container). Everything else is assumed to be a
 * managed Postgres reached across the public internet.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db", "postgres"]);

/** Supabase's Supavisor pooler port. Transaction mode — see `prepare` below. */
const SUPAVISOR_TRANSACTION_PORT = "6543";

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    // An unparseable URL is treated as remote: the defaults chosen below are the
    // safe ones, and postgres.js will report the real connection error itself.
    return null;
  }
}

export function createDb(url: string) {
  const parsed = safeParseUrl(url);
  const isLocal = LOCAL_HOSTS.has(parsed?.hostname ?? "");
  // postgres.js only enables TLS on its own if the connection string carries an
  // explicit ?sslmode=. If the operator set one, theirs wins.
  const sslmodeInUrl = parsed?.searchParams.has("sslmode") ?? false;

  const client = postgres(url, {
    max: 10,

    // postgres.js defaults to `ssl: false`. Against a managed provider that means
    // the database password, every report description and every ip_hash cross the
    // public internet in plaintext — and some providers simply refuse the
    // connection, which would leave /health failing forever.
    ...(isLocal || sslmodeInUrl ? {} : { ssl: "require" as const }),

    // Port 6543 is Supavisor in TRANSACTION mode: a client is rebound to a
    // different backend between statements, so server-side named prepared
    // statements (postgres.js's default) can vanish or collide mid-session and
    // surface as intermittent, load-dependent 500s. Every deployment doc here
    // points at 6543, so turn them off for it. Direct connections (5432) keep
    // prepared statements.
    ...(parsed?.port === SUPAVISOR_TRANSACTION_PORT ? { prepare: false } : {}),

    // Bound how long an unreachable database can stall a caller. /health probes
    // Postgres and Railway allows 60s for the healthcheck; postgres.js's 30s
    // default would burn that budget in two polls and fail an otherwise-healthy
    // deploy instead of reporting "degraded".
    connect_timeout: 10,
  });
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>["db"];
