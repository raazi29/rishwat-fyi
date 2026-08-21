import type { OfficeSeed } from "./types.js";

// Real Indian government offices, keyed to seeded services and districts. This
// is a representative sample to exercise the India → State → District →
// Department → Office → Service hierarchy — NOT an exhaustive national list.
//
// HONESTY RULE (see the product plan): office names are real and publicly
// verifiable. Coordinates are `location: null` unless an exact point is known
// for certain — a null coordinate is always preferable to a fabricated one,
// because this data is presented to the public as factual. Addresses are given
// only at area granularity where confidently known, otherwise omitted (null).
//
// serviceSlug values must exist in ./services/*, and (stateCode, districtName)
// must resolve against a seeded district in ./locations/* — the runner throws
// loudly if any reference is unresolved.
export const allOffices: OfficeSeed[] = [
  // ---- Uttar Pradesh (UP) ----
  // Varanasi is intentionally the richest district (five services) so the
  // ?service filter has something to narrow.
  { serviceSlug: "driving-licence", stateCode: "UP", districtName: "Varanasi", name: "Regional Transport Office, Varanasi" },
  { serviceSlug: "vehicle-registration", stateCode: "UP", districtName: "Varanasi", name: "Regional Transport Office, Varanasi" },
  { serviceSlug: "land-registration", stateCode: "UP", districtName: "Varanasi", name: "Office of the Sub-Registrar, Varanasi" },
  { serviceSlug: "birth-certificate", stateCode: "UP", districtName: "Varanasi", name: "Nagar Nigam Varanasi (Varanasi Municipal Corporation)" },
  { serviceSlug: "passport", stateCode: "UP", districtName: "Varanasi", name: "Passport Seva Kendra, Varanasi" },

  { serviceSlug: "driving-licence", stateCode: "UP", districtName: "Lucknow", name: "Regional Transport Office, Lucknow" },
  { serviceSlug: "land-registration", stateCode: "UP", districtName: "Lucknow", name: "Office of the Sub-Registrar, Lucknow" },
  { serviceSlug: "passport", stateCode: "UP", districtName: "Lucknow", name: "Regional Passport Office, Lucknow" },

  { serviceSlug: "driving-licence", stateCode: "UP", districtName: "Agra", name: "Regional Transport Office, Agra" },
  { serviceSlug: "passport", stateCode: "UP", districtName: "Agra", name: "Passport Seva Kendra, Agra" },

  { serviceSlug: "driving-licence", stateCode: "UP", districtName: "Kanpur Nagar", name: "Regional Transport Office, Kanpur" },
  { serviceSlug: "vehicle-registration", stateCode: "UP", districtName: "Gautam Buddha Nagar", name: "Regional Transport Office, Gautam Buddha Nagar" },

  // ---- Maharashtra (MH) ----
  {
    serviceSlug: "driving-licence", stateCode: "MH", districtName: "Mumbai City",
    name: "Regional Transport Office, Mumbai (Tardeo)", address: "Tardeo, Mumbai, Maharashtra",
  },
  { serviceSlug: "passport", stateCode: "MH", districtName: "Mumbai City", name: "Regional Passport Office, Mumbai" },
  { serviceSlug: "birth-certificate", stateCode: "MH", districtName: "Mumbai City", name: "Municipal Corporation of Greater Mumbai (BMC)" },

  { serviceSlug: "driving-licence", stateCode: "MH", districtName: "Pune", name: "Regional Transport Office, Pune" },
  { serviceSlug: "passport", stateCode: "MH", districtName: "Pune", name: "Regional Passport Office, Pune" },
  { serviceSlug: "driving-licence", stateCode: "MH", districtName: "Nagpur", name: "Regional Transport Office, Nagpur" },

  // ---- Karnataka (KA) ----
  {
    serviceSlug: "driving-licence", stateCode: "KA", districtName: "Bengaluru Urban",
    name: "Regional Transport Office, Bengaluru (Koramangala)", address: "Koramangala, Bengaluru, Karnataka",
  },
  {
    serviceSlug: "vehicle-registration", stateCode: "KA", districtName: "Bengaluru Urban",
    name: "Regional Transport Office, Bengaluru (Koramangala)", address: "Koramangala, Bengaluru, Karnataka",
  },
  { serviceSlug: "passport", stateCode: "KA", districtName: "Bengaluru Urban", name: "Regional Passport Office, Bengaluru" },
  { serviceSlug: "birth-certificate", stateCode: "KA", districtName: "Bengaluru Urban", name: "Bruhat Bengaluru Mahanagara Palike (BBMP)" },

  // ---- Tamil Nadu (TN) ----
  { serviceSlug: "driving-licence", stateCode: "TN", districtName: "Chennai", name: "Regional Transport Office, Chennai (Central)" },
  { serviceSlug: "passport", stateCode: "TN", districtName: "Chennai", name: "Regional Passport Office, Chennai" },
  { serviceSlug: "birth-certificate", stateCode: "TN", districtName: "Chennai", name: "Greater Chennai Corporation" },
  { serviceSlug: "driving-licence", stateCode: "TN", districtName: "Coimbatore", name: "Regional Transport Office, Coimbatore" },

  // ---- Telangana (TG) ----
  {
    serviceSlug: "driving-licence", stateCode: "TG", districtName: "Hyderabad",
    name: "Regional Transport Authority, Hyderabad (Khairatabad)", address: "Khairatabad, Hyderabad, Telangana",
  },
  { serviceSlug: "passport", stateCode: "TG", districtName: "Hyderabad", name: "Regional Passport Office, Hyderabad" },

  // ---- West Bengal (WB) ----
  { serviceSlug: "passport", stateCode: "WB", districtName: "Kolkata", name: "Regional Passport Office, Kolkata" },
  { serviceSlug: "birth-certificate", stateCode: "WB", districtName: "Kolkata", name: "Kolkata Municipal Corporation" },

  // ---- Rajasthan (RJ) ----
  { serviceSlug: "driving-licence", stateCode: "RJ", districtName: "Jaipur", name: "Regional Transport Office, Jaipur" },
  { serviceSlug: "passport", stateCode: "RJ", districtName: "Jaipur", name: "Regional Passport Office, Jaipur" },

  // ---- Gujarat (GJ) ----
  { serviceSlug: "driving-licence", stateCode: "GJ", districtName: "Ahmedabad", name: "Regional Transport Office, Ahmedabad" },
  { serviceSlug: "birth-certificate", stateCode: "GJ", districtName: "Ahmedabad", name: "Ahmedabad Municipal Corporation" },
  { serviceSlug: "driving-licence", stateCode: "GJ", districtName: "Surat", name: "Regional Transport Office, Surat" },

  // ---- Delhi (DL) ----
  { serviceSlug: "passport", stateCode: "DL", districtName: "New Delhi", name: "Regional Passport Office, Delhi" },
  { serviceSlug: "land-registration", stateCode: "DL", districtName: "New Delhi", name: "Office of the Sub-Registrar, New Delhi" },
];
