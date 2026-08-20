/**
 * SAMPLE DATA — official service catalogue, part 2 of 2 (services 7–12).
 *
 * Companion to `service-details.ts` (which owns the combined
 * `sampleServiceDetails` export). Every OFFICIAL figure — fee, timeline,
 * visits, documents, process steps, department name — is copied VERBATIM from
 * `packages/database/src/seed/services/*.ts`. Real government figures; do not
 * round or "improve". A `null` `official_fee_inr` marks a slab-/percentage-
 * based fee. No citizen-reported data lives here.
 */

import type { ServiceDetail } from "@/lib/api/types";

export const serviceDetailsPart2: ServiceDetail[] = [
  {
    slug: "birth-certificate",
    name: "Birth Certificate",
    department: "Municipal Corporation / Urban Local Body",
    description:
      "Registration of a birth and issue of a birth certificate under the Registration of Births and Deaths Act, 1969. Registration is free within 21 days; a nominal late fee applies thereafter.",
    official_fee_inr: "10.00",
    official_timeline_days: 21,
    official_visits: 1,
    official_documents: [
      { name: "Hospital / institutional birth report", required: true },
      { name: "Parents' identity & address proof", required: true },
      { name: "Parents' marriage certificate (where required)", required: false },
      { name: "Proof of date and place of birth", required: true },
      { name: "Application form", required: true },
    ],
    process_steps: [
      { order: 1, title: "Hospital report", description: "Hospital reports the birth to the local registrar." },
      { order: 2, title: "Submit application", description: "Applicant submits the application with proof." },
      { order: 3, title: "Verification", description: "Local registrar verifies the details." },
      { order: 4, title: "Register entry", description: "Birth is entered in the register." },
      { order: 5, title: "Issue certificate", description: "Birth certificate is issued." },
    ],
  },
  {
    slug: "death-certificate",
    name: "Death Certificate",
    department: "Municipal Corporation / Urban Local Body",
    description:
      "Registration of a death and issue of a death certificate under the Registration of Births and Deaths Act, 1969. Registration is free within 21 days; a nominal late fee applies thereafter.",
    official_fee_inr: "10.00",
    official_timeline_days: 21,
    official_visits: 1,
    official_documents: [
      { name: "Medical certificate of cause of death", required: true },
      { name: "Deceased's identity proof", required: true },
      { name: "Applicant's identity & address proof", required: true },
      { name: "Proof of date and place of death", required: true },
      { name: "Application form", required: true },
    ],
    process_steps: [
      { order: 1, title: "Cause-of-death certificate", description: "Medical officer issues the cause-of-death certificate." },
      { order: 2, title: "Submit application", description: "Applicant submits the application to the registrar." },
      { order: 3, title: "Verification", description: "Local registrar verifies the details." },
      { order: 4, title: "Register entry", description: "Death is entered in the register." },
      { order: 5, title: "Issue certificate", description: "Death certificate is issued." },
    ],
  },
  {
    slug: "police-verification",
    name: "Police Verification / Clearance Certificate",
    department: "Police Department",
    description:
      "Verification of antecedents and issue of a Police Clearance Certificate (PCC), commonly required for passports, government employment and tenant verification. The police verification step itself carries no separate fee.",
    official_fee_inr: "0.00",
    official_timeline_days: 15,
    official_visits: 1,
    official_documents: [
      { name: "Proof of identity (Aadhaar/passport)", required: true },
      { name: "Proof of present address", required: true },
      { name: "Proof of permanent address", required: true },
      { name: "Passport-size photographs", required: true },
      { name: "Reference number (e.g. passport file number)", required: false },
      { name: "Rent agreement (for tenant verification)", required: false },
    ],
    process_steps: [
      { order: 1, title: "Initiate request", description: "Application is initiated by the applicant or a referring authority." },
      { order: 2, title: "Assignment", description: "Request is routed to the jurisdictional police station." },
      { order: 3, title: "Field verification", description: "Beat officer verifies address and antecedents." },
      { order: 4, title: "Report", description: "Verification report is submitted to the issuing authority." },
      { order: 5, title: "Clearance", description: "Police clearance certificate is issued." },
    ],
  },
  {
    slug: "ration-card",
    name: "Ration Card",
    department: "Food & Civil Supplies Department",
    description:
      "Issue of a ration card for subsidised foodgrains under the National Food Security Act, 2013 and the Public Distribution System. No fee is charged for issuance.",
    official_fee_inr: "0.00",
    official_timeline_days: 30,
    official_visits: 2,
    official_documents: [
      { name: "Aadhaar of the head of family", required: true },
      { name: "Proof of residence", required: true },
      { name: "Passport-size photographs of family members", required: true },
      { name: "Surrender/cancellation certificate of previous card (if any)", required: false },
      { name: "Income declaration", required: true },
      { name: "Bank account details", required: false },
    ],
    process_steps: [
      { order: 1, title: "Submit application", description: "Apply at the Food & Civil Supplies office or online." },
      { order: 2, title: "Document verification", description: "Submitted documents are verified." },
      { order: 3, title: "Field verification", description: "Household is verified by the inspector." },
      { order: 4, title: "Approval", description: "Application is approved and the card is printed." },
      { order: 5, title: "Issue card", description: "Ration card is issued and PDS enrolment is completed." },
    ],
  },
  {
    slug: "gst-registration",
    name: "GST Registration",
    department: "Commercial Taxes / GST Department",
    description:
      "Registration under the Goods and Services Tax and issue of a GSTIN on the GST portal. No government fee is charged for registration.",
    official_fee_inr: "0.00",
    official_timeline_days: 7,
    official_visits: 0,
    official_documents: [
      { name: "PAN of the business/applicant", required: true },
      { name: "Aadhaar of the promoter", required: true },
      { name: "Proof of business registration/incorporation", required: true },
      { name: "Address proof of principal place of business", required: true },
      { name: "Bank statement / cancelled cheque", required: true },
      { name: "Digital signature (for companies/LLPs)", required: false },
      { name: "Photographs of promoters", required: true },
    ],
    process_steps: [
      { order: 1, title: "Part A", description: "Submit PAN, mobile and email; verify via OTP (TRN generated)." },
      { order: 2, title: "Part B", description: "Fill business and bank details and upload documents." },
      { order: 3, title: "Aadhaar authentication", description: "Complete Aadhaar authentication of the promoter." },
      { order: 4, title: "Officer verification", description: "GST officer verifies the application (or deemed approval)." },
      { order: 5, title: "GSTIN issued", description: "GSTIN and registration certificate are issued." },
    ],
  },
  {
    slug: "passport",
    name: "Passport (Fresh / Reissue)",
    department: "Passport Seva (Ministry of External Affairs)",
    description:
      "Issue of an Indian passport through Passport Seva. The fee for a fresh 36-page normal booklet is ₹1500 (tatkal and 60-page booklets cost more).",
    official_fee_inr: "1500.00",
    official_timeline_days: 30,
    official_visits: 1,
    official_documents: [
      { name: "Proof of date of birth", required: true },
      { name: "Proof of present address", required: true },
      { name: "Identity proof (Aadhaar/PAN/Voter ID)", required: true },
      { name: "Old passport (for reissue)", required: false },
      { name: "Applicable annexures", required: false },
    ],
    process_steps: [
      { order: 1, title: "Register & apply", description: "Register on the Passport Seva portal and fill the application." },
      { order: 2, title: "Pay & book", description: "Pay the fee and book an appointment at a PSK/POPSK." },
      { order: 3, title: "Verification", description: "Document verification and biometrics at the PSK." },
      { order: 4, title: "Police verification", description: "Police verification of the applicant is carried out." },
      { order: 5, title: "Dispatch", description: "Passport is printed and dispatched by post." },
    ],
  },
];
