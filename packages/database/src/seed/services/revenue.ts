import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const revenueServices: ServiceSeed[] = [
  {
    slug: "ration-card",
    name: "Ration Card",
    departmentSlug: "food-civil-supplies",
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
    feeSourceUrl: SRC.nfsa,
    timelineSourceUrl: SRC.nfsa,
  },
];
