import { ButtonLink } from "@/components/ui";
import { CodeIcon, DatabaseIcon, DownloadIcon } from "@/components/icons";

/**
 * The closing band from the all-sections board: the open-data statement beside
 * the three open-data actions (explore, API, download). Green primary for
 * "Explore data"; the other two are secondary.
 */
export function OpenDataBand() {
  return (
    <section aria-labelledby="open-data-heading">
      <div className="flex flex-col gap-5 rounded-lg border border-line bg-sunken p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <h2 id="open-data-heading" className="font-serif text-h2 font-bold text-ink">
          Open data. Open process. Open source.
        </h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/data" variant="primary" iconLeading={<DatabaseIcon size={18} />}>
            Explore data
          </ButtonLink>
          <ButtonLink href="/data/api" variant="secondary" iconLeading={<CodeIcon size={18} />}>
            API
          </ButtonLink>
          <ButtonLink href="/data" variant="secondary" iconLeading={<DownloadIcon size={18} />}>
            Download dataset
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
