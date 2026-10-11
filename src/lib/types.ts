export type Status = "supported" | "contradicted" | "unverified";
export type Stance = "supports" | "contradicts";
export type SourceType = "primary" | "secondary" | "other";

/** A claim as the model returns it, before its quote is located in the text. */
export type ExtractedClaim = {
  quote: string;
  claim: string;
  query: string;
};

/** A claim whose quote is an exact span of the input text. */
export type Claim = ExtractedClaim & {
  id: string;
  start: number;
  end: number;
};

/** One search result. All citation URLs and titles come from here. */
export type Source = {
  url: string;
  title: string;
  content: string;
};

/** A citation as the model returns it, before validation. */
export type RawCitation = {
  sourceIndex: number;
  excerpt: string;
  stance: Stance;
  sourceType: SourceType;
};

export type RawVerdict = {
  status: Status;
  explanation: string;
  citations: RawCitation[];
};

/** A citation whose excerpt was confirmed in the retrieved source. */
export type Citation = {
  url: string;
  title: string;
  excerpt: string;
  stance: Stance;
  sourceType: SourceType;
};

export type Verdict = {
  claimId: string;
  status: Status;
  explanation: string;
  citations: Citation[];
};

export type CheckEvent =
  | { type: "claims"; claims: Claim[]; notAssessed: number }
  | { type: "verdict"; verdict: Verdict }
  | { type: "done" }
  | { type: "error"; message: string };
