import type { ReactNode } from "react";

import { Callout } from "@/components/ui";
import { ShieldCheckIcon } from "@/components/icons";
import { formatInr } from "@/lib/utils/format";

import type { StepProps } from "../wizard-types";
import { FREQUENCY_OPTIONS, ISSUE_OPTIONS, PERIOD_OPTIONS } from "../wizard-types";
import { parseMoney, resolveSelections } from "../wizard-logic";

function money(value: string): string | null {
  const parsed = parseMoney(value);
  return parsed === undefined || Number.isNaN(parsed) ? null : formatInr(parsed);
}

interface Row {
  label: string;
  value: ReactNode;
}

function ReviewGroup({
  title,
  step,
  rows,
  onEdit,
}: {
  title: string;
  step: number;
  rows: Row[];
  onEdit: (step: number) => void;
}) {
  const shown = rows.filter((row) => row.value !== null && row.value !== "");
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-inner px-4 py-3">
        <h3 className="font-sans text-h3 font-semibold text-ink">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="rounded-sm text-label font-medium text-official-mid underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-current"
        >
          Edit
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="px-4 py-3 text-label text-ink-muted">Nothing added.</p>
      ) : (
        <dl className="divide-y divide-line-inner">
          {shown.map((row) => (
            <div key={row.label} className="flex gap-4 px-4 py-2.5">
              <dt className="w-40 shrink-0 text-label text-ink-muted">{row.label}</dt>
              <dd className="min-w-0 flex-1 text-body text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/**
 * Step 5 — Review & Submit. A read-back of every answer grouped by the step
 * that owns it, each group with an Edit link back to that step. The submit
 * control lives in the wizard footer; here we restate anonymity one last time.
 */
export function StepReview({
  data,
  geo,
  goto,
  evidenceFile,
}: StepProps & { goto: (step: number) => void; evidenceFile: File | null }) {
  const sel = resolveSelections(data, geo);
  const department = geo.departments.find((d) => d.slug === data.departmentSlug)?.name ?? null;
  const period = PERIOD_OPTIONS.find((p) => p.value === data.period)?.label ?? null;
  const frequency = FREQUENCY_OPTIONS.includes(data.frequency) ? data.frequency : data.frequency || null;
  const issues = data.issues
    .map((value) => ISSUE_OPTIONS.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));

  const delay = data.delayValue.trim() ? `${data.delayValue.trim()} ${data.delayUnit}` : null;

  return (
    <div className="space-y-4">
      <ReviewGroup
        title="Service & location"
        step={0}
        onEdit={goto}
        rows={[
          { label: "Department", value: department },
          { label: "Service", value: sel.serviceName },
          { label: "Service type", value: data.serviceType || null },
          { label: "State", value: sel.stateName },
          { label: "District", value: sel.districtName },
          { label: "City / Office", value: sel.cityName },
          { label: "Specific office", value: data.office || null },
          { label: "When", value: period },
          { label: "How often", value: frequency },
        ]}
      />

      <ReviewGroup
        title="Experience"
        step={1}
        onEdit={goto}
        rows={[{ label: "What happened", value: issues.length ? issues.join(", ") : null }]}
      />

      <ReviewGroup
        title="Payments & visits"
        step={2}
        onEdit={goto}
        rows={[
          { label: "Official fee", value: money(data.officialFee) },
          { label: "Additional requested", value: money(data.additionalAmount) },
          { label: "Amount you paid", value: money(data.amountPaid) },
          { label: "Paid", value: data.paid ? "Yes" : null },
          { label: "Delay", value: delay },
          { label: "Visits", value: data.visits.trim() || null },
        ]}
      />

      <ReviewGroup
        title="Description"
        step={3}
        onEdit={goto}
        rows={[
          { label: "Your account", value: data.description.trim() || null },
          { label: "Evidence", value: evidenceFile ? evidenceFile.name : null },
        ]}
      />

      <Callout tone="official" icon={<ShieldCheckIcon size={20} />} title="You are anonymous">
        No personal information is required or stored. When you submit, you will receive a report ID
        and a one-time token to check its status later.
      </Callout>
    </div>
  );
}
