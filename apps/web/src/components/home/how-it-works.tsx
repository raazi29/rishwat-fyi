import { Fragment, type ReactNode } from "react";

import { ActionLink, IconTile } from "@/components/ui";
import {
  ArrowRightIcon,
  BuildingIcon,
  ChartIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";

interface Step {
  n: number;
  icon: ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    icon: <BuildingIcon />,
    title: "Official information",
    body: "We collect official fees, timelines and procedures from government sources.",
  },
  {
    n: 2,
    icon: <UsersIcon />,
    title: "Citizen reports",
    body: "Citizens share their real experiences anonymously and voluntarily.",
  },
  {
    n: 3,
    icon: <ShieldCheckIcon />,
    title: "Verification",
    body: "We verify patterns, corroborate reports and review evidence.",
  },
  {
    n: 4,
    icon: <ChartIcon />,
    title: "Public data",
    body: "Moderated data is published openly for everyone to use.",
  },
];

function StepBlock({ step }: { step: Step }) {
  return (
    <div className="flex flex-1 items-start gap-4 lg:flex-col lg:items-start lg:gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-full border border-line text-label font-semibold tabular text-ink-muted"
        >
          {step.n}
        </span>
        <IconTile>{step.icon}</IconTile>
      </div>
      <div className="min-w-0">
        <h3 className="font-sans text-h3 font-semibold text-ink">
          <span className="sr-only">{`Step ${step.n}: `}</span>
          {step.title}
        </h3>
        <p className="mt-1 max-w-[26ch] text-label text-ink-secondary">{step.body}</p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <div className="rounded-lg border border-line bg-sunken p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-12">
          <div>
            <h2 id="how-it-works-heading" className="font-serif text-h2 font-bold text-ink">
              How it works
            </h2>
            <p className="mt-3 text-body text-ink-secondary">
              We turn government process information and citizen experiences into open public
              data.
            </p>
            <ActionLink href="/methodology" className="mt-4">
              Learn more about our process
            </ActionLink>
          </div>

          <div
            role="list"
            className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-3"
          >
            {STEPS.map((step, index) => (
              <Fragment key={step.n}>
                <div role="listitem" className="lg:flex-1">
                  <StepBlock step={step} />
                </div>
                {index < STEPS.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="hidden shrink-0 text-ink-muted lg:flex lg:items-center lg:self-start lg:pt-1.5"
                  >
                    <ArrowRightIcon />
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
