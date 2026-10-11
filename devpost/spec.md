---
doc: spec
status: approved
---

# ProofPilot AI — Technical Spec

## How This Works, In Plain Language

ProofPilot is one web application with two parts in one project: a page in the browser and one server route.

1. **The page** has a text box. When Alex selects **Check claims**, the page sends the text to the server route and reads the answer as a stream of small JSON messages.
2. **The server route** runs a pipeline of three stages:
   - **Extract.** It sends the text to a language model and asks for the factual claims. For each claim, the model must return the exact words from the text (the "quote") and a search query.
   - **Retrieve.** For each claim, it calls the Tavily search API and gets a list of real web pages, each with a title, a URL, and text content.
   - **Judge.** For each claim, it sends the claim and the retrieved sources to the language model and asks for a verdict, a short explanation, and citations. Each citation is a URL and an excerpt.
3. **Between the stages, plain code checks the model's work.** This code is the centre of the design. It does not trust the model:
   - A quote that is not an exact substring of Alex's text cannot be highlighted, so the claim is counted as "not assessed".
   - A citation whose URL was not returned by the search is dropped.
   - A citation whose excerpt is not an exact substring of that page's retrieved text is dropped.
   - A Supported or Contradicted verdict with zero valid citations from a primary or reputable secondary source becomes Unverified.
4. **The page** shows each verdict as it arrives: the highlight changes from "checking" to green, red, or amber. When all claims are done, the summary shows the final status.

The language model is an open-weight model hosted by Nebius Token Factory, called through an OpenAI-compatible API.

Nothing is stored. There is no database, no account, and no background work.

Why this shape and not something larger: one process and one start command are sufficient for one workflow. The separate search call is the reason that the "never fabricate" rule is enforced by code and not by a prompt.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

```
Browser page                Server route /api/check              External
------------                -------------------------            --------
paste + Check claims  --->  validate length (limits)
                            extract claims              --->     Nebius
                            locate quotes in text (spans)
show text with        <---  event: claims
"checking" highlights       for each claim, in parallel:
                              search                    --->     Tavily
                              judge                     --->     Nebius
                              validate citations (citations)
highlight turns       <---    event: verdict
green / red / amber
show summary status   <---  event: done
click a highlight     --->  (no server call: the evidence is already in the page)
```

## Stack

| Choice | Detail | Reason and tradeoff |
| --- | --- | --- |
| Language | TypeScript, Node 22 | The learner's known language. One language for the page and the server. |
| Framework | [Next.js](https://nextjs.org/docs) App Router, current stable from `create-next-app` | One project and one start command, and the keys stay on the server. Tradeoff: less separation than two services. |
| Styling | [Tailwind CSS](https://tailwindcss.com/docs) | Fast, consistent styling without a component library. |
| Fonts | `next/font` with a serif for the report text and a sans-serif for the interface | Editorial look from `prd.md > Look and Feel`. |
| LLM | [Nebius Token Factory](https://docs.tokenfactory.nebius.com), an OpenAI-compatible API, through the [`openai`](https://github.com/openai/openai-node) package with a custom base URL. Default model `moonshotai/Kimi-K3`, set by `NEBIUS_MODEL`. | The learner supplied a Nebius key. Strict JSON-schema output works on this endpoint (observed, see `Decisions and Open Issues`). Tradeoff: the quality of the judge step on open models is not yet measured. |
| Schemas | [Zod](https://zod.dev) with `zodResponseFormat` | The request sends a strict JSON schema, and the server validates the reply against the same schema. |
| Search | [Tavily](https://docs.tavily.com) JavaScript SDK `@tavily/core` | The server holds the retrieved text, so it can validate each citation. Tradeoff: a second service and key. |
| Tests | [Vitest](https://vitest.dev) | Fast unit tests for the validation logic. |
| Package manager | pnpm 10 | Installed on this machine. |

Not verified, to check at the start of the build:
- The current Next.js and Tailwind major versions and their setup commands.
- Which Nebius model gives the best verdicts. See `Decisions and Open Issues`.
- Nebius prices and rate limits.
- The current Tavily plan limits and credit costs.
- The real response time of one check. The estimate is 15 to 40 seconds and is not a measurement.

## Where It Runs and How Someone Tries It

- **Runtime:** a local Node process. No deployment. A recording of the local app is the demo.
- **Requirements:** Node 22, pnpm, and two keys in a local `.env` file: `NEBIUS_API_KEY` and `TAVILY_API_KEY`. `NEBIUS_MODEL` is optional. `.env.example` lists the names with no values.
- **Start:** `pnpm install`, then `pnpm dev`, then open `http://localhost:3000`.
- **Checks:** `pnpm test` runs the unit tests. `pnpm check:live "<text>"` runs the real pipeline from the command line and prints the events.
- **Submission:** a short demo video and a public GitHub repository. Deployment is optional and is not planned.
- **Repository:** https://github.com/yablokolabs/proofpilot (public, MIT licence).
- **Demo video file:** `demo/proofpilot-demo.mp4` (2:18). The public video link is not recorded yet: the learner uploads the video.

## Look and Feel
From `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- **Style:** editorial. A light page, a narrow reading column for the text, generous line height, and thin rules in place of heavy cards and shadows.
- **Typography:** a serif face for Alex's text and the claims, a sans-serif face for labels, counts, and controls.
- **Colour:** neutral ink and paper tones. Green, red, and amber are used only for claim status. One dark neutral for the primary button.
- **Status never by colour alone:** each highlight has a text label, and each status has a distinct underline style (solid, double, dashed) and an icon.
- **Copy:** short and factual. No assistant voice, no first person, no message bubbles, no avatar.
- **Fixed wording:** "REVIEW BEFORE PUBLISHING", "ALL CHECKED CLAIMS SUPPORTED", "Only the highlighted claims were checked."
- **Layout:** the evidence card is beside the text at 1024 px and wider, and below it on a narrower screen.

## Components

### Check Route
`src/app/api/check/route.ts`. A POST route that takes `{ text }`, validates it, runs the pipeline, and returns a stream of newline-delimited JSON events. It maps errors to an `error` event or an HTTP error status.
PRD ref: `prd.md > The Core Journey`, `prd.md > States and Boundaries`.

### Limits
`src/lib/limits.ts`. `MAX_INPUT_CHARS = 3000` and `MAX_CLAIMS = 8`, used by the page and the server. The server rejects empty text and text above the limit with HTTP 400. It never truncates.
PRD ref: `prd.md > Text Input`.

### Claim Extractor
`src/lib/extract.ts`. One model call with a Zod schema. Output per claim: `quote` (exact words from the text), `claim` (a self-contained statement), and `query` (a search query). The prompt tells the model to return only factual claims that can be checked independently, and to return an empty list if there are none.
PRD ref: `prd.md > Claim Extraction`.

### Span Locator
`src/lib/spans.ts`. Pure code. It finds each quote in the original text by exact match and returns start and end offsets. It rejects a quote that is not found or that overlaps an earlier claim. It applies `MAX_CLAIMS`. It returns the located claims and the number of claims that were found but not assessed.
PRD ref: `prd.md > Claim Extraction`, `prd.md > Inline Claim Highlighting`.

### Evidence Retriever
`src/lib/retrieve.ts`. One Tavily search per claim. It returns a list of sources: `url`, `title`, `content`.
PRD ref: `prd.md > Evidence Retrieval and Sources`.

### Claim Judge
`src/lib/judge.ts`. One model call per claim with a Zod schema. Input: the claim and the numbered sources. Output: `status`, `explanation`, and `citations`, each with `sourceIndex`, `excerpt` (copied exactly from the source content), `stance` (supports or contradicts), and `sourceType` (primary, secondary, other). The prompt says that only the supplied sources are evidence, that the model's own knowledge is not evidence, and that weak, conflicting, or irrelevant evidence gives Unverified.
PRD ref: `prd.md > Claim Classification`.

### Citation Validator
`src/lib/citations.ts`. Pure code. For each citation: the `sourceIndex` must refer to a retrieved source, and the `excerpt`, after whitespace normalisation, must be a substring of that source's content. Invalid citations are dropped. The URL and the title that the page shows always come from the Tavily result, never from the model. Then the status rules apply:
- Supported or Contradicted needs a minimum of one valid citation with the matching stance and a `sourceType` of primary or secondary. If not, the status becomes Unverified and the explanation says why.
- A search or model failure for one claim gives Unverified with the reason.
PRD ref: `prd.md > Evidence Retrieval and Sources`, `prd.md > Claim Classification`, `prd.md > States and Boundaries`.

### Pipeline
`src/lib/pipeline.ts`. It connects the stages and emits events through a callback. The extractor, the retriever, and the judge are passed in as functions, so the orchestration and the validation can be tested without a network. Claims are judged in parallel with a limit of 4 at a time.
PRD ref: `prd.md > The Core Journey`.

### Summary Logic
`src/lib/summary.ts`. Pure code. It computes the four counts and the status: `review`, `all-supported`, or `no-claims`. It also reports a partial check.
PRD ref: `prd.md > Publication Readiness Summary`.

### Page and Report UI
`src/app/page.tsx` holds the state of one check. Components:
- `ClaimInput` — the text box, the character count, the limit, and the **Check claims** button. PRD ref: `prd.md > Text Input`.
- `ReadinessSummary` — the counts, the status, and the partial-check warning. PRD ref: `prd.md > Publication Readiness Summary`.
- `HighlightedText` — the original text, split into plain and highlighted segments by offsets. Each highlight is a button with a status label. PRD ref: `prd.md > Inline Claim Highlighting`.
- `EvidenceCard` — the claim, the status, the explanation, and the citations. PRD ref: `prd.md > Evidence Cards`.
- `StatusBadge` — the label, icon, and colour for one status.

### Stream Client
`src/lib/stream.ts`. It reads the response body, splits it into lines, and parses each line as one event.

## Data Model
No storage. All data exists in the server during one request and in the page's memory until the next check or a page close.

```ts
type Status = "supported" | "contradicted" | "unverified";

type Citation = {
  url: string;          // from the search result
  title: string;        // from the search result
  excerpt: string;      // validated substring of the retrieved content
  stance: "supports" | "contradicts";
  sourceType: "primary" | "secondary" | "other";   // judged by the model; "other" never backs a supported or contradicted status
};

type Claim = {
  id: string;
  quote: string;        // exact words from the input
  claim: string;        // self-contained statement
  start: number;        // offset in the input
  end: number;
};

type Verdict = {
  claimId: string;
  status: Status;
  explanation: string;
  citations: Citation[];
};

type CheckEvent =
  | { type: "claims"; claims: Claim[]; notAssessed: number }
  | { type: "verdict"; verdict: Verdict }
  | { type: "done" }
  | { type: "error"; message: string };
```

## File Structure

```
proofpilot/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # fonts, page shell
│   │   ├── page.tsx              # the one screen: input state and report state
│   │   ├── globals.css           # Tailwind and status styles
│   │   └── api/check/route.ts    # Check Route
│   ├── components/
│   │   ├── ClaimInput.tsx
│   │   ├── ReadinessSummary.tsx
│   │   ├── HighlightedText.tsx
│   │   ├── EvidenceCard.tsx
│   │   └── StatusBadge.tsx
│   └── lib/
│       ├── types.ts              # Data Model
│       ├── limits.ts             # Limits
│       ├── spans.ts              # Span Locator
│       ├── citations.ts          # Citation Validator
│       ├── summary.ts            # Summary Logic
│       ├── llm.ts                # Nebius client and the structured-output call
│       ├── extract.ts            # Claim Extractor
│       ├── retrieve.ts           # Evidence Retriever (Tavily)
│       ├── judge.ts              # Claim Judge
│       ├── pipeline.ts           # Pipeline
│       └── stream.ts             # Stream Client
├── tests/                        # Vitest: spans, citations, summary, pipeline
├── scripts/check-live.mts        # runs the real pipeline from the command line
├── devpost/                      # Devpost learning workspace
├── .env.example                  # key names, no values
├── .gitignore
├── package.json
└── README.md
```

## External Services and Dependencies

### Nebius Token Factory
- Docs: https://docs.tokenfactory.nebius.com
- Key: `NEBIUS_API_KEY`, used on the server only.
- Client: `new OpenAI({ apiKey: process.env.NEBIUS_API_KEY, baseURL: "https://api.tokenfactory.nebius.com/v1" })`.
- Call: `client.chat.completions.parse({ model, temperature: 0, max_tokens, messages, response_format: zodResponseFormat(Schema, name) })`. Read `choices[0].message.parsed`. A `null` value, a refusal, or a `finish_reason` of `length` is a failure for that call.
- `src/lib/llm.ts` holds this call in one place, so the extractor and the judge do not repeat it.
- Errors: catch `OpenAI.AuthenticationError`, `OpenAI.RateLimitError`, then `OpenAI.APIError`.
- Price and rate limits: not verified.

### Tavily Search API
- Docs: https://docs.tavily.com/sdk/javascript/reference
- Key: `TAVILY_API_KEY`, used on the server only.
- Call: `tavily({ apiKey }).search(query, { searchDepth: "advanced", maxResults: 5, chunksPerSource: 3 })`. Use `results[].url`, `.title`, `.content`.
- Cost: an advanced search uses 2 credits, so one check with 8 claims uses 16 credits. The plan limits are not verified.

## Important Failure Modes

- **A key is missing or invalid** → the page shows a clear error, and the text stays in the box. The server log names the missing key. No report is shown.
- **The search or the judge fails for one claim** → that claim is Unverified, and its card gives the reason. The other claims continue.
- **The extraction fails** → an analysis error, and the text stays in the box for a retry.
- **The model returns a quote that is not in the text** → the claim is not highlighted and is counted as not assessed.
- **The model returns JSON that does not match the schema** → a failure for that call: an analysis error for extraction, Unverified for one claim.
- **The model returns an excerpt that is not in the source** → the citation is dropped. If no valid citation remains, the claim is Unverified.
- **The stream stops before `done`** → the page shows an error and does not show a final status.

## What Was Simplified and Why

- **No storage** instead of saved reports — `prd.md > Deferred From the POC`.
- **Search-result content** instead of full page download and parsing — the search already returns the relevant text of each page. The full version would add an extraction call per source and more response time.
- **The model judges the source type (primary, secondary, other)** instead of a curated list of trusted domains — "reputable" has no mechanical definition, and a list would take time to build and would always be incomplete. The spec does not claim more: the page labels the source type as a model judgement.
- **A fixed input limit and claim limit** instead of support for long documents — `prd.md > Deferred From the POC`.
- **Unit tests plus a live command-line check** instead of a browser test suite — the risk is in the validation logic and in the real services, not in page navigation.
- **Local only** instead of a public URL — a recording is sufficient for the submission.

## Decisions and Open Issues

**Learner decisions**
- Accepted the recommended stack: Next.js, TypeScript, Tailwind, Tavily. ("approved")
- **LLM provider: Nebius**, with a key that the learner supplied. This replaces Claude from the agent's first recommendation.
- Inline highlighting and the summary are P0.
- Development tools: the Hindsight memory bank `proofpilot` and the `context-mode` CLI. These are not components of the product.

**Agent readings of the learner's "approved"** (shown at the spec review; the learner approved the spec and did not change them)
- **Progressive results:** the server streams each verdict as it completes. This was the agent's recommendation. The learner's answer did not name an option.
- **Local only:** no public URL. The learner's answer did not name an option, and deployment is optional.

**Implementation details derived by the agent**
- Limits: 3,000 characters and 8 claims.
- Default model `moonshotai/Kimi-K3`, selected from the real runs in build slice 1 (see `checklist.md > Revisions`). It can be changed with `NEBIUS_MODEL`.
- Parallel judging with a limit of 4.
- Newline-delimited JSON for the stream.

**The one useful unknown**
The red highlight in the demo cannot be guaranteed, because the result comes from live retrieval and a model. Agreed check during the build: run candidate demo paragraphs through the real pipeline several times with `pnpm check:live`, and record the real results, including runs where the result changes. The pipeline is not adjusted to force a result. The demo paragraph is selected from what the real pipeline does.

**Observed on 2026-10-11, one request per model, not an evaluation**
The Nebius key works. Nine models returned valid strict-schema JSON for a small extraction, and each returned quotes that were exact substrings of the input: Qwen3-235B-Instruct (1.8 s), Qwen3.5-397B (10.5 s), DeepSeek-V4.1-Flash (4.7 s), DeepSeek-V4-Pro (1.3 s), Kimi-K3 (2.5 s), gpt-oss-120b (1.5 s), GLM-5.3 (3.7 s), GLM-5.3-Flash (6.9 s), MiniMax-M3 (1.0 s). This shows that the endpoint and the output format work. It does not show which model judges evidence best.

**Open issues**
1. **Model selection for the judge step.** The default is provisional. During the build, the agent runs the same claims through two or three models with `pnpm check:live` and reports the real verdicts. The learner selects the model.
2. **Keys.** Resolved: the learner supplied `NEBIUS_API_KEY` and `TAVILY_API_KEY`. They are in the project `.env`, which git ignores.
3. Carried from `prd.md > Open Questions`: all items are resolved or approved as written.
