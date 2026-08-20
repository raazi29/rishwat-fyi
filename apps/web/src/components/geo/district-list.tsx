import Link from "next/link";

import type { DistrictRef } from "@/lib/api/types";
import { MapPinIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

/**
 * The districts of a state, each linking into the search comparison filtered to
 * that district. Search resolves location by NAME (see the /search contract),
 * so the links carry the state and district names rather than codes. Rendered
 * as a responsive grid of ≥44px targets, never a horizontal scroller.
 */
export function DistrictList({
  districts,
  stateName,
  className,
}: {
  districts: readonly DistrictRef[];
  stateName: string;
  className?: string;
}) {
  if (districts.length === 0) {
    return (
      <p className={cn("text-body text-ink-secondary", className)}>
        No districts are listed for this state yet.
      </p>
    );
  }

  function searchHref(districtName: string): string {
    const params = new URLSearchParams({ state: stateName, district: districtName });
    return `/search?${params.toString()}`;
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {districts.map((district) => (
        <li key={district.code}>
          <Link
            href={searchHref(district.name)}
            className="group flex min-h-11 items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 hover:bg-sunken hover:text-official-mid"
          >
            <MapPinIcon
              size={16}
              className="shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-official-mid"
            />
            <span className="min-w-0 truncate">{district.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
