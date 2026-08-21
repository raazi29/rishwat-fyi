# Security Policy

Rishwat.fyi holds anonymous citizen reports about government services in India. A vulnerability here is not only a technical defect: a flaw that deanonymizes a reporter, leaks personal information, or lets someone manufacture a published statistic can cause real harm to real people and can discredit the dataset the project exists to produce.

Please report security issues privately, using the process below.

## What is *not* a security issue

**Reports about a government service — an unofficial payment that was requested, a delay, repeat visits — are the platform's subject matter, not vulnerabilities.** Do not file them here and do not email them to the security contact. Submit them through the normal reporting flow on the site (`/report`), which is built to strip and hash the identifying data that a GitHub issue or an email would permanently expose.

Likewise, out of scope for this policy:

- Disagreement with a published figure, an official fee, or a timeline. Open a **Government-source correction** issue instead.
- Disagreement with the methodology or the publishing threshold. See [`docs/methodology.md`](docs/methodology.md) and open a normal issue.
- A moderation decision you disagree with. See [`docs/moderation.md`](docs/moderation.md) for the escalation path.
- Findings that require an attacker to already hold moderator or admin credentials, unless the finding is that those credentials can be obtained.
- Volumetric denial of service, missing security headers with no demonstrated impact, and scanner output without a working proof of concept.

## Supported versions

The project is pre-release. There are no tagged releases yet, and there is no long-term support branch.

| Version | Supported |
| --- | --- |
| `main` (latest commit) | Yes — security fixes land here |
| Any fork, mirror, or older checkout | No — rebase onto `main` |

Public mirrors of the **dataset** (see [`docs/mirroring.md`](docs/mirroring.md)) are unaffected by code vulnerabilities, but a mirror running its own copy of the API is responsible for tracking `main`.

## How to report

**Preferred: GitHub private vulnerability reporting.** Open a draft security advisory from the repository's **Security** tab → *Report a vulnerability*. This keeps the report private, threads the discussion, and requires no additional infrastructure on our side.

> `<PLACEHOLDER: repository URL — https://github.com/<org>/<repo>/security/advisories/new>`

**Alternative: email.** If private reporting is unavailable to you, or the issue concerns GitHub itself:

> `<PLACEHOLDER: security contact address — maintainers must fill this in before public launch>`

Do not open a public issue, pull request, or discussion for a security report. Do not post proof-of-concept details on social media before the coordination window below has closed.

### What to include

- What the issue is, and which component (`apps/api`, `apps/web`, `packages/database`, `packages/validation`, deployment configuration).
- Steps to reproduce, ideally against a local instance (`docs/contributing.md` has the setup).
- What an attacker gains — in particular, whether any real reporter's data could be exposed.
- Any log, request, or response you captured. **Redact it first.** If your proof of concept surfaced someone else's personal data, describe it rather than pasting it, and tell us what you captured so we can reason about exposure.

### Testing rules

Test against **your own local instance**. Do not test against the production site in a way that touches other people's data or their reports: no submitting fabricated reports at volume, no automated scanning of the live API, no attempts to access the moderation queue or admin endpoints in production, and no accessing, downloading, or retaining another person's data. If you believe you can only demonstrate an issue in production, describe it to us privately first and we will arrange a way to verify it.

## Response timeline

These are the targets, offered in good faith by a small volunteer maintainer group — not a contractual SLA.

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | 3 business days |
| Initial triage and severity assessment | 7 days |
| Fix or documented mitigation for a high-severity issue | 30 days |
| Fix for a lower-severity issue | Best effort, tracked in the advisory |

If you have not heard anything within 7 days, please follow up — treat silence as a delivery failure, not a refusal.

## Coordinated disclosure

- We ask for **90 days** from acknowledgement before public disclosure, or until a fix is released — whichever comes first.
- For an issue that is actively exposing reporter data, we will prioritise mitigation over a clean fix, and we may disclose sooner because affected people need to know.
- We will credit you in the advisory unless you ask us not to. Anonymous and pseudonymous credit are both fine.
- We do not run a paid bug bounty. There is no reward budget; this is a public-interest project (see [`docs/governance.md`](docs/governance.md) for the funding posture).

## Safe harbour

If you make a good-faith effort to follow this policy, we will treat your research as authorised: we will not pursue or support legal action against you, and if a third party does, we will make clear that your work was authorised under this policy.

Good faith means: you followed the testing rules above, you stopped as soon as you confirmed the issue, you did not access, retain, or disclose anyone else's data beyond the minimum needed to demonstrate the problem, you did not degrade the service for others, and you did not use the finding for extortion. This safe harbour is what we can offer as maintainers; it does not and cannot waive anyone else's rights, and it is not legal advice.

## High severity for this project

The threat model here is unusual, so ordinary severity intuitions do not transfer. The following are treated as **high severity** and are handled first, even when the ordinary CVSS-style score looks moderate.

### 1. Reporter deanonymization

Anything that links a published report back to the person who submitted it, or narrows the set of possible submitters.

Reporting is designed so that identity never enters the database. `POST /reports` (`apps/api/src/routes/reports.ts`) takes the client IP, the optional `x-device-fingerprint` header, and a generated one-time submission token, and persists **only** their `sha256` digests as `ip_hash`, `device_fingerprint_hash`, and `submission_token_hash`. The raw token is returned to the submitter once, at submission, and never stored. The schema has no raw IP, fingerprint, or token columns at all. Report this if you find:

- a path where a raw IP, device fingerprint, or submission token is stored, logged, or returned from any endpoint;
- a way to recover a submitter from a hash — including hash-reversal made practical by the input space, or correlation of `ip_hash` values across cells;
- a way to enumerate submission tokens or to read another reporter's status via `GET /reports/:publicId/status` (that endpoint returns 404 rather than 403 on a token mismatch, deliberately, so report anything that leaks existence);
- timing, error-message, or ordering differences that distinguish "no such report" from "wrong token";
- any correlation between a public report and a submitter that the aggregate pipeline was supposed to break.

### 2. Personal information leaking through evidence or descriptions

Free-text descriptions pass through a deterministic redaction pipeline (`apps/api/src/utils/redaction.ts`) that removes Aadhaar numbers, Indian mobile numbers, email addresses, and 16-digit card numbers, both at ingestion and again at export. Evidence files are uploaded to a private bucket, held for 90 days, and purged from storage and metadata together (see [`docs/privacy.md`](docs/privacy.md)). Report this if you find:

- an input that defeats the redaction patterns — encodings, separators, spacing, or Unicode forms that carry a real identifier through to a public response or a dataset export;
- any public path that returns unredacted text, including caches, error messages, search results, or a dataset export column;
- evidence files reachable without authorisation, guessable object keys, an evidence path that bypasses the private bucket, or files that survive the retention purge;
- a way to make the API store or emit an item from the do-not-publish list in [`docs/privacy.md`](docs/privacy.md).

Note that redaction is a safety net, not a guarantee: descriptions may still contain identifying detail no regular expression can catch. A *pattern* that reliably extracts such detail at scale is in scope.

### 3. Forging or manipulating published aggregates

The published numbers are the product. A statistic for a (service, district) cell is only published when the verified report set contains at least 3 reports drawn from at least 2 distinct IP-hash buckets; below that, every metric is suppressed and returned as `null` with `published: false` (see [`docs/methodology.md`](docs/methodology.md)). Report this if you find:

- a way to make a cell publish below the minimum report count, or to bypass the distinct-IP-bucket requirement — for example by controlling the value that becomes `ip_hash`, via a spoofed `x-forwarded-for` chain or otherwise;
- a way to move a report up the status ladder without the moderation decision that ladder requires, or to skip a verification-event record;
- a way to change, delete, or inflate an aggregate, a dataset export, or an export manifest without an audit trail;
- a way to suppress a cell that should have published, which is censorship of the data in the other direction;
- any bypass of the anti-abuse and duplicate-detection paths that lets one actor manufacture apparently independent reports at scale.

### 4. Exposure of the moderation queue or admin surfaces

Moderators see unredacted material, abuse signals, and pending evidence. Everything under `/admin` (`apps/api/src/routes/admin/`) is therefore high value. Report this if you find:

- any unauthenticated or under-authenticated read of `/admin/queue`, moderation actions, verification events, evidence review, or admin statistics;
- JWT flaws — signature or algorithm confusion, missing expiry checks, role escalation from moderator to admin, token replay after a decision;
- a way to write to `moderation_actions` or `verification_events` without a real moderator decision, or to alter the log after the fact — the audit trail is a governance commitment, not a convenience;
- exposure of a moderator's identity, credentials, or session to a report subject or to the public;
- any path that discloses which reports are flagged, queued, or rejected, since that is itself sensitive.

### Also treated as serious

Remote code execution, SQL injection (the codebase requires parameterized Drizzle `sql` template literals throughout), SSRF via a supplied source or evidence URL, authentication bypass, and secret exposure — a leaked `JWT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` compromises everything above at once.

## After a report

Fixes land on `main` with a test that reproduces the issue. Where an issue exposed reporter data, we will say so publicly in the advisory — describing what was exposed and for how long, without republishing the exposed data. Under-reporting an exposure would betray the same people the platform promises to protect.
