import type { Claim, Verdict } from "@/lib/types";
import { StatusBadge, statusLabel } from "./StatusBadge";

/** Shows the original text, unchanged, with each checked claim highlighted in place. */
export function HighlightedText({
  text,
  claims,
  verdicts,
  selectedId,
  onSelect,
}: {
  text: string;
  claims: Claim[];
  verdicts: Record<string, Verdict>;
  selectedId: string | null;
  onSelect: (claimId: string) => void;
}) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const claim of claims) {
    if (claim.start > cursor) parts.push(text.slice(cursor, claim.start));
    const status = verdicts[claim.id]?.status ?? "pending";
    const selected = claim.id === selectedId;
    // A span, not a button: a button cannot wrap across lines inside the paragraph.
    parts.push(
      <span
        key={claim.id}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        data-claim={claim.id}
        data-status={status}
        onClick={() => onSelect(claim.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(claim.id);
          }
        }}
        className="group cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <mark
          className={`claim claim-${status} text-ink group-hover:brightness-95 ${selected ? "claim-selected" : ""}`}
        >
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
