import { describe, expect, it } from "vitest";
import { MAX_INPUT_CHARS, checkInput } from "@/lib/limits";

describe("checkInput", () => {
  it("accepts text inside the limit", () => {
    expect(checkInput("The Eiffel Tower is 330 metres tall.")).toBeNull();
  });

  it("rejects empty and whitespace-only text", () => {
    expect(checkInput("")).toMatch(/paste/i);
    expect(checkInput("   \n ")).toMatch(/paste/i);
  });

  it("accepts text that is exactly at the limit", () => {
    expect(checkInput("a".repeat(MAX_INPUT_CHARS))).toBeNull();
  });

  it("rejects text above the limit and names the limit", () => {
    const message = checkInput("a".repeat(MAX_INPUT_CHARS + 1));
    expect(message).toContain(MAX_INPUT_CHARS.toLocaleString("en-US"));
  });

  it("rejects a value that is not a string", () => {
    expect(checkInput(undefined)).not.toBeNull();
    expect(checkInput(42)).not.toBeNull();
  });
});
