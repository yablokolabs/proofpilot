import type { Citation, RawCitation, RawVerdict, Source, Verdict } from "./types";

/** A shorter excerpt can match a source by accident and is not evidence. */
const MIN_EXCERPT_CHARS = 20;

const NO_CONFIRMED_EVIDENCE =
  "No quotation that backs a verdict could be confirmed in the retrieved sources, so this claim is unverified.";
const SOURCES_DISAGREE =
  "The retrieved sources disagree: some support this claim and others contradict it, so this claim is unverified.";
const ONLY_WEAK_SOURCES =
  "The retrieved sources that mention this are not primary or reputable secondary sources, so this claim is unverified.";

/**
 * Checks the model's verdict against the sources that the search returned.
 * A citation is kept only if its excerpt is in the retrieved content of its
 * source. A supported or contradicted status is kept only if a confirmed
 * citation with the matching stance backs it and no confirmed citation from
 * a primary or secondary source has the opposite stance.
 */
export function validateVerdict(raw: RawVerdict, sources: Source[]): Omit<Verdict, "claimId"> {
  const confirmed = raw.citations.flatMap((citation) => {
    const result = confirm(citation, sources);
    return result ? [result] : [];
  });

  if (raw.status === "unverified") {
    return { status: "unverified", explanation: raw.explanation, citations: confirmed };
  }

  const stance = raw.status === "supported" ? "supports" : "contradicts";
  const matching = confirmed.filter((citation) => citation.stance === stance);
  const backing = matching.filter((citation) => citation.sourceType !== "other");
  if (backing.length === 0) {
    const explanation = matching.length > 0 ? ONLY_WEAK_SOURCES : NO_CONFIRMED_EVIDENCE;
    return { status: "unverified", explanation, citations: confirmed };
  }
  const opposing = confirmed.filter(
    (citation) => citation.stance !== stance && citation.sourceType !== "other",
  );
  if (opposing.length > 0) {
    return { status: "unverified", explanation: SOURCES_DISAGREE, citations: [...backing, ...opposing] };
  }
  return { status: raw.status, explanation: raw.explanation, citations: backing };
}

function confirm(citation: RawCitation, sources: Source[]): Citation | null {
  const source = sources[citation.sourceIndex];
  if (!source) return null;
  const excerpt = normalise(citation.excerpt);
  if (excerpt.length < MIN_EXCERPT_CHARS) return null;
  if (!normalise(source.content).includes(excerpt)) return null;
  return {
    url: source.url,
    title: source.title,
    excerpt,
    stance: citation.stance,
    sourceType: citation.sourceType,
  };
}

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
