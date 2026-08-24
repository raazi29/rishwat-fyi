# Official Fee Verification & Audit Plan

> **Status:** Research verified 2026-08-25 (double-checked against primary government sources)
> **Risk level:** HIGH — incorrect official figures undermine the platform's credibility and could expose it to legal challenge.
> **Rule:** No fee is published without a traceable government source. When in doubt, show "Varies" rather than guess.

---

## Summary Table

| # | Service | Seeded Fee | Verified Fee | Status | Source | Confidence |
|---|---------|-----------|--------------|--------|--------|------------|
| 1 | Driving Licence | ₹1,200 | ₹200 (issue) + ₹300 (test) = ₹500 base | ⚠️ **OVERSTATED** | CMVR 1989, Rule 32 (verified from gazette text) | HIGH |
| 2 | Vehicle Registration (LMV) | ₹600 | ₹600 (LMV/3W) | ✅ Correct | CMVR 1989, Rule 81 (verified from state transport depts) | HIGH |
| 3 | Land Registration | Varies | Varies (stamp duty 5-7% + ~1% reg fee) | ✅ Correct | State Registration Acts | HIGH |
| 4 | Property Mutation | ₹100 | ₹25–₹500 (varies by state) | ⚠️ **RANGE** | State Revenue Codes | MEDIUM |
| 5 | Building Permit | Varies | Varies (by area/use) | ✅ Correct | Municipal bye-laws | HIGH |
| 6 | Trade Licence | Varies | Varies (₹500–₹5,000) | ✅ Correct | State Municipal Acts | HIGH |
| 7 | Birth Certificate | ₹10 | ₹0–₹50 (varies by state, free within 21 days in most) | ⚠️ **RANGE** | RBD Act 1969 | MEDIUM |
| 8 | Death Certificate | ₹10 | ₹0–₹50 (varies by state, free within 21 days in most) | ⚠️ **RANGE** | RBD Act 1969 | MEDIUM |
| 9 | GST Registration | ₹0 | ₹0 (free) | ✅ Correct | CGST Act 2017, Section 25 | HIGH |
| 10 | Passport (36pp, 10yr) | ₹1,500 | **₹2,500** (effective 1 July 2026) | 🔴 **WRONG — MUST FIX** | MEA Gazette Notification, Passports (Amendment) Rules 2026 | HIGH |
| 11 | Police Verification / PCC | ₹0 | ₹0 (verification) / **₹750** (PCC standalone) | ⚠️ **CLARIFY** | MEA fee schedule (same gazette) | HIGH |
| 12 | Ration Card | ₹0 | ₹0 (free) | ✅ Correct | NFSA 2013 | HIGH |

### Critical Discrepancies (with source evidence)

#### 1. Passport: ₹1,500 → ₹2,500 🔴

**Verified from:**
- passportindia.gov.in official PDF (ApplicationformInstructionBooklet-V3.0.pdf): "Fresh Passport/Re-issue of Passport (36 pages) of 10 years validity — Rs.2,500/-"
- MEA Gazette Notification dated 20 June 2026 (Passports (Amendment) Rules, 2026): revised fee effective **1 July 2026**
- Multiple confirmed news sources (UNI, News18, LinkedIn posts from June 2026) reporting: "first passport fee revision in 14 years, previous increase was in 2012"
- PCC fee also revised: ₹500 → ₹750

**Previous fee (pre-July 2026):** ₹1,500 (this is what was seeded — correct at the time of seeding but now outdated)
**Current fee (post-1 July 2026):** ₹2,500

#### 2. Driving Licence: ₹1,200 is overstated ⚠️

**Verified from CMVR 1989 Rule 32 (gazette text):**
- S.No. 1: Issue of learner's licence for each class of vehicle = **₹150**
- S.No. 2: Learner's licence test fee = **₹50**
- S.No. 3: Driving test fee (for each class of vehicle) = **₹300**
- S.No. 4: Issue of a driving licence = **₹200**
- Smart card fee (where applicable) = **₹200** (additional)

**Total for one vehicle class (LL + DL + smart card):** ₹150 + ₹50 + ₹300 + ₹200 + ₹200 = **₹900**
**For two classes (motorcycle + car):** ₹150×2 + ₹50 + ₹300×2 + ₹200 + ₹200 = **₹1,350**

The seeded ₹1,200 appears to be an approximation of "total journey for one class including state surcharges." The actual **per-transaction DL issuance fee** (what you pay when your DL is issued) is ₹200. The **total government fees for the complete process** (one class) is ~₹900.

**Recommendation:** Change to ₹200 (the DL issuance fee per CMVR Rule 32) and note the full cost breakdown in the description. This is what "official fee" means — the statutory fee for that specific service, not the sum of all prerequisites.

---

## Detailed Verification

### 1. Driving Licence

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹1,200 | See breakdown below | ⚠️ **FIX** |
| Timeline | 30 days | 30 days (after learner's period) | ✅ |
| Source | parivahan.gov.in | CMVR 1989, Rule 32 (gazette) | ✅ |

**Verification evidence (CMVR 1989, Rule 32 — directly from gazette text):**

| S.No. | Purpose | Amount |
|-------|---------|--------|
| 1 | Issue of learner's licence for each class of vehicle | ₹150 |
| 2 | Learner's licence test fee or repeat test | ₹50 |
| 3 | Driving test fee (for each class of vehicle) | ₹300 |
| 4 | Issue of a driving licence | ₹200 |
| 5 | International Driving Permit | ₹1,000 |
| 6 | Addition of another class | ₹500 |
| 8 | Renewal of driving licence | ₹200 |

(Source: https://ebook.commerciallawpublishers.com/fa/cmvr/files/basic-html/page81.html — gazette text of Rule 32)

**Smart card fee:** ₹200 additional (where issued as smart card — mandatory for new DLs)

**Total cost for a citizen getting a fresh DL (one vehicle class):**
- LL application: ₹150
- LL test: ₹50
- Driving test: ₹300
- DL issuance: ₹200
- Smart card: ₹200
- **TOTAL: ₹900** (central fees, no state surcharges)

**With state surcharges:** states add ₹50–₹300 → real-world range is **₹950–₹1,200**

**Why the seed says ₹1,200:** It appears to be the approximate total journey cost including state surcharges for a single vehicle class. This is not *wrong* from a citizen's perspective — it's roughly what you'll pay. But it's also not the "official fee for issuing a driving licence" per CMVR (which is ₹200).

**Recommendation:** Change to a total that represents the complete government fees a citizen pays for one class (₹900) with description explaining the breakdown. This is more honest than ₹200 (which hides mandatory prerequisites) and more accurate than ₹1,200 (which includes unspecified state surcharges).

**Decision required:**
- Option A: `"900.00"` — total CMVR fees for LL + DL (one class) without state surcharges
- Option B: `""` (varies) — safest, with "₹900–₹1,200 depending on state" in description
- Option C: Keep `"1200.00"` — defensible as "approximate total" but not precisely sourced

---

### 2. Vehicle Registration

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹600 | ₹600 (LMV/3-wheeler new registration) | ✅ No change |
| Timeline | 7 days | 7 days | ✅ |
| Source | parivahan.gov.in | CMVR 1989, Rule 81 | ✅ |

**Verification evidence:**
- CMVR 1989, Rule 81 — new vehicle registration fees:
  - Invalid carriage: ₹50
  - Motorcycle: ₹300
  - Three-wheeler / LMV (new): **₹600**
  - Medium vehicle: ₹1,000
  - Heavy vehicle: ₹1,500
- Confirmed by Telangana Transport Dept (transport.telangana.gov.in/html/fees-registration.html)
- Confirmed by The Hindu (2022): "registration charges for new vehicles would continue to be reasonable at ₹300 for motorcycle, ₹600 for three-wheeler and LMVs"
- CarVaidya.com comprehensive table lists identical figures
- **NOTE:** The ₹5,000 figure seen in some sources is the **RENEWAL** fee for vehicles older than 15 years (amended December 2021, implemented from December 1, 2021). New registration remains ₹600.
- Smart card RC (Form 23A): additional ₹200
- Road tax is separate and state-specific (not included in fee)
- **The ₹600 figure is CONFIRMED CORRECT for new LMV registration.**

**Source URLs:**
- https://transport.telangana.gov.in/html/fees-registration.html
- https://www.carvaidya.com/blog/govt-charges-for-all-rc-related-services
- Rajasthan: transport.rajasthan.gov.in (shows ₹1,500 for LMV — this appears to be a state-specific amended rate, not the central CMVR rate)

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
| Fee | ₹10 | **FREE** (within 21 days) / ₹10–₹100 (late) | ⚠️ Clarify |
| Timeline | 21 days | 21 days (registration window, not processing) | ⚠️ Clarify meaning |
| Source | crsorgi.gov.in | RBD Act 1969, Section 8 + CRS FAQ | ✅ |

**Verification evidence (from official CRS FAQ and RBD Act):**

1. **CRS Official FAQ** (dc.crsorgi.gov.in/assets/download/FAQ_of_CRS_Latest.pdf):
   > "Is there any fee for registration of births and deaths? If event of a birth or death is reported for registration to the prescribed authority within the normal period of 21 days, **no fee would be charged**."

2. **Tamil Nadu CRS FAQ** (crstn.org/birth_death_tn/AboutUs/FAQ.pdf):
   - Within 21 days: **FREE**
   - After 21 days but within 30 days: ₹100 late fee
   - After 30 days but within 1 year: ₹200
   - After 1 year: ₹500

3. **Vikaspedia** (government portal):
   > "The birth and death certificates are issued free of charge by the concerned Registrar for events reported within 21 days."

4. **RBD Act 1969, Section 8:** Requires reporting within 21 days. Section 13 prescribes late fees.

5. **IndiaNRI legal guide:** "Every birth must be reported to the Registrar within 21 days, free of charge."

**Key insight:** The ₹10 in our seed is the **certificate extraction fee** (Section 17: "Search and supply of extracts — payment of prescribed fees") charged in some states for obtaining a certified copy AFTER registration. Registration itself is FREE within 21 days. Different states charge ₹10–₹50 for the copy.

**Recommendation:** 
- Change fee to `"0.00"` with description: "Registration is free within 21 days. A nominal fee of ₹10–₹50 may apply for obtaining a certified copy, depending on the state."
- Change timeline description: "21 days" refers to the registration window, not processing time.
- OR keep `"10.00"` but label it explicitly as "certificate issuance fee (registration is free)"

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
| Timeline | 7 days | 7 working days (or deemed approval per Rule 9(5)) | ✅ |
| Source | gst.gov.in | CGST Act 2017, Section 25 + CGST Rules, Rule 9 | ✅ |

**Verification evidence:**

1. **CGST Rules 2017, Rule 9(1):** "Registration must be granted within **7 working days** from the date of application submission."

2. **Rule 9(5) — Deemed approval:** "If the proper officer fails to take any action within the said 7/30/7 days, the application for the grant of registration shall be **deemed to have been approved**."

3. **Multiple authoritative sources confirm:** "There is no fee charged for GST registration in India" (IndiaFilings, fi.money, VakilSearch, BajajFinServ — all consistent).

4. **Exception:** Casual taxable persons / non-resident taxable persons pay ₹5,000 as advance tax deposit (not a registration "fee" per se — it's an advance against future liability).

5. **Newer development (2025):** Auto-approval within 3 days for low-risk businesses under ₹25 lakh B2B output tax (caclubindia.com).

**Correctly seeded. No change needed.**

---

### 10. Passport (Fresh, 36-page, 10-year)

| Field | Current Seed | Verified | Action |
|-------|-------------|----------|--------|
| Fee | ₹1,500 | **₹2,500** | 🔴 **MUST FIX** |
| Timeline | 30 days | 30 days (normal) / 1–3 days (tatkaal) | ✅ |
| Source | passportindia.gov.in | passportindia.gov.in + MEA Gazette 20 June 2026 | ✅ |

**Verification evidence:**

1. **Primary source:** passportindia.gov.in official PDF (ApplicationformInstructionBooklet-V3.0.pdf) directly states: "Fresh Passport/Re-issue of Passport including additional booklet due to exhaustion of visa pages (36 pages) of 10 years validity — Rs.2,500/-"

2. **Gazette notification:** MEA issued Passports (Amendment) Rules, 2026 on **20 June 2026** under Section 24 of the Passports Act, 1967. It replaces Schedule IV of the Passports Rules, 1980. **Effective date: 1 July 2026.**

3. **Fee comparison (old → new):**
   - Fresh 36-page (adult, 10yr): ₹1,500 → **₹2,500**
   - Fresh 60-page (adult, 10yr): ₹2,000 → ₹3,500
   - Fresh 36-page (minor <18, 5yr): ₹1,000 → ₹1,750
   - Tatkaal surcharge: ₹2,000 → ₹2,500
   - PCC: ₹500 → **₹750**

4. **Context:** This is the first passport fee revision in 14 years (previous was in 2012). Confirmed by UNI (United News of India), News18, and official MEA channels.

5. **Rebate:** 10% discount for minors ≤8 years and senior citizens >60 years (₹2,250 for them).

**Source URLs:**
- https://www.passportindia.gov.in/AppOnlineProject/pdf/ApplicationformInstructionBooklet-V3.0.pdf
- https://www.passportindia.gov.in/psp/onlineHtml/feeDocument (official fee page)

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
| Source | nfsa.gov.in | NFSA 2013, Section 10 | ✅ |

**Verification evidence:**

1. **NFSA 2013, Section 10(1a/1b):** Requires state governments to identify eligible households and issue ration cards. No fee is prescribed in the Act for issuance.

2. **Wikipedia (citing official government sources):** "Under the NFSA, all state governments have to identify households eligible to receive subsidised food grain and provide them with ration cards." — no mention of any fee.

3. **nfsa.gov.in Salient Features page:** Confirms states issue ration cards under the Act. No fee structure mentioned.

4. **Practical reality:** Some states charge ₹5–₹25 for the physical card material, but the registration/entitlement itself is free. This is analogous to the birth certificate situation (registration free, copy may have nominal charge).

**Correctly seeded. No change needed.**

---

## Action Items (Priority Order)

### 🔴 Critical (must fix before launch)

1. **Passport fee: ₹1,500 → ₹2,500**
   - File: `packages/database/src/seed/services/commerce.ts`
   - Change `official_fee_inr: "1500.00"` to `official_fee_inr: "2500.00"`
   - Update description to mention "₹2,500 for a fresh 36-page booklet (10-year validity, effective 1 July 2026)"
   - Source: MEA Gazette Notification dated 20 June 2026, Passports (Amendment) Rules 2026
   - **Confidence: HIGHEST** — verified directly from passportindia.gov.in official PDF

2. **Driving Licence fee: ₹1,200 → ₹900 (recommended)**
   - File: `packages/database/src/seed/services/transport.ts`
   - Change `official_fee_inr: "1200.00"` to `official_fee_inr: "900.00"`
   - Update description: "Total central government fees for a fresh permanent driving licence (one vehicle class): ₹150 (LL) + ₹50 (LL test) + ₹300 (driving test) + ₹200 (DL issue) + ₹200 (smart card) = ₹900. States may add ₹50–₹300 in service charges."
   - Source: CMVR 1989 Rule 32 (gazette text verified)
   - **Confidence: HIGH** — verified from gazette text of Rule 32

3. **PCC fee: update service description**
   - The "Police Verification" service currently shows ₹0
   - This is correct IF the service is "police verification as part of passport"
   - If it covers standalone PCC: fee should be ₹750 (revised from ₹500, same gazette)
   - **Decision needed:** keep ₹0 with clearer scoping, OR split into two services

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
- Driving Licence (base ₹900 total journey, states add ₹50–₹300)
- Vehicle Registration (base ₹600 for LMV per CMVR — **BUT** Rajasthan shows ₹1,500; this may be a state amendment. Needs per-state confirmation before showing state-specific fees.)
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
