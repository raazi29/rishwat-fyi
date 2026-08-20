import type { ReactNode } from "react";

/**
 * A plain ordered ladder of the five public verification rungs, rendered from
 * local data for the methodology page. It deliberately does not import the
 * service page's verification component — it is a simple numbered list with a
 * connecting rule, so the concept reads the same without coupling the two
 * surfaces. Meanings are taken verbatim in intent from docs/methodology.md.
 */

interface Rung {
  status: string;
  name: string;
  meaning: ReactNode;
}

const RUNGS: Rung[] = [
  { status: "submitted", name: "Submitted", meaning: "Raw citizen submission, pending basic checks." },
  { status: "validated", name: "Validated", meaning: "Basic spam and quality checks passed." },
  {
    status: "corroborated",
    name: "Corroborated",
    meaning: "Similar independent reports support the same pattern.",
  },
  {
    status: "evidence_backed",
    name: "Evidence-backed",
    meaning: "Supporting documentation has been reviewed and accepted.",
  },
  {
    status: "officially_acknowledged",
    name: "Officially acknowledged",
    meaning: "A government authority or official source acknowledges the underlying issue.",
  },
];

export function StatusLadder() {
  return (
    <ol className="mt-2">
      {RUNGS.map((rung, index) => {
        const isLast = index === RUNGS.length - 1;
        return (
          <li key={rung.status} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-4 top-9 w-px -translate-x-1/2 bg-official-soft"
              />
            ) : null}
            <span className="tabular relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-official text-label font-semibold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-serif text-body-lg font-bold text-ink">{rung.name}</p>
              <p className="mt-0.5 text-body text-ink-secondary">{rung.meaning}</p>
              <code className="mt-1 inline-block font-mono text-micro text-ink-muted">
                {rung.status}
              </code>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
