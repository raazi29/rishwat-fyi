import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ButtonLink, SearchField } from "@/components/ui";
import { CompassIcon, MapPinIcon, SearchIcon, ShieldIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container>
      <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center lg:py-24">
        <span
          aria-hidden="true"
          className="inline-flex size-12 items-center justify-center rounded-tile bg-sand text-official-mid"
        >
          <CompassIcon size={26} />
        </span>
        <h1 className="mt-5 font-serif text-h1 font-bold text-ink">This page is not here</h1>
        <p className="mt-3 text-body-lg text-ink-secondary">
          The address may be mistyped, or the page may have moved. Search for a government service,
          or head to one of the sections below.
        </p>

        <SearchField className="mt-6 w-full" />

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/services" variant="secondary" iconLeading={<SearchIcon size={18} />}>
            Browse services
          </ButtonLink>
          <ButtonLink href="/map" variant="secondary" iconLeading={<MapPinIcon size={18} />}>
            Open the map
          </ButtonLink>
          <ButtonLink href="/report" variant="primary" iconLeading={<ShieldIcon size={18} />}>
            Report anonymously
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
