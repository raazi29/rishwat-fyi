/**
 * Pure helpers for the report wizard: value coercion, period-preset → date
 * resolution, submission-payload assembly, and localStorage draft persistence.
 * No React, no side effects beyond the explicitly-named storage functions.
 */

import type { ReportSubmission } from "@/lib/api/types";
import { EMPTY_DATA } from "./wizard-reducer";
import { DRAFT_STORAGE_KEY, type PeriodKey, type WizardData, type WizardGeo } from "./wizard-types";

/* --- Value coercion ----------------------------------------------------- */

/** Parse a rupee text field to a 2-decimal number; `undefined` if blank, `NaN` if junk. */
export function parseMoney(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100) / 100;
}

/** Convert the delay number + unit into whole days; `undefined` if blank. */
export function toDelayDays(value: string, unit: WizardData["delayUnit"]): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return Number.NaN;
  const factor = unit === "weeks" ? 7 : unit === "months" ? 30 : 1;
  return Math.round(n * factor);
}

/** Parse a whole-number text field; `undefined` if blank, `NaN` if junk. */
export function parseIntField(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}

/* --- Period presets → concrete dates ------------------------------------ */

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resolve a period preset to `{ start, end }` (YYYY-MM-DD), always in the past. */
export function resolvePeriod(key: PeriodKey, now: Date = new Date()): { start: string; end: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };
  switch (key) {
    case "this_month":
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: isoDate(today) };
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: isoDate(start), end: isoDate(end) };
    }
    case "last_3_months":
      return { start: isoDate(daysAgo(90)), end: isoDate(today) };
    case "3_6_months":
      return { start: isoDate(daysAgo(180)), end: isoDate(daysAgo(90)) };
    case "6_12_months":
      return { start: isoDate(daysAgo(365)), end: isoDate(daysAgo(180)) };
    case "over_year":
      return { start: isoDate(daysAgo(760)), end: isoDate(daysAgo(366)) };
    default:
      return { start: isoDate(today), end: isoDate(today) };
  }
}

/* --- Selection + payload assembly --------------------------------------- */

export interface ResolvedSelections {
  serviceId: string | null;
  /** Public slug — the identifier `POST /reports` actually resolves against. */
  serviceSlug: string | null;
  serviceName: string | null;
  stateId: string | null;
  stateName: string | null;
  districtId: string | null;
  districtName: string | null;
  cityName: string | null;
}

/** Turn the string selections into the named/id'd records the payload needs. */
export function resolveSelections(data: WizardData, geo: WizardGeo): ResolvedSelections {
  const service = geo.services.find((s) => s.slug === data.serviceSlug) ?? null;
  const state = geo.states.find((s) => s.code === data.stateCode) ?? null;
  const districts = data.stateCode ? geo.districtsByState[data.stateCode] ?? [] : [];
  const district = districts.find((d) => d.id === data.districtId) ?? null;
  const cities = data.districtId ? geo.citiesByDistrict[data.districtId] ?? [] : [];
  const city = cities.find((c) => c.id === data.cityId) ?? null;
  return {
    serviceId: service?.id ?? null,
    serviceSlug: service?.slug ?? null,
    serviceName: service?.name ?? null,
    stateId: state?.id ?? null,
    stateName: state?.name ?? null,
    districtId: district?.id ?? null,
    districtName: district?.name ?? null,
    cityName: city?.name ?? null,
  };
}

/**
 * Drop selections that no longer exist in the current catalogue/geography, so a
 * rehydrated draft can never carry a stale service, state, district, or city
 * into validation or the payload. Runs on hydrate (before the reducer sees the
 * draft) and is a pure, order-independent projection of `data` onto `geo`:
 *
 * - A department that is gone is cleared (the service list is then unfiltered).
 * - A service that is gone is cleared; a service that still exists but whose
 *   department no longer matches the chosen department clears the *department*
 *   filter rather than the valid service.
 * - A missing state clears the state, its district, and its city (cascade).
 * - A district that does not belong to the surviving state is cleared with its
 *   city; a city that does not belong to the surviving district is cleared.
 *
 * It reads only the fields it prunes, so a v1 draft missing newer fields (merged
 * over `EMPTY_DATA` by `loadDraft`) is handled without special-casing.
 */
export function pruneStaleSelections(data: WizardData, geo: WizardGeo): WizardData {
  const next: WizardData = { ...data };

  if (next.departmentSlug && !geo.departments.some((d) => d.slug === next.departmentSlug)) {
    next.departmentSlug = "";
  }

  if (next.serviceSlug) {
    const service = geo.services.find((s) => s.slug === next.serviceSlug);
    if (!service) {
      next.serviceSlug = "";
    } else if (next.departmentSlug && service.departmentSlug !== next.departmentSlug) {
      // The service is real but no longer sits under the chosen department;
      // keep the service and drop the (now inconsistent) department filter.
      next.departmentSlug = "";
    }
  }

  if (next.stateCode && !geo.states.some((s) => s.code === next.stateCode)) {
    next.stateCode = "";
    next.districtId = "";
    next.cityId = "";
  }

  if (next.districtId) {
    const districts = next.stateCode ? geo.districtsByState[next.stateCode] ?? [] : [];
    if (!districts.some((d) => d.id === next.districtId)) {
      next.districtId = "";
      next.cityId = "";
    }
  }

  if (next.cityId) {
    const cities = next.districtId ? geo.citiesByDistrict[next.districtId] ?? [] : [];
    if (!cities.some((c) => c.id === next.cityId)) {
      next.cityId = "";
    }
  }

  return next;
}

/** Build the exact `POST /reports` body. `null` if a required id is still missing. */
export function buildPayload(data: WizardData, geo: WizardGeo): ReportSubmission | null {
  const sel = resolveSelections(data, geo);
  // The service is identified by slug, never by the catalogue's local id: the
  // wizard's ServiceOption.id is a slug-derived placeholder that is stable
  // across online/offline rendering but is NOT the database uuid, so sending it
  // as `service_id` would fail the API's foreign-key check on every submission.
  // `POST /reports` accepts exactly one of service_id / service_slug and
  // resolves the slug server-side.
  const serviceSlug = sel.serviceSlug;
  if (!serviceSlug || !sel.stateId || !sel.districtId || data.period === "") return null;
  const { start, end } = resolvePeriod(data.period);

  const payload: ReportSubmission = {
    service_slug: serviceSlug,
    state_id: sel.stateId,
    district_id: sel.districtId,
    period_start: start,
    period_end: end,
    paid: data.paid,
    description: data.description.trim(),
  };

  const officialFee = parseMoney(data.officialFee);
  if (officialFee !== undefined && Number.isFinite(officialFee)) payload.official_fee_reported_inr = officialFee;
  const additional = parseMoney(data.additionalAmount);
  if (additional !== undefined && Number.isFinite(additional)) payload.additional_amount_reported_inr = additional;
  const paidAmount = parseMoney(data.amountPaid);
  if (paidAmount !== undefined && Number.isFinite(paidAmount)) payload.amount_paid_inr = paidAmount;
  const delay = toDelayDays(data.delayValue, data.delayUnit);
  if (delay !== undefined && Number.isFinite(delay)) payload.delay_days = delay;
  const visits = parseIntField(data.visits);
  if (visits !== undefined && Number.isFinite(visits)) payload.visits = visits;
  return payload;
}

/* --- Draft persistence (one namespaced localStorage key) ----------------- */

interface StoredDraft {
  step: number;
  data: WizardData;
  savedAt: string;
}

export function saveDraft(data: WizardData, step: number): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = { step, data, savedAt: new Date().toISOString() };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* Storage may be unavailable (private mode, quota). Draft is best-effort. */
  }
}

export function loadDraft(): { data: WizardData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    const step = typeof parsed.step === "number" ? parsed.step : 0;
    return { data: { ...EMPTY_DATA, ...parsed.data }, step };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** True when the user has entered anything worth preserving. */
export function draftHasContent(data: WizardData): boolean {
  return (
    data.serviceSlug !== "" ||
    data.stateCode !== "" ||
    data.issues.length > 0 ||
    data.description.trim() !== "" ||
    data.officialFee !== "" ||
    data.additionalAmount !== "" ||
    data.amountPaid !== ""
  );
}
