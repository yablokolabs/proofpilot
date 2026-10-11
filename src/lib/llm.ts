import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";

const NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1";
const DEFAULT_MODEL = "moonshotai/Kimi-K3";

let client: OpenAI | undefined;

function nebius(): OpenAI {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY is not set.");
  client ??= new OpenAI({ apiKey, baseURL: NEBIUS_BASE_URL });
  return client;
}

export function modelName(): string {
  return process.env.NEBIUS_MODEL || DEFAULT_MODEL;
}

/**
 * Sends one request to the model and returns its reply, validated against
 * the schema. Throws if the reply is cut off, refused, or does not match.
 */
export async function structuredCall<Schema extends z.ZodType>(options: {
  schema: Schema;
  schemaName: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<z.infer<Schema>> {
  const completion = await nebius().chat.completions.parse({
    model: modelName(),
    temperature: 0,
    max_tokens: options.maxTokens,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    response_format: zodResponseFormat(options.schema, options.schemaName),
  });

  const choice = completion.choices[0];
  if (choice.finish_reason === "length") {
    throw new Error("The model reply was cut off before it was complete.");
  }
  if (choice.message.parsed == null) {
    throw new Error(choice.message.refusal ?? "The model returned no structured reply.");
  }
  return choice.message.parsed as z.infer<Schema>;
}
