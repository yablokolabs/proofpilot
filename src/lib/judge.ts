import { z } from "zod";
import { structuredCall } from "./llm";
import type { Claim, RawVerdict, Source } from "./types";

const VerdictSchema = z.object({
  explanation: z.string(),
  status: z.enum(["supported", "contradicted", "unverified"]),
  citations: z.array(
    z.object({
      sourceIndex: z.number().int(),
      excerpt: z.string(),
      stance: z.enum(["supports", "contradicts"]),
      sourceType: z.enum(["primary", "secondary", "other"]),
    }),
  ),
});

const SYSTEM = `You decide if retrieved sources support or contradict one factual claim. A person wants to publish this claim, and an incorrect verdict can damage their credibility.

The numbered sources in the message are the only evidence. Your own knowledge is not evidence. If you know that the claim is true or false but the sources do not show it, the status is "unverified".

Status:
- "supported": a minimum of one source states the fact in the claim. Specific details must agree: numbers, dates, names, and units. A small rounding difference is acceptable (for example "about a third" and "35 percent").
- "contradicted": a minimum of one source states a fact that cannot be true at the same time as the claim, for example a different number, a different date, a different person, or a direct statement that the claim is false or is a myth.
- "unverified": all other cases. The sources do not mention the fact, are about a different subject, are vague, disagree with each other, or come only from sources of the type "other".

Do not select "supported" because a source is about the same subject. Do not select "contradicted" because the sources do not mention the claim. Absence of evidence is "unverified".

Citations:
- "sourceIndex": the number of the source.
- "excerpt": the passage that shows the evidence, copied from that source character for character, between 40 and 400 characters. Do not paraphrase, do not join separate passages, and do not use "...".
- "stance": "supports" or "contradicts", for this excerpt in relation to the claim.
- "sourceType": "primary" for official statistics, government or intergovernmental bodies, peer-reviewed research, standards bodies, and an organisation's own documentation about itself. "secondary" for established news organisations, reference works, and recognised expert publications. "other" for forums, social media, marketing pages, personal blogs, content farms, and pages whose origin is not clear.

For "supported" and "contradicted", give a minimum of one citation with the matching stance from a primary or secondary source. For "unverified", cite the passages that are the most relevant, or give an empty list.

"explanation": for the person who wants to publish. A maximum of two sentences and 45 words. State what the sources say and how that compares with the claim. Name a source by its publisher, not by its number. Do not repeat the claim. Write the explanation before you decide the status.`;

export async function judgeClaim(claim: Claim, sources: Source[]): Promise<RawVerdict> {
  const evidence = sources
    .map(
      (source, index) =>
        `<source index="${index}">\n<title>${source.title}</title>\n<url>${source.url}</url>\n<content>\n${source.content}\n</content>\n</source>`,
    )
    .join("\n\n");

  return structuredCall({
    schema: VerdictSchema,
    schemaName: "claim_verdict",
    system: SYSTEM,
    user: `<claim>${claim.claim}</claim>\n\n<sources>\n${evidence}\n</sources>`,
    maxTokens: 4000,
  });
}
