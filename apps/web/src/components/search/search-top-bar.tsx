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
    <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
      <SearchField
        size="bar"
        defaultQuery={query}
        defaultLocation={location}
        queryPlaceholder="Service or department"
        locationPlaceholder="City, district or state"
      />
      <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-2.5 lg:max-w-xs">
        <span aria-hidden="true" className="shrink-0 text-official-mid">
          <ShieldCheckIcon size={22} />
        </span>
        <div>
          <p className="text-label font-semibold text-ink">All reports are anonymous</p>
          <p className="text-label text-ink-muted">We never collect personal information.</p>
        </div>
      </div>
    </div>
  );
}
