import type { Summary } from "@/lib/summary";

const HEADLINE: Record<Summary["status"], { text: string; className: string }> = {
  checking: { text: "Checking claims", className: "border-pending" },
  "no-claims": { text: "No checkable claims found", className: "border-pending" },
  review: { text: "Review before publishing", className: "border-contradicted" },
  "all-supported": { text: "All checked claims supported", className: "border-supported" },
};

export function ReadinessSummary({ summary }: { summary: Summary }) {
  const headline = HEADLINE[summary.status];
  const total = summary.analysed + summary.pending;

  return (
    <section
      aria-label="Publication readiness"
      aria-live="polite"
      className={`border-y border-l-8 border-y-rule bg-surface px-6 py-5 ${headline.className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Publication readiness</p>
      <h2 className="mt-1 text-2xl font-bold uppercase tracking-wide" data-testid="readiness-status">
        {headline.text}
      </h2>

      {summary.status === "checking" ? (
        <p className="mt-2 text-sm text-muted">
          {total === 0
            ? "ProofPilot is reading the text for factual claims."
            : `${summary.analysed} of ${total} claims checked against live sources.`}
        </p>
      ) : null}

      {summary.status === "no-claims" ? (
        <p className="mt-2 text-sm text-muted">
          ProofPilot found no factual claims that it can check in this text. This is not a statement that
          the text is accurate.
        </p>
      ) : null}

      {summary.status !== "no-claims" ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Count label="Claims analysed" value={summary.analysed} />
          <Count label="Supported" value={summary.supported} className="text-supported" />
          <Count label="Contradicted" value={summary.contradicted} className="text-contradicted" />
          <Count label="Unverified" value={summary.unverified} className="text-unverified" />
        </dl>
      ) : null}

      {summary.partial ? (
        <p role="status" className="mt-4 border-l-4 border-unverified bg-unverified-soft px-4 py-3 text-sm">
          <strong>Partial check.</strong> ProofPilot checked {summary.analysed + summary.pending}{" "}
          {summary.analysed + summary.pending === 1 ? "claim" : "claims"}. It found {summary.notAssessed}{" "}
          more that it did not assess.
        </p>
      ) : null}
    </section>
  );
}

function Count({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`text-3xl font-bold tabular-nums ${className}`}>{value}</dd>
    </div>
  );
}
