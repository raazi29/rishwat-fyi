import { Divider, Panel, StatStrip, type StatItem } from "@/components/ui";
import type { AdminStatsOverview } from "@/lib/api";
import { formatCount, formatPercent } from "@/lib/utils/format";

/**
 * The platform overview from `GET /admin/stats/overview`. Rendered with the
 * StatStrip primitive — two rows of four so the eight measures stay readable
 * from 320px (2-up grid) to desktop (4-up row) without cramming eight cells
 * into a single line. Sans figures for Operate density, not the serif hero
 * treatment.
 */
export function StatsPanels({ overview }: { overview: AdminStatsOverview }) {
  const primary: StatItem[] = [
    { value: formatCount(overview.total_reports), label: "Total reports" },
    { value: formatCount(overview.published_reports), label: "Published" },
    { value: formatCount(overview.pending_review), label: "Pending review" },
    { value: formatCount(overview.rejected), label: "Rejected" },
  ];
  const secondary: StatItem[] = [
    { value: formatPercent(overview.corroboration_rate), label: "Corroboration rate" },
    { value: formatCount(overview.reports_last_7_days), label: "Reports (last 7 days)" },
    { value: formatCount(overview.states_covered), label: "States covered" },
    { value: formatCount(overview.services_covered), label: "Services covered" },
  ];

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="sr-only">
        Platform overview
      </h2>
      <Panel className="p-5 sm:p-6">
        <StatStrip items={primary} serif={false} />
        <Divider className="my-5" />
        <StatStrip items={secondary} serif={false} />
      </Panel>
    </section>
  );
}
