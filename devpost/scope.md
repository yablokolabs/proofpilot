---
doc: scope
status: approved
---

# ProofPilot AI

**Don't Just Trust AI. Verify It.** The credibility check before you hit publish: paste AI-generated text and get a claim-by-claim credibility report backed by real, inspectable evidence.

Product hook: *Look confident. Stay credible.*

## The Unique Kernel
Most fact-checking tools answer "is this statement true?". ProofPilot answers a more personal question: **"Will this AI-generated content embarrass me when someone checks the facts?"**

The answer is a visual credibility report on the user's own text. The original paragraph lights up in green, red, and amber, and each highlight opens the evidence behind it. This is not a chatbot. It is a pre-publication credibility checker with transparent, inspectable evidence.

## Who It's For
Alex, a marketing professional who prepares a LinkedIn post, a presentation, or a client report with ChatGPT or Claude. The AI produces an authoritative paragraph full of statistics, historical facts, and research findings. Alex wants to publish it but worries that some claims are fabricated or misleading.

Today Alex copies individual statements into Google, opens several websites, compares sources, and tries to decide what is trustworthy. The process is "tedious, inconsistent, and easy to skip".

ProofPilot is not a general-purpose research platform. It prevents the publication of AI-generated misinformation that could damage the user's credibility.

## The Core Loop
Paste text → extract claims → retrieve evidence → evaluate claims → highlight the original text → show evidence cards and a summary.

Alex comes back each time there is a new AI-written draft to publish.

## Inspiration & Identity
- Positioning: "Don't Just Trust AI. Verify It." and "Look confident. Stay credible."
- A focused, coherent application. It must not feel like a generic AI wrapper.
- Professional and responsive. The report must look like something a professional would trust.
- Colour language: green = supported, red = contradicted, amber = unverified.
- No reference products or URLs were given.

## Why This Matters to the Learner
The objective is a competitive submission for Build With AI: Basics that scores well on design, innovation, potential impact, and presentation, with "an exceptional product experience and a compelling demonstration under three minutes".

## What "Working" Looks Like
The three-minute demo shows one transformation: **"A confident AI paragraph becomes a transparent credibility report."**

1. The user pastes a well-written, confident AI-generated paragraph.
2. ProofPilot analyses it with real claim extraction and real evidence retrieval. Nothing is hardcoded.
3. The original paragraph lights up with green, red, and amber highlights.
4. A summary at the top shows the number of claims analysed, supported, contradicted, and unverified, with a prominent status.
5. **The signature moment:** one impressive statistic turns red. The user clicks it and sees that the available evidence contradicts the claim, with clickable source citations.

What the judge must remember: "ProofPilot exposes the hidden factual risks inside convincing AI-generated content before someone publishes it."

## The POC Boundary
One workflow. Priority order, as approved by the learner (inline highlighting and the summary are P0 because they carry the kernel):

**P0 (must work end to end)**
- Text input
- Real claim extraction
- Real evidence retrieval
- Supported / Contradicted / Unverified classification
- Source citations
- Inline claim highlighting on the original text
- Publication readiness summary with counts and a status: "REVIEW BEFORE PUBLISHING" when a contradicted or unverified claim exists, "ALL CHECKED CLAIMS SUPPORTED" when all identified claims are supported
- A working end-to-end demo

**P1**
- Clickable evidence cards: the extracted claim, its status, a short explanation, the supporting or contradicting evidence, and clickable citations
- Professional, responsive UI

If time is short, protect P0 and build only the highest-impact P1 items. "A simple, polished, working product is better than a sophisticated unfinished one."

**Integrity rules (in scope, not optional)**
- Never fabricate sources, URLs, citations, or verification results.
- A retrieved source must be relevant to the claim.
- Contradicting evidence and insufficient evidence are different results.
- Missing, ambiguous, inaccessible, or inadequate evidence gives Unverified.
- The confidence of an LLM is not proof.
- Do not say that every statement was checked if some statements were skipped.
- Never call content absolutely safe, guaranteed true, or universally verified.
- Clear loading, error, and empty states.
- A realistic demo example that gives meaningful results from the real pipeline.

## Later
Nothing was named as "later". The items below were cut.

## Explicitly Cut
The learner placed all of these out of scope. The shared reason: none is necessary to prove the kernel in one workflow in 2 to 4 hours.

- Browser extensions
- PDF uploads
- User accounts and authentication
- Multi-agent orchestration
- Background monitoring
- Social media integrations
- Automated publishing
- Complex dashboards
- Billing
- Enterprise features
- A general-purpose research platform or chatbot
