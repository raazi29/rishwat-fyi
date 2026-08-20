import Link from "next/link";
import type { ReactNode } from "react";

import type { ComparisonRow } from "@/lib/api";
import { NumericTd, RowLink, TableShell, Td, Th, THead, VerificationBadge } from "@/components/ui";
import { formatCount, formatDays, formatInr, formatVisits } from "@/lib/utils/format";

import { NotEnoughData } from "./not-enough-data";

/**
 * Official-vs-reported comparison table for a set of services (used on the
 * department page). Grouped two-row header — official group green, citizen
 * group red, both in the reserved `.column-label` style — with tabular,
 * right-aligned numeric cells and the citizen columns in reported red. Below
 * 900px each row becomes a card via `TableShell` (no horizontal scroll). Built
 * from the shared UI primitives so it stays independent of the search feature.
 */

function serviceHref(slug: string): string {
  return `/services/${slug}`;
}

function reportedTimeline(row: ComparisonRow): string {
  return row.published ? formatDays(row.reported.timeline_days) : "\u2014";
}

export function ServiceComparisonTable({ rows }: { rows: readonly ComparisonRow[] }) {
  return (
    <TableShell
      ariaLabel="Official figures compared with citizen-reported experience"
      caption="Each row compares a service's official fee and timeline with the citizen-reported additional amount, timeline and visits."
      cards={<ServiceComparisonCards rows={rows} />}
    >
      <THead>
        <tr>
          <Th scope="col" rowSpan={2} className="align-bottom">
            Service
          </Th>
          <Th scope="colgroup" colSpan={2} group tone="official">
            <span className="block text-center">
              Official{" "}
              <span className="font-normal normal-case tracking-normal">(As per government)</span>
            </span>
          </Th>
          <Th scope="colgroup" colSpan={3} group tone="reported">
            <span className="block text-center">
              Citizen experience{" "}
              <span className="font-normal normal-case tracking-normal">(Median)</span>
            </span>
          </Th>
          <Th scope="col" rowSpan={2} numeric className="align-bottom">
            Reports
          </Th>
          <Th scope="col" rowSpan={2} className="align-bottom">
            Verification status
          </Th>
          <Th scope="col" rowSpan={2}>
            <span className="sr-only">View details</span>
          </Th>
        </tr>
        <tr>
          <Th scope="col" numeric>
            Fee
          </Th>
          <Th scope="col" numeric>
            Timeline
          </Th>
          <Th scope="col" numeric>
            Additional amount
          </Th>
          <Th scope="col" numeric>
            Timeline
          </Th>
          <Th scope="col" numeric>
            Visits
          </Th>
        </tr>
      </THead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.slug}-${row.location.district ?? "all"}`}
            className="transition-colors duration-150 hover:bg-sunken"
          >
            <Td>
              <Link
                href={serviceHref(row.slug)}
                className="font-medium text-ink transition-colors duration-150 hover:text-official-mid"
              >
                {row.name}
              </Link>
            </Td>
            <NumericTd>{formatInr(row.official.fee_inr)}</NumericTd>
            <NumericTd>{formatDays(row.official.timeline_days)}</NumericTd>
            <NumericTd tone="reported">
              {row.published ? formatInr(row.reported.additional_amount_inr) : <NotEnoughData />}
            </NumericTd>
            <NumericTd tone="reported">
              {row.published ? reportedTimeline(row) : <NotEnoughData />}
            </NumericTd>
            <NumericTd tone="reported">
              {row.published ? formatVisits(row.reported.visits) : <NotEnoughData />}
            </NumericTd>
            <NumericTd>{formatCount(row.report_count)}</NumericTd>
            <Td>
              {row.verification ? (
                <VerificationBadge status={row.verification} />
              ) : (
                <NotEnoughData variant="text" label="Below threshold" />
              )}
            </Td>
            <RowLink href={serviceHref(row.slug)} label={`View ${row.name}`} />
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function CardFigure({
  label,
  value,
  tone = "official",
}: {
  label: string;
  value: ReactNode;
  tone?: "official" | "reported";
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-label text-ink-muted">{label}</span>
      <span
        className={`tabular text-body font-medium ${tone === "reported" ? "text-reported" : "text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ServiceComparisonCards({ rows }: { rows: readonly ComparisonRow[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <li
          key={`${row.slug}-${row.location.district ?? "all"}`}
          className="rounded-lg border border-line bg-surface p-5"
        >
          <Link
            href={serviceHref(row.slug)}
            className="font-sans text-h3 font-semibold text-ink transition-colors duration-150 hover:text-official-mid"
          >
            {row.name}
          </Link>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="column-label text-official-mid">Official</div>
            <div className="column-label text-reported">Citizen experience</div>
            <div className="space-y-2">
              <CardFigure label="Fee" value={formatInr(row.official.fee_inr)} />
              <CardFigure label="Timeline" value={formatDays(row.official.timeline_days)} />
            </div>
            <div className="space-y-2">
              <CardFigure
                label="Additional"
                tone="reported"
                value={row.published ? formatInr(row.reported.additional_amount_inr) : <NotEnoughData />}
              />
              <CardFigure
                label="Timeline"
                tone="reported"
                value={row.published ? reportedTimeline(row) : <NotEnoughData />}
              />
              <CardFigure
                label="Visits"
                tone="reported"
                value={row.published ? formatVisits(row.reported.visits) : <NotEnoughData />}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line-inner pt-3">
            {row.verification ? (
              <VerificationBadge status={row.verification} />
            ) : (
              <NotEnoughData variant="text" label="Below publishing threshold" />
            )}
            <span className="text-label text-ink-muted tabular">
              {formatCount(row.report_count)} reports
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
