import type { ReactNode } from "react";

import { IconTile } from "@/components/ui";
import { DatabaseIcon, EyeOffIcon, ChartIcon, UsersIcon } from "@/components/icons";

/**
 * The full-width "Our commitment to you" band shown beneath the wizard on the
 * report board — four reassurances that anonymity is structural, not a promise.
 * A divided strip (not a card grid) so it never reads as page-structure cards.
 */

const COMMITMENTS: { icon: ReactNode; text: string }[] = [
  { icon: <UsersIcon size={20} />, text: "We never store personal identifiers" },
  { icon: <EyeOffIcon size={20} />, text: "We don't share raw data with anyone" },
  { icon: <ChartIcon size={20} />, text: "We publish only patterns and aggregates" },
  { icon: <DatabaseIcon size={20} />, text: "You stay anonymous, always" },
];

export function CommitmentBand() {
  return (
    <section aria-labelledby="commitment-heading" className="rounded-lg border border-line bg-sunken p-6">
      <h2 id="commitment-heading" className="font-serif text-h3 font-semibold text-ink">
        Our commitment to you
      </h2>
      <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {COMMITMENTS.map((item, index) => (
          <li
            key={item.text}
            className={
              index > 0
                ? "flex items-center gap-3 lg:border-l lg:border-line-inner lg:pl-6"
                : "flex items-center gap-3"
            }
          >
            <IconTile>{item.icon}</IconTile>
            <span className="text-label text-ink-secondary">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
