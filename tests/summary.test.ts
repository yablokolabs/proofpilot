import { describe, expect, it } from "vitest";
import { summarise } from "@/lib/summary";
import type { Status } from "@/lib/types";

const input = (statuses: Status[], extra: { pending?: number; notAssessed?: number; complete?: boolean } = {}) => ({
  statuses,
  pending: extra.pending ?? 0,
  notAssessed: extra.notAssessed ?? 0,
  complete: extra.complete ?? true,
});

describe("summarise", () => {
  it("counts the claims for each status", () => {
    const summary = summarise(input(["supported", "supported", "contradicted", "unverified"]));

    expect(summary).toMatchObject({ analysed: 4, supported: 2, contradicted: 1, unverified: 1 });
  });

  it("asks for a review when a claim is contradicted", () => {
    expect(summarise(input(["supported", "contradicted"])).status).toBe("review");
  });

  it("asks for a review when a claim is unverified", () => {
    expect(summarise(input(["supported", "unverified"])).status).toBe("review");
  });

  it("reports all checked claims supported only when each claim is supported", () => {
    expect(summarise(input(["supported", "supported"])).status).toBe("all-supported");
  });

  it("does not report all supported when no claims were found", () => {
    expect(summarise(input([])).status).toBe("no-claims");
  });

  it("gives no final status while claims are still being checked", () => {
    const summary = summarise(input(["supported"], { pending: 2, complete: false }));

    expect(summary.status).toBe("checking");
    expect(summary.analysed).toBe(1);
  });

  it("does not report all supported before the check is complete, even when no claim is pending", () => {
    expect(summarise(input(["supported"], { complete: false })).status).toBe("checking");
  });

  it("reports a partial check when some claims were not assessed", () => {
    const summary = summarise(input(["supported"], { notAssessed: 3 }));

    expect(summary.partial).toBe(true);
    expect(summary.notAssessed).toBe(3);
  });

  it("does not say that no claims were found when claims were found but none could be assessed", () => {
    const summary = summarise(input([], { notAssessed: 2 }));

    expect(summary.status).toBe("review");
    expect(summary.partial).toBe(true);
  });
});
