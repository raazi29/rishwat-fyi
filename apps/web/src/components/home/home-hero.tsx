import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  IconTile,
  SearchField,
  StatStrip,
  type StatItem,
} from "@/components/ui";
import {
  ArrowRightIcon,
  DocumentIcon,
  MapPinIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import type { PlatformTotals } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

import { GovernmentBuilding } from "./government-building";

const POPULAR_SEARCHES = [
  "Driving Licence",
  "Land Registration",
  "Birth Certificate",
  "GST",
  "Passport",
];

function statItems(totals: PlatformTotals): StatItem[] {
  return [
    { icon: <DocumentIcon />, value: formatCount(totals.services_tracked), label: "Services tracked" },
    { icon: <UsersIcon />, value: formatCount(totals.citizen_reports), label: "Citizen reports" },
    { icon: <MapPinIcon />, value: formatCount(totals.states_covered), label: "States covered" },
    {
      icon: <ShieldCheckIcon />,
      value: formatCount(totals.reports_corroborated),
      label: "Reports corroborated",
    },
  ];
}

/** A bordered link card in the hero: sand tile, title, subtitle, trailing arrow. */
function ActionCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-line bg-surface p-4",
        "transition-colors duration-150 hover:bg-sunken focus-visible:bg-sunken",
      )}
    >
      <IconTile tone="sand">{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-h3 font-semibold text-ink">{title}</span>
        <span className="block text-label text-ink-muted">{subtitle}</span>
      </span>
      <ArrowRightIcon
        size={18}
        className="shrink-0 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-official-mid"
      />
    </Link>
  );
}

export function HomeHero({ totals }: { totals: PlatformTotals }) {
  return (
    <section className="grid grid-cols-1 items-center gap-10 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-10">
      {/* Left: the proposition and the primary actions */}
      <div className="flex flex-col gap-6">
        <h1 className="font-serif font-bold leading-none tracking-[-0.03em] text-ink text-display-sm sm:text-display-md lg:text-display">
          <span className="block">What should</span>
          {/* `official-mid` is DESIGN.md's token for serif accent words (not
              `official`, the wordmark/button green). The two are the same deep
              green in light, but on the dark paper ground bare `official` falls
              to ~3:1 while `official-mid` keeps a comfortable margin at display
              scale. */}
          <span className="block text-official-mid">government</span>
          <span className="block">cost you?</span>
        </h1>

        <p className="max-w-[46ch] text-body-lg text-ink-secondary">
          <span className="block">Search official fees and timelines.</span>
          <span className="block">Compare them with what citizens actually experience.</span>
        </p>

        <SearchField className="max-w-xl" />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-label">
          <span className="text-ink-muted">Popular searches:</span>
          {POPULAR_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="text-ink-secondary underline decoration-line-inner decoration-1 underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink-muted"
            >
              {term}
            </Link>
          ))}
        </div>

        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <ActionCard
            href="/services"
            icon={<SearchIcon />}
            title="Search a service"
            subtitle="Compare official vs reported"
          />
          <ActionCard
            href="/report"
            icon={<ShieldIcon />}
            title="Report anonymously"
            subtitle="Share your experience securely"
          />
        </div>
      </div>

      {/* Right: the illustration over the platform snapshot */}
      <div className="flex flex-col gap-8">
        <h2 className="sr-only">Platform snapshot</h2>
        <GovernmentBuilding className="mx-auto w-full max-w-lg text-ink-secondary" />
        <Card className="p-5 sm:p-6">
          <StatStrip items={statItems(totals)} />
        </Card>
      </div>
    </section>
  );
}
