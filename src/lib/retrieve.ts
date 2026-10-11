import { tavily } from "@tavily/core";
import type { Claim, Source } from "./types";

const MAX_SOURCES = 5;

export async function retrieveEvidence(claim: Claim): Promise<Source[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set.");

  const response = await tavily({ apiKey }).search(claim.query, {
    searchDepth: "advanced",
    maxResults: MAX_SOURCES,
    chunksPerSource: 3,
  });

  return response.results
    .filter((result) => result.content.trim().length > 0)
    .map((result) => ({ url: result.url, title: result.title, content: result.content }));
}
