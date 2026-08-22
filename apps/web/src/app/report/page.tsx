import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Breadcrumbs, SampleDataStrip } from "@/components/ui";

import { loadWizardGeo } from "@/components/report/geo-data";
import { TrustRail } from "@/components/report/trust-rail";
import { TipsRail } from "@/components/report/tips-rail";
import { CommitmentBand } from "@/components/report/commitment-band";
import { ReportWizard } from "@/components/report/report-wizard";

// Request-time rendering: the wizard's catalogue/geo comes from the API, a
// separate deployment not guaranteed reachable at build time. See app/page.tsx
// for the full rationale (build must not depend on a live API; caching applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share your experience",
  description:
    "Report your experience of a government service anonymously. No name, phone number, Aadhaar, PAN or address is ever asked. Help build open, verified public data.",
  alternates: { canonical: "/report" },
};

export default async function ReportPage() {
  const { geo, source, reason } = await loadWizardGeo();

  return (
    <Container>
      <div className="py-6 lg:py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Report experience" }]} className="mb-5" />

        {source === "sample" ? <SampleDataStrip reason={reason} className="mb-6" /> : null}

        {/* The wizard is first in the DOM so the page's h1 precedes the rails'
            headings and so a phone reader lands on the form, not the rails.
            Explicit column placement keeps the desktop order rail / form / tips. */}
        <div className="grid gap-8 xl:grid-cols-[288px_minmax(0,1fr)_264px]">
          <div className="xl:col-start-2 xl:row-start-1">
            <ReportWizard geo={geo} />
          </div>

          <aside
            aria-label="Your privacy and what you can report"
            className="xl:col-start-1 xl:row-start-1"
          >
            <TrustRail />
          </aside>

          <aside aria-label="Tips and anonymity" className="xl:col-start-3 xl:row-start-1">
            <TipsRail />
          </aside>
        </div>

        <div className="mt-8">
          <CommitmentBand />
        </div>
      </div>
    </Container>
  );
}
