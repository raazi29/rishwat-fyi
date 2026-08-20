import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SampleDataStrip } from "@/components/ui";
import { getPublicReport } from "@/lib/api";

import { PublicReportView } from "@/components/report/public-report-view";

interface Params {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { publicId } = await params;
  return {
    title: `Report ${publicId}`,
    description: "A single anonymised citizen report and its verification status.",
    // Individual reports are never indexed.
    robots: { index: false, follow: false },
  };
}

export default async function PublicReportPage({ params }: Params) {
  const { publicId } = await params;
  const result = await getPublicReport(publicId);
  if (!result) notFound();

  return (
    <Container>
      <div className="py-8 lg:py-10">
        {result.source === "sample" ? (
          <SampleDataStrip reason={result.reason?.message} className="mb-6" />
        ) : null}
        <PublicReportView report={result.data} />
      </div>
    </Container>
  );
}
