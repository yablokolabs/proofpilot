import type { CheckEvent } from "./types";

/** Reads a response body of newline-delimited JSON as one event for each line. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<CheckEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (line.trim().length > 0) yield JSON.parse(line) as CheckEvent;
    }
    if (done) return;
  }
}
