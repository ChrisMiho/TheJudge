// Build a labeled retrieval benchmark: pick real CR rules, generate a natural
// rules question whose answer is that rule (grounded, via gpt-4.1-mini), pairing
// question -> expectedRuleId. Plus the 6 gold worked-solution cases as an anchor.
// Resumable cache. Costs a little (mini). Sequential + retries.
//
//   npx tsx rag/build-benchmark.mjs [--n 150] [--confirm]

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { loadEnv, loadRuleIndex, REPO } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WS_DIR = resolve(REPO, "apps/backend/src/eval/worked-solutions");
const OUT = resolve(HERE, "benchmark.json");
const CACHE = resolve(HERE, ".benchmark-cache.json");
const MODEL = "gpt-4.1-mini";

const argN = () => { const i = process.argv.indexOf("--n"); return i !== -1 ? Number(process.argv[i + 1]) : 150; };
function mulberry32(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function genPrompt(rule) {
  return [
    "You write realistic Magic: The Gathering rules questions a player would ask a judge.",
    "Given this Comprehensive Rules entry, write ONE natural question that a player would ask, whose answer is governed by THIS rule.",
    "Do NOT mention the rule number. Do NOT quote the rule verbatim. Phrase it as a real in-game situation or confusion.",
    `RULE ${rule.ruleId} (${rule.sectionTitle}): ${rule.text}`,
    'Respond with ONLY the question text, one sentence or two.'
  ].join("\n");
}

async function main() {
  const n = argN(), confirm = process.argv.includes("--confirm");
  const index = loadRuleIndex();
  // Good targets: leaf-ish rules with substantive prose, not section headers.
  const candidates = index.filter((r) => /\d\.\d/.test(r.ruleId) && r.text.length > 80 && !/^\d[\d.]*\.?\s*[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(r.text.trim()));
  const rng = mulberry32(7);
  const shuffled = candidates.map((v) => [rng(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const targets = shuffled.slice(0, n);
  console.log(`Candidate rules: ${candidates.length}. Generating ${targets.length} synthetic questions on ${MODEL}.`);
  console.log(`Rough cost: ~$${(targets.length * (400 * 0.4 + 40 * 1.6) / 1e6).toFixed(4)}.`);
  if (!confirm) { console.log("Dry run. Re-run with --confirm."); return; }

  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const client = new OpenAI({ apiKey: (loadEnv().OPENAI_API_KEY || "").trim(), maxRetries: 8, timeout: 60000 });
  for (const r of targets) {
    if (cache[r.ruleId]) continue;
    try {
      const resp = await client.responses.create({ model: MODEL, input: genPrompt(r) });
      cache[r.ruleId] = { question: (resp.output_text || "").trim().replace(/^"|"$/g, ""), sectionTitle: r.sectionTitle };
      writeFileSync(CACHE, JSON.stringify(cache));
    } catch (e) { console.error(`  ${r.ruleId} gen failed: ${e.message?.slice(0, 80)}`); }
  }

  const synthetic = targets.filter((r) => cache[r.ruleId]?.question).map((r) => ({
    question: cache[r.ruleId].question, expectedRuleId: r.ruleId, sectionTitle: cache[r.ruleId].sectionTitle, source: "synthetic"
  }));
  const gold = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json"))
    .map((f) => JSON.parse(readFileSync(resolve(WS_DIR, f), "utf8")))
    .map((c) => ({ question: c.question, expectedRuleId: c.expectedSupplementalRuleIds[0], sectionTitle: "gold", source: "gold" }));

  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), items: [...gold, ...synthetic] }, null, 2));
  console.log(`Wrote ${gold.length} gold + ${synthetic.length} synthetic = ${gold.length + synthetic.length} benchmark items to ${OUT}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
