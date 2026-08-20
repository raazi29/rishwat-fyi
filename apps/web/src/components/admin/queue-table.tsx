import Link from "next/link";

import { Badge, NumericTd, RowLink, TableShell, Td, THead, Th, VerificationBadge } from "@/components/ui";
import type { QueueItem } from "@/lib/api";
import { formatDate, formatDays, formatInr, formatVisits } from "@/lib/utils/format";

/**
 * The moderation queue table. Columns match the review contract: report id
 * (mono) · service · district/state · submitted · amounts · delay · visits ·
 * evidence · duplicate flag · status · review. Dense table on desktop; below
 * 900px each row becomes a card whose full redacted description expands inline
 * via `<details>`. On desktop the "Review" link opens the full decision view —
 * the contract's permitted alternative to inline expansion. Reported amounts
 * carry the citizen-reported red; counts stay neutral (DESIGN.md §Colors).
 */

function detailHref(publicId: string): string {
  return `/admin/queue/${encodeURIComponent(publicId)}`;
}

function DuplicateFlag({ groupId }: { groupId: string | null }) {
  if (!groupId) {
    return <span className="text-ink-muted">&mdash;</span>;
  }
  return (
    <Badge tone="neutral" title={`Duplicate group ${groupId}`}>
      Duplicate
    </Badge>
  );
}

export function QueueTable({ items }: { items: QueueItem[] }) {
  const cards = (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.public_id} className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={detailHref(item.public_id)}
              className="font-mono text-label font-medium text-official-mid underline-offset-4 hover:underline"
            >
              {item.public_id}
            </Link>
            <VerificationBadge status={item.status} />
          </div>
          <p className="mt-2 text-body font-medium text-ink">{item.service_name}</p>
          <p className="text-label text-ink-muted">
            {item.district_name}, {item.state_name}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-label">
            <div>
              <dt className="text-ink-muted">Amount</dt>
              <dd className="tabular text-reported">{formatInr(item.additional_amount_reported_inr)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Delay</dt>
              <dd className="tabular text-ink">{formatDays(item.delay_days)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Visits</dt>
              <dd className="tabular text-ink">{formatVisits(item.visits)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Submitted</dt>
              <dd className="text-ink-secondary">{formatDate(item.submitted_at)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Evidence</dt>
              <dd className="tabular text-ink">{item.evidence_count}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Duplicate</dt>
              <dd>
                <DuplicateFlag groupId={item.duplicate_group_id} />
              </dd>
            </div>
          </dl>
          <details className="mt-3 border-t border-line-inner pt-3">
            <summary className="min-h-11 cursor-pointer list-none py-1 text-label font-medium text-official-mid">
              Show full report
            </summary>
            <p className="mt-2 whitespace-pre-line text-label text-ink-secondary">{item.description}</p>
          </details>
          <div className="mt-2">
            <Link
              href={detailHref(item.public_id)}
              className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-official-mid hover:text-official-deep"
            >
              Review <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <TableShell ariaLabel="Moderation queue" cards={cards}>
      <THead>
        <tr>
          <Th>Report ID</Th>
          <Th>Service</Th>
          <Th>District, State</Th>
          <Th>Submitted</Th>
          <Th numeric>Amount</Th>
          <Th numeric>Delay</Th>
          <Th numeric>Visits</Th>
          <Th numeric>Evidence</Th>
          <Th>Duplicate</Th>
          <Th>Status</Th>
          <Th numeric>
            <span className="sr-only">Review</span>
          </Th>
        </tr>
      </THead>
      <tbody>
        {items.map((item) => (
          <tr key={item.public_id}>
            <Td className="align-top">
              <Link
                href={detailHref(item.public_id)}
                className="font-mono text-label font-medium text-official-mid underline-offset-4 hover:underline"
              >
                {item.public_id}
              </Link>
            </Td>
            <Td className="align-top">{item.service_name}</Td>
            <Td className="align-top">
              <span className="text-ink">{item.district_name}</span>
              <span className="block text-label text-ink-muted">{item.state_name}</span>
            </Td>
            <Td className="align-top text-ink-secondary">{formatDate(item.submitted_at)}</Td>
            <NumericTd tone="reported" className="align-top">
              {formatInr(item.additional_amount_reported_inr)}
            </NumericTd>
            <NumericTd className="align-top">{formatDays(item.delay_days)}</NumericTd>
            <NumericTd className="align-top">{formatVisits(item.visits)}</NumericTd>
            <NumericTd className="align-top">{item.evidence_count}</NumericTd>
            <Td className="align-top">
              <DuplicateFlag groupId={item.duplicate_group_id} />
            </Td>
            <Td className="align-top">
              <VerificationBadge status={item.status} />
            </Td>
            <RowLink href={detailHref(item.public_id)} label={`Review report ${item.public_id}`} />
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
