/**
 * Shared types, option lists, and the step map for the anonymous report wizard.
 *
 * Only a subset of what the wizard collects is part of `reportSubmissionSchema`
 * (see `@rishwat/validation`): `service_id`, `state_id`, `district_id`,
 * `period_start/end`, the money/visits/delay fields, `paid`, and `description`.
 * The department, service type, city/office and frequency selections improve the
 * report and appear in the review, but they are UX context — they are never
 * invented into the submission payload.
 */

import type { ReportSubmission } from "@/lib/api/types";

/** Geography + service catalogue, preloaded on the server and filtered locally. */
export interface DepartmentOption {
  slug: string;
  name: string;
}
export interface StateOption {
  id: string;
  code: string;
  name: string;
}
export interface DistrictOption {
  id: string;
  code: string;
  name: string;
}
export interface CityOption {
  id: string;
  name: string;
}
export interface ServiceOption {
  /** Stable submission id (uuid) derived for the selected service. */
  id: string;
  slug: string;
  name: string;
  /** Department display name, shown in the review read-back. */
  department: string;
  /** Department slug, used to filter the service list by the chosen department. */
  departmentSlug: string;
}

export interface WizardGeo {
  departments: DepartmentOption[];
  states: StateOption[];
  /** Keyed by state `code`. */
  districtsByState: Record<string, DistrictOption[]>;
  /** Keyed by district `id`. */
  citiesByDistrict: Record<string, CityOption[]>;
  services: ServiceOption[];
}

/** Every field the wizard tracks. Strings mirror the form controls 1:1. */
export interface WizardData {
  // Step 1 — Service & Location
  departmentSlug: string;
  serviceSlug: string;
  serviceType: string;
  stateCode: string;
  districtId: string;
  cityId: string;
  office: string;
  period: PeriodKey | "";
  frequency: string;
  // Step 2 — Experience details (context only; not in the payload)
  issues: string[];
  // Step 3 — Payments & visits
  officialFee: string;
  additionalAmount: string;
  amountPaid: string;
  paid: boolean;
  delayValue: string;
  delayUnit: DelayUnit;
  visits: string;
  // Step 4 — Description
  description: string;
}

export type FieldErrors = Partial<Record<keyof WizardData, string>>;

export type SubmitPhase = "idle" | "submitting" | "error";

export interface SubmitFailure {
  code: string;
  message: string;
  /** Network/timeout failures are retryable; the draft is always preserved. */
  retryable: boolean;
}

export interface WizardState {
  /** 0-based index into `WIZARD_STEPS`. */
  step: number;
  data: WizardData;
  /** Per-field errors for the current step. */
  errors: FieldErrors;
  /** Steps the user has completed at least once (drives Review edit links). */
  visited: number[];
  submit: SubmitPhase;
  failure: SubmitFailure | null;
}

export interface StepDef {
  id: string;
  title: string;
  subLabel: string;
  heading: string;
  intro: string;
}

/**
 * The five steps. Headings no longer carry a numeric prefix — the compact
 * progress header communicates position (design spec §Copy). `subLabel` is
 * retained as a short accessible description of each step's purpose.
 */
export const WIZARD_STEPS: StepDef[] = [
  {
    id: "service-location",
    title: "Service & location",
    subLabel: "Where did this happen?",
    heading: "Service & location",
    intro: "Tell us which service and where this experience happened.",
  },
  {
    id: "experience",
    title: "Experience details",
    subLabel: "What happened?",
    heading: "Experience details",
    intro: "Select everything that applies. This helps us group similar experiences.",
  },
  {
    id: "payments-visits",
    title: "Payments & visits",
    subLabel: "Money, time & visits",
    heading: "Payments & visits",
    intro: "Share the numbers you remember. Every field here is optional.",
  },
  {
    id: "description",
    title: "Description",
    subLabel: "Tell us more",
    heading: "Description",
    intro: "Describe what happened in your own words. Do not include personal information.",
  },
  {
    id: "review",
    title: "Review & submit",
    subLabel: "Review your report",
    heading: "Review & submit",
    intro: "Check your answers. You are anonymous — no personal information is required.",
  },
];

export const TOTAL_STEPS = WIZARD_STEPS.length;

/** "What happened" checkboxes, in board order. Context only — not submitted. */
export const ISSUE_OPTIONS: { value: string; label: string }[] = [
  { value: "took_longer", label: "Took longer than expected" },
  { value: "additional_payment", label: "Additional payment requested" },
  { value: "extra_documents", label: "Asked for extra documents" },
  { value: "multiple_visits", label: "Had to visit multiple times" },
  { value: "process_unclear", label: "Process was unclear" },
  { value: "other", label: "Other" },
];

export const SERVICE_TYPE_OPTIONS = [
  "New / first-time",
  "Renewal",
  "Correction / update",
  "Duplicate / reissue",
  "Other",
];

export const FREQUENCY_OPTIONS = [
  "Just once",
  "A few times",
  "Most times I dealt with this office",
  "Every time",
];

export type DelayUnit = "days" | "weeks" | "months";
export const DELAY_UNITS: DelayUnit[] = ["days", "weeks", "months"];

export type PeriodKey =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "3_6_months"
  | "6_12_months"
  | "over_year";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "In the last 3 months" },
  { value: "3_6_months", label: "3–6 months ago" },
  { value: "6_12_months", label: "6–12 months ago" },
  { value: "over_year", label: "More than a year ago" },
];

/** The single localStorage key the draft lives under. Versioned for safety. */
export const DRAFT_STORAGE_KEY = "rishwat:report-draft:v1";

/** The finished submission payload, plus a couple of context fields for review. */
export type SubmissionPayload = ReportSubmission;

/** Props every wizard step receives from the orchestrating client component. */
export interface StepProps {
  data: WizardData;
  errors: FieldErrors;
  geo: WizardGeo;
  /** Patch one or more fields (cascading resets are applied by the step). */
  set: (patch: Partial<WizardData>) => void;
  /** Toggle a checkbox in the Experience step's issue set. */
  toggleIssue: (value: string) => void;
}
