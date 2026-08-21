## What this changes

<!-- One or two sentences. What changed and why. Link the issue it closes. -->

## How it was tested

<!-- Commands you ran, tests you added, endpoints you exercised. -->

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes against the real Postgres test database (`TEST_DATABASE_URL`) — no mocks, no in-memory stand-ins
- [ ] No new personal data is collected or persisted: no Aadhaar, PAN, phone, name or address fields, and raw IP / device fingerprint / submission token are still stored only as `sha256` digests and never returned from any endpoint (plan §7, [`docs/privacy.md`](../docs/privacy.md))
- [ ] Free text that can reach a public response or a dataset export still passes through `apps/api/src/utils/redaction.ts`
- [ ] SQL is parameterized (Drizzle `sql` template literals) — no string interpolation of user input
- [ ] Money stays `numeric(12,2)` INR, never a float
- [ ] No file exceeds ~200 lines; no TODO stubs, mocks, or placeholder values
- [ ] **API change:** [`apps/api/src/openapi.ts`](../apps/api/src/openapi.ts) and [`docs/api.md`](../docs/api.md) match the routes in `apps/api/src/routes/`
- [ ] **Dataset or schema change:** [`docs/data-dictionary.md`](../docs/data-dictionary.md) and `data/schemas/` updated, and export columns still come from the explicit allowlist
- [ ] **Methodology or threshold change:** [`docs/methodology.md`](../docs/methodology.md) updated — including the publishing threshold, status ladder, aggregate definitions or abuse scoring, if touched
- [ ] **New or changed service data:** every official fee, timeline and document list has a real government source URL (plan §14), and the tests under `packages/database/test/` still assert the truth after `npm run db:seed`
- [ ] Nothing here names or targets an individual government employee ([`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md))
- [ ] No secrets, `.env` contents, or real `JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` values in the diff

<!-- If this PR fixes a security issue, do not describe the vulnerability here. See SECURITY.md. -->
