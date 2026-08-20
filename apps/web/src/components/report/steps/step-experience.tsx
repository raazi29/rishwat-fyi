import { Checkbox } from "@/components/ui";
import { AlertIcon } from "@/components/icons";

import type { StepProps } from "../wizard-types";
import { ISSUE_OPTIONS } from "../wizard-types";

/**
 * Step 2 — Experience Details. The "what happened" checkbox set from the board.
 * These selections are UX context that group similar experiences; they are not
 * part of the submission payload (see wizard-types). The group error is carried
 * by an icon and a message, never colour alone.
 */
export function StepExperience({ data, errors, toggleIssue }: StepProps) {
  const errorId = errors.issues ? "issues-error" : undefined;
  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="What happened during this experience"
        aria-describedby={errorId}
        className="grid gap-x-6 sm:grid-cols-2"
      >
        {ISSUE_OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            name="issues"
            value={option.value}
            label={option.label}
            checked={data.issues.includes(option.value)}
            onChange={() => toggleIssue(option.value)}
          />
        ))}
      </div>
      {errors.issues ? (
        <p id={errorId} className="flex items-start gap-1.5 text-label text-reported">
          <AlertIcon size={16} className="mt-px shrink-0" />
          <span>{errors.issues}</span>
        </p>
      ) : null}
    </div>
  );
}
