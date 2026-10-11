// Counts only. Reads the probe folders and the pass records for the hard-25 ids.
import { existsSync, readFileSync } from "node:fs";
const SUITE = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/rulesguru";
const ids = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
const lines = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);

const med = [];
const passHash = new Map();
for (let n = 1; n <= 5; n++) for (const j of lines(`${SUITE}/runs/pft-pass${n}/calls.jsonl`)) {
  if (j.type !== "record" || !ids.includes(j.record.caseId)) continue;
  const r = j.record;
  if (r.status !== "ok") { med.push({ ...r, err: true }); continue; }
  med.push({ caseId: r.caseId, correctness: r.undetermined ? null : r.scores?.correctness, latencyMs: r.latencyMs, effort: r.reportedEffort, cost: (r.costUsd ?? 0) + (r.judgeCostUsd ?? 0), promptHash: r.promptHash, rt: r.reasoningTokens });
  passHash.set(r.caseId, r.promptHash);
}
const load = (e) => lines(`${SUITE}/runs/probe-effort-${e}/records.jsonl`).map((r) => ({ caseId: r.caseId, correctness: r.undetermined ? null : r.scores?.correctness, latencyMs: r.latencyMs, effort: r.reportedEffort, cost: r.totalCostUsd, promptHash: r.promptHash, model: r.reportedModel, emb: r.embeddingProvider, sem: r.usedSemantic, rt: r.reasoningTokens }));
const sets = { low: load("low"), medium: med.filter((r) => !r.err), high: load("high") };

const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : NaN; };
for (const [k, rs] of Object.entries(sets)) {
  const right = rs.filter((r) => r.correctness === 2).length;
  const und = rs.filter((r) => r.correctness == null).length;
  const lat = rs.map((r) => r.latencyMs);
  const rt = rs.map((r) => r.rt ?? 0);
  console.log(`${k}: n=${rs.length} right=${right} (${((right / rs.length) * 100).toFixed(1)}%) undetermined=${und} | latency med ${(q(lat, 0.5) / 1000).toFixed(1)}s p95 ${(q(lat, 0.95) / 1000).toFixed(1)}s max ${(Math.max(...lat) / 1000).toFixed(1)}s >30s ${lat.filter((x) => x > 30000).length} | rt med ${q(rt, 0.5)} | cost $${rs.reduce((s, r) => s + (r.cost ?? 0), 0).toFixed(3)} | efforts ${[...new Set(rs.map((r) => r.effort))]}`);
}
console.log(`medium errors (not ok): ${med.filter((r) => r.err).length}; medium cases covered: ${new Set(sets.medium.map((r) => r.caseId)).size}/25`);
for (const e of ["low", "high"]) {
  const rs = sets[e];
  const bad = rs.filter((r) => passHash.has(r.caseId) && r.promptHash !== passHash.get(r.caseId)).length;
  const unverified = new Set(rs.filter((r) => !passHash.has(r.caseId)).map((r) => r.caseId)).size;
  const hon = rs.filter((r) => r.model !== "gpt-6-luna" || r.emb !== "local" || !r.sem || r.effort !== e).length;
  console.log(`${e}: hash mismatches ${bad}; cases with no pass record to compare ${unverified}; honesty failures ${hon}`);
}
// Same-case comparison over the cases that have medium records.
const covered = new Set(sets.medium.map((r) => r.caseId));
for (const [k, rs] of Object.entries(sets)) {
  const sub = rs.filter((r) => covered.has(r.caseId));
  console.log(`  on medium-covered cases ${k}: ${sub.filter((r) => r.correctness === 2).length}/${sub.length}`);
}
console.log("Per-case (x/n right) where settings differ by >=2 (rate-scaled to /5 for medium):");
for (const id of ids) {
  const c = (rs) => { const s = rs.filter((r) => r.caseId === id); return { r: s.filter((r) => r.correctness === 2).length, n: s.length }; };
  const L = c(sets.low), M = c(sets.medium), H = c(sets.high);
  const rate = (x) => (x.n ? (x.r / x.n) * 5 : null);
  const vals = [rate(L), rate(M), rate(H)].filter((v) => v !== null);
  if (vals.length >= 2 && Math.max(...vals) - Math.min(...vals) >= 2) console.log(`  ${id}: low ${L.r}/${L.n} med ${M.r}/${M.n} high ${H.r}/${H.n}`);
}
