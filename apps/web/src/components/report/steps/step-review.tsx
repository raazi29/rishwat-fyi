import type { ReactNode } from "react";

import { Callout } from "@/components/ui";
import { AlertIcon, ShieldCheckIcon } from "@/components/icons";
import { formatInr } from "@/lib/utils/format";

import type { StepProps } from "../wizard-types";
import { FREQUENCY_OPTIONS, ISSUE_OPTIONS, PERIOD_OPTIONS } from "../wizard-types";
import { parseMoney, resolveSelections } from "../wizard-logic";
import { TURNSTILE_ENABLED, TurnstileWidget } from "../turnstile-widget";

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
  onTurnstileVerify,
  onTurnstileBlocked,
  turnstileResetKey,
  turnstileBlocked,
}: StepProps & {
  goto: (step: number) => void;
  evidenceFile: File | null;
  /** Receives the Turnstile token (or null when it clears/expires). */
  onTurnstileVerify: (token: string | null) => void;
  /** Called when Turnstile's script is blocked/unavailable, to show a fallback. */
  onTurnstileBlocked: () => void;
  /** Bumped by the wizard after a failed submit to force a fresh challenge. */
  turnstileResetKey: number;
  /** True once Turnstile is detected as blocked — renders the fallback notice. */
  turnstileBlocked: boolean;
}) {
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

      <Callout tone="notice" icon={<AlertIcon size={20} />} title="Save your one-time status token">
        The status token is shown only once, right after you submit. It cannot be recovered or
        resent, and it is the only way to check your report&rsquo;s status later — copy it somewhere
        safe when it appears.
      </Callout>

      {/* Turnstile CAPTCHA — only present when a site key is configured; the
          widget itself also renders nothing without one (graceful degradation).
          Sits last, directly above the Submit button in the wizard footer. */}
      {TURNSTILE_ENABLED ? (
        <section className="rounded-md border border-line bg-surface p-4">
          <h3 className="font-sans text-h3 font-semibold text-ink">Verify you&rsquo;re human</h3>
          <p className="mt-1 text-label text-ink-muted">
            A quick, privacy-friendly check from Cloudflare before you submit — no puzzles, no
            personal data.
          </p>
          <div className="mt-3">
            <TurnstileWidget
              onVerify={onTurnstileVerify}
              onBlocked={onTurnstileBlocked}
              resetKey={turnstileResetKey}
              action="report_submit"
            />
          </div>
          {turnstileBlocked ? (
            <Callout tone="notice" className="mt-3">
              <span className="font-semibold">Verification unavailable.</span>{" "}
              Your browser or network is blocking the security check. You can still submit — your
              report will go through additional review.
            </Callout>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
