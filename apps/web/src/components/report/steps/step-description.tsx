import { useMemo } from "react";

import { Callout, Field, Textarea } from "@/components/ui";
import { AlertIcon, EyeOffIcon } from "@/components/icons";

import type { StepProps } from "../wizard-types";
import { EvidenceUpload } from "./evidence-upload";

const MIN = 30;
const MAX = 5000;

/** Light client-side PII signals — a non-blocking caution, never a hard block. */
const PII_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/, label: "a phone number" },
  { re: /[^\s@]+@[^\s@]+\.[^\s@]+/, label: "an email address" },
  { re: /\b\d{4}\s?\d{4}\s?\d{4}\b/, label: "an Aadhaar-like number" },
];

/**
 * Step 4 — Description. A 30–5000 character account in the reporter's own words,
 * with a live counter and live PII guidance: if the text looks like it contains
 * a phone number, email, or Aadhaar-style number, a caution appears so it can
 * be removed before the server-side redaction ever runs. Evidence is optional.
 */
export function StepDescription({
  data,
  errors,
  set,
  evidenceFile,
  onEvidenceSelect,
}: StepProps & { evidenceFile: File | null; onEvidenceSelect: (file: File | null) => void }) {
  const length = data.description.trim().length;

  const piiHit = useMemo(() => {
    const found = PII_PATTERNS.filter((pattern) => pattern.re.test(data.description)).map((p) => p.label);
    return found.length > 0 ? found : null;
  }, [data.description]);

  return (
    <div className="space-y-6">
      <Field
        label="What happened?"
        required
        error={errors.description}
        hint="Describe the experience in your own words. Do not include anyone's name, phone number or address."
      >
        {(control) => (
          <Textarea
            {...control}
            value={data.description}
            maxLength={MAX}
            rows={7}
            placeholder="For example: I applied for the service and was told it would be issued faster if I paid an extra amount at the counter. I had to visit three times before it was done."
            onChange={(event) => set({ description: event.target.value })}
          />
        )}
      </Field>

      <p className="-mt-4 text-label text-ink-muted" aria-live="polite">
        {length < MIN
          ? `At least ${MIN} characters — ${length} so far.`
          : `${length} characters. Looks good.`}
      </p>

      {piiHit ? (
        <Callout tone="notice" icon={<EyeOffIcon size={20} />} title="This may contain personal information">
          It looks like your description includes {piiHit.join(" and ")}. Please remove personal
          details — you stay anonymous, and reports naming individuals cannot be published.
        </Callout>
      ) : (
        <Callout tone="notice" icon={<AlertIcon size={20} />} title="Keep it about the process">
          Describe what happened and what it cost you — never who. Do not name any official or
          include your own contact details.
        </Callout>
      )}

      <EvidenceUpload file={evidenceFile} onSelect={onEvidenceSelect} />
    </div>
  );
}
