import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
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
      <Container className="flex h-16 items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo />
          <span aria-hidden="true" className="hidden h-8 w-px bg-line xl:block" />
          <span className="hidden text-micro leading-tight text-ink-muted xl:block">
            Public data. Open process.
            <br />
            Powered by citizens.
          </span>
        </div>

        <SiteNav className="hidden lg:flex" />

        <div className="flex shrink-0 items-center gap-2">
          {/* The bottom tab bar was removed, but the header's `Report`
              action still only needs to exist once the drawer nav takes
              over layout at `lg`; below that, `MobileNav`'s own primary
              button covers it. Visibility is controlled on a wrapping
              `span`, not on the button's own className: `cn()` does no
              Tailwind conflict resolution (see lib/utils/cn.ts), so a
              trailing `hidden` string can lose to `inline-flex` baked into
              Button's own base classes depending on generated CSS order. A
              display utility on a plain wrapper never fights the button's
              own classes. */}
          <span className="hidden lg:inline-flex">
            <ButtonLink href="/report" variant="primary">
              Report anonymously
            </ButtonLink>
          </span>
          <ThemeToggle />
          <MobileNav className="lg:hidden" />
        </div>
      </Container>
    </header>
  );
}
