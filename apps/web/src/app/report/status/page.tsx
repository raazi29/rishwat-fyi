import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Breadcrumbs, Callout } from "@/components/ui";

import { StatusForm } from "@/components/report/status-form";

export const metadata: Metadata = {
  title: "Check report status",
  description:
    "Look up an anonymous report with its report ID and one-time token to see its verification status and what happens next.",
  alternates: { canonical: "/report/status" },
};

export default async function ReportStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const idParam = params.id;
  const initialId = typeof idParam === "string" ? idParam : "";

  return (
    <Container>
      <div className="mx-auto max-w-4xl py-8 lg:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Report", href: "/report" },
            { label: "Check status" },
          ]}
          className="mb-5"
        />

        <h1 className="font-serif text-h1 font-bold text-ink">Check your report status</h1>
        <p className="mt-2 max-w-[68ch] text-body-lg text-ink-secondary">
          Enter your report ID and the one-time token you received when you submitted. Together they
          show where your report is on the verification ladder.
        </p>

        <Callout tone="notice" title="Why a wrong token looks like an unknown ID" className="mt-6 max-w-[68ch]">
          For your safety, an incorrect token and an ID that does not exist return exactly the same
          result — by design, so no one can use this page to discover whether a report exists. Keep
          your token safe: it is shown only once and cannot be recovered.
        </Callout>

        <div className="mt-8">
          <StatusForm initialId={initialId} />
        </div>
      </div>
    </Container>
  );
}
