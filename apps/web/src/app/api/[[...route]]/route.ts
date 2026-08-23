import { createDb } from "@rishwat/database";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createApp } from "@rishwat/api/src/app.js";
import { loadConfig } from "@rishwat/api/src/config.js";
import { createEvidenceStorage } from "@rishwat/api/src/storage/index.js";

/**
 * Mount the standalone Hono API (apps/api) inside this Next.js deployment as a
 * catch-all Route Handler, so ONE Vercel project serves both the site and the
 * API under a single set of env vars — no second host, no cross-origin hop.
 *
 * This is an ADDITIONAL delivery surface. apps/api/src/index.ts (the
 * @hono/node-server used by `npm run dev`/`npm start`) and the Docker/Railway
 * container keep working unchanged. This file only imports the app FACTORY
 * (createApp — already exported by apps/api) and the config/storage/db builders,
 * and never starts a listener, so it stays decoupled from any change to how the
 * standalone server boots.
 *
 * Node.js runtime, NOT Edge: the API uses postgres.js, drizzle-orm, bcryptjs
 * and node:crypto (via jose + fs in the health probe), none of which exist on
 * the Edge runtime.
 */
export const runtime = "nodejs";

/**
 * Every API response is request-specific (live DB reads, auth, rate limiting),
 * so nothing here may be statically prerendered or cached. force-dynamic also
 * guarantees Next never evaluates this route at build time.
 */
export const dynamic = "force-dynamic";

type FetchHandler = (req: Request) => Response | Promise<Response>;

/**
 * Built lazily on the FIRST request and then cached for the life of the
 * (serverless) instance — NEVER at module load. loadConfig() throws when
 * DATABASE_URL / JWT_SECRET are missing; constructing at import time would break
 * the whole route module and could fail `next build`, which evaluates route
 * modules. Lazy construction also means the postgres.js pool is created once per
 * warm instance and reused across requests.
 */
let cachedHandler: FetchHandler | null = null;

function getHandler(): FetchHandler {
  if (cachedHandler) return cachedHandler;

  // Wire the API exactly like apps/api/src/index.ts does, minus serve().
  // createDb is lazy (postgres.js opens no socket until the first query), so the
  // only construction-time failure here is a config error, handled in dispatch.
  const config = loadConfig(process.env);
  const { db } = createDb(config.databaseUrl);
  const storage = createEvidenceStorage(config.storage);
  const api = createApp(db, storage, config); // routes registered at the ROOT

  // The API's routes live at the ROOT (/health, /services, …). Under this
  // catch-all they must be served at /api/*. createApp builds on a root Hono and
  // is owned by apps/api, so we mount it under /api here rather than editing it.
  // Hono's route() mount preserves the sub-app's onError (its JSON error
  // envelope); its notFound is NOT inherited by the parent, so we re-declare the
  // same JSON 404 on the wrapper for unknown /api/* paths.
  const root = new Hono();
  root.route("/api", api);
  root.notFound((c) =>
    c.json({ error: { code: "not_found", message: "Route not found" } }, 404),
  );

  cachedHandler = handle(root);
  return cachedHandler;
}

async function dispatch(req: Request): Promise<Response> {
  let handler: FetchHandler;
  try {
    handler = getHandler();
  } catch (err) {
    // Configuration error (missing/invalid DATABASE_URL, JWT_SECRET, …). Return
    // a clean JSON 503 instead of letting the throw crash the Next.js server or
    // surface an HTML error page. The underlying error only ever names env KEYS
    // (never values), so logging it server-side leaks no secrets; the client
    // gets a generic message and no configuration detail.
    console.error("[api route] configuration error while building the API app:", err);
    return Response.json(
      {
        error: {
          code: "service_unavailable",
          message: "The API is not configured. Set the required environment variables.",
        },
      },
      { status: 503 },
    );
  }
  return handler(req);
}

// Export every method the catch-all must accept. The API currently serves GET
// and POST (plus OPTIONS, which Hono's cors() answers for preflight). PUT,
// PATCH, DELETE and HEAD are wired to the same dispatcher too so new API routes
// work without editing this file. All methods share one lazy dispatcher.
export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
export const HEAD = dispatch;
