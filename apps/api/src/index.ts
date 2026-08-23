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

// Last-resort process guards. Node 20 terminates on an unhandled rejection by
// default, and an 'error' event on the HTTP server (EADDRINUSE, for instance) is
// fatal too — in both cases the process would die with no log line explaining
// why, and the container platform would just report "crashed". Log the cause
// first, then drain properly so in-flight requests and the Postgres pool are not
// severed mid-flight.
//
// Note both paths still end the process. An uncaught exception leaves the
// runtime in an undefined state; the goal here is a diagnosable, orderly exit,
// not carrying on.
process.on("unhandledRejection", (reason) => {
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
