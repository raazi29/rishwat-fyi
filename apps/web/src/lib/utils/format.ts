/**
 * Display formatting. Money arrives from the API as a decimal string
 * ("1000.00") and is never converted to a float for arithmetic — only for
 * display, and only here.
 */

import type { Inr } from "@/lib/api/types";

const INR_GROUPS = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const INR_GROUPS_PAISE = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PLAIN = new Intl.NumberFormat("en-IN");

/** `"1000.00"` → `1000`. Returns `null` for absent or unparseable values. */
export function parseInr(value: Inr | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `"2000.00"` → `"₹2,000"`. Paise are shown only when non-zero. */
export function formatInr(value: Inr | number | null | undefined): string {
  const amount = typeof value === "number" ? value : parseInr(value ?? null);
  if (amount === null) return "—";
  const hasPaise = Math.abs(amount % 1) > 0.0001;
  return `₹${(hasPaise ? INR_GROUPS_PAISE : INR_GROUPS).format(amount)}`;
}

/** A signed delta, e.g. `"+ ₹2,000"`. Zero renders as `"No difference"`. */
export function formatInrDelta(value: Inr | number | null | undefined): string {
  const amount = typeof value === "number" ? value : parseInr(value ?? null);
  if (amount === null) return "—";
  if (Math.abs(amount) < 0.005) return "No difference";
  return `${amount > 0 ? "+ " : "− "}${formatInr(Math.abs(amount))}`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return PLAIN.format(value);
}

export function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "Same day";
  return `${PLAIN.format(value)} ${value === 1 ? "day" : "days"}`;
}

export function formatDaysDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "No difference";
  return `${value > 0 ? "+ " : "− "}${formatDays(Math.abs(value))}`;
}

/** Visit counts are averages: one decimal, and never "1.0 visits". */
export function formatVisits(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${label} ${rounded === 1 ? "visit" : "visits"}`;
}

export function formatVisitsDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.05) return "No difference";
  return `${value > 0 ? "+ " : "− "}${formatVisits(Math.abs(value))}`;
}

export function formatPercent(
  ratio: number | null | undefined,
  fractionDigits = 0,
): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

const DATE_LONG = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** `"2026-08-12"` → `"12 Aug 2026"`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_LONG.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

/** `"period_start"` style range → `"Apr 2026 – Jun 2026"`. */
export function formatPeriod(start: string, end: string): string {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "—";
  const month = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const a = month.format(from);
  const b = month.format(to);
  return a === b ? a : `${a} – ${b}`;
}

/**
 * Report issue codes are stored as snake_case enums; the UI shows the plain
 * sentence a citizen would recognise.
 */
const ISSUE_LABELS: Record<string, string> = {
  additional_payment_requested: "Additional payment requested",
  processing_delay: "Processing delay",
  unclear_documentation: "Unclear documentation",
  multiple_visits: "Multiple office visits",
  multiple_visits_required: "Multiple visits required",
  unclear_process: "Unclear process",
  middleman_involved: "Middleman involved",
  information_missing: "Information missing",
  extra_documents_requested: "Extra documents requested",
  other: "Other",
};

export function formatIssue(code: string): string {
  return (
    ISSUE_LABELS[code] ??
    code.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase())
  );
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  validated: "Validated",
  corroborated: "Corroborated",
  evidence_backed: "Evidence-backed",
  officially_acknowledged: "Officially acknowledged",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? formatIssue(status);
}

/** `"driving-licence"` → `"Driving Licence"`, for breadcrumb fallbacks only. */
export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
