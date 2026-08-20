import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * The site header from every board: the serif "Rishwat.fyi" wordmark in
 * official green, a hairline divider, the two-line descriptor, the primary nav
 * (dropdowns on ≥1024px, hamburger below), the persistent "Report anonymously"
 * action, and the theme toggle. Sticky with a hairline bottom border; sits at
 * z-40 so the tab bar (z-20) and dropdown overlays (z-50) layer correctly.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Rishwat.fyi — home"
            className="font-serif text-h2 font-bold leading-none tracking-tight text-official"
          >
            Rishwat.fyi
          </Link>
          <span aria-hidden="true" className="hidden h-8 w-px bg-line md:block" />
          <span className="hidden text-micro leading-tight text-ink-muted md:block">
            Public data. Verified process.
            <br />
            Powered by citizens.
          </span>
        </div>

        <SiteNav className="hidden lg:flex" />

        <div className="flex items-center gap-2">
          <ButtonLink href="/report" variant="primary" className="hidden sm:inline-flex">
            Report anonymously
          </ButtonLink>
          <ThemeToggle />
          <MobileNav className="lg:hidden" />
        </div>
      </Container>
    </header>
  );
}
