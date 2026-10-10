// Evidence script for DESIGN-BRIEF.md "Cost dry run (anchor)": recorded Luna
// output tokens and judge cost from the 2026-10-09 paid runs. Offline, read-only.
// Usage: node PRD/work/resolution-recipe-eval/evidence/luna-token-stats.mjs <runs folder>
// e.g. ~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/answer-quality/runs
import { readFileSync, readdirSync } from "node:fs";

const root = process.argv[2];
const runs = readdirSync(root).filter((d) => !d.endsWith(".json")).sort();
const all = [];
let recordLines = 0;
for (const run of runs) {
  const lines = readFileSync(`${root}/${run}/calls.jsonl`, "utf8").trim().split("\n");
  const byKey = new Map(); // last record per key, in case a resume rewrote one
  for (const line of lines) {
    const o = JSON.parse(line);
    if (o.type !== "record") continue;
    recordLines += 1;
    byKey.set(o.record.key, o.record);
  }
  for (const r of byKey.values()) all.push({ run, ...r });
}
console.log(`run folders: ${runs.join(", ")}`);
console.log(`record lines: ${recordLines}; distinct keys: ${all.length}`);

const stat = (xs) => {
  const v = xs.filter((x) => typeof x === "number");
  if (!v.length) return "n=0";
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return `n=${v.length} mean=${mean.toFixed(6)} max=${Math.max(...v)}`;
};
const show = (label, recs) => {
  console.log(label);
  console.log("  outputTokens", stat(recs.map((r) => r.outputTokens)));
  console.log("  reasoningTokens", stat(recs.map((r) => r.reasoningTokens)));
  console.log("  judgeCostUsd", stat(recs.map((r) => r.judgeCostUsd)));
};
const okLuna = all.filter((r) => r.model === "gpt-6-luna" && r.status === "ok");
show("gpt-6-luna, status ok, all tiers", okLuna);
show("gpt-6-luna, status ok, tier 3", okLuna.filter((r) => r.tier === 3));
for (const run of runs) {
  const l = okLuna.filter((r) => r.run === run);
  if (l.length) show(`${run}: gpt-6-luna, status ok`, l);
}
const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};
const lat = okLuna.map((r) => r.latencyMs);
const lat3 = okLuna.filter((r) => r.tier === 3).map((r) => r.latencyMs);
console.log(`latencyMs, gpt-6-luna ok, all tiers: n=${lat.length} max=${Math.max(...lat)}`);
console.log(`latencyMs, gpt-6-luna ok, tier 3: n=${lat3.length} median=${median(lat3)} max=${Math.max(...lat3)}`);
