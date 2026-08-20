import Link from "next/link";

import type { StateServiceGap } from "@/lib/api";
import { NumericTd, RowLink, TableShell, Td, Th, THead, VerificationBadge } from "@/components/ui";
import { formatCount, formatInr } from "@/lib/utils/format";

import { NotEnoughData } from "./not-enough-data";

/**
 * The services with the largest reported gap in a state. The only comparative
 * figure the per-state model carries is the citizen-reported additional amount,
 * so this ranks by it (in reported red) and links each row to the full
 * official-vs-reported comparison on the service page, scoped to this state.
 * Below 900px each row becomes a card.
 */

function serviceHref(slug: string, stateCode: string): string {
  return `/services/${slug}?state=${encodeURIComponent(stateCode)}`;
}

export function StateServiceTable({
  services,
  stateCode,
}: {
  services: readonly StateServiceGap[];
  stateCode: string;
}) {
  return (
    <TableShell
      ariaLabel="Services with the largest reported gap in this state"
      caption="Each service's citizen report count and median additional amount reported in this state, with its verification status."
      cards={<StateServiceCards services={services} stateCode={stateCode} />}
    >
      <THead>
        <tr>
          <Th scope="col">Service</Th>
          <Th scope="col">Department</Th>
          <Th scope="col" numeric>
            Reports
          </Th>
          <Th scope="col" numeric>
            Median additional amount
          </Th>
          <Th scope="col">Verification status</Th>
          <Th scope="col">
            <span className="sr-only">View service</span>
          </Th>
        </tr>
      </THead>
      <tbody>
        {services.map((service) => {
          const href = serviceHref(service.slug, stateCode);
          return (
            <tr key={service.slug} className="transition-colors duration-150 hover:bg-sunken">
              <Td>
                <Link
                  href={href}
                  className="font-medium text-ink transition-colors duration-150 hover:text-official-mid"
                >
                  {service.name}
                </Link>
              </Td>
              <Td className="text-ink-secondary">{service.department}</Td>
              <NumericTd>{formatCount(service.report_count)}</NumericTd>
              <NumericTd tone="reported">
                {service.additional_amount_median === null ? (
                  <NotEnoughData />
                ) : (
                  formatInr(service.additional_amount_median)
                )}
              </NumericTd>
              <Td>
                {service.verification ? (
                  <VerificationBadge status={service.verification} />
                ) : (
                  <NotEnoughData variant="text" label="Below threshold" />
                )}
              </Td>
              <RowLink href={href} label={`View ${service.name}`} />
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

function StateServiceCards({
  services,
  stateCode,
}: {
  services: readonly StateServiceGap[];
  stateCode: string;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {services.map((service) => {
        const href = serviceHref(service.slug, stateCode);
        return (
          <li key={service.slug} className="rounded-lg border border-line bg-surface p-5">
            <Link
              href={href}
              className="font-sans text-h3 font-semibold text-ink transition-colors duration-150 hover:text-official-mid"
            >
              {service.name}
            </Link>
            <p className="text-label text-ink-muted">{service.department}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-label text-ink-muted">Reports</span>
                <span className="tabular text-body font-medium text-ink">
                  {formatCount(service.report_count)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-label text-ink-muted">Median additional amount</span>
                <span className="tabular text-body font-medium text-reported">
                  {service.additional_amount_median === null ? (
                    <NotEnoughData />
                  ) : (
                    formatInr(service.additional_amount_median)
                  )}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-line-inner pt-3">
              {service.verification ? (
                <VerificationBadge status={service.verification} />
              ) : (
                <NotEnoughData variant="text" label="Below publishing threshold" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
