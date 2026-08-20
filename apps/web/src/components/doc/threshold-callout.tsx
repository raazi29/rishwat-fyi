import { Callout } from "@/components/ui/callout";
import { UsersIcon } from "@/components/icons";

/**
 * Restates the publishing threshold: a (service, district) statistic publishes
 * only with ≥ 3 reports from ≥ 2 independent IP-hash buckets. Shown on the
 * methodology, data and dictionary pages so the rule is never more than a
 * scroll from the numbers it governs (Product Principle 4, docs/methodology.md).
 */
export function ThresholdCallout({ className }: { className?: string }) {
  return (
    <Callout
      tone="official"
      icon={<UsersIcon size={20} />}
      title="Publishing threshold"
      className={className}
    >
      A statistic for a (service, district) cell is published only when its verified reports include{" "}
      <strong className="font-semibold text-official">at least 3 reports</strong> from{" "}
      <strong className="font-semibold text-official">at least 2 distinct IP-hash buckets</strong>{" "}
      (independent reporters). If either condition is not met, every statistic is <code>null</code>{" "}
      and only the raw report count is shown — so you can always see how much data stands behind a
      result.
    </Callout>
  );
}
