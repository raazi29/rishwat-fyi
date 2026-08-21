import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDb } from "@rishwat/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { LocalStorage } from "../src/storage/local.storage.js";
import { bootTestApp } from "./helpers.js";

let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ app, cleanup } = await bootTestApp());
});

afterAll(async () => {
  await cleanup();
});

// Build a standalone app pointed at an arbitrary database URL / storage dir,
// reusing the same config shape as helpers.bootTestApp. Used to exercise the
// degraded path without touching the shared test database.
function bootApp(databaseUrl: string, storageDir: string) {
  const { db, client } = createDb(databaseUrl);
  const storage = new LocalStorage(storageDir);
  const config: AppConfig = {
    databaseUrl,
    jwtSecret: "test-secret-key-for-testing",
    port: 0,
    publicBaseUrl: "http://localhost:8787",
    storage: { driver: "local", dir: storageDir },
    admin: { email: "admin@test.com", password: "testpass123" },
    rateLimit: { enabled: false },
  };
  return { app: createApp(db, storage, config), client };
}

describe("GET /health", () => {
  it("returns ok with database status and an ISO timestamp", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; database: string; time: string };
    expect(body.status).toBe("ok");
    expect(["up", "down"]).toContain(body.database);
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  it("returns database: up when the test DB is reachable", async () => {
    const res = await app.request("/health");
    const body = (await res.json()) as { database: string };
    // The test DB is expected to be reachable in CI / local docker.
    expect(body.database).toBe("up");
  });

  it("reports storage health for the configured local backend", async () => {
    const res = await app.request("/health");
    const body = (await res.json()) as { storage: { driver: string; status: string } };
    // bootTestApp configures a LocalStorage temp dir, which is writable, so the
    // storage probe must report the local driver as up.
    expect(body.storage.driver).toBe("local");
    expect(body.storage.status).toBe("up");
  });
});

describe("GET /health — degraded", () => {
  it("returns 503 with status degraded when the database is unreachable", async () => {
    const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "rishwat-health-baddb-"));
    // A real host but a non-existent database name: the server rejects the
    // connection immediately (no long timeout) and the DB probe fails.
    const { app: badApp, client } = bootApp(
      "postgres://rishwat:rishwat_dev@db:5432/definitely_not_a_real_db",
      storageDir,
    );
    try {
      const res = await badApp.request("/health");
      expect(res.status).toBe(503);

      const body = (await res.json()) as {
        status: string;
        database: string;
        storage: { status: string };
        time: string;
      };
      expect(body.status).toBe("degraded");
      expect(body.database).toBe("down");
      expect(Number.isNaN(Date.parse(body.time))).toBe(false);
      // Storage is advisory: the local dir is fine, so it still reports up even
      // though the overall status is degraded because the database is down.
      expect(body.storage.status).toBe("up");
    } finally {
      await client.end({ timeout: 5 });
      fs.rmSync(storageDir, { recursive: true, force: true });
    }
  });

  it("stays 200 when only storage is unavailable (storage never forces a 503)", async () => {
    // Non-existent storage dir → storage probe reports down, but the (real) DB
    // is up, so the endpoint must still return 200. This locks in the auditable
    // decision that storage is advisory only.
    const missingDir = path.join(os.tmpdir(), `rishwat-health-nostorage-${Date.now()}`);
    const dbUrl = process.env.TEST_DATABASE_URL || "postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test";
    const { app: noStorageApp, client } = bootApp(dbUrl, missingDir);
    try {
      const res = await noStorageApp.request("/health");
      expect(res.status).toBe(200);

      const body = (await res.json()) as { status: string; database: string; storage: { status: string } };
      expect(body.status).toBe("ok");
      expect(body.database).toBe("up");
      expect(body.storage.status).toBe("down");
    } finally {
      await client.end({ timeout: 5 });
    }
  });
});

describe("unknown routes", () => {
  it("returns a structured 404", async () => {
    const res = await app.request("/no-such-route");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });
});
