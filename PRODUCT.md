# Product

<!-- impeccable:product-schema 1 -->

Source of truth for this record: `plan/Rishwat.fyi.md`, `README.md`, `docs/*.md`, `packages/database/src/seed/**`, and the pinned design boards in `design_uiux/`. Facts below are drawn from those documents rather than a live interview; anything not stated there is marked **[open]** rather than invented.

## Platform

web

## Users

- **Citizen reporter** (primary). An ordinary Indian resident who just finished dealing with a government office — an RTO counter, a sub-registrar, a municipal ward office. Usually on a mid-range Android phone, often on a slow connection, frequently anxious about being identified. They arrive with a specific experience to describe and low tolerance for forms. They may abandon at any step; the flow must survive that.
- **Citizen researcher** (primary). Someone about to *start* a government process who wants to know what it actually costs and how long it actually takes in their district before they walk in. Phone or desktop. Wants an answer in one screen.
- **Journalist / researcher / civic analyst** (secondary). Wants the aggregate, the method behind it, and the raw dataset. Desktop, data-dense, will read the methodology and will check whether the numbers are defensible.
- **Moderator / data steward** (internal). Works the report queue, applies verification states, reviews evidence. Authenticated, task-focused, high volume.

## Product Purpose

Measure the gap between what a government service is *officially* supposed to cost, take, and require, and what citizens *actually* experience — then publish that gap as structured, anonymized, mirrorable public data.

Success is not traffic. Success is how much previously invisible government-service friction the public can now measure: services indexed, states covered, independent reports, corroboration rate, and the existence of independent mirrors of the dataset.

## Positioning

Existing grievance portals resolve **individual** complaints. Rishwat.fyi measures **systemic patterns** and does so as infrastructure rather than as a website: open schemas, a public API, periodic dataset snapshots, and documented methodology, so the data survives the interface.

The mechanism a neighbouring product cannot truthfully copy: every published number is paired — an official figure with a cited government source and a `last_verified` date, next to a citizen-reported median that only publishes once it clears a volume-and-independence threshold, carrying an explicit verification level. Neither side is presented as the other.

## Operating Context

- The core loop: **official procedure → citizen experience → structured report → verification → aggregate pattern → public data.**
- The geographic spine: India → State → District → City → Department → Office → Service.
- Verification ladder, in order: `submitted` → `validated` → `corroborated` → `evidence_backed` → `officially_acknowledged`, plus the terminal states `rejected` and `withdrawn`. This ladder is user-facing, not internal jargon.
- Publishing threshold: citizen aggregates publish only at **≥ 3 reports from ≥ 2 distinct IP-hash buckets** for the same (service, district) cell. Below that, `published: false` and every statistic is `null` while the raw report count still shows.
- Reporters are anonymous. On submission they receive a `public_id` (`R-xxxxxxxx`) and a one-time `submission_token`; only the token's SHA-256 digest is stored. Lose the token, lose status lookup — the UI must say so before it is issued.
- Evidence files are private, reviewed by a moderator, and auto-deleted 90 days after upload.
- Rate limits the interface must design for: report submission **3/hour per IP**, evidence upload **10/hour per IP**, public reads **60/minute per IP**.
- Money is handled as decimal strings (`"1000.00"`) end to end, never floats. Display currency is INR (₹).

## Capabilities and Constraints

- Frontend is a separate Next.js app (`apps/web`) against a frontend-agnostic Hono API (`apps/api`). The API contract is `docs/api.md` + `GET /doc/openapi.json`; the dataset contract is `docs/data-dictionary.md`.
- **The API is being built in parallel by other agents.** The frontend must render every route correctly when the API is absent, degraded, or partially implemented; it may never present fallback content as live data.
- Public surface: search, service pages, departments, states/districts, map, anonymous report flow, report status lookup, public report view, dataset/API/methodology documentation.
- Authenticated surface: moderator queue, report decisions, evidence review, admin statistics. JWT, 12-hour expiry, roles `moderator` and `admin`.
- Launch catalogue is real and already seeded: 8 departments and 12 high-friction services with official fees, timelines, document lists, process steps, and cited government source URLs (`packages/database/src/seed/services/**`), plus real Indian states, districts and cities (`packages/database/src/seed/locations/**`).
- Terminology that is fixed: *official* vs *citizen-reported* (never "real" vs "claimed"); *report* (never "complaint"); *additional amount reported* (never "bribe" as a data label); *friction*; *corroborated*.
- **[open]** Licence for code vs data is not finally selected (`plan` §12); the API currently advertises `CC BY 4.0 (data) / MIT (code)`. Treat as provisional and do not present as settled.
- **[open]** Legal/privacy review before public launch has not happened (`plan` §20).
- **[open]** Hindi and other Indian-language localisation is intended but not specified; do not ship copy that cannot be translated.

## Brand Commitments

- Name and wordmark: **Rishwat.fyi**, set in the display serif, `.fyi` never dropped.
- Standing line: *Government, as experienced by citizens.*
- Header descriptor: *Public data. Verified process. Powered by citizens.*
- Hero proposition, fixed by the plan (§15) and the design boards: **“What should government cost you?”** with the sub-line *“Search official fees and timelines. Compare them with what citizens actually experience.”* Primary action *Search a government service*, secondary action *Report anonymously*.
- The mandatory notice, verbatim wherever citizen aggregates appear: *“Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing.”*
- **The visual world is pinned** by `design_uiux/*.png` (6 boards: hero, all-sections, search results, service detail, report flow, submitted). These are the approved comps and the quality bar. `apps/web/DESIGN.md` records the system extracted from them.
- Voice: plain, measured, non-accusatory, second person. It states what was reported and who reported it, and lets the reader conclude. No outrage, no scare copy, no political framing.

## Evidence on Hand

- Real official service data with government source URLs — `packages/database/src/seed/services/{transport,land,municipal,police,revenue,commerce}.ts`, `sources.ts`.
- Real Indian geography — `packages/database/src/seed/locations/*.ts`.
- Published methodology, moderation workflow, privacy policy, governance model, data dictionary, mirroring guide, contribution guide — `docs/*.md`. These are real and may be quoted.
- Approved visual comps — `design_uiux/*.png`.
- **Absent, and must not be fabricated as live:** citizen report volumes, medians, distributions, per-state gap figures, contributor counts, corroboration rates. The design boards show illustrative values. Every such figure the frontend renders without an API must be visibly marked as sample data, and no route may imply a live count it did not receive from the API.
- **Absent:** any funder, partner, press mention, endorsement, or government acknowledgement. Do not invent one.

## Product Principles

1. **Official and citizen-reported never blur.** They are separate columns, separate colours, separately sourced, and separately labelled, on every surface including the smallest phone.
2. **A number arrives with its provenance.** Official figures carry a source and a verification date; citizen figures carry a report count, an independence count, and a verification level. A figure with neither does not ship.
3. **Anonymity is a designed experience, not a policy page.** The report flow proves it while the person is deciding whether to trust it — before the first field, not after submission.
4. **One dramatic report never becomes a statistic.** The publishing threshold is visible in the interface; below it, the UI says what is missing rather than showing a shaky median.
5. **The interface is replaceable; the data is not.** Every public view links to the dataset, the API, and the methodology behind the number on screen.
6. **Patterns, never people.** No names of officials, no personal identifiers, no accusation of an individual, anywhere in the product or its sample data.

## Accessibility & Inclusion

- Mobile-first: the primary reporter is on a phone, one-handed, possibly outside. Touch targets ≥ 44px, no hover-only affordances, no horizontal scroll at 320px.
- WCAG 2.1 AA: text contrast ≥ 4.5:1 (large ≥ 3:1), visible keyboard focus on every control, full keyboard operability of the report wizard and data tables.
- Data must be legible without colour alone: the official/reported distinction is carried by label and position as well as colour.
- Copy at a plain-language reading level; no bureaucratic or legal register in UI text. Translation-ready strings (no concatenated sentences).
- Low-bandwidth tolerance: server-rendered content, no blocking client-side data fetches for primary content, no heavy chart or map runtime.
