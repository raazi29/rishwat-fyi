import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const municipalServices: ServiceSeed[] = [
  {
    slug: "trade-licence",
    name: "Trade Licence",
    departmentSlug: "municipal",
    description:
      "Licence from the municipal body permitting a trade or commercial activity at a premises. Fee typically ranges from ₹500 to ₹5000 depending on trade category and area.",
    official_fee_inr: "",
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
    feeSourceUrl: SRC.nsws,
    timelineSourceUrl: SRC.nsws,
  },
  {
    slug: "birth-certificate",
    name: "Birth Certificate",
    departmentSlug: "municipal",
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
    feeSourceUrl: SRC.crs,
    timelineSourceUrl: SRC.crs,
  },
  {
    slug: "death-certificate",
    name: "Death Certificate",
    departmentSlug: "municipal",
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
    feeSourceUrl: SRC.crs,
    timelineSourceUrl: SRC.crs,
  },
];
