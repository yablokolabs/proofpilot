import { describe, expect, it } from "vitest";
import { validateVerdict } from "@/lib/citations";
import type { RawVerdict, Source } from "@/lib/types";

const SOURCES: Source[] = [
  {
    url: "https://stats.example.org/coffee",
    title: "World coffee production statistics",
    content:
      "Brazil is the largest producer of coffee.\n  In 2022 Brazil produced roughly 35 percent of the world's coffee, ahead of Vietnam.",
  },
  {
    url: "https://blog.example.com/coffee-myths",
    title: "Coffee myths",
    content:
      "Many people believe that Colombia grows the most coffee, but that has not been true for decades.",
  },
];

const EXCERPT = "In 2022 Brazil produced roughly 35 percent of the world's coffee";

function raw(overrides: Partial<RawVerdict>): RawVerdict {
  return {
    status: "supported",
    explanation: "The statistics agree with the claim.",
    citations: [
      { sourceIndex: 0, excerpt: EXCERPT, stance: "supports", sourceType: "primary" },
    ],
    ...overrides,
  };
}

describe("validateVerdict", () => {
  it("keeps a supported verdict whose excerpt is in the retrieved source", () => {
    const verdict = validateVerdict(raw({}), SOURCES);

    expect(verdict.status).toBe("supported");
    expect(verdict.citations).toHaveLength(1);
    expect(verdict.citations[0].excerpt).toBe(EXCERPT);
  });

  it("takes the URL and the title from the retrieved source", () => {
    const verdict = validateVerdict(raw({}), SOURCES);

    expect(verdict.citations[0].url).toBe("https://stats.example.org/coffee");
    expect(verdict.citations[0].title).toBe("World coffee production statistics");
  });

  it("accepts an excerpt that differs from the source only in whitespace", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          {
            sourceIndex: 0,
            excerpt:
              "Brazil is the largest producer of coffee. In 2022 Brazil produced roughly 35 percent",
            stance: "supports",
            sourceType: "primary",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("supported");
  });

  it("changes supported to unverified when the excerpt is not in the source", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          {
            sourceIndex: 0,
            excerpt: "In 2022 Brazil produced roughly 40 percent of the world's coffee",
            stance: "supports",
            sourceType: "primary",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
    expect(verdict.citations).toHaveLength(0);
  });

  it("changes contradicted to unverified when the citation names a source that was not retrieved", () => {
    const verdict = validateVerdict(
      raw({
        status: "contradicted",
        citations: [
          { sourceIndex: 7, excerpt: EXCERPT, stance: "contradicts", sourceType: "primary" },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
    expect(verdict.citations).toHaveLength(0);
  });

  it("changes supported to unverified when there are no citations", () => {
    const verdict = validateVerdict(raw({ citations: [] }), SOURCES);

    expect(verdict.status).toBe("unverified");
  });

  it("replaces the explanation when it changes the status, so the text does not say supported", () => {
    const verdict = validateVerdict(raw({ citations: [] }), SOURCES);

    expect(verdict.explanation).not.toBe("The statistics agree with the claim.");
    expect(verdict.explanation.length).toBeGreaterThan(0);
  });

  it("changes supported to unverified when the only valid citation contradicts the claim", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          { sourceIndex: 0, excerpt: EXCERPT, stance: "contradicts", sourceType: "primary" },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
  });

  it("changes supported to unverified when the only valid citation is from a source that is not primary or secondary", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          {
            sourceIndex: 1,
            excerpt: "Many people believe that Colombia grows the most coffee",
            stance: "supports",
            sourceType: "other",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
  });

  it("says that the sources are weak when a confirmed quotation exists only in a source that is not primary or secondary", () => {
    const weak = validateVerdict(
      raw({
        citations: [
          {
            sourceIndex: 1,
            excerpt: "Many people believe that Colombia grows the most coffee",
            stance: "supports",
            sourceType: "other",
          },
        ],
      }),
      SOURCES,
    );
    const missing = validateVerdict(raw({ citations: [] }), SOURCES);

    expect(weak.explanation).toMatch(/primary or reputable secondary/i);
    expect(weak.explanation).not.toBe(missing.explanation);
    expect(weak.citations).toHaveLength(1);
  });

  it("keeps a contradicted verdict that has a valid contradicting citation", () => {
    const verdict = validateVerdict(
      raw({
        status: "contradicted",
        explanation: "The statistics give a different number.",
        citations: [
          { sourceIndex: 0, excerpt: EXCERPT, stance: "contradicts", sourceType: "secondary" },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("contradicted");
    expect(verdict.explanation).toBe("The statistics give a different number.");
    expect(verdict.citations[0].stance).toBe("contradicts");
  });

  it("changes supported to unverified when a confirmed reputable source contradicts the claim", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          { sourceIndex: 0, excerpt: EXCERPT, stance: "supports", sourceType: "primary" },
          {
            sourceIndex: 1,
            excerpt: "Many people believe that Colombia grows the most coffee, but that has not been true",
            stance: "contradicts",
            sourceType: "secondary",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
    expect(verdict.explanation).toMatch(/disagree/i);
    expect(verdict.citations.map((c) => c.stance).sort()).toEqual(["contradicts", "supports"]);
  });

  it("changes contradicted to unverified when a confirmed reputable source supports the claim", () => {
    const verdict = validateVerdict(
      raw({
        status: "contradicted",
        citations: [
          { sourceIndex: 0, excerpt: EXCERPT, stance: "supports", sourceType: "secondary" },
          {
            sourceIndex: 1,
            excerpt: "Many people believe that Colombia grows the most coffee, but that has not been true",
            stance: "contradicts",
            sourceType: "secondary",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
  });

  it("keeps a supported verdict when the only source that disagrees is not primary or secondary", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          { sourceIndex: 0, excerpt: EXCERPT, stance: "supports", sourceType: "primary" },
          {
            sourceIndex: 1,
            excerpt: "Many people believe that Colombia grows the most coffee, but that has not been true",
            stance: "contradicts",
            sourceType: "other",
          },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("supported");
    expect(verdict.citations).toHaveLength(1);
  });

  it("drops an invalid citation and keeps the valid one", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          { sourceIndex: 0, excerpt: "This sentence is not in the source at all.", stance: "supports", sourceType: "primary" },
          { sourceIndex: 0, excerpt: EXCERPT, stance: "supports", sourceType: "primary" },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("supported");
    expect(verdict.citations).toHaveLength(1);
  });

  it("does not accept a very short excerpt as evidence", () => {
    const verdict = validateVerdict(
      raw({
        citations: [
          { sourceIndex: 0, excerpt: "Brazil", stance: "supports", sourceType: "primary" },
        ],
      }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
  });

  it("keeps an unverified verdict and its explanation", () => {
    const verdict = validateVerdict(
      raw({ status: "unverified", explanation: "The sources do not give a number.", citations: [] }),
      SOURCES,
    );

    expect(verdict.status).toBe("unverified");
    expect(verdict.explanation).toBe("The sources do not give a number.");
  });
});
