import { createDb, type Db } from '@rishwat/database';
import { createApp, type App } from '../src/app.js';
import { LocalStorage } from '../src/storage/local.storage.js';
import type { AppConfig } from '../src/config.js';
import { sql } from 'drizzle-orm';
import { hashPassword, issueToken } from '../src/services/auth.service.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test';

// Explicit shape so the inferred return type stays portable under
// `declaration: true` (tsc otherwise cannot name the drizzle `Db` type).
export interface TestApp {
  app: App;
  db: Db;
  client: ReturnType<typeof createDb>['client'];
  config: AppConfig;
  storageDir: string;
  storage: LocalStorage;
  cleanup: () => Promise<void>;
}

export async function bootTestApp(): Promise<TestApp> {
  const { db, client } = createDb(TEST_DB_URL);
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rishwat-test-'));
  const storage = new LocalStorage(storageDir);
  const config: AppConfig = {
    databaseUrl: TEST_DB_URL,
    jwtSecret: 'test-secret-key-for-testing',
    port: 0,
    publicBaseUrl: 'http://localhost:8787',
    storage: { driver: 'local', dir: storageDir },
    admin: { email: 'admin@test.com', password: 'testpass123' },
    rateLimit: { enabled: false },
  };
  const app = createApp(db, storage, config);

  const cleanup = async () => {
    await client.end();
    fs.rmSync(storageDir, { recursive: true, force: true });
  };

  return { app, db, client, config, storageDir, storage, cleanup };
}

export async function createTestAdmin(db: any, config: AppConfig) {
  const password_hash = await hashPassword('admin123456');
  const rows = await db.execute(sql`
    INSERT INTO users (email, name, password_hash, role, is_active)
    VALUES ('admin@test.com', 'Test Admin', ${password_hash}, 'admin', true)
    ON CONFLICT (email) DO UPDATE SET password_hash = ${password_hash}
    RETURNING id, email, role
  `);
  const user = rows[0];
  const token = await issueToken({ id: user.id, email: user.email, role: user.role }, config.jwtSecret);
  return { user, token };
}

export async function createTestModerator(db: any, config: AppConfig) {
  const password_hash = await hashPassword('mod123456789');
  const rows = await db.execute(sql`
    INSERT INTO users (email, name, password_hash, role, is_active)
    VALUES ('mod@test.com', 'Test Mod', ${password_hash}, 'moderator', true)
    ON CONFLICT (email) DO UPDATE SET password_hash = ${password_hash}
    RETURNING id, email, role
  `);
  const user = rows[0];
  const token = await issueToken({ id: user.id, email: user.email, role: user.role }, config.jwtSecret);
  return { user, token };
}
