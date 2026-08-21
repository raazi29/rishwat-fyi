# Contributing

Thank you for contributing to Rishwat.fyi. This is an open-source, citizen-powered transparency platform for India: it measures the gap between what a government service is officially supposed to cost/take/require and what citizens actually experience. The data and software are public infrastructure that must survive any single website — that only works if the contribution process is open, reviewable, and safe.

Before you start, read the core documents:

- [`docs/methodology.md`](methodology.md) — how reports become statistics, and the publishing thresholds
- [`docs/privacy.md`](privacy.md) — the PII rules every contribution must respect
- [`docs/moderation.md`](moderation.md) — how reports are reviewed
- [`docs/governance.md`](governance.md) — roles and independence
- [`docs/data-dictionary.md`](data-dictionary.md) — the public dataset contract

## Repository layout

```text
apps/api/             Hono API server (public + admin routes, storage adapters)
packages/database     Drizzle schema (domain-split), migrations, seed data
packages/validation   zod schemas shared by the API (and future frontend)
data/                 Open schemas (data/schemas/) and generated dataset exports
docs/                 All documentation
scripts/              Dev helpers (db-up, db-migrate, db-seed)
plan/                 Product vision (Rishwat.fyi.md) and implementation plans
```

The backend is a single npm-workspaces monorepo. The public API is the contract; nothing depends on frontend code.

## Prerequisites

- **Node.js ≥ 20** (the root `package.json` enforces this)
- **npm** (npm workspaces)
- **Docker** — for the local PostgreSQL + PostGIS dev/test database
- **Git**

You do not need a Supabase account for local development. Supabase is the production target, but the code runs identically on the Docker PostGIS database — only the connection string and storage driver change (see [`docs/supabase-deployment.md`](supabase-deployment.md)).

## Local development setup

```bash
git clone <repository-url>
cd rishwat-fyi
npm install

cp .env.example .env      # then set JWT_SECRET (and anything else marked change-me)

bash scripts/db-up.sh     # starts Docker PostGIS; creates dev + test databases
npm run db:migrate        # creates extensions, the search trigger, and migrations
npm run db:seed           # idempotent: real states/districts + 12 services
npm run dev               # API on http://localhost:8787 (PORT from .env)
```

Smoke-test that everything is up:

```bash
curl -s localhost:8787/health
curl -s "localhost:8787/search?q=licence"
curl -s localhost:8787/services/driving-licence
curl -s localhost:8787/datasets
```

### Environment variables

All configuration comes from the environment; the API fails fast on missing required keys. See `.env.example` for the full list with comments:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Dev/API database (Docker PostGIS locally) |
| `TEST_DATABASE_URL` | Test database used by the test suite |
| `PORT` | HTTP port for the API (default `8787`) |
| `JWT_SECRET` | HS256 secret for moderator/admin tokens (required, long, random) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials used by `npm run create-admin` |
| `EVIDENCE_STORAGE_DRIVER` | `local` (dev/test) or `supabase` (production) |
| `EVIDENCE_STORAGE_DIR` | Local evidence directory when driver is `local` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Supabase Storage config when driver is `supabase` |
| `PUBLIC_BASE_URL` | Public base URL used for links in API responses |

Never commit `.env` (it is gitignored) and never put a real `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` in code or in a PR.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API in watch mode |
| `npm test` | Run all workspace tests (vitest) |
| `npm run typecheck` | Type-check every workspace |
| `npm run db:up` | Start Docker PostGIS (`bash scripts/db-up.sh`) |
| `npm run db:migrate` | Apply extensions + migrations |
| `npm run db:seed` | Upsert seed data (idempotent) |
| `npm run create-admin` | Create/update the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |
| `npm run generate -w packages/database` | Generate migration SQL from the Drizzle schema |
| `npm run export -w apps/api` | Write dataset exports + manifest to `data/exports/` |

## Test workflow

Tests run against a **real Postgres test database** (`TEST_DATABASE_URL`, default `rishwat_test`, created by `scripts/db-up.sh`). There are no mocks, no in-memory stand-ins — tests assert against real schema, real seed data, and the real filesystem storage adapter.

```bash
bash scripts/db-up.sh                # ensure Docker DB is running
npm run db:migrate                   # schema must exist in the test DB
npm run test                         # all workspaces
```

Run a single workspace when iterating:

```bash
npm run test -w packages/validation
npm run test -w packages/database
npm run test -w apps/api
```

Run a single test file:

```bash
npx vitest run apps/api/test/reports.test.ts
```

CI (`.github/workflows/ci.yml`) does the same thing on a PostGIS service container: `npm ci`, `npm run typecheck`, `npm test` with `TEST_DATABASE_URL` pointing at the container DB. If it's green locally, it is green in CI.

## Code conventions

These are enforced by review and by the ~200-line file cap. Respect them in every PR:

- **No monolith files.** Every source file stays under ~200 lines. Schema files are split by domain (`geo`, `catalog`, `reports`, `trust`, `aggregates`, `auth`), seed files by region/domain, and there is one route file and one service file per domain.
- **No mocks, no hardcodes, no placeholders.** No `TBD`, no TODO stubs, no in-memory stand-ins. Everything real.
- **Parameterized SQL only.** User input is never string-interpolated into SQL — use Drizzle `sql` template literals.
- **Money is `numeric(12,2)` INR, never floats.** Validation constrains values to `0..10_000_000`, multiple of `0.01`.
- **PII rule.** Never store raw IP, device fingerprint, or submission token — store only `sha256` hex digests. Never return them from any API. Never add raw-identifier columns.
- **Enums match exactly.** `report_status` = `submitted | validated | corroborated | evidence_backed | officially_acknowledged | rejected | withdrawn`. The zod schema mirrors the Postgres enum.
- **Errors** use `AppError(status, code, message)` and serialize as `{ "error": { "code", "message" } }`.

## Adding a new service

Services are catalogued in seed data together with their **real** official figures and **real government source URLs**. This is one of the most important parts of the project: a fee or timeline shown on a service page must have a source (see plan §14). Never invent figures.

### 1. Pick the right seed file

Service seeds live in `packages/database/src/seed/services/`, split by domain. Add the new service to the matching domain file (create a new file in that folder if none fits, and register it in `services/index.ts`):

| Domain file | Services |
| --- | --- |
| `transport.ts` | driving-licence, vehicle-registration |
| `land.ts` | land-registration, property-mutation, building-permit |
| `police.ts` | police-verification |
| `municipal.ts` | trade-licence, birth-certificate, death-certificate |
| `revenue.ts` | ration-card |
| `commerce.ts` | gst-registration, passport |

The 12 launch services are already seeded; new services extend this set.

### 2. Define the service seed

Each `ServiceSeed` carries a `slug` (kebab-case, unique), `name`, `department` (via its `DepartmentSeed`), a `description`, and the official figures:

```ts
{
  slug: "police-clearance-certificate",
  name: "Police Clearance Certificate",
  department: "police",                    // slug of a DepartmentSeed in the same file
  description: "Character verification / police clearance for employment, immigration and other purposes. Fee figures shown are Uttar Pradesh figures.",
  official_fee_inr: "300.00",
  official_timeline_days: 10,
  official_visits: 2,
  official_documents: [
    { name: "Application form", required: true },
    { name: "Proof of identity", required: true },
  ],
  process_steps: [
    { order: 1, title: "Apply", description: "Submit the application online or at the police station." },
    { order: 2, title: "Verification", description: "Local police verify the applicant's record." },
  ],
  official_fee_source: {                    // SourceSeed — a real, citable government URL
    url: "https://<official-portal>/fee-schedule",
    title: "Fee schedule — <Department>",
    department: "Police Department",
    publication_date: "2024-01-01",
  },
}
```

### 3. Register the department

Every service references a department. If the department doesn't exist yet, add its `DepartmentSeed` (`slug`, `name`, `description`, `category`) to the same domain file; all `departmentSeeds` are combined in `services/index.ts`.

### 4. Source rules

- Every official number must have a government source: `url`, `title`, `department`, and `publication_date` where known.
- Use real portal URLs (e.g. `parivahan.gov.in`, `passportindia.gov.in`, `gst.gov.in`, state IGRS portals, municipal portals).
- Where a fee is state-specific, use Uttar Pradesh figures and **note it in the description**, as in the example above.
- The seed runner upserts sources by `url` (`onConflictDoNothing` + select fallback) and services by `slug`, so re-running `npm run db:seed` is safe and idempotent.

### 5. Run and verify

```bash
npm run db:seed
npm run test -w packages/database   # schema.test.ts asserts the seeded counts
```

If you add a service, update the `"has N services seeded"` assertion in
`packages/database/test/schema.test.ts` so the count stays truthful. Optionally add a search/service-route test in `apps/api/test/`.

### 6. Keep docs in sync

The seed data feeds search results and service pages. If a new service category affects the dataset or API surface, update the data dictionary and the OpenAPI spec accordingly (see `docs/data-dictionary.md` and `docs/api.md`).

## Reporting a bug or requesting a feature

- Open an issue with a clear title, the expected behaviour, and the actual behaviour (include the error `code`/`message` from an API response where relevant).
- For security issues (PII leaks, auth flaws, SSRF/SQLi vectors, bad redaction), report privately rather than in a public issue.

## Pull request process

1. **Work on a branch** off `main`, named for the change (e.g. `feat/add-police-clearance-service`).
2. **Keep the change small and focused.** One logical change per PR; the diff should be easy to review.
3. **Run the full gate before pushing:**
   ```bash
   npm run typecheck
   npm test
   ```
4. **Self-review your diff** for the conventions above: no PII, no raw identifiers, no TODO/mocks, parameterized SQL, no files past ~200 lines.
5. **Open the PR** describing what changed and why, and what was tested. CI runs typecheck + tests against a PostGIS container and must be green.
6. **Address review feedback.** Reviewers will check the same conventions plus accuracy of any seed data (real figures, real sources).

Maintainers merge after review. The controller or maintainer commits; contributors do not merge their own PRs.

## Licensing

Code and citizen-submitted data are licensed **separately** (plan §12):

- **Code:** MIT — see [`LICENSE`](../LICENSE).
- **Dataset exports:** CC BY 4.0, attribution required — see [`LICENSE-DATA`](../LICENSE-DATA).

By contributing, you agree to license your contributions on these terms: code contributions under MIT, and any data contributions under CC BY 4.0. Never contribute data that contains personal information about other people (see [`docs/privacy.md`](privacy.md) — the do-not-publish list applies to contributors too).