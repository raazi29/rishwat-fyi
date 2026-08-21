# Contributing to Rishwat.fyi

Rishwat.fyi measures the gap between what a government service is officially
supposed to cost, take, and require, and what citizens actually experience.
Contributions keep that measurement open, reviewable, and safe.

**The detailed guide lives in [`docs/contributing.md`](docs/contributing.md)** —
local setup, repository layout, environment variables, the test workflow, code
conventions, how to add a new government service, and the pull request process.
Read it before you open a PR. This page is the orientation.

## Get running

```bash
npm install
bash scripts/db-up.sh     # Docker PostGIS (dev + test databases)
npm run db:migrate
npm run db:seed
cp .env.example .env      # set JWT_SECRET and anything marked change-me
npm run dev               # API on http://localhost:8787
```

Before pushing:

```bash
npm run typecheck
npm test
```

## Four rules that come before everything else

1. **No new personal data.** Never store a raw IP, device fingerprint, or
   submission token — only `sha256` digests — and never add a column for
   Aadhaar, PAN, phone, name, or address. See [`docs/privacy.md`](docs/privacy.md).
2. **Every official figure needs a government source.** No fee, timeline, or
   document list ships without a real, citable government URL (plan §14).
3. **No naming individuals.** The platform publishes aggregate patterns, not
   accusations. See the addendum in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
4. **Keep the docs true.** If you change the API, the dataset shape, or a
   threshold, update [`docs/api.md`](docs/api.md),
   [`docs/data-dictionary.md`](docs/data-dictionary.md), or
   [`docs/methodology.md`](docs/methodology.md) in the same PR.

## Where to start

- **Found a bug, or an official fee shown on the site is wrong?** Open an issue —
  the templates will ask for what reviewers need.
- **Want a service or district added?** Use the *New service / data coverage*
  issue template, then see the "Adding a new service" section of
  [`docs/contributing.md`](docs/contributing.md).
- **Found a security or privacy flaw?** Do not open a public issue. Follow
  [`SECURITY.md`](SECURITY.md).
- **Want to report your own experience of a government service?** That is not a
  GitHub issue — use the site's `/report` flow, which is built to protect your
  identity.

## Background reading

| Document | What it covers |
| --- | --- |
| [`docs/methodology.md`](docs/methodology.md) | How reports become statistics, and the publishing thresholds |
| [`docs/moderation.md`](docs/moderation.md) | How reports are reviewed, logged, and escalated |
| [`docs/privacy.md`](docs/privacy.md) | Minimal collection, hashing, redaction, retention |
| [`docs/governance.md`](docs/governance.md) | Roles, independence, funding |
| [`docs/data-dictionary.md`](docs/data-dictionary.md) | The public dataset contract |

## Conduct and licensing

Participation is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), which
also defines what is out of scope for this project.

Code contributions are licensed **MIT** ([`LICENSE`](LICENSE)); data
contributions are licensed **CC BY 4.0** ([`LICENSE-DATA`](LICENSE-DATA)).
