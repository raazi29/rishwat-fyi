import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const commerceServices: ServiceSeed[] = [
  {
    slug: "gst-registration",
    name: "GST Registration",
    departmentSlug: "commercial-taxes",
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
    feeSourceUrl: SRC.gst,
    timelineSourceUrl: SRC.gst,
  },
  {
    slug: "passport",
    name: "Passport (Fresh / Reissue)",
    departmentSlug: "passport-seva",
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
    feeSourceUrl: SRC.passport,
    timelineSourceUrl: SRC.passport,
  },
];
