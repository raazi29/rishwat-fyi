import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { formatCount, formatInr } from "@/lib/utils/format";

import { RegionGroup } from "./region-group";

/** A department row's derived summary (assembled by the /departments page). */
export interface DepartmentSummary {
  slug: string;
  name: string;
  category: string;
  serviceCount: number;
  reportCount: number;
  /** Official fee bounds in rupees across the department's services; `null` when every fee is slab-based. */
  feeMin: number | null;
  feeMax: number | null;
}

const CATEGORY_ORDER: readonly string[] = [
  "transport",
  "land",
  "revenue",
  "municipal",
  "police",
  "commerce",
];

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  land: "Land and property",
  revenue: "Food, civil supplies and revenue",
  municipal: "Municipal and urban services",
  police: "Police",
  commerce: "Commerce, taxes and travel",
};

function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ??
    category.replace(/[-_]/g, " ").replace(/^./, (character) => character.toUpperCase())
  );
}

function feeRange(department: DepartmentSummary): string {
  const { feeMin, feeMax } = department;
  if (feeMin === null || feeMax === null) return "Fee varies";
  return feeMin === feeMax ? formatInr(feeMin) : `${formatInr(feeMin)} – ${formatInr(feeMax)}`;
}

function RowFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-micro uppercase tracking-[0.06em] text-ink-muted">{label}</div>
      <div className="tabular text-body font-medium text-ink">{value}</div>
    </div>
  );
}

/**
 * The department index grouped by category. Each department is a row (not a
 * uniform icon card grid) showing its service count, official-fee range and
 * citizen report count, linking to the department page. Rows are ≥44px targets;
 * figures collapse under the name on the smallest screens.
 */
export function DepartmentGroupList({ departments }: { departments: readonly DepartmentSummary[] }) {
  const byCategory = new Map<string, DepartmentSummary[]>();
  for (const department of departments) {
    const bucket = byCategory.get(department.category);
    if (bucket) bucket.push(department);
    else byCategory.set(department.category, [department]);
  }

  const known = CATEGORY_ORDER.filter((category) => byCategory.has(category));
  const extra = [...byCategory.keys()].filter((category) => !CATEGORY_ORDER.includes(category)).sort();
  const categories = [...known, ...extra];

  return (
    <div>
      {categories.map((category) => {
        const group = byCategory.get(category) ?? [];
        return (
          <RegionGroup
            key={category}
            id={`category-${category}`}
            label={categoryLabel(category)}
            meta={`${group.length} ${group.length === 1 ? "department" : "departments"}`}
          >
            <ul className="divide-y divide-line-inner overflow-hidden rounded-lg border border-line bg-surface">
              {group.map((department) => (
                <li key={department.slug}>
                  <Link
                    href={`/departments/${department.slug}`}
                    className="group flex min-h-16 flex-col gap-3 p-4 transition-colors duration-150 hover:bg-sunken sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0 font-medium text-ink transition-colors duration-150 group-hover:text-official-mid">
                      {department.name}
                    </span>
                    <div className="flex items-center gap-6">
                      <RowFigure label="Services" value={formatCount(department.serviceCount)} />
                      <RowFigure label="Official fee" value={feeRange(department)} />
                      <RowFigure label="Reports" value={formatCount(department.reportCount)} />
                      <ArrowRightIcon
                        size={18}
                        className="hidden shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-official-mid sm:block"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </RegionGroup>
        );
      })}
    </div>
  );
}
