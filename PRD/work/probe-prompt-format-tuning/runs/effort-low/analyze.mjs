// Compares the high-effort records against baseline arm A (medium) for the same cases.
import { readFileSync } from "node:fs";
const RECORDS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/effort-low/records.jsonl";
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const high = readFileSync(RECORDS, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const base = [];
for (const [set, runId] of [["hard", "rr-hard"], ["ordinary", "rr-regression"]]) {
  for (const line of readFileSync(`${BACKUPS}/${runId}/calls.jsonl`, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line).record;
    if (r?.arm === "A") base.push({ ...r, set, requestMode: r.strata?.requestKind });
  }
}
const right = (r) => !r.undetermined && r.scores?.correctness === 2;
const q = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};
const sec = (ms) => (ms / 1000).toFixed(1);
function lat(rs) {
  const l = rs.filter((r) => r.status !== "error").map((r) => r.latencyMs);
  return `n=${l.length} median ${sec(q(l, 0.5))} p90 ${sec(q(l, 0.9))} p95 ${sec(q(l, 0.95))} max ${sec(Math.max(...l))} | >30s ${l.filter((x) => x > 30000).length} >25s ${l.filter((x) => x > 25000).length}`;
}
for (const set of ["hard", "ordinary"]) {
  const h = high.filter((r) => r.set === set), b = base.filter((r) => r.set === set);
  console.log(`\n## ${set}: right high ${h.filter(right).length}/${h.length} vs medium ${b.filter(right).length}/${b.length}; undetermined high ${h.filter((r) => r.undetermined).length} medium ${b.filter((r) => r.undetermined).length}; errors medium ${b.filter((r) => r.status === "error").length}`);
  console.log(`latency high:   ${lat(h)}`);
  console.log(`latency medium: ${lat(b)}`);
  const rt = (rs) => q(rs.filter((r) => r.reasoningTokens != null).map((r) => r.reasoningTokens), 0.5);
  const cost = (rs) => rs.reduce((s, r) => s + (r.costUsd ?? 0), 0) / rs.length;
  console.log(`reasoning tokens median high ${rt(h)} vs medium ${rt(b)}; answer cost/question high $${cost(h).toFixed(5)} vs medium $${cost(b).toFixed(5)}`);
  for (const [label, rs] of [["high", h], ["medium", b]]) {
    const slow = [...rs].sort((x, y) => y.latencyMs - x.latencyMs).slice(0, 10);
    const modeOf = (r) => r.requestMode ?? "?";
    const counts = {};
    for (const r of slow) counts[modeOf(r)] = (counts[modeOf(r)] ?? 0) + 1;
    const over25 = rs.filter((r) => r.latencyMs > 25000);
    const c25 = {};
    for (const r of over25) c25[modeOf(r)] = (c25[modeOf(r)] ?? 0) + 1;
    console.log(`${label} slowest 10 by mode ${JSON.stringify(counts)}; >25s by mode ${JSON.stringify(c25)}; mode mix all ${JSON.stringify(rs.reduce((m, r) => ((m[modeOf(r)] = (m[modeOf(r)] ?? 0) + 1), m), {}))}`);
  }
  if (set === "hard" || true) {
    const ids = [...new Set(b.map((r) => r.caseId))];
    for (const id of ids) {
      const hc = h.filter((r) => r.caseId === id), bc = b.filter((r) => r.caseId === id);
      const hr = hc.filter(right).length, br = bc.filter(right).length;
      if (set === "hard" || hr !== br * (hc.length / Math.max(bc.length, 1)) || hr < hc.length)
        console.log(`  ${id}: high ${hr}/${hc.length} vs medium ${br}/${bc.length}  (high scores ${hc.map((r) => r.scores?.correctness ?? "?").join("")}; medium ${bc.map((r) => r.scores?.correctness ?? "?").join("")}; high median ${sec(q(hc.map((r) => r.latencyMs), 0.5))}s vs ${sec(q(bc.map((r) => r.latencyMs), 0.5))}s)`);
    }
  }
}
console.log(`\nTotal spent: $${high.reduce((s, r) => s + r.totalCostUsd, 0).toFixed(3)}; effort reported ${[...new Set(high.map((r) => r.reportedEffort))]}; model ${[...new Set(high.map((r) => r.reportedModel))]}; embedding ${[...new Set(high.map((r) => r.embeddingProvider))]}; semantic all ${high.every((r) => r.usedSemantic)}`);
