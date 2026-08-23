import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Db } from "@rishwat/database";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { LocalStorage } from "../src/storage/local.storage.js";

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "rishwat-security-headers-"));
const config: AppConfig = {
  databaseUrl: "postgres://unused.invalid/test",
  jwtSecret: "test-secret-key-for-security-header-test",
  port: 0,
  publicBaseUrl: "http://localhost:8787",
  storage: { driver: "local", dir: storageDir },
  admin: { email: undefined, password: undefined },
  rateLimit: { enabled: false },
};

// The unknown-route response never touches the injected DB, which keeps this
// regression test runnable without Docker while exercising the complete app
// middleware chain.
const app = createApp({} as Db, new LocalStorage(storageDir), config);

afterAll(() => {
  fs.rmSync(storageDir, { recursive: true, force: true });
});

describe("API security headers", () => {
  it("hardens structured responses before route handling", async () => {
    const res = await app.request("/no-such-route");
    expect(res.status).toBe(404);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
