/**
 * Per-step and whole-payload validation for the report wizard.
 *
 * The field rules come straight from `@rishwat/validation` so the client and the
 * API never disagree: money via `inrSchema`, dates via `dateSchema`, and the
 * final Review step runs the complete `reportSubmissionSchema`. Errors are
 * surfaced through `Field`'s `error` prop (icon + message, never colour alone).
 */

import { dateSchema, inrSchema, reportSubmissionSchema } from "@rishwat/validation";

import type { ReportSubmission } from "@/lib/api/types";
import { buildPayload, parseIntField, parseMoney, resolvePeriod, toDelayDays } from "./wizard-logic";
import type { FieldErrors, WizardData, WizardGeo } from "./wizard-types";

const MAX_DELAY_DAYS = 3650;
const MAX_VISITS = 50;

function moneyError(value: string, label: string): string | undefined {
  const n = parseMoney(value);
  if (n === undefined) return undefined;
  if (Number.isNaN(n)) return `Enter ${label} as a number, e.g. 1000.`;
  if (!inrSchema.safeParse(n).success) return `${label} must be between ₹0 and ₹1,00,00,000.`;
  return undefined;
}

/** Validate one step, returning field-keyed messages (empty object = valid). */
export function validateStep(step: number, data: WizardData, geo: WizardGeo): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 0) return validateServiceLocation(data, geo);
  if (step === 1) {
    if (data.issues.length === 0) errors.issues = "Select at least one option, or choose \u201cOther\u201d.";
    return errors;
  }
  if (step === 2) return validatePayments(data);
  if (step === 3) {
    const text = data.description.trim();
    if (text.length < 30) {
      errors.description = `Add a little more \u2014 at least 30 characters (${text.length} so far).`;
    } else if (text.length > 5000) {
      errors.description = "Please keep the description under 5000 characters.";
    }
    return errors;
  }
  return errors;
}

function validateServiceLocation(data: WizardData, geo: WizardGeo): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.departmentSlug) errors.departmentSlug = "Choose the department or ministry.";
  if (!data.serviceSlug) {
    errors.serviceSlug = "Choose the service this experience was about.";
  } else if (!geo.services.some((s) => s.slug === data.serviceSlug)) {
    errors.serviceSlug = "Choose a service from the list.";
  }
  if (!data.stateCode) {
    errors.stateCode = "Choose a state.";
  } else if (!geo.states.some((s) => s.code === data.stateCode)) {
    errors.stateCode = "Choose a state from the list.";
  }
  if (!data.districtId) {
    errors.districtId = "Choose a district.";
  } else if (data.stateCode) {
    // The chosen district must belong to the chosen state.
    const districts = geo.districtsByState[data.stateCode] ?? [];
    if (!districts.some((d) => d.id === data.districtId)) {
      errors.districtId = "Choose a district in the selected state.";
    }
  }
  // City is optional — but a nonempty city must belong to the chosen district.
  if (data.cityId && data.districtId) {
    const cities = geo.citiesByDistrict[data.districtId] ?? [];
    if (!cities.some((c) => c.id === data.cityId)) {
      errors.cityId = "Choose a city in the selected district.";
    }
  }
  if (!data.period) {
    errors.period = "Tell us roughly when this happened.";
  } else {
    const { start, end } = resolvePeriod(data.period);
    if (!dateSchema.safeParse(start).success || !dateSchema.safeParse(end).success || end < start) {
      errors.period = "That period could not be used. Choose another.";
    }
  }
  // Frequency is optional context — never a blocking requirement.
  return errors;
}

function validatePayments(data: WizardData): FieldErrors {
  const errors: FieldErrors = {};
  const fee = moneyError(data.officialFee, "the official fee");
  if (fee) errors.officialFee = fee;
  const add = moneyError(data.additionalAmount, "the additional amount");
  if (add) errors.additionalAmount = add;
  const paid = moneyError(data.amountPaid, "the amount you paid");
  if (paid) errors.amountPaid = paid;

  const delay = toDelayDays(data.delayValue, data.delayUnit);
  if (delay !== undefined) {
    if (Number.isNaN(delay) || !Number.isInteger(delay) || delay < 0) {
      errors.delayValue = "Enter the delay as a whole number.";
    } else if (delay > MAX_DELAY_DAYS) {
      errors.delayValue = "That delay looks too large. Check the number and unit.";
    }
  }
  const visits = parseIntField(data.visits);
  if (visits !== undefined) {
    if (Number.isNaN(visits) || !Number.isInteger(visits) || visits < 1) {
      errors.visits = "Enter the number of visits as a whole number (1 or more).";
    } else if (visits > MAX_VISITS) {
      errors.visits = "That is an unusually high number of visits. Please check it.";
    }
  }
  return errors;
}

/** Map a zod path from the full-schema Review parse back to a wizard field. */
export function fieldForSchemaPath(path: string): keyof WizardData | null {
  switch (path) {
    case "service_id":
    case "service_slug":
      return "serviceSlug";
    case "state_id":
      return "stateCode";
    case "district_id":
      return "districtId";
    case "period_start":
    case "period_end":
      return "period";
    case "official_fee_reported_inr":
      return "officialFee";
    case "additional_amount_reported_inr":
      return "additionalAmount";
    case "amount_paid_inr":
      return "amountPaid";
    case "delay_days":
      return "delayValue";
    case "visits":
      return "visits";
    case "description":
      return "description";
    default:
      return null;
  }
}

const STEP_ONE_FIELDS: (keyof WizardData)[] = [
  "departmentSlug",
  "serviceSlug",
  "serviceType",
  "stateCode",
  "districtId",
  "cityId",
  "office",
  "period",
  "frequency",
];
const STEP_THREE_FIELDS: (keyof WizardData)[] = [
  "officialFee",
  "additionalAmount",
  "amountPaid",
  "paid",
  "delayValue",
  "delayUnit",
  "visits",
];

/** Which step owns a given field, so an error can send the user to the right place. */
export function stepForField(field: keyof WizardData): number {
  if (STEP_ONE_FIELDS.includes(field)) return 0;
  if (field === "issues") return 1;
  if (STEP_THREE_FIELDS.includes(field)) return 2;
  return 3;
}

/** Run the authoritative schema over the assembled payload before submitting. */
export function validatePayload(
  data: WizardData,
  geo: WizardGeo,
): { ok: true; payload: ReportSubmission } | { ok: false; errors: FieldErrors } {
  const payload = buildPayload(data, geo);
  if (!payload) {
    return { ok: false, errors: { serviceSlug: "Some required details are missing. Review step 1." } };
  }
  const result = reportSubmissionSchema.safeParse(payload);
  if (result.success) return { ok: true, payload };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = typeof issue.path[0] === "string" ? fieldForSchemaPath(issue.path[0]) : null;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  if (Object.keys(errors).length === 0) errors.description = "Please review your answers and try again.";
  return { ok: false, errors };
}
