import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Container } from "@/components/layout/container";
import { MANDATORY_NOTICE } from "@/components/ui/callout";

/**
 * The site footer: a sunken band with the wordmark, the standing line
 * ("Government, as experienced by citizens."), four link columns, the
 * provisional licence line (licensing is not finalised — PRODUCT.md), and the
 * mandatory notice verbatim. The interface is replaceable; every column points
 * back at the data, the method, and the project (Product Principle 5).
 */

interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "Services", href: "/services" },
      { label: "Departments", href: "/departments" },
      { label: "States", href: "/states" },
      { label: "Map", href: "/map" },
      { label: "Report anonymously", href: "/report" },
      { label: "Check report status", href: "/report/status" },
    ],
  },
  {
    title: "Open data",
    links: [
      { label: "Datasets", href: "/data" },
      { label: "API", href: "/data/api" },
      { label: "Data dictionary", href: "/data/dictionary" },
      { label: "Mirroring the data", href: "/mirroring" },
    ],
  },
  {
    title: "About the project",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/methodology" },
      { label: "Governance", href: "/governance" },
      { label: "Contribute", href: "/contribute" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Moderation", href: "/moderation" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-sunken">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <div className="max-w-xs">
            <BrandLogo href={null} />
            <p className="mt-3 font-serif text-body-lg text-ink">
              Government, as experienced by citizens.
            </p>
            <p className="mt-2 text-label text-ink-muted">
              Public data. Verified process. Powered by citizens.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-label font-semibold text-ink">{column.title}</p>
              <ul className="mt-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-2 text-label text-ink-secondary transition-colors duration-150 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line-inner pt-6 text-label text-ink-muted">
          <p className="max-w-[72ch]">{MANDATORY_NOTICE}</p>
          <p className="max-w-[72ch]">
            Data is published under CC BY 4.0 and the code under the MIT licence. Licensing is
            provisional and not yet finalised.
          </p>
          <p className="tabular">© {year} Rishwat.fyi</p>
        </div>
      </Container>
    </footer>
  );
}
