import type { Claim, Verdict } from "@/lib/types";
import { StatusBadge, statusLabel } from "./StatusBadge";

/** Shows the original text, unchanged, with each checked claim highlighted in place. */
export function HighlightedText({
  text,
  claims,
  verdicts,
}: {
  text: string;
  claims: Claim[];
  verdicts: Record<string, Verdict>;
}) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const claim of claims) {
    if (claim.start > cursor) parts.push(text.slice(cursor, claim.start));
    const status = verdicts[claim.id]?.status ?? "pending";
    parts.push(
      <span key={claim.id} data-claim={claim.id} data-status={status}>
        <mark className={`claim claim-${status} text-ink`}>
          <span className="sr-only">{statusLabel(status)} claim: </span>
          {text.slice(claim.start, claim.end)}
        </mark>{" "}
        <StatusBadge status={status} />
      </span>,
    );
    cursor = claim.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <p className="font-serif text-xl leading-[2.1] whitespace-pre-wrap" data-testid="report-text">
      {parts}
    </p>
  );
}
