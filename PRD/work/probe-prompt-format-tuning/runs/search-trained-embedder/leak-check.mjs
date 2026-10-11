// Free, local probe (no API calls, no LLM): where does the cross-validated gain come from?
// 1. Deciding rules the fold model saw as a training positive vs rules it never saw.
// 2. Test questions by their closest training question (cosine of the untrained base model's query vectors):
//    a big gain on near-copies only would mean leakage, not learning.
// Reads the git-ignored per-question dumps from score-trained.mjs. Prints aggregate counts only.
// Usage (from .worktrees/probe-pft): npx tsx <this file> [--key a|0.6]
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const TRAIN = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/models-probe/train";
const KEY = process.argv.includes("--key") ? process.argv[process.argv.indexOf("--key") + 1] : "a|0.6";
const sha = (t) => createHash("sha256").update(t).digest("hex").slice(0, 24);
const cases = readFileSync(`${TRAIN}/data/cases.jsonl`, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const examples = readFileSync(`${TRAIN}/data/examples.jsonl`, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const pc = (spec) => JSON.parse(readFileSync(`${TRAIN}/results/percase-${spec}-q8.json`, "utf8"))[KEY];
const P = { prod: pc("prod"), C: pc("C"), F: pc("F") };

// base-model query vectors
const meta = JSON.parse(readFileSync(`${TRAIN}/vectors/base__q8.json`, "utf8"));
const buf = readFileSync(`${TRAIN}/vectors/base__q8.f32`);
const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const vec = new Map(meta.keys.map((k, i) => [k, all.subarray(i * meta.d, (i + 1) * meta.d)]));
const dot = (a, b) => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k] * b[k]; return s; };

const seen = (arm, fold) => {
  const s = new Set(examples.map((e) => e.ruleId));
  for (const c of cases) if (c.fold !== fold && (arm === "F" || c.set === "corpus")) for (const r of c.positives) s.add(r);
  return s;
};
const SEEN = { F: [0, 1, 2, 3, 4].map((f) => seen("F", f)), C: [0, 1, 2, 3, 4].map((f) => seen("C", f)) };
const suite = cases.filter((c) => c.set === "suite");
const nn = new Map();
for (const c of suite) {
  const v = vec.get(sha(c.query));
  let best = -1;
  for (const o of suite) if (o.fold !== c.fold) { const x = dot(v, vec.get(sha(o.query))); if (x > best) best = x; }
  nn.set(c.id, best);
}
const hit = (spec, c, k) => (P[spec][`${c.set}:${c.id}`]?.[k] ?? 0) > 0;
console.log(`pipeline|weight ${KEY}; suite citations found in the top 10 (curated counted), cross-validated`);
for (const arm of ["F", "C"]) {
  const b = { seen: [0, 0, 0], unseen: [0, 0, 0] };
  for (const c of suite) c.deciding.forEach((id, k) => { const g = SEEN[arm][c.fold].has(id) ? "seen" : "unseen"; b[g][0]++; b[g][1] += hit("prod", c, k); b[g][2] += hit(arm, c, k); });
  console.log(`arm ${arm}: deciding rule seen in training: ${b.seen[0]} citations, today ${b.seen[1]} -> ${b.seen[2]}; never seen: ${b.unseen[0]} citations, today ${b.unseen[1]} -> ${b.unseen[2]}`);
}
const buckets = [[-1, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.01]];
for (const [lo, hi] of buckets) {
  const qs = suite.filter((c) => nn.get(c.id) >= lo && nn.get(c.id) < hi);
  const n = qs.reduce((s, c) => s + c.deciding.length, 0);
  const f = (spec) => qs.reduce((s, c) => s + c.deciding.filter((_, k) => hit(spec, c, k)).length, 0);
  console.log(`closest training question cosine [${lo < 0 ? "<" : lo}, ${hi > 1 ? "1" : hi}): ${qs.length} questions, ${n} citations; today ${f("prod")}, arm C ${f("C")}, arm F ${f("F")}`);
}
