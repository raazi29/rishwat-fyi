import { createDb, type Db } from "@rishwat/database";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { loadConfig, type AppConfig } from "./config.js";
import type { AppEnv } from "./env.js";
import { AppError } from "./errors.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { openapi } from "./openapi.js";
import { adminAuth } from "./routes/admin/auth.js";
import { adminJobs } from "./routes/admin/jobs.js";
import { moderation } from "./routes/admin/moderation.js";
import { adminStats } from "./routes/admin/stats.js";
import { datasets } from "./routes/datasets.js";
import { evidence } from "./routes/evidence.js";
import { health } from "./routes/health.js";
import { locations } from "./routes/locations.js";
import { reports } from "./routes/reports.js";
import { search } from "./routes/search.js";
import { services } from "./routes/services.js";
import { createEvidenceStorage, type EvidenceStorage } from "./storage/index.js";

/**
 * Route prefixes that form the open, publicly consumable API. These — and only
 * these — get wildcard CORS. Keep in sync with the `app.route` calls below.
 */
const PUBLIC_CORS_PATHS = [
  "/health",
  "/health/*",
  "/search",
  "/search/*",
  "/services",
  "/services/*",
  "/locations",
  "/locations/*",
  "/reports",
  "/reports/*",
  "/evidence",
  "/evidence/*",
  "/datasets",
  "/datasets/*",
  "/doc",
  "/doc/*",
] as const;

/**
 * Strip credential-shaped query parameters out of anything bound for stdout.
 * The one-time report token is the only such value the API accepts in a URL, but
 * the pattern is deliberately broad so a future `?key=` or `?secret=` is covered
 * the day it is added rather than the day it leaks.
 */
function redactSecrets(text: string): string {
  return text.replace(/\b(token|key|secret|password)=[^&\s]+/gi, "$1=REDACTED");
}

/**
 * Build the Hono application. `db`, `storage` and `config` are injected onto the
 * request context so routes and middleware can read them without module-level
 * globals — this also makes the app trivial to boot in tests.
 */
export function createApp(
  db: Db,
  storage: EvidenceStorage,
  config: AppConfig,
  options: { basePath?: string } = {},
): Hono<AppEnv> {
  // When this app is mounted behind a fixed path prefix — e.g. the Next.js
  // catch-all at apps/web/src/app/api/[[...route]] serves it at /api/* — every
  // route is built on a basePath'd instance so /api/health, /api/services, …
  // match. basePath is deliberate over wrapping in an outer
  // `parent.route("/api", app)`: a wrapper drops THIS app's notFound handler, so
  // unknown /api/* paths would return a plain-text 404 instead of the API's JSON
  // error envelope (its onError is preserved either way). With no basePath this
  // is byte-for-byte the previous behavior — routes stay at the root for
  // `npm start`, the Docker/Railway image, the Vercel API entry, and the tests.
  const app = (
    options.basePath
      ? new Hono<AppEnv>().basePath(options.basePath)
      : new Hono<AppEnv>()
  ) as Hono<AppEnv>;

  // Baseline browser/API hardening for every response, including the HTML docs
  // landing page and structured error responses. CORS is configured separately
  // below and remains deliberately scoped by route family.
  app.use("*", secureHeaders());

  // Hono's logger prints the path INCLUDING the query string, and
  // GET /reports/:publicId/status accepts the one-time submission token as
  // `?token=` — the single credential for both status lookup and evidence
  // upload. Left alone, every status check would deposit a live token into the
  // platform's log retention. Redact it on the way out.
  app.use("*", logger((message, ...rest) => console.log(redactSecrets(message), ...rest)));
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("storage", storage);
    c.set("config", config);
    await next();
  });
  // Guard JSON endpoints against 100 MiB bodies parsed before Zod max(5000) can
  // reject — without this an unauthenticated POST with a huge JSON heap-spikes
  // the single Node process. Evidence upload has its own 20 MiB+64k limit.
  app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/evidence")) return next();
    return bodyLimit({
      maxSize: 64 * 1024,
      onError: (c2) =>
        c2.json({ error: { code: "bad_request", message: "Request body too large" } }, 413),
    })(c, next);
  });

  // CORS is scoped, not global. The public API is meant to be openly consumable
  // from anywhere, so it keeps `Access-Control-Allow-Origin: *`. /admin/* must
  // NOT — responses there include IP-hash prefixes (/admin/stats/clusters) and
  // moderation data, and a wildcard would let any page a logged-in moderator
  // visits read them. Admin gets an explicit ADMIN_CORS_ORIGINS allowlist, or no
  // CORS headers at all when that env var is unset (the default).
  for (const path of PUBLIC_CORS_PATHS) {
    app.use(path, cors());
  }
  const adminOrigins = config.adminCorsOrigins ?? [];
  if (adminOrigins.length > 0) {
    app.use("/admin/*", cors({ origin: adminOrigins, credentials: true }));
  }

  // Public API surface.
  app.route("/health", health);
  app.route("/search", search);
  app.route("/services", services);
  app.route("/locations", locations);
  app.route("/reports", reports);
  app.route("/evidence", evidence);
  app.route("/datasets", datasets);
  app.route("/doc", openapi);

  // Admin login is public (it is how staff obtain a token).
  app.route("/admin/auth", adminAuth);

  // Everything else under /admin requires a valid Bearer token. Stats is further
  // restricted to admins; moderation stays at moderator level (admins included).
  const admin = new Hono<AppEnv>();
  admin.use("*", requireAuth);
  admin.use("/stats/*", requireRole("admin"));
  admin.use("/jobs/*", requireRole("admin"));
  admin.route("/", moderation);
  admin.route("/stats", adminStats);
  admin.route("/jobs", adminJobs);
  app.route("/admin", admin);

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status as ContentfulStatusCode,
      );
    }
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    // Log a whitelist, never the raw error object. A PostgresError copies the
    // server's ErrorResponse wholesale, and Postgres puts row VALUES in the
    // `detail` field of a constraint violation ("Key (email)=(...) already
    // exists"). Dumping the object would write report content and admin emails
    // into the platform's log store.
    const e = err as { name?: string; message?: string; code?: string; stack?: string };
    console.error("Unhandled error:", {
      name: e.name,
      code: e.code,
      message: redactSecrets(e.message ?? String(err)),
      stack: e.stack,
    });
    // TODO(sentry): report this unexpected error once Sentry is enabled. Only
    // unhandled errors reach this branch — AppError and HTTPException above are
    // expected control flow and must NOT be captured. After installing
    // @sentry/node and wiring up ./lib/sentry.ts (see its header), do e.g.:
    //   import { SENTRY_ENABLED } from "./lib/sentry.js";
    //   import * as Sentry from "@sentry/node";
    //   if (SENTRY_ENABLED) Sentry.captureException(err);
    return c.json(
      { error: { code: "internal_error", message: "Internal server error" } },
      500,
    );
  });

  app.notFound((c) =>
    c.json({ error: { code: "not_found", message: "Route not found" } }, 404),
  );

  return app;
}

export type App = ReturnType<typeof createApp>;

/**
 * Build the fully-wired Hono app straight from environment variables: load and
 * validate config, open the postgres.js pool, construct the evidence storage
 * backend, then assemble the routes. This is the single entrypoint the Next.js
 * catch-all route handler (apps/web/src/app/api/[[...route]]) mounts, so the web
 * deployment serves the exact same API as `npm start`, the Docker/Railway
 * container, and the standalone Vercel API entry — with no duplicated wiring.
 *
 * `serve()` is intentionally NOT called here: starting a listener stays solely
 * in src/index.ts. This function only constructs the app.
 *
 * `loadConfig` throws on missing/invalid env (e.g. DATABASE_URL, JWT_SECRET).
 * `createDb` is lazy — postgres.js opens no socket until the first query — so
 * the only construction-time failure is a configuration error. Callers that
 * must not crash at import time (the serverless route handler) should therefore
 * call this LAZILY on the first request and translate a thrown config error
 * into a clean 503.
 */
export function createAppFromEnv(
  env: Record<string, string | undefined> = process.env,
  options: { basePath?: string } = {},
): {
  app: Hono<AppEnv>;
  db: Db;
  client: ReturnType<typeof createDb>["client"];
  config: AppConfig;
  storage: EvidenceStorage;
} {
  const config = loadConfig(env);
  const { db, client } = createDb(config.databaseUrl);
  const storage = createEvidenceStorage(config.storage);
  const app = createApp(db, storage, config, options);
  return { app, db, client, config, storage };
}
