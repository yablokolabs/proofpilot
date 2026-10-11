import { describe, expect, it } from "vitest";
import { applyEvent, endOfStream, failCheck, initialReport, startCheck } from "@/lib/report";
import type { Claim, Verdict } from "@/lib/types";

const CLAIM: Claim = {
  id: "c1",
  quote: "Brazil produces about a third of the world's coffee",
  claim: "Brazil produces about a third of the world's coffee.",
  query: "Brazil share of world coffee production",
  start: 0,
  end: 51,
};

const VERDICT: Verdict = {
  claimId: "c1",
  status: "supported",
  explanation: "The statistics agree.",
  citations: [],
};

const checking = () =>
  applyEvent(startCheck("Some text."), { type: "claims", claims: [CLAIM], notAssessed: 2 });

describe("report state", () => {
  it("starts idle with no report", () => {
    expect(initialReport.phase).toBe("idle");
    expect(initialReport.claims).toHaveLength(0);
  });

  it("keeps the submitted text and waits for claims when a check starts", () => {
    const state = startCheck("Some text.");

    expect(state.phase).toBe("checking");
    expect(state.text).toBe("Some text.");
  });

  it("holds the claims and the number that was not assessed", () => {
    const state = checking();

    expect(state.claims).toEqual([CLAIM]);
    expect(state.notAssessed).toBe(2);
    expect(state.verdicts).toEqual({});
  });

  it("attaches each verdict to its claim", () => {
    const state = applyEvent(checking(), { type: "verdict", verdict: VERDICT });

    expect(state.verdicts.c1).toEqual(VERDICT);
    expect(state.phase).toBe("checking");
  });

  it("is complete only after the done event", () => {
    const state = applyEvent(applyEvent(checking(), { type: "verdict", verdict: VERDICT }), { type: "done" });

    expect(state.phase).toBe("done");
  });

  it("removes the partial report when the analysis reports an error", () => {
    const state = applyEvent(applyEvent(checking(), { type: "verdict", verdict: VERDICT }), {
      type: "error",
      message: "The analysis failed.",
    });

    expect(state.phase).toBe("error");
    expect(state.error).toBe("The analysis failed.");
    expect(state.claims).toHaveLength(0);
    expect(state.verdicts).toEqual({});
    expect(state.text).toBe("Some text.");
  });

  it("is an error, with no report, when the stream ends before the done event", () => {
    const state = endOfStream(applyEvent(checking(), { type: "verdict", verdict: VERDICT }));

    expect(state.phase).toBe("error");
    expect(state.error).toMatch(/before it was complete/i);
    expect(state.claims).toHaveLength(0);
  });

  it("stays complete when the stream ends after the done event", () => {
    const done = applyEvent(checking(), { type: "done" });

    expect(endOfStream(done)).toEqual(done);
  });

  it("keeps the text when a check cannot start", () => {
    const state = failCheck(startCheck("Some text."), "The server is not available.");

    expect(state.phase).toBe("error");
    expect(state.text).toBe("Some text.");
    expect(state.error).toBe("The server is not available.");
  });
});
