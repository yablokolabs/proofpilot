export const MAX_INPUT_CHARS = 3000;
export const MAX_CLAIMS = 8;

/** Returns the reason that the text cannot be checked, or null if it can. */
export function checkInput(text: unknown): string | null {
  if (typeof text !== "string" || text.trim().length === 0) {
    return "Paste some text to check.";
  }
  if (text.length > MAX_INPUT_CHARS) {
    return `The text is ${text.length.toLocaleString("en-US")} characters. The limit is ${MAX_INPUT_CHARS.toLocaleString("en-US")}. Shorten the text and try again.`;
  }
  return null;
}
