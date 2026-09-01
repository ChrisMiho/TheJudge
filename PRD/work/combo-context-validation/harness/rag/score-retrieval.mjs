// Score retrieval methods on the labeled benchmark, under two query conditions:
//   clean     — the rules question alone
//   polluted  — question + 3 random cards' oracle text (simulates a multi-card
//               combo lookup, the condition where the combo pilot saw drift)
// Methods: lexical (production TF-IDF) and semantic (embedding cosine).
// Reports recall@5 and MRR for each method × condition. Embeddings only (no chat).
//
//   npx tsx rag/score-retrieval.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { loadEnv, cosine, makeLexicalRetriever, REPO } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EMB = JSON.parse(readFileSync(resolve(HERE, "rule-embeddings.json"), "utf8"));
const BENCH = JSON.parse(readFileSync(resolve(HERE, "benchmark.json"), "utf8"));
const CARD_METADATA = resolve(REPO, "apps/frontend/public/data/cardMetadata.json");
const K = 5;

const stem = (id) => id.replace(/[a-z]$/i, "");
const rankOf = (hits, exp) => { const i = hits.findIndex((h) => stem(h) === stem(exp)); return i === -1 ? 0 : i + 1; };

function semanticFromEmbedding(q) {
  return EMB.vectors.map((v, i) => ({ ruleId: EMB.ruleIds[i], s: cosine(q, v) }))
    .sort((a, b) => b.s - a.s).slice(0, K).map((r) => r.ruleId);
}

async function main() {
  const lexical = await makeLexicalRetriever();
  const client = new OpenAI({ apiKey: (loadEnv().OPENAI_API_KEY || "").trim(), maxRetries: 6 });

  // Pollution: 3 fixed random card oracle texts (deterministic), ~the multi-card query.
  const meta = JSON.parse(readFileSync(CARD_METADATA, "utf8"));
  const pollutionCards = [meta[1000], meta[9000], meta[20000]].map((c) => `${c.oracleText} ${c.typeLine}`);
  const pollute = (q) => `${q} ${pollutionCards.join(" ")}`;

  const items = BENCH.items;
  // Batch-embed all queries (clean + polluted) for semantic.
  const queries = items.flatMap((it) => [it.question, pollute(it.question)]);
  const embs = [];
  for (let i = 0; i < queries.length; i += 200) {
    const resp = await client.embeddings.create({ model: EMB.model, input: queries.slice(i, i + 200) });
    resp.data.forEach((d) => embs.push(d.embedding));
    console.log(`  embedded queries ${Math.min(i + 200, queries.length)}/${queries.length}`);
  }

  const agg = { lex_clean: [], sem_clean: [], lex_poll: [], sem_poll: [] };
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], exp = it.expectedRuleId;
    const lexClean = await lexical(it.question, K);
    const lexPoll = await lexical(pollute(it.question), K);
    const semClean = semanticFromEmbedding(embs[i * 2]);
    const semPoll = semanticFromEmbedding(embs[i * 2 + 1]);
    const r = { lex_clean: rankOf(lexClean, exp), sem_clean: rankOf(semClean, exp), lex_poll: rankOf(lexPoll, exp), sem_poll: rankOf(semPoll, exp) };
    for (const k of Object.keys(agg)) agg[k].push(r[k]);
    rows.push({ expectedRuleId: exp, source: it.source, ranks: r });
  }

  const recall = (ranks) => ranks.filter((x) => x > 0).length / ranks.length;
  const mrr = (ranks) => ranks.reduce((s, x) => s + (x > 0 ? 1 / x : 0), 0) / ranks.length;
  const summary = {};
  for (const k of Object.keys(agg)) summary[k] = { recall5: +recall(agg[k]).toFixed(3), mrr: +mrr(agg[k]).toFixed(3) };

  writeFileSync(resolve(HERE, "retrieval-scores.json"), JSON.stringify({ n: items.length, summary, rows }, null, 2));
  console.log(`\n=== RETRIEVAL SCORES (n=${items.length}, recall@${K} / MRR) ===`);
  console.log(`  lexical  clean:     recall ${summary.lex_clean.recall5}  mrr ${summary.lex_clean.mrr}`);
  console.log(`  semantic clean:     recall ${summary.sem_clean.recall5}  mrr ${summary.sem_clean.mrr}`);
  console.log(`  lexical  polluted:  recall ${summary.lex_poll.recall5}  mrr ${summary.lex_poll.mrr}`);
  console.log(`  semantic polluted:  recall ${summary.sem_poll.recall5}  mrr ${summary.sem_poll.mrr}`);
  console.log(`\nPollution degradation (recall drop): lexical ${(summary.lex_clean.recall5 - summary.lex_poll.recall5).toFixed(3)}, semantic ${(summary.sem_clean.recall5 - summary.sem_poll.recall5).toFixed(3)}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
