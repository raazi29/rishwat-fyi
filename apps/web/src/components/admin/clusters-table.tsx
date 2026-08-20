import { Badge, EmptyState, NumericTd, TableShell, Td, THead, Th } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import type { CoordinatedCluster } from "@/lib/api";
import { formatCount, formatDateTime, humanizeSlug } from "@/lib/utils/format";

/**
 * Coordinated-submission clusters from `GET /admin/stats/clusters`: IP-hash +
 * service groups the anti-abuse system flagged. Table on desktop, cards below
 * 900px. The IP-hash is shown only as its truncated prefix, as the API returns
 * it — no raw identifier is ever exposed (PRODUCT.md privacy principle).
 */
export function ClustersTable({ clusters }: { clusters: CoordinatedCluster[] }) {
  if (clusters.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <EmptyState
          icon={<ShieldIcon />}
          title="No coordinated clusters"
          description="The anti-abuse system has not flagged any coordinated submission clusters in the current window."
        />
      </div>
    );
  }

  const cards = (
    <ul className="space-y-3">
      {clusters.map((cluster, index) => (
        <li
          key={`${cluster.ip_hash_prefix}-${cluster.service_slug}-${index}`}
          className="rounded-lg border border-line bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-label text-ink-secondary">{cluster.ip_hash_prefix}&hellip;</span>
            <Badge tone="neutral">{formatCount(cluster.report_count)} reports</Badge>
          </div>
          <p className="mt-2 text-body font-medium text-ink">{humanizeSlug(cluster.service_slug)}</p>
          <p className="mt-2 text-label text-ink-muted">
            {formatDateTime(cluster.time_range.from)} &rarr; {formatDateTime(cluster.time_range.to)}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <TableShell ariaLabel="Coordinated submission clusters" cards={cards}>
      <THead>
        <tr>
          <Th>IP-hash prefix</Th>
          <Th>Service</Th>
          <Th numeric>Reports</Th>
          <Th>Time range</Th>
        </tr>
      </THead>
      <tbody>
        {clusters.map((cluster, index) => (
          <tr key={`${cluster.ip_hash_prefix}-${cluster.service_slug}-${index}`}>
            <Td className="whitespace-nowrap font-mono text-label text-ink-secondary">
              {cluster.ip_hash_prefix}&hellip;
            </Td>
            <Td>{humanizeSlug(cluster.service_slug)}</Td>
            <NumericTd>{formatCount(cluster.report_count)}</NumericTd>
            <Td className="text-ink-secondary">
              {formatDateTime(cluster.time_range.from)} &rarr; {formatDateTime(cluster.time_range.to)}
            </Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
