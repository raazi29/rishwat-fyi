import type { CitizenAggregate, VerificationLevel } from "@/lib/api";
import { VERIFICATION_LADDER } from "@/lib/api";
import { ActionLink, Panel } from "@/components/ui";
import {
  ChartIcon,
  CheckCircleIcon,
  CheckIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { formatCount, formatPercent, formatStatus } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

import type { DerivedVerification } from "./service-data";

/**
 * The verification-status panel (DESIGN.md §Components: verification ladder).
 * Five nodes; the reached ones are filled official-green and connected, the
 * current level is named in serif, and the counts beneath are drawn ONLY from
 * what the API returns — report volume, independent contributors and the
 * corroboration rate. The confidence line is the ladder position itself, not an
 * invented score, and no evidence-backed count is fabricated.
 */

const LEVEL_DESCRIPTION: Record<VerificationLevel, string> = {
  submitted: "Received and awaiting review.",
  validated: "Passed basic quality checks.",
  corroborated: "Multiple independent reports show similar patterns.",
  evidence_backed: "Backed by reviewed supporting evidence.",
  officially_acknowledged: "Acknowledged by an official source.",
};

function Ladder({ reachedIndex }: { reachedIndex: number }) {
  const last = VERIFICATION_LADDER.length - 1;
  return (
    <ol className="flex items-start" aria-label="Verification ladder">
      {VERIFICATION_LADDER.map((status, index) => {
        const reached = index <= reachedIndex;
        return (
          <li
            key={status}
            aria-current={index === reachedIndex ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center last:flex-none"
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1",
                  index === 0 ? "opacity-0" : index <= reachedIndex ? "bg-official" : "bg-line",
                )}
              />
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  reached ? "border-official bg-official text-white" : "border-line bg-surface",
                )}
              >
                {reached ? <CheckIcon size={12} /> : null}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1",
                  index === last ? "opacity-0" : index < reachedIndex ? "bg-official" : "bg-line",
                )}
              />
            </div>
            {/* `text-micro` (the smallest step in the type scale) rather than an
                arbitrary sub-token size: it is the design system's defined floor,
                and `leading-tight` keeps a long two-word label like "Officially
                acknowledged" compact under a narrow ladder node. */}
            <span className="block w-full break-words px-0.5 text-center text-micro leading-tight text-ink-muted">
              {formatStatus(status)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CountRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-label text-ink-secondary">
        <span aria-hidden="true" className="text-ink-muted">
          {icon}
        </span>
        {label}
      </span>
      <span className="tabular text-label font-medium text-ink">{value}</span>
    </div>
  );
}

export function VerificationPanel({
  citizen,
  verification,
}: {
  citizen: CitizenAggregate;
  verification: DerivedVerification;
}) {
  const { level, reachedIndex } = verification;
  const levelName = level ? formatStatus(level) : "Collecting reports";
  const description = level
    ? LEVEL_DESCRIPTION[level]
    : "Not enough independent reports to publish figures yet.";

  return (
    <Panel className="flex flex-col p-6">
      <div className="flex items-center gap-2 text-label font-medium text-ink-muted">
        <span aria-hidden="true" className="text-official-mid">
          <ShieldCheckIcon size={18} />
        </span>
        Verification status
      </div>

      <h3 className="mt-2 font-serif text-h2 font-bold text-ink">{levelName}</h3>
      <p className="mt-1 text-label text-ink-secondary">{description}</p>

      <div className="mt-5">
        <Ladder reachedIndex={reachedIndex} />
      </div>

      <div className="mt-5 divide-y divide-line-inner border-t border-line-inner">
        <CountRow icon={<ChartIcon size={16} />} label="Reports" value={formatCount(citizen.report_count)} />
        <CountRow
          icon={<UsersIcon size={16} />}
          label="Independent contributors"
          value={formatCount(citizen.ip_bucket_count)}
        />
        <CountRow
          icon={<CheckCircleIcon size={16} />}
          label="Corroboration rate"
          value={citizen.published ? formatPercent(citizen.corroboration_rate) : "—"}
        />
        <CountRow
          icon={<ShieldIcon size={16} />}
          label="Confidence level"
          value={`Level ${reachedIndex + 1} of 5`}
        />
      </div>

      <ActionLink href="/methodology" className="mt-4">
        About our verification system
      </ActionLink>
    </Panel>
  );
}
