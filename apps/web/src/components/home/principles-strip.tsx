import type { ReactNode } from "react";

import { IconTile } from "@/components/ui";
import { DatabaseIcon, EyeOffIcon, LockIcon, ScaleIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

interface Principle {
  icon: ReactNode;
  title: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    icon: <LockIcon />,
    title: "Anonymous by default",
    body: "We never ask for your name, phone number, Aadhaar, PAN or address.",
  },
  {
    icon: <EyeOffIcon />,
    title: "Evidence matters",
    body: "Reports are stronger when backed by documents and patterns.",
  },
  {
    icon: <ScaleIcon />,
    title: "Neutral and non-political",
    body: "We show data. You draw your conclusions.",
  },
  {
    icon: <DatabaseIcon />,
    title: "Open data, open source",
    body: "Our data and code are open for everyone, forever.",
  },
];

// Hairline seams that behave across 1-column (phone), 2-column (tablet) and
// 4-column (desktop) layouts — a strip with dividers, never a card grid.
const SEAMS = [
  "",
  "border-t border-line-inner sm:border-t-0 sm:border-l",
  "border-t border-line-inner lg:border-t-0 lg:border-l",
  "border-t border-line-inner sm:border-l lg:border-t-0",
];

export function PrinciplesStrip() {
  return (
    <section aria-labelledby="principles-heading">
      <h2 id="principles-heading" className="sr-only">
        Our principles
      </h2>
      <ul className="grid grid-cols-1 rounded-lg border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map((principle, index) => (
          <li key={principle.title} className={cn("flex items-start gap-3 p-5", SEAMS[index])}>
            <IconTile>{principle.icon}</IconTile>
            <div className="min-w-0">
              <h3 className="font-sans text-h3 font-semibold text-ink">{principle.title}</h3>
              <p className="mt-1 text-label text-ink-secondary">{principle.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
