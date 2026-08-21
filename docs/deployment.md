# Deployment

Rishwat.fyi runs as two deployables plus a managed database:

| Piece | Where | Config |
| --- | --- | --- |
| `apps/web` — the public site and admin UI | Vercel | [`vercel.json`](../vercel.json) |
| `apps/api` — the Hono API | Railway | [`railway.json`](../railway.json), [`apps/api/Dockerfile`](../apps/api/Dockerfile) |
| PostgreSQL + PostGIS | Supabase | [`supabase-deployment.md`](supabase-deployment.md) |

Nothing here is load-bearing for the project's independence guarantees. The
platform is designed to be mirrored (see [`mirroring.md`](mirroring.md)) — these
are simply the hosts the primary instance uses.

Deploy in this order: **database → API → web.** The web app builds without the
API, but it cannot show real data until the API is live, and the API cannot boot
without the database.

---

## 1. Database (Supabase)

Follow [`supabase-deployment.md`](supabase-deployment.md) in full. It covers
creating the project, enabling the `postgis`, `pg_trgm` and `citext` extensions,
applying migrations, and creating the private evidence storage bucket.

You need two values from it before continuing:

- the pooled connection string (`DATABASE_URL`)
- the service-role key (`SUPABASE_SERVICE_ROLE_KEY`)

The service-role key bypasses row-level security. It belongs only in the API's
server-side environment — never in `apps/web`, never in anything prefixed
`NEXT_PUBLIC_`.

---

## 2. API (Railway)

`railway.json` builds `apps/api/Dockerfile` with the **repository root** as the
build context — the API depends on the `@rishwat/database` and
`@rishwat/validation` workspaces, so the image has to reproduce the monorepo
layout. Railway reads this automatically.

Health checks hit `GET /health`, which reports database and storage
reachability and returns `503` when the database is down.

### Environment variables

Set these in the Railway service. The authoritative list, with the full
explanation of each, is [`.env.example`](../.env.example).

| Variable | Value in production | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Supabase pooled connection string | Required |
| `JWT_SECRET` | 32+ random characters | Required. The API **refuses to boot** on a short or placeholder secret. Generate with `openssl rand -base64 48` |
| `PUBLIC_BASE_URL` | `https://api.rishwat.fyi` | Used in dataset download links |
| `EVIDENCE_STORAGE_DRIVER` | `supabase` | Container filesystems are ephemeral — do not use `local` in production |
| `SUPABASE_URL` | Your project URL | Required when driver is `supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key | Required when driver is `supabase`. Secret |
| `SUPABASE_STORAGE_BUCKET` | `evidence` | Must be a **private** bucket |
| `TRUSTED_PROXY_HOPS` | See below | Security-critical |
| `RATE_LIMIT_ENABLED` | `true` (or omit) | Never `false` in production |
| `ADMIN_CORS_ORIGINS` | Usually omit | Only if the admin UI is on a different origin |

`PORT` is injected by Railway; the server reads it and falls back to `8787`.

### `TRUSTED_PROXY_HOPS` — get this right

This decides whether `x-forwarded-for` is believed. The resulting client IP
becomes the report's `ip_hash`, and `count(distinct ip_hash) >= 2` is the only
independence check gating auto-corroboration and public aggregate publication
(see [`methodology.md`](methodology.md)). It is also the rate-limit bucket key.

- `0` (default) — forwarding headers are ignored entirely; only the real socket
  peer counts.
- `1` — one proxy you operate in front of the API.
- `2` — two chained proxies, e.g. Cloudflare in front of a load balancer.

Set it to the number of proxies **you actually control**. Setting it higher lets
anyone forge their IP, manufacture a corroborated statistic, and bypass rate
limits. Setting it lower behind a real proxy buckets every visitor together and
makes rate limiting fire on innocent users.

Railway terminates TLS and proxies to the container, so `1` is the usual value
there. Verify after deploying rather than guessing: submit two reports from
different networks and confirm they produce different `ip_hash` values.

### After the first deploy

Run these once against the production database, from a machine with
`DATABASE_URL` set:

```bash
npm run db:migrate
npm run db:seed
npm run create-admin -w apps/api
```

`create-admin` reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and optionally
`ADMIN_NAME`. Use a real password — the script enforces a floor of 8 characters
but nothing stops you choosing something weak.

### Scheduled jobs

Three maintenance jobs exist. None of them run on their own — schedule them, or
they silently never happen:

| Job | Command | Also reachable as | Cadence |
| --- | --- | --- | --- |
| Purge expired evidence | `npm run purge-evidence -w apps/api` | `POST /admin/jobs/purge-evidence` | Daily |
| Recompute aggregates | `npm run recompute -w apps/api` | `POST /admin/jobs/recompute-aggregates` | Hourly |
| Auto-corroboration pass | — | `POST /admin/jobs/corroborate` | Hourly |

The evidence purge is the one with a public commitment attached:
[`privacy.md`](privacy.md) promises evidence is deleted 90 days after upload. If
this job is not scheduled, that promise is not kept.

---

## 3. Web (Vercel)

`vercel.json` installs from the workspace root and builds `apps/web`. Import the
repository into Vercel and leave the framework preset as Next.js.

### Environment variables

The authoritative list is [`apps/web/.env.example`](../apps/web/.env.example).

| Variable | Value in production | Notes |
| --- | --- | --- |
| `API_BASE_URL` | `https://api.rishwat.fyi` | Server-side calls |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.rishwat.fyi` | Browser-side status lookups |
| `NEXT_PUBLIC_SITE_URL` | `https://rishwat.fyi` | Canonical origin for metadata, sitemap and robots |
| `NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK` | `false` | See below |

Set `NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false` in production. Left at `true`, an
API outage causes the site to quietly render the bundled sample dataset instead
of an error. On a transparency project that publishes government fees, serving
invented figures during an outage is worse than serving nothing — even with the
sample-data strip visible.

Do **not** set it to `false` in CI, where the API is deliberately absent and the
fallback is what allows the build to complete.

### Connecting the two

The API's CORS policy already allows any origin on the public endpoints, so the
browser can call it directly. `/admin/*` sends no CORS headers unless
`ADMIN_CORS_ORIGINS` is set — which is correct here, because the admin UI is
served by `apps/web` and its API calls are made server-side.

---

## Verifying a deploy

```bash
curl https://api.rishwat.fyi/health
curl https://api.rishwat.fyi/datasets
curl -s https://rishwat.fyi/robots.txt
```

Then check by hand:

1. A service page shows official figures **with** a government source, and no
   sample-data strip.
2. The report wizard completes end to end and returns a report ID and one-time
   token, and that token works at `/report/status`.
3. `/admin` requires a login and rejects a bad password.
4. An aggregate below the publishing threshold shows the "not enough reports"
   notice rather than a number.

Item 4 is the one worth being fussy about. Publishing a statistic that should
have been suppressed is the failure mode this project can least afford.

---

## Rollback

Both hosts keep previous deployments — roll back from the Railway or Vercel
dashboard. Database migrations are **not** automatically reversible: review
`packages/database/drizzle/` before applying anything destructive, and take a
Supabase backup first.
