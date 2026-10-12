// Counts-only analysis of the hard-10 model comparison: per model and per judge, first-answer score, what pushback
// does (held / abandoned / fixed / still wrong), time and cost; then how often the cheap judge agrees with Sol's.
// No case ids, question text or answers are printed.
import { existsSync, readFileSync, readdirSync } from "node:fs";

const DIR = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/practice-suite/runs/probe-models-hard10";
const models = readdirSync(DIR).filter((m) => existsSync(`${DIR}/${m}/records.jsonl`));
const load = (m) => readFileSync(`${DIR}/${m}/records.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const corr = (turn, judge) => (turn.grades[judge].undetermined ? null : turn.grades[judge].scores.correctness);

const agreeAll = { exact: 0, right: 0, n: 0 };
for (const m of models) {
  const recs = load(m);
  console.log(`\n== ${m}: ${recs.length} conversations, ${new Set(recs.map((r) => r.caseId)).size} questions; reported effort ${[...new Set(recs.flatMap((r) => [r.turn1.reportedEffort, r.turn2.reportedEffort]))]}; hash ${[...new Set(recs.map((r) => r.turn1PromptHashCheck))]}; embedder ${[...new Set(recs.map((r) => r.embeddingProvider))]}; rate ${[...new Set(recs.map((r) => r.rateSource))]}`);
  for (const judge of recs[0].judges) {
    const c = { held: 0, abandonedOutcome: 0, abandonedSide: 0, fixed: 0, still: 0, und: 0 };
    let r1 = 0, r2 = 0, z1 = 0, z2 = 0;
    const perCase = new Map();
    for (const r of recs) {
      const a = corr(r.turn1, judge), b = corr(r.turn2, judge);
      if (a == null || b == null) { c.und++; continue; }
      if (a === 2) r1++; if (b === 2) r2++; if (a === 0) z1++; if (b === 0) z2++;
      if (a === 2 && b === 2) c.held++;
      else if (a === 2) b === 0 ? c.abandonedOutcome++ : c.abandonedSide++;
      else if (b === 2) c.fixed++;
      else c.still++;
      const e = perCase.get(r.caseId) ?? { right1: 0 }; if (a === 2) e.right1++; perCase.set(r.caseId, e);
    }
    const everRight = [...perCase.values()].filter((e) => e.right1 > 0).length;
    console.log(`  judge ${judge}: first answer right ${r1}/${recs.length} (wrong outcome ${z1}); after pushback right ${r2} (wrong outcome ${z2}). Held ${c.held}, abandoned ${c.abandonedOutcome + c.abandonedSide} (outcome ${c.abandonedOutcome} / side ${c.abandonedSide}), fixed ${c.fixed}, still wrong ${c.still}, undetermined ${c.und}. Questions ever right first time: ${everRight}/${perCase.size}`);
  }
  const t1 = recs.map((r) => r.turn1.latencyMs), t2 = recs.map((r) => r.turn2.latencyMs);
  const cost = recs.reduce((s, r) => s + r.turn1.costUsd + r.turn2.costUsd, 0);
  const judgeCost = recs.reduce((s, r) => s + r.totalCostUsd, 0) - cost;
  console.log(`  time: first answer median ${(med(t1) / 1000).toFixed(1)} s, max ${(Math.max(...t1) / 1000).toFixed(1)} s, over 30 s ${t1.filter((x) => x > 30000).length}; re-check median ${(med(t2) / 1000).toFixed(1)} s, over 30 s ${t2.filter((x) => x > 30000).length}`);
  console.log(`  output tokens per answer median ${med(recs.flatMap((r) => [r.turn1.outputTokens, r.turn2.outputTokens]))} (reasoning ${med(recs.flatMap((r) => [r.turn1.reasoningTokens, r.turn2.reasoningTokens]))})`);
  console.log(`  cost: answers $${cost.toFixed(2)} ($${(cost / (2 * recs.length)).toFixed(4)} per answer), judges $${judgeCost.toFixed(2)}`);
  // judge agreement on this model's answers
  const ag = { exact: 0, right: 0, n: 0, solHigher: 0, lunaHigher: 0 };
  for (const r of recs) for (const t of [r.turn1, r.turn2]) {
    const s = corr(t, "gpt-6.1-sol"), l = corr(t, "gpt-6-luna");
    if (s == null || l == null) continue;
    ag.n++; if (s === l) ag.exact++; if ((s === 2) === (l === 2)) ag.right++; if (s > l) ag.solHigher++; if (l > s) ag.lunaHigher++;
  }
  agreeAll.exact += ag.exact; agreeAll.right += ag.right; agreeAll.n += ag.n;
  console.log(`  Luna judge vs Sol judge on these answers: same score ${ag.exact}/${ag.n}, same right/not-right call ${ag.right}/${ag.n}; Sol scored higher ${ag.solHigher}, Luna scored higher ${ag.lunaHigher}`);
}
console.log(`\nJudge agreement overall: same score ${agreeAll.exact}/${agreeAll.n} (${Math.round((100 * agreeAll.exact) / agreeAll.n)}%), same right/not-right ${agreeAll.right}/${agreeAll.n} (${Math.round((100 * agreeAll.right) / agreeAll.n)}%)`);
