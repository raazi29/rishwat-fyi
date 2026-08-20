import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge, Callout, Figure, NoticeStrip, VerificationBadge } from "@/components/ui";
import { ArrowLeftIcon, EyeOffIcon, MapPinIcon } from "@/components/icons";
import { apiFetch, type PublicReport } from "@/lib/api";
import { AdminError } from "@/components/admin/admin-error";
import { AdminShell } from "@/components/admin/admin-shell";
import { DecisionForm } from "@/components/admin/decision-form";
import { EvidenceReviewList } from "@/components/admin/evidence-review-list";
import { requireSession } from "@/lib/auth/require-session";
import {
  formatDateTime,
  formatDays,
  formatInr,
  formatPeriod,
  formatVisits,
} from "@/lib/utils/format";

interface Params {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `Review ${publicId}`, robots: { index: false, follow: false } };
}

function BackToQueue() {
  return (
    <Link
      href="/admin/queue"
      className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-official-mid hover:text-official-deep"
    >
      <ArrowLeftIcon size={16} /> Back to queue
    </Link>
  );
}

export default async function QueueDetailPage({ params }: Params) {
  const session = await requireSession();
  const { publicId } = await params;

  // Fetched directly as an ApiResult (no sample fallback): a real 404 is a
  // 404, and any other failure becomes a real error with the API's message.
  const result = await apiFetch<PublicReport>(`/reports/${encodeURIComponent(publicId)}`, {
    revalidate: 0,
  });

  if (!result.ok) {
    if (result.error.code === "unauthorized") redirect("/admin/login");
    if (result.error.code === "not_found") notFound();
    return (
      <AdminShell session={session} active="queue">
        <BackToQueue />
        <div className="mt-6">
          <AdminError
            error={result.error}
            title="This report could not be loaded"
            retryHref={`/admin/queue/${publicId}`}
          />
        </div>
      </AdminShell>
    );
  }

  const report = result.data;
  const location = [report.district, report.state].filter(Boolean).join(", ");

  return (
    <AdminShell session={session} active="queue">
      <BackToQueue />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-h1 font-bold text-ink">{report.service.name}</h1>
        <VerificationBadge status={report.status} />
        {report.evidence.length > 0 ? (
          <Badge tone="evidence">{report.evidence.length} evidence</Badge>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-label text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPinIcon size={16} />
          {location || "Location not specified"}
        </span>
        <span>Experience during {formatPeriod(report.period_start, report.period_end)}</span>
        <span>Submitted {formatDateTime(report.submitted_at)}</span>
        <span className="font-mono text-ink-secondary">{report.public_id}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section
            aria-labelledby="reported-heading"
            className="rounded-lg border border-line bg-surface p-5 sm:p-6"
          >
            <h2 id="reported-heading" className="font-serif text-h2 font-bold text-ink">
              What was reported
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
              <Figure
                label="Official fee (reported)"
                value={formatInr(report.official_fee_reported_inr)}
                note="As stated by the reporter"
                tone="official"
              />
              <Figure
                label="Additional amount"
                value={formatInr(report.additional_amount_reported_inr)}
                note="Beyond the official fee"
                tone="reported"
              />
              <Figure
                label="Amount paid"
                value={formatInr(report.amount_paid_inr)}
                note={report.paid ? "Reporter says this was paid" : "Payment not confirmed"}
                tone="reported"
              />
              <Figure
                label="Delay"
                value={formatDays(report.delay_days)}
                note="Beyond the official timeline"
                tone="reported"
              />
              <Figure
                label="Visits"
                value={formatVisits(report.visits)}
                note="Office visits reported"
                tone="reported"
              />
            </div>
          </section>

          <section aria-labelledby="account-heading">
            <h2 id="account-heading" className="font-serif text-h2 font-bold text-ink">
              In the reporter&rsquo;s words
            </h2>
            <p className="prose-measure mt-3 whitespace-pre-line text-body text-ink-secondary">
              {report.description}
            </p>
            <Callout
              tone="notice"
              icon={<EyeOffIcon size={20} />}
              title="Server-redacted"
              className="mt-4 max-w-[68ch]"
            >
              This text is already redacted by the API. Any <span className="font-mono">[REDACTED]</span>{" "}
              marker is where personal detail was removed.
            </Callout>
          </section>

          <EvidenceReviewList
            publicId={report.public_id}
            evidence={report.evidence}
            reportStatus={report.status}
          />
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <DecisionForm publicId={report.public_id} status={report.status} />
        </div>
      </div>

      <NoticeStrip className="mt-8 max-w-[68ch]" />
    </AdminShell>
  );
}
