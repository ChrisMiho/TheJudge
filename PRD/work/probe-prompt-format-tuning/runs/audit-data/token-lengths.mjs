// Counts real word pieces (all-MiniLM-L6-v2 tokenizer, local files only, no network)
// for every rule-index embedding text, exactly as build-rule-embeddings.mjs builds it.
// Run from repo root: node PRD/work/probe-prompt-format-tuning/runs/audit-data/token-lengths.mjs
import fs from "node:fs";
import path from "node:path";
import { env, AutoTokenizer } from "@huggingface/transformers";

env.allowRemoteModels = false;
env.cacheDir = path.resolve("apps/backend/data/models");
const tok = await AutoTokenizer.from_pretrained("Xenova/all-MiniLM-L6-v2");
console.log("model_max_length", tok.model_max_length);
const index = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesRuleIndex.json", "utf8"));
const embText = (e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000);
const rows = index.map((e) => {
  const full = `${e.sectionTitle}: ${e.text}`;
  const n = tok.encode(embText(e)).length; // includes [CLS] and [SEP]
  const nFull = tok.encode(full).length;
  const ruleOnly = e.text.split("\nExample:")[0];
  const nRule = tok.encode(`${e.sectionTitle}: ${ruleOnly}`).length;
  return { id: e.ruleId, tokens: n, tokensUncut: nFull, tokensWithoutExamples: nRule };
});
const sorted = [...rows].sort((a, b) => a.tokens - b.tokens);
const q = (p) => sorted[Math.floor((sorted.length - 1) * p)].tokens;
const over = (k) => rows.filter((r) => r.tokens > k).length;
const out = {
  modelMaxLength: tok.model_max_length,
  median: q(0.5), p90: q(0.9), p99: q(0.99), max: sorted.at(-1),
  over128: over(128), over256: over(256), over512: over(512),
  over256List: rows.filter((r) => r.tokens > 256).sort((a, b) => b.tokens - a.tokens),
  rulePartOver256: rows.filter((r) => r.tokensWithoutExamples > 256).map((r) => r.id),
  over256OnlyBecauseOfExamples: rows.filter((r) => r.tokens > 256 && r.tokensWithoutExamples <= 256).length,
  tokensLostTo2000CharCut: rows.filter((r) => r.tokensUncut > r.tokens).map((r) => ({ id: r.id, uncut: r.tokensUncut, cut: r.tokens }))
};
fs.mkdirSync(path.resolve("PRD/work/probe-prompt-format-tuning/runs/audit-data/out"), { recursive: true });
fs.writeFileSync(path.resolve("PRD/work/probe-prompt-format-tuning/runs/audit-data/out/token-lengths.json"), JSON.stringify({ summary: out, rows }, null, 1));
console.log(JSON.stringify(out, null, 1));
