import type { DepartmentSeed } from "../types.js";

// Departments referenced by services (services resolve department_id by slug).
export const departments: DepartmentSeed[] = [
  {
    slug: "transport",
    name: "Transport Department (RTO)",
    description: "Regional Transport Offices — driving licences, vehicle registration and permits.",
    category: "transport",
  },
  {
    slug: "registration-stamps",
    name: "Registration & Stamps Department",
    description: "Registration of deeds, stamp duty and property document registration.",
    category: "land",
  },
  {
    slug: "revenue",
    name: "Revenue Department",
    description: "Land records, mutation (namantaran) and revenue administration.",
    category: "land",
  },
  {
    slug: "municipal",
    name: "Municipal Corporation / Urban Local Body",
    description: "Trade licences, building-plan approvals and civil registration of births & deaths.",
    category: "municipal",
  },
  {
    slug: "police",
    name: "Police Department",
    description: "Police verification and clearance certificates.",
    category: "police",
  },
  {
    slug: "food-civil-supplies",
    name: "Food & Civil Supplies Department",
    description: "Public Distribution System and ration card issuance.",
    category: "revenue",
  },
  {
    slug: "commercial-taxes",
    name: "Commercial Taxes / GST Department",
    description: "GST registration and indirect-tax administration.",
    category: "commerce",
  },
  {
    slug: "passport-seva",
    name: "Passport Seva (Ministry of External Affairs)",
    description: "Passport issuance and related consular services.",
    category: "commerce",
  },
];
