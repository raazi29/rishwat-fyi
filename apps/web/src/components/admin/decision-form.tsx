"use client";

import { useActionState, useState } from "react";

import { Button, Callout, Field, RadioGroup, TextInput, Textarea, VerificationBadge, type RadioOption } from "@/components/ui";
import { AlertIcon, CheckCircleIcon } from "@/components/icons";
import type { ModerationAction, ReportStatus } from "@/lib/api";

import { decideAction, type DecisionState } from "./actions";

/**
 * The decision form. A radio group of the four moderation actions drives the
 * conditional requirements: `reason` is required for reject and withdraw;
 * `source_url` is required (and only shown) for acknowledge_officially, because
 * the API returns 400 without it. Client hints explain each rule; the server
 * action re-validates and, on failure, surfaces the API's exact message (for
 * example an illegal status transition).
 */

const ACTION_OPTIONS: RadioOption[] = [
  { value: "mark_validated", label: "Mark validated", description: "Basic spam and quality checks passed." },
  { value: "reject", label: "Reject", description: "Terminal. A reason is required." },
  {
    value: "acknowledge_officially",
    label: "Acknowledge officially",
    description: "Records a government source acknowledging the issue. A source URL is required.",
  },
  {
    value: "withdraw",
    label: "Withdraw",
    description: "Terminal. At the reporter's request or by process. A reason is required.",
  },
];

export function DecisionForm({ publicId, status }: { publicId: string; status: ReportStatus }) {
  const boundAction = decideAction.bind(null, publicId);
  const [state, formAction, pending] = useActionState<DecisionState, FormData>(boundAction, {
    status: "idle",
    message: null,
  });
  const [action, setAction] = useState<ModerationAction | "">("");

  const reasonRequired = action === "reject" || action === "withdraw";
  const sourceRequired = action === "acknowledge_officially";

  return (
    <section aria-labelledby="decision-heading" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="decision-heading" className="font-serif text-h2 font-bold text-ink">
          Decision
        </h2>
        <span className="flex items-center gap-2 text-label text-ink-muted">
          Current
          <VerificationBadge status={status} />
        </span>
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-5" noValidate>
        <RadioGroup
          name="action"
          legend="Action"
          options={ACTION_OPTIONS}
          value={action}
          onValueChange={(value) => setAction(value as ModerationAction)}
        />

        <Field
          label="Reason"
          htmlFor="decision-reason"
          required={reasonRequired}
          hint={
            reasonRequired
              ? "Required for reject and withdraw. Recorded in the moderation log."
              : "Optional. Recorded in the moderation log."
          }
        >
          {(control) => (
            <Textarea
              {...control}
              name="reason"
              rows={4}
              maxLength={1000}
              required={reasonRequired}
              placeholder="Explain this decision for the audit trail."
            />
          )}
        </Field>

        {sourceRequired ? (
          <Field
            label="Official source URL"
            htmlFor="decision-source"
            required
            hint="A government authority or official source acknowledging the issue. The API rejects this action without it."
          >
            {(control) => (
              <TextInput
                {...control}
                name="source_url"
                type="url"
                required
                placeholder="https://example.gov.in/acknowledgement"
              />
            )}
          </Field>
        ) : null}

        {state.status === "error" && state.message ? (
          <div role="alert">
            <Callout tone="reported" icon={<AlertIcon size={20} />} title="This decision was not applied">
              {state.message}
            </Callout>
          </div>
        ) : null}
        {state.status === "success" && state.message ? (
          <div role="status">
            <Callout tone="info" icon={<CheckCircleIcon size={20} />} title="Decision recorded">
              {state.message}
            </Callout>
          </div>
        ) : null}

        <div>
          <Button type="submit" loading={pending} loadingLabel={"Applying\u2026"} disabled={action === ""}>
            Apply decision
          </Button>
        </div>
      </form>
    </section>
  );
}
