import { extractClaims } from "@/lib/extract";
import { judgeClaim } from "@/lib/judge";
import { checkInput } from "@/lib/limits";
import { runCheck } from "@/lib/pipeline";
import { retrieveEvidence } from "@/lib/retrieve";
import type { CheckEvent } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const text = typeof body === "object" && body !== null ? (body as { text?: unknown }).text : undefined;

  const problem = checkInput(text);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  if (!process.env.NEBIUS_API_KEY || !process.env.TAVILY_API_KEY) {
    console.error("NEBIUS_API_KEY and TAVILY_API_KEY must be set in .env");
    return Response.json(
      { error: "The server is not configured for analysis. See the README for the necessary keys." },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: CheckEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runCheck(
          text as string,
          { extract: extractClaims, retrieve: retrieveEvidence, judge: judgeClaim },
          emit,
        );
      } catch (error) {
        console.error("The check failed:", error);
        emit({ type: "error", message: "The analysis failed. No claims were checked. Try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
