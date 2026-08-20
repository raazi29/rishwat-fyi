import type { CitizenAggregate, ServiceDetail } from "@/lib/api";
import { Callout, Card, NoticeStrip, Panel, ThresholdEmptyState } from "@/components/ui";
import { IssueBars } from "@/components/charts";
import {
  formatDays,
  formatDaysDelta,
  formatInr,
  formatInrDelta,
  formatIssue,
  formatVisitsDelta,
  parseInr,
} from "@/lib/utils/format";

import { CitizenPanel, OfficialPanel } from "./overview-panels";
import { ClosingStrip } from "./closing-strip";
import { DistributionsRow } from "./distributions";
import { FrictionList } from "./friction-list";
import { GapPanel } from "./gap-panel";
import type { DerivedVerification, ServiceInsights } from "./service-data";
import { VerificationPanel } from "./verification-panel";

/**
 * The Overview tab. Four panels sit in one row ≥1200px, 2×2 ≥768px, stacked
 * below (DESIGN.md §Layout). When the cell is below the publishing threshold
 * the gap and citizen panels are replaced by a ThresholdEmptyState that states
 * the rule and what exists so far; the official and verification panels remain,
 * and no illustrative distributions are shown for an unpublished cell.
 */
export function OverviewTab({
  service,
  citizen,
  verification,
  notice,
  insights,
}: {
  service: ServiceDetail;
  citizen: CitizenAggregate;
  verification: DerivedVerification;
  notice: string;
  insights: ServiceInsights;
}) {
  const published = citizen.published;
  const reportHref = `/report?service=${encodeURIComponent(service.slug)}`;

  const reportedTimeline =
    citizen.delay_median !== null && service.official_timeline_days !== null
      ? service.official_timeline_days + citizen.delay_median
      : null;
  const visitsDelta =
    citizen.visits_avg !== null && service.official_visits !== null
      ? citizen.visits_avg - service.official_visits
      : null;

  const timelineMedian = reportedTimeline !== null ? formatDays(reportedTimeline) : "—";
  const amountMedian = citizen.extra_payment_median !== null ? formatInr(citizen.extra_payment_median) : "—";
  const hasInsights = published && (insights.distributions !== null || insights.friction.length > 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 min-[768px]:grid-cols-2 min-[1200px]:grid-cols-[1.05fr_1.15fr_1fr_1.15fr]">
        <OfficialPanel service={service} />
        {published ? (
          <>
            <GapPanel
              amount={{
                value: formatInrDelta(parseInr(citizen.extra_payment_median)),
                qualifier: "More than the official fee",
              }}
              timeline={{
                value: formatDaysDelta(citizen.delay_median),
                qualifier: "Longer than the official timeline",
              }}
              visits={{
                value: formatVisitsDelta(visitsDelta),
                qualifier: "More visits than official",
              }}
            />
            <CitizenPanel citizen={citizen} officialTimelineDays={service.official_timeline_days} />
          </>
        ) : (
          <Panel className="flex items-center justify-center p-4 min-[1200px]:col-span-2">
            <ThresholdEmptyState
              reportCount={citizen.report_count}
              reportHref={reportHref}
              subject={service.name}
            />
          </Panel>
        )}
        <VerificationPanel citizen={citizen} verification={verification} />
      </div>

      <NoticeStrip notice={notice} />

      {hasInsights ? (
        <div className="space-y-6">
          <Callout tone="info" title="Illustrative detail">
            The distribution and friction figures below are illustrative sample data — the API does
            not serve them live yet.
          </Callout>
          {insights.distributions ? (
            <DistributionsRow
              distributions={insights.distributions}
              timelineMedian={timelineMedian}
              amountMedian={amountMedian}
            />
          ) : null}
          {insights.friction.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card padded>
                <IssueBars
                  title="Common issues reported"
                  items={insights.friction.map((point) => ({
                    label: formatIssue(point.code),
                    ratio: point.share,
                  }))}
                  viewAllHref="?tab=reports"
                  viewAllLabel="View all issues"
                />
              </Card>
              <Card padded>
                <FrictionList title="Top friction points" items={insights.friction} />
              </Card>
            </div>
          ) : null}
        </div>
      ) : null}

      <ClosingStrip slug={service.slug} />
    </div>
  );
}
