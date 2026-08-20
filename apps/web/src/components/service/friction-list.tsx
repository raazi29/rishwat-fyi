import type { FrictionPoint } from "@/lib/api";
import { ChevronDownIcon } from "@/components/icons";
import { formatIssue, formatPercent } from "@/lib/utils/format";

/**
 * Top friction points as a native `<details>` disclosure list — expandable
 * without JavaScript. Each row names the reported issue and the share of
 * reports that mentioned it; expanding restates that share in a sentence. The
 * share is always shown as text, so colour is never the only signal.
 */
export function FrictionList({
  title,
  items,
}: {
  title: string;
  items: FrictionPoint[];
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="friction-heading" className="flex flex-col">
      <h3 id="friction-heading" className="mb-3 text-h3 font-semibold text-ink">
        {title}
      </h3>
      <ul className="divide-y divide-line-inner">
        {items.map((item) => {
          const label = formatIssue(item.code);
          const share = formatPercent(item.share);
          return (
            <li key={item.code}>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 text-body text-ink [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-label font-semibold text-ink">{share}</span>
                    <ChevronDownIcon
                      size={16}
                      className="text-ink-muted transition-transform duration-150 group-open:rotate-180"
                    />
                  </span>
                </summary>
                <p className="pb-3 text-label text-ink-secondary">
                  {share} of reports for this service mentioned {label.toLowerCase()}.
                </p>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
