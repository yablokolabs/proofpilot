---
doc: prd
status: approved
---

# ProofPilot AI — Product Requirements

The credibility check before you hit publish, for a professional (Alex) who publishes AI-assisted text and must know which factual claims real evidence supports.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Develops `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.

1. Alex opens ProofPilot and sees a text box and a clear **Check claims** button. The input-length limit is visible before any analysis.
2. Alex pastes an AI-generated paragraph and selects **Check claims**.
3. ProofPilot shows that the analysis is in progress.
4. ProofPilot shows the credibility report:
   - a publication readiness summary at the top,
   - below it, Alex's original text with the checked claims highlighted in green, red, and amber,
   - a statement that only the highlighted claims were checked.
5. Alex clicks a highlight. Its verdict and evidence card opens beside or below the text.
6. Alex reads the explanation, reads the excerpts, and opens the source links to inspect the evidence.
7. Alex knows which statements to correct or remove before publication. Alex can paste a new draft and check again.

Success: a confident paragraph becomes a transparent credibility report, and each verdict can be traced to a real source.

## Screens and Layout
One screen with two states. There is no navigation.

**Input state**
- Product name and positioning line.
- A text box for the pasted text.
- The input-length limit and the current length.
- The **Check claims** button.

**Report state** (top to bottom)
1. Publication readiness summary.
2. The original text with highlights, and the coverage statement.
3. The evidence card for the selected claim, beside the text or below it.

The input stays available so that Alex can check another draft.

## Look and Feel
- A clean editorial look. It must read like a professional report, not like a chat.
- Readable typography.
- Restrained colours. Green, red, and amber are reserved for claim status.
- Each status has a text label. Status must never depend on colour alone.
- Avoid: chatbot-style UI (message bubbles, a conversation thread, an assistant persona).
- Positioning text: "Don't Just Trust AI. Verify It." and "Look confident. Stay credible."

## Features and Behavior

### Text Input
Develops `scope.md > The POC Boundary > P0`.

- [ ] On arrival, a text box and a **Check claims** button are visible without scrolling.
- [ ] The input-length limit is shown before analysis, together with the current length.
- [ ] Text above the limit cannot be submitted, and a message gives the reason. The text is never truncated silently.
- [ ] Empty input cannot be submitted.

### Claim Extraction
Develops `scope.md > The POC Boundary > P0`.

- [ ] ProofPilot identifies factual claims that can be verified independently: statistics, historical facts, research findings, and similar statements. Opinions and non-factual text are not claims.
- [ ] Each claim maps to an exact span of Alex's original text, so that it can be highlighted in place.
- [ ] Extraction uses the text that Alex pasted. No result is hardcoded.

### Evidence Retrieval and Sources
Develops `scope.md > The POC Boundary > Integrity rules`.

- [ ] ProofPilot retrieves evidence for each checked claim from live sources at the time of the check.
- [ ] Primary sources have priority: official statistics, research papers, and an organisation's own documentation.
- [ ] Reputable secondary reporting is used when primary evidence is not available.
- [ ] Each citation shows a title, a URL, and a relevant excerpt.
- [ ] Each URL and each excerpt comes from a retrieved source. ProofPilot never shows a source, a URL, or an excerpt that it did not retrieve.
- [ ] A source that is not relevant to the claim is not cited.

### Claim Classification
Develops `scope.md > The POC Boundary > P0` and `> Integrity rules`.

Each checked claim gets one of three statuses:

| Status | Meaning |
| --- | --- |
| **Supported** | The retrieved evidence agrees with the claim. |
| **Contradicted** | The retrieved evidence disagrees with the claim. |
| **Unverified** | The evidence is missing, weak, conflicting, ambiguous, inaccessible, or not relevant. |

- [ ] A status is based only on the retrieved evidence. The confidence of the model is not evidence.
- [ ] Weak, conflicting, or irrelevant evidence gives Unverified, not Supported and not Contradicted.
- [ ] A Supported or Contradicted claim always has a minimum of one citation.
- [ ] Each claim has a short explanation of the reason for its status.

### Inline Claim Highlighting
Develops `scope.md > The Unique Kernel`.

- [ ] The report shows Alex's original text without changes to the wording.
- [ ] Each checked claim is highlighted in place: green for Supported, red for Contradicted, amber for Unverified.
- [ ] Each highlight has a text label or an equivalent non-colour indication of its status.
- [ ] Text that was not checked has no mark.
- [ ] A visible statement says that only the highlighted claims were checked.
- [ ] A highlight can be selected with a pointer and with the keyboard.

### Evidence Cards
Develops `scope.md > The POC Boundary > P1`.

- [ ] When Alex selects a highlight, its evidence card opens beside or below the text.
- [ ] The card shows the extracted claim, its status, the short explanation, and the citations (title, URL, excerpt).
- [ ] For Supported and Contradicted claims, the card shows the supporting or contradicting evidence.
- [ ] For Unverified claims, the card says why the claim could not be verified.
- [ ] Source links are clickable and open the real source.
- [ ] The selected highlight is visually connected to its card.

### Publication Readiness Summary
Develops `scope.md > The Unique Kernel` and `scope.md > The POC Boundary > P0`.

- [ ] The summary is above the text and shows four counts: claims analysed, supported, contradicted, unverified.
- [ ] If a minimum of one claim is Contradicted or Unverified, the status is **REVIEW BEFORE PUBLISHING**.
- [ ] If all checked claims are Supported, the status is **ALL CHECKED CLAIMS SUPPORTED**.
- [ ] If no checkable claims are found, neither status is shown. See `States and Boundaries`.
- [ ] If ProofPilot checked only some of the claims that it found, the summary shows the checked count and warns that the other claims were not assessed.
- [ ] The words "safe", "guaranteed", "true", and "verified" are never applied to the full text.

## States and Boundaries

- **First use / input** — the text box, the limit, and the **Check claims** button. No sample result is shown before a real check.
- **Loading** — a clear indication that the analysis is in progress. Alex cannot start a second check at the same time.
- **Report** — as specified in `Screens and Layout`.
- **No checkable claims** — a message says that no checkable claims were found. "ALL CHECKED CLAIMS SUPPORTED" is not shown. No highlights are shown.
- **Partial check** — the checked count is shown, with a warning that the other claims were not assessed.
- **Input too long** — submission is blocked with a message. No silent truncation.
- **Evidence failure for one claim** — the claim is Unverified, and its card gives the reason.
- **Analysis failure** — a clear error message, and Alex's text stays in the box for a retry. No partial or invented report is shown.
- **Persistence** — none. A report is lost when the page is closed or a new check starts.

## Product Decisions

- **Inline highlighting and the summary are P0** — they carry the kernel. Without them the product is a generic verifier.
- **Primary sources first, reputable secondary reporting second** — the report must hold up when someone checks the facts.
- **Each citation shows title, URL, and excerpt** — the evidence must be transparent and inspectable.
- **Weak, conflicting, or irrelevant evidence gives Unverified** — contradicting evidence and insufficient evidence are different results.
- **Only highlighted claims count as checked, and unchecked text has no mark** — ProofPilot must not claim that every statement was checked.
- **The input limit is shown before analysis, with no silent truncation** — honesty about coverage.
- **No "all supported" status when no claims are found** — an empty result is not a positive result.
- **Editorial look, no chatbot UI, status never by colour alone** — this is a credibility report, not a conversation.
- **Status wording is fixed** — "REVIEW BEFORE PUBLISHING" and "ALL CHECKED CLAIMS SUPPORTED". No absolute wording.

## What We're Building
One screen that does the full loop on real services: text input with a visible limit, claim extraction, live evidence retrieval, three-way classification, inline highlights with text labels, the publication readiness summary, evidence cards with real citations, and the loading, empty, partial, and error states above.

## Deferred From the POC
- **Saved reports or history** — needs storage, and possibly accounts. Not necessary to prove the kernel.
- **Sharing or export of a report** — a natural next step for "before you publish", but it adds a second workflow.
- **Rewrite suggestions for contradicted claims** — it would make the product a writing assistant. The proof is the report.
- **Very long documents** — the proof of concept has an input limit.

## Possible Later Enhancements
None named by the learner.

## Non-Goals
From `scope.md > Explicitly Cut`:
- Browser extensions, PDF uploads, user accounts and authentication, multi-agent orchestration, background monitoring, social media integrations, automated publishing, complex dashboards, billing, enterprise features.
- A general-purpose research platform.
- A chatbot or conversational interface.
- A guarantee that content is true or safe.

## Open Questions

Assumptions made by the agent, not learner decisions:
1. **The value of the input-length limit and the maximum number of claims checked per run.** The behaviour is decided. The numbers depend on cost and response time. Can wait for `4-spec`.
2. **Layout of the evidence card: beside the text on a wide screen, below it on a narrow screen.** This is a reading of "beside or below". Can wait for `4-spec`.
3. **No persistence.** Approved at PRD review as written.
4. **A one-click sample paragraph for the demo.** Not included. The learner approved the PRD as written and did not take up the agent's recommendation to add it.
5. **Sources that must never be cited.** The learner gave a priority order but no exclusion list. The current rule: a source that is not primary and not reputable secondary reporting does not support a Supported or Contradicted status. Approved at PRD review as written.
