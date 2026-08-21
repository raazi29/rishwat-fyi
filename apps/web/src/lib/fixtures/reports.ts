/**
 * SAMPLE DATA — citizen reports. ILLUSTRATIVE, NOT LIVE.
 *
 * Descriptions are synthetic, written in plain Indian English. They describe
 * patterns, never people: no official is named, no personal identifier appears,
 * and where a contact detail would have been the text shows the `[REDACTED]`
 * token exactly as the export redactor would leave it.
 *
 * OFFICIAL-ACKNOWLEDGEMENT NOTE: exactly one sample report (R-a1b2c3d4) carries
 * status `officially_acknowledged`. Its acknowledging source is a CLEARLY
 * FAKE PLACEHOLDER (`https://example.gov.in/acknowledgement`, see `admin.ts`).
 * No real government acknowledgement, funder, partner or endorsement is implied
 * anywhere — see PRODUCT.md.
 */

import type { EvidenceMeta, PublicReport, ReportStatusResponse, ReportSubmissionResponse } from "@/lib/api/types";
import { sampleId } from "./ids";

/** >= 24 redacted-sounding citizen descriptions (30–800 chars, no PII/names). */
export const sampleCitizenDescriptions: string[] = [
  "Applied for my driving licence and cleared the test, but was told the smart card would print quickly only if I paid an extra amount at the counter. Ended up making three visits before it was issued.",
  "The learner's licence was smooth online, but for the permanent licence an agent outside the RTO asked for money over the official fee. Without him the file was simply not moving.",
  "Vehicle registration took much longer than the seven days mentioned. Every visit there was one more document needed that was never listed. Paid a facilitation charge in the end to close it.",
  "For land registration the stamp duty was clear, but the sub-registrar office wanted an additional amount to fix an early appointment. Waited almost a month with repeated trips.",
  "Property mutation after my father's passing dragged on for over two months. Each visit the file was 'with another table'. Was quietly asked to pay to speed up the objection period.",
  "Building plan approval needed so many rounds of scrutiny that I lost count. A large unofficial amount was hinted at to avoid further objections. Reach me on [REDACTED] for the full timeline.",
  "Trade licence for a small shop. The inspection happened only after an extra payment was arranged. The listed fee was small but the real cost was several times that.",
  "Birth certificate for my newborn was free within the time limit, but the clerk kept sending me back for one more paper each time. Took four visits for a simple entry.",
  "Death certificate process was slow and confusing. Nobody explained what was needed, and I had to come back repeatedly with the same documents.",
  "Police verification for my passport was completed only after a small amount changed hands during the home visit. The report reached the office fast after that.",
  "Ration card application sat pending for weeks. The field verification happened only when I followed up many times, and there was pressure to pay a small facilitation amount.",
  "GST registration is online but my application was held at officer verification. I was told an intermediary could get it cleared for a fee. It came through on its own after a long wait.",
  "Passport process was actually smooth at the seva kendra, done in one visit. No extra money was asked. The only delay was the police verification step.",
  "Renewed my driving licence. The online part worked, but at the test slot I was told to 'arrange' something to be sure of passing. Refused and still passed, but it took extra visits.",
  "Land registration: the deed was ready but the appointment was pushed again and again until a middleman was engaged. After that the slot appeared within a day.",
  "For property mutation the online status never updated. Physical visits were the only way to know anything. An unofficial payment was clearly expected to close the file.",
  "Building permit for a house extension. The structural certificate was accepted only after several trips and an informal payment. The bye-law checks kept changing.",
  "My trade licence renewal was blocked over a missing paper that was never mentioned earlier. The staff were unhelpful until a small amount was paid.",
  "Birth certificate correction of a spelling error took three visits. Each counter pointed to another. No money was asked but the process was needlessly long.",
  "Applied for a ration card as a new family unit. The paperwork was accepted but enrolment happened only after repeated visits and a facilitation charge.",
  "Vehicle registration for a two-wheeler. The dealer handled it but the road tax receipt and RC were delayed well beyond a week, with extra handling costs added.",
  "Police clearance certificate for a job abroad. The verification officer was courteous but the report moved only after a token payment during the visit.",
  "GST registration for a proprietorship. Aadhaar authentication failed twice for no clear reason and I had to visit to sort it out, losing several working days.",
  "Death certificate for a relative. The medical certificate was in order, yet the register entry took over a week and one more visit than promised. Reach me at [REDACTED] for specifics.",
  "Driving licence test was rescheduled twice without notice. On the third visit an agent offered to guarantee the slot for a price. The official counter had no clear queue.",
  "Land registration in our district needed the encumbrance certificate re-verified in person. The extra amount asked at the counter was far above the official registration fee.",
];

const d = sampleCitizenDescriptions;
function evidence(seed: string, mime: string, size: number): EvidenceMeta {
  return { id: sampleId(`evidence:${seed}`), status: "accepted", mime_type: mime, size_bytes: size, retention_until: "2026-11-18T00:00:00.000Z" };
}

export const samplePublicReports: PublicReport[] = [
  {
    public_id: "R-a1b2c3d4", status: "officially_acknowledged",
    service: { slug: "driving-licence", name: "Driving Licence" },
    state: "Uttar Pradesh", district: "Varanasi",
    period_start: "2026-04-01", period_end: "2026-05-15",
    official_fee_reported_inr: "1200.00", additional_amount_reported_inr: "2000.00", amount_paid_inr: "3200.00",
    paid: true, delay_days: 24, visits: 4, description: d[1] ?? "",
    evidence: [evidence("R-a1b2c3d4", "application/pdf", 184320)],
    submitted_at: "2026-05-20T09:15:00.000Z", status_changed_at: "2026-07-10T11:40:00.000Z",
  },
  {
    public_id: "R-b2c3d4e5", status: "evidence_backed",
    service: { slug: "land-registration", name: "Land / Property Registration" },
    state: "Uttar Pradesh", district: "Varanasi",
    period_start: "2026-03-10", period_end: "2026-04-05",
    official_fee_reported_inr: null, additional_amount_reported_inr: "6000.00", amount_paid_inr: "6000.00",
    paid: true, delay_days: 30, visits: 5, description: d[3] ?? "",
    evidence: [evidence("R-b2c3d4e5", "image/jpeg", 622592)],
    submitted_at: "2026-04-12T14:05:00.000Z", status_changed_at: "2026-06-28T10:20:00.000Z",
  },
  {
    public_id: "R-c3d4e5f6", status: "corroborated",
    service: { slug: "property-mutation", name: "Property Mutation (Namantaran)" },
    state: "Bihar", district: "Patna",
    period_start: "2026-02-01", period_end: "2026-04-14",
    official_fee_reported_inr: "100.00", additional_amount_reported_inr: "3500.00", amount_paid_inr: "3600.00",
    paid: true, delay_days: 71, visits: 5, description: d[4] ?? "",
    evidence: [], submitted_at: "2026-04-18T08:30:00.000Z", status_changed_at: "2026-05-30T16:10:00.000Z",
  },
  {
    public_id: "R-d4e5f6a7", status: "validated",
    service: { slug: "police-verification", name: "Police Verification / Clearance Certificate" },
    state: "Maharashtra", district: "Pune",
    period_start: "2026-05-02", period_end: "2026-05-25",
    official_fee_reported_inr: "0.00", additional_amount_reported_inr: "500.00", amount_paid_inr: "500.00",
    paid: true, delay_days: 12, visits: 2, description: d[9] ?? "",
    evidence: [], submitted_at: "2026-05-28T12:00:00.000Z", status_changed_at: "2026-06-03T09:45:00.000Z",
  },
  {
    public_id: "R-e5f6a7b8", status: "corroborated",
    service: { slug: "driving-licence", name: "Driving Licence" },
    state: "Delhi", district: "New Delhi",
    period_start: "2026-04-20", period_end: "2026-05-10",
    official_fee_reported_inr: "1200.00", additional_amount_reported_inr: "1000.00", amount_paid_inr: "2200.00",
    paid: true, delay_days: 12, visits: 3, description: d[13] ?? "",
    evidence: [], submitted_at: "2026-05-14T17:25:00.000Z", status_changed_at: "2026-06-19T13:05:00.000Z",
  },
  {
    public_id: "R-f6a7b8c9", status: "submitted",
    service: { slug: "passport", name: "Passport (Fresh / Reissue)" },
    state: "Karnataka", district: "Bengaluru Urban",
    period_start: "2026-06-01", period_end: "2026-06-18",
    official_fee_reported_inr: "1500.00", additional_amount_reported_inr: "0.00", amount_paid_inr: "1500.00",
    paid: true, delay_days: 4, visits: 1, description: d[12] ?? "",
    evidence: [], submitted_at: "2026-06-22T10:35:00.000Z", status_changed_at: "2026-06-22T10:35:00.000Z",
  },
];

/** Demo submission tokens per report (only the sha256 is stored server-side). */
const REPORT_TOKENS: Record<string, string> = {
  "R-a1b2c3d4": "smpl-tok-4f9a2c7e1b6d",
  "R-b2c3d4e5": "smpl-tok-8c1e5a9f3d20",
  "R-c3d4e5f6": "smpl-tok-2a7b6c4d9e18",
  "R-d4e5f6a7": "smpl-tok-6d3f1e8a2c95",
  "R-e5f6a7b8": "smpl-tok-9b4c2e7a5f13",
  "R-f6a7b8c9": "smpl-tok-3e8d1a6c4b70",
};

export function findPublicReport(publicId: string): PublicReport | null {
  return samplePublicReports.find((report) => report.public_id === publicId) ?? null;
}

/** Status lookup: a wrong/absent token returns `null` (same as unknown id). */
export function getSampleReportStatus(publicId: string, token: string): ReportStatusResponse | null {
  const report = findPublicReport(publicId);
  if (!report || REPORT_TOKENS[publicId] !== token) return null;
  return { public_id: report.public_id, status: report.status, status_changed_at: report.status_changed_at };
}

/** Illustrative submission response for exercising the "submitted" screen offline. */
export const sampleSubmissionResponse: ReportSubmissionResponse = {
  public_id: "R-7h3k9m2p",
  status: "submitted",
  token: "smpl-tok-7h3k9m2p0q1r",
};
