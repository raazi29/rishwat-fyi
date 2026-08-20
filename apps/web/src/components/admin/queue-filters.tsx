import Link from "next/link";

import type { ReportStatus } from "@/lib/api";
import { formatStatus } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Status filter for the queue. Plain server-rendered links that set `?status=`
 * (and reset paging by omitting `page`), so filtering needs no client JS. The
 * active filter is highlighted and marked `aria-current`.
 */

const STATUSES: ReportStatus[] = [
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
  "rejected",
  "withdrawn",
];

export function QueueFilters({ current }: { current: ReportStatus | null }) {
  const options: Array<{ label: string; status: ReportStatus | null }> = [
    { label: "All", status: null },
    ...STATUSES.map((status) => ({ label: formatStatus(status), status })),
  ];

  return (
    <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.status === current;
        const href = option.status ? `/admin/queue?status=${option.status}` : "/admin/queue";
        return (
          <Link
            key={option.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-label font-medium transition-colors duration-150",
              active
                ? "border-official bg-sage text-official-mid"
                : "border-line bg-surface text-ink-secondary hover:bg-sunken hover:text-ink",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
