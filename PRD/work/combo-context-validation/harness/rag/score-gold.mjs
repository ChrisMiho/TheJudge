// Quick signal: score lexical vs semantic retrieval on the 6 gold worked-solution
// cases (real human-labeled query -> expected rule). Embeddings only (no chat calls),
// so safe to run alongside the combo batch.
//
//   npx tsx rag/score-gold.mjs

import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { loadEnv, cosine, makeLexicalRetriever, loadRuleIndex, REPO } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WS_DIR = resolve(REPO, "apps/backend/src/eval/worked-solutions");
const EMB = JSON.parse(readFileSync(resolve(HERE, "rule-embeddings.json"), "utf8"));

function semanticRetriever(client) {
  return async (question, k = 5) => {
    const resp = await client.embeddings.create({ model: EMB.model, input: question });
    const q = resp.data[0].embedding;
    return EMB.vectors
      .map((v, i) => ({ ruleId: EMB.ruleIds[i], s: cosine(q, v) }))
      .sort((a, b) => b.s - a.s).slice(0, k).map((r) => r.ruleId);
  };
}

// Is expected id "covered" by a hit? Count an exact match OR a parent/child rule
// (same rule number stem), since 613.9 vs 613.9a are the same concept.
const stem = (id) => id.replace(/[a-z]$/i, "");
const covers = (hits, expected) => hits.some((h) => stem(h) === stem(expected) || h === expected);

async function main() {
  const cases = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json"))
    .map((f) => JSON.parse(readFileSync(resolve(WS_DIR, f), "utf8")));
  const lexical = await makeLexicalRetriever();
  const client = new OpenAI({ apiKey: (loadEnv().OPENAI_API_KEY || "").trim(), maxRetries: 6 });
  const semantic = semanticRetriever(client);

  let lexHit = 0, semHit = 0;
  console.log("Gold worked-solution cases (expected rule must appear in top-5):\n");
  for (const c of cases) {
    const exp = c.expectedSupplementalRuleIds[0];
    const lex = await lexical(c.question, 5);
    const sem = await semantic(c.question, 5);
    const lOk = covers(lex, exp), sOk = covers(sem, exp);
    if (lOk) lexHit++; if (sOk) semHit++;
    console.log(`${c.id}`);
    console.log(`  expected ${exp}`);
    console.log(`  lexical  ${lOk ? "HIT " : "miss"} [${lex.join(", ")}]`);
    console.log(`  semantic ${sOk ? "HIT " : "miss"} [${sem.join(", ")}]`);
  }
  console.log(`\nRecall@5 — lexical ${lexHit}/${cases.length}, semantic ${semHit}/${cases.length}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
