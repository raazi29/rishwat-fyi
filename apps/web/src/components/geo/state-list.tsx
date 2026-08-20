import Link from "next/link";

import type { StateGap } from "@/lib/api/types";
import { ArrowRightIcon } from "@/components/icons";
import { formatCount, formatInr, parseInr } from "@/lib/utils/format";

import { NotEnoughData } from "./not-enough-data";
import { RegionGroup } from "./region-group";
import { REGION_ORDER, regionLabel, regionOf, type Region } from "./regions";

/** Sort keys accepted by the /states index via `?sort=`. */
export type StateSort = "reports" | "amount" | "name";

export const STATE_SORTS: ReadonlyArray<{ key: StateSort; label: string }> = [
  { key: "reports", label: "Most reports" },
  { key: "amount", label: "Highest additional amount" },
  { key: "name", label: "A–Z" },
];

const VALID_SORTS = new Set<string>(STATE_SORTS.map((sort) => sort.key));

export function readStateSort(raw: string | string[] | undefined): StateSort {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && VALID_SORTS.has(value) ? (value as StateSort) : "reports";
}

function compare(a: StateGap, b: StateGap, sort: StateSort): number {
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "amount") {
    const av = parseInr(a.additional_amount_median);
    const bv = parseInr(b.additional_amount_median);
    if (av === null && bv === null) return b.report_count - a.report_count;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (bv !== av) return bv - av;
    return a.name.localeCompare(b.name);
  }
  if (b.report_count !== a.report_count) return b.report_count - a.report_count;
  return a.name.localeCompare(b.name);
}

/**
 * The state index: every state grouped by region, ordered inside each group by
 * the chosen sort. Each row links to the state page and shows its report count
 * and median additional amount (or the not-enough-data marker when the state is
 * below the publishing threshold — never a ₹0).
 */
export function StateList({ states, sort }: { states: readonly StateGap[]; sort: StateSort }) {
  const byRegion = new Map<Region, StateGap[]>();
  for (const state of states) {
    const region = regionOf(state.code);
    const bucket = byRegion.get(region);
    if (bucket) bucket.push(state);
    else byRegion.set(region, [state]);
  }

  const groups = REGION_ORDER.filter((region) => byRegion.has(region)).map((region) => ({
    region,
    states: [...(byRegion.get(region) ?? [])].sort((a, b) => compare(a, b, sort)),
  }));

  return (
    <div>
      {groups.map(({ region, states: regionStates }) => (
        <RegionGroup
          key={region}
          id={`region-${region.toLowerCase()}`}
          label={regionLabel(region)}
          meta={`${regionStates.length} ${regionStates.length === 1 ? "state" : "states"}`}
        >
          <ul className="divide-y divide-line-inner overflow-hidden rounded-lg border border-line bg-surface">
            {regionStates.map((state) => {
              const median = parseInr(state.additional_amount_median);
              return (
                <li key={state.code}>
                  <Link
                    href={`/states/${state.code}`}
                    className="group flex min-h-16 items-center justify-between gap-4 p-4 transition-colors duration-150 hover:bg-sunken"
                  >
                    <span className="min-w-0 font-medium text-ink transition-colors duration-150 group-hover:text-official-mid">
                      {state.name}
                    </span>
                    <span className="flex items-center gap-6">
                      <span className="text-right">
                        <span className="block text-micro uppercase tracking-[0.06em] text-ink-muted">
                          Reports
                        </span>
                        <span className="tabular text-body font-medium text-ink">
                          {formatCount(state.report_count)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-micro uppercase tracking-[0.06em] text-ink-muted">
                          Median additional
                        </span>
                        <span className="tabular text-body font-medium text-reported">
                          {median === null ? <NotEnoughData variant="text" /> : formatInr(median)}
                        </span>
                      </span>
                      <ArrowRightIcon
                        size={18}
                        className="hidden shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-official-mid sm:block"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </RegionGroup>
      ))}
    </div>
  );
}
