// Central configuration. `loadConfig` reads from a plain env object (defaults to
// process.env) so it is trivially testable, and fails fast listing *all* missing
// required keys at once rather than one at a time.

export type StorageConfig =
  | { driver: "local"; dir: string }
  | { driver: "supabase"; url: string; serviceRoleKey: string; bucket: string };

export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  publicBaseUrl: string;
  storage: StorageConfig;
  admin: { email: string | undefined; password: string | undefined };
  rateLimit: { enabled: boolean };
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env): AppConfig {
  const missing: string[] = [];
  const require = (key: string): string => {
    const v = env[key];
    if (v === undefined || v === "") {
      missing.push(key);
      return "";
    }
    return v;
  };

  const databaseUrl = require("DATABASE_URL");
  const jwtSecret = require("JWT_SECRET");

  const driver = (env.EVIDENCE_STORAGE_DRIVER ?? "local").trim();
  let storage: StorageConfig;
  if (driver === "supabase") {
    const url = require("SUPABASE_URL");
    const serviceRoleKey = require("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = env.SUPABASE_STORAGE_BUCKET ?? "evidence";
    storage = { driver: "supabase", url, serviceRoleKey, bucket };
  } else if (driver === "local") {
    storage = { driver: "local", dir: env.EVIDENCE_STORAGE_DIR ?? "./data/evidence" };
  } else {
    missing.push(`EVIDENCE_STORAGE_DRIVER (got "${driver}", expected "local" | "supabase")`);
    storage = { driver: "local", dir: "./data/evidence" };
  }

  if (missing.length > 0) {
    throw new Error(`Missing/invalid required configuration: ${missing.join(", ")}`);
  }

  const portRaw = env.PORT ?? "8787";
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: "${portRaw}"`);
  }

  // Rate limiting defaults on in real runs but off under tests (vitest sets
  // VITEST / NODE_ENV=test) so the suite can submit many reports in a row.
  // An explicit RATE_LIMIT_ENABLED always wins.
  const isTest = env.NODE_ENV === "test" || env.VITEST !== undefined;
  const rateLimitRaw = env.RATE_LIMIT_ENABLED ?? (isTest ? "false" : "true");
  const rateLimitEnabled = rateLimitRaw.trim().toLowerCase() !== "false";

  return {
    databaseUrl,
    jwtSecret,
    port,
    publicBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
    storage,
    admin: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    rateLimit: { enabled: rateLimitEnabled },
  };
}
