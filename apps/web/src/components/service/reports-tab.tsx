import type { PublicReport } from "@/lib/api";
import { ActionLink, Card, EmptyState, VerificationBadge } from "@/components/ui";
import { UsersIcon } from "@/components/icons";
import { formatDays, formatInr, formatPeriod, formatVisits } from "@/lib/utils/format";

/**
 * The Reports tab: recent public reports for this service. Each shows the
 * reporting period, the reported quantities (in the citizen-reported red
 * channel), the server-redacted description and the report's verification
 * badge, and links to the full public report view. Descriptions are rendered
 * exactly as the API returns them — never un-redacted.
 */

function ReportFigure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-micro uppercase tracking-[0.06em] text-ink-muted">{label}</div>
      <div className="tabular text-body font-semibold text-reported">{value}</div>
    </div>
  );
}

export function ReportsTab({ reports, reportHref }: { reports: PublicReport[]; reportHref: string }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon />}
        title="No public reports yet"
        description="No reports for this service have been published yet. Published reports appear here once they clear review."
        className="rounded-lg border border-line bg-surface"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {reports.map((report) => (
        <li key={report.public_id}>
          <Card padded className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-label text-ink-secondary">
                {formatPeriod(report.period_start, report.period_end)} · {report.district}, {report.state}
              </span>
              <VerificationBadge status={report.status} />
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <ReportFigure label="Additional amount" value={formatInr(report.additional_amount_reported_inr)} />
              <ReportFigure label="Delay" value={formatDays(report.delay_days)} />
              <ReportFigure label="Visits" value={formatVisits(report.visits)} />
            </div>

            <p className="max-w-[68ch] text-body text-ink-secondary">{report.description}</p>

            <ActionLink href={`${reportHref}/${report.public_id}`}>View report</ActionLink>
          </Card>
        </li>
      ))}
    </ul>
  );
}
