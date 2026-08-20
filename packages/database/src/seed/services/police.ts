import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const policeServices: ServiceSeed[] = [
  {
    slug: "police-verification",
    name: "Police Verification / Clearance Certificate",
    departmentSlug: "police",
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
    feeSourceUrl: SRC.passport,
    timelineSourceUrl: SRC.passport,
  },
];
