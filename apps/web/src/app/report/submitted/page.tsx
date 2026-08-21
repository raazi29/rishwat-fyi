import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { sampleFallbackAllowed } from "@/lib/api";
import { sampleSubmissionResponse } from "@/lib/fixtures";

import { SubmittedScreen } from "@/components/report/submitted-screen";
import { HowYouCanHelp, ClosingBand } from "@/components/report/submitted-extras";
import type { ReportReceipt } from "@/components/report/report-receipt";

export const metadata: Metadata = {
  title: "Report submitted",
  description: "Your anonymous report has been submitted. Save your report ID and one-time token.",
  // A personal confirmation tied to a one-time token — never indexed.
  robots: { index: false, follow: false },
};

/**
 * A clearly-labelled sample confirmation for previewing the screen when the API
 * is unavailable (no report is ever actually submitted in that case). The real
 * flow reads the just-submitted receipt from sessionStorage instead.
 */
function buildSampleReceipt(): ReportReceipt | null {
  if (!sampleFallbackAllowed()) return null;
  return {
    publicId: sampleSubmissionResponse.public_id,
    token: sampleSubmissionResponse.token,
    status: sampleSubmissionResponse.status,
    submittedAt: "2026-08-20T06:12:00.000Z",
    serviceName: "Driving Licence",
    serviceType: "New / first-time",
    location: "Varanasi, Uttar Pradesh",
    sample: true,
  };
}

export default function ReportSubmittedPage() {
  return (
    <Container>
      <div className="space-y-8 py-8 lg:py-10">
        <SubmittedScreen sampleReceipt={buildSampleReceipt()} />
        <HowYouCanHelp />
        <ClosingBand />
      </div>
    </Container>
  );
}
