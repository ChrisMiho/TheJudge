// REQ-236: where does the cross-validated gain come from? Owner-run, local, free (no API call, no LLM).
//   1. Deciding rules the fold model saw as a training positive vs rules it never saw.
//   2. Test questions by their closest training question (cosine of the UNTRAINED base model's query
//      vectors): a big gain on near-copies only would mean leakage, not learning.
// Reads the git-ignored training data and per-question results; prints aggregate counts only (no question
// text, ids, answers or cards).
//
//   npx tsx scripts/leak-check.mjs [--data output/rule-search-model/data] [--before output/rule-search-eval/percase-before.json] [--after output/rule-search-eval/percase-cv.json]
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const DATA = resolve(arg("--data", join(repoRoot, "output/rule-search-model/data")));
const BEFORE = resolve(arg("--before", join(repoRoot, "output/rule-search-eval/percase-before.json")));
const AFTER = resolve(arg("--after", join(repoRoot, "output/rule-search-eval/percase-cv.json")));

const jsonl = (file) =>
  readFileSync(join(DATA, file), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
const cases = jsonl("cases.jsonl");
const examples = jsonl("examples.jsonl");
const before = JSON.parse(readFileSync(BEFORE, "utf8"));
const after = JSON.parse(readFileSync(AFTER, "utf8"));

// The untrained base model's query vectors: the bundled stock model, loaded from its own folder.
const hf = await import("@huggingface/transformers");
hf.env.allowRemoteModels = false;
hf.env.cacheDir = join(repoRoot, "apps/backend/data/models");
const extractor = await hf.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
const suite = cases.filter((c) => c.set === "suite");
const vectorOf = new Map();
for (const c of suite) vectorOf.set(c.id, Array.from((await extractor(c.query, { pooling: "mean", normalize: true })).data));
await extractor.dispose?.();

const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const seenRules = (fold) => {
  const seen = new Set(examples.map((e) => e.ruleId));
  for (const c of cases) if (c.fold !== fold) for (const rule of c.positives) seen.add(rule);
  return seen;
};
const SEEN = [0, 1, 2, 3, 4].map(seenRules);
const nearest = new Map();
for (const c of suite) {
  let best = -1;
  for (const other of suite) if (other.fold !== c.fold) best = Math.max(best, dot(vectorOf.get(c.id), vectorOf.get(other.id)));
  nearest.set(c.id, best);
}
const found = (results, c, k) => (results[`suite:${c.id}`]?.[k] ?? 0) > 0;

const seen = { citations: 0, before: 0, after: 0 };
const unseen = { citations: 0, before: 0, after: 0 };
for (const c of suite) {
  c.deciding.forEach((rule, k) => {
    const bucket = SEEN[c.fold].has(rule) ? seen : unseen;
    bucket.citations++;
    bucket.before += found(before, c, k);
    bucket.after += found(after, c, k);
  });
}
console.log(`suite citations found in the top 10 (curated counted), cross-validated, trained model vs before`);
console.log(`deciding rule seen in training: ${seen.citations} citations, ${seen.before} -> ${seen.after}; never seen: ${unseen.citations} citations, ${unseen.before} -> ${unseen.after}`);
for (const [lo, hi] of [[-1, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.01]]) {
  const bucket = suite.filter((c) => nearest.get(c.id) >= lo && nearest.get(c.id) < hi);
  const citations = bucket.reduce((sum, c) => sum + c.deciding.length, 0);
  const count = (results) => bucket.reduce((sum, c) => sum + c.deciding.filter((_, k) => found(results, c, k)).length, 0);
  console.log(`closest training question cosine [${lo < 0 ? "<" : lo}, ${hi > 1 ? "1" : hi}): ${bucket.length} questions, ${citations} citations; before ${count(before)}, trained ${count(after)}`);
}

