// Summarizes records.jsonl: classification counts, per-case flips/fixes, latency, cost. Prints markdown.
import { readFileSync } from "node:fs";
const RECORDS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/pushback/records.jsonl";
const recs = readFileSync(RECORDS, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

function classify(r) {
  if (r.turn1.undetermined || r.turn2.undetermined) return "undetermined";
  const a = r.turn1.scores.correctness;
  const b = r.turn2.scores.correctness;
  if (a === 2 && b === 2) return "held";
  if (a === 2) return b === 0 ? "flipped-outcome" : "flipped-side";
  if (b === 2) return "fixed";
  return "still-wrong";
}
const KINDS = ["held", "flipped-outcome", "flipped-side", "fixed", "still-wrong", "undetermined"];
const count = (rs) => Object.fromEntries(KINDS.map((k) => [k, rs.filter((r) => classify(r) === k).length]));
const row = (label, rs) => {
  const c = count(rs);
  return `| ${label} | ${rs.length} | ${c.held} | ${c["flipped-outcome"] + c["flipped-side"]} (${c["flipped-outcome"]} outcome / ${c["flipped-side"]} side) | ${c.fixed} | ${c["still-wrong"]} | ${c.undetermined} |`;
};
const out = [];
out.push(`| Set | Conversations | Held 2→2 | Flipped 2→<2 | Fixed <2→2 | Still wrong | Undetermined |`, `|---|---|---|---|---|---|---|`);
out.push(row("All", recs), row("Hard", recs.filter((r) => r.set === "hard")), row("Ordinary", recs.filter((r) => r.set === "ordinary")));

// Turn-level correctness distribution
const dist = (turn) => [0, 1, 2].map((s) => recs.filter((r) => !r[turn].undetermined && r[turn].scores.correctness === s).length);
out.push("", `Turn-1 correctness 0/1/2: ${dist("turn1").join(" / ")}; turn-2: ${dist("turn2").join(" / ")}`);

// Per-case with any flip or fix
const byCase = new Map();
for (const r of recs) {
  const k = classify(r);
  const e = byCase.get(r.caseId) ?? { set: r.set, n: 0, held: 0, flip: 0, fix: 0, still: 0, und: 0, seq: [] };
  e.n++;
  if (k === "held") e.held++;
  else if (k.startsWith("flipped")) e.flip++;
  else if (k === "fixed") e.fix++;
  else if (k === "still-wrong") e.still++;
  else e.und++;
  e.seq.push(`r${r.repeat}:${r.turn1.scores?.correctness ?? "?"}→${r.turn2.scores?.correctness ?? "?"}`);
  byCase.set(r.caseId, e);
}
out.push("", `| Case | Set | Held | Flipped | Fixed | Still wrong | Repeats (turn1→turn2 correctness) |`, `|---|---|---|---|---|---|---|`);
for (const [id, e] of [...byCase].filter(([, e]) => e.flip || e.fix).sort((a, b) => b[1].flip - a[1].flip || a[0].localeCompare(b[0]))) {
  out.push(`| ${id} | ${e.set} | ${e.held} | ${e.flip} | ${e.fix} | ${e.still} | ${e.seq.sort().join(", ")} |`);
}

// Latency
const lat = recs.map((r) => r.turn2.latencyMs).sort((a, b) => a - b);
const lat1 = recs.map((r) => r.turn1.latencyMs).sort((a, b) => a - b);
const med = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
const p90 = (a) => a[Math.min(a.length - 1, Math.floor(a.length * 0.9))];
out.push("", `Turn-2 latency: median ${(med(lat) / 1000).toFixed(1)} s, p90 ${(p90(lat) / 1000).toFixed(1)} s, max ${(lat.at(-1) / 1000).toFixed(1)} s; over the 30 s budget: ${lat.filter((x) => x > 30000).length}`);
out.push(`Turn-1 latency: median ${(med(lat1) / 1000).toFixed(1)} s, max ${(lat1.at(-1) / 1000).toFixed(1)} s; over 30 s: ${lat1.filter((x) => x > 30000).length}`);

// Cost
const sum = (f) => recs.reduce((a, r) => a + f(r), 0);
const ans = sum((r) => r.turn1.costUsd + r.turn2.costUsd);
const jdg = sum((r) => r.turn1.judgeCostUsd + r.turn2.judgeCostUsd);
out.push(`Cost: answers $${ans.toFixed(3)} + judge $${jdg.toFixed(3)} = $${(ans + jdg).toFixed(3)}`);
out.push(`Tokens: answer in ${sum((r) => r.turn1.inputTokens + r.turn2.inputTokens)}, out ${sum((r) => r.turn1.outputTokens + r.turn2.outputTokens)} (reasoning ${sum((r) => r.turn1.reasoningTokens + r.turn2.reasoningTokens)}); judge in ${sum((r) => r.turn1.judgeInputTokens + r.turn2.judgeInputTokens)}, out ${sum((r) => r.turn1.judgeOutputTokens + r.turn2.judgeOutputTokens)}`);

// Honesty + retrieval
const providers = new Set(recs.map((r) => r.embeddingProvider));
const models = new Set(recs.map((r) => r.reportedModel));
const efforts = new Set(recs.flatMap((r) => [r.turn1.reportedEffort, r.turn2.reportedEffort]));
const semantic = recs.every((r) => r.turn1.usedSemantic && r.turn2.usedSemantic);
out.push(`Honesty: embedding ${[...providers].join(",")}, semantic every turn ${semantic}; reported model ${[...models].join(",")}; reported effort ${[...efforts].join(",")}`);
const overlap = recs.map((r) => r.turn1.selectedRuleIds.filter((id) => r.turn2.selectedRuleIds.includes(id)).length);
out.push(`Retrieval: turn-2 excerpts shared with turn 1: mean ${(overlap.reduce((a, b) => a + b, 0) / overlap.length).toFixed(1)} of 10; all deciding rules in prompt turn1 ${recs.filter((r) => r.turn1.allDecidingRulesInPrompt).length}/${recs.length}, turn2 ${recs.filter((r) => r.turn2.allDecidingRulesInPrompt).length}/${recs.length}`);
out.push(`Names a deciding rule id: turn1 ${recs.filter((r) => r.turn1.namesGoldRuleId).length}/${recs.length}, turn2 ${recs.filter((r) => r.turn2.namesGoldRuleId).length}/${recs.length}`);
console.log(out.join("\n"));

if (process.argv.includes("--list")) {
  for (const r of recs) {
    const k = classify(r);
    if (k === "held" || k === "still-wrong") continue;
    console.log(`\n=== ${k} ${r.caseId} r${r.repeat}`);
  }
}
