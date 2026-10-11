/**
 * Runs one real check from the command line and prints the events.
 * Usage: pnpm check:live "<text>"   or   pnpm check:live --file <path>
 */
import { readFileSync } from "node:fs";
import { extractClaims } from "../src/lib/extract";
import { judgeClaim } from "../src/lib/judge";
import { checkInput } from "../src/lib/limits";
import { modelName } from "../src/lib/llm";
import { runCheck } from "../src/lib/pipeline";
import { retrieveEvidence } from "../src/lib/retrieve";
import type { Claim } from "../src/lib/types";

const args = process.argv.slice(2);
const text = args[0] === "--file" ? readFileSync(args[1], "utf8").trim() : args.join(" ");

const problem = checkInput(text);
if (problem) {
  console.error(problem);
  process.exit(1);
}

const started = Date.now();
const seconds = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;
const claims = new Map<string, Claim>();

console.log(`Model: ${modelName()}\n`);

await runCheck(
  text,
  { extract: extractClaims, retrieve: retrieveEvidence, judge: judgeClaim },
  (event) => {
    if (event.type === "claims") {
      console.log(`[${seconds()}] ${event.claims.length} claims located, ${event.notAssessed} not assessed\n`);
      for (const claim of event.claims) claims.set(claim.id, claim);
    } else if (event.type === "verdict") {
      const { verdict } = event;
      const claim = claims.get(verdict.claimId)!;
      console.log(`[${seconds()}] ${verdict.status.toUpperCase()}  ${claim.id} [${claim.start}-${claim.end}] "${claim.quote}"`);
      console.log(`    ${verdict.explanation}`);
      for (const citation of verdict.citations) {
        console.log(`    - (${citation.stance}, ${citation.sourceType}) ${citation.title}`);
        console.log(`      ${citation.url}`);
        console.log(`      "${citation.excerpt}"`);
      }
      console.log();
    } else if (event.type === "done") {
      console.log(`[${seconds()}] done`);
    }
  },
);
