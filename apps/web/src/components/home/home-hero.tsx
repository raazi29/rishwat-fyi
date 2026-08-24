import Image from "next/image";
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
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150",
        "hover:border-official-mid hover:bg-sunken hover:shadow-[0_3px_8px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-sm",
        "focus-visible:bg-sunken",
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

      {/* The supplied Capitol illustration establishes the civic setting before the statistics. */}
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="overflow-hidden rounded-lg border border-line bg-surface p-2 sm:p-3">
          <Image
            src="/brand/illustration-capitol.webp"
            alt="Illustration of a neoclassical government building flying the Indian flag"
            width={1400}
            height={800}
            priority
            sizes="(max-width: 1023px) calc(100vw - 2rem), (max-width: 1440px) 45vw, 640px"
            className="hero-capitol h-auto w-full object-contain"
          />
        </div>
        <Card className="p-5 sm:p-6">
          <StatStrip items={statItems(totals)} />
        </Card>
      </div>
    </section>
  );
}
