"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { CompassIcon, DatabaseIcon, InfoIcon, MapPinIcon, PlusIcon } from "@/components/icons";

interface TabDef {
  label: string;
  href: string;
  icon: ReactNode;
  raised?: boolean;
}

const TABS: TabDef[] = [
  { label: "Explore", href: "/services", icon: <CompassIcon size={22} /> },
  { label: "Map", href: "/map", icon: <MapPinIcon size={22} /> },
  { label: "Report", href: "/report", icon: <PlusIcon size={24} />, raised: true },
  { label: "Data", href: "/data", icon: <DatabaseIcon size={22} /> },
  { label: "About", href: "/about", icon: <InfoIcon size={22} /> },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The phone bottom tab bar from the mobile board (Explore · Map · Report ·
 * Data · About), with Report as a raised primary circle. Hidden at ≥1024px in
 * favour of the header nav; padded for the iOS home-indicator safe area. Pages
 * should reserve bottom space so content is not hidden behind it.
 */
export function BottomTabBar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper lg:hidden",
        className,
      )}
    >
      <ul className="flex items-end justify-around">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);

          if (tab.raised) {
            return (
              <li key={tab.href} className="flex flex-1 justify-center">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="flex min-w-11 flex-col items-center pb-1.5 pt-1 text-micro font-medium text-official-mid"
                >
                  <span className="-mt-6 mb-1 flex size-14 items-center justify-center rounded-full bg-official text-white shadow-overlay">
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex flex-1 justify-center">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 px-2 text-micro font-medium transition-colors duration-150",
                  active ? "text-official-mid" : "text-ink-muted hover:text-ink",
                )}
              >
                {tab.icon}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
