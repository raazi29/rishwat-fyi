import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/container";
import {
  NoticeStrip,
  Panel,
  SampleDataStrip,
  SectionHeading,
  StatStrip,
  ThresholdEmptyState,
  type Crumb,
  type StatItem,
} from "@/components/ui";
import { CompassIcon, MapPinIcon, RupeeIcon, UsersIcon } from "@/components/icons";
import { getStateDetail } from "@/lib/api";
import { formatCount, formatInr } from "@/lib/utils/format";
import { DistrictList, NotEnoughData, StateServiceTable } from "@/components/geo";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const detail = await getStateDetail(code);
  if (!detail) return { title: "State not found" };
  const { state, gap } = detail.data;
  const median =
    gap.additional_amount_median !== null
      ? ` Median additional amount reported: ${formatInr(gap.additional_amount_median)}.`
      : "";
  return {
    title: state.name,
    description:
      `Government-service gaps reported by citizens in ${state.name}: ${formatCount(gap.report_count)} reports across ${formatCount(gap.services_covered)} services and ${formatCount(gap.districts_covered)} districts.${median}`.slice(
        0,
        300,
      ),
    alternates: { canonical: `/states/${state.code}` },
  };
}

export default async function StateDetailPage({ params }: { params: Params }) {
  const { code } = await params;
  const detail = await getStateDetail(code);
  if (!detail) notFound();

  const { state, gap, districts, top_services } = detail.data;
  const median = gap.additional_amount_median;
  const publishable = median !== null;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "States", href: "/states" },
    { label: state.name },
  ];

  const stats: StatItem[] = [
    { icon: <UsersIcon />, value: formatCount(gap.report_count), label: "Citizen reports" },
    { icon: <CompassIcon />, value: formatCount(gap.services_covered), label: "Services covered" },
    { icon: <MapPinIcon />, value: formatCount(gap.districts_covered), label: "Districts covered" },
    {
      icon: <RupeeIcon />,
      value: publishable ? formatInr(median) : <NotEnoughData />,
      label: "Median additional amount",
    },
  ];

  return (
    <Container>
      <PageHeader
        breadcrumbs={crumbs}
        title={state.name}
        subtitle={`How official government services compare with what citizens reported in ${state.name}.`}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <UsersIcon size={16} className="text-ink-muted" />
              {formatCount(gap.report_count)} citizen reports
            </span>
            <span>
              {formatCount(gap.services_covered)} services · {formatCount(gap.districts_covered)}{" "}
              districts
            </span>
          </>
        }
      />

      <div className="space-y-8 pb-10">
        {detail.source === "sample" ? <SampleDataStrip reason={detail.reason?.message} /> : null}

        <Panel className="p-5 lg:p-6">
          <StatStrip items={stats} />
        </Panel>

        <section aria-labelledby="state-services-heading">
          <SectionHeading id="state-services-heading">
            Services with the largest reported gaps
          </SectionHeading>
          {publishable && top_services.length > 0 ? (
            <StateServiceTable services={top_services} stateCode={state.code} />
          ) : (
            <div className="rounded-lg border border-line bg-surface">
              <ThresholdEmptyState reportCount={gap.report_count} subject={state.name} />
            </div>
          )}
        </section>

        <section aria-labelledby="state-districts-heading">
          <SectionHeading
            id="state-districts-heading"
            description="Open a district to compare official figures with citizen reports there."
          >
            Districts in {state.name}
          </SectionHeading>
          <DistrictList districts={districts} stateName={state.name} />
        </section>

        <NoticeStrip />
      </div>
    </Container>
  );
}
