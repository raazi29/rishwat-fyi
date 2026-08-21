import type { Db } from "@rishwat/database";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppConfig } from "./config.js";
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
import type { EvidenceStorage } from "./storage/index.js";

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
 * Build the Hono application. `db`, `storage` and `config` are injected onto the
 * request context so routes and middleware can read them without module-level
 * globals — this also makes the app trivial to boot in tests.
 */
export function createApp(db: Db, storage: EvidenceStorage, config: AppConfig) {
  const app = new Hono<AppEnv>();

  app.use("*", logger());
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("storage", storage);
    c.set("config", config);
    await next();
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
    console.error("Unhandled error:", err);
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
