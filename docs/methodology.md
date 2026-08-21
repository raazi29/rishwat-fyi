# Methodology

How Rishwat.fyi turns anonymous citizen reports into public statistics — and what it refuses to claim.

Rishwat.fyi measures the gap between how a government service is **officially** supposed to work and how citizens **actually experience** it. That measurement only means something if the method behind it is published, repeatable, and honest about its limits. This document is that method. See also the data limitations section at the end.

The core loop (plan §2):

> **Official procedure → Citizen experience → Structured report → Verification → Aggregate pattern → Public data**

Each stage feeds the next. A citizen's experience becomes a structured report; the report is verified; verified reports accumulate into aggregate patterns; only those patterns — never individual reports — become public statistics.

## Report status ladder (plan §8)

Every report carries a status. A report does not become a "fact" by being submitted. It climbs a ladder as independent evidence accumulates:

| Status | Meaning |
| --- | --- |
| `submitted` | Raw citizen submission, pending basic checks. |
| `validated` | Basic spam/quality checks passed. |
| `corroborated` | Similar independent reports support the same pattern. |
| `evidence_backed` | Supporting documentation has been reviewed and accepted. |
| `officially_acknowledged` | A government authority or official source acknowledges the underlying issue. |
| `rejected` | Failed moderation (terminal — reached from any non-terminal state). |
| `withdrawn` | Removed at the reporter's request or by process (terminal). |

The valid forward transitions are:

```
submitted → validated → corroborated → evidence_backed → officially_acknowledged
```

`rejected` and `withdrawn` are **terminal** states — they can be reached from any non-terminal state but nothing moves out of them. Transitions are enforced by the verification service and every transition is recorded in `verification_events`, so the provenance of a report's status is always auditable.

- **`corroborated`** is normally reached automatically: a `validated` report with ≥ 2 other independent reports (distinct IP hashes) for the same service and district within the last 180 days is corroborated via `auto_corroboration`.
- **`evidence_backed`** requires a human decision: accepted evidence *plus* a validated report.
- **`officially_acknowledged`** requires a moderator decision backed by a government source URL.

## Publishing threshold (plan §8, §9)

The single most important rule:

> **One dramatic report should never determine a public statistic.**

A statistic for a (service, district) cell is published **only when** the source report set — reports with status IN `validated`, `corroborated`, `evidence_backed`, `officially_acknowledged` — contains:

- **≥ 3 reports**, and
- reports from **≥ 2 distinct IP-hash buckets** (independent reporters), and
- all within the **same (service, district)** cell.

If either condition is not met, the published statistic for that cell is `null`. The raw report count is still returned with `published: false`, so the public can see *how much (or how little) data exists* behind a "no signal" result. The IP-bucket requirement exists precisely so one person, one office, or one coordinated group cannot manufacture a statistic on their own.

## Aggregate definitions (plan §18)

Within a publishable cell, aggregates are computed over the publishable report set:

- **Median extra payment** — `percentile_cont(0.5)` of `additional_amount_reported_inr` (the amount reportedly requested on top of the official fee). A median, not a mean, so a single extreme claim cannot skew the number.
- **Median delay** — `percentile_cont(0.5)` of `delay_days`.
- **Average visits** — `avg(visits)` across reports.
- **Corroboration rate** — the fraction of reports in the cell at `corroborated`, `evidence_backed`, or `officially_acknowledged`, used as a reliability measure alongside the report count.
- **Verification rate / evidence-backed rate / report freshness** — tracked as reliability metrics (§18), reported where the dataset supports them.

All money is stored and computed as `numeric(12,2)` INR — never floats.

### Derived issue signals

Beyond the headline numbers, each service page reports **common friction points** derived from report descriptions. Descriptions in the cell are scanned for five canonical issue keywords:

`multiple_visits`, `unclear_process`, `additional_payment_requested`, `document_requests_repeated`, `office_staff_unhelpful`

The top keywords by count are shown — derived from real descriptions, not seeded or random.

## Anti-abuse (plan §9)

Rishwat.fyi will inevitably attract fake reports, political manipulation, coordinated attacks, duplicate submissions, personal disputes, and fabricated evidence. Anti-abuse is therefore a first-class system, not a bolt-on:

- **Rate limiting** — strict per-IP limits on report submission, evidence upload, and admin login.
- **Duplicate detection** — text similarity (`similarity() >= 0.75` within 90 days for the same service + district) links near-identical submissions into `duplicate_group_id`s.
- **IP/device abuse signals** — hashed IP and device-fingerprint counts; repeated submissions from the same source within 24h add to an abuse score.
- **Text similarity** — used both for duplicate grouping and coordinated-burst detection.
- **Suspicious geographic / coordinated clusters** — ≥ 3 reports for the same service + district with similarity ≥ 0.5 within 1 hour, or ≥ 5 reports from one IP-hash bucket in a window, trigger cluster flags.
- **Human moderation** — every automated signal ends in a human decision; flagged reports stay in the queue for a moderator.

Reports accumulate an **abuse score** (capped at 100): duplicate-of-existing +40, same IP > 5 reports in 24h +30, same device fingerprint > 5 reports in 24h +20, coordinated burst +50. A score ≥ 70 keeps the report at `submitted` and records an `auto_flag` verification event (`suspected_coordinated`); a moderator decides. A high score never quietly deletes a report — it surfaces it for review.

The consequence of all this: **published statistics are built only from reports that survived verification and represent independent sources** — which is what makes them defensible.

## Data limitations statement

Public data carries explicit limitations. A slightly adapted version of the notice shown on every service page applies to every statistic and dataset:

> Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing.

In addition:

- Aggregates reflect **what was reported**, not a census of all experiences with a service. Non-response and access bias mean the true distribution may differ.
- Only reports that passed verification and met the publishing threshold appear in public statistics; below-threshold cells are `null` by design.
- Reported amounts, delays, and visits are **unverified claims** unless the report is `evidence_backed` or `officially_acknowledged` — and even then they describe individual experiences, not legal findings.
- Aggregates are specific to the (service, district) cell they describe; they must not be read as statements about a department, an office, or any individual.
- We do not name or accuse individuals. The platform measures patterns and experiences, not guilt (plan §5).

## Verification

- **License:** Dataset exports are licensed **CC BY 4.0** (see [`LICENSE-DATA`](../LICENSE-DATA)); code is **MIT** (see [`LICENSE`](../LICENSE)). Individual files carry their own attribution.
- **Reproducibility:** this methodology, the data dictionary (`docs/data-dictionary.md`), the schemas in `data/schemas/`, and the export scripts are all open source and version-controlled, so anyone can recompute published figures.
- **Auditability:** every status change is recorded in `verification_events` and every moderator decision in `moderation_actions` (see [Moderation](moderation.md)); the history behind any published number can be traced.