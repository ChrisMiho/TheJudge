// Hard-25 pushback (arm C) vs the automatic self-check on the same 25 × 5. Prints counts only — no case ids,
// question text or answers — so the output is safe to summarize in PRD/work text.
import { existsSync, readFileSync } from "node:fs";
const SUITE = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/practice-suite/runs";
const load = (d) => (existsSync(`${SUITE}/${d}/records.jsonl`) ? readFileSync(`${SUITE}/${d}/records.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const NOT_PROVIDED = /(wasn.t|was not|isn.t|is not|aren.t|are not|weren.t|were not|not) (provided|included|in the provided|available|given|supplied)/i;

function classify(r) {
  if (r.turn1.undetermined || r.turn2.undetermined) return "undetermined";
  const a = r.turn1.scores.correctness, b = r.turn2.scores.correctness;
  if (a === 2 && b === 2) return "held";
  if (a === 2) return b === 0 ? "flipped-outcome" : "flipped-side";
  if (b === 2) return a === 0 ? "fixed-from-outcome" : "fixed-from-side";
  return b < a ? "still-wrong-worse" : b > a ? "still-wrong-better" : "still-wrong-same";
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

for (const [label, dir] of [["Pushback (player says it's wrong)", "probe-pushback-hard25"], ["Self-check (neutral)", "probe-selfcheck-hard25"]]) {
  const recs = load(dir);
  if (!recs.length) { console.log(`${label}: no records`); continue; }
  const c = {};
  for (const r of recs) c[classify(r)] = (c[classify(r)] ?? 0) + 1;
  const det = (t) => recs.filter((r) => !r[t].undetermined);
  const right = (t) => det(t).filter((r) => r[t].scores.correctness === 2).length;
  const outcomeWrong = (t) => det(t).filter((r) => r[t].scores.correctness === 0).length;
  const g = (t) => avg(det(t).map((r) => r[t].scores.grounding));
  const lat2 = recs.map((r) => r.turn2.latencyMs);
  const comb = recs.map((r) => r.turn1.latencyMs + r.turn2.latencyMs);
  // per question: did pushback ever fix / ever flip it
  const byCase = new Map();
  for (const r of recs) { const k = classify(r); const e = byCase.get(r.caseId) ?? { fix: 0, flip: 0, t1: 0, n: 0 }; e.n++; if (k.startsWith("fixed")) e.fix++; if (k.startsWith("flipped")) e.flip++; if (r.turn1.scores?.correctness === 2) e.t1++; byCase.set(r.caseId, e); }
  const cases = [...byCase.values()];
  console.log(`\n== ${label}: ${recs.length} conversations, ${byCase.size} questions`);
  console.log(`turn 1 right ${right("turn1")}, turn 2 right ${right("turn2")}  (wrong outcome: turn 1 ${outcomeWrong("turn1")}, turn 2 ${outcomeWrong("turn2")})`);
  console.log(`held ${c.held ?? 0}; flipped ${(c["flipped-outcome"] ?? 0) + (c["flipped-side"] ?? 0)} (outcome ${c["flipped-outcome"] ?? 0} / side ${c["flipped-side"] ?? 0}); fixed ${(c["fixed-from-outcome"] ?? 0) + (c["fixed-from-side"] ?? 0)} (from wrong outcome ${c["fixed-from-outcome"] ?? 0} / from side error ${c["fixed-from-side"] ?? 0}); still wrong ${(c["still-wrong-same"] ?? 0) + (c["still-wrong-better"] ?? 0) + (c["still-wrong-worse"] ?? 0)} (same ${c["still-wrong-same"] ?? 0}, better ${c["still-wrong-better"] ?? 0}, worse ${c["still-wrong-worse"] ?? 0}); undetermined ${c.undetermined ?? 0}`);
  console.log(`questions: ever fixed ${cases.filter((e) => e.fix).length}, ever flipped ${cases.filter((e) => e.flip).length}, both ${cases.filter((e) => e.fix && e.flip).length}; turn 1 never right ${cases.filter((e) => !e.t1).length}, of which ever fixed ${cases.filter((e) => !e.t1 && e.fix).length}`);
  console.log(`grounding turn 1 ${g("turn1").toFixed(2)} -> turn 2 ${g("turn2").toFixed(2)}; "wasn't provided": turn 1 ${recs.filter((r) => NOT_PROVIDED.test(r.answer1)).length}, turn 2 ${recs.filter((r) => NOT_PROVIDED.test(r.answer2)).length}`);
  console.log(`turn 2 median ${(med(lat2) / 1000).toFixed(1)} s, max ${(Math.max(...lat2) / 1000).toFixed(1)} s, over 30 s ${lat2.filter((x) => x > 30000).length}; both turns median ${(med(comb) / 1000).toFixed(1)} s`);
  console.log(`cost $${recs.reduce((a, r) => a + r.totalCostUsd, 0).toFixed(2)}; honesty: embedding ${[...new Set(recs.map((r) => r.embeddingProvider))]}, semantic every turn ${recs.every((r) => r.turn1.usedSemantic && r.turn2.usedSemantic)}, model ${[...new Set(recs.map((r) => r.reportedModel))]}, judge ${[...new Set(recs.map((r) => r.judgeModel))]}, effort ${[...new Set(recs.flatMap((r) => [r.turn1.reportedEffort, r.turn2.reportedEffort]))]}, turn-1 hash ${[...new Set(recs.map((r) => r.turn1PromptHashCheck))]}`);
}
