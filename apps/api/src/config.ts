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
  /**
   * Number of reverse proxies you actually operate in front of this API. Decides
   * whether — and how far into — `x-forwarded-for` is trusted. See
   * utils/client-ip.ts for the threat model. 0 means "no proxy": forwarding
   * headers are ignored entirely.
   *
   * Optional on the type only so hand-built test fixtures can omit it; every
   * consumer must fall back to DEFAULT_TRUSTED_PROXY_HOPS, which is the safe
   * (trust-nothing) value. `loadConfig` always sets it.
   */
  trustedProxyHops?: number;
  /**
   * Origins allowed to call `/admin/*` cross-origin. Absent or empty means send
   * no CORS headers for admin at all (the default) — admin responses expose
   * IP-hash prefixes and must never be readable by an arbitrary origin.
   */
  adminCorsOrigins?: string[];
}

/** Trust no forwarding header unless TRUSTED_PROXY_HOPS says otherwise. */
export const DEFAULT_TRUSTED_PROXY_HOPS = 0;

/** Placeholder shipped in .env.example — must never reach a real deployment. */
export const PLACEHOLDER_JWT_SECRET = "change-me-to-a-long-random-string";
/** Shortest JWT signing secret accepted outside tests. */
export const MIN_JWT_SECRET_LENGTH = 32;

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

  const isProduction = env.NODE_ENV === "production";

  // Vitest sets VITEST / NODE_ENV=test. Test runs relax the secret-strength rule
  // (and default rate limiting off, below) so fixtures like "test-secret-for-dev"
  // in docker-compose keep working.
  //
  // `&& !isProduction` is the important half: without it a stray VITEST variable
  // in a deployment's environment would silently switch off the JWT-strength
  // check. Nothing relaxes in production, whatever else is set.
  const isTest = (env.NODE_ENV === "test" || env.VITEST !== undefined) && !isProduction;

  const databaseUrl = require("DATABASE_URL");
  const jwtSecret = require("JWT_SECRET");

  // A weak or placeholder signing secret means forgeable admin tokens. Refuse to
  // boot rather than run a deployment that looks configured but is not.
  if (!isTest && jwtSecret !== "") {
    if (jwtSecret === PLACEHOLDER_JWT_SECRET) {
      missing.push("JWT_SECRET (still the .env.example placeholder — generate a real secret)");
    } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
      missing.push(
        `JWT_SECRET (too short: ${jwtSecret.length} chars, need >= ${MIN_JWT_SECRET_LENGTH})`,
      );
    }
  }

  const driver = (env.EVIDENCE_STORAGE_DRIVER ?? "local").trim();
  let storage: StorageConfig;
  if (driver === "supabase") {
    const url = require("SUPABASE_URL");
    const serviceRoleKey = require("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = env.SUPABASE_STORAGE_BUCKET ?? "evidence";
    storage = { driver: "supabase", url, serviceRoleKey, bucket };
  } else if (driver === "local") {
    storage = { driver: "local", dir: env.EVIDENCE_STORAGE_DIR ?? "./data/evidence" };
    // Container filesystems are ephemeral. With the local driver on a platform
    // like Railway, uploads return 201 and the evidence row commits, but the
    // bytes are destroyed on the next redeploy while the rows persist pointing
    // at nothing — and nothing catches it: /health only checks the directory is
    // writable (the image pre-creates it), and the retention purge uses
    // `fs.rm(..., { force: true })`, so it counts already-vanished files as
    // successfully deleted and reports a clean run. Refuse to boot instead.
    if (isProduction && env.ALLOW_LOCAL_EVIDENCE !== "true") {
      missing.push(
        'EVIDENCE_STORAGE_DRIVER (is "local" in production — container filesystems are ' +
          "ephemeral and evidence would be lost on every redeploy; use \"supabase\", or set " +
          "ALLOW_LOCAL_EVIDENCE=true if EVIDENCE_STORAGE_DIR is a persistent volume)",
      );
    }
  } else {
    missing.push(`EVIDENCE_STORAGE_DRIVER (got "${driver}", expected "local" | "supabase")`);
    storage = { driver: "local", dir: "./data/evidence" };
  }

  // PUBLIC_BASE_URL is published, not just used internally: it builds the
  // download links in GET /datasets that every mirror consumes, and the
  // `servers[]` entry in the OpenAPI document. Defaulting it to localhost in
  // production would quietly ship an unusable dataset index to downstream
  // mirrors, so require it explicitly there.
  if (isProduction && (env.PUBLIC_BASE_URL === undefined || env.PUBLIC_BASE_URL === "")) {
    missing.push("PUBLIC_BASE_URL (published in dataset links and the OpenAPI servers list)");
  }

  if (missing.length > 0) {
    throw new Error(`Missing/invalid required configuration: ${missing.join(", ")}`);
  }

  // Strict digits only: Number.parseInt("8787x") silently returns 8787, so a
  // typo'd or half-interpolated value would bind a port nobody asked for.
  const portRaw = (env.PORT ?? "8787").trim();
  if (!/^\d+$/.test(portRaw)) {
    throw new Error(`Invalid PORT: "${portRaw}"`);
  }
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: "${portRaw}"`);
  }

  // Rate limiting defaults on in real runs but off under tests so the suite can
  // submit many reports in a row. An explicit RATE_LIMIT_ENABLED always wins.
  const rateLimitRaw = env.RATE_LIMIT_ENABLED ?? (isTest ? "false" : "true");
  const rateLimitEnabled = rateLimitRaw.trim().toLowerCase() !== "false";

  // How many reverse proxies sit in front of us. Anything but a non-negative
  // integer is a misconfiguration that would silently widen who can spoof an IP.
  const hopsRaw = env.TRUSTED_PROXY_HOPS ?? String(DEFAULT_TRUSTED_PROXY_HOPS);
  const trustedProxyHops = Number.parseInt(hopsRaw, 10);
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0) {
    throw new Error(`Invalid TRUSTED_PROXY_HOPS: "${hopsRaw}"`);
  }

  // 0 is the right default for a directly-exposed process, but it is the WRONG
  // value behind a platform proxy (Railway, Render, Fly, Cloudflare, nginx) —
  // there the socket peer is always the proxy, so every client on the internet
  // collapses into one bucket. That silently turns "3 reports/hour per person"
  // into "3 reports/hour, globally", and makes `count(distinct ip_hash) >= 2`
  // unreachable, so no aggregate can ever be published. Too situational to
  // refuse to boot over; loud enough that it will not be missed in the logs.
  if (isProduction && trustedProxyHops === 0) {
    console.warn(
      "[config] TRUSTED_PROXY_HOPS=0 in production: x-forwarded-for is ignored, so every " +
        "client shares one rate-limit bucket and one ip_hash. Correct only if this process " +
        "is exposed directly to the internet. Behind a platform proxy or CDN, set it to 1.",
    );
  }

  const adminCorsOrigins = (env.ADMIN_CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o !== "");

  return {
    databaseUrl,
    jwtSecret,
    port,
    publicBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
    storage,
    admin: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    rateLimit: { enabled: rateLimitEnabled },
    trustedProxyHops,
    adminCorsOrigins,
  };
}
