"use client";

import { MAX_INPUT_CHARS, checkInput } from "@/lib/limits";

const format = (n: number) => n.toLocaleString("en-US");

export function ClaimInput({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const tooLong = value.length > MAX_INPUT_CHARS;
  const problem = checkInput(value);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!problem) onSubmit();
      }}
    >
      <label htmlFor="draft" className="block text-sm font-semibold">
        Your AI-generated text
      </label>
      <textarea
        id="draft"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={9}
        placeholder="Paste the paragraph that you want to publish."
        aria-describedby="draft-limit"
        aria-invalid={tooLong}
        className={`mt-2 block w-full resize-y rounded-sm border bg-surface p-4 font-serif text-lg leading-relaxed placeholder:text-muted/70 focus:outline-2 focus:outline-offset-2 focus:outline-ink ${
          tooLong ? "border-contradicted" : "border-rule"
        }`}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="draft-limit" className={`text-sm ${tooLong ? "font-semibold text-contradicted" : "text-muted"}`}>
          {format(value.length)} / {format(MAX_INPUT_CHARS)} characters
          {tooLong ? ". The text is too long. Shorten it to check it." : ""}
        </p>
        <button
          type="submit"
          disabled={problem !== null}
          className="rounded-sm bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-paper transition hover:bg-ink/85 focus:outline-2 focus:outline-offset-2 focus:outline-ink disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          Check claims
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 border-l-4 border-contradicted bg-contradicted-soft px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </form>
  );
}
