import { describe, expect, it } from "vitest";
import { readEvents } from "@/lib/stream";
import type { CheckEvent } from "@/lib/types";

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function collect(chunks: Uint8Array[]): Promise<CheckEvent[]> {
  const events: CheckEvent[] = [];
  for await (const event of readEvents(streamOf(chunks))) events.push(event);
  return events;
}

const encode = (text: string) => new TextEncoder().encode(text);

const CLAIMS: CheckEvent = { type: "claims", claims: [], notAssessed: 0 };
const DONE: CheckEvent = { type: "done" };
const ACCENTED: CheckEvent = { type: "error", message: "Café — naïve" };

describe("readEvents", () => {
  it("reads one event from each line", async () => {
    const body = `${JSON.stringify(CLAIMS)}\n${JSON.stringify(DONE)}\n`;

    expect(await collect([encode(body)])).toEqual([CLAIMS, DONE]);
  });

  it("joins an event that arrives in two chunks", async () => {
    const line = `${JSON.stringify(CLAIMS)}\n`;

    expect(await collect([encode(line.slice(0, 10)), encode(line.slice(10))])).toEqual([CLAIMS]);
  });

  it("joins a character that is split between two chunks", async () => {
    const bytes = encode(`${JSON.stringify(ACCENTED)}\n`);
    const split = bytes.indexOf(0xc3) + 1;

    expect(await collect([bytes.slice(0, split), bytes.slice(split)])).toEqual([ACCENTED]);
  });

  it("reads a last event that has no line end", async () => {
    expect(await collect([encode(JSON.stringify(DONE))])).toEqual([DONE]);
  });

  it("ignores empty lines", async () => {
    expect(await collect([encode(`\n${JSON.stringify(DONE)}\n\n`)])).toEqual([DONE]);
  });
});
