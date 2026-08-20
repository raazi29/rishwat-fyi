import { ButtonLink, IconTile, Panel } from "@/components/ui";
import { ArrowRightIcon, ScaleIcon, ShieldCheckIcon } from "@/components/icons";

/**
 * The service page's closing strip: the "these are reported experiences, not
 * established facts" reminder beside the invitation to add a report, and the
 * primary "Report anonymously" action seeded with this service. The verbatim
 * mandatory notice is rendered separately with the citizen aggregate; this is
 * the plain-language reminder that pairs with the report call to action.
 */
export function ClosingStrip({ slug }: { slug: string }) {
  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-6 sm:grid-cols-2 lg:flex-1">
          <div className="flex gap-3">
            <IconTile tone="sand">
              <ScaleIcon size={20} />
            </IconTile>
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink">Important</p>
              <p className="text-label text-ink-secondary">
                {
                  "These are citizen-reported experiences, not established facts. Always compare with official information."
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <IconTile>
              <ShieldCheckIcon size={20} />
            </IconTile>
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink">Report your experience</p>
              <p className="text-label text-ink-secondary">
                {
                  "Help improve this public data by sharing your experience. It is anonymous and secure."
                }
              </p>
            </div>
          </div>
        </div>
        <ButtonLink
          href={`/report?service=${encodeURIComponent(slug)}`}
          variant="primary"
          iconTrailing={<ArrowRightIcon size={18} />}
          className="shrink-0"
        >
          Report anonymously
        </ButtonLink>
      </div>
    </Panel>
  );
}
