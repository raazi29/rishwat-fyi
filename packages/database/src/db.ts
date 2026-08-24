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

/** postgres.js's own default pool size; used when DATABASE_POOL_MAX is unset. */
const DEFAULT_POOL_MAX = 10;

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    // An unparseable URL is treated as remote: the defaults chosen below are the
    // safe ones, and postgres.js will report the real connection error itself.
    return null;
  }
}

/**
 * Upper bound on the connections a single process opens, read from
 * DATABASE_POOL_MAX (default 10). Kept configurable because the right ceiling is
 * deployment-shaped, not a code constant: against Supabase's Supavisor pooler
 * every connection here consumes one of the pooler's own upstream slots, so the
 * sum of this value across all running instances must stay under the project's
 * pooler connection limit — raise it for a busier single instance, lower it when
 * several instances share one pool.
 *
 * Parsed strictly (digits only, >= 1) and rejected otherwise, mirroring how
 * config.ts guards PORT: Number.parseInt("10x") silently returns 10, so a typo'd
 * or half-interpolated value would quietly size the pool to something nobody
 * asked for. An unset or empty value falls back to the default rather than
 * throwing.
 */
function resolvePoolMax(env: Record<string, string | undefined> = process.env): number {
  const raw = env.DATABASE_POOL_MAX?.trim();
  if (raw === undefined || raw === "") return DEFAULT_POOL_MAX;
  const n = /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid DATABASE_POOL_MAX: "${raw}" (expected a positive integer >= 1)`);
  }
  return n;
}

export function createDb(url: string) {
  const parsed = safeParseUrl(url);
  const isLocal = LOCAL_HOSTS.has(parsed?.hostname ?? "");
  // postgres.js only enables TLS on its own if the connection string carries an
  // explicit ?sslmode=. If the operator set one, theirs wins.
  const sslmodeInUrl = parsed?.searchParams.has("sslmode") ?? false;

  const client = postgres(url, {
    // Ceiling on concurrent server connections, from DATABASE_POOL_MAX (default
    // 10). See resolvePoolMax for why it is configurable: against Supavisor every
    // connection here is one of the pooler's upstream slots, so this must stay
    // under the pooler's connection limit across all running instances.
    max: resolvePoolMax(),

    // postgres.js defaults to `ssl: false`. Against a managed provider that means
    // the database password, every report description and every ip_hash cross the
    // public internet in plaintext — and some providers simply refuse the
    // connection, which would leave /health failing forever.
    ...(isLocal || sslmodeInUrl ? {} : { ssl: "require" as const }),

    // Port 6543 is Supavisor in TRANSACTION mode: a client is rebound to a
    // different backend between statements, so anything relying on per-connection
    // server state breaks the same way — intermittent, load-dependent 500s. Two
    // postgres.js defaults are therefore turned off for it; direct connections
    // (5432) keep both:
    //   - prepare: server-side named prepared statements can vanish or collide
    //     mid-session when the backend changes underneath them.
    //   - fetch_types: on first use postgres.js queries pg_catalog to learn the
    //     OIDs of non-built-in types. Supavisor does not reliably serve those
    //     introspection queries over a transaction-pooled connection, so the very
    //     first query against a fresh backend can fail. Safe to disable here: we
    //     register no custom postgres.js type parsers and have no user-defined
    //     array columns, so built-ins still parse from its baked-in OID table.
    ...(parsed?.port === SUPAVISOR_TRANSACTION_PORT
      ? { prepare: false, fetch_types: false }
      : {}),

    // Bound how long an unreachable database can stall a caller. /health probes
    // Postgres, and a platform healthcheck budget is typically ~60s; postgres.js's
    // 30s default would burn that in two polls and fail an otherwise-healthy
    // deploy instead of reporting "degraded".
    connect_timeout: 10,

    // Managed providers (Supabase in particular) drop idle connections and
    // silently eat half-open sockets. Without keep-alives the first request
    // after an quiet stretch pays a dead-connection round-trip or an ECONNRESET;
    // with them the pool notices a dying socket before a caller does.
    idle_timeout: 60,
    keep_alive: 60,

    // Retire every connection after 30 minutes (value is in seconds). Managed
    // Postgres moves the backend under us during maintenance and failovers, and
    // Supavisor can migrate a pooled connection to a different upstream; a socket
    // that lived through one of those looks open but errors on its next use.
    // Capping the lifetime makes the pool recycle connections on a schedule
    // instead of discovering dead ones a failed query at a time. postgres.js
    // recycles lazily — a connection is closed and reopened only once it goes idle
    // or its in-flight query finishes — so this never interrupts a running
    // statement. (postgres.js's default is a randomized 30–60 min specifically to
    // stagger recycling; a fixed 30 forgoes that jitter, which is fine for a
    // single instance capped at DATABASE_POOL_MAX connections.)
    max_lifetime: 60 * 30,
  });
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>["db"];
