import { describe, expect, it } from "vitest";
import { runCheck, type PipelineDeps } from "@/lib/pipeline";
import type { CheckEvent, RawVerdict, Source } from "@/lib/types";

const TEXT =
  "Brazil produces about a third of the world's coffee. Finland drinks the most coffee per person.";

const BRAZIL = "Brazil produces about a third of the world's coffee";
const FINLAND = "Finland drinks the most coffee per person";

const SOURCE: Source = {
  url: "https://stats.example.org/coffee",
  title: "World coffee production statistics",
  content: "In 2022 Brazil produced roughly 35 percent of the world's coffee, ahead of Vietnam.",
};

const SUPPORTED: RawVerdict = {
  status: "supported",
  explanation: "The statistics agree with the claim.",
  citations: [
    {
      sourceIndex: 0,
      excerpt: "In 2022 Brazil produced roughly 35 percent of the world's coffee",
      stance: "supports",
      sourceType: "primary",
    },
  ],
};

function deps(overrides: Partial<PipelineDeps> = {}): PipelineDeps {
  return {
    extract: async () => [
      { quote: BRAZIL, claim: BRAZIL, query: "Brazil share of world coffee production" },
      { quote: FINLAND, claim: FINLAND, query: "coffee consumption per capita by country" },
    ],
    retrieve: async () => [SOURCE],
    judge: async () => SUPPORTED,
    ...overrides,
  };
}

async function collect(text: string, d: PipelineDeps): Promise<CheckEvent[]> {
  const events: CheckEvent[] = [];
  await runCheck(text, d, (event) => events.push(event));
  return events;
}

const verdictsOf = (events: CheckEvent[]) =>
  events.flatMap((e) => (e.type === "verdict" ? [e.verdict] : []));

describe("runCheck", () => {
  it("emits the located claims first, then one verdict for each claim, then done", async () => {
    const events = await collect(TEXT, deps());

    expect(events[0].type).toBe("claims");
    expect(events.at(-1)?.type).toBe("done");
    const claims = events[0].type === "claims" ? events[0].claims : [];
    expect(claims).toHaveLength(2);
    expect(verdictsOf(events).map((v) => v.claimId).sort()).toEqual(
      claims.map((c) => c.id).sort(),
    );
  });

  it("emits no verdicts when the text has no checkable claims", async () => {
    const events = await collect(TEXT, deps({ extract: async () => [] }));

    expect(events).toEqual([{ type: "claims", claims: [], notAssessed: 0 }, { type: "done" }]);
  });

  it("reports claims that the model found but that could not be located in the text", async () => {
    const events = await collect(
      TEXT,
      deps({
        extract: async () => [
          { quote: BRAZIL, claim: BRAZIL, query: "q" },
          { quote: "Words that are not in the text", claim: "x", query: "q" },
        ],
      }),
    );

    expect(events[0]).toMatchObject({ type: "claims", notAssessed: 1 });
    expect(verdictsOf(events)).toHaveLength(1);
  });

  it("does not show a supported verdict when the model quotes text that the source does not contain", async () => {
    const events = await collect(
      TEXT,
      deps({
        judge: async () => ({
          ...SUPPORTED,
          citations: [{ ...SUPPORTED.citations[0], excerpt: "Brazil produced 90 percent of all coffee in 2022" }],
        }),
      }),
    );

    for (const verdict of verdictsOf(events)) {
      expect(verdict.status).toBe("unverified");
      expect(verdict.citations).toHaveLength(0);
    }
  });

  it("marks one claim unverified when its search fails, and still judges the other claim", async () => {
    const events = await collect(
      TEXT,
      deps({
        retrieve: async (claim) => {
          if (claim.quote === FINLAND) throw new Error("search unavailable");
          return [SOURCE];
        },
      }),
    );

    const claims = events[0].type === "claims" ? events[0].claims : [];
    const byQuote = (quote: string) =>
      verdictsOf(events).find((v) => v.claimId === claims.find((c) => c.quote === quote)?.id);
    expect(byQuote(BRAZIL)?.status).toBe("supported");
    expect(byQuote(FINLAND)?.status).toBe("unverified");
    expect(byQuote(FINLAND)?.explanation).toMatch(/retriev|search/i);
    expect(events.at(-1)?.type).toBe("done");
  });

  it("marks a claim unverified when the search returns no sources, without a call to the judge", async () => {
    let judged = 0;
    const events = await collect(
      TEXT,
      deps({
        retrieve: async () => [],
        judge: async () => {
          judged += 1;
          return SUPPORTED;
        },
      }),
    );

    expect(verdictsOf(events).every((v) => v.status === "unverified")).toBe(true);
    expect(judged).toBe(0);
  });

  it("marks a claim unverified when the judge fails", async () => {
    const events = await collect(
      TEXT,
      deps({
        judge: async () => {
          throw new Error("model unavailable");
        },
      }),
    );

    expect(verdictsOf(events)).toHaveLength(2);
    expect(verdictsOf(events).every((v) => v.status === "unverified")).toBe(true);
  });

  it("fails the check and emits no report when extraction fails", async () => {
    const events: CheckEvent[] = [];
    await expect(
      runCheck(
        TEXT,
        deps({
          extract: async () => {
            throw new Error("model unavailable");
          },
        }),
        (event) => events.push(event),
      ),
    ).rejects.toThrow();
    expect(events).toHaveLength(0);
  });

  it("judges no more than four claims at the same time", async () => {
    const sentences = Array.from({ length: 8 }, (_, i) => `City number ${i} has ${i + 1} million people`);
    let active = 0;
    let peak = 0;
    await collect(
      sentences.join(". "),
      deps({
        extract: async () => sentences.map((s) => ({ quote: s, claim: s, query: s })),
        retrieve: async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return [SOURCE];
        },
      }),
    );

    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(4);
  });
});
