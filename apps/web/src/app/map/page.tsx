import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { NoticeStrip, Panel, SampleDataStrip } from "@/components/ui";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { getStateGaps } from "@/lib/api";
import {
  MetricSwitcher,
  StateMetricMap,
  StateTable,
  rankStates,
  readStateMetric,
  stateMetricConfig,
} from "@/components/geo";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Map: government-service gaps across India",
  description:
    "Explore how the gap between official government fees, timelines and visits and what citizens report varies across Indian states. Colour the map by reported additional amount or by report volume.",
  alternates: { canonical: "/map" },
};

type RawParams = Record<string, string | string[] | undefined>;

const METRIC_SUBTITLE: Record<string, string> = {
  amount: "Each state is coloured by the median additional amount citizens reported.",
  reports: "Each state is coloured by how many citizen reports it has.",
  delay: "A per-state median delay is not part of the published data yet.",
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const metric = readStateMetric(params.metric);
  const gapsSourced = await getStateGaps();
  const states = gapsSourced.data;
  const ranked = rankStates(states, metric);
  const config = stateMetricConfig(metric);

  const faqItems = [
    {
      question: "What does the map show?",
      answer: "Where citizens reported paying more, waiting longer, or making more visits than the official procedure specifies, coloured by median additional amount or report volume per state.",
    },
    {
      question: "What does the map not show?",
      answer: "It does not rank corruption. A higher gap means more reports of a gap, not proof of wrongdoing. States with few reports show 'Not enough reports yet', never a zero.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Map", url: "/map" }]} />
      <FaqJsonLd items={faqItems} />
      <Container>
      <div className="space-y-8 py-8 lg:py-10">
        <header className="prose-measure">
          <h1 className="font-serif text-h1 font-bold text-ink">
            The gap, across <span className="text-official-mid">India</span>
          </h1>
          <p className="mt-2 text-body-lg text-ink-secondary">
            Is the same government service materially different in two states? This map compares the
            official procedure with what citizens reported, state by state.
          </p>
        </header>

        {gapsSourced.source === "sample" ? (
          <SampleDataStrip reason={gapsSourced.reason?.message} />
        ) : null}

        <section aria-labelledby="map-heading" className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="map-heading" className="font-serif text-h2 font-bold text-ink">
                Where are the biggest gaps?
              </h2>
              <p className="mt-1 text-body text-ink-secondary">{METRIC_SUBTITLE[metric]}</p>
            </div>
            <MetricSwitcher current={metric} />
          </div>

          <Panel className="p-5 lg:p-6">
            <StateMetricMap
              states={states}
              metric={metric}
              variant="full"
              viewAllHref="/states"
              id="map-explorer"
              listTitle={`States by ${config.shortLabel.toLowerCase()}`}
            />
          </Panel>
        </section>

        <WhatThisShows />

        <section aria-labelledby="ranked-heading" className="space-y-4">
          <div>
            <h2 id="ranked-heading" className="font-serif text-h2 font-bold text-ink">
              All states, ranked
            </h2>
            <p className="mt-1 max-w-[68ch] text-body text-ink-secondary">
              Ordered by {config.label.toLowerCase()}. A higher reported gap means more reports of a
              gap — not a proven higher level of corruption. States below the publishing threshold
              show “Not enough reports yet”, never a zero.
            </p>
          </div>

          <StateTable rows={ranked} />

          <p className="text-label text-ink-muted">
            Median delay is not yet aggregated per state; reported delays are shown on each service
            page. Open a state to see its districts and top services.
          </p>

          <NoticeStrip />
        </section>
      </div>
      </Container>
    </>
  );
}

function WhatThisShows() {
  return (
    <Panel className="p-5 lg:p-6" aria-labelledby="map-explainer-heading">
      <h2 id="map-explainer-heading" className="font-serif text-h2 font-bold text-ink">
        What this map shows — and what it does not
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-label font-semibold text-official-mid">What it shows</h3>
          <ul className="mt-2 space-y-2 text-body text-ink-secondary">
            <li>
              Where citizens reported paying more, waiting longer, or making more visits than the
              official procedure specifies.
            </li>
            <li>
              The median additional amount reported per state, computed only from published citizen
              reports.
            </li>
            <li>Which states have enough independent reports to publish a figure at all.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-label font-semibold text-ink">What it does not show</h3>
          <ul className="mt-2 space-y-2 text-body text-ink-secondary">
            <li>
              A ranking of corruption. More reports of a gap is not proof of wrongdoing, and low
              coverage is not proof of its absence.
            </li>
            <li>
              Anything about states with too few reports — they read “Not enough reports yet”, not a
              low score.
            </li>
            <li>Individual officials or offices. Rishwat.fyi measures patterns, never people.</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}
