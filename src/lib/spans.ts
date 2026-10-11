import type { Claim, ExtractedClaim } from "./types";

/**
 * Finds each quote in the original text by exact match.
 * A quote that is not in the text, that overlaps an earlier claim, or that is
 * above the claim limit is not highlighted. It is counted as not assessed.
 */
export function locateClaims(
  text: string,
  extracted: ExtractedClaim[],
  maxClaims: number,
): { claims: Claim[]; notAssessed: number } {
  const located: Omit<Claim, "id">[] = [];

  for (const item of extracted) {
    if (located.length >= maxClaims || item.quote.length === 0) continue;
    const start = findFreeOccurrence(text, item.quote, located);
    if (start === -1) continue;
    located.push({ ...item, start, end: start + item.quote.length });
  }

  const claims = located
    .sort((a, b) => a.start - b.start)
    .map((claim, index) => ({ ...claim, id: `c${index + 1}` }));
  return { claims, notAssessed: extracted.length - claims.length };
}

function findFreeOccurrence(
  text: string,
  quote: string,
  taken: { start: number; end: number }[],
): number {
  let start = text.indexOf(quote);
  while (start !== -1) {
    const end = start + quote.length;
    if (!taken.some((span) => start < span.end && span.start < end)) return start;
    start = text.indexOf(quote, start + 1);
  }
  return -1;
}
