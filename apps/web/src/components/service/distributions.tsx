import type { ServiceDistributions } from "@/lib/api";
import { Card } from "@/components/ui";
import { DistributionChart, type DistributionBucket } from "@/components/charts";

/**
 * The reported timeline and additional-amount distributions from the service
 * board: hand-authored dual-series SVG bars (official behind, reported in
 * front), each with its own median chip and an accessible table fallback. Bars
 * are decorative; the numbers live in the chart's visually-hidden table.
 *
 * Shares arrive as fractions (0–1); we present them as whole-number percentages
 * so the y-axis reads 0–100 cleanly rather than showing floating-point ticks.
 */
function toPercent(buckets: DistributionBucket[]): DistributionBucket[] {
  return buckets.map((bucket) => ({
    label: bucket.label,
    ...(typeof bucket.official === "number" ? { official: Math.round(bucket.official * 100) } : {}),
    ...(typeof bucket.reported === "number" ? { reported: Math.round(bucket.reported * 100) } : {}),
  }));
}

export function DistributionsRow({
  distributions,
  timelineMedian,
  amountMedian,
  className,
}: {
  distributions: ServiceDistributions;
  timelineMedian: string;
  amountMedian: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card padded>
          <DistributionChart
            title="Timeline distribution"
            subtitle="Share of reports by processing time"
            buckets={toPercent(distributions.timeline_days)}
            primary="reported"
            median={timelineMedian}
            xLabel="Processing time (days)"
            officialLabel="Official"
            reportedLabel="Reported"
          />
        </Card>
        <Card padded>
          <DistributionChart
            title="Additional amount distribution"
            subtitle="Share of reports by amount over the official fee"
            buckets={toPercent(distributions.additional_amount_inr)}
            primary="reported"
            median={amountMedian}
            xLabel="Additional amount (₹)"
            officialLabel="Official"
            reportedLabel="Reported"
          />
        </Card>
      </div>
    </div>
  );
}
