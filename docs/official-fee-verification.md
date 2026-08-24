# Official Fee Verification & Audit Plan

> **Status:** Initial research completed 2026-08-25
> **Risk level:** HIGH — incorrect official figures undermine the platform's credibility and could expose it to legal challenge.
> **Rule:** No fee is published without a traceable government source. When in doubt, show "Varies" rather than guess.

---

## Summary Table

| # | Service | Seeded Fee | Verified Fee | Status | Source | Confidence |
|---|---------|-----------|--------------|--------|--------|------------|
| 1 | Driving Licence | ₹1,200 | ₹200 (issue) + ₹300 (test) = ₹500 base | ⚠️ **DISCREPANCY** | CMVR 1989, Rule 32 | HIGH |
| 2 | Vehicle Registration (LMV) | ₹600 | ₹600 (LMV/3W) | ✅ Correct | CMVR 1989, Rule 81 | HIGH |
| 3 | Land Registration | Varies | Varies (stamp duty 5-7% + ~1% reg fee) | ✅ Correct | State Registration Acts | HIGH |
| 4 | Property Mutation | ₹100 | ₹25–₹500 (varies by state) | ⚠️ **RANGE** | State Revenue Codes | MEDIUM |
| 5 | Building Permit | Varies | Varies (by area/use) | ✅ Correct | Municipal bye-laws | HIGH |
| 6 | Trade Licence | Varies | Varies (₹500–₹5,000) | ✅ Correct | State Municipal Acts | HIGH |
| 7 | Birth Certificate | ₹10 | ₹0–₹50 (varies by state, free within 21 days in most) | ⚠️ **RANGE** | RBD Act 1969 | MEDIUM |
| 8 | Death Certificate | ₹10 | ₹0–₹50 (varies by state, free within 21 days in most) | ⚠️ **RANGE** | RBD Act 1969 | MEDIUM |
| 9 | GST Registration | ₹0 | ₹0 (free) | ✅ Correct | CGST Act 2017 | HIGH |
| 10 | Passport (36pp, 10yr) | ₹1,500 | ₹2,500 | ⚠️ **DISCREPANCY** | passportindia.gov.in | HIGH |
| 11 | Police Verification / PCC | ₹0 | ₹0 (police verification) / ₹750 (PCC) | ⚠️ **CLARIFY** | MEA fee schedule | HIGH |
| 12 | Ration Card | ₹0 | ₹0 (free) | ✅ Correct | NFSA 2013 | HIGH |

### Critical Discrepancies to Fix

1. **Passport: ₹1,500 → ₹2,500** — The fee was revised. The current official fee for a fresh 36-page passport (10-year validity, adult) is **₹2,500**. Source: passportindia.gov.in/psp/onlineHtml/feeDocument
2. **Driving Licence: ₹1,200 → ₹500 (base)** — The CMVR base fee is ₹200 (issuance) + ₹300 (driving test) = ₹500. The ₹1,200 figure may include state surcharges + smart card + learner's licence fees combined, but is not the single "official fee" from one transaction. Need to decide: show the base DL issuance fee or the total journey cost.

---

## Detailed Verification

### 1. Driving Licence

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹1,200 | ₹500 (base: ₹200 issue + ₹300 test) | **FIX or CLARIFY** |
| Timeline | 30 days | 30 days (after learner's period) | ✅ |
| Source | parivahan.gov.in | parivahan.gov.in | ✅ |

**Details:**
- CMVR 1989, Rule 32: DL issuance fee = ₹200, Driving test fee = ₹300
- Learner's Licence: ₹150 per vehicle class + ₹50 test = ₹200
- Smart card: additional ₹200
- Total journey (LL + DL + smart card): ₹150 + ₹50 + ₹200 + ₹300 + ₹200 = ₹900 base
- States add ₹50–₹300 in surcharges/service charges
- **Recommendation:** Show ₹200 + ₹300 = **₹500** as "DL issuance fee" (what you pay at the DL stage), and note "Total including learner's licence and smart card: ~₹900–₹1,200" in the description. OR change to "Varies (₹500–₹1,200)" with explanation.

**Source URL:** https://sarathi.parivahan.gov.in (fee schedule varies by state selection)

---

### 2. Vehicle Registration

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹600 | ₹600 (LMV/3-wheeler) | ✅ No change |
| Timeline | 7 days | 7 days | ✅ |
| Source | parivahan.gov.in | CMVR 1989, Rule 81 | ✅ |

**Details:**
- CMVR 1989, Rule 81 (as confirmed by multiple state transport departments):
  - Invalid carriage: ₹50
  - Motorcycle: ₹300
  - Three-wheeler / LMV: ₹600
  - Medium vehicle: ₹1,000
  - Heavy vehicle: ₹1,500
- Smart card RC (Form 23A): additional ₹200
- Road tax is separate and varies heavily by state (not included in fee)
- **The ₹600 figure is correct for the most common case (car/LMV registration).**

**Source URL:** https://parivahan.gov.in + State transport department schedules

---

### 3. Land / Property Registration

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | "" (varies) | Stamp duty 5–7% + registration fee ~1% | ✅ No change |
| Timeline | 30 days | 1–30 days (varies) | ✅ |
| Source | igrsup.gov.in | State Registration Acts | ✅ |

**Details:**
- Correctly marked as variable. Stamp duty is state-set (ranges from 4% to 10%).
- Registration fee is typically 1% of property value, capped in some states.
- No fixed national fee exists. Showing "" (blank) is the right choice.

---

### 4. Property Mutation (Namantaran)

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹100 | ₹25–₹500 (state-dependent) | ⚠️ Consider range |
| Timeline | 45 days | 15–90 days (state-dependent) | ⚠️ Consider range |
| Source | dilrmp.gov.in | State Revenue Codes | ✅ |

**Details:**
- Maharashtra: ₹25–₹100 (online)
- Tamil Nadu: ₹100–₹300
- Andhra Pradesh: 0.5% of property value (₹1,000–₹20,000)
- Karnataka, Haryana: ₹250–₹600
- UP, Rajasthan: ₹100–₹500
- **₹100 is a reasonable floor/central figure but should note "varies by state".**
- **Recommendation:** Keep ₹100 but add a note in description. Or change to "" (varies) to be safe.

---

### 5. Building Plan Approval / Permit

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | "" (varies) | Varies by built-up area and municipality | ✅ No change |
| Timeline | 60 days | 30–90 days | ✅ |
| Source | nsws.gov.in | Municipal bye-laws | ✅ |

---

### 6. Trade Licence

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | "" (varies) | ₹500–₹5,000 depending on trade and area | ✅ No change |
| Timeline | 30 days | 7–30 days | ✅ |
| Source | nsws.gov.in | Municipal bye-laws | ✅ |

---

### 7. Birth Certificate

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹10 | ₹0 (free within 21 days) / ₹10–₹50 (late) | ⚠️ Clarify |
| Timeline | 21 days | 7–21 days (registration period, not processing time) | ⚠️ Clarify |
| Source | crsorgi.gov.in | RBD Act 1969 | ✅ |

**Details:**
- Under the Registration of Births and Deaths Act, 1969:
  - Registration within 21 days: **FREE** in most states
  - Late registration (after 21 days): ₹2–₹5 fee + affidavit
  - Certificate issuance: ₹10–₹50 depending on state
- The "21 days" in our seed is the **registration window**, not the processing timeline.
- **Recommendation:** Change fee to "₹0" (free registration within 21 days) and clarify that ₹10 is the certificate copy fee. Or keep ₹10 as "certificate issuance fee" and note "Registration itself is free within 21 days."

---

### 8. Death Certificate

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹10 | Same as birth certificate | ⚠️ Same as above |
| Timeline | 21 days | Same as birth certificate | ⚠️ Same as above |
| Source | crsorgi.gov.in | RBD Act 1969 | ✅ |

---

### 9. GST Registration

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹0 | ₹0 (free for regular taxpayers) | ✅ No change |
| Timeline | 7 days | 3–7 working days (or deemed approval) | ✅ |
| Source | gst.gov.in | CGST Act 2017, Section 25 | ✅ |

**Details:**
- Government registration fee: **₹0** (free) for all regular taxpayers
- Casual/non-resident taxable persons: ₹5,000 advance tax deposit (not a "fee")
- Timeline: 3 working days if Aadhaar authenticated; 7 days otherwise; 30 days max with show-cause
- **Correctly seeded.**

---

### 10. Passport (Fresh, 36-page, 10-year)

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹1,500 | **₹2,500** | 🔴 **MUST FIX** |
| Timeline | 30 days | 30 days (normal) / 1–3 days (tatkaal) | ✅ |
| Source | passportindia.gov.in | passportindia.gov.in/psp/onlineHtml/feeDocument | ✅ |

**Details:**
- Official fee schedule (from passportindia.gov.in, verified 2026-08-25):
  - Fresh passport, 36 pages, 10-year validity (adult 18+): **₹2,500**
  - Fresh passport, 60 pages, 10-year validity: ₹3,500
  - Minor (below 18), 36 pages, 5-year: ₹1,750
  - Tatkaal surcharge: additional ₹2,500
  - PCC: ₹750
- The ₹1,500 figure is **outdated** (pre-revision fee). Current fee is ₹2,500.
- **This is the highest-confidence discrepancy. Must fix immediately.**
- 10% rebate for minors ≤8 years and seniors >60 years.

**Source URL:** https://www.passportindia.gov.in/psp/onlineHtml/feeDocument

---

### 11. Police Verification / PCC

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹0 | ₹0 (verification) / ₹750 (PCC certificate) | ⚠️ Clarify |
| Timeline | 15 days | 7–21 days | ✅ |
| Source | passportindia.gov.in | MEA fee schedule | ✅ |

**Details:**
- Police verification (as part of passport/employment): **₹0** — no separate fee
- Police Clearance Certificate (PCC) as a standalone document: **₹750**
- Our service is titled "Police Verification / Clearance Certificate" — ambiguous
- **Recommendation:** If the service covers PCC issuance, fee should be ₹750. If it covers only the verification step (which is typically initiated by another department), ₹0 is correct. The description says "commonly required for passports" — implying the verification, not standalone PCC. **₹0 is defensible but add clarification.**

---

### 12. Ration Card

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹0 | ₹0 (free) | ✅ No change |
| Timeline | 30 days | 15–30 days | ✅ |
| Source | nfsa.gov.in | NFSA 2013 | ✅ |

**Details:**
- Under NFSA 2013, ration card issuance is **free**.
- Some states charge ₹5–₹25 for the physical card, but the entitlement/registration is free.
- **Correctly seeded.**

---

## Action Items (Priority Order)

### 🔴 Critical (must fix before launch)

1. **Passport fee: ₹1,500 → ₹2,500**
   - File: `packages/database/src/seed/services/commerce.ts`
   - Change `official_fee_inr: "1500.00"` to `official_fee_inr: "2500.00"`
   - Update description to mention "₹2,500 for a fresh 36-page booklet (10-year validity)"
   - This is verifiable at passportindia.gov.in — the fee schedule is public

2. **Driving Licence fee: ₹1,200 → clarify or reduce**
   - File: `packages/database/src/seed/services/transport.ts`
   - Option A: Change to `official_fee_inr: "500.00"` (DL stage only: ₹200 issue + ₹300 test)
   - Option B: Change to `official_fee_inr: ""` (varies) and explain in description
   - Option C: Keep ₹1,200 but clarify it's "total journey cost including LL + DL + smart card"
   - **Recommended: Option A** — show the single-transaction fee, note the total in description

### 🟠 Should fix (before launch)

3. **Birth/Death Certificate: ₹10 → clarify**
   - Registration is free within 21 days; ₹10 is the certificate copy fee
   - Either keep ₹10 with clearer description or show ₹0 with note
   - Lower risk since ₹10 is not wrong — it's just the copy fee, not registration

4. **Police Verification: clarify scope**
   - If the service covers PCC (standalone certificate): fee should be ₹750
   - If it covers only police verification (as part of passport): ₹0 is correct
   - Description currently says both — pick one or split into two services

### 🟡 Nice to have

5. **Property Mutation: add "varies by state" note**
   - ₹100 is reasonable but ranges from ₹25 to ₹500+
   - Consider showing "" (varies) to be safe

6. **Add `last_verified_at` timestamps to government_sources table**
   - Every source should carry a verification date
   - Frontend should show "Verified [date] via [source]"

---

## Methodology: How to Verify

### Before publishing any official fee:

1. **Go to the government portal directly** (not a third-party site)
2. **Find the fee schedule / gazette notification** — not a blog post
3. **Check the date** — fees get revised; an undated source is unreliable
4. **Cross-reference** with at least one state implementation (e.g. a state transport department showing the same CMVR fee)
5. **Document the exact URL and access date** in the source record

### When to re-verify:

- **Annually** — government fees are revised in Union Budget or via gazette notifications
- **On user report** — if a citizen reports a different official fee, investigate
- **On news** — watch for "government revises fee for [service]" news items

### Red flags that mean "don't publish":

- Fee found only on a third-party blog, not the government site
- Fee schedule undated or clearly outdated (references old acts/rules)
- Contradictory figures across official sources (wait for clarification)
- State-specific fee being presented as national (always note the scope)

---

## State-Level Variations

### Services with NO state variation (central fee):
- GST Registration (₹0 nationwide)
- Passport (₹2,500 nationwide — MEA sets the fee)

### Services with MINOR state variation (central base + state surcharge):
- Driving Licence (base ₹500, states add ₹50–₹300)
- Vehicle Registration (base ₹600 for LMV, same nationwide per CMVR)
- Police Verification/PCC (₹750 for PCC nationwide — MEA)

### Services with MAJOR state variation (state sets the fee):
- Land Registration (stamp duty 4–10% depending on state)
- Property Mutation (₹25–₹20,000 depending on state and property value)
- Building Permit (entirely local municipality)
- Trade Licence (entirely local municipality)
- Birth/Death Certificate (₹0–₹50 depending on state)
- Ration Card (₹0–₹25 depending on state)

### How to handle state variations:
- **Current approach (correct):** Show the national/base fee where one exists, show "" (varies) where it doesn't
- **Future enhancement:** Add per-state fee overrides in the database (a `service_state_fees` table)
- **Never:** Show a single fixed fee for a service that genuinely varies by state without noting "varies"

---

## Governance

- This document is the **audit trail** for every official number displayed on the platform
- Any fee change requires: (1) government source URL, (2) access date, (3) update to this document
- Citizen-reported data is separate and clearly labeled — it never overwrites official data
- The mandatory notice strip on every page with citizen data reinforces this separation
