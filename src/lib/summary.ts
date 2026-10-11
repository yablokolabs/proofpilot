import type { Status } from "./types";

export type SummaryStatus = "checking" | "no-claims" | "review" | "all-supported";

export type Summary = {
  analysed: number;
  supported: number;
  contradicted: number;
  unverified: number;
  pending: number;
  notAssessed: number;
  /** True when the model found claims that were not assessed. */
  partial: boolean;
  status: SummaryStatus;
};

export function summarise(input: {
  statuses: Status[];
  pending: number;
  notAssessed: number;
  complete: boolean;
}): Summary {
  const count = (status: Status) => input.statuses.filter((s) => s === status).length;
  const supported = count("supported");
  const analysed = input.statuses.length;

  let status: SummaryStatus;
  if (!input.complete) status = "checking";
  else if (analysed === 0 && input.notAssessed === 0) status = "no-claims";
  else if (analysed > 0 && supported === analysed) status = "all-supported";
  else status = "review";

  return {
    analysed,
    supported,
    contradicted: count("contradicted"),
    unverified: count("unverified"),
    pending: input.pending,
    notAssessed: input.notAssessed,
    partial: input.notAssessed > 0,
    status,
  };
}
