import type { CheckEvent, Claim, Verdict } from "./types";

export type ReportState = {
  phase: "idle" | "checking" | "done" | "error";
  /** The text that was submitted for the check. */
  text: string;
  claims: Claim[];
  verdicts: Record<string, Verdict>;
  notAssessed: number;
  error: string | null;
};

export const initialReport: ReportState = {
  phase: "idle",
  text: "",
  claims: [],
  verdicts: {},
  notAssessed: 0,
  error: null,
};

export function startCheck(text: string): ReportState {
  return { ...initialReport, phase: "checking", text };
}

export function applyEvent(state: ReportState, event: CheckEvent): ReportState {
  switch (event.type) {
    case "claims":
      return { ...state, claims: event.claims, notAssessed: event.notAssessed };
    case "verdict":
      return { ...state, verdicts: { ...state.verdicts, [event.verdict.claimId]: event.verdict } };
    case "done":
      return { ...state, phase: "done" };
    case "error":
      return failCheck(state, event.message);
  }
}

/** A stream that ends with no `done` event gives no report: the result is not complete. */
export function endOfStream(state: ReportState): ReportState {
  if (state.phase !== "checking") return state;
  return failCheck(state, "The analysis stopped before it was complete. Try again.");
}

/** Removes a partial report and keeps the text for a new try. */
export function failCheck(state: ReportState, message: string): ReportState {
  return { ...initialReport, phase: "error", text: state.text, error: message };
}
