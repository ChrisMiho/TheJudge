import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { loadCardRulingsIndex } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/cardRulings.ts";
import { loadCardDetailIndex } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/cardDetail.ts";
import { loadCardPrintingPricesIndex } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/cardPrices.ts";
import { loadGameRulesTopics } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/gameRules.ts";
import { loadGameRulesRuleIndex } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/gameRulesRetrieval.ts";
import { loadComboCatalog } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/commanderSpellbook/catalog.ts";
import { createConfiguredApp } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/runtime/createConfiguredApp.ts";
import { readServerConfig } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/config/index.ts";
import { createEmbeddingProvider } from "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/src/providers/createEmbeddingProvider.ts";

const root = "/Users/chrismiho/Coding/Projects/TheJudge";
const data = (f: string) => resolve(root, "apps/backend/data", f);
const mb = (b: number) => (b / 1048576).toFixed(0) + "MB";

function timed<T>(label: string, fn: () => T): T {
  const rss0 = process.memoryUsage().rss;
  const t0 = performance.now();
  const out = fn();
  const ms = performance.now() - t0;
  const rss1 = process.memoryUsage().rss;
  console.log(`${label.padEnd(36)} ${ms.toFixed(0).padStart(6)} ms   rss +${mb(rss1 - rss0)} (now ${mb(rss1)})`);
  return out;
}

console.log("== individual loaders (laptop; Lambda 512MB has a much slower CPU slice) ==");
timed("cardRulings (raw JSON 18.6MB)", () => loadCardRulingsIndex(data("cardRulingsByOracleId.json")));
timed("cardDetail (raw JSON 12.7MB)", () => loadCardDetailIndex(data("cardDetailByOracleId.json")));
timed("cardPrices (gzip -> 16MB)", () => loadCardPrintingPricesIndex(data("cardPrintingPricesByOracleId.json.gz")));
timed("gameRulesTopics", () => loadGameRulesTopics(data("gameRulesByTopic.json")));
timed("gameRulesRuleIndex", () => loadGameRulesRuleIndex(data("gameRulesRuleIndex.json")));
timed("comboCatalog (index gzip -> 24MB)", () =>
  loadComboCatalog(data("commanderSpellbookCombos.json.gz"), data("commanderSpellbookComboIndex.json.gz"))
);

console.log("\n== whole createConfiguredApp (sync part) ==");
const base = { ...process.env, ASK_AI_PROVIDER: "mock", NODE_ENV: "production" } as NodeJS.ProcessEnv;
timed("createConfiguredApp EMBEDDING=mock", () => createConfiguredApp(root, { ...base, EMBEDDING_PROVIDER: "mock" }));
timed("createConfiguredApp EMBEDDING=local", () => createConfiguredApp(root, { ...base, EMBEDDING_PROVIDER: "local" }));

console.log("\n== local embedder (model load happens on first embed) ==");
const cfg = readServerConfig({ ...base, EMBEDDING_PROVIDER: "local" });
const provider = createEmbeddingProvider(cfg);
let t = performance.now();
const v1 = await provider.embed("Does Panharmonicon double a triggered ability?");
console.log(`first embed (ONNX runtime + model load + infer) ${(performance.now() - t).toFixed(0)} ms, dims ${v1?.length}, rss now ${mb(process.memoryUsage().rss)}`);
t = performance.now();
await provider.embed("second query");
console.log(`second embed ${(performance.now() - t).toFixed(0)} ms`);
