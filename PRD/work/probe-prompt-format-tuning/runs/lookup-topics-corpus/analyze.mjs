// Counts only (no suite ids or text). Arm L vs arm A baselines.
import { existsSync, readFileSync } from "node:fs";
const SUITE = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/practice-suite";
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const CORPUS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/lookup-topics-corpus/records.jsonl";
const ids = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
const lines = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : NaN; };
const lat = (rs) => { const l = rs.map((r) => r.latencyMs); return `lat med ${(q(l, 0.5) / 1000).toFixed(1)}s p95 ${(q(l, 0.95) / 1000).toFixed(1)}s >30s ${l.filter((x) => x > 30000).length}`; };
const right = (rs) => rs.filter((r) => !r.undetermined && r.scores?.correctness === 2).length;
const honesty = (rs) => rs.filter((r) => r.reportedModel !== "gpt-6-luna" || r.embeddingProvider !== "local" || r.usedSemantic === false || r.reportedEffort !== "medium").length;

// ---- suite ----
const A = [];
for (let n = 1; n <= 5; n++) for (const j of lines(`${SUITE}/runs/pft-pass${n}/calls.jsonl`)) if (j.type === "record" && ids.includes(j.record.caseId) && j.record.status === "ok") A.push(j.record);
const L = lines(`${SUITE}/runs/probe-lookup-topics-hard25/records.jsonl`);
const covered = new Set(A.map((r) => r.caseId));
const Lc = L.filter((r) => covered.has(r.caseId));
const passHash = new Map(A.map((r) => [r.caseId, r.promptHash]));
console.log(`SUITE  L ${right(L)}/${L.length} (cost $${L.reduce((s, r) => s + r.totalCostUsd, 0).toFixed(3)}, ${lat(L)}, honesty fails ${honesty(L)}, undetermined ${L.filter((r) => r.undetermined).length})`);
console.log(`SUITE  A ${right(A)}/${A.length} on ${covered.size} cases (${lat(A)}); L on those cases ${right(Lc)}/${Lc.length}; L base-hash mismatches ${L.filter((r) => passHash.has(r.caseId) && r.basePromptHash !== passHash.get(r.caseId)).length}`);
{
  const added = [...new Map(L.map((r) => [r.caseId, r.addedPromptChars])).values()];
  console.log(`SUITE  added chars median ${q(added, 0.5)} max ${Math.max(...added)}; cases with reshuffled excerpts ${new Set(L.filter((r) => r.excerptsChanged).map((r) => r.caseId)).size}`);
  let up = 0, down = 0, d2 = 0;
  for (const id of covered) {
    const a = A.filter((r) => r.caseId === id), l = L.filter((r) => r.caseId === id);
    if (!a.length || !l.length) continue;
    const ra = right(a) / a.length, rl = right(l) / l.length;
    if (rl > ra) up++; if (rl < ra) down++;
    if ((ra - rl) * 5 >= 2) d2++;
  }
  console.log(`SUITE  per-case rate: L better ${up}, L worse ${down}, L worse by >=2 of 5 ${d2}`);
}

// ---- corpus ----
const base = [];
for (const [set, runId] of [["hard", "rr-hard"], ["ordinary", "rr-regression"]]) for (const j of lines(`${BACKUPS}/${runId}/calls.jsonl`)) if (j.record?.arm === "A" && j.record.strata?.requestKind === "lookup") base.push({ ...j.record, set });
const CL = lines(CORPUS);
for (const set of ["hard", "ordinary"]) {
  const a = base.filter((r) => r.set === set), l = CL.filter((r) => r.set === set);
  console.log(`CORPUS ${set}: L ${right(l)}/${l.length} vs A ${right(a)}/${a.length} | L ${lat(l)} | A ${lat(a)} | L honesty fails ${honesty(l)} | L cost $${l.reduce((s, r) => s + r.totalCostUsd, 0).toFixed(3)}`);
  const caseIds = [...new Set(a.map((r) => r.caseId))];
  for (const id of caseIds) {
    const ra = right(a.filter((r) => r.caseId === id)), rl = right(l.filter((r) => r.caseId === id));
    const n = l.filter((r) => r.caseId === id).length;
    if (ra !== rl) console.log(`   ${id}: A ${ra} L ${rl}/${n}${ra - rl >= 2 ? "  <-- lost 2+" : ""}`);
  }
}
const added = [...new Map(CL.map((r) => [r.caseId, r.addedPromptChars])).values()];
if (added.length) console.log(`CORPUS added chars median ${q(added, 0.5)} max ${Math.max(...added)}`);
const all = [...L, ...CL];
console.log(`ALL L: ${lat(all)}; total cost $${all.reduce((s, r) => s + r.totalCostUsd, 0).toFixed(3)}`);
