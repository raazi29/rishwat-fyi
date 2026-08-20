import Link from "next/link";

import type { ComparisonRow } from "@/lib/api";
import { ArrowRightIcon } from "@/components/icons";
import { formatCount, formatDays, formatInr } from "@/lib/utils/format";

/**
 * A department group on the /services index: a serif department heading over a
 * hairline-bordered card, one row per service. Each row links into the service
 * page and shows the official fee and timeline (ink) beside the citizen report
 * count. The whole row is a ≥44px link target; figures are tabular and right
 * aligned. Numbers stack under the name below the `sm` breakpoint.
 */

function RowFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-micro uppercase tracking-[0.06em] text-ink-muted">{label}</div>
      <div className="tabular text-body font-medium text-ink">{value}</div>
    </div>
  );
}

export function ServiceGroup({
  department,
  rows,
  headingId,
}: {
  department: string;
  rows: ComparisonRow[];
  headingId: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="mt-8 first:mt-0">
      <h2 id={headingId} className="mb-3 font-serif text-h2 font-bold text-ink">
        {department}
      </h2>
      <ul className="divide-y divide-line-inner overflow-hidden rounded-lg border border-line bg-surface">
        {rows.map((row) => (
          <li key={row.slug}>
            <Link
              href={`/services/${row.slug}`}
              className="group flex min-h-16 flex-col gap-3 p-4 transition-colors duration-150 hover:bg-sunken sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 font-medium text-ink transition-colors duration-150 group-hover:text-official-mid">
                {row.name}
              </span>
              <div className="flex items-center gap-6">
                <RowFigure label="Official fee" value={formatInr(row.official.fee_inr)} />
                <RowFigure label="Timeline" value={formatDays(row.official.timeline_days)} />
                <RowFigure label="Reports" value={formatCount(row.report_count)} />
                <ArrowRightIcon
                  size={18}
                  className="hidden shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-official-mid sm:block"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
