import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyState, Pagination, ResultCount } from "@/components/ui";
import { DocumentIcon } from "@/components/icons";
import { getQueue, type ReportStatus } from "@/lib/api";
import { AdminError } from "@/components/admin/admin-error";
import { AdminShell } from "@/components/admin/admin-shell";
import { QueueFilters } from "@/components/admin/queue-filters";
import { QueueTable } from "@/components/admin/queue-table";
import { requireSession } from "@/lib/auth/require-session";
import { formatStatus } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Review queue" };

const PER_PAGE = 20;
const VALID_STATUSES: ReportStatus[] = [
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
  "rejected",
  "withdrawn",
];

type RawParams = Record<string, string | string[] | undefined>;

function parseStatus(raw: string | string[] | undefined): ReportStatus | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (VALID_STATUSES as string[]).includes(value)) {
    return value as ReportStatus;
  }
  return null;
}

function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export default async function QueuePage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const session = await requireSession();
  const params = await searchParams;
  const status = parseStatus(params.status);
  const page = parsePage(params.page);

  const result = await getQueue(session.token, {
    status: status ?? undefined,
    page,
    per_page: PER_PAGE,
  });
  if (!result.ok && result.error.code === "unauthorized") {
    redirect("/admin/login");
  }

  return (
    <AdminShell session={session} active="queue">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-h1 font-bold text-ink">Review queue</h1>
          <p className="mt-1 text-body text-ink-secondary">
            Reports awaiting moderation, oldest first. Open a report to review its evidence and apply a
            decision.
          </p>
        </div>

        <QueueFilters current={status} />

        {result.ok ? (
          result.data.items.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface">
              <EmptyState
                icon={<DocumentIcon />}
                title="Nothing in this view"
                description={
                  status
                    ? `No reports currently have the status \u201C${formatStatus(status)}\u201D.`
                    : "There are no reports in the queue right now."
                }
              />
            </div>
          ) : (
            <>
              <QueueTable items={result.data.items} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ResultCount page={page} perPage={PER_PAGE} total={result.data.total} unit="report" />
                <Pagination
                  page={page}
                  totalPages={Math.max(1, Math.ceil(result.data.total / PER_PAGE))}
                  pathname="/admin/queue"
                  searchParams={status ? { status } : {}}
                />
              </div>
            </>
          )
        ) : (
          <AdminError error={result.error} title="The queue could not be loaded" retryHref="/admin/queue" />
        )}
      </div>
    </AdminShell>
  );
}
