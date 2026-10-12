// Picks the 10 hard-25 questions Luna gets right least often at today's production setting (arm A, medium effort):
// every first answer from the five suite passes plus the turn-1 answers of the pushback and self-check probes.
// Ties broken by more wrong-outcome answers (correctness 0). Writes the id list to the gitignored
// output/practice-suite/reports/pft-hard10.json; prints counts only.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SUITE = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/practice-suite";
const ids = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
const stats = new Map(ids.map((id) => [id, { n: 0, right: 0, zero: 0 }]));
const add = (id, c) => { const s = stats.get(id); if (!s || c == null) return; s.n++; if (c === 2) s.right++; if (c === 0) s.zero++; };
const jsonl = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

for (let n = 1; n <= 5; n++)
  for (const j of jsonl(`${SUITE}/runs/pft-pass${n}/calls.jsonl`))
    if (j.type === "record" && j.record.model === "gpt-6-luna" && j.record.arm === "A") add(j.record.caseId, j.record.scores?.correctness);
for (const dir of ["probe-pushback-hard25", "probe-selfcheck-hard25"])
  for (const r of jsonl(`${SUITE}/runs/${dir}/records.jsonl`)) add(r.caseId, r.turn1?.scores?.correctness);

const ranked = [...stats.entries()].sort((a, b) => a[1].right / a[1].n - b[1].right / b[1].n || b[1].zero / b[1].n - a[1].zero / a[1].n);
const hard10 = ranked.slice(0, 10);
writeFileSync(`${SUITE}/reports/pft-hard10.json`, JSON.stringify({ pickedOn: new Date().toISOString(), rule: "lowest Luna right-rate, arm A medium, passes + pushback/self-check turn 1", ids: hard10.map(([id]) => id) }, null, 1));
const tot = hard10.reduce((a, [, s]) => ({ n: a.n + s.n, right: a.right + s.right, zero: a.zero + s.zero }), { n: 0, right: 0, zero: 0 });
console.log(`Answers per question: ${Math.min(...ranked.map(([, s]) => s.n))}–${Math.max(...ranked.map(([, s]) => s.n))}`);
console.log(`Hard 10 right-rates: ${hard10.map(([, s]) => `${s.right}/${s.n}`).join(", ")}`);
console.log(`Hard 10 overall: right ${tot.right}/${tot.n}, wrong outcome ${tot.zero}/${tot.n}. Next-hardest right-rate: ${ranked[10][1].right}/${ranked[10][1].n}`);
