import { serve } from "@hono/node-server";
import { createDb } from "@rishwat/database";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createEvidenceStorage } from "./storage/index.js";

const config = loadConfig();
const { db, client } = createDb(config.databaseUrl);
const storage = createEvidenceStorage(config.storage);
const app = createApp(db, storage, config);

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Rishwat API listening on http://localhost:${info.port}`);
});

// Graceful shutdown. On SIGINT (Ctrl-C) and SIGTERM (sent by Railway/Render/most
// container runtimes immediately before the container is killed) we stop
// accepting new connections, drain in-flight HTTP requests, then close the
// Postgres connection pool so no half-open connections leak.
//
// The handler is idempotent — a second signal while shutdown is already in
// progress is ignored rather than throwing or double-closing — and is bounded
// by a hard timeout so a hung connection can never wedge the process and block
// the container from exiting.
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  // Safety net: if draining hangs (e.g. a stuck keep-alive socket or a Postgres
  // connection that will not close), force the process to exit rather than
  // hanging forever. Unref'd so it never keeps the loop alive on its own.
  //
  // Exits 0, not 1: reaching this timeout during an operator-initiated stop is a
  // bounded drain, not a crash. Exiting non-zero here would make every normal
  // redeploy look like a failure to `restartPolicyType: ON_FAILURE`.
  const forceExit = setTimeout(() => {
    console.error(`Shutdown exceeded ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit.`);
    process.exit(0);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    // 1. Stop accepting new connections and wait for in-flight requests to end.
    //    `server.close()` alone waits for EVERY open connection, including the
    //    idle keep-alive sockets a platform proxy holds open — those would sit
    //    there until their own timeout and push every redeploy into the
    //    force-exit path above. Closing idle sockets explicitly leaves only
    //    genuinely in-flight requests to drain.
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      if ("closeIdleConnections" in server && typeof server.closeIdleConnections === "function") {
        server.closeIdleConnections();
      }
    });
    // 2. Drain the Postgres pool (postgres.js: `client.end()` closes all
    //    connections; the timeout bounds how long we wait for in-flight queries).
    await client.end({ timeout: 5 });

    clearTimeout(forceExit);
    console.log("Shutdown complete.");
    process.exit(0);
  } catch (err) {
    clearTimeout(forceExit);
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Transient Postgres / network errors must not kill the process. A statement
// timeout (57014), a pooler bounce (57P01-57P03, 080xx) or an ECONNRESET is a
// per-request failure — Hono already answered 500 for the request that hit it.
// postgres.js can surface the same PostgresError twice (once to the awaiting
// query, once to its internal pool bookkeeping), and without this guard the
// second emission becomes an "unhandled rejection" that shuts the whole service
// down. See the 2026-08-23 outage: GET /locations/states timed out (57014),
// Hono returned 500, then the duplicate rejection killed the Render instance and
// every SSR page rendered "Something went wrong" until Render restarted it.
function isTransientUnhandledRejection(reason: unknown): boolean {
  const r = reason as { code?: string; errno?: string; message?: string; name?: string } | null;
  const code = r?.code ?? r?.errno ?? "";
  // Postgres error codes — https://www.postgresql.org/docs/current/errcodes-appendix.html
  // 08xxx connection, 40001 serialization, 40P01 deadlock, 57xxx operator intervention.
  if (/^(08|40001|40P01|57P)/.test(code)) return true;
  if (code === "57014") return true; // query_canceled / statement_timeout — the outage trigger
  const msg = r?.message ?? "";
  // Node / fetch / undici socket errors that surface when Supabase or the pooler
  // drops a half-open connection.
  if (/ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENOTFOUND|UND_ERR_SOCKET|fetch failed/i.test(msg)) return true;
  if (/ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET/.test(code)) return true;
  // postgres.js wraps some cancellations as PostgresError with name, no code.
  if (r?.name === "PostgresError" && /statement timeout|canceling statement/i.test(msg)) return true;
  return false;
}

// Last-resort process guards. Node 20 terminates on an unhandled rejection by
// default, and an 'error' event on the HTTP server (EADDRINUSE, for instance) is
// fatal too — in both cases the process would die with no log line explaining
// why, and the container platform would just report "crashed". Log the cause
// first, then drain properly so in-flight requests and the Postgres pool are not
// severed mid-flight.
process.on("unhandledRejection", (reason) => {
  if (isTransientUnhandledRejection(reason)) {
    const e = reason as { name?: string; code?: string; message?: string };
    console.warn("Transient unhandled rejection — continuing:", {
      name: e?.name,
      code: e?.code,
      message: e?.message ?? String(reason),
    });
    return;
  }
  console.error("Unhandled promise rejection — shutting down:", reason);
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception — shutting down:", err);
  void shutdown("SIGTERM");
});

server.on("error", (err) => {
  console.error("HTTP server error:", err);
  process.exit(1);
});
