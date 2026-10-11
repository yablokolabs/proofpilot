import { z } from "zod";
import { structuredCall } from "./llm";
import type { ExtractedClaim } from "./types";

const ExtractionSchema = z.object({
  claims: z.array(
    z.object({
      quote: z.string(),
      claim: z.string(),
      query: z.string(),
    }),
  ),
});

const SYSTEM = `You find the factual claims in a text that a person wants to publish.

A factual claim is a statement that someone can check against an independent source: a statistic, a date, a historical fact, a research finding, a record, a quantity, or a statement about what a named person or organisation did or said.

Do not return opinions, predictions, advice, definitions, or general statements that have no specific fact to check.

For each claim, return:
- "quote": the words of the claim, copied from the text character for character. Do not correct spelling, punctuation, or spacing. The quote must be one continuous passage, as short as possible while it still contains the full claim. Two quotes must not overlap.
- "claim": the claim as one self-contained sentence. Replace pronouns with the names that they refer to, so that the sentence can be checked without the surrounding text. Do not correct or soften the claim.
- "query": a web search query that would find evidence about this claim.

Return the claims in the order in which they occur in the text. If the text has no factual claims, return an empty list.`;

export async function extractClaims(text: string): Promise<ExtractedClaim[]> {
  const result = await structuredCall({
    schema: ExtractionSchema,
    schemaName: "claim_extraction",
    system: SYSTEM,
    user: text,
    maxTokens: 4000,
  });
  return result.claims;
}
