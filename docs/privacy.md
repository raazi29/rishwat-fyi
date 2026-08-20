# Privacy

Privacy is a foundational feature, not a legal afterthought (plan §19).

Rishwat.fyi's value comes from aggregate patterns — what citizens as a group experience — not from identifying any individual. The entire system is built around **minimal data collection**: the platform asks for the smallest amount of information that can still produce a meaningful statistic, and then protects even that.

## Minimal data collection

A report can be submitted without any identity at all. The platform **never requires**:

- Aadhaar
- PAN
- Phone number
- Any government ID
- Full name
- Personal address

The only data collected about a submitter is what is technically unavoidable for abuse control: an IP address, an optional device fingerprint header, and a one-time submission token. All three are transformed before they touch the database (below), and the default posture remains minimal data collection throughout.

## Hashing — never store raw identifiers

Raw identifiers are never stored and never returned from any API. Instead:

- **IP address** → `sha256` hex digest (`ip_hash`)
- **Device fingerprint** → `sha256` hex digest (`device_fingerprint_hash`)
- **Submission token** → `sha256` hex digest (`submission_token_hash`)

The raw submission token is shown to the reporter exactly once, at submission time, so they can later check their report's status — only its digest is persisted. The hashing lives in `apps/api/src/utils/hashing.ts` (`sha256Hex`, `randomToken`, `publicReportId`), and the database schema has no raw IP, fingerprint, or token columns at all. Because the digests are one-way and unsalted per-entity, they can only be used for the duplicate/abuse signals described in [Methodology](methodology.md) — they cannot be reversed into a person.

## Evidence retention — 90 days

Evidence files (supporting documents) are retained for a fixed, short window:

> `retention_until = now + 90 days`

Every evidence row carries a `retention_until` timestamp; files are deleted automatically after it expires, from both the storage backend and the metadata table. There is no indefinite evidence hoarding. Objects are stored in a private storage bucket (see [Supabase Deployment](supabase-deployment.md) for the production configuration) and never exposed through public endpoints.

## The redaction pipeline

Evidence and descriptions may contain personal identifiers even when a reporter did not intend to share them. A deterministic redaction pipeline (`apps/api/src/utils/redaction.ts`) scans all free-text before it can appear publicly or in exports, replacing:

- **Aadhaar numbers** (12 digits)
- **Indian mobile numbers** (10 digits, optionally with `+91`)
- **Email addresses**
- **16-digit card numbers**

…with `[REDACTED]`. The pipeline is deterministic and order-sensitive (email patterns before phone patterns), and it runs both at ingestion and again at dataset export, so redaction holds even for material that enters through other paths.

## The do-not-publish list

The following are never published, in any dataset, API response, or statistic:

- Phone numbers
- Aadhaar numbers
- PAN
- Exact home addresses
- Personal email addresses
- Faces (in evidence)
- Personal documents containing sensitive information
- Names of alleged individuals, by default

Dataset exports are constructed from an explicit allowlist of columns and structurally cannot include IP hashes, device hashes, submission token hashes, or office identifiers — see [Mirroring](mirroring.md) and the data dictionary.

## Correction process

Privacy extends to people who appear in a report — including the reporter. The correction process:

1. **Withdrawal:** a reporter who holds their submission token can request withdrawal of their report. The status moves to `withdrawn` (terminal), and the report is excluded from all statistics and exports.
2. **Correction of published data:** if a published figure is shown to be wrong — including because a report contained information that should have been redacted — the correction is made and recorded as a moderation action, so the change is visible in the audit trail rather than silent. See [Moderation](moderation.md).
3. **No pay-to-remove:** there is no paid removal path. Removal happens only through the processes in this document and in Moderation. See [Governance](governance.md) for the funding philosophy that makes this enforceable.

The privacy posture is not a settings screen; it is the shape of the database, the export pipeline, and the moderation rules. That is what makes it survivable — if the original team disappears, the data and the code that produced it preserve the same guarantees.