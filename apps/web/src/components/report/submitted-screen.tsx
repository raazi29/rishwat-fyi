"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  ButtonLink,
  Callout,
  CopyButton,
  EmptyState,
  IconTile,
  SampleDataStrip,
  Skeleton,
} from "@/components/ui";
import {
  CalendarIcon,
  CheckIcon,
  DocumentIcon,
  LockIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { formatDateTime } from "@/lib/utils/format";

import { loadReceipt, type ReportReceipt } from "./report-receipt";
import { SubmittedTimeline } from "./submitted-timeline";
import { StatusCheckInline } from "./status-check-inline";

export function SubmittedScreen({ sampleReceipt }: { sampleReceipt: ReportReceipt | null }) {
  const [mounted, setMounted] = useState(false);
  const [receipt, setReceipt] = useState<ReportReceipt | null>(null);

  useEffect(() => {
    setReceipt(loadReceipt());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-[28rem] w-full" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
    );
  }

  const active = receipt ?? sampleReceipt;

  if (!active) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <EmptyState
          icon={<DocumentIcon />}
          title="No recent submission to show"
          description="This page shows your confirmation right after you submit a report. If you have already submitted one, look it up with your report ID and one-time token."
          action={
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/report" variant="primary">
                File a report
              </ButtonLink>
              <ButtonLink href="/report/status" variant="secondary">
                Check a report status
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const isSample = active.sample === true;

  return (
    <div className="space-y-8">
      {isSample ? (
        <SampleDataStrip reason="no report was actually submitted — this is a sample confirmation shown because the API was unavailable" />
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
          <div className="text-center">
            <span className="relative mx-auto inline-flex size-16 items-center justify-center rounded-full bg-official-soft/15 text-official">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-official-soft text-white">
                <CheckIcon size={28} />
              </span>
            </span>
            <h1 className="mt-4 font-serif text-h1 font-bold text-ink">
              Thank you for sharing your experience!
            </h1>
            <p className="mt-2 text-body text-ink-secondary">
              Your report has been submitted successfully.
              <br className="hidden sm:block" /> Every report helps build a more transparent India.
            </p>
          </div>

          <IdTokenPanel publicId={active.publicId} token={active.token} />

          <MetaStrip receipt={active} />

          <Callout tone="info" className="mt-6">
            <span className="font-semibold">Your report is now under review.</span> We will process
            it as per our verification system.
          </Callout>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="next-heading" className="rounded-lg border border-line bg-surface p-6">
            <h2 id="next-heading" className="font-serif text-h2 font-bold text-ink">
              What happens next?
            </h2>
            <div className="mt-5">
              <SubmittedTimeline status={active.status} />
            </div>
          </section>

          <section aria-labelledby="check-heading" className="rounded-lg border border-line bg-surface p-6">
            <h2 id="check-heading" className="font-sans text-h3 font-semibold text-ink">
              Check your report status anytime
            </h2>
            <p className="mt-1 text-label text-ink-secondary">
              Enter your report ID to see the latest update.
            </p>
            <div className="mt-3">
              <StatusCheckInline />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function IdTokenPanel({ publicId, token }: { publicId: string; token: string }) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-sunken p-5">
      <p className="text-center text-label text-ink-muted">Your report ID</p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="font-mono text-figure font-semibold tracking-tight text-ink">{publicId}</span>
        <CopyButton value={publicId} label="Copy" showLabel={false} />
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-label text-ink-secondary">
        <ShieldCheckIcon size={16} className="text-official-mid" />
        Save this ID. You can use it to check the status of your report.
      </p>

      <div className="mt-4 rounded-md border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label font-medium text-ink">One-time status token</span>
          <CopyButton value={token} label="Copy" />
        </div>
        <p className="mt-1.5 break-all font-mono text-label text-ink">{token}</p>
        <p className="mt-2 flex items-start gap-1.5 text-label text-reported">
          <LockIcon size={16} className="mt-px shrink-0" />
          <span>
            This token is shown only once and cannot be recovered. Save it now — you need both the
            ID and this token to check your report&rsquo;s status.
          </span>
        </p>
      </div>
    </div>
  );
}

function MetaStrip({ receipt }: { receipt: ReportReceipt }) {
  const service = receipt.serviceName
    ? receipt.serviceType
      ? `${receipt.serviceName} (${receipt.serviceType})`
      : receipt.serviceName
    : "—";
  const items: { icon: ReactNode; label: string; value: ReactNode }[] = [
    { icon: <CalendarIcon size={18} />, label: "Submitted on", value: formatDateTime(receipt.submittedAt) },
    { icon: <DocumentIcon size={18} />, label: "Service", value: service },
    { icon: <MapPinIcon size={18} />, label: "Location", value: receipt.location ?? "—" },
    {
      icon: <ShieldCheckIcon size={18} />,
      label: "Privacy",
      value: (
        <>
          100% Anonymous
          <span className="block text-micro text-ink-muted">No personal data collected</span>
        </>
      ),
    },
  ];
  return (
    <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <IconTile>{item.icon}</IconTile>
          <div className="min-w-0">
            <dt className="text-label text-ink-muted">{item.label}</dt>
            <dd className="text-body font-medium text-ink">{item.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
