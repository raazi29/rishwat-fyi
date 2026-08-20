import { Breadcrumbs, Callout, Figure, IconTile, NoticeStrip, VerificationBadge } from "@/components/ui";
import { DocumentIcon, EyeOffIcon, MapPinIcon } from "@/components/icons";
import type { EvidenceMeta, PublicReport } from "@/lib/api/types";
import { formatDate, formatDays, formatInr, formatPeriod, formatVisits } from "@/lib/utils/format";

function evidenceKind(mime: string): string {
  if (mime === "application/pdf") return "PDF document";
  if (mime.startsWith("image/")) return `${mime.slice("image/".length).toUpperCase()} image`;
  return "File";
}

function evidenceSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EVIDENCE_STATUS_LABEL: Record<EvidenceMeta["status"], string> = {
  pending_review: "Pending review",
  accepted: "Accepted",
  rejected: "Rejected",
};

/**
 * The public view of a single citizen report. Every figure here is
 * citizen-reported (this is a report, not an official aggregate): the additional
 * amount, amount paid, delay and visits render in the reported channel; the
 * reporter's stated official fee is a neutral reference. The description is
 * already server-redacted, evidence is shown as metadata only (never a download
 * link), and the mandatory notice appears verbatim.
 */
export function PublicReportView({ report }: { report: PublicReport }) {
  const location = [report.district, report.state].filter(Boolean).join(", ");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Reports" },
          { label: report.public_id },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-h1 font-bold text-ink">{report.service.name}</h1>
            <VerificationBadge status={report.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-label text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon size={16} />
              {location || "Location not specified"}
            </span>
            <span>Experience during {formatPeriod(report.period_start, report.period_end)}</span>
            <span className="font-mono text-ink-secondary">{report.public_id}</span>
          </div>
        </div>
      </div>

      <section aria-labelledby="reported-heading" className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-6">
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
            label="Additional amount reported"
            value={formatInr(report.additional_amount_reported_inr)}
            note="Beyond the official fee"
            tone="reported"
          />
          <Figure
            label="Amount paid"
            value={formatInr(report.amount_paid_inr)}
            note={report.paid ? "Reporter says this was paid" : "Reported, payment not confirmed"}
            tone="reported"
          />
          <Figure label="Delay" value={formatDays(report.delay_days)} note="Beyond the official timeline" tone="reported" />
          <Figure label="Visits" value={formatVisits(report.visits)} note="Times the reporter had to go" tone="reported" />
        </div>
      </section>

      <section aria-labelledby="account-heading" className="mt-8">
        <h2 id="account-heading" className="font-serif text-h2 font-bold text-ink">
          In the reporter&rsquo;s words
        </h2>
        <p className="prose-measure mt-3 whitespace-pre-line text-body text-ink-secondary">
          {report.description}
        </p>
        <Callout tone="notice" icon={<EyeOffIcon size={20} />} title="Redacted for privacy" className="mt-4 max-w-[68ch]">
          Personal information is automatically removed from reports before they are shown. Any
          <span className="font-mono"> [REDACTED] </span>
          marker is where such detail was taken out.
        </Callout>
      </section>

      <section aria-labelledby="evidence-heading" className="mt-8">
        <h2 id="evidence-heading" className="font-serif text-h2 font-bold text-ink">
          Evidence
        </h2>
        {report.evidence.length === 0 ? (
          <p className="mt-2 text-body text-ink-secondary">No evidence was attached to this report.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {report.evidence.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
                <IconTile>
                  <DocumentIcon size={18} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-body font-medium text-ink">{evidenceKind(item.mime_type)}</span>
                    <span className="text-label text-ink-muted">{evidenceSize(item.size_bytes)}</span>
                    <span className="text-label text-ink-muted">· {EVIDENCE_STATUS_LABEL[item.status]}</span>
                  </div>
                  <p className="mt-1 text-label text-ink-muted">
                    Private — reviewed by a moderator, not downloadable here. Automatically deleted on{" "}
                    {formatDate(item.retention_until)}.
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NoticeStrip className="mt-8 max-w-[68ch]" />
    </div>
  );
}
