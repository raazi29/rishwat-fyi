import { sql, type SQL } from "drizzle-orm";

/**
 * Anything that can run a parameterized `SQL` query — both the top-level `Db`
 * and a transaction handle satisfy this. Keeping the surface this small lets
 * services accept either without importing Drizzle's transaction types.
 */
export interface Queryable {
  execute: (query: SQL) => Promise<unknown>;
}

/**
 * Run a raw (but parameterized) SQL statement and return the rows as `T[]`.
 * The postgres-js driver returns a RowList (an array) directly; the `rows`
 * fallback keeps this safe if the underlying driver ever changes.
 */
export async function execRows<T>(db: Queryable, query: SQL): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  const maybe = res as { rows?: unknown };
  return (Array.isArray(maybe.rows) ? maybe.rows : []) as T[];
}

/** Run a statement for its side effects only. */
export async function exec(db: Queryable, query: SQL): Promise<void> {
  await db.execute(query);
}

/**
 * Format a timestamp column/expression as an ISO-8601 UTC string
 * (e.g. `2026-06-02T10:15:00.000Z`) directly in SQL, so results are
 * driver-independent. `expr` MUST be a constant column reference — never
 * user input — because it is embedded raw.
 */
export function isoUtc(expr: string): SQL {
  return sql.raw(`to_char(${expr} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
}

/** Publishable report statuses — the set that feeds public stats and exports. */
export const PUBLISHABLE_STATUSES = sql.raw(
  "('validated','corroborated','evidence_backed','officially_acknowledged')",
);
