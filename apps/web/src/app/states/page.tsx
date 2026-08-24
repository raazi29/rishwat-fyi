import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Callout, NoticeStrip, Panel, SampleDataStrip } from "@/components/ui";
import { BreadcrumbJsonLd, CollectionPageJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { getStateGaps, listStates } from "@/lib/api";
import type { StateGap } from "@/lib/api/types";
import {
  STATE_SORTS,
  StateList,
  StateMetricMap,
  readStateSort,
} from "@/components/geo";
import { cn } from "@/lib/utils/cn";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "States",
  description:
    "Every state, ranked by the citizen-reported gap between official government fees and what people actually experienced. A higher reported gap means more reports of a gap, not proven wrongdoing.",
  alternates: { canonical: "/states" },
};

type RawParams = Record<string, string | string[] | undefined>;

/** Join the authoritative state list with the (sample) per-state gaps. */
function joinStates(states: { code: string; name: string }[], gaps: StateGap[]): StateGap[] {
  const byCode = new Map(gaps.map((gap) => [gap.code, gap]));
  return states.map(
    (state) =>
      byCode.get(state.code) ?? {
        code: state.code,
        name: state.name,
        additional_amount_median: null,
        report_count: 0,
        services_covered: 0,
        districts_covered: 0,
      },
  );
}

export default async function StatesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const sort = readStateSort(params.sort);

  const [statesSourced, gapsSourced] = await Promise.all([listStates(), getStateGaps()]);
  const rows = joinStates(statesSourced.data, gapsSourced.data);

  const sample = statesSourced.source === "sample" || gapsSourced.source === "sample";
  const sampleReason = gapsSourced.reason?.message ?? statesSourced.reason?.message;

  const collectionItems = rows.slice(0, 20).map((s) => ({ name: s.name, url: `/states/${s.code}` }));
  const faqItems = [
    {
      question: "What does the state ranking show?",
      answer: "States are ranked by the median additional amount citizens reported paying beyond the official fee. A higher number means more reports of a gap, not proven corruption.",
    },
    {
      question: "Why do some states show 'Not enough reports yet'?",
      answer: "Statistics publish only when a state cell has ≥3 reports from ≥2 distinct IP-hash buckets. Below that threshold the median is withheld and the count still shown.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "States", url: "/states" }]} />
      <CollectionPageJsonLd
        name="States"
        description="Every Indian state ranked by the citizen-reported gap between official government fees and what people actually experienced."
        url="/states"
        items={collectionItems}
      />
      <FaqJsonLd items={faqItems} />
      <Container>
      <div className="space-y-8 py-8 lg:py-10">
        <header className="prose-measure">
          <h1 className="font-serif text-h1 font-bold text-ink">States</h1>
          <p className="mt-2 text-body-lg text-ink-secondary">
            Every state we have reports for, with how many citizens reported and the median
            additional amount they described paying.
          </p>
        </header>

        {sample ? <SampleDataStrip reason={sampleReason} /> : null}

        <Panel className="p-5 lg:p-6" aria-labelledby="states-map-heading">
          <h2 id="states-map-heading" className="font-serif text-h2 font-bold text-ink">
            The gap at a glance
          </h2>
          <p className="mt-1 text-body text-ink-secondary">
            Coloured by median additional amount reported.
          </p>
          <div className="mt-4">
            <StateMetricMap
              states={rows}
              metric="amount"
              variant="panel"
              id="states-choropleth"
              listTitle="Top 5 states by reported gap"
            />
          </div>
        </Panel>

        <Callout tone="notice" title="How to read this ranking">
          A higher reported gap means more citizens reported a gap for that state — not a proven
          higher level of corruption. States with few reports may simply have fewer people who have
          filed so far.
        </Callout>

        <section aria-labelledby="states-list-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="states-list-heading" className="font-serif text-h2 font-bold text-ink">
              All states by region
            </h2>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Sort states by">
              <span className="mr-1 text-label text-ink-muted">Sort:</span>
              {STATE_SORTS.map((option) => {
                const active = option.key === sort;
                return (
                  <Link
                    key={option.key}
                    href={option.key === "reports" ? "/states" : `/states?sort=${option.key}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-md px-3 text-label font-medium transition-colors duration-150",
                      active
                        ? "bg-sage text-official-mid"
                        : "text-ink-secondary hover:bg-sunken hover:text-ink",
                    )}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <StateList states={rows} sort={sort} />

          <NoticeStrip />
        </section>
      </div>
      </Container>
    </>
  );
}
