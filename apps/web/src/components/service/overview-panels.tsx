import type { CitizenAggregate, ServiceDetail } from "@/lib/api";
import { ActionLink, Panel } from "@/components/ui";
import { ClockIcon, DocumentIcon, RupeeIcon, StampIcon, VisitsIcon } from "@/components/icons";
import {
  formatDays,
  formatInr,
  formatPercent,
  formatVisits,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * The OFFICIAL (As per government) and CITIZEN EXPERIENCE (Median reported)
 * overview panels — two halves of the paired-number thesis. Their headers use
 * the reserved `.column-label` pair (official green, reported red). Official
 * figures render in ink; citizen figures in reported red. A `null` median is
 * never rendered as a number: it reads "Not reported".
 */

function PanelRow({
  icon,
  label,
  value,
  note,
  tone = "official",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  tone?: "official" | "reported";
}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-official-mid">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-label text-ink-muted">{label}</div>
        <div
          className={cn(
            "tabular text-body-lg font-semibold leading-tight",
            tone === "reported" ? "text-reported" : "text-ink",
          )}
        >
          {value}
        </div>
        {note ? <div className="text-micro text-ink-muted">{note}</div> : null}
      </div>
    </div>
  );
}

export function OfficialPanel({ service }: { service: ServiceDetail }) {
  const feeVaries = service.official_fee_inr === null;
  const steps = service.process_steps.length;
  return (
    <Panel className="flex flex-col gap-4 p-6">
      <div className="column-label text-official-mid">
        Official <span className="font-normal normal-case tracking-normal text-ink-muted">(As per government)</span>
      </div>
      <PanelRow
        icon={<RupeeIcon size={20} />}
        label="Fee"
        value={feeVaries ? "Varies" : formatInr(service.official_fee_inr)}
        {...(feeVaries ? { note: "Slab / percentage based" } : {})}
      />
      <PanelRow
        icon={<ClockIcon size={20} />}
        label="Timeline"
        value={formatDays(service.official_timeline_days)}
      />
      <PanelRow
        icon={<DocumentIcon size={20} />}
        label="Documents"
        value={String(service.official_documents.length)}
      />
      <PanelRow
        icon={<StampIcon size={20} />}
        label="Defined procedure"
        value={steps > 0 ? `${steps} steps` : "—"}
      />
      <ActionLink href="?tab=about" className="mt-auto pt-1">
        View official process
      </ActionLink>
    </Panel>
  );
}

export function CitizenPanel({
  citizen,
  officialTimelineDays,
}: {
  citizen: CitizenAggregate;
  officialTimelineDays: number | null;
}) {
  const reportedTimeline =
    citizen.delay_median === null || officialTimelineDays === null
      ? null
      : officialTimelineDays + citizen.delay_median;

  const money = (value: string | null): string =>
    value === null ? "Not reported" : formatInr(value);
  const days = (value: number | null): string => (value === null ? "Not reported" : formatDays(value));
  const visits = (value: number | null): string =>
    value === null ? "Not reported" : formatVisits(value);

  return (
    <Panel className="flex flex-col gap-4 p-6">
      <div className="column-label text-reported">
        Citizen experience{" "}
        <span className="font-normal normal-case tracking-normal text-ink-muted">(Median reported)</span>
      </div>
      <PanelRow
        icon={<RupeeIcon size={20} />}
        label="Additional amount"
        value={money(citizen.extra_payment_median)}
        tone="reported"
      />
      <PanelRow
        icon={<ClockIcon size={20} />}
        label="Timeline (median)"
        value={days(reportedTimeline)}
        tone="reported"
      />
      <PanelRow
        icon={<VisitsIcon size={20} />}
        label="Visits (median)"
        value={visits(citizen.visits_avg)}
        tone="reported"
      />
      <PanelRow
        icon={<DocumentIcon size={20} />}
        label="Corroboration rate"
        value={citizen.corroboration_rate === null ? "Not reported" : formatPercent(citizen.corroboration_rate)}
      />
      <ActionLink href="/methodology" className="mt-auto pt-1">
        How we calculate these numbers
      </ActionLink>
    </Panel>
  );
}
