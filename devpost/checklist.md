---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (the learner selected `nori-full-send`: autonomous work after plan approval, test-driven, with pauses at the hands-on checkpoints)

## Slices

- [x] **1. A real check runs from the command line and its citations are validated**
  Becomes usable: `pnpm check:live "<text>"` sends real text through the real pipeline (Nebius extraction, Tavily search, Nebius judge) and prints each claim with its position in the text, its verdict, and citations that the code validated.
  Why now: Risk first. This is the kernel and the part that can fail: an open model must return exact quotes and exact excerpts, and the verdicts must be sensible. Bad news must arrive before any screen exists. The project scaffold is part of this slice.
  PRD ref: `prd.md > Claim Extraction`, `prd.md > Evidence Retrieval and Sources`, `prd.md > Claim Classification`
  Spec ref: `spec.md > Limits`, `spec.md > Claim Extractor`, `spec.md > Span Locator`, `spec.md > Evidence Retriever`, `spec.md > Claim Judge`, `spec.md > Citation Validator`, `spec.md > Pipeline`, `spec.md > External Services and Dependencies`, `spec.md > Data Model`
  Build: Scaffold the Next.js project with TypeScript, Tailwind, and Vitest. Write failing tests first for the span locator, the citation validator, and the pipeline orchestration, then implement them. Add the types, the limits, the Nebius client, the extractor, the retriever, the judge, and `scripts/check-live.ts`. Run the same paragraph through two or three Nebius models and record the real verdicts for the model decision.
  Verify (mechanical): `pnpm test` passes. `pnpm check:live` on a paragraph with a minimum of three factual claims exits with code 0 and prints claims with offsets, verdicts, and citations. Confirm by inspection that each printed URL is in the search results and each excerpt is in the retrieved content.
  Learner check: Run `pnpm check:live` with a paragraph of your choice, open two of the printed source links, and confirm that the excerpts are on those pages and that the verdicts are reasonable.
  Commit: `Add claim verification pipeline with validated citations`

- [x] **2. You can paste text and see it light up with a readiness summary**
  Becomes usable: The page at `http://localhost:3000` accepts pasted text, shows progress, highlights each checked claim in place as its verdict arrives, and shows the publication readiness summary with the fixed status wording.
  Why now: This is the unique kernel on the screen. Both items are P0. An early look at the real report can change the remaining build.
  PRD ref: `prd.md > Text Input`, `prd.md > Inline Claim Highlighting`, `prd.md > Publication Readiness Summary`, `prd.md > The Core Journey` (steps 1 to 4)
  Spec ref: `spec.md > Check Route`, `spec.md > Summary Logic`, `spec.md > Page and Report UI`, `spec.md > Stream Client`, `spec.md > Look and Feel`
  Build: Write failing tests first for the summary logic and the stream line parser, then implement them. Add the streaming check route, the stream client, the page state, `ClaimInput` with the visible limit, `HighlightedText`, `StatusBadge`, and `ReadinessSummary`. Apply the editorial look.
  Verify (mechanical): `pnpm test` passes. With the dev server running, a POST to `/api/check` with real text returns `claims`, `verdict`, and `done` events, and empty text and text above the limit return HTTP 400. Load the page in a browser automation run, submit a paragraph, and confirm from the page content and a screenshot that the highlights, the labels, and the summary status are present.
  Learner check: Start the app with `pnpm dev`, paste an AI-written paragraph, and select Check claims. Say what you notice about the highlights and the summary, and what you would change.
  Commit: `Add credibility report page with inline highlights and summary`

- [x] **3. You can click a claim and inspect its evidence**
  Becomes usable: A click or a keyboard selection on a highlight opens its evidence card with the claim, the status, the explanation, and citations with a title, a link, an excerpt, and a source type. Unverified cards give the reason.
  Why now: It completes the core journey and the signature moment: the red claim and the evidence that contradicts it.
  PRD ref: `prd.md > Evidence Cards`, `prd.md > The Core Journey` (steps 5 to 7)
  Spec ref: `spec.md > Page and Report UI`, `spec.md > Look and Feel`
  Build: Add `EvidenceCard`, the selected-claim state, the visual connection between the highlight and its card, keyboard access, and the layout that puts the card beside the text on a wide screen and below it on a narrow screen.
  Verify (mechanical): `pnpm test` passes. In a browser automation run, select a highlight with the pointer and with the keyboard, and confirm that the card shows the claim, the status, the explanation, and a link whose address is one of the retrieved URLs. Take screenshots at a wide and a narrow width.
  Learner check: Run a check, click a red or amber highlight, read the card, and open one source link. Say whether the evidence explains the verdict.
  Commit: `Add evidence cards with source citations`

- [x] **4. Each failure and limit state is honest, and the demo text is selected from real runs**
  Becomes usable: The app gives a clear message for no checkable claims, a partial check, text that is too long, a failed claim, and a failed analysis. The README says how to run it. A demo paragraph is selected from recorded real results.
  Why now: These states carry the integrity rules, and they depend on the complete page. The demo text can be selected only when the complete report exists.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Publication Readiness Summary`
  Spec ref: `spec.md > Important Failure Modes`, `spec.md > Decisions and Open Issues` (the one useful unknown), `spec.md > Where It Runs and How Someone Tries It`
  Build: Add the no-claims state, the partial-check warning, the blocked submission above the limit, the per-claim failure reason, the analysis error with the text kept in the box, and the incomplete-stream error. Write tests first for the logic that is not yet covered. Run candidate demo paragraphs through the real pipeline several times and record the results. Write the README.
  Verify (mechanical): `pnpm test`, the type check, the lint, and the production build pass. Real requests give the expected state for an opinion-only paragraph (no claims) and for text above the limit (HTTP 400). A request with an invalid key gives the analysis error and no report. The repeated demo runs are recorded with their real verdicts.
  Learner check: Try an opinion-only paragraph, a paragraph above the limit, and the selected demo paragraph. Say what you notice and what you would change.
  Commit: `Add honest limit and failure states and the README`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2, when the highlighted report and the summary work in the browser
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- The default model is `moonshotai/Kimi-K3`, not `deepseek-ai/DeepSeek-V4-Pro` — real runs on two paragraphs showed that Kimi-K3 gave the same verdicts in three runs of one paragraph and applied the rounding rule, while DeepSeek-V4-Pro marked "8,849 meters" as contradicted by "8,848.86 meters", Qwen3-235B marked the Slack acquisition as contradicted, and gpt-oss-120b paraphrased an excerpt. Kimi-K3 was the slowest of the four (about 12 to 21 seconds for one check). The sample is small: 2 paragraphs, 10 claims.
- A citation can have the source type "other" in the data model — a claim that only weak sources mention is shown as unverified with those sources and a specific reason, not with an empty card.
- The live check script is `scripts/check-live.mts`, not `.ts` — the script uses top-level `await`, which needs an ES module.
- The `typecheck` script runs `next typegen` first — Next.js 16 generates the `LayoutProps` type that the layout uses.
- The early hands-on checkpoint after slice 2 is merged into the final review — after slice 2 started, the learner sent a new instruction to work autonomously and to ask only when blocked. The agent verified slice 2 with real requests and a browser run. The learner has not yet tried the app.
- The route has no `dynamic` export — Next.js 16 rejects it when `cacheComponents` is on, and a POST handler is not cached.
- The brand assets that the learner supplied are in `public/brand/`, the header shows the logo, and the square icon is the favicon — the learner added the assets during the build. The ink colour is the navy of the logo.
- Sources that disagree now give Unverified, enforced in code — three real runs of one claim (the "8-second attention span" statistic) gave Supported, Unverified, and Contradicted. `prd.md > Claim Classification` already says that conflicting evidence gives Unverified, but the judge selected one side. The judge now cites both sides, and `citations.ts` changes the status to Unverified when confirmed citations from primary or secondary sources have opposite stances. After the change, the same claim was Unverified in three of three runs. In one of those runs the cause was a failed judge call, not the rule.
- The demo paragraph does not contain the attention-span claim — the demo text was selected from recorded real runs. The selected paragraph gave the same result in three consecutive runs: 2 supported, 1 contradicted, 1 unverified.
- Slice 4 verification results: an opinion-only paragraph gave zero claims and the "no checkable claims" state; a paragraph with 11 claims gave 8 checked and 3 not assessed; text above the limit gave HTTP 400; an invalid model key gave the analysis error event and no report; the production build passed.
- The README is the full project README with diagrams and screenshots, not only run instructions — the learner asked for it during the build.
