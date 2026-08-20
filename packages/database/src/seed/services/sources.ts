import type { SourceSeed } from "../types.js";

// Authoritative government portals. Service fee/timeline figures are traced back
// to these (plan §14: every official number should be source-linked). URLs are
// the real national/authority portals for each domain.
export const SRC = {
  parivahan: "https://parivahan.gov.in/parivahan/",
  igrsup: "https://igrsup.gov.in/",
  dilrmp: "https://dilrmp.gov.in/",
  nsws: "https://www.nsws.gov.in/",
  crs: "https://crsorgi.gov.in/",
  nfsa: "https://nfsa.gov.in/",
  gst: "https://www.gst.gov.in/",
  passport: "https://www.passportindia.gov.in/",
} as const;

export const sources: SourceSeed[] = [
  { url: SRC.parivahan, title: "Parivahan Sewa — Ministry of Road Transport & Highways", department: "Transport Department (RTO)" },
  { url: SRC.igrsup, title: "Stamps & Registration Department (IGRS)", department: "Registration & Stamps Department" },
  { url: SRC.dilrmp, title: "Digital India Land Records Modernization Programme (DILRMP)", department: "Revenue Department" },
  { url: SRC.nsws, title: "National Single Window System — Business Approvals", department: "Municipal Corporation / Urban Local Body" },
  { url: SRC.crs, title: "Civil Registration System — Births & Deaths (ORGI)", department: "Municipal Corporation / Urban Local Body" },
  { url: SRC.nfsa, title: "National Food Security Act / Public Distribution System Portal", department: "Food & Civil Supplies Department" },
  { url: SRC.gst, title: "Goods and Services Tax Portal (GSTN)", department: "Commercial Taxes / GST Department" },
  { url: SRC.passport, title: "Passport Seva — Ministry of External Affairs", department: "Passport Seva (Ministry of External Affairs)" },
];
