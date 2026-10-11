// Counts-only analysis of the "ask what's unclear" run. Prints: ruling right-rate, step-list verdicts, misses by kind
// (lacked / misused / unclear) and by prompt part, how often Luna's own UNCLEAR flags are real and tied to a miss.
// A judge's "unclear" quote is printed only when it is template text — found verbatim in our prompt source files,
// curated topic data or Comprehensive Rules text — so no question, card or answer text is ever printed.
import { readFileSync } from "node:fs";

const R = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/rulesguru/runs/probe-unclear-hard25/records.jsonl";
const recs = readFileSync(R, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const judged = recs.filter((r) => r.stepJudgement && !r.undetermined);
const inc = (o, k, n = 1) => (o[k] = (o[k] ?? 0) + n);
const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

// Template text = our own prompt wording (prompt source files, curated topic data) or Comprehensive Rules text.
const SRC = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/apps/backend";
const templateText = norm([
  ...["promptAssembly.ts", "promptFormatting.ts", "mtgReference.ts", "phaseGuidance.ts", "context.ts"].map((f) => readFileSync(`${SRC}/src/prompt/${f}`, "utf8")),
  readFileSync(`${SRC}/data/gameRulesByTopic.json`, "utf8"),
  ...JSON.parse(readFileSync(`${SRC}/data/gameRulesRuleIndex.json`, "utf8")).map((e) => e.text)
].join(" ").replace(/\\n/g, " "));

console.log(`Records ${recs.length} (${new Set(recs.map((r) => r.caseId)).size} questions); step judgement parsed ${recs.filter((r) => r.stepJudgement).length}; answer undetermined ${recs.filter((r) => r.undetermined).length}`);
console.log(`Honesty: model ${[...new Set(recs.flatMap((r) => [r.reportedModel.turn1, r.reportedModel.turn2]))]}, effort ${[...new Set(recs.flatMap((r) => [r.reportedEffort.turn1, r.reportedEffort.turn2]))]}, embedder ${[...new Set(recs.map((r) => r.embeddingProvider))]}, hash ${[...new Set(recs.map((r) => r.basePromptHashCheckAtRun))]}, every rule present ${recs.filter((r) => r.allDecidingRulesInPrompt).length}/${recs.length}`);
const right = judged.filter((r) => r.scores.correctness === 2).length;
console.log(`Ruling right ${right}/${judged.length} (every-rule-added, answering straight: 75/125 = 60%)`);

const verdict = {};
const byVerdictRight = {};
for (const r of judged) { inc(verdict, r.stepJudgement.listVerdict); inc(byVerdictRight, r.stepJudgement.listVerdict, r.scores.correctness === 2 ? 1 : 0); }
console.log(`Step list: ${Object.entries(verdict).map(([k, v]) => `${k} ${v} (ruling right ${byVerdictRight[k]})`).join(", ")}`);

const kinds = {}, kindParts = {}, kindWrong = {};
let missRecs = 0;
for (const r of judged) {
  const ms = r.stepJudgement.misses;
  if (ms.length) missRecs++;
  for (const m of ms) {
    inc(kinds, m.kind);
    const part = /^rule/i.test(m.promptPart) ? "rule excerpt" : (m.promptPart || "none").toLowerCase();
    inc(kindParts, `${m.kind} / ${part}`);
    if (r.scores.correctness !== 2) inc(kindWrong, m.kind);
  }
}
console.log(`Conversations with at least one miss: ${missRecs}/${judged.length}`);
console.log(`Misses by kind: ${Object.entries(kinds).map(([k, v]) => `${k} ${v} (in a wrong ruling ${kindWrong[k] ?? 0})`).join(", ")}`);
console.log(`Misses by kind / prompt part:`);
for (const [k, v] of Object.entries(kindParts).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

// rules most often misused
const misusedRules = {};
for (const r of judged) for (const m of r.stepJudgement.misses) if (m.kind === "misused" && /^rule/i.test(m.promptPart)) for (const id of m.promptPart.match(/\d{3}(\.\d+[a-z]?)?/g) ?? []) inc(misusedRules, id);
console.log(`Rules most often misused: ${Object.entries(misusedRules).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}×${v}`).join(", ")}`);

// Luna's own UNCLEAR flags
const fl = { total: 0, real: 0, related: 0, realRelated: 0, recsWithFlags: 0 };
for (const r of judged) {
  const f = r.stepJudgement.flagged;
  if (f.length) fl.recsWithFlags++;
  for (const x of f) { fl.total++; if (x.real) fl.real++; if (x.relatedToMiss) fl.related++; if (x.real && x.relatedToMiss) fl.realRelated++; }
}
console.log(`Luna's UNCLEAR flags: ${fl.total} in ${fl.recsWithFlags}/${judged.length} conversations; judged real ${fl.real}, tied to a miss ${fl.related}, both ${fl.realRelated}`);

// unclear quotes that are template text
const quotes = {};
let unclearTotal = 0, printable = 0;
for (const r of judged) for (const m of r.stepJudgement.misses) if (m.kind === "unclear") {
  unclearTotal++;
  const q = norm(m.quote ?? "");
  if (q.length < 12) continue;
  if (templateText.includes(q)) { printable++; inc(quotes, q); }
}
console.log(`"Unclear" misses: ${unclearTotal}; quoting our prompt wording or rule text: ${printable} (the rest quote card text, rulings or the question — not printed)`);
for (const [q, n] of Object.entries(quotes).sort((a, b) => b[1] - a[1])) console.log(`  ×${n} "${q}"`);

const t = judged.map((r) => r.latencyMs.turn1 + r.latencyMs.turn2).sort((a, b) => a - b);
console.log(`Time (steps + ruling) median ${(t[t.length >> 1] / 1000).toFixed(1)} s; cost $${recs.reduce((s, r) => s + r.costUsd.total, 0).toFixed(2)}`);
