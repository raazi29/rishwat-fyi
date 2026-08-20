/**
 * SAMPLE DATA — official service catalogue, part 1 of 2, plus the combined
 * export `sampleServiceDetails` (all 12 launch services).
 *
 * Every OFFICIAL figure here — fee, timeline, visits, documents, process steps,
 * department name — is copied VERBATIM from
 * `packages/database/src/seed/services/*.ts`. These are real government figures
 * and must not be rounded or "improved". A `null` `official_fee_inr` marks a
 * slab-/percentage-based fee (the seed stores `""`, served by the API as
 * `null`). This module holds no citizen-reported data — the illustrative
 * sample aggregates live in `aggregates.ts`.
 *
 * The split into two files (see `service-details-part2.ts`) exists only to
 * keep each file under the 300-line budget; department names are inlined so the
 * two files stay independent.
 */

import type { ServiceDetail } from "@/lib/api/types";
import { serviceDetailsPart2 } from "./service-details-part2";

const serviceDetailsPart1: ServiceDetail[] = [
  {
    slug: "driving-licence",
    name: "Driving Licence",
    department: "Transport Department (RTO)",
    description:
      "Issue of a permanent driving licence for a motor vehicle under the Motor Vehicles Act, 1988 and CMV Rules, 1989, preceded by a learner's licence and a driving test.",
    official_fee_inr: "1200.00",
    official_timeline_days: 30,
    official_visits: 2,
    official_documents: [
      { name: "Proof of Age (birth certificate / class 10 marksheet)", required: true },
      { name: "Proof of Address (Aadhaar / utility bill / passport)", required: true },
      { name: "Learner's Licence", required: true },
      { name: "Application Form 4", required: true },
      { name: "Passport-size photographs", required: true },
      { name: "Medical Certificate Form 1A (age 40+/transport vehicle)", required: false },
    ],
    process_steps: [
      { order: 1, title: "Apply online", description: "Register on the Sarathi/Parivahan portal, fill the application and pay the fee." },
      { order: 2, title: "Learner's licence", description: "Clear the online preliminary test to obtain the learner's licence." },
      { order: 3, title: "Practice period", description: "Hold the learner's licence for at least 30 days before the driving test." },
      { order: 4, title: "Driving test", description: "Appear for the driving test at the RTO on the booked slot." },
      { order: 5, title: "Issue of DL", description: "Smart-card driving licence is printed and dispatched by post." },
    ],
  },
  {
    slug: "vehicle-registration",
    name: "Vehicle Registration",
    department: "Transport Department (RTO)",
    description:
      "Registration of a new motor vehicle and issue of the Registration Certificate (RC) by the RTO under the Motor Vehicles Act, 1988. A base registration fee applies plus one-time road tax (varies by state and vehicle).",
    official_fee_inr: "600.00",
    official_timeline_days: 7,
    official_visits: 1,
    official_documents: [
      { name: "Form 20 (application for registration)", required: true },
      { name: "Sale Certificate (Form 21)", required: true },
      { name: "Roadworthiness Certificate (Form 22)", required: true },
      { name: "Invoice of the vehicle", required: true },
      { name: "Valid insurance certificate", required: true },
      { name: "Pollution Under Control (PUC) certificate", required: true },
      { name: "Proof of address and identity", required: true },
    ],
    process_steps: [
      { order: 1, title: "Submit application", description: "Dealer/owner submits Form 20 with supporting documents to the RTO." },
      { order: 2, title: "Pay fees", description: "Pay the registration fee and applicable one-time road tax." },
      { order: 3, title: "Inspection", description: "Vehicle is inspected at the RTO where required." },
      { order: 4, title: "Number assignment", description: "A registration number is assigned to the vehicle." },
      { order: 5, title: "Issue of RC", description: "Smart-card Registration Certificate is issued/dispatched." },
    ],
  },
  {
    slug: "land-registration",
    name: "Land / Property Registration",
    department: "Registration & Stamps Department",
    description:
      "Registration of a sale/conveyance deed for immovable property under the Registration Act, 1908. Stamp duty is typically ~5–7% of the property value plus a ~1% registration fee, and varies by state.",
    official_fee_inr: null,
    official_timeline_days: 30,
    official_visits: 2,
    official_documents: [
      { name: "Sale/Conveyance Deed on requisite stamp paper", required: true },
      { name: "Encumbrance Certificate", required: true },
      { name: "Property Card / 7-12 extract / Khata", required: true },
      { name: "Identity proof of parties (Aadhaar)", required: true },
      { name: "PAN card", required: true },
      { name: "Passport-size photographs of parties", required: true },
      { name: "Proof of stamp duty and registration fee payment", required: true },
    ],
    process_steps: [
      { order: 1, title: "Prepare deed", description: "Draft and print the deed on the requisite stamp paper." },
      { order: 2, title: "Pay duty", description: "Pay stamp duty and registration fee (often online)." },
      { order: 3, title: "Book appointment", description: "Book a slot at the Sub-Registrar's office." },
      { order: 4, title: "Registration", description: "Parties and witnesses appear for biometric verification and signing." },
      { order: 5, title: "Collect deed", description: "Collect the registered deed after scanning." },
    ],
  },
  {
    slug: "property-mutation",
    name: "Property Mutation (Namantaran)",
    department: "Revenue Department",
    description:
      "Updating the ownership name in land-revenue/municipal records after a transfer, sale or inheritance (dakhil kharij / namantaran).",
    official_fee_inr: "100.00",
    official_timeline_days: 45,
    official_visits: 2,
    official_documents: [
      { name: "Registered Sale Deed", required: true },
      { name: "Latest property tax receipt", required: true },
      { name: "Death certificate & succession/will (for inheritance)", required: false },
      { name: "Mutation application form", required: true },
      { name: "Affidavit / indemnity bond", required: false },
    ],
    process_steps: [
      { order: 1, title: "Submit application", description: "File the mutation application with the registered deed." },
      { order: 2, title: "Verification", description: "Revenue official verifies the submitted documents." },
      { order: 3, title: "Objection period", description: "Public notice is issued inviting objections." },
      { order: 4, title: "Field inspection", description: "Site inspection is carried out where required." },
      { order: 5, title: "Update records", description: "Records are updated and a mutation certificate is issued." },
    ],
  },
  {
    slug: "building-permit",
    name: "Building Plan Approval / Permit",
    department: "Municipal Corporation / Urban Local Body",
    description:
      "Approval of building plans and issue of a construction permit by the urban local body / development authority before construction. Fee depends on built-up area and use.",
    official_fee_inr: null,
    official_timeline_days: 60,
    official_visits: 3,
    official_documents: [
      { name: "Ownership documents / title deed", required: true },
      { name: "Approved layout plan", required: true },
      { name: "Building plan drawings by a licensed architect", required: true },
      { name: "Site plan", required: true },
      { name: "Structural stability certificate", required: true },
      { name: "NOC (fire/environment) where applicable", required: false },
      { name: "Property tax receipts", required: true },
    ],
    process_steps: [
      { order: 1, title: "Submit plans", description: "Licensed architect submits the building plans and documents." },
      { order: 2, title: "Scrutiny", description: "Pay scrutiny fee; plans are checked against building bye-laws." },
      { order: 3, title: "Site inspection", description: "Authority inspects the site." },
      { order: 4, title: "Sanction", description: "Building plan is approved/sanctioned." },
      { order: 5, title: "Commencement", description: "Commencement certificate is issued to start construction." },
    ],
  },
  {
    slug: "trade-licence",
    name: "Trade Licence",
    department: "Municipal Corporation / Urban Local Body",
    description:
      "Licence from the municipal body permitting a trade or commercial activity at a premises. Fee typically ranges from ₹500 to ₹5000 depending on trade category and area.",
    official_fee_inr: null,
    official_timeline_days: 30,
    official_visits: 2,
    official_documents: [
      { name: "Proof of premises (ownership / rent agreement)", required: true },
      { name: "Identity & address proof of applicant", required: true },
      { name: "Property tax receipt", required: true },
      { name: "Layout of premises", required: true },
      { name: "NOC (fire / neighbours) where applicable", required: false },
      { name: "PAN card", required: true },
    ],
    process_steps: [
      { order: 1, title: "Submit application", description: "Apply with premises and identity documents." },
      { order: 2, title: "Pay fee", description: "Pay the fee applicable to the trade category." },
      { order: 3, title: "Inspection", description: "Premises are inspected by the health/licensing officer." },
      { order: 4, title: "Approval", description: "Application is approved by the licensing authority." },
      { order: 5, title: "Issue licence", description: "Trade licence is issued." },
    ],
  },
];

/** All 12 launch services, in seed order. */
export const sampleServiceDetails: ServiceDetail[] = [
  ...serviceDetailsPart1,
  ...serviceDetailsPart2,
];
