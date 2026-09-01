// Combo-context-validation — summarize results.json into report tables (FREE).
// Prints a verdict tally, a per-case table, and missing-context theme counts to
// feed the human-written FINDINGS.md. No model calls.
//
//   node report.mjs

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { cases, model, judgeModel } = JSON.parse(readFileSync(resolve(HERE, "results.json"), "utf8"));

const V = (c) => c.verdict?.verdict ?? "NO_ANSWER";
const tally = {};
const missCat = {};
const byBand = {};
for (const c of cases) {
  tally[V(c)] = (tally[V(c)] || 0) + 1;
  byBand[c.band] = byBand[c.band] || {};
  byBand[c.band][V(c)] = (byBand[c.band][V(c)] || 0) + 1;
  if (V(c) !== "CORRECT" && c.verdict?.missingContext) missCat[c.verdict.missingContext] = (missCat[c.verdict.missingContext] || 0) + 1;
}

console.log(`Model: ${model}   Judge: ${judgeModel}   Cases: ${cases.length}\n`);
console.log("=== VERDICT TALLY ===");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(12)} ${v}`);

console.log("\n=== BY POPULARITY BAND ===");
for (const [band, t] of Object.entries(byBand)) console.log(`  ${band.padEnd(6)} ${JSON.stringify(t)}`);

console.log("\n=== MISSING-CONTEXT CATEGORY (non-correct only) ===");
for (const [k, v] of Object.entries(missCat).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`);

console.log("\n=== PER-CASE ===");
console.log("  case      band  pop    verdict     I/P/M    miss            combo§  suppl#  ruleSkip  cards");
for (const c of cases) {
  const v = c.verdict || {};
  const ipm = `${v.identified ? "Y" : "-"}/${v.payoff ? "Y" : "-"}/${v.mechanism ? "Y" : "-"}`;
  const d = c.diagnosis || {};
  console.log(
    `  ${c.caseId}  ${String(c.band).padEnd(5)} ${String(c.popularity).padEnd(6)} ${String(V(c)).padEnd(11)} ${ipm.padEnd(8)} ${String(v.missingContext || "-").padEnd(15)} ${String(d.comboSectionChars || 0).padEnd(6)}  ${String((d.supplementalRulesRetrieved || []).length).padEnd(6)}  ${String((d.rulingsSkippedNoMatch || []).length).padEnd(8)}  ${c.cardNames.join(" + ")}`
  );
}

// Emit machine-readable rows for pasting into FINDINGS.md if useful.
console.log("\n=== MARKDOWN TABLE ===");
console.log("| Case | Pop | Verdict | I/P/M | Missing-context | Retrieved rules | Skipped rulings |");
console.log("|---|---|---|---|---|---|---|");
for (const c of cases) {
  const v = c.verdict || {}; const d = c.diagnosis || {};
  const ipm = `${v.identified ? "✓" : "✗"}/${v.payoff ? "✓" : "✗"}/${v.mechanism ? "✓" : "✗"}`;
  console.log(`| ${c.caseId} (${c.cardNames.slice(0, 2).join(" + ")}${c.cardNames.length > 2 ? " …" : ""}) | ${c.popularity} | ${V(c)} | ${ipm} | ${v.missingContext || "—"} | ${(d.supplementalRulesRetrieved || []).map((r) => r.ruleId).join(", ")} | ${(d.rulingsSkippedNoMatch || []).join(", ") || "none"} |`);
}
