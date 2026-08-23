import Link from "next/link";
import type { ReactNode } from "react";

import type { StateGap } from "@/lib/api/types";
import { NumericTd, RowLink, TableShell, Td, Th, THead } from "@/components/ui";
import { formatCount, formatInr, parseInr } from "@/lib/utils/format";

import { NotEnoughData } from "./not-enough-data";

/**
 * The complete ranked state table on /map: State · Reports · Median additional
 * amount · Median delay · Services covered · Districts covered · link. Numeric
 * cells are tabular and right-aligned; the citizen-reported median is the only
 * red column. A below-threshold median renders "Not enough reports yet" instead
 * of ₹0, and the delay column is honestly marked because per-state delay is not
 * in the published data yet. Below 900px each row becomes a card (no horizontal
 * scroll).
 */

const DELAY_UNPUBLISHED = "Not published yet";

function stateHref(code: string): string {
  return `/states/${code}`;
}

export function StateTable({ rows }: { rows: readonly StateGap[] }) {
  // Priority-2 honesty: when the dataset carries no qualifying reports, every
  // "Median additional amount" cell is null and the table reads as a column of
  // dashes. Name the reason once above the table (mirroring the StateGapList
  // leading line) so the dashes read as "below threshold", never as zero or a
  // broken table. Only shown in that all-null state; hidden the moment any
  // state has a published figure.
  const allUnpublished =
    rows.length > 0 && rows.every((state) => parseInr(state.additional_amount_median) === null);
  return (
    <>
      {allUnpublished ? (
        <p className="mb-4 text-label text-ink-muted">
          No state has reached the publishing threshold yet, so the median additional amount is not
          shown for any state below.
        </p>
      ) : null}
      <TableShell
        ariaLabel="States ranked by citizen-reported gap"
        caption="Each state's report count, median additional amount reported, services covered and districts covered."
        cards={<StateCards rows={rows} />}
      >
      <THead>
        <tr>
          <Th scope="col">State</Th>
          <Th scope="col" numeric>
            Reports
          </Th>
          <Th scope="col" numeric>
            Median additional amount
          </Th>
          <Th scope="col" numeric>
            Median delay
          </Th>
          <Th scope="col" numeric>
            Services covered
          </Th>
          <Th scope="col" numeric>
            Districts covered
          </Th>
          <Th scope="col">
            <span className="sr-only">View state</span>
          </Th>
        </tr>
      </THead>
      <tbody>
        {rows.map((state) => {
          const median = parseInr(state.additional_amount_median);
          return (
            <tr key={state.code} className="transition-colors duration-150 hover:bg-sunken">
              <Td>
                <Link
                  href={stateHref(state.code)}
                  className="font-medium text-ink transition-colors duration-150 hover:text-official-mid"
                >
                  {state.name}
                </Link>
              </Td>
              <NumericTd>{formatCount(state.report_count)}</NumericTd>
              <NumericTd tone="reported">
                {median === null ? <NotEnoughData /> : formatInr(median)}
              </NumericTd>
              <NumericTd>
                <NotEnoughData label={DELAY_UNPUBLISHED} />
              </NumericTd>
              <NumericTd>{formatCount(state.services_covered)}</NumericTd>
              <NumericTd>{formatCount(state.districts_covered)}</NumericTd>
              <RowLink href={stateHref(state.code)} label={`View ${state.name}`} />
            </tr>
          );
        })}
      </tbody>
      </TableShell>
    </>
  );
}

function CardFigure({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  tone?: "ink" | "reported";
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

function StateCards({ rows }: { rows: readonly StateGap[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((state) => {
        const median = parseInr(state.additional_amount_median);
        return (
          <li key={state.code} className="rounded-lg border border-line bg-surface p-5">
            <Link
              href={stateHref(state.code)}
              className="font-sans text-h3 font-semibold text-ink transition-colors duration-150 hover:text-official-mid"
            >
              {state.name}
            </Link>
            <div className="mt-3 space-y-2">
              <CardFigure label="Reports" value={formatCount(state.report_count)} />
              <CardFigure
                label="Median additional amount"
                tone="reported"
                value={median === null ? <NotEnoughData /> : formatInr(median)}
              />
              <CardFigure label="Median delay" value={<NotEnoughData label={DELAY_UNPUBLISHED} />} />
              <CardFigure label="Services covered" value={formatCount(state.services_covered)} />
              <CardFigure label="Districts covered" value={formatCount(state.districts_covered)} />
            </div>
            <Link
              href={stateHref(state.code)}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-official-mid transition-colors duration-150 hover:text-official-deep"
            >
              View {state.name}
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
