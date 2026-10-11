import { validateVerdict } from "./citations";
import { MAX_CLAIMS } from "./limits";
import { locateClaims } from "./spans";
import type { CheckEvent, Claim, ExtractedClaim, RawVerdict, Source, Verdict } from "./types";

export type PipelineDeps = {
  extract: (text: string) => Promise<ExtractedClaim[]>;
  retrieve: (claim: Claim) => Promise<Source[]>;
  judge: (claim: Claim, sources: Source[]) => Promise<RawVerdict>;
};

const MAX_PARALLEL_CLAIMS = 4;

/**
 * Runs one check and reports progress through `emit`.
 * A failure of the extraction rejects the promise. A failure for one claim
 * makes that claim unverified and does not stop the other claims.
 */
export async function runCheck(
  text: string,
  deps: PipelineDeps,
  emit: (event: CheckEvent) => void,
): Promise<void> {
  const extracted = await deps.extract(text);
  const { claims, notAssessed } = locateClaims(text, extracted, MAX_CLAIMS);
  emit({ type: "claims", claims, notAssessed });

  const queue = [...claims];
  const worker = async () => {
    for (let claim = queue.shift(); claim; claim = queue.shift()) {
      emit({ type: "verdict", verdict: await checkClaim(claim, deps) });
    }
  };
  await Promise.all(Array.from({ length: MAX_PARALLEL_CLAIMS }, worker));

  emit({ type: "done" });
}

async function checkClaim(claim: Claim, deps: PipelineDeps): Promise<Verdict> {
  const unverified = (explanation: string): Verdict => ({
    claimId: claim.id,
    status: "unverified",
    explanation,
    citations: [],
  });

  let sources: Source[];
  try {
    sources = await deps.retrieve(claim);
  } catch (error) {
    console.error(`Evidence retrieval failed for claim ${claim.id}:`, error);
    return unverified("The evidence search failed for this claim, so it could not be checked.");
  }
  if (sources.length === 0) {
    return unverified("The evidence search returned no sources for this claim.");
  }

  try {
    return { claimId: claim.id, ...validateVerdict(await deps.judge(claim, sources), sources) };
  } catch (error) {
    console.error(`Evidence evaluation failed for claim ${claim.id}:`, error);
    return unverified("The evidence for this claim could not be evaluated.");
  }
}
