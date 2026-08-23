import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Breadcrumbs, SampleDataStrip } from "@/components/ui";

import { loadWizardGeo } from "@/components/report/geo-data";
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
      {/* One centered report column (design spec §Page hierarchy): the rails are
          gone; the anonymity assurance now lives inline inside the wizard, so a
          screen reader still meets the h1 before any supporting content. */}
      <div className="mx-auto max-w-[800px] py-6 lg:py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Report experience" }]} className="mb-5" />

        {source === "sample" ? <SampleDataStrip reason={reason} className="mb-6" /> : null}

        <ReportWizard geo={geo} />
      </div>
    </Container>
  );
}
