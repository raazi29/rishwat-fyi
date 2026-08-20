"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  decideReport,
  reviewEvidence,
  type ModerationAction,
  type ModerationDecision,
  type ReportStatus,
} from "@/lib/api";
import { readSession } from "@/lib/auth/session";
import { formatStatus } from "@/lib/utils/format";

/**
 * Server actions for the decision view. Both re-read the session on the server
 * (never trusting the client for auth), enforce the same conditional
 * requirements the UI shows, call the admin API, and revalidate the queue and
 * the report on success. Illegal transitions and other failures surface the
 * API's exact message — admin surfaces never fabricate a result.
 */

function isModerationAction(value: FormDataEntryValue | null): value is ModerationAction {
  return (
    value === "mark_validated" ||
    value === "reject" ||
    value === "acknowledge_officially" ||
    value === "withdraw"
  );
}

export interface DecisionState {
  status: "idle" | "success" | "error";
  message: string | null;
  newStatus?: ReportStatus;
}

export async function decideAction(
  publicId: string,
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const session = await readSession();
  if (!session) redirect("/admin/login");

  const action = formData.get("action");
  const reason = String(formData.get("reason") ?? "").trim();
  const sourceUrl = String(formData.get("source_url") ?? "").trim();

  if (!isModerationAction(action)) {
    return { status: "error", message: "Choose a decision to apply." };
  }
  if ((action === "reject" || action === "withdraw") && reason.length === 0) {
    return { status: "error", message: "A reason is required to reject or withdraw a report." };
  }
  if (reason.length > 1000) {
    return { status: "error", message: "The reason must be 1000 characters or fewer." };
  }
  if (action === "acknowledge_officially" && sourceUrl.length === 0) {
    return {
      status: "error",
      message:
        "A government source URL is required to acknowledge a report officially \u2014 the API rejects this action without one.",
    };
  }

  const decision: ModerationDecision = {
    public_id: publicId,
    action,
    ...(reason.length > 0 ? { reason } : {}),
    ...(action === "acknowledge_officially" ? { source_url: sourceUrl } : {}),
  };

  const result = await decideReport(session.token, decision);
  if (!result.ok) {
    if (result.error.code === "unauthorized") redirect("/admin/login");
    return { status: "error", message: result.error.message };
  }

  revalidatePath("/admin/queue");
  revalidatePath(`/admin/queue/${publicId}`);
  return {
    status: "success",
    message: `Decision recorded. The report is now ${formatStatus(result.data.status)}.`,
    newStatus: result.data.status,
  };
}

export interface EvidenceReviewState {
  status: "idle" | "success" | "error";
  message: string | null;
  evidenceId?: string;
  decision?: "accepted" | "rejected";
}

export async function reviewEvidenceAction(
  publicId: string,
  _previous: EvidenceReviewState,
  formData: FormData,
): Promise<EvidenceReviewState> {
  const session = await readSession();
  if (!session) redirect("/admin/login");

  const evidenceId = String(formData.get("evidence_id") ?? "").trim();
  const decision = formData.get("decision");
  const reason = String(formData.get("reason") ?? "").trim();

  if (evidenceId.length === 0) {
    return { status: "error", message: "This evidence file could not be identified." };
  }
  if (decision !== "accepted" && decision !== "rejected") {
    return { status: "error", message: "Choose whether to accept or reject this file." };
  }

  const result = await reviewEvidence(session.token, {
    evidence_id: evidenceId,
    status: decision,
    ...(reason.length > 0 ? { reason } : {}),
  });
  if (!result.ok) {
    if (result.error.code === "unauthorized") redirect("/admin/login");
    return { status: "error", message: result.error.message, evidenceId };
  }

  revalidatePath(`/admin/queue/${publicId}`);
  revalidatePath("/admin/queue");
  return { status: "success", message: `Evidence ${decision}.`, evidenceId, decision };
}
