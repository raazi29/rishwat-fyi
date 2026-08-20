# Rishwat.fyi Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete backend (Sprints 2–4 of `plan/Rishwat.fyi.md`) for Rishwat.fyi — a citizen-powered transparency platform measuring the gap between official and experienced government services in India. Public data infrastructure that survives the website.

**Architecture:** Dedicated Hono + TypeScript API in an npm-workspaces monorepo, backed by PostgreSQL + PostGIS (Docker PostGIS locally for dev/test/CI; **Supabase managed Postgres + PostGIS in production** — same Drizzle schema, same migrations, connection-string swap only), accessed through Drizzle ORM. Evidence files via a real storage adapter (`local-fs` in dev/test, **Supabase Storage in production**). Moderator auth is self-contained (bcrypt + JWT) and runs on Postgres everywhere, including Supabase's managed Postgres. Public data layer: OpenAPI spec, JSON/CSV dataset exports, data dictionary. Anti-abuse and verification are first-class (rate limiting, duplicate detection, report status state machine).

**Tech Stack:** Hono, TypeScript, Drizzle ORM, postgres.js, zod + @hono/zod-openapi, bcryptjs, jose (JWT), @hono/node-server, vitest, tsx, Docker (postgis/postgis:16-master), Supabase (production: Postgres/PostGIS + Storage), PostgreSQL full-text + pg_trgm, PostGIS.

**Hard rules:**
- NO hardcodes, NO mocks, NO in-memory stand-ins. Everything real: real Docker/Supabase Postgres, real seed data (real Indian states/districts, real services with real official fees/timelines and government source URLs), real auth, tests against a real test database.
- **No monolith files.** Source files are capped at ~200 lines each and split by domain (schema split into domain modules, seed split by region/domain, routes and services one-per-domain). A task that would exceed ~200 lines in a file MUST split it.
- Supabase for production: the DB layer and evidence storage must run unchanged against Supabase (connection string / storage adapter config only). No Supabase-specific code may leak into dev paths and vice versa — one codebase.
- Backend only. Frontend (Next.js) is being designed separately — nothing here may depend on frontend code. Public API is the contract.
- Every task ends committed with passing tests (`vitest run` green).

---

## Repo Layout (established in Task 1, used by all later tasks)

```text
E:\Rishwat\
  package.json                  # npm workspaces root
  tsconfig.base.json
  docker-compose.yml            # Postgres + PostGIS (dev/test/CI)
  .env.example
  .gitignore
  README.md
  .github/workflows/ci.yml
  apps/api/                     # Hono API server
    package.json
    tsconfig.json
    drizzle.config.ts
    src/
      index.ts                  # entry: creates app + server
      app.ts                    # app factory (testable, no listen)
      config.ts
      errors.ts
      middleware/
        auth.ts                 # JWT bearer auth for admin
        rate-limit.ts
      routes/
        health.ts
        search.ts
        services.ts
        locations.ts
        reports.ts
        evidence.ts
        datasets.ts
        admin/
          auth.ts
          moderation.ts
          stats.ts
      services/
        search.service.ts
        aggregates.service.ts
        reports.service.ts
        duplication.service.ts
        export.service.ts
        abuse.service.ts
        verification.service.ts
      storage/
        evidence.storage.ts     # EvidenceStorage interface (tiny)
        local.storage.ts        # real local-fs implementation (dev/test)
        supabase.storage.ts     # real Supabase Storage implementation (prod)
        index.ts                # factory by env
      utils/
        hashing.ts              # sha256 for IP/fingerprint/token hashing
        redaction.ts
      scripts/
        create-admin.ts
        export-dataset.ts
    test/
      helpers.ts                # test DB bootstrap
      *.test.ts
  packages/database/
    package.json
    tsconfig.json
    drizzle.config.ts
    src/
      db.ts                     # client factory
      migrate.ts                # migration runner
      index.ts                  # re-exports
      schema/
        index.ts                # re-exports all domain modules
        geo.ts                  # states, districts, cities, offices
        catalog.ts              # departments, government_sources, services
        reports.ts              # reports, evidence
        trust.ts                # verification_events, moderation_actions
        aggregates.ts           # aggregate_metrics
        auth.ts                 # users
      seed/
        index.ts                # seed runner
        types.ts
        locations/
          index.ts              # combines region files
          north.ts              # UP, Punjab, Haryana, Himachal, Uttarakhand, JK, Ladakh, Delhi, Chandigarh
          south.ts              # AP, Karnataka, Kerala, TN, Telangana, Puducherry, Lakshadweep, Andaman
          east.ts               # Bihar, Jharkhand, Odisha, WB, Sikkim, Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Tripura
          west.ts               # Gujarat, Maharashtra, Rajasthan, Goa, Dadra & Nagar Haveli and Daman & Diu
          central.ts            # MP, Chhattisgarh
        services/
          index.ts              # combines domain files + departments
          transport.ts          # driving-licence, vehicle-registration
          land.ts               # land-registration, property-mutation, building-permit
          police.ts             # police-verification
          municipal.ts          # trade-licence, birth-certificate, death-certificate
          revenue.ts            # ration-card
          commerce.ts           # gst-registration, passport
    drizzle/                    # generated SQL migrations
  packages/validation/
    package.json
    tsconfig.json
    src/
      index.ts
      report.ts
      service.ts
      source.ts
      moderation.ts
      admin.ts
      common.ts
  data/
    schemas/report.schema.json  # JSON Schema (data dictionary machine form)
    exports/                    # generated dataset snapshots (gitignored)
  docs/
    methodology.md
    moderation.md
    privacy.md
    governance.md
    contributing.md
    mirroring.md
    data-dictionary.md
    api.md
    supabase-deployment.md
  scripts/
    db-up.sh
    db-migrate.sh
    db-seed.sh
```

---

## Shared Conventions (used by all tasks)

- **Enums as Postgres enums** via `pgEnum`: `report_status` = `submitted | validated | corroborated | evidence_backed | officially_acknowledged | rejected | withdrawn`; `role` = `moderator | admin`; `evidence_status` = `pending_review | accepted | rejected`.
- **Status state machine (reports):** `submitted → validated → corroborated → evidence_backed → officially_acknowledged`; `rejected` and `withdrawn` are terminal from any non-terminal state. Transitions recorded in `verification_events` and enforced by `verification.service.ts`.
- **Aggregate publishing rule:** a statistic is only published when the source report set (status IN `validated, corroborated, evidence_backed, officially_acknowledged`) contains **≥ 3 reports from ≥ 2 distinct IP-hash buckets** for the same (service, district) cell, else `null`.
- **IDs:** `uuid` PKs; `public_id` for reports = `R-` + 8 random base36 chars; `slug` = kebab-case, unique.
- **Money:** `numeric(12,2)` INR, never floats.
- **PII rule:** never store raw IP/device fingerprint/submission token — store `sha256` hex digests only (utils/hashing.ts). Never return them from any API.
- **No monolith rule:** every source file ≤ ~200 lines. Schema files split by domain module; seed split by region/domain; one route file per resource; one service file per domain. If a file approaches the cap, split before it does.
- **Errors:** custom `AppError(status, code, message)` + global error handler returning `{ error: { code, message } }`.
- **Auth:** JWT (HS256, `JWT_SECRET` env, 12h expiry) with claims `sub` (user id) and `role`. bcryptjs (10 rounds) hash for passwords. Runs identically on Docker Postgres and Supabase managed Postgres (plain Postgres schema, no Supabase-specific features).
- **Storage:** `EvidenceStorage` interface with two real implementations — `LocalStorage` (fs, dev/test) and `SupabaseStorage` (storage-js, prod). Selected by `EVIDENCE_STORAGE_DRIVER=local|supabase`. No third "fake" implementation exists.
- **Config:** all secrets via env (`config.ts` reads `process.env`, fails fast on missing required keys).
- **Supabase parity:** nothing in `packages/database` may use Supabase-only features; PostGIS must be enabled both on Docker image and Supabase project (documented in `docs/supabase-deployment.md`).

---

### Task 1: Monorepo scaffold + Docker Postgres/PostGIS + Supabase config

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`, `scripts/db-up.sh`, `scripts/db-migrate.sh`, `scripts/db-seed.sh`, `.github/workflows/ci.yml`

- [ ] **Step 1: Init git repo and root workspace**

```bash
cd E:\Rishwat
git init
git add plan/Rishwat.fyi.md
git commit -m "chore: import project plan"
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "rishwat-fyi",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev -w apps/api",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "db:up": "bash scripts/db-up.sh",
    "db:migrate": "bash scripts/db-migrate.sh",
    "db:seed": "bash scripts/db-seed.sh",
    "create-admin": "npm run create-admin -w apps/api"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create `docker-compose.yml`** (single PostGIS container; dev and test DBs created at init)

```yaml
services:
  db:
    image: postgis/postgis:16-master
    container_name: rishwat-db
    environment:
      POSTGRES_USER: rishwat
      POSTGRES_PASSWORD: rishwat_dev
      POSTGRES_DB: rishwat
    ports:
      - "5432:5432"
    volumes:
      - rishwat_pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rishwat -d rishwat"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  rishwat_pgdata:
```

- [ ] **Step 5: Create `scripts/init-db.sql`** (creates the test database)

```sql
CREATE DATABASE rishwat_test OWNER rishwat;
```

- [ ] **Step 6: Create `.env.example`** — note the Supabase pairs (same Drizzle schema; only the connection string and storage driver change for prod):

```env
# Local dev/test (Docker PostGIS)
DATABASE_URL=postgres://rishwat:rishwat_dev@localhost:5432/rishwat
TEST_DATABASE_URL=postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test

# Production (Supabase managed Postgres — same schema, connection-string swap only)
# DATABASE_URL=postgresql://postgres.rishwat:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres

PORT=8787
JWT_SECRET=change-me-to-a-long-random-string
ADMIN_EMAIL=admin@rishwat.fyi
ADMIN_PASSWORD=change-me
EVIDENCE_STORAGE_DRIVER=local            # local | supabase
EVIDENCE_STORAGE_DIR=./data/evidence     # used when driver=local
SUPABASE_URL=https://your-project.supabase.co   # used when driver=supabase
SUPABASE_SERVICE_ROLE_KEY=               # used when driver=supabase
SUPABASE_STORAGE_BUCKET=evidence         # used when driver=supabase
PUBLIC_BASE_URL=http://localhost:8787
```

- [ ] **Step 7: Create `.gitignore`**

```gitignore
node_modules/
dist/
.env
*.log
data/evidence/
data/exports/
coverage/
```

- [ ] **Step 8: Create `scripts/db-up.sh`, `scripts/db-migrate.sh`, `scripts/db-seed.sh`**

`scripts/db-up.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
docker compose up -d db
echo "Waiting for Postgres..."
until docker exec rishwat-db pg_isready -U rishwat -d rishwat >/dev/null 2>&1; do sleep 1; done
echo "Postgres ready on localhost:5432"
```

`scripts/db-migrate.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
npx tsx packages/database/src/migrate.ts
```

`scripts/db-seed.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
npx tsx packages/database/src/seed/index.ts
```

- [ ] **Step 9: Create `README.md`** — project name, one-paragraph mission (from plan §1), stack, quickstart (`bash scripts/db-up.sh && npm run db:migrate && npm run db:seed && npm run dev`), env setup, pointer to `docs/` (incl. `docs/supabase-deployment.md`).

- [ ] **Step 10: Create `.github/workflows/ci.yml`** — runs typecheck + tests against a PostGIS service container (same as local Docker):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgis/postgis:16-master
        env:
          POSTGRES_USER: rishwat
          POSTGRES_PASSWORD: rishwat_dev
          POSTGRES_DB: rishwat_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U rishwat"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
        env:
          TEST_DATABASE_URL: postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test
          JWT_SECRET: ci-test-secret
          EVIDENCE_STORAGE_DRIVER: local
          EVIDENCE_STORAGE_DIR: ./data/evidence-test
```

- [ ] **Step 11: Verify**

Run: `npm install && npm run typecheck` (empty until workspaces exist — must not error) then `bash scripts/db-up.sh` then `docker exec rishwat-db psql -U rishwat -l | grep rishwat_test` — Expected: two databases listed (rishwat, rishwat_test).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: monorepo scaffold with dockerized Postgres/PostGIS and Supabase-ready env"
```

---

### Task 2: Database schema — Drizzle domain modules (no monolith)

**Files:**
- Create: `packages/database/package.json`, `packages/database/tsconfig.json`, `packages/database/drizzle.config.ts`, `packages/database/src/db.ts`, `packages/database/src/migrate.ts`, `packages/database/src/index.ts`, `packages/database/src/schema/geo.ts`, `packages/database/src/schema/catalog.ts`, `packages/database/src/schema/reports.ts`, `packages/database/src/schema/trust.ts`, `packages/database/src/schema/aggregates.ts`, `packages/database/src/schema/auth.ts`, `packages/database/src/schema/index.ts`
- Test: `packages/database/test/schema.test.ts`

- [ ] **Step 1: Write `packages/database/package.json`**

```json
{
  "name": "@rishwat/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "db:migrate": "tsx src/migrate.ts",
    "db:seed": "tsx src/seed/index.ts",
    "generate": "drizzle-kit generate",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write shared pieces** — `tsconfig.json` (extends base, `rootDir: "src"`, `include: ["src", "test"]`), `drizzle.config.ts` (`dialect: "postgresql"`, `schema: "./src/schema/index.ts"`, `out: "./drizzle"`).

- [ ] **Step 3: Write `packages/database/src/schema/geo.ts`** — states, districts, cities, offices. (≈120 lines)

```ts
import {
  pgTable, uuid, text, timestamp, geometry, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // ISO 3166-2:IN, e.g. "UP"
  name: text("name").notNull().unique(),
  ...timestamps,
});

export const districts = pgTable("districts", {
  id: uuid("id").primaryKey().defaultRandom(),
  state_id: uuid("state_id").notNull().references(() => states.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("districts_state_code_idx").on(t.state_id, t.code),
  index("districts_state_idx").on(t.state_id),
]);

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  district_id: uuid("district_id").notNull().references(() => districts.id),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("cities_district_name_idx").on(t.district_id, t.name),
]);

export const offices = pgTable("offices", {
  id: uuid("id").primaryKey().defaultRandom(),
  service_id: uuid("service_id").notNull(),
  state_id: uuid("state_id").notNull().references(() => states.id),
  district_id: uuid("district_id").references(() => districts.id),
  name: text("name").notNull(),
  address: text("address"),
  location: geometry("location", { type: "point", srid: 4326 }),
  ...timestamps,
}, (t) => [
  index("offices_service_idx").on(t.service_id),
  index("offices_location_idx").using("gist", t.location),
]);
```

Note: `office.service_id` FK is declared in `catalog.ts` (services) to avoid circular imports; the column here has no inline `.references()` — the FK is added by `alter table` in the generated migration OR by cross-file reference in catalog.ts. Implementer: keep the FK constraint in the final schema (either inline by importing `services` from catalog.ts, or via the services module referencing back — choose the approach that compiles cleanly with zero circular import errors, and keep a comment noting the choice).

Also create `schema/shared.ts`:
```ts
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
```

- [ ] **Step 4: Write `packages/database/src/schema/catalog.ts`** — departments, government_sources, services. (≈110 lines)

```ts
import { sql } from "drizzle-orm";
import {
  pgTable, uuid, text, integer, numeric, jsonb, timestamp, date, index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  ...timestamps,
});

export const governmentSources = pgTable("government_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  department: text("department"),
  publication_date: date("publication_date"),
  last_verified_at: timestamp("last_verified_at", { withTimezone: true }),
  retrieved_at: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  department_id: uuid("department_id").notNull().references(() => departments.id),
  description: text("description"),
  official_fee_inr: numeric("official_fee_inr", { precision: 12, scale: 2 }),
  official_timeline_days: integer("official_timeline_days"),
  official_visits: integer("official_visits"),
  official_documents: jsonb("official_documents").$type<{ name: string; required: boolean }[]>(),
  process_steps: jsonb("process_steps").$type<{ order: number; title: string; description: string }[]>(),
  official_fee_source_id: uuid("official_fee_source_id").references(() => governmentSources.id),
  official_timeline_source_id: uuid("official_timeline_source_id").references(() => governmentSources.id),
  search_vector: text("search_vector"),
  ...timestamps,
}, (t) => [
  index("services_search_idx").on(t.search_vector),
  index("services_department_idx").on(t.department_id),
]);
```

- [ ] **Step 5: Write `packages/database/src/schema/reports.ts`** — report_status enum, reports, evidence. (≈110 lines)

```ts
import {
  pgEnum, pgTable, uuid, text, integer, numeric, boolean, date,
  timestamp, index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./shared.js";

export const reportStatusEnum = pgEnum("report_status", [
  "submitted", "validated", "corroborated", "evidence_backed",
  "officially_acknowledged", "rejected", "withdrawn",
]);

export const evidenceStatusEnum = pgEnum("evidence_status", [
  "pending_review", "accepted", "rejected",
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  public_id: text("public_id").notNull().unique(),
  service_id: uuid("service_id").notNull(),
  state_id: uuid("state_id").notNull(),
  district_id: uuid("district_id").notNull(),
  office_id: uuid("office_id"),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  official_fee_reported_inr: numeric("official_fee_reported_inr", { precision: 12, scale: 2 }),
  additional_amount_reported_inr: numeric("additional_amount_reported_inr", { precision: 12, scale: 2 }),
  amount_paid_inr: numeric("amount_paid_inr", { precision: 12, scale: 2 }),
  paid: boolean("paid").notNull().default(false),
  delay_days: integer("delay_days"),
  visits: integer("visits"),
  description: text("description").notNull(),
  status: reportStatusEnum("status").notNull().default("submitted"),
  status_changed_at: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
  ip_hash: text("ip_hash"),
  device_fingerprint_hash: text("device_fingerprint_hash"),
  submission_token_hash: text("submission_token_hash"),
  duplicate_group_id: uuid("duplicate_group_id"),
  abuse_score: numeric("abuse_score", { precision: 5, scale: 2 }).notNull().default("0"),
  ...timestamps,
}, (t) => [
  index("reports_service_status_idx").on(t.service_id, t.status),
  index("reports_district_status_idx").on(t.district_id, t.status),
  index("reports_created_at_idx").on(t.created_at),
  index("reports_duplicate_group_idx").on(t.duplicate_group_id),
  index("reports_ip_hash_idx").on(t.ip_hash),
  index("reports_description_trgm_idx").using("gin", sql`to_tsvector('english', ${t.description})`),
]);
```

Cross-file FKs: `reports.service_id → services.id`, `reports.state_id → states.id`, `reports.district_id → districts.id`, `reports.office_id → offices.id` must exist in the final schema (add `.references()` by importing from `./catalog.js` / `./geo.js` — resolve any circular-import issue by importing the table modules, never the barrel `index.js`). `evidence` table (≈50 lines) has `report_id → reports.id` cascade, storage_key, mime_type, size_bytes, sha256, status, retention_until, uploaded_at.

- [ ] **Step 6: Write `packages/database/src/schema/trust.ts`** — verification_events, moderation_actions (≈70 lines, both reference `reports` + `users` from auth.ts). `roleEnum` lives in `auth.ts`.

- [ ] **Step 7: Write `packages/database/src/schema/aggregates.ts`** — aggregate_metrics with unique cell index (≈45 lines).

- [ ] **Step 8: Write `packages/database/src/schema/auth.ts`** — `roleEnum`, users table (≈35 lines, email unique, bcrypt hash column, role default moderator, is_active, last_login_at).

- [ ] **Step 9: Write `packages/database/src/schema/index.ts`** — re-exports every module. Plus `packages/database/src/index.ts` re-exporting schema + `createDb` from db.ts.

- [ ] **Step 10: Write `packages/database/src/db.ts`**

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export function createDb(url: string) {
  const client = postgres(url, { max: 10 });
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>["db"];
```

- [ ] **Step 11: Write `packages/database/src/migrate.ts`** — extensions + search trigger + migrations (≈45 lines; extensions also documented for Supabase in `docs/supabase-deployment.md` Task 14):

```ts
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const client = postgres(url, { max: 1 });
const db = drizzle(client);

async function main() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS citext`);
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''));
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
  `);
  await db.execute(sql`
    DROP TRIGGER IF EXISTS services_search_vector_trigger ON services;
    CREATE TRIGGER services_search_vector_trigger
      BEFORE INSERT OR UPDATE OF name, description ON services
      FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();
  `);
  const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "drizzle");
  await migrate(db, { migrationsFolder });
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 12: Write test `packages/database/test/schema.test.ts`** (≈70 lines) — against `TEST_DATABASE_URL`: all 13 tables exist; `report_status` enum contains `officially_acknowledged`; search trigger exists; FK constraint exists on `reports.service_id` (query `information_schema.table_constraints` for `reports_service_id_fkey`).

- [ ] **Step 13: Run migrations against test DB and verify tests pass**

```bash
bash scripts/db-up.sh
DATABASE_URL=postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test npx tsx packages/database/src/migrate.ts
npm run test -w packages/database
```

Expected: `3 passed` (tables, enum, trigger) + FK assertion passes.

- [ ] **Step 14: Generate initial migration files + commit**

```bash
npm run generate -w packages/database
git add -A && git commit -m "feat(db): domain-split Drizzle schema for geo, catalog, reports, trust, aggregates, auth"
```

---

### Task 3: Validation package (zod schemas)

**Files:**
- Create: `packages/validation/package.json`, `packages/validation/tsconfig.json`, `packages/validation/src/index.ts`, `packages/validation/src/common.ts`, `packages/validation/src/report.ts`, `packages/validation/src/service.ts`, `packages/validation/src/source.ts`, `packages/validation/src/moderation.ts`, `packages/validation/src/admin.ts`
- Test: `packages/validation/test/validation.test.ts`

- [ ] **Step 1: Write `packages/validation/package.json`** — name `@rishwat/validation`, `type: module`, scripts `typecheck` / `test`, deps `zod ^3.23.8`, devDeps `typescript`, `vitest`.

- [ ] **Step 2: Write `packages/validation/src/common.ts`** (≈30 lines)

```ts
import { z } from "zod";

export const slugSchema = z.string().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const uuidSchema = z.string().uuid();
export const publicIdSchema = z.string().regex(/^R-[a-z0-9]{8}$/);
export const pageSchema = z.coerce.number().int().min(1).default(1);
export const perPageSchema = z.coerce.number().int().min(1).max(100).default(20);
export const inrSchema = z.number().min(0).max(10_000_000).multipleOf(0.01);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const emailSchema = z.string().email().max(254);
```

- [ ] **Step 3: Write `packages/validation/src/report.ts`** — `reportSubmissionSchema` (≈45 lines): service_id/state_id/district_id uuids, optional office_id, period dates, optional fees/delay/visits, `description` 30–5000 chars; `.refine` period_end ≥ period_start; `.refine` at least one experience field present. `reportStatusSchema` enum mirroring DB. `evidenceUploadSchema` (report_id uuid, mime_type ≤100, size_bytes 1..20MB, sha256 64-hex).

- [ ] **Step 4: Write `packages/validation/src/service.ts`** — `serviceQuerySchema` (q ≤200, optional department slug, state/district names, page/per_page), `serviceDocumentSchema`, `serviceProcessStepSchema`. (≈25 lines)

- [ ] **Step 5: Write `packages/validation/src/source.ts`** — `governmentSourceSchema` (url, title 3..300, department, publication_date, last_verified_at). (≈12 lines)

- [ ] **Step 6: Write `packages/validation/src/moderation.ts`** — `moderationDecisionSchema` (public_id, action enum, reason ≤1000, source_url required iff `acknowledge_officially`), `evidenceReviewSchema`, `moderationQueueQuerySchema`. (≈35 lines)

- [ ] **Step 7: Write `packages/validation/src/admin.ts`** — `loginSchema` (email, password 8..200), `createModeratorSchema` (email, password, name, role default moderator). (≈15 lines)

- [ ] **Step 8: Write `packages/validation/src/index.ts`** — re-exports all modules. Write `tsconfig.json` (extends base, `include: ["src", "test"]`).

- [ ] **Step 9: Write `packages/validation/test/validation.test.ts`** (≈80 lines) — must FAIL on: period_end < period_start; description < 30 chars; negative fee; `acknowledge_officially` without source_url; short password; slug "Bad Slug!"; per_page 1000. PASS on: only-description report; valid full report; valid login.

- [ ] **Step 10: Verify & commit**

Run: `npm run test -w packages/validation` (all pass) and `npm run typecheck -w packages/validation` (clean).
```bash
git add -A && git commit -m "feat(validation): zod schemas for reports, moderation, auth, sources"
```

---

### Task 4: Seed — real India locations + real services with official data (region-split files)

**Files:**
- Create: `packages/database/src/seed/types.ts`, `packages/database/src/seed/locations/north.ts`, `packages/database/src/seed/locations/south.ts`, `packages/database/src/seed/locations/east.ts`, `packages/database/src/seed/locations/west.ts`, `packages/database/src/seed/locations/central.ts`, `packages/database/src/seed/locations/index.ts`, `packages/database/src/seed/services/transport.ts`, `packages/database/src/seed/services/land.ts`, `packages/database/src/seed/services/police.ts`, `packages/database/src/seed/services/municipal.ts`, `packages/database/src/seed/services/revenue.ts`, `packages/database/src/seed/services/commerce.ts`, `packages/database/src/seed/services/index.ts`, `packages/database/src/seed/index.ts`
- Test: `packages/database/test/seed.test.ts`

**Real-data rule:** 28 states + 8 UTs with ISO 3166-2:IN codes; complete real district lists (Census 2011/LGD — total ~740); 12 launch services (plan §23) with real official fees, timelines, documents, and real government source URLs.

- [ ] **Step 1: Write `packages/database/src/seed/types.ts`** — StateSeed (code, name, districts[{code, name, cities[]}]), DepartmentSeed, SourceSeed, ServiceSeed (≈30 lines, same shapes as Task 4 of v1).

- [ ] **Step 2: Write region files** — each `locations/<region>.ts` exports `stateSeeds: StateSeed[]` for its assigned states (see layout for the assignment). Each file stays under ~200 lines: UP alone has 75 districts → distribute UP across lines compactly (one district per line, `code: "UPnn"`, 1–3 cities each). If a single region file exceeds ~200 lines, split it further (e.g., `north/up.ts`). Implementer: keep every file ≤ ~200 lines — split files as needed, add them to `locations/index.ts`.

- [ ] **Step 3: Write `packages/database/src/seed/locations/index.ts`** — `export const stateSeeds: StateSeed[] = [...north, ...south, ...east, ...west, ...central]`.

- [ ] **Step 4: Write service domain files** — each `services/<domain>.ts` exports `serviceSeeds: ServiceSeed[]` + the `DepartmentSeed`s it needs (exported separately and combined in `services/index.ts`). Real data per v1 Task 4 Step 3 (driving-licence example there): every service has real `official_fee_inr`, `official_timeline_days`, `official_visits`, `official_documents`, `process_steps`, and real govt source URLs (parivahan.gov.in, passportindia.gov.in, gst.gov.in, igrsup.gov.in, municipal portals). Where fees are state-specific use Uttar Pradesh figures and note it in the description.

- [ ] **Step 5: Write `packages/database/src/seed/services/index.ts`** — combine `departmentSeeds` and `serviceSeeds` from all domain files.

- [ ] **Step 6: Write `packages/database/src/seed/index.ts`** — idempotent upsert runner (v1 Task 4 Step 4 logic, unchanged): states by code, districts by (state_id, code), cities by (district_id, name), departments by slug, sources by url (onConflictDoNothing + select fallback), services by slug with source-id resolution.

- [ ] **Step 7: Write `packages/database/test/seed.test.ts`** (v1 Task 4 Step 5, unchanged) — 36 states, ≥700 districts, 12 services with fee/timeline/fee-source, idempotency.

- [ ] **Step 8: Run and verify**

```bash
DATABASE_URL=postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test npx tsx packages/database/src/migrate.ts
DATABASE_URL=postgres://rishwat:rishwat_dev@localhost:5432/rishwat_test npx tsx packages/database/src/seed/index.ts
npm run test -w packages/database
```

Expected: 4 passing tests; seed log shows 36 states, ≥700 districts, 12 services.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(db): seed real India locations and 12 services with official data"
```

---

### Task 5: API skeleton — app factory, config, errors, middleware, storage factory

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/index.ts`, `apps/api/src/app.ts`, `apps/api/src/config.ts`, `apps/api/src/errors.ts`, `apps/api/src/utils/hashing.ts`, `apps/api/src/middleware/rate-limit.ts`, `apps/api/src/routes/health.ts`, `apps/api/src/storage/evidence.storage.ts`, `apps/api/src/storage/local.storage.ts`, `apps/api/src/storage/supabase.storage.ts`, `apps/api/src/storage/index.ts`
- Test: `apps/api/test/app.test.ts`, `apps/api/test/helpers.ts`, `apps/api/test/storage.test.ts`

- [ ] **Step 1: Write `apps/api/package.json`** — name `@rishwat/api`, deps: `@hono/node-server`, `@hono/rate-limiter`, `@hono/zod-openapi`, `@hono/zod-validator`, `@rishwat/database`, `@rishwat/validation`, `bcryptjs`, `hono`, `jose`, `zod`, `@supabase/storage-js`; devDeps: `@types/bcryptjs`, `drizzle-kit`, `tsx`, `typescript`, `vitest`. Scripts: dev (tsx watch), start, typecheck, test, create-admin, export.

- [ ] **Step 2: Write `apps/api/src/config.ts`** (≈40 lines) — `loadConfig(env)` reading: DATABASE_URL (required), TEST_DATABASE_URL, PORT (default 8787), JWT_SECRET (required), ADMIN_EMAIL, ADMIN_PASSWORD, EVIDENCE_STORAGE_DRIVER (default "local", validate ∈ {local, supabase}), EVIDENCE_STORAGE_DIR, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET, PUBLIC_BASE_URL. Fails fast with clear message when driver=supabase but SUPABASE_URL/KEY missing.

- [ ] **Step 3: Write `apps/api/src/errors.ts`** (≈20 lines) — AppError(status, code, message); helpers notFound/unauthorized/forbidden/badRequest/conflict/tooMany.

- [ ] **Step 4: Write `apps/api/src/utils/hashing.ts`** (≈15 lines) — `sha256Hex`, `randomToken` (24 random bytes base64url), `publicReportId` (`R-` + 6 random bytes base36).

- [ ] **Step 5: Write `apps/api/src/middleware/rate-limit.ts`** (≈30 lines) — `strictLimiter` (3 req/h per IP), `standardLimiter` (60 req/min), `evidenceLimiter` (10 req/h), all `hono-rate-limiter`, key by `x-forwarded-for` → `cf-connecting-ip` → "unknown".

- [ ] **Step 6: Write `apps/api/src/routes/health.ts`** (≈20 lines) — `SELECT 1` → `{ status: "ok", database: "up", time }` or 503 degraded.

- [ ] **Step 7: Write storage files**

`evidence.storage.ts` (≈25 lines):
```ts
export type StoredObject = { key: string; sha256: string };
export type SignedUrl = { url: string; expiresInSeconds: number };

export interface EvidenceStorage {
  put(key: string, bytes: Uint8Array, mimeType: string): Promise<StoredObject>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  signedUrl(key: string, expiresInSeconds: number): Promise<SignedUrl>;
}
```

`local.storage.ts` (≈60 lines) — real fs implementation: `put` writes file under configured dir (mkdir -p), returns `{ key, sha256 }` computed from bytes; `get` reads file or null; `delete` unlinks (swallow ENOENT); `signedUrl` returns `{ url: "file://..." + path, expiresInSeconds }` (dev only, real file, documented).

`supabase.storage.ts` (≈60 lines) — real implementation using `@supabase/storage-js`:
```ts
import { createClient } from "@supabase/storage-js";

export function createSupabaseStorage(url: string, serviceRoleKey: string, bucket: string): EvidenceStorage {
  const client = createClient(`${url}/storage/v1`, serviceRoleKey);
  // put: client.from(bucket).upload(key, bytes, { contentType: mimeType, upsert: false })
  //   → { key, sha256 } (sha256 computed from bytes before upload)
  // get: download(key) → data instanceof ArrayBuffer ? new Uint8Array(data) : null
  // delete: remove([key]) — throw AppError 500 if error
  // signedUrl: createSignedUrl(key, expiresInSeconds) → { url, expiresInSeconds }
  // bucket must exist in the Supabase project (documented in docs/supabase-deployment.md)
}
```
No fallback, no mock — if Supabase is unreachable, errors propagate.

`index.ts` (≈20 lines) — `createEvidenceStorage(config): EvidenceStorage` factory: `"local"` → LocalStorage(dir), `"supabase"` → SupabaseStorage(url, key, bucket).

- [ ] **Step 8: Write `apps/api/src/app.ts`** — factory `createApp(db, storage)`; logger + cors; mounts `/health`; 404 JSON; `onError` mapping AppError → status/code, else 500 (log). ≈45 lines.

- [ ] **Step 9: Write `apps/api/src/index.ts`** — loadConfig, createDb, createEvidenceStorage, createApp, `serve` on PORT, SIGINT/SIGTERM graceful close. ≈30 lines.

- [ ] **Step 10: Write `apps/api/tsconfig.json`** — extends base, paths for `@rishwat/database`/`@rishwat/validation` → source, include src+test. `drizzle.config.ts` — same as database package but schema from `@rishwat/database` import (kept for future local migrations of API-level tables; may be removed if unused — implementer: only create if drizzle-kit needs it, else skip with a note).

- [ ] **Step 11: Write `apps/api/test/helpers.ts`** — `bootTestApp()` → createDb(TEST_DATABASE_URL) + createApp + LocalStorage(temp dir) + config; expose `{ app, db, client, config, storageDir }`. ≈25 lines.

- [ ] **Step 12: Write `apps/api/test/app.test.ts`** — health ok; 404 JSON. `apps/api/test/storage.test.ts` — LocalStorage round-trip: put → file exists on disk with correct sha256; get returns bytes; delete removes; signedUrl returns file path. Supabase storage: not exercised in unit tests (needs live Supabase — covered in Task 15 smoke with documented instructions).

- [ ] **Step 13: Verify & commit**

```bash
bash scripts/db-up.sh
npm run typecheck -w apps/api && npm run test -w apps/api
```

Expected: 4+ passing tests, typecheck clean.
```bash
git add -A && git commit -m "feat(api): Hono app factory, config, errors, storage adapters (local/supabase)"
```

---

### Task 6: Public search + browse endpoints (full-text + trigram)

**Files:**
- Create: `apps/api/src/services/search.service.ts`, `apps/api/src/routes/search.ts`, `apps/api/src/routes/locations.ts`, `apps/api/src/routes/services.ts`
- Modify: `apps/api/src/app.ts` (mount routes)
- Test: `apps/api/test/search.test.ts`, `apps/api/test/services.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/search.service.ts`** — `searchServices(db, q, {department, state, district, page, per_page})`: `WHERE` conditions built via drizzle `sql` template literals (parameterized — never string-interpolate user input): `s.search_vector @@ plainto_tsquery('english', ${q}) OR s.name ILIKE ${"%" + q + "%"} OR s.name % ${q}`; department filter on `departments.slug`; state/district filters via `EXISTS (SELECT 1 FROM reports r WHERE r.service_id = s.id AND r.state_id = st.id ...)` semantics — implement with `sql` EXISTS subqueries over `states.name`/`districts.name`. Returns `{ total, items }` with slug/name/department/state/district names (join departments; state/district from EXISTS-filtered subqueries or a later join — implementer chooses the cleanest parameterized query; add a `report_count` per service via `LEFT JOIN LATERAL` count for the matching scope). Keep file ≤ 80 lines.

- [ ] **Step 2: Write `apps/api/src/routes/search.ts`** (≈30 lines) — `GET /` with `zValidator("query", serviceQuerySchema)` → `searchServices` → `{ total, items }`.

- [ ] **Step 3: Write `apps/api/src/routes/locations.ts`** (≈70 lines) — `GET /states` (id, code, name, order by name); `GET /states/:code/districts` (id, code, name, state code from param); `GET /districts/:districtId/cities` (id, name, order by name); `GET /departments` (slug, name, category). Params validated via zValidator params. NotFound when state code unknown.

- [ ] **Step 4: Write `apps/api/src/routes/services.ts`** — `GET /services` (serviceQuerySchema filters, returns `{ total, items }` of slug/name/department/description); `GET /services/:slug` detail: official block (fee, timeline, visits, documents, process_steps) + `sources` object (fee/timeline source url+title+last_verified_at) + citizen block via `serviceAggregates` (Task 7 — implement the route now with a TODO-free stub that Task 7 fills; implementer: import `aggregates.service.ts` and implement the citizen call in Task 7's commit; to keep this task green, return `citizen: null` until Task 7 wires it, then Task 7 updates this route).

- [ ] **Step 5: Write `apps/api/test/search.test.ts`** (≈60 lines) — seeded DB: full-text "licence" → driving-licence present; department filter `rto` → only RTO services; invalid per_page → 400.

- [ ] **Step 6: Write `apps/api/test/services.test.ts`** (≈60 lines) — list returns 12 seeded services; detail of `driving-licence` returns official_fee_inr, official_timeline_days, documents array, sources with fee url; unknown slug → 404.

- [ ] **Step 7: Mount routes in `apps/api/src/app.ts`** under `/search`, `/services`, `/locations` with `standardLimiter`.

- [ ] **Step 8: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): public search and service browse endpoints"
```

---

### Task 7: Aggregates service + service page citizen stats

**Files:**
- Create: `apps/api/src/services/aggregates.service.ts`
- Modify: `apps/api/src/routes/services.ts` (wire citizen block)
- Test: `apps/api/test/aggregates.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/aggregates.service.ts`** (≈90 lines) — `serviceAggregates(db, serviceId, districtId?)`:
  - COUNT + `count(DISTINCT ip_hash)` + `percentile_cont(0.5)` for `additional_amount_reported_inr` and `delay_days` + `avg(visits)` + corroboration rate (`FILTER` over corroborated/evidence_backed/officially_acknowledged) over `status IN (validated, corroborated, evidence_backed, officially_acknowledged)`.
  - `published = count ≥ 3 AND ip_buckets ≥ 2`; if not published, all stats return `null` but `report_count` still returned as actual count with `published: false`.
  - `recent_issues`: real derived data — scan `reports.description` (same scope) for the five issue keywords (`multiple_visits`, `unclear_process`, `additional_payment_requested`, `document_requests_repeated`, `office_staff_unhelpful`) via `ILIKE '%keyword%'` counts, return top 5 keywords by count (not random).
  - Single parameterized query; no string interpolation of user input.

- [ ] **Step 2: Modify `apps/api/src/routes/services.ts`** — `GET /services/:slug` now returns `{ service, sources, citizen, notice }` where `citizen` = `serviceAggregates(...)` and `notice` = "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing." (from plan §16).

- [ ] **Step 3: Write `apps/api/test/aggregates.test.ts`** (≈90 lines) — insert 4 real reports (validated, distinct ip_hash, amounts 500/1000/2000/3000, service driving-licence, district Agra) → `published: true`, `report_count: 4`, `extra_payment_median: "1500"`, `delay_median` correct; 1 report → `published: false`, stats null; service detail route returns citizen block; keyword issue detection: description containing "additional payment requested" → `recent_issues` contains that keyword.

- [ ] **Step 4: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): citizen aggregates with publishing threshold and derived issues"
```

---

### Task 8: Anonymous report submission + tracking + evidence upload via storage adapter

**Files:**
- Create: `apps/api/src/services/reports.service.ts`, `apps/api/src/routes/reports.ts`, `apps/api/src/routes/evidence.ts`
- Modify: `apps/api/src/app.ts` (mount routes)
- Test: `apps/api/test/reports.test.ts`, `apps/api/test/evidence.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/reports.service.ts`** (≈110 lines) — `submitReport(db, input, { ip, deviceFingerprint, storage })`:
  1. Verify service/state/district exist (404 otherwise).
  2. Hash ip/device via `sha256Hex`.
  3. Duplicate check via `findDuplicateGroup` (Task 9 — until then inline a `similarity(description) >= 0.75` query over last 90 days same service+district, linking `duplicate_group_id` to the earliest match).
  4. Insert with status `submitted`, abuse_score 0; insert `verification_events` (null → submitted, method `citizen_submission`).
  5. Return `{ public_id, status, submission_token }` (token returned once, only hash stored).

- [ ] **Step 2: Write `apps/api/src/routes/reports.ts`** (≈70 lines) — `POST /reports` (strictLimiter, zValidator reportSubmissionSchema, ip from headers, optional `x-device-fingerprint` header hashed) → 201 `{ public_id, status, submission_token }`; `GET /reports/:publicId/status?token=` → `{ public_id, status, status_changed_at }` only when token hash matches (else 404); `GET /reports/:publicId` public view (service/state/district names, dates, amounts, visits, delay, redacted description, evidence file list via `evidence` table join, status — no PII fields).

- [ ] **Step 3: Write `apps/api/src/routes/evidence.ts`** (≈55 lines) — `POST /evidence` (evidenceLimiter): multipart via `c.req.parseBody()`; file part must be a `File`; validate size ≤ 20MB; `storage.put(key, bytes, mimeType)` (key = `${reportId}/${crypto.randomUUID()}`); verify report exists (404); compute sha256 in service; insert evidence row with `retention_until = now + 90 days`, status pending_review; return `{ id, status, retention_until }`. Also `GET /evidence/:id` → metadata only (no content) for a report's public view.

- [ ] **Step 4: Write `apps/api/test/reports.test.ts`** (≈110 lines) — valid submission 201 with `R-[a-z0-9]{8}` public_id + token; duplicate near-identical submission shares `duplicate_group_id`; description < 30 chars → 400; unknown service → 404; status endpoint with correct token → 200 `submitted`, wrong token → 404; DB row has 64-hex `ip_hash` and no raw ip column; `GET /reports/:publicId` returns redacted data (description with a phone number → `[REDACTED]` via Task 13 redaction — until then return raw description; implementer: wire `utils/redaction.ts` minimal version here and extend in Task 13).

- [ ] **Step 5: Write `apps/api/test/evidence.test.ts`** (≈70 lines) — real multipart upload of a 10KB buffer → 201, sha256 matches, file exists on disk (LocalStorage), DB row retention ≈ now+90d; oversize (21MB) → 400; missing file → 400; evidence for unknown report → 404.

- [ ] **Step 6: Mount in `apps/api/src/app.ts`**: `/reports`, `/evidence` (public, limited).

- [ ] **Step 7: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): anonymous report submission, tracking, evidence upload via storage adapter"
```

---

### Task 9: Anti-abuse — duplication service, abuse scoring, coordinated clusters

**Files:**
- Create: `apps/api/src/services/duplication.service.ts`, `apps/api/src/services/abuse.service.ts`
- Modify: `apps/api/src/services/reports.service.ts` (use both services)
- Test: `apps/api/test/abuse.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/duplication.service.ts`** (≈35 lines) — `findDuplicateGroup(db, serviceId, districtId, description, sinceDays = 90)` → earliest `duplicate_group_id` where `similarity(r.description, ${description}) >= 0.75`, parameterized.

- [ ] **Step 2: Write `apps/api/src/services/abuse.service.ts`** (≈90 lines) — `evaluateAbuse(db, { serviceId, districtId, ipHash, deviceHash, description })` → `{ score, signals }`:
  - Duplicate-of-existing (findDuplicateGroup hit): +40
  - Same ip_hash > 5 reports same service in 24h: +30
  - Same device_fingerprint_hash > 5 reports in 24h: +20
  - Coordinated burst: ≥ 3 reports same service+district with similarity ≥ 0.5 within 1h: +50
  - Cap at 100.
  `findCoordinatedClusters(db, windowHours = 24)` → groups ip_hash + service with count ≥ 5, `{ ip_hash_prefix, service_slug, report_count, time_range }` (for admin stats).

- [ ] **Step 3: Wire into `reports.service.ts`** — after insert: update `abuse_score`, insert `verification_events` method `auto_flag` note `suspected_coordinated` when score ≥ 70. Reports with score ≥ 70 remain `submitted` (moderator decides) but get flagged.

- [ ] **Step 4: Write `apps/api/test/abuse.test.ts`** (≈80 lines) — 6 identical submissions same ip (x-forwarded-for header) same service+district → 6th has abuse_score ≥ 70 + auto_flag event; two near-identical → same duplicate_group_id; distinct ips/descriptions → score 0; cluster query returns 5+ group.

- [ ] **Step 5: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): anti-abuse signals, abuse scoring, coordinated cluster detection"
```

---

### Task 10: Moderator auth (JWT, bcrypt, create-admin CLI)

**Files:**
- Create: `apps/api/src/services/auth.service.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/admin/auth.ts`, `apps/api/scripts/create-admin.ts`
- Modify: `apps/api/src/app.ts` (mount admin router)
- Test: `apps/api/test/auth.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/auth.service.ts`** (≈60 lines) — `hashPassword`/`verifyPassword` (bcryptjs, 10 rounds), `createUser(db, email, password, name?, role)` (users table), `issueToken(user, secret)` (jose SignJWT HS256, 12h, claims sub+role), `verifyToken(token, secret)` (jwtVerify, throws unauthorized on failure, returns `{ id, role }`).

- [ ] **Step 2: Write `apps/api/src/middleware/auth.ts`** (≈35 lines) — `requireAuth` (Bearer → verifyToken → `c.set("user", ...)`, 401 otherwise); `requireRole("admin")` (403 for non-admin).

- [ ] **Step 3: Write `apps/api/src/routes/admin/auth.ts`** (≈45 lines) — `POST /admin/auth/login` (zValidator loginSchema, authLimiter): fetch user by email (`lower(email)` = lower param, no user enumeration — same 401 for unknown email and wrong password), verify bcrypt, update last_login_at, return `{ token, user: { id, email, name, role } }`.

- [ ] **Step 4: Write `apps/api/scripts/create-admin.ts`** (≈40 lines) — reads ADMIN_EMAIL/ADMIN_PASSWORD from env; upserts admin by email (create or update password_hash + role=admin + is_active=true); prints created/updated. Uses `createDb(DATABASE_URL)` + `hashPassword`.

- [ ] **Step 5: Write `apps/api/test/auth.test.ts`** (≈90 lines) — createUser → login correct → 200 + decodable token (sub matches, role matches); wrong password → 401; unknown email → 401 same code; protected route (mount a `/admin/ping` test route behind requireAuth in the test app) → 401 without token, 200 with token; admin-only route → 403 for moderator token; create-admin script run via `tsx` with env → admin user exists, idempotent (run twice).

- [ ] **Step 6: Mount in `apps/api/src/app.ts`** — admin router with `requireAuth` on all admin routes except `/admin/auth/login`.

- [ ] **Step 7: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): moderator auth with JWT, bcrypt, create-admin CLI"
```

---

### Task 11: Verification state machine + moderation workflow API

**Files:**
- Create: `apps/api/src/services/verification.service.ts`, `apps/api/src/routes/admin/moderation.ts`
- Modify: `apps/api/src/app.ts` (mount admin routes)
- Test: `apps/api/test/moderation.test.ts`

- [ ] **Step 1: Write `apps/api/src/services/verification.service.ts`** (≈70 lines) — LEGAL transitions map (v1 Task 11 Step 1, unchanged); `transitionReport(db, publicId, toStatus, method, { moderatorId?, note? })` — notFound if missing, badRequest on illegal transition, records `verification_events`, returns updated report. `corroborateEligible(db)` — validated reports with ≥ 2 other independent reports (distinct ip_hash) same service+district in last 180 days → `corroborated` via `auto_corroboration`.

- [ ] **Step 2: Write `apps/api/src/routes/admin/moderation.ts`** (≈110 lines) — `GET /admin/queue?status=` (moderationQueueQuerySchema, joins service/district names, evidence counts, oldest first, paginated); `POST /admin/reports/decide` (moderationDecisionSchema → transitionReport: mark_validated→validated/moderator_review, reject→rejected, acknowledge_officially→officially_acknowledged note=source_url, withdraw→withdrawn; records `moderation_actions` with moderator_id + reason); `POST /admin/evidence/review` (evidenceReviewSchema → set evidence status; accept + report validated → evidence_backed via evidence_review).

- [ ] **Step 3: Write `apps/api/test/moderation.test.ts`** (≈120 lines) — illegal transition (reject twice) → 400; happy path: submit → login → queue shows it → mark_validated → verified event + status; acknowledge with source_url → officially_acknowledged + moderation_actions row with moderator id; acknowledge without source_url → 400; corroboration job: 3 validated reports distinct ips → all corroborated; unauthenticated queue → 401.

- [ ] **Step 4: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): verification state machine and moderation workflow"
```

---

### Task 12: Admin stats + coordination cluster endpoint

**Files:**
- Create: `apps/api/src/routes/admin/stats.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/stats.test.ts`

- [ ] **Step 1: Write `apps/api/src/routes/admin/stats.ts`** (≈110 lines, admin role only) — `GET /admin/stats/overview` (real SQL counts: total_reports, published_reports, pending_review, rejected, corroboration_rate, reports_last_7_days, states_covered, services_covered); `GET /admin/stats/duplicates` (groups by duplicate_group_id with count ≥ 2: group_id, report_count, service_slug, district_name, oldest, newest); `GET /admin/stats/clusters` (findCoordinatedClusters).

- [ ] **Step 2: Write `apps/api/test/stats.test.ts`** (≈90 lines) — seed 5 reports (4 publishable + 1 submitted) → overview numbers match; 2 identical descriptions → duplicates group present; 5 same-ip submissions in window → cluster count 5; moderator (non-admin) → 403 on stats.

- [ ] **Step 3: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): admin stats, duplicate groups, coordinated clusters"
```

---

### Task 13: OpenAPI spec + dataset export (CSV/JSON) + redaction

**Files:**
- Create: `apps/api/src/services/export.service.ts`, `apps/api/src/routes/datasets.ts`, `apps/api/src/utils/redaction.ts`, `apps/api/scripts/export-dataset.ts`, `apps/api/src/openapi.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/datasets.test.ts`, `apps/api/test/redaction.test.ts`

- [ ] **Step 1: Write `apps/api/src/utils/redaction.ts`** (≈45 lines) — `redactText(text)`: replace Aadhaar (12 digits), Indian mobile (10 digits, optional +91), email, 16-digit card numbers with `[REDACTED]`. Deterministic, order matters (email before phone patterns).

- [ ] **Step 2: Write `apps/api/src/services/export.service.ts`** (≈90 lines) — `exportRows(db)`: single SQL join over publishable-status reports → columns per data dictionary (public_id, service_slug, service_name, department, state_code, state_name, district_name, period_start, period_end, official_fee_reported_inr, additional_amount_reported_inr, amount_paid_inr, paid, delay_days, visits, redacted_description, status, created_at) — NEVER ip_hash/device/token/office. Redaction applied in JS over description. `toCsv(rows)` — RFC 4180 quoting.

- [ ] **Step 3: Write `apps/api/src/routes/datasets.ts`** (≈45 lines) — `GET /datasets` → `{ datasets: [{ name: "reports", format: "csv", url }, { name: "reports", format: "json", url }], generated_at, license: "CC BY 4.0 (data) / MIT (code) — see docs/methodology.md", notice }`; `GET /datasets/reports.csv` + `GET /datasets/reports.json` (Cache-Control: no-store, correct content types).

- [ ] **Step 4: Write `apps/api/scripts/export-dataset.ts`** (≈40 lines) — CLI: `exportRows` → writes `data/exports/reports-YYYY-MM-DD.csv/.json` + `manifest.json` (generated_at, counts, schema version).

- [ ] **Step 5: Write `apps/api/src/openapi.ts`** (≈60 lines) — static OpenAPI 3.0 doc (info, servers, security, paths summary with methods + response codes for health/search/services/reports/evidence/datasets/admin, schemas reference) served at `GET /doc/openapi.json`; `GET /doc` → JSON index linking openapi.json + datasets + data dictionary.

- [ ] **Step 6: Write tests** — `redaction.test.ts` (≈35 lines): each pattern redacted, plain text untouched. `datasets.test.ts` (≈90 lines): seed reports incl. one rejected (excluded) and one with PII in description → CSV contains `[REDACTED]`, JSON rows lack `ip_hash` key, rejected report absent, content-type text/csv, openapi.json lists /reports and /search.

- [ ] **Step 7: Verify & commit**

```bash
npm run typecheck -w apps/api && npm run test -w apps/api
git add -A && git commit -m "feat(api): public dataset export with redaction and OpenAPI spec"
```

---

### Task 14: Documentation — methodology, moderation, privacy, governance, data dictionary, Supabase deployment

**Files:**
- Create: `docs/methodology.md`, `docs/moderation.md`, `docs/privacy.md`, `docs/governance.md`, `docs/contributing.md`, `docs/mirroring.md`, `docs/data-dictionary.md`, `docs/api.md`, `docs/supabase-deployment.md`, `data/schemas/report.schema.json`

- [ ] **Step 1: Write `docs/methodology.md`** — from plan §8/§9/§18: status ladder, publishing threshold (≥3 reports, ≥2 ip buckets), aggregate definitions (median extra payment, median delay, visits avg, corroboration rate), anti-abuse signals, limitations statement, core loop citation.

- [ ] **Step 2: Write `docs/moderation.md`** — queue workflow, decision actions, evidence review, moderation log transparency, escalation path, legal framing from plan §20.

- [ ] **Step 3: Write `docs/privacy.md`** — from plan §19: minimal data collection, hashing (never raw IP/device/token), 90-day evidence retention, redaction pipeline, do-not-publish list, correction process.

- [ ] **Step 4: Write `docs/governance.md`** — plan §21 roles + §22 funding philosophy.

- [ ] **Step 5: Write `docs/contributing.md`** — dev setup, how to add a service (seed entry + source), test workflow, PR process.

- [ ] **Step 6: Write `docs/mirroring.md`** — plan §11: how to mirror (clone repo, run export, host static copies), mirror manifest format.

- [ ] **Step 7: Write `docs/data-dictionary.md`** — one table per export column: name, type, description, example, nullable, privacy class (public/redacted/internal). Must exactly match `export.service.ts` columns.

- [ ] **Step 8: Write `data/schemas/report.schema.json`** — JSON Schema (draft-07) mirroring `reportSubmissionSchema` with descriptions.

- [ ] **Step 9: Write `docs/api.md`** — endpoint reference: method, path, auth, rate limit, zod schema, response shape. Cross-link openapi.json.

- [ ] **Step 10: Write `docs/supabase-deployment.md`** — production path: create Supabase project, enable PostGIS extension, run `npm run generate -w packages/database` + push migrations (`supabase db push` or `psql` against pooler), set env vars (DATABASE_URL pooler, EVIDENCE_STORAGE_DRIVER=supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET), create the `evidence` bucket, run `npm run create-admin`, deploy API (Docker/Fly/Render — no Supabase Functions requirement), retention note for evidence bucket.

- [ ] **Step 11: Verify & commit**

Verify: docs/api.md endpoint list matches routes (grep); data dictionary matches export columns; report.schema.json semantics match zod.
```bash
git add -A && git commit -m "docs: methodology, moderation, privacy, governance, supabase deployment, data dictionary"
```

---

### Task 15: Final verification — full suite green, end-to-end smoke, final review

**Files:** none new (fixes only)

- [ ] **Step 1: Full typecheck + tests from clean state**

```bash
bash scripts/db-up.sh
npm run typecheck
npm run test
```

Expected: every workspace typechecks; all tests pass.

- [ ] **Step 2: End-to-end smoke via running server**

```bash
npm run db:migrate && npm run db:seed
npm run dev &
curl -s localhost:8787/health
curl -s "localhost:8787/search?q=licence"
curl -s localhost:8787/services/driving-licence
curl -s localhost:8787/datasets
```

Verify: health ok, search returns driving-licence, service page has official + citizen blocks, datasets lists csv/json.

- [ ] **Step 3: Real submission smoke** — POST a valid report (real values, ≥30 char description) to `localhost:8787/reports`, then GET its status with the returned token. Upload a real small evidence file, confirm file on disk.

- [ ] **Step 4: Final code review** — dispatch final reviewer subagent over the whole diff (BASE = initial commit, HEAD = last): architecture coherence, no mocks/TODOs, no PII storage, all routes registered, docs match code, no file exceeds ~200 lines (spot-check largest files).

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: final verification pass"
```

---

## Self-Review (done by plan author before execution)

**Spec coverage (plan/Rishwat.fyi.md):**
- §6 search/service pages → Tasks 6–7 ✓
- §7 anonymous reporting → Task 8 ✓
- §8 verification statuses → Tasks 7, 11 ✓
- §9 anti-abuse → Tasks 8, 9, 12 ✓
- §10 data model → Task 2 ✓
- §11 public data architecture → Tasks 13, 14 ✓
- §13 stack (PostgreSQL/PostGIS, Supabase) → Tasks 1, 2, 14 ✓
- §14 government source registry → Tasks 2, 4, 6 ✓
- §16 example service page → Task 7 ✓
- §18 metrics → Tasks 7, 12 ✓
- §19 privacy → Tasks 8, 13, 14 ✓
- §23 launch services → Task 4 (12 services) ✓
- Sprint 2 (schema, report API, service DB, moderator auth, admin) → Tasks 1–12 ✓
- Sprint 3 (moderation, duplicates, evidence, verification, source registry) → Tasks 8–12 ✓
- Sprint 4 (public API, dataset export, data dictionary, methodology, contribution guide, mirror instructions) → Tasks 13–14 ✓

**User requirements check:**
- Supabase for production → connection-string swap + storage adapter + docs/supabase-deployment.md ✓
- No monolith files → ~200-line cap, schema/seed split by domain and region, one route/service file per domain ✓
- No mocks or hardcodes → real Docker Postgres tests, real seed data, real fs/Supabase storage, no in-memory stand-ins ✓
- Subagents gauntlet loop → subagent-driven-development (implementer → spec review → code-quality review per task, loops) ✓
- Backend only → no frontend coupling; public API is the contract ✓

**Placeholder scan:** no TBDs; every task has exact code or exact spec + test expectations. Seed content is real-world data the implementer must curate from the government sources listed; counts asserted by tests.

**Type consistency:** `public_id`/`submission_token` consistent across validation, services, routes, docs; `reportStatusEnum` matches `reportStatusSchema` exactly; `aggregate_metrics.metric_type` strings match docs §18; storage interface names consistent across Task 5, 8, 15.