"use client";

import { useState } from "react";
import { ClaimInput } from "@/components/ClaimInput";
import { HighlightedText } from "@/components/HighlightedText";
import { ReadinessSummary } from "@/components/ReadinessSummary";
import { applyEvent, endOfStream, failCheck, initialReport, startCheck } from "@/lib/report";
import { readEvents } from "@/lib/stream";
import { summarise } from "@/lib/summary";

const NETWORK_ERROR = "The analysis could not start. Check that the server is running, then try again.";

export default function Home() {
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState(initialReport);

  async function check() {
    setReport(startCheck(draft));
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setReport((state) => failCheck(state, body?.error ?? NETWORK_ERROR));
        return;
      }
      for await (const event of readEvents(response.body)) {
        setReport((state) => applyEvent(state, event));
      }
      setReport(endOfStream);
    } catch (error) {
      console.error("The check request failed:", error);
      setReport((state) => failCheck(state, NETWORK_ERROR));
    }
  }

  const showReport = report.phase === "checking" || report.phase === "done";
  const statuses = report.claims.flatMap((claim) => {
    const verdict = report.verdicts[claim.id];
    return verdict ? [verdict.status] : [];
  });
  const summary = summarise({
    statuses,
    pending: report.claims.length - statuses.length,
    notAssessed: report.notAssessed,
    complete: report.phase === "done",
  });

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG needs no image optimisation */}
        <img
          src="/brand/proofpilot_logo.svg"
          alt="ProofPilot AI. Don't Just Trust AI. Verify It."
          width={1800}
          height={460}
          className="h-14 w-auto"
        />
        <p className="text-sm text-muted">Look confident. Stay credible.</p>
      </header>

      {showReport ? (
        <main className="mt-10 space-y-8">
          <ReadinessSummary summary={summary} />

          {report.claims.length > 0 || summary.status === "no-claims" ? (
            <section aria-label="Your text">
              <HighlightedText text={report.text} claims={report.claims} verdicts={report.verdicts} />
              {report.claims.length > 0 ? (
                <p className="mt-6 border-t border-rule pt-4 text-sm text-muted">
                  Only the highlighted claims were checked. Text with no highlight was not assessed.
                </p>
              ) : null}
            </section>
          ) : (
            <p className="font-serif text-xl leading-[2.1] whitespace-pre-wrap text-muted">{report.text}</p>
          )}

          <button
            type="button"
            onClick={() => setReport(initialReport)}
            disabled={report.phase === "checking"}
            className="rounded-sm border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-ink hover:text-paper focus:outline-2 focus:outline-offset-2 focus:outline-ink disabled:cursor-not-allowed disabled:border-rule disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
          >
            Check another draft
          </button>
        </main>
      ) : (
        <main className="mt-14 max-w-3xl">
          <h1 className="font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            The credibility check before you hit publish.
          </h1>
          <p className="mt-4 mb-10 text-lg text-muted">
            Paste AI-generated text. ProofPilot finds the factual claims, checks each one against live
            sources, and shows the evidence.
          </p>
          <ClaimInput value={draft} onChange={setDraft} onSubmit={check} error={report.error} />
        </main>
      )}
    </div>
  );
}
