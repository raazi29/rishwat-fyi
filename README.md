# Rishwat.fyi

**Open government transparency infrastructure for India.**

Rishwat.fyi is an open-source, citizen-powered transparency platform for measuring the gap between what a government service is officially supposed to cost/take/require and what citizens actually experience. Unofficial payments, delays, unnecessary visits, and procedural friction become structured, anonymized public data.

> **Government, as experienced by citizens.**

## Stack

- **Web:** Next.js (App Router) + React + Tailwind CSS — the public site and the moderation admin
- **API:** Hono + TypeScript (dedicated API, frontend-agnostic)
- **Database:** PostgreSQL + PostGIS (Docker locally, Supabase managed in production)
- **ORM:** Drizzle ORM + postgres.js
- **Validation:** zod (shared `@rishwat/validation` package)
- **Tests:** vitest against a real Postgres test database (no mocks)

## Monorepo layout

```text
apps/web/          Next.js site — public explorer, report wizard, admin
apps/api/          Hono API server (public + admin routes)
packages/database  Drizzle schema (domain-split), migrations, seed
packages/validation  zod schemas shared by the API and the web app
data/              Open schemas, dataset exports
docs/              Methodology, moderation, privacy, governance, mirroring
scripts/           Dev helpers
```

## Quickstart

Start the database and API:

```bash
npm install
bash scripts/db-up.sh          # Docker PostGIS (dev DB + test DB)
npm run db:migrate             # extensions + migrations
npm run db:seed                # real India locations + 12 services
cp .env.example .env           # set JWT_SECRET (32+ chars) etc.
npm run dev                    # API on http://localhost:8787
```

Then, in a second terminal, start the site:

```bash
cp apps/web/.env.example apps/web/.env.local
npm run dev:web                # web on http://localhost:3000
```

The web app talks to the API over HTTP only. If the API is not running it falls
back to a bundled sample dataset and labels every affected page as sample data,
so the site still builds and renders on its own.

## Tests

```bash
npm test
```

Requires the Docker DB running and `TEST_DATABASE_URL` set (see `.env.example`).

## Deployment

The web app deploys to Vercel and the API to Railway. See
[`docs/deployment.md`](docs/deployment.md) for the runbook, and
[`docs/supabase-deployment.md`](docs/supabase-deployment.md) for the managed
database — same schema and code, only the connection string and storage driver
change.

## Contributing

Start with [`CONTRIBUTING.md`](CONTRIBUTING.md). Security issues go through
[`SECURITY.md`](SECURITY.md), never a public issue.

## Documentation

- [`docs/methodology.md`](docs/methodology.md) — how stats are computed, publishing thresholds
- [`docs/moderation.md`](docs/moderation.md) — report review workflow
- [`docs/privacy.md`](docs/privacy.md) — minimal data collection, hashing, redaction
- [`docs/governance.md`](docs/governance.md) — governance and funding principles
- [`docs/data-dictionary.md`](docs/data-dictionary.md) — public dataset columns
- [`docs/api.md`](docs/api.md) — API reference
- [`docs/mirroring.md`](docs/mirroring.md) — how to mirror the dataset

## License

Code and data are licensed separately:

- **Code:** MIT — see [`LICENSE`](LICENSE).
- **Data (published dataset exports and snapshots):** CC BY 4.0 — see [`LICENSE-DATA`](LICENSE-DATA). Attribution: *"Data from Rishwat.fyi, licensed CC BY 4.0"*.

## Mission

> **Make government-service friction measurable, verifiable and impossible to quietly erase.**

The website is only the interface. The data is the infrastructure.