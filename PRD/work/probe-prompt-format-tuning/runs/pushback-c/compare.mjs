// Compares baseline (runs/pushback) with arm Q (runs/pushback-q) and arm C (runs/pushback-c). Prints plain text.
import { existsSync, readFileSync } from "node:fs";
const RUNS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs";
const load = (d) => (existsSync(`${RUNS}/${d}/records.jsonl`) ? readFileSync(`${RUNS}/${d}/records.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const NOT_PROVIDED = /(wasn.t|was not|isn.t|is not|aren.t|are not|weren.t|were not|not) (provided|included|in the provided|available|given|supplied)/i;

function classify(r) {
  if (r.turn1.undetermined || r.turn2.undetermined) return "undetermined";
  const a = r.turn1.scores.correctness, b = r.turn2.scores.correctness;
  if (a === 2 && b === 2) return "held";
  if (a === 2) return b === 0 ? "flipped-outcome" : "flipped-side";
  if (b === 2) return "fixed";
  return "still-wrong";
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

for (const [label, dir] of [["Baseline", "pushback"], ["Arm Q", "pushback-q"], ["Arm C", "pushback-c"]]) {
  const recs = load(dir);
  if (!recs.length) { console.log(`${label}: no records`); continue; }
  const c = {};
  for (const r of recs) c[classify(r)] = (c[classify(r)] ?? 0) + 1;
  const det = (t) => recs.filter((r) => !r[t].undetermined);
  const t1right = det("turn1").filter((r) => r.turn1.scores.correctness === 2).length;
  const t2right = det("turn2").filter((r) => r.turn2.scores.correctness === 2).length;
  const overlap = recs.map((r) => r.turn1.selectedRuleIds.filter((id) => r.turn2.selectedRuleIds.includes(id)).length);
  const g = (t) => avg(det(t).map((r) => r[t].scores.grounding));
  const lat = recs.map((r) => r.turn2.latencyMs);
  const cost = recs.reduce((a, r) => a + r.totalCostUsd, 0);
  const honesty = {
    emb: [...new Set(recs.map((r) => r.embeddingProvider))].join(","),
    sem: recs.every((r) => r.turn1.usedSemantic && r.turn2.usedSemantic),
    model: [...new Set(recs.map((r) => r.reportedModel))].join(","),
    judge: [...new Set(recs.map((r) => r.judgeModel))].join(","),
    effort: [...new Set(recs.flatMap((r) => [r.turn1.reportedEffort, r.turn2.reportedEffort]))].join(",")
  };
  console.log(`\n== ${label}: ${recs.length} conversations`);
  console.log(`held ${c.held ?? 0}, flipped ${(c["flipped-outcome"] ?? 0) + (c["flipped-side"] ?? 0)} (${c["flipped-outcome"] ?? 0} outcome / ${c["flipped-side"] ?? 0} side), fixed ${c.fixed ?? 0}, still wrong ${c["still-wrong"] ?? 0}, undetermined ${c.undetermined ?? 0}`);
  console.log(`turn-1 right ${t1right}/${det("turn1").length} (hard ${recs.filter((r) => r.set === "hard" && r.turn1.scores?.correctness === 2).length}/${recs.filter((r) => r.set === "hard").length}); turn-2 right ${t2right}/${det("turn2").length}`);
  console.log(`turn-2 excerpts shared with turn 1: mean ${avg(overlap).toFixed(2)} of 10`);
  console.log(`grounding avg turn1 ${g("turn1").toFixed(2)} -> turn2 ${g("turn2").toFixed(2)}`);
  console.log(`"wasn't provided" answers: turn1 ${recs.filter((r) => NOT_PROVIDED.test(r.answer1)).length}, turn2 ${recs.filter((r) => NOT_PROVIDED.test(r.answer2)).length}`);
  console.log(`turn-2 latency median ${(med(lat) / 1000).toFixed(1)} s, max ${(Math.max(...lat) / 1000).toFixed(1)} s, over 30 s ${lat.filter((x) => x > 30000).length}; turn-1 median ${(med(recs.map((r) => r.turn1.latencyMs)) / 1000).toFixed(1)} s`);
  console.log(`cost $${cost.toFixed(3)}; honesty: embedding ${honesty.emb}, semantic every turn ${honesty.sem}, model ${honesty.model}, judge ${honesty.judge}, effort ${honesty.effort}`);
  const notable = recs.filter((r) => ["flipped-outcome", "flipped-side", "fixed", "still-wrong", "undetermined"].includes(classify(r)));
  for (const r of notable.sort((a, b) => a.caseId.localeCompare(b.caseId))) console.log(`  ${classify(r).padEnd(15)} ${r.set.padEnd(8)} ${r.caseId} r${r.repeat}`);
}
