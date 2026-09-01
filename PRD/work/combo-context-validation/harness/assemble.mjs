// Combo-context-validation — assemble prompts + retrieval debug (FREE, no model calls).
//
// For each selected case, hydrate its cards from the local card-metadata lookup
// (real oracle text — same shape the production client sends), build the real
// mode:"lookup" request, and run the PRODUCTION prompt pipeline with the full
// index set plus collectEnrichmentDebug. Captures the exact assembled prompt and
// the retrieval-diagnosis surface (which supplemental rules were retrieved, which
// card rulings resolved, whether the combo section fired). Also prints a dry-run
// token/cost estimate for the live answer leg. NO provider calls happen here.
//
// Run via tsx (resolves the backend TS loaders):
//   npx tsx PRD/work/combo-context-validation/harness/assemble.mjs

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const CARD_METADATA = resolve(REPO, "apps/frontend/public/data/cardMetadata.json");
const argVal = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : d; };
const CASES = resolve(HERE, argVal("--cases", "cases.json"));
const QUESTION = "How do these cards combo together?";
// --no-combo ablates the combo-enrichment section (comboCatalog omitted) to test
// whether System 3 rules retrieval + attached card text carry the answer alone.
const ABLATE_COMBO = process.argv.includes("--no-combo");
const OUT = resolve(HERE, argVal("--out", ABLATE_COMBO ? "assembled-ablation.json" : "assembled.json"));

// gpt-4.1 list price per 1M tokens (verify against current pricing before scaling).
const GPT41_INPUT_PER_M = 2.0;
const GPT41_OUTPUT_PER_M = 8.0;
const GPT41_MINI_INPUT_PER_M = 0.4;
const GPT41_MINI_OUTPUT_PER_M = 1.6;
const ASSUMED_ANSWER_TOKENS = 700;   // model's combo explanation
const ASSUMED_JUDGE_IN = 2000;       // judge sees answer + ground truth
const ASSUMED_JUDGE_OUT = 300;

const estTokens = (s) => Math.ceil(s.length / 4); // rough; padded in the estimate

async function main() {
  const { loadCardRulingsIndex } = await import(`${REPO}/apps/backend/src/cardRulings.ts`);
  const { loadGameRulesTopics } = await import(`${REPO}/apps/backend/src/gameRules.ts`);
  const { loadGameRulesRuleIndex } = await import(`${REPO}/apps/backend/src/gameRulesRetrieval.ts`);
  const { loadComboCatalog } = await import(`${REPO}/apps/backend/src/commanderSpellbook/catalog.ts`);
  const { preparePromptInput } = await import(`${REPO}/apps/backend/src/prompt/preparation.ts`);

  console.log("Loading production indexes...");
  const cardRulingsIndex = loadCardRulingsIndex(resolve(REPO, "apps/backend/data/cardRulingsByOracleId.json"));
  const gameRulesTopics = loadGameRulesTopics(resolve(REPO, "apps/backend/data/gameRulesByTopic.json"));
  const gameRulesRuleIndex = loadGameRulesRuleIndex(resolve(REPO, "apps/backend/data/gameRulesRuleIndex.json"));
  const comboCatalog = loadComboCatalog(
    resolve(REPO, "apps/backend/data/commanderSpellbookCombos.json.gz"),
    resolve(REPO, "apps/backend/data/commanderSpellbookComboIndex.json.gz")
  );
  const options = { cardRulingsIndex, gameRulesTopics, gameRulesRuleIndex, comboCatalog: ABLATE_COMBO ? undefined : comboCatalog, collectEnrichmentDebug: true };
  if (ABLATE_COMBO) console.log("ABLATION: combo enrichment OFF (comboCatalog omitted).");

  const meta = JSON.parse(await readFile(CARD_METADATA, "utf8"));
  const byId = new Map(meta.map((c) => [c.cardId, c]));
  const byName = new Map(meta.map((c) => [c.name, c]));
  const { cases } = JSON.parse(await readFile(CASES, "utf8"));

  const assembled = [];
  let totalInputTokens = 0;
  for (const c of cases) {
    const cards = c.cardIds.map((id, i) => {
      const m = byId.get(id) ?? byName.get(c.cardNames[i]);
      // Pass exactly the client-shaped card reference.
      return {
        cardId: m.cardId, name: m.name, oracleText: m.oracleText, imageUrl: m.imageUrl ?? "",
        manaCost: m.manaCost ?? "", manaValue: m.manaValue ?? 0, typeLine: m.typeLine ?? "",
        colors: m.colors ?? [], supertypes: m.supertypes ?? [], subtypes: m.subtypes ?? []
      };
    });
    const request = { mode: "lookup", question: QUESTION, cards };
    const prepared = preparePromptInput(request, options);
    const dbg = prepared.enrichmentDebug;
    const inputTokens = estTokens(prepared.promptText);
    totalInputTokens += inputTokens;

    assembled.push({
      caseId: c.caseId, variantId: c.variantId, band: c.band, popularity: c.popularity,
      scenario: c.scenario ?? "complete", droppedCard: c.droppedCard, templateNames: c.templateNames,
      cardNames: c.cardNames,
      groundTruth: c.groundTruth,
      request,
      promptText: prepared.promptText,
      promptChars: prepared.promptText.length,
      estInputTokens: inputTokens,
      diagnosis: {
        comboSectionChars: prepared.diagnostics?.comboSectionChars ?? 0,
        comboSectionPresent: (prepared.diagnostics?.comboSectionChars ?? 0) > 0,
        supplementalRulesRetrieved: (dbg?.supplemental?.selected ?? []).map((r) => ({ ruleId: r.ruleId, title: r.sectionTitle, score: r.score })),
        supplementalRunnerUp: (dbg?.supplemental?.runnerUp ?? []).map((r) => r.ruleId),
        supplementalCandidatesScored: dbg?.supplemental?.candidatesScored ?? 0,
        supplementalQueryText: dbg?.supplemental?.queryText ?? "",
        rulingsIncluded: (dbg?.rulings?.cardsIncluded ?? []).map((c2) => ({ name: c2.name, rulingCount: c2.rulingCount })),
        rulingsSkippedNoMatch: (dbg?.rulings?.cardsSkippedNoMatch ?? []).map((c2) => c2.name),
        curatedTopics: (dbg?.curatedGameRules?.topics ?? []).map((t) => t.title)
      }
    });
  }

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), question: QUESTION, cases: assembled }, null, 2));

  // ---- Dry-run cost estimate (no calls made) ----
  const n = assembled.length;
  const answerIn = totalInputTokens;
  const answerOut = n * ASSUMED_ANSWER_TOKENS;
  const answerCost = (answerIn / 1e6) * GPT41_INPUT_PER_M + (answerOut / 1e6) * GPT41_OUTPUT_PER_M;
  const judgeIn = n * ASSUMED_JUDGE_IN;
  const judgeOut = n * ASSUMED_JUDGE_OUT;
  const judgeCost = (judgeIn / 1e6) * GPT41_MINI_INPUT_PER_M + (judgeOut / 1e6) * GPT41_MINI_OUTPUT_PER_M;
  const total = answerCost + judgeCost;
  const padded = total * 1.2; // token-heuristic + output-variance margin

  const comboFired = assembled.filter((a) => a.diagnosis.comboSectionPresent).length;
  const avgIn = Math.round(answerIn / n);

  console.log(`\nWrote assembled prompts + diagnosis to ${OUT}`);
  console.log(`\n=== ASSEMBLY SANITY ===`);
  console.log(`  cases: ${n}   combo section fired: ${comboFired}/${n}   avg input tokens: ${avgIn}`);
  console.log(`\n=== DRY-RUN COST ESTIMATE (no provider calls made) ===`);
  console.log(`  Answer leg  (gpt-4.1):      ~${answerIn} in + ~${answerOut} out  -> $${answerCost.toFixed(4)}`);
  console.log(`  Judge leg   (gpt-4.1-mini): ~${judgeIn} in + ~${judgeOut} out  -> $${judgeCost.toFixed(4)}`);
  console.log(`  Raw total:   $${total.toFixed(4)}`);
  console.log(`  Padded ~20%: $${padded.toFixed(4)}   (token counts are chars/4 heuristic)`);
  console.log(`\n  Under the $5 pilot ceiling: ${padded < 5 ? "YES" : "NO"}.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
