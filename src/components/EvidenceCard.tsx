import type { Citation, Claim, Verdict } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const BORDER = {
  supported: "border-t-supported",
  contradicted: "border-t-contradicted",
  unverified: "border-t-unverified",
  pending: "border-t-pending",
};

const SOURCE_TYPE: Record<Citation["sourceType"], string> = {
  primary: "Primary source",
  secondary: "Secondary source",
  other: "Other source",
};

const STANCE: Record<Citation["stance"], string> = {
  supports: "Supports the claim",
  contradicts: "Contradicts the claim",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Shows the verdict for one claim and the evidence behind it. */
export function EvidenceCard({ claim, verdict }: { claim: Claim | null; verdict: Verdict | null }) {
  if (!claim) {
    return (
      <aside aria-label="Evidence" className="border border-dashed border-rule p-6 text-sm text-muted">
        Select a highlighted claim to see its verdict and the evidence behind it.
      </aside>
    );
  }

  const status = verdict?.status ?? "pending";

  return (
    <aside
      aria-label="Evidence"
      aria-live="polite"
      data-testid="evidence-card"
      className={`border border-t-8 border-rule bg-surface p-6 ${BORDER[status]}`}
    >
      <StatusBadge status={status} size="md" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Claim</p>
      <p className="mt-1 font-serif text-lg leading-snug">{claim.claim}</p>

      {verdict ? (
        <>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Why</p>
          <p className="mt-1 text-sm leading-relaxed" data-testid="evidence-explanation">
            {verdict.explanation}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
            {verdict.citations.length > 0 ? "Evidence" : "No evidence could be confirmed"}
          </p>
          <ol className="mt-2 space-y-5">
            {verdict.citations.map((citation, index) => (
              <li key={`${citation.url}-${index}`} className="border-l-2 border-rule pl-4">
                <blockquote className="font-serif text-[0.95rem] leading-relaxed">
                  &ldquo;{citation.excerpt}&rdquo;
                </blockquote>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm font-semibold text-brand underline underline-offset-2 hover:text-ink"
                >
                  {citation.title}
                </a>
                <p className="mt-1 text-xs text-muted">
                  {hostname(citation.url)} · {STANCE[citation.stance]} · {SOURCE_TYPE[citation.sourceType]}
                </p>
              </li>
            ))}
          </ol>
          {verdict.citations.length > 0 ? (
            <p className="mt-5 border-t border-rule pt-3 text-xs text-muted">
              Each excerpt was confirmed in the text of the retrieved page. The source type is a judgement
              by the language model. Open the source to read the full context.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 text-sm text-muted">ProofPilot is checking this claim against live sources.</p>
      )}
    </aside>
  );
}
