"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, ButtonLink, Callout, Skeleton, Steps, type StepItem } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/icons";

import { INITIAL_STATE, wizardReducer } from "./wizard-reducer";
import {
  TOTAL_STEPS,
  WIZARD_STEPS,
  type FieldErrors,
  type WizardData,
  type WizardGeo,
} from "./wizard-types";
import {
  clearDraft,
  loadDraft,
  pruneStaleSelections,
  resolveSelections,
  saveDraft,
} from "./wizard-logic";
import { stepForField, validatePayload, validateStep } from "./wizard-validation";
import { saveReceipt, type ReportReceipt } from "./report-receipt";
import { submitReportAction, uploadEvidenceAction } from "./actions";
import { TrustRail } from "./trust-rail";
import { StepServiceLocation } from "./steps/step-service-location";
import { StepExperience } from "./steps/step-experience";
import { StepPayments } from "./steps/step-payments";
import { StepDescription } from "./steps/step-description";
import { StepReview } from "./steps/step-review";

const STEP_ITEMS: StepItem[] = WIZARD_STEPS.map((step) => ({ title: step.title }));

function earliestErrorStep(errors: FieldErrors, fallback: number): number {
  const keys = Object.keys(errors) as (keyof WizardData)[];
  if (keys.length === 0) return fallback;
  return keys.reduce((min, key) => Math.min(min, stepForField(key)), TOTAL_STEPS);
}

export function ReportWizard({ geo }: { geo: WizardGeo }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [live, setLive] = useState("");
  const headingRef = useRef<HTMLLegendElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prevStep = useRef(0);
  const didHydrate = useRef(false);
  // Set just before a navigation/submit that failed validation, so the focus
  // effect below moves focus to the first invalid control instead of the step
  // heading. Reset once consumed.
  const focusInvalid = useRef(false);

  // Restore any saved draft once, on mount. Stale selections (a service,
  // district, or city that no longer exists in the current catalogue) are
  // pruned before the reducer ever sees them, so a rehydrated draft cannot
  // carry a dangling id into validation or the payload.
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: "hydrate", data: pruneStaleSelections(draft.data, geo), step: draft.step });
    }
    setHydrated(true);
  }, [geo]);

  // Persist the draft on every change, once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    saveDraft(state.data, state.step);
  }, [hydrated, state.data, state.step]);

  // Move focus to the step heading and announce the step after an advance —
  // unless a failed validation asked for the first invalid field instead.
  useEffect(() => {
    if (!hydrated || prevStep.current === state.step) return;
    prevStep.current = state.step;
    if (focusInvalid.current) return;
    headingRef.current?.focus();
    const step = WIZARD_STEPS[state.step];
    if (step) setLive(`Step ${state.step + 1} of ${TOTAL_STEPS}: ${step.title}`);
  }, [hydrated, state.step]);

  // After a failed navigation or submit, move focus to the first invalid field
  // so a keyboard or screen-reader user lands exactly where a fix is needed.
  // Defined after the heading effect so it wins when both would run.
  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
  }, [state.errors]);

  const set = useCallback((patch: Partial<WizardData>) => dispatch({ type: "set", patch }), []);
  const toggleIssue = useCallback((value: string) => dispatch({ type: "toggleIssue", value }), []);
  const goto = useCallback((step: number) => dispatch({ type: "goto", step }), []);

  const isLast = state.step === TOTAL_STEPS - 1;

  const handleNext = () => {
    const errors = validateStep(state.step, state.data, geo);
    focusInvalid.current = Object.keys(errors).length > 0;
    dispatch({ type: "next", errors });
    if (focusInvalid.current) {
      setLive("Some answers need attention. Please fix the highlighted fields before continuing.");
    }
  };

  const handleSubmit = async () => {
    const result = validatePayload(state.data, geo);
    if (!result.ok) {
      const step = earliestErrorStep(result.errors, state.step);
      focusInvalid.current = true;
      dispatch({ type: "routeErrors", step, errors: result.errors });
      setLive("Some answers need attention. We've opened the step where they can be fixed.");
      return;
    }

    dispatch({ type: "submitStart" });
    const res = await submitReportAction(result.payload);

    if (res.ok) {
      const sel = resolveSelections(state.data, geo);
      const location = [sel.cityName, sel.stateName].filter(Boolean).join(", ") || null;
      // The upload is awaited rather than fired and forgotten: the navigation
      // below would otherwise be free to abort the in-flight server action. The
      // report itself is already saved, so a failure here is reported on the
      // confirmation screen instead of discarding the submission.
      let evidenceAttached: boolean | undefined;
      if (evidenceFile) {
        const form = new FormData();
        form.append("file", evidenceFile);
        // public_id + the one-time token is what POST /evidence authorizes on;
        // the internal report uuid is deliberately never exposed publicly.
        form.append("public_id", res.publicId);
        form.append("token", res.token);
        form.append("mime_type", evidenceFile.type);
        form.append("size_bytes", String(evidenceFile.size));
        const upload = await uploadEvidenceAction(form).catch(() => null);
        evidenceAttached = upload?.ok === true;
      }
      const receipt: ReportReceipt = {
        publicId: res.publicId,
        token: res.token,
        evidenceAttached,
        status: res.status,
        submittedAt: new Date().toISOString(),
        serviceName: sel.serviceName,
        serviceType: state.data.serviceType || null,
        location,
      };
      saveReceipt(receipt);
      clearDraft();
      router.push("/report/submitted");
      return;
    }

    if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
      const errors = res.fieldErrors as FieldErrors;
      focusInvalid.current = true;
      dispatch({ type: "routeErrors", step: earliestErrorStep(errors, state.step), errors });
      setLive(res.message);
      return;
    }
    dispatch({ type: "submitError", failure: { code: res.code, message: res.message, retryable: res.retryable } });
    setLive(res.message);
  };

  const handleSaveExit = () => {
    saveDraft(state.data, state.step);
    setDraftSaved(true);
    setLive("Your draft has been saved on this device.");
  };

  const stepProps = { data: state.data, errors: state.errors, geo, set, toggleIssue };
  const current = WIZARD_STEPS[state.step];

  return (
    <div>
      <header className="min-w-0">
        <h1 className="font-serif text-h1 font-bold text-ink">Share your experience</h1>
        <p className="mt-1 text-body-lg text-ink-secondary">
          It takes about 3 minutes. We never ask for your name or contact details.
        </p>
      </header>

      {/* One concise anonymity assurance plus the optional "What can I report?"
          disclosure, directly below the introduction. */}
      <div className="mt-5">
        <TrustRail />
      </div>

      {hydrated ? (
        <Steps steps={STEP_ITEMS} current={state.step} ariaLabel="Report progress" className="mt-6" />
      ) : (
        <Skeleton className="mt-6 h-16 w-full" />
      )}

      {draftSaved ? (
        <DraftSavedPanel onContinue={() => setDraftSaved(false)} />
      ) : !hydrated ? (
        <Skeleton className="mt-6 h-96 w-full" />
      ) : (
        <form
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) void handleSubmit();
            else handleNext();
          }}
          className="mt-6 rounded-lg border border-line bg-surface p-5 sm:p-6"
        >
          <fieldset className="min-w-0 border-0 p-0">
            <legend
              ref={headingRef}
              tabIndex={-1}
              className="w-full scroll-mt-24 font-serif text-h2 font-bold text-ink outline-none"
            >
              {current?.heading ?? ""}
            </legend>
            {current?.intro ? (
              <p className="mt-1 text-body text-ink-secondary">{current.intro}</p>
            ) : null}
            <div className="mt-5">
              {state.step === 0 ? <StepServiceLocation {...stepProps} /> : null}
              {state.step === 1 ? <StepExperience {...stepProps} /> : null}
              {state.step === 2 ? <StepPayments {...stepProps} /> : null}
              {state.step === 3 ? (
                <StepDescription {...stepProps} evidenceFile={evidenceFile} onEvidenceSelect={setEvidenceFile} />
              ) : null}
              {state.step === 4 ? (
                <StepReview {...stepProps} goto={goto} evidenceFile={evidenceFile} />
              ) : null}
            </div>
          </fieldset>

          {state.failure ? (
            <Callout
              tone={state.failure.code === "rate_limited" ? "info" : "notice"}
              title={
                state.failure.code === "rate_limited"
                  ? "You've reached the reporting limit"
                  : "We couldn't submit this report"
              }
              className="mt-6"
            >
              {state.failure.message}
            </Callout>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-line-inner pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              {state.step > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  iconLeading={<ArrowLeftIcon size={18} />}
                  onClick={() => dispatch({ type: "back" })}
                >
                  Back
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                loading={state.submit === "submitting"}
                loadingLabel="Submitting…"
                iconTrailing={
                  state.submit === "submitting" ? undefined : isLast ? (
                    <CheckCircleIcon size={18} />
                  ) : (
                    <ArrowRightIcon size={18} />
                  )
                }
              >
                {isLast ? "Submit report" : "Continue"}
              </Button>
            </div>
            <Button type="button" variant="quiet" onClick={handleSaveExit}>
              Save draft & exit
            </Button>
          </div>
        </form>
      )}

      <div aria-live="polite" className="sr-only" role="status">
        {live}
      </div>
    </div>
  );
}

function DraftSavedPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-surface p-6 text-center">
      <span className="mx-auto inline-flex size-11 items-center justify-center rounded-tile bg-sage text-official-mid">
        <CheckCircleIcon size={24} />
      </span>
      <h2 className="mt-3 font-serif text-h2 font-bold text-ink">Draft saved on this device</h2>
      <p className="mx-auto mt-2 max-w-[52ch] text-body text-ink-secondary">
        Your report so far is saved only in this browser, on this device. It never leaves your
        device and no one else can see it. Come back anytime to finish it.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" variant="primary" onClick={onContinue}>
          Continue your report
        </Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
