"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "@/components/icons";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

export interface NavLeaf {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavLeaf[];
}

/**
 * The primary navigation model, shared by the desktop nav and the mobile sheet
 * so the two never drift. Matches the header on every board.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Explore",
    children: [
      { label: "Services", href: "/services" },
      { label: "Departments", href: "/departments" },
      { label: "States", href: "/states" },
    ],
  },
  { label: "Map", href: "/map" },
  { label: "Report", href: "/report" },
  {
    label: "Data",
    children: [
      { label: "Datasets", href: "/data" },
      { label: "API", href: "/data/api" },
      { label: "Data dictionary", href: "/data/dictionary" },
    ],
  },
  { label: "Methodology", href: "/methodology" },
  { label: "About", href: "/about" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const LINK_BASE =
  "inline-flex items-center gap-1 rounded-md px-3 py-2 text-label font-medium transition-colors duration-150";

/**
 * The desktop primary nav (≥1024px). Items with children are disclosure
 * dropdowns: click to toggle, Escape or an outside click to close, rendered as
 * a shadowed, borderless overlay (DESIGN.md §Elevation). Plain items are links
 * with an active state derived from the current path.
 */
export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useOnClickOutside(navRef, () => setOpen(null), open !== null);

  return (
    <nav ref={navRef} aria-label="Primary" className={cn("flex items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          return (
            <DropdownItem
              key={item.label}
              item={item}
              isOpen={open === item.label}
              onToggle={() => setOpen((current) => (current === item.label ? null : item.label))}
              onClose={() => setOpen(null)}
              pathname={pathname}
            />
          );
        }
        if (!item.href) return null;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              LINK_BASE,
              active ? "text-ink" : "text-ink-secondary hover:bg-sunken hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DropdownItem({
  item,
  isOpen,
  onToggle,
  onClose,
  pathname,
}: {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pathname: string;
}) {
  const menuId = useId();
  const groupActive = (item.children ?? []).some((leaf) => isActive(pathname, leaf.href));

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={onToggle}
        className={cn(
          LINK_BASE,
          isOpen || groupActive ? "text-ink" : "text-ink-secondary hover:bg-sunken hover:text-ink",
        )}
      >
        {item.label}
        <ChevronDownIcon
          size={16}
          className={cn("transition-transform duration-150", isOpen && "rotate-180")}
        />
      </button>
      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[208px] rounded-md bg-surface p-1 shadow-overlay"
        >
          {(item.children ?? []).map((leaf) => (
            <Link
              key={leaf.href}
              href={leaf.href}
              role="menuitem"
              onClick={onClose}
              aria-current={isActive(pathname, leaf.href) ? "page" : undefined}
              className={cn(
                "block rounded-sm px-3 py-2 text-label transition-colors duration-150",
                isActive(pathname, leaf.href)
                  ? "bg-sunken text-ink"
                  : "text-ink-secondary hover:bg-sunken hover:text-ink",
              )}
            >
              {leaf.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
