/**
 * The wizard's single reducer — the one place step state changes (per the build
 * contract: "keep the wizard state in one reducer in src/components/report").
 * Pure value helpers live in `wizard-logic.ts`; validation in `wizard-validation.ts`.
 */

import {
  TOTAL_STEPS,
  type FieldErrors,
  type SubmitFailure,
  type SubmitPhase,
  type WizardData,
  type WizardState,
} from "./wizard-types";

/** Empty form. `paid` mirrors the schema default of `false`. */
export const EMPTY_DATA: WizardData = {
  departmentSlug: "",
  serviceSlug: "",
  serviceType: "",
  stateCode: "",
  districtId: "",
  cityId: "",
  office: "",
  period: "",
  frequency: "",
  issues: [],
  officialFee: "",
  additionalAmount: "",
  amountPaid: "",
  paid: false,
  delayValue: "",
  delayUnit: "days",
  visits: "",
  description: "",
};

export const INITIAL_STATE: WizardState = {
  step: 0,
  data: EMPTY_DATA,
  errors: {},
  visited: [0],
  submit: "idle",
  failure: null,
};

export type WizardAction =
  | { type: "set"; patch: Partial<WizardData> }
  | { type: "toggleIssue"; value: string }
  | { type: "goto"; step: number }
  | { type: "next"; errors: FieldErrors }
  | { type: "back" }
  | { type: "hydrate"; data: WizardData; step: number }
  | { type: "reset" }
  | { type: "submitStart" }
  | { type: "routeErrors"; step: number; errors: FieldErrors }
  | { type: "submitError"; failure: SubmitFailure };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "set":
      return { ...state, data: { ...state.data, ...action.patch }, submit: idleAfterEdit(state.submit) };
    case "toggleIssue": {
      const has = state.data.issues.includes(action.value);
      const issues = has
        ? state.data.issues.filter((i) => i !== action.value)
        : [...state.data.issues, action.value];
      return { ...state, data: { ...state.data, issues } };
    }
    case "goto":
      return { ...state, step: clampStep(action.step), errors: {} };
    case "next": {
      if (Object.keys(action.errors).length > 0) {
        return { ...state, errors: action.errors };
      }
      const step = clampStep(state.step + 1);
      return {
        ...state,
        step,
        errors: {},
        visited: state.visited.includes(step) ? state.visited : [...state.visited, step],
      };
    }
    case "back":
      return { ...state, step: clampStep(state.step - 1), errors: {} };
    case "hydrate": {
      const step = clampStep(action.step);
      const visited = Array.from({ length: step + 1 }, (_, i) => i);
      return { ...INITIAL_STATE, data: { ...EMPTY_DATA, ...action.data }, step, visited };
    }
    case "reset":
      return INITIAL_STATE;
    case "submitStart":
      return { ...state, submit: "submitting", failure: null };
    case "routeErrors":
      return { ...state, step: clampStep(action.step), errors: action.errors, submit: "idle", failure: null };
    case "submitError":
      return { ...state, submit: "error", failure: action.failure };
    default:
      return state;
  }
}

/** Editing after a failed submit clears the error phase so the button re-enables. */
function idleAfterEdit(phase: SubmitPhase): SubmitPhase {
  return phase === "error" ? "idle" : phase;
}

export function clampStep(step: number): number {
  return Math.max(0, Math.min(TOTAL_STEPS - 1, step));
}
