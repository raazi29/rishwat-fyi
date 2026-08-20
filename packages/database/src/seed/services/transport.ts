import type { ServiceSeed } from "../types.js";
import { SRC } from "./sources.js";

export const transportServices: ServiceSeed[] = [
  {
    slug: "driving-licence",
    name: "Driving Licence",
    departmentSlug: "transport",
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
    feeSourceUrl: SRC.parivahan,
    timelineSourceUrl: SRC.parivahan,
  },
  {
    slug: "vehicle-registration",
    name: "Vehicle Registration",
    departmentSlug: "transport",
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
    feeSourceUrl: SRC.parivahan,
    timelineSourceUrl: SRC.parivahan,
  },
];
