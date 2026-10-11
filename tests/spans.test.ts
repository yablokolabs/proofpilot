import { describe, expect, it } from "vitest";
import { locateClaims } from "@/lib/spans";

const TEXT =
  "Coffee is popular. Brazil produces about a third of the world's coffee. " +
  "Finland drinks the most coffee per person. Coffee is popular.";

const extracted = (quote: string) => ({ quote, claim: quote, query: quote });

describe("locateClaims", () => {
  it("returns offsets that select the exact quote in the original text", () => {
    const quote = "Brazil produces about a third of the world's coffee";
    const { claims, notAssessed } = locateClaims(TEXT, [extracted(quote)], 8);

    expect(notAssessed).toBe(0);
    expect(claims).toHaveLength(1);
    expect(TEXT.slice(claims[0].start, claims[0].end)).toBe(quote);
  });

  it("does not highlight a quote that is not in the text, and counts it as not assessed", () => {
    const { claims, notAssessed } = locateClaims(
      TEXT,
      [extracted("Brazil produces about a THIRD of the world's coffee")],
      8,
    );

    expect(claims).toHaveLength(0);
    expect(notAssessed).toBe(1);
  });

  it("gives a repeated quote two different positions", () => {
    const { claims } = locateClaims(
      TEXT,
      [extracted("Coffee is popular"), extracted("Coffee is popular")],
      8,
    );

    expect(claims).toHaveLength(2);
    expect(claims[0].start).not.toBe(claims[1].start);
    for (const claim of claims) {
      expect(TEXT.slice(claim.start, claim.end)).toBe("Coffee is popular");
    }
  });

  it("rejects a quote that overlaps a claim that was already located", () => {
    const { claims, notAssessed } = locateClaims(
      TEXT,
      [
        extracted("Brazil produces about a third of the world's coffee"),
        extracted("a third of the world's coffee"),
      ],
      8,
    );

    expect(claims).toHaveLength(1);
    expect(notAssessed).toBe(1);
  });

  it("keeps only the maximum number of claims and counts the others as not assessed", () => {
    const { claims, notAssessed } = locateClaims(
      TEXT,
      [
        extracted("Brazil produces about a third of the world's coffee"),
        extracted("Finland drinks the most coffee per person"),
        extracted("Coffee is popular"),
      ],
      2,
    );

    expect(claims).toHaveLength(2);
    expect(notAssessed).toBe(1);
  });

  it("returns claims in the order of their position in the text", () => {
    const { claims } = locateClaims(
      TEXT,
      [
        extracted("Finland drinks the most coffee per person"),
        extracted("Brazil produces about a third of the world's coffee"),
      ],
      8,
    );

    expect(claims.map((c) => c.start)).toEqual(
      [...claims.map((c) => c.start)].sort((a, b) => a - b),
    );
    expect(claims[0].quote).toContain("Brazil");
  });

  it("gives each claim a different id", () => {
    const { claims } = locateClaims(
      TEXT,
      [
        extracted("Brazil produces about a third of the world's coffee"),
        extracted("Finland drinks the most coffee per person"),
      ],
      8,
    );

    expect(new Set(claims.map((c) => c.id)).size).toBe(2);
  });

  it("counts an empty quote as not assessed", () => {
    const { claims, notAssessed } = locateClaims(TEXT, [extracted("")], 8);

    expect(claims).toHaveLength(0);
    expect(notAssessed).toBe(1);
  });
});
