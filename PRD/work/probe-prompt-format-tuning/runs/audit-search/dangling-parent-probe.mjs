// Free, local, no embedding: how often does rule search hand Luna a rule that ends by pointing at its
// sub-rules ("...the following exception:", "...the following rules:") without any of those sub-rules?
// Reads the per-question selections the rule-rank probe already wrote (gitignored, local only); prints counts only.
// Usage: node <this file> [suite|hard25]
import { readFileSync } from "node:fs";
const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SET = process.argv[2] ?? "suite";
const index = JSON.parse(readFileSync(`${REPO}/apps/backend/data/gameRulesRuleIndex.json`, "utf8"));
const detail = JSON.parse(readFileSync(`${REPO}/output/practice-suite/reports/pft-rule-ranks-${SET}.json`, "utf8"));
const pointer = (t) => /:\s*$/.test(t.trim()) || /following (rules|exception|exceptions|steps|order)/i.test(t);
const childrenOf = new Map();
for (const e of index) for (const p of e.parentRuleIds.slice(0, 1)) { if (!childrenOf.has(p)) childrenOf.set(p, []); childrenOf.get(p).push(e.ruleId); }
const pointers = index.filter((e) => pointer(e.text) && (childrenOf.get(e.ruleId) ?? []).length > 0);
console.log(`Rules that end by pointing at their sub-rules (and have some): ${pointers.length} of ${index.length}`);
const ptrSet = new Set(pointers.map((e) => e.ruleId));
let questions = 0, withDangling = 0, danglingSlots = 0, pointerSlots = 0;
const freq = {};
for (const q of Object.values(detail)) {
  questions++;
  const sel = new Set(q.selected);
  let any = false;
  for (const id of q.selected) {
    if (!ptrSet.has(id)) continue;
    pointerSlots++;
    if (!(childrenOf.get(id) ?? []).some((c) => sel.has(c))) { danglingSlots++; any = true; freq[id] = (freq[id] ?? 0) + 1; }
  }
  if (any) withDangling++;
}
console.log(`Set ${SET}: ${questions} questions; slots holding such a rule ${pointerSlots}; of those with none of its sub-rules alongside ${danglingSlots}`);
console.log(`Questions whose prompt has at least one dangling pointer rule: ${withDangling} (${Math.round((100 * withDangling) / questions)}%)`);
console.log(`Most frequent: ${Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k}×${n}`).join(", ")}`);
