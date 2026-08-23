import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import type { ComparisonRow } from "@/lib/api";
import {
  IconTile,
  NumericTd,
  RowLink,
  TableShell,
  Td,
  Th,
  THead,
  VerificationBadge,
} from "@/components/ui";
// The honest below-threshold marker is a shared domain primitive; reuse the
// same component the geo comparison table uses so both tables label a missing
// citizen figure identically (visible em dash + a screen-reader explanation)
// instead of this table's previous bare, unlabelled "—".
import { NotEnoughData } from "@/components/geo/not-enough-data";
import {
  BuildingIcon,
  CompassIcon,
  DocumentIcon,
  type IconProps,
  RupeeIcon,
  ScaleIcon,
  ShieldIcon,
} from "@/components/icons";
import { formatCount, formatDays, formatInr, formatVisits } from "@/lib/utils/format";

/**
 * The search comparison table — the sharpest responsive case in the system.
 * Grouped two-row header (official group green, citizen group red, both the
 * reserved `.column-label`), tabular right-aligned numeric cells, a report
 * count, the verification badge column and a row-link arrow. Below 900px the
 * `TableShell` swaps the table for one card per service (official/reported in
 * two columns, the badge on its own line) — never a horizontal scroll.
 */

const SERVICE_ICON: Record<string, ComponentType<IconProps>> = {
  "driving-licence": CompassIcon,
  "vehicle-registration": CompassIcon,
  "land-registration": BuildingIcon,
  "property-mutation": BuildingIcon,
  "building-permit": BuildingIcon,
  "trade-licence": RupeeIcon,
  "birth-certificate": DocumentIcon,
  "death-certificate": DocumentIcon,
  "police-verification": ShieldIcon,
  "ration-card": DocumentIcon,
  "gst-registration": RupeeIcon,
  passport: ScaleIcon,
};

function serviceIcon(slug: string) {
  const Icon = SERVICE_ICON[slug] ?? DocumentIcon;
  return <Icon size={20} />;
}

function serviceHref(row: ComparisonRow): string {
  const params = new URLSearchParams();
  if (row.location.state) params.set("state", row.location.state);
  if (row.location.district) params.set("district", row.location.district);
  const query = params.toString();
  return query ? `/services/${row.slug}?${query}` : `/services/${row.slug}`;
}

function locationLabel(row: ComparisonRow): string {
  const parts = [row.location.district, row.location.state].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(", ") : "All India";
}

function reportedTimeline(row: ComparisonRow): string {
  return formatDays(row.reported.timeline_days);
}

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <TableShell
      ariaLabel="Official figures compared with citizen-reported experience"
      caption="Each row compares a service's official fee, timeline and documents with the citizen-reported additional amount, timeline and visits."
      cards={<ComparisonCards rows={rows} />}
    >
      <THead>
        <tr>
          <Th scope="col" rowSpan={2} className="align-bottom">
            Service
          </Th>
          <Th scope="col" rowSpan={2} className="align-bottom">
            Location
          </Th>
          <Th scope="colgroup" colSpan={3} group tone="official">
            <span className="block text-center">
              Official <span className="font-normal normal-case tracking-normal">(As per government)</span>
            </span>
          </Th>
          <Th scope="colgroup" colSpan={3} group tone="reported">
            <span className="block text-center">
              Citizen experience <span className="font-normal normal-case tracking-normal">(Median)</span>
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
          <Th scope="col" numeric>Fee</Th>
          <Th scope="col" numeric>Timeline</Th>
          <Th scope="col" numeric>Documents</Th>
          <Th scope="col" numeric>Additional amount</Th>
          <Th scope="col" numeric>Timeline</Th>
          <Th scope="col" numeric>Visits</Th>
        </tr>
      </THead>
      <tbody>
        {rows.map((row) => {
          const href = serviceHref(row);
          return (
            <tr key={`${row.slug}-${row.location.district ?? "all"}`} className="transition-colors duration-150 hover:bg-sunken">
              <Td>
                <div className="flex items-center gap-3">
                  <IconTile>{serviceIcon(row.slug)}</IconTile>
                  <div className="min-w-0">
                    <Link
                      href={href}
                      className="font-medium text-ink transition-colors duration-150 hover:text-official-mid"
                    >
                      {row.name}
                    </Link>
                    <div className="text-label text-ink-muted">{row.department}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-ink-secondary">{locationLabel(row)}</Td>
              <NumericTd>{formatInr(row.official.fee_inr)}</NumericTd>
              <NumericTd>{formatDays(row.official.timeline_days)}</NumericTd>
              <NumericTd>{row.official.documents ?? "—"}</NumericTd>
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
              <RowLink href={href} label={`View ${row.name}`} />
            </tr>
          );
        })}
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
      <span className={`tabular text-body font-medium ${tone === "reported" ? "text-reported" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

function ComparisonCards({ rows }: { rows: ComparisonRow[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const href = serviceHref(row);
        return (
          <li
            key={`${row.slug}-${row.location.district ?? "all"}`}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <div className="flex items-start gap-3">
              <IconTile>{serviceIcon(row.slug)}</IconTile>
              <div className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="font-sans text-h3 font-semibold text-ink transition-colors duration-150 hover:text-official-mid"
                >
                  {row.name}
                </Link>
                <p className="text-label text-ink-muted">
                  {row.department} · {locationLabel(row)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="column-label text-official-mid">Official</div>
              <div className="column-label text-reported">Citizen experience</div>
              <div className="space-y-2">
                <CardFigure label="Fee" value={formatInr(row.official.fee_inr)} />
                <CardFigure label="Timeline" value={formatDays(row.official.timeline_days)} />
                <CardFigure label="Documents" value={row.official.documents === null ? "—" : String(row.official.documents)} />
              </div>
              <div className="space-y-2">
                <CardFigure
                  label="Additional"
                  value={row.published ? formatInr(row.reported.additional_amount_inr) : <NotEnoughData />}
                  tone="reported"
                />
                <CardFigure
                  label="Timeline"
                  value={row.published ? reportedTimeline(row) : <NotEnoughData />}
                  tone="reported"
                />
                <CardFigure
                  label="Visits"
                  value={row.published ? formatVisits(row.reported.visits) : <NotEnoughData />}
                  tone="reported"
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
            <Link
              href={href}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-official-mid transition-colors duration-150 hover:text-official-deep"
            >
              View service details
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
