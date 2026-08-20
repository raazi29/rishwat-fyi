"use client";

import { useActionState } from "react";

import { Badge, Button, Callout, IconTile, Textarea, type BadgeTone } from "@/components/ui";
import { AlertIcon, CheckCircleIcon, DocumentIcon } from "@/components/icons";
import type { EvidenceMeta, ReportStatus } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

import { reviewEvidenceAction, type EvidenceReviewState } from "./actions";

/**
 * Evidence review. Each file gets an accept/reject form (two submit buttons
 * carrying the decision, plus an optional note) wired to `reviewEvidence`.
 * Accepting a file on a validated report promotes the report to
 * evidence-backed — stated up front so the reviewer knows the consequence.
 */

type EvidenceAction = (
  previous: EvidenceReviewState,
  formData: FormData,
) => Promise<EvidenceReviewState>;

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

const STATUS_TONE: Record<EvidenceMeta["status"], BadgeTone> = {
  pending_review: "neutral",
  accepted: "sage",
  rejected: "neutral",
};

const STATUS_LABEL: Record<EvidenceMeta["status"], string> = {
  pending_review: "Pending review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function EvidenceRow({ item, action }: { item: EvidenceMeta; action: EvidenceAction }) {
  const [state, formAction, pending] = useActionState<EvidenceReviewState, FormData>(action, {
    status: "idle",
    message: null,
  });

  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <IconTile>
          <DocumentIcon size={18} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-body font-medium text-ink">{evidenceKind(item.mime_type)}</span>
            <span className="text-label text-ink-muted">{evidenceSize(item.size_bytes)}</span>
            <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
          </div>
          <p className="mt-1 font-mono text-micro text-ink-muted">{item.id}</p>
          <p className="mt-1 text-label text-ink-muted">
            Private file, reviewed here only. Auto-deleted on {formatDate(item.retention_until)}.
          </p>

          <form action={formAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="evidence_id" value={item.id} />
            <Textarea
              name="reason"
              rows={2}
              maxLength={1000}
              showCount={false}
              placeholder="Optional note (recorded in the review log)"
              aria-label={`Review note for evidence ${item.id}`}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" name="decision" value="accepted" variant="primary" size="md" disabled={pending}>
                Accept
              </Button>
              <Button type="submit" name="decision" value="rejected" variant="secondary" size="md" disabled={pending}>
                Reject
              </Button>
            </div>
          </form>

          {state.status === "error" && state.message ? (
            <div role="alert" className="mt-2">
              <Callout tone="reported" icon={<AlertIcon size={18} />}>
                {state.message}
              </Callout>
            </div>
          ) : null}
          {state.status === "success" && state.message ? (
            <div role="status" className="mt-2">
              <Callout tone="info" icon={<CheckCircleIcon size={18} />}>
                {state.message}
              </Callout>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function EvidenceReviewList({
  publicId,
  evidence,
  reportStatus,
}: {
  publicId: string;
  evidence: EvidenceMeta[];
  reportStatus: ReportStatus;
}) {
  const boundAction = reviewEvidenceAction.bind(null, publicId);

  return (
    <section aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className="font-serif text-h2 font-bold text-ink">
        Evidence review
      </h2>
      <Callout tone="info" className="mt-3 max-w-[68ch]" title="Accepting evidence can promote the report">
        Accepting an evidence file on a validated report promotes it to evidence-backed
        {reportStatus === "validated"
          ? " — this report is validated now, so accepting a file will promote it."
          : "."}
      </Callout>

      {evidence.length === 0 ? (
        <p className="mt-3 text-body text-ink-secondary">No evidence was attached to this report.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} action={boundAction} />
          ))}
        </ul>
      )}
    </section>
  );
}
