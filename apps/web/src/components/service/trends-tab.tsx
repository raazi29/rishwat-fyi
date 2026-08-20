import type { ServiceDistributions } from "@/lib/api";
import { Card, EmptyState } from "@/components/ui";
import { ChartIcon } from "@/components/icons";
import { TimelineChart, type TimelinePoint } from "@/components/charts";

import { DistributionsRow } from "./distributions";

/**
 * The Trends tab: a dual-series line of the official baseline against the
 * reported share across processing-time buckets, followed by the reported
 * distributions. Built from the same bucketed sample the Overview uses (the API
 * serves no time series yet); the caller renders the sample-data strip.
 */
export function TrendsTab({
  distributions,
  timelineMedian,
  amountMedian,
}: {
  distributions: ServiceDistributions | null;
  timelineMedian: string;
  amountMedian: string;
}) {
  if (!distributions) {
    return (
      <EmptyState
        icon={<ChartIcon />}
        title="No trend data yet"
        description="Reported trends appear once enough reports are published for this service."
        className="rounded-lg border border-line bg-surface"
      />
    );
  }

  const points: TimelinePoint[] = distributions.timeline_days.map((bucket) => ({
    label: bucket.label,
    official: Math.round(bucket.official * 100),
    reported: Math.round(bucket.reported * 100),
  }));

  return (
    <div className="space-y-6">
      <Card padded>
        <TimelineChart
          title="Reported vs official timeline"
          subtitle="Share of cases (%) by processing time"
          points={points}
          officialLabel="Official"
          reportedLabel="Reported"
          median={timelineMedian}
          xLabel="Processing time (days)"
        />
      </Card>
      <DistributionsRow distributions={distributions} timelineMedian={timelineMedian} amountMedian={amountMedian} />
    </div>
  );
}
