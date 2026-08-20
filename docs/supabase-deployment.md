# Supabase Production Deployment

This document describes the production path for the Rishwat.fyi backend: **Supabase managed PostgreSQL/PostGIS** for the database and **Supabase Storage** for evidence files.

The guiding rule of the project is **parity**: local development runs the exact same code against a Docker PostGIS container, and production runs it against Supabase — *the same Drizzle schema, the same migrations, the same code, only the connection string and the storage driver change*. There is no Supabase-specific code in the dev paths and no dev-only behavior in production (see the backend implementation plan).

## Overview

| Concern | Local / test | Production |
| --- | --- | --- |
| Database | Docker `postgis/postgis:16-master` | Supabase managed Postgres + PostGIS |
| Schema/migrations | `npm run db:migrate` | Same migrations pushed to Supabase |
| Evidence storage | `local-fs` (`EVIDENCE_STORAGE_DRIVER=local`) | Supabase Storage (`EVIDENCE_STORAGE_DRIVER=supabase`) |
| Moderator auth | Postgres users + bcrypt + JWT | Same — plain Postgres schema, no Supabase Auth dependency |
| API host | `npm run dev` | Any Node ≥ 20 host (Docker, Fly.io, Render, Railway) |

Supabase Functions are **not** required. The API is a plain Node/Hono server that connects to Supabase's managed Postgres over the connection pooler and to Supabase Storage via the service role key.

## Step 1 — Create the Supabase project

1. Sign in to the [Supabase dashboard](https://supabase.com) and create a new project.
2. Choose a region close to your users.
3. Note the **project reference** (the `<ref>` in `https://<ref>.supabase.co`) and the database password — you'll need both.

## Step 2 — Enable extensions

The backend needs three Postgres extensions, all supported by Supabase:

- **`postgis`** — geographic data (`offices.location`, `geometry` columns, GiST indexes)
- **`pg_trgm`** — trigram similarity for search and duplicate detection
- **`citext`** — case-insensitive text handling

Enable them in the dashboard: **SQL Editor** (or Database → Extensions):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
```

On Supabase, some extensions (including PostGIS) must be enabled from the dashboard/SQL editor with an elevated role before the application role can use them — this is the one step that differs from local Docker (where `scripts/db-up.sh` and the migrate script create them automatically). After enabling them here, migrations can run as the application user.

## Step 3 — Generate and push migrations

The Drizzle schema lives in `packages/database`. Generate migration SQL from it:

```bash
npm run generate -w packages/database
```

This writes SQL to `packages/database/drizzle/`. Push those migrations to Supabase with **either** approach:

**Option A — `supabase db push`** (Supabase CLI):

```bash
supabase link --project-ref <project-ref>
supabase db push
```

The CLI expects migrations under `supabase/migrations/`; copy the generated files from `packages/database/drizzle/` there, or point your sync workflow at them.

**Option B — `psql` against the pooler** (no CLI):

```bash
psql "postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  -f packages/database/drizzle/<migration>.sql
```

**Option C — the project's own migrate script** (recommended): set `DATABASE_URL` to the pooler URL and run the same script used locally. It creates the extensions (as `IF NOT EXISTS`), the search-trigger function, and applies migrations:

```bash
DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  npx tsx packages/database/src/migrate.ts
```

> The migrate script is already used against the local Docker DB and against the CI container. Using it against Supabase exercises the exact same code path, which is the parity guarantee. If Supabase refuses `CREATE EXTENSION` from the app role, fall back to Step 2 (enable extensions from the dashboard first) and re-run.

Verify the tables exist (13 tables: `states`, `districts`, `cities`, `offices`, `departments`, `government_sources`, `services`, `reports`, `evidence`, `verification_events`, `moderation_actions`, `aggregate_metrics`, `users`) and that the `report_status` enum contains `officially_acknowledged`.

## Step 4 — Configure environment variables

On your production host, set exactly the environment variables the app reads (see `.env.example`):

| Variable | Value in production |
| --- | --- |
| `DATABASE_URL` | The Supabase **pooler** connection string: `postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres` |
| `PORT` | e.g. `8787` |
| `JWT_SECRET` | A long, random string (generate with `openssl rand -hex 32`) — must differ from dev |
| `ADMIN_EMAIL` | Email of the initial admin (used by `create-admin`) |
| `ADMIN_PASSWORD` | Strong password for that admin |
| `EVIDENCE_STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | The project's service role key (secret — server-side only, never exposed to the browser) |
| `SUPABASE_STORAGE_BUCKET` | `evidence` (created in Step 5) |
| `PUBLIC_BASE_URL` | The public URL of the API, e.g. `https://api.rishwat.fyi` |

The only differences from local are `DATABASE_URL`, the storage driver, and the Supabase storage values — everything else is identical.

## Step 5 — Create the `evidence` storage bucket

Evidence files are stored in a **private** Supabase Storage bucket:

1. Dashboard → Storage → **New bucket**.
2. Name: `evidence` (must match `SUPABASE_STORAGE_BUCKET`).
3. **Public bucket: OFF.** Evidence must never be served publicly; it is only ever accessed by the API via signed URLs or server-side operations, and it is deleted on a 90-day retention schedule.

### Evidence retention note

Every evidence row records `retention_until = now + 90 days`. The API is responsible for deleting expired objects (from both the storage backend and the metadata table) — there is no indefinite evidence hoarding. In production, additionally configure an S3-style lifecycle/expiration rule on the `evidence` bucket (Supabase storage buckets support Object Lifecycle / retention policies) so expired objects are also removed at the storage layer even if the API is down. See [`docs/privacy.md`](privacy.md) for the full retention policy.

## Step 6 — Create the admin user

Run the `create-admin` script once, with the production env vars set. It upserts the admin by email (creates, or resets password hash + `role = admin` + `is_active = true`) and is idempotent:

```bash
ADMIN_EMAIL=admin@rishwat.fyi ADMIN_PASSWORD='<strong-password>' \
  DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  npm run create-admin
```

Additional moderators are created by admins through the same user model (email, bcrypt-hashed password, role `moderator`).

## Step 7 — Deploy the API

The API is a standard Node ≥ 20 Hono server. **No Supabase Functions are required** — deploy it on any platform you already use. Suggested minimal Dockerfile:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps packages ./
RUN npm ci
RUN npm run typecheck

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production
EXPOSE 8787
CMD ["npm", "run", "start", "-w", "apps/api"]
```

Or deploy directly without containers on Fly.io, Render, or Railway: install the repo, `npm ci`, set the environment variables from Step 4, and run `npm run start -w apps/api` (or `npm run dev` with a process manager). Point `PUBLIC_BASE_URL` at whatever public URL the platform gives you, and terminate TLS at the platform's edge.

Because `EVIDENCE_STORAGE_DRIVER=supabase`, the API writes evidence to Supabase Storage instead of the local disk — no local volume is needed for evidence.

## Step 8 — Smoke test

```bash
curl -s https://<api-host>/health
curl -s "https://<api-host>/search?q=licence"
curl -s https://<api-host>/services/driving-licence
curl -s https://<api-host>/datasets
```

- `health` should report `"database": "up"`.
- The service page should show both the official block and the citizen block.
- `/datasets` should list the CSV and JSON exports.
- Log in: `curl -s -X POST https://<api-host>/admin/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@rishwat.fyi","password":"<password>"}'` → returns `{ token, user }`.
- Submit a test report and upload a small evidence file; confirm the evidence row's `retention_until` is ≈ `now + 90 days` and the object lands in the private `evidence` bucket.

## Local vs production parity

The parity guarantee is structural, not aspirational:

- **One Drizzle schema** — `packages/database/src/schema/` is identical everywhere; `docker-compose.yml` and Supabase both provide Postgres + PostGIS.
- **One migration path** — the same generated SQL migrations run on Docker and on Supabase.
- **Connection-string swap only** — switching `DATABASE_URL` from `localhost:5434` to the pooler is the entire database change.
- **Storage adapter swap only** — `EVIDENCE_STORAGE_DRIVER=local` ↔ `supabase`; both implement the same `EvidenceStorage` interface, and no "fake" third implementation exists.
- **One auth stack** — moderator auth (bcrypt + JWT) runs on plain Postgres tables on Supabase; it does not use Supabase Auth, so there is nothing environment-specific about it.

If a change works on the Docker PostGIS container and passes `npm test`, it runs unchanged in production. That is what makes the deployment documented here a small, mechanical step rather than a re-platforming project.

## Security checklist

- `SUPABASE_SERVICE_ROLE_KEY` lives only in server-side environment variables; never ship it to a browser or client bundle.
- The `evidence` bucket is private; signed URLs are short-lived and issued by the API only for the file's owner flow.
- `JWT_SECRET` is a fresh long random value per environment.
- `ADMIN_EMAIL`/`ADMIN_PASSWORD` are consumed once by `create-admin`; keep them out of logs.
- Restrict the pooler/database connection to the API host's egress where your platform supports it (Supabase supports network restrictions per project).