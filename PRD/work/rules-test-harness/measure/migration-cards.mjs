// Scratch measurement for the rules-test-harness DESIGN-BRIEF (define node,
// attempt 2, 2026-10-06; gate-qc finding 3). Does migrating the 18 gold cases
// to format v2 with an explicit `cards` list move today's 16/18 baseline?
//
// Runs the same path as `npm run eval:worked-solutions` (shared loader,
// production `preparePromptInput`, question embedded by EMBEDDING_PROVIDER,
// default `local`), but builds each request from a proposed `cards` list
// instead of today's tier-2-only `buildCaseRequest`. Committed data plus the
// gitignored local model cache only; no network, no provider call. Refuses a
// lexical pass under a real embedder, like the shipped check.
//
//   npx tsx PRD/work/rules-test-harness/measure/migration-cards.mjs
import { readFileSync } from "node:fs";
import { loadGoldCases } from "../../../../scripts/lib/gold-cases.mjs";
import { buildEmbedder, describeRetrieval, loadPromptResources, assertQueryEmbedded } from "../../../../scripts/lib/prompt-fidelity.mjs";

const root = new URL("../../../../", import.meta.url).pathname;
const names = JSON.parse(readFileSync(root + "apps/frontend/public/data/cardMetadata.json", "utf8"));
const oracleIdByName = new Map(names.map((c) => [c.name, c.cardId]));

// Variant "today": exactly buildCaseRequest's behavior (tier 2 cited card only).
// Variant "named": every real card the question names, by name lookup.
// The only tier-1 question naming a real card is the token case (Tarmogoyf);
// the other 14 tier-1 questions describe hypothetical cards.
const NAMED_EXTRA = { "token-created-by-name-uses-oracle-card": ["Tarmogoyf"] };

function cardsFor(caseEntry, variant) {
  const list = [];
  if (caseEntry.tier === 2) list.push({ cardId: caseEntry.source.oracleId, name: caseEntry.source.cardName });
  if (variant === "named") {
    for (const name of NAMED_EXTRA[caseEntry.id] ?? []) {
      const cardId = oracleIdByName.get(name);
      if (!cardId) throw new Error(`no oracle id for ${name}`);
      list.push({ cardId, name });
    }
  }
  return list;
}

const { preparePromptInput, buildRetrievalQueryText } = await import(root + "apps/backend/src/prompt/preparation.ts");
const resources = await loadPromptResources();
const embedder = await buildEmbedder(process.env);
const cases = await loadGoldCases();

for (const variant of ["today", "named"]) {
  let allHit = 0;
  let someHit = 0;
  const misses = [];
  const cardCheck = [];
  for (const c of cases) {
    const cards = cardsFor(c, variant);
    const request = { mode: "lookup", question: c.question, ...(cards.length ? { cards } : {}) };
    const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
    assertQueryEmbedded({ mode: embedder.mode, vector, caseId: c.id });
    const prepared = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true });
    const r = describeRetrieval(prepared.enrichmentDebug?.supplemental, c.expectedSupplementalRuleIds, {
      requireSemantic: embedder.mode !== "mock",
      caseId: c.id
    });
    const selected = new Set(r.selectedRuleIds);
    const all = c.expectedSupplementalRuleIds.every((id) => selected.has(id));
    if (all) allHit++;
    else misses.push(c.id);
    if (r.goldRuleInPrompt) someHit++;
    for (const card of cards) {
      const detail = resources.cardDetailIndex.get(card.cardId);
      const rulings = resources.cardRulingsIndex.get(card.cardId) ?? [];
      const oracleIn = Boolean(detail?.oracleText) && prepared.promptText.includes(detail.oracleText.split("\n")[0]);
      const rulingsIn = rulings.filter((x) => prepared.promptText.includes(x.comment)).length;
      cardCheck.push(`${c.id}: ${card.name} oracle=${oracleIn} rulings=${rulingsIn}/${rulings.length}`);
    }
  }
  console.log(`[${variant}] provider=${embedder.mode} all-expected-hit=${allHit}/${cases.length} some-expected-hit=${someHit}/${cases.length} misses=${JSON.stringify(misses)}`);
  for (const line of cardCheck) console.log(`  card check ${line}`);
}
