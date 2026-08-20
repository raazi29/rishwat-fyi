import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SampleDataStrip } from "@/components/ui";
import {
  GapSection,
  HomeHero,
  HowItWorks,
  OpenDataBand,
  PrinciplesStrip,
} from "@/components/home";
import { getPlatformTotals, getStateGaps } from "@/lib/api";

export const metadata: Metadata = {
  title: { absolute: "Rishwat.fyi — What should government cost you?" },
  description:
    "Search official government fees and timelines in India, and compare them with what citizens actually experience. Open, anonymised, citizen-reported public data.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [totals, stateGaps] = await Promise.all([getPlatformTotals(), getStateGaps()]);
  const usingSample = totals.source === "sample" || stateGaps.source === "sample";
  const sampleReason = totals.reason?.message ?? stateGaps.reason?.message;

  return (
    <Container>
      {/* One rhythm throughout: a dense passage earns a quiet one. The hero and
          the gap band are the two loud moments; process and principles are the
          quiet ones that follow. */}
      <div className="space-y-10 py-8 lg:space-y-16 lg:py-10">
        {usingSample ? <SampleDataStrip reason={sampleReason} /> : null}
        <HomeHero totals={totals.data} />
        <GapSection states={stateGaps.data} />
        <HowItWorks />
        <PrinciplesStrip />
        <OpenDataBand />
      </div>
    </Container>
  );
}
