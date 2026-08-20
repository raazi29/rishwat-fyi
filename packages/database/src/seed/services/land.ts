import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const landServices: ServiceSeed[] = [
  {
    slug: "land-registration",
    name: "Land / Property Registration",
    departmentSlug: "registration-stamps",
    description:
      "Registration of a sale/conveyance deed for immovable property under the Registration Act, 1908. Stamp duty is typically ~5–7% of the property value plus a ~1% registration fee, and varies by state.",
    official_fee_inr: "",
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
    feeSourceUrl: SRC.igrsup,
    timelineSourceUrl: SRC.igrsup,
  },
  {
    slug: "property-mutation",
    name: "Property Mutation (Namantaran)",
    departmentSlug: "revenue",
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
    feeSourceUrl: SRC.dilrmp,
    timelineSourceUrl: SRC.dilrmp,
  },
  {
    slug: "building-permit",
    name: "Building Plan Approval / Permit",
    departmentSlug: "municipal",
    description:
      "Approval of building plans and issue of a construction permit by the urban local body / development authority before construction. Fee depends on built-up area and use.",
    official_fee_inr: "",
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
    feeSourceUrl: SRC.nsws,
    timelineSourceUrl: SRC.nsws,
  },
];
