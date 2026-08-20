import type { ComparisonRow } from "@/lib/api";
import { parseInr } from "@/lib/utils/format";

/** Next 15 search-params shape. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export type SortKey = "relevance" | "reports" | "amount" | "delay";

const SORT_KEYS: readonly SortKey[] = ["relevance", "reports", "amount", "delay"];

export interface ReadSearch {
  q: string;
  department: string;
  state: string;
  district: string;
  city: string;
  sort: SortKey;
  page: number;
  location: string;
}

/** First value of a possibly-repeated query param, trimmed. */
function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}

function toSort(value: string): SortKey {
  return (SORT_KEYS as readonly string[]).includes(value) ? (value as SortKey) : "relevance";
}

function toPage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Read and normalise the raw search params into typed values. */
export function readSearch(params: RawSearchParams): ReadSearch {
  return {
    q: first(params.q),
    department: first(params.department),
    state: first(params.state),
    district: first(params.district),
    city: first(params.city),
    sort: toSort(first(params.sort)),
    page: toPage(first(params.page)),
    location: first(params.location),
  };
}

/** A human location label from resolved state/district. */
export function locationText(state: string, district: string): string {
  return [district, state].filter(Boolean).join(", ");
}

/** Sort rows in place-safe copy by the chosen key (nulls always last). */
export function sortRows(rows: ComparisonRow[], sort: SortKey): ComparisonRow[] {
  const copy = [...rows];
  const desc = (a: number | null, b: number | null): number => {
    if (a === null && b === null) return 0;
    if (a === null) return 1; // nulls last
    if (b === null) return -1; // nulls last
    return b - a;
  };
  switch (sort) {
    case "reports":
      return copy.sort((a, b) => b.report_count - a.report_count);
    case "amount":
      return copy.sort((a, b) =>
        desc(parseInr(a.reported.additional_amount_inr), parseInr(b.reported.additional_amount_inr)),
      );
    case "delay":
      return copy.sort((a, b) => desc(a.reported.timeline_days, b.reported.timeline_days));
    case "relevance":
    default:
      return copy;
  }
}
