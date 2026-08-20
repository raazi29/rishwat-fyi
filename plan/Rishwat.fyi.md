# Rishwat.fyi
## Open Government Transparency Infrastructure for India

> **Government, as experienced by citizens.**

---

# 1. Executive Summary

**Rishwat.fyi** is an open-source, citizen-powered transparency platform for measuring the gap between:

- what a government service is officially supposed to cost,
- how long it is officially supposed to take,
- what documents are officially required,
- and what citizens actually experience.

Unofficial payments, delays, unnecessary visits, missing information, procedural friction and other recurring patterns become structured, anonymized public data.

The goal is not to create a website that simply says **"this department takes bribes."**

The goal is to build an **independent public data layer for government-service experiences in India.**

If the website disappears, the data and software should remain independently mirrorable.

---

# 2. The Core Thesis

India has enormous amounts of government-service information, but it is fragmented across departments, portals, PDFs, circulars and local offices.

Citizens often know a different reality:

> "The official fee is ₹X. The official timeline is Y days. But everyone knows what actually happens."

That gap is rarely measured systematically.

Rishwat.fyi attempts to make that gap visible.

### The core loop

**Official procedure → Citizen experience → Structured report → Verification → Aggregate pattern → Public data**

---

# 3. Problem Statement

Citizens interacting with government systems commonly face:

1. Unclear official fees
2. Unclear procedures
3. Repeated office visits
4. Delays
5. Information asymmetry
6. Middlemen
7. Unofficial payment requests
8. Inconsistent enforcement
9. State/district-level differences
10. Lack of reliable aggregate evidence

Existing complaint systems are generally designed to resolve individual grievances.

Rishwat.fyi is designed to **measure systemic patterns.**

---

# 4. Product Vision

Rishwat.fyi should become the public equivalent of a transparency observatory.

A citizen should be able to search:

> **"Driving licence — Varanasi"**

and see:

### Official

- Official fee
- Official timeline
- Required documents
- Official process
- Government source

### Citizen experience

- Number of reports
- Typical timeline
- Additional money reportedly requested
- Number of visits
- Common friction points
- Geographic patterns
- Verification status

The platform should clearly distinguish **official information** from **citizen reports**.

---

# 5. What Rishwat.fyi Is NOT

Rishwat.fyi is not:

- a blacklist of government employees
- an accusation engine
- a platform for naming/shaming individuals
- a replacement for government grievance systems
- a political propaganda platform
- a place to publish personal information
- a marketplace for bribes
- a system that automatically declares allegations to be facts

The platform measures **patterns and experiences**, not guilt.

---

# 6. MVP

## Phase 1 — Public Explorer

### Search

Users can search:

- Department
- Service
- State
- District
- City
- Office

Example:

> GST Registration → Uttar Pradesh → Varanasi

### Service page

Every service page contains:

**Official**

- Fee
- Timeline
- Documents
- Procedure
- Source

**Citizen-reported**

- Reports
- Median extra payment
- Median delay
- Number of visits
- Common issues
- Verification level

---

# 7. Anonymous Reporting

A citizen can submit:

- Department
- Service
- State
- District/city
- Date/time period
- Official fee
- Amount additionally requested
- Amount paid
- Delay
- Number of visits
- Description
- Optional evidence

### Never require

- Aadhaar
- PAN
- Phone number
- Government ID
- Full name
- Personal address

The default should be **minimal data collection.**

---

# 8. Verification System

Not every report should immediately become a "fact."

Every report gets a status.

### Status levels

**Submitted**

Raw citizen submission.

**Validated**

Basic spam/quality checks passed.

**Corroborated**

Similar independent reports support the same pattern.

**Evidence-backed**

Supporting documentation has been reviewed.

**Officially acknowledged**

A government authority or official source acknowledges the underlying issue.

This distinction is critical.

---

# 9. Anti-Abuse System

Rishwat.fyi will inevitably attract:

- fake reports
- political manipulation
- coordinated attacks
- duplicate submissions
- personal disputes
- fabricated evidence

Therefore:

### Detection

- Rate limiting
- Duplicate detection
- IP/device abuse signals
- Text similarity
- Suspicious geographic clusters
- Coordinated submission detection
- Human moderation

### Principle

**One dramatic report should never determine a public statistic.**

Aggregates should require sufficient volume and confidence.

---

# 10. Data Model

Core entities:

```text
Department
Service
GovernmentSource
Location
Office
Report
Evidence
Verification
ModerationAction
AggregateMetric
UserContribution
```

Example report:

```json
{
  "service": "driving_licence",
  "department": "rto",
  "state": "uttar_pradesh",
  "district": "varanasi",
  "official_fee": 1000,
  "additional_amount_reported": 2000,
  "paid": true,
  "delay_days": 14,
  "visits": 3,
  "status": "validated"
}
```

---

# 11. Public Data Architecture

The most important architectural principle:

## The platform must not depend on one website.

The project should publish:

- Open schemas
- Public APIs
- Periodic dataset snapshots
- CSV/JSON exports
- Git repositories
- Documentation
- Database dumps where legally appropriate

This allows:

> Website A disappears → Mirror B continues → Dataset C survives → Fork D continues development.

---

# 12. Open Source Strategy

Repository:

```text
rishwat-fyi/
```

Suggested structure:

```text
/apps
  /web
  /admin

/packages
  /database
  /validation
  /ui
  /analytics

/data
  /schemas
  /seed

/docs
  methodology.md
  moderation.md
  privacy.md
  governance.md
  contributing.md

/scripts
```

License should be selected after reviewing:

- database licensing
- code licensing
- citizen-submitted data rights
- evidence rights
- privacy requirements

---

# 13. Technical Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- MapLibre / OpenStreetMap-compatible mapping

### Backend

- Next.js API routes or dedicated API
- PostgreSQL
- PostGIS
- Supabase initially

### Storage

- Object storage for evidence
- Encrypted storage
- Automatic retention policies

### Search

Initially:

- PostgreSQL full-text search

Later:

- OpenSearch / Elasticsearch if required

### Analytics

- SQL aggregates
- Geographic clustering
- Time-series analysis

---

# 14. Government Source Registry

This is one of the most important components.

Every official number shown should ideally have:

```text
source_url
source_title
department
publication_date
last_verified
retrieved_at
```

Example:

```text
Service: Driving Licence
Official Fee: ₹X
Source: Government portal
Last verified: YYYY-MM-DD
```

Never present a government fee without knowing where it came from.

---

# 15. Core UX

The homepage should communicate the idea immediately.

### Hero

> **What should government cost you?**

Subheading:

> Search official fees and timelines. Compare them with what citizens actually experience.

Primary action:

> **Search a government service**

Secondary action:

> **Report anonymously**

---

# 16. Example Service Page

## Driving Licence

### Official

Fee:

> ₹1,000

Timeline:

> 7 days

Documents:

> 4

Source:

> Official government portal

---

### Citizen experience

Reports:

> 284

Median reported timeline:

> 21 days

Median additional amount reported:

> ₹2,000

Common experience:

> Multiple visits / unclear process / additional payment requests

---

### Important notice

> Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing.

---

# 17. Geographic Layer

The platform should eventually support:

```text
India
 ↓
State
 ↓
District
 ↓
City
 ↓
Department
 ↓
Office
 ↓
Service
```

This enables questions like:

> Is the same government service materially different in two districts?

That is far more valuable than simply publishing isolated accusations.

---

# 18. Metrics

Potential public metrics:

### Cost

- Official fee
- Median additional amount reported
- Distribution of reported additional payments

### Time

- Official timeline
- Median reported timeline
- Delay distribution

### Friction

- Average visits
- Common missing-document complaints
- Process confusion

### Reliability

- Number of independent reports
- Verification rate
- Evidence-backed rate
- Report freshness

---

# 19. Privacy

Privacy is a foundational feature, not a legal afterthought.

### Do not publish

- Phone numbers
- Aadhaar numbers
- PAN
- Exact home addresses
- Personal email
- Faces
- Personal documents containing sensitive information
- Names of alleged individuals by default

Evidence should be automatically scanned/redacted where possible.

---

# 20. Legal & Governance Principles

Before public launch, obtain appropriate legal/privacy review.

The platform should:

1. Separate allegation from verified fact.
2. Provide a clear correction process.
3. Avoid publishing unnecessary personal data.
4. Maintain moderation logs.
5. Preserve evidence of moderation decisions.
6. Publish methodology.
7. Publish data-quality limitations.
8. Avoid monetizing individual allegations.
9. Avoid pay-to-remove systems.
10. Keep governance independent from individual political parties or government departments.

---

# 21. Governance

Long-term governance should not depend entirely on the founder.

Potential model:

### Technical maintainers

Maintain software.

### Data stewards

Maintain methodology and dataset quality.

### Independent reviewers

Review difficult moderation cases.

### Community contributors

Submit service information, government sources and reports.

### Public mirrors

Independently preserve datasets and software.

---

# 22. Funding Philosophy

Avoid incentives that compromise credibility.

Potential funding:

- Grants
- Philanthropic funding
- Research partnerships
- Non-profit structures
- Responsible sponsorship
- Public-interest technology funding

Avoid:

> "Pay us and we'll remove your report."

That destroys the product's legitimacy.

---

# 23. Launch Strategy

### Stage 1

Launch with 10–20 high-friction government services.

Examples:

- Driving licence
- Land registration
- Building permits
- Police verification
- GST
- Municipal permissions
- Birth/death certificates
- Property mutation
- Vehicle registration
- Local trade licences

### Stage 2

Focus on a handful of states.

### Stage 3

Expand nationwide.

### Stage 4

Expose the public API and encourage independent mirrors.

---

# 24. The Network Effect

The product gets stronger with every contribution.

```text
More reports
      ↓
Better statistics
      ↓
More public attention
      ↓
More contributors
      ↓
More geographic coverage
      ↓
Better government-service intelligence
      ↓
More useful platform
      ↓
More reports
```

---

# 25. Long-Term Vision

Rishwat.fyi should eventually answer questions nobody can currently answer easily:

> Which government services create the most friction?

> Which states have the biggest gap between official and experienced timelines?

> Where are unofficial payment requests most frequently reported?

> Which departments improved after digitization?

> Did a policy change reduce citizen friction?

> Which government services are genuinely becoming easier?

That turns the project from a "bribe website" into **public-interest infrastructure.**

---

# 26. Success Metrics

### Year 1

- 100+ services indexed
- 10+ states
- 10,000+ citizen reports
- Public API
- Open dataset
- Active contributors
- Independent mirrors

### Long term

The ultimate metric is not website traffic.

It is:

> **How much previously invisible government-service friction can the public now measure?**

---

# 27. MVP Roadmap

## Sprint 1 — Prototype

- [x] Landing page
- [x] Search
- [x] Service profiles
- [x] Citizen reporting UI
- [x] Open-data messaging
- [x] Responsive UI

## Sprint 2 — Backend

- [ ] Supabase
- [ ] PostgreSQL schema
- [ ] Report API
- [ ] Service database
- [ ] Authentication for moderators
- [ ] Admin dashboard

## Sprint 3 — Trust

- [ ] Moderation workflow
- [ ] Duplicate detection
- [ ] Evidence pipeline
- [ ] Verification states
- [ ] Government-source registry

## Sprint 4 — Public infrastructure

- [ ] Public API
- [ ] Dataset export
- [ ] Data dictionary
- [ ] Methodology
- [ ] Contribution guide
- [ ] Mirror instructions

## Sprint 5 — Launch

- [ ] Production deployment
- [ ] Domain
- [ ] First 20 services
- [ ] First state-level dataset
- [ ] Public launch
- [ ] Contributor campaign

---

# 28. One-Line Positioning

### Product

> **Rishwat.fyi shows the gap between how government services are supposed to work and how citizens actually experience them.**

### Open-source thesis

> **If transparency depends on one website staying online, it isn't really transparent.**

### Mission

> **Make government-service friction measurable, verifiable and impossible to quietly erase.**

---

# 29. Final Principle

Rishwat.fyi should never become another website people depend on.

It should become a **protocol, dataset and community** that can survive the website.

**The website is only the interface.**

**The data is the infrastructure.**

**The methodology is the trust layer.**

**The community is the network.**

**Open source makes it resilient.**
