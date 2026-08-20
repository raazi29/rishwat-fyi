import { ButtonLink, Card, NoticeStrip } from "@/components/ui";
import { GapMap } from "@/components/map";
import { ArrowRightIcon, CompassIcon } from "@/components/icons";
import type { StateGap } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";

/**
 * The geographic band on the home page.
 *
 * The map used to sit inside the hero's right column, which crowded the
 * proposition and left a long dead zone beneath the search field. It now owns a
 * full-width section: the choropleth reads at a useful size, the ranked list sits
 * beside it, and the two actions (full map / all states) close the section.
 */
export function GapSection({ states }: { states: StateGap[] }) {
  const withData = states.filter((state) => state.additional_amount_median !== null);
  const reports = states.reduce((total, state) => total + state.report_count, 0);

  return (
    <section aria-labelledby="gap-section-heading" className="pt-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="gap-section-heading" className="font-serif text-h1 font-bold text-ink">
            Where is the gap widest?
          </h2>
          <p className="mt-2 max-w-[58ch] text-body text-ink-secondary">
            Median additional amount reported by citizens, by state. Darker means citizens
            reported a larger gap between the official fee and what the service actually cost
            them — not a proven level of corruption.
          </p>
        </div>
        <p className="shrink-0 text-label text-ink-muted">
          {formatCount(withData.length)} states with published figures ·{" "}
          <span className="tabular">{formatCount(reports)}</span> reports
        </p>
      </div>

      <Card className="p-5 sm:p-6 lg:p-8">
        <GapMap
          states={states}
          variant="full"
          viewAllHref="/states"
          id="home-gap-map"
          showHeader={false}
        />

        <div className="mt-8 flex flex-col gap-4 border-t border-line-inner pt-6 sm:flex-row sm:items-center sm:justify-between">
          <NoticeStrip className="flex-1" />
          <div className="flex shrink-0 flex-wrap gap-3">
            <ButtonLink href="/map" variant="primary" iconLeading={<CompassIcon size={18} />}>
              Open the full map
            </ButtonLink>
            <ButtonLink href="/states" iconTrailing={<ArrowRightIcon size={18} />}>
              All states
            </ButtonLink>
          </div>
        </div>
      </Card>
    </section>
  );
}
