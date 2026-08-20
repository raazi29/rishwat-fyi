import type { ReactNode } from "react";

import { ActionLink, ButtonLink, IconTile } from "@/components/ui";
import { ArrowRightIcon, ChartIcon, DocumentIcon, ShareIcon, ShieldCheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

interface HelpItem {
  icon: ReactNode;
  title: string;
  body: string;
  linkLabel: string;
  href: string;
}

const HELP: HelpItem[] = [
  {
    icon: <ShareIcon size={20} />,
    title: "Share (anonymously)",
    body: "Encourage others to share their experiences.",
    linkLabel: "Share Rishwat.fyi",
    href: "/",
  },
  {
    icon: <DocumentIcon size={20} />,
    title: "Add more details (optional)",
    body: "If you have more information or evidence, you can add it later.",
    linkLabel: "Update this report",
    href: "/report/status",
  },
  {
    icon: <ShieldCheckIcon size={20} />,
    title: "Report responsibly",
    body: "Share only your own experiences. False information harms everyone.",
    linkLabel: "Read reporting guidelines",
    href: "/methodology",
  },
  {
    icon: <ChartIcon size={20} />,
    title: "Explore the data",
    body: "See how citizen experiences create public impact.",
    linkLabel: "Explore services",
    href: "/search",
  },
];

/** The full-width "How you can help" divided strip from the submitted board. */
export function HowYouCanHelp() {
  return (
    <section aria-labelledby="help-heading" className="rounded-lg border border-line bg-surface p-6">
      <h2 id="help-heading" className="font-serif text-h2 font-bold text-ink">
        How you can help
      </h2>
      <ul className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {HELP.map((item, index) => (
          <li
            key={item.title}
            className={cn(
              "flex flex-col gap-2",
              index > 0 && "lg:border-l lg:border-line-inner lg:pl-6",
            )}
          >
            <IconTile>{item.icon}</IconTile>
            <h3 className="font-sans text-h3 font-semibold text-ink">{item.title}</h3>
            <p className="text-label text-ink-secondary">{item.body}</p>
            <ActionLink href={item.href} className="mt-auto">
              {item.linkLabel}
            </ActionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The closing "Thank you for believing in accountability" band. */
export function ClosingBand() {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <IconTile>
          <ShieldCheckIcon size={20} />
        </IconTile>
        <div className="min-w-0">
          <h2 className="font-serif text-h3 font-semibold text-ink">
            Thank you for believing in accountability
          </h2>
          <p className="mt-1 text-label text-ink-secondary">
            You are helping build an open, transparent and citizen-powered public data layer for India.
          </p>
        </div>
      </div>
      <ButtonLink href="/search" variant="secondary" iconTrailing={<ArrowRightIcon size={18} />} className="shrink-0">
        Back to explore
      </ButtonLink>
    </section>
  );
}
