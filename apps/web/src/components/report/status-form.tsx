"use client";

import { useState, type FormEvent } from "react";

import { Button, ErrorState, Field, TextInput, VerificationBadge } from "@/components/ui";
import { AlertIcon, ArrowRightIcon } from "@/components/icons";
import { formatDateTime, formatStatus } from "@/lib/utils/format";

import { checkStatusAction } from "./actions";
import type { StatusActionResult } from "./action-types";
import { STATUS_COPY } from "./status-copy";
import { StatusLadder } from "./status-ladder";

export function StatusForm({ initialId = "" }: { initialId?: string }) {
  const [id, setId] = useState(initialId);
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<StatusActionResult | null>(null);

  const invalid = result && !result.ok && result.code === "invalid" ? result.message : null;

  const runCheck = async () => {
    setChecking(true);
    setResult(await checkStatusAction(id, token));
    setChecking(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runCheck();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Report ID" required htmlFor="status-id">
            <TextInput
              id="status-id"
              value={id}
              placeholder="R-xxxxxxxx"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={invalid ? true : undefined}
              onChange={(event) => setId(event.target.value)}
            />
          </Field>
          <Field label="One-time token" required htmlFor="status-token">
            <TextInput
              id="status-token"
              value={token}
              placeholder="The token shown when you submitted"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={invalid ? true : undefined}
              onChange={(event) => setToken(event.target.value)}
            />
          </Field>
        </div>

        {invalid ? (
          <p className="mt-3 flex items-start gap-1.5 text-label text-reported">
            <AlertIcon size={16} className="mt-px shrink-0" />
            <span>{invalid}</span>
          </p>
        ) : null}

        <div className="mt-5">
          <Button type="submit" variant="primary" loading={checking} loadingLabel="Checking…" iconTrailing={checking ? undefined : <ArrowRightIcon size={18} />}>
            Check status
          </Button>
        </div>
      </form>

      <div aria-live="polite" role="status">
        {result?.ok ? (
          <section aria-label="Report status" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-inner pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-body font-medium text-ink">{result.publicId}</span>
                <VerificationBadge status={result.status} />
              </div>
              <span className="text-label text-ink-muted">
                Status updated {formatDateTime(result.statusChangedAt)}
              </span>
            </div>

            <div className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div>
                <h2 className="font-serif text-h3 font-semibold text-ink">Where it is on the ladder</h2>
                <div className="mt-4">
                  <StatusLadder status={result.status} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="font-serif text-h3 font-semibold text-ink">
                    What &ldquo;{formatStatus(result.status)}&rdquo; means
                  </h2>
                  <p className="mt-1.5 text-body text-ink-secondary">{STATUS_COPY[result.status].meaning}</p>
                </div>
                <div>
                  <h2 className="font-serif text-h3 font-semibold text-ink">What happens next</h2>
                  <p className="mt-1.5 text-body text-ink-secondary">{STATUS_COPY[result.status].next}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {result && !result.ok && result.code === "not_found" ? (
          <div className="rounded-lg border border-line bg-surface">
            <ErrorState title="No matching report" description={result.message} />
          </div>
        ) : null}

        {result && !result.ok && result.code === "unreachable" ? (
          <div className="rounded-lg border border-line bg-surface">
            <ErrorState
              title="Status service unavailable"
              description={result.message}
              action={
                <Button type="button" variant="secondary" onClick={() => void runCheck()}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
