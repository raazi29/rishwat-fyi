import { SearchField } from "@/components/ui";
import { ShieldCheckIcon } from "@/components/icons";

/**
 * The search-results top bar from the board: the `bar`-variant SearchField
 * (service + location, pre-filled from the query) with an attached Search
 * button, beside the anonymity reassurance card. The SearchField is a real
 * `<form method="get">`, so a new search works without JavaScript.
 */
export function SearchTopBar({
  query,
  location,
}: {
  query: string;
  location: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      <div className="min-w-0 flex-1">
        <SearchField
          size="bar"
          defaultQuery={query}
          defaultLocation={location}
          queryPlaceholder="Service or department"
          locationPlaceholder="City, district or state"
        />
      </div>
      <div className="hidden items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 lg:flex lg:shrink-0">
        <span aria-hidden="true" className="shrink-0 text-official-mid">
          <ShieldCheckIcon size={18} />
        </span>
        <p className="text-label text-ink-secondary">
          <span className="font-medium text-ink">Anonymous</span> · No personal data collected
        </p>
      </div>
    </div>
  );
}
