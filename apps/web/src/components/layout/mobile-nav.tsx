"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/layout/site-nav";
import { useLockedBody } from "@/lib/hooks/use-locked-body";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

/**
 * The mobile navigation sheet (below 1024px). A hamburger opens a right-hand
 * panel — a shadowed, borderless overlay — with the Explore/Data groups as
 * native disclosures and the primary Report action pinned at the bottom. Body
 * scroll is locked while open; Escape, an outside tap, or following a link
 * closes it.
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  useLockedBody(open);
  useOnClickOutside(panelRef, () => setOpen(false), open);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink",
          className,
        )}
      >
        <MenuIcon size={22} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-ink/40" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-paper shadow-overlay"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-serif text-h3 font-bold tracking-tight text-official">
                Rishwat.fyi
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-md text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink"
              >
                <CloseIcon size={22} />
              </button>
            </div>

            <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-2">
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <details key={item.label} className="group border-b border-line-inner">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3.5 text-body font-medium text-ink [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDownIcon
                        size={18}
                        className="text-ink-muted transition-transform duration-150 group-open:rotate-180"
                      />
                    </summary>
                    <div className="pb-2">
                      {item.children.map((leaf) => (
                        <Link
                          key={leaf.href}
                          href={leaf.href}
                          className="block rounded-sm py-2.5 pl-6 pr-3 text-body text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink"
                        >
                          {leaf.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ) : item.href ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block border-b border-line-inner px-3 py-3.5 text-body font-medium text-ink transition-colors duration-150 hover:bg-sunken"
                  >
                    {item.label}
                  </Link>
                ) : null,
              )}
            </nav>

            <div className="shrink-0 border-t border-line p-4">
              <ButtonLink href="/report" variant="primary" block>
                Report anonymously
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
