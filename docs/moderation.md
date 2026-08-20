# Moderation

How reports move through the human review pipeline, how decisions are recorded, and how difficult cases are escalated.

Moderation is the layer that separates **allegation** from **verified fact**. No report becomes public data — or part of any published statistic — without passing through it. See [Methodology](methodology.md) for the status model this document operates on.

## The moderation queue

Moderators work from a queue. `GET /admin/queue` lists pending reports, oldest first, with:

- the report's service and district names,
- how many evidence files it has,
- its current status (filterable), and
- its abuse signals where present.

Reports enter the queue in status `submitted`. A report that fails verification — spam, fabricated, coordinated, or otherwise — is rejected; a report that passes basic quality and spam checks is validated.

## Decision actions

A moderator acts on a report via `POST /admin/reports/decide`. Each action is a legal state transition enforced by the verification state machine:

| Action | Target status | Notes |
| --- | --- | --- |
| `mark_validated` | `validated` | Basic spam/quality checks passed; transition method `moderator_review`. |
| `reject` | `rejected` | Terminal. Requires a reason. |
| `acknowledge_officially` | `officially_acknowledged` | Requires a `source_url` — a government authority or official source acknowledging the underlying issue. Rejected with a 400 if no source URL is supplied. |
| `withdraw` | `withdrawn` | Terminal. Removed at the reporter's request or by process. |

Every decision records a row in `moderation_actions` with the acting moderator's ID and the stated reason — there is no way to change a report's status silently. Illegal transitions (for example, rejecting an already-rejected report) return a 400.

## Evidence review

Evidence is reviewed separately from the report itself. Files are uploaded in status `pending_review` and held for a limited retention window (see [Privacy](privacy.md) for the 90-day rule).

`POST /admin/evidence/review` sets the evidence status:

- **`accepted`** — the file is genuine and relevant.
- **`rejected`** — the file is fabricated, irrelevant, or contains material that cannot be published.

The rule that turns evidence into trust:

> **Accepted evidence + a validated report → `evidence_backed`**

Evidence is only ever used to promote a report after a human has accepted it and the report itself is already validated. Evidence review is recorded in `verification_events` with method `evidence_review`, so the link between a file and the status it supported is always traceable.

## Moderation log transparency

Two tables carry the audit trail, and both are part of the public methodology contract:

- **`verification_events`** — every status transition, automated or human: who (if human), what method (`citizen_submission`, `moderator_review`, `auto_corroboration`, `evidence_review`, `auto_flag`, …), when, and from/to what status.
- **`moderation_actions`** — every moderator decision: which moderator, which report, which action, the reason, and the timestamp.

Together they mean the history behind any published number can be reconstructed. This is deliberate: moderation must itself be accountable, and it satisfies the plan's requirement to *maintain moderation logs* and *preserve evidence of moderation decisions* (plan §20).

## Escalation: difficult cases

When a case is genuinely hard — ambiguous evidence, borderline legality, conflicting reports, high-profile or sensitive subject matter — a single moderator should not be the last word. The escalation path is:

1. The case is flagged in the queue by any moderator; the initial moderator's decision and reasoning stay in the log.
2. It goes to **independent reviewers** — a standing, volunteer group separate from the technical maintainers and from any single government department or political party (plan §21).
3. The reviewers examine the report, its evidence, and its verification history, and return a recommendation. The decision (accept, reject, or hold) is recorded like any other `moderation_actions` row.

Independent reviewers exist specifically so governance does not depend on one person's judgment — and so the same independence extends to the hardest calls.

## Legal framing (plan §20)

Moderation operates inside a consistent legal posture:

1. **Separate allegation from verified fact.** A `submitted` or even `validated` report is an allegation; only evidence-backed and officially acknowledged statuses carry the weight of verification, and even those describe experiences, not findings of wrongdoing.
2. **Provide a clear correction process.** Reporters may correct or withdraw their own reports (`withdraw`), and any published figure that is shown to be wrong is corrected publicly — the correction is itself a moderation action, so the record shows what changed and why.
3. **Avoid publishing unnecessary personal data.** Nothing in the public view, dataset exports, or statistics may contain identifying information. The redaction pipeline and the do-not-publish list in [Privacy](privacy.md) are enforced at the point of ingestion and again at export.
4. **Maintain moderation logs** and **preserve evidence of moderation decisions** — the two tables above.
5. **Publish methodology** and **publish data-quality limitations** — this document and [Methodology](methodology.md).
6. **Avoid monetizing individual allegations** and **avoid pay-to-remove systems.** No one can pay to have a report removed or a statistic changed; the only removal paths are the process defined here. See [Governance](governance.md) for the funding philosophy that backs this rule.
7. **Keep governance independent** from individual political parties and government departments — including through the independent-reviewer escalation path above.