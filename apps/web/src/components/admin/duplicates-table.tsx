import { Badge, EmptyState, NumericTd, TableShell, Td, THead, Th } from "@/components/ui";
import { DatabaseIcon } from "@/components/icons";
import type { DuplicateGroup } from "@/lib/api";
import { formatCount, formatDateTime, humanizeSlug } from "@/lib/utils/format";

/** First 8 characters of a group UUID, for a scannable mono label. */
function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}\u2026` : id;
}

/**
 * Duplicate groups from `GET /admin/stats/duplicates`. Reads as a dense table
 * on desktop and as cards below 900px (TableShell), never a horizontal scroll.
 */
export function DuplicatesTable({ groups }: { groups: DuplicateGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <EmptyState
          icon={<DatabaseIcon />}
          title="No duplicate groups"
          description="No reports are currently grouped as likely duplicates of one another."
        />
      </div>
    );
  }

  const cards = (
    <ul className="space-y-3">
      {groups.map((group) => (
        <li key={group.group_id} className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-label text-ink-secondary" title={group.group_id}>
              {shortId(group.group_id)}
            </span>
            <Badge tone="neutral">{formatCount(group.report_count)} reports</Badge>
          </div>
          <p className="mt-2 text-body font-medium text-ink">{humanizeSlug(group.service_slug)}</p>
          <p className="text-label text-ink-muted">{group.district_name}</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-label">
            <div>
              <dt className="text-ink-muted">Oldest</dt>
              <dd className="text-ink-secondary">{formatDateTime(group.oldest)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Newest</dt>
              <dd className="text-ink-secondary">{formatDateTime(group.newest)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );

  return (
    <TableShell ariaLabel="Duplicate report groups" cards={cards}>
      <THead>
        <tr>
          <Th>Group</Th>
          <Th numeric>Reports</Th>
          <Th>Service</Th>
          <Th>District</Th>
          <Th>Oldest</Th>
          <Th>Newest</Th>
        </tr>
      </THead>
      <tbody>
        {groups.map((group) => (
          <tr key={group.group_id}>
            <Td className="font-mono text-label text-ink-secondary" title={group.group_id}>
              {shortId(group.group_id)}
            </Td>
            <NumericTd>{formatCount(group.report_count)}</NumericTd>
            <Td>{humanizeSlug(group.service_slug)}</Td>
            <Td>{group.district_name}</Td>
            <Td className="text-ink-secondary">{formatDateTime(group.oldest)}</Td>
            <Td className="text-ink-secondary">{formatDateTime(group.newest)}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
