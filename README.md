# Rishwat.fyi

**Open government transparency infrastructure for India.**

Rishwat.fyi is an open-source, citizen-powered transparency platform for measuring the gap between what a government service is officially supposed to cost/take/require and what citizens actually experience. Unofficial payments, delays, unnecessary visits, and procedural friction become structured, anonymized public data.

> **Government, as experienced by citizens.**

## Stack

- **API:** Hono + TypeScript (dedicated API, frontend-agnostic)
- **Database:** PostgreSQL + PostGIS (Docker locally, Supabase managed in production)
- **ORM:** Drizzle ORM + postgres.js
- **Validation:** zod (shared `@rishwat/validation` package)
- **Tests:** vitest against a real Postgres test database (no mocks)

## Monorepo layout

```text
apps/api/          Hono API server (public + admin routes)
packages/database  Drizzle schema (domain-split), migrations, seed
packages/validation  zod schemas shared by API and future frontend
data/              Open schemas, dataset exports
docs/              Methodology, moderation, privacy, governance, mirroring
scripts/           Dev helpers
```

## Quickstart

```bash
npm install
bash scripts/db-up.sh          # Docker PostGIS (dev DB + test DB)
npm run db:migrate             # extensions + migrations
npm run db:seed                # real India locations + 12 services
cp .env.example .env           # set JWT_SECRET etc.
npm run dev                    # API on http://localhost:8787
```

## Tests

```bash
npm test
```

Requires the Docker DB running and `TEST_DATABASE_URL` set (see `.env.example`).

## Production (Supabase)

See [`docs/supabase-deployment.md`](docs/supabase-deployment.md). Same schema and code — only the connection string and storage driver change.

## Documentation

- [`docs/methodology.md`](docs/methodology.md) — how stats are computed, publishing thresholds
- [`docs/moderation.md`](docs/moderation.md) — report review workflow
- [`docs/privacy.md`](docs/privacy.md) — minimal data collection, hashing, redaction
- [`docs/governance.md`](docs/governance.md) — governance and funding principles
- [`docs/data-dictionary.md`](docs/data-dictionary.md) — public dataset columns
- [`docs/api.md`](docs/api.md) — API reference
- [`docs/mirroring.md`](docs/mirroring.md) — how to mirror the dataset

## Mission

> **Make government-service friction measurable, verifiable and impossible to quietly erase.**

The website is only the interface. The data is the infrastructure.