// Offline, counts-only measurement of what a follow-up's prompt keeps from its opening question,
// on the committed diagnostic manifest, through this checkout's unmodified preparePromptInput.
// No network, no model, no provider. Writes nothing; prints counts only (no case text, no ids).
// Since slice B (REQ-246) a follow-up keeps its opening question's rules, so the "...Today" keys below, which
// were measured on the pre-change code at refinement (see offline-measurement.md), now report the shipped
// behavior; the `afterChange` block is the acceptance reading: follow-up equals opening in every case.
// Usage (from the repo root; see offline-measurement.md for why the resolve hook is needed):
//   node --no-warnings --import ./PRD/work/follow-ups-keep-their-rules/evidence/register.mjs \
//     ./PRD/work/follow-ups-keep-their-rules/evidence/measure-follow-up.mjs "$PWD"
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.argv[2];
const imp = (rel) => import(pathToFileURL(join(root, rel)).href);
const { buildCaseRequest, loadPromptResources } = await imp("scripts/lib/prompt-fidelity.mjs");
const { preparePromptInput, buildRetrievalQueryText, DEFAULT_SUPPLEMENTAL_RULE_CAP } = await imp("apps/backend/src/prompt/preparation.ts");
const { checkReFreeze, readFrozenVectorsOnDisk } = await imp("apps/backend/src/eval/rules-gate/frozenVectors.ts");
const { readFrozenCardVectorsOnDisk } = await imp("apps/backend/src/eval/frozenCardVectors.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");
const { selectGameRulesTopics } = await imp("apps/backend/src/gameRulesTopicSelection.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");

const PUSHBACK = "I don't think that's right. Can you check it again?";
// Combo catalog off: its source uses TypeScript syntax Node's type stripping cannot load without tsx.
// Combo context never changes which rules are selected, so the rule counts below are unaffected.
const resources = await loadPromptResources({
  env: { COMBO_ENRICHMENT_ENABLED: "false" },
  modules: {
    ...(await imp("apps/backend/src/gameRules.ts")),
    ...R,
    ...(await imp("apps/backend/src/cardRulings.ts")),
    ...(await imp("apps/backend/src/cardDetail.ts")),
    resolveBooleanEnv: () => false
  }
});
const queryVectors = readFrozenVectorsOnDisk()?.vectors ?? {};
const cardVectors = readFrozenCardVectorsOnDisk()?.vectors ?? {};

// The card list System 3 reads for a request (same as production's two branches).
function retrievalInput(request) {
  if (request.mode === "lookup") {
    const ctx = buildLookupPromptContext(request, resources.cardDetailIndex);
    return { questionText: request.question, cards: ctx.cards ?? [] };
  }
  return R.retrievalInputFromPromptContext(buildPromptContext(request, resources.cardDetailIndex));
}
function keywordSetRuleIds(request) {
  const sets = R.keywordRuleSetsForCards(retrievalInput(request).cards, resources.gameRulesRuleIndex);
  return new Set(sets.flatMap((s) => [s.ruleId, ...s.pieceIds]));
}
// In-Depth only: System 3 run on the opening question's query, but excluding the rules of the
// curated topics a follow-up's own text selects -- i.e. carrying System 3 forward without System 2.
function system3WithTopicsFrom(queryRequest, topicRequest, vector, cardEmbeddings) {
  const topicCtx = buildPromptContext(topicRequest, resources.cardDetailIndex);
  const curated = R.collectCuratedRuleIds(selectGameRulesTopics(topicCtx, resources.gameRulesTopics));
  const input = retrievalInput(queryRequest);
  const query = R.buildRetrievalQuery(input);
  const cardVecs = query.perCardTexts.flatMap((c) => (cardEmbeddings.get(c.key) ? [{ cardName: c.cardName, vector: cardEmbeddings.get(c.key) }] : []));
  return R.retrieveRulesForQuery(
    query.tokens, query.queryRuleIds, resources.gameRulesRuleIndex, curated, DEFAULT_SUPPLEMENTAL_RULE_CAP,
    undefined, vector, query.questionRuleIds, cardVecs,
    R.keywordRuleSetsForCards(input.cards, resources.gameRulesRuleIndex)
  ).map((r) => r.ruleId);
}

const casesDir = join(root, "apps/backend/src/eval/worked-solutions");
const byId = new Map();
for (const f of readdirSync(casesDir).filter((n) => n.endsWith(".case.json"))) {
  const c = JSON.parse(readFileSync(join(casesDir, f), "utf8"));
  byId.set(c.id, c);
}
const manifest = JSON.parse(readFileSync(join(root, "apps/backend/src/eval/answer-quality/manifests/diagnostic.json"), "utf8"));

const prep = (request, extra) => preparePromptInput(request, { ...resources, collectEnrichmentDebug: true, ...extra });
const ids = (p) => (p.enrichmentDebug?.supplemental?.selected ?? []).map((r) => r.ruleId);
const topics = (p) => p.enrichmentDebug?.curatedGameRules?.topicIds ?? [];
const hasPhase = (p) => p.promptText.includes("\nPHASE GUIDANCE\n");
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const mean = (xs) => (xs.length ? (sum(xs) / xs.length).toFixed(2) : "n/a");

const s = {
  cases: 0, lookup: 0, inDepth: 0, fresh: 0, notFresh: 0, semanticTurn1: 0, repeatIdentical: 0,
  historyIgnored: 0, queryTextChanged: 0, hybridTurn1: [], lexTurn1: [], lexTurn2: [], lexShared: [],
  searchTurn1: [], searchShared: [], inDepthTopicsChanged: 0, inDepthTopicsLost: 0, inDepthSystem3OnlyDiffers: 0,
  phaseTurn1: 0, phaseLost: 0,
  afterSystem3Same: 0, afterTopicsSame: 0, afterPhaseSame: 0, afterRulesSectionsSame: 0, afterQuerySame: 0
};

// The three rules sections as they print (PHASE GUIDANCE, GAME RULES (reference), ADDITIONAL RELEVANT RULE EXCERPTS).
const NEXT_HEADINGS = ["\nGENERAL GAME CONTEXT\n", "\nPHASE GUIDANCE\n", "\nGAME RULES (reference)\n", "\nADDITIONAL RELEVANT RULE EXCERPTS\n", "\nCARD (looked up)\n", "\nZONE:", "\nSCOPE\n", "\nCONVERSATION HISTORY\n", "\nQUESTION\n"];
function rulesSections(promptText) {
  return ["PHASE GUIDANCE", "GAME RULES (reference)", "ADDITIONAL RELEVANT RULE EXCERPTS"].map((heading) => {
    const start = promptText.indexOf(`\n${heading}\n`);
    if (start < 0) return "";
    const ends = NEXT_HEADINGS.map((marker) => promptText.indexOf(marker, start + 1)).filter((at) => at > start);
    return promptText.slice(start, Math.min(...ends));
  });
}

for (const entry of manifest.cases) {
  const c = byId.get(entry.id);
  const request1 = buildCaseRequest(c);
  s.cases++;
  if (request1.mode === "game") s.inDepth++; else s.lookup++;
  const history = [
    { role: "user", content: request1.question },
    { role: "assistant", content: "Placeholder answer used only to make the request a follow-up." }
  ];
  const request1WithHistory = { ...request1, conversationHistory: history };
  const request2 = { ...request1, question: PUSHBACK, conversationHistory: history };
  const idx = { cardDetailIndex: resources.cardDetailIndex };
  if (buildRetrievalQueryText(request1, idx) !== buildRetrievalQueryText(request2, idx)) s.queryTextChanged++;
  else s.afterQuerySame++;

  // Hybrid (production ranking) for the opening question, from the committed frozen vectors.
  const frozen = checkReFreeze(c.id, request1, resources.cardDetailIndex, queryVectors, cardVectors);
  if (frozen.state === "fresh") {
    s.fresh++;
    const opts = { queryEmbedding: frozen.vector, cardEmbeddings: frozen.cardEmbeddings };
    const p1 = prep(request1, opts);
    if (p1.enrichmentDebug?.supplemental?.usedSemantic) s.semanticTurn1++;
    s.hybridTurn1.push(ids(p1).length);
    // After the change: the follow-up through the shipped preparePromptInput, with the vector the route would
    // embed (the opening query's), selects the opening question's rules, topics, step guidance and sections.
    const p2 = prep(request2, opts);
    if (sameList(ids(p1), ids(p2))) s.afterSystem3Same++;
    if (request1.mode === "game" && sameList(topics(p1), topics(p2))) s.afterTopicsSame++;
    if (request1.mode !== "game" && rulesSections(p1.promptText)[0] === rulesSections(p2.promptText)[0]) s.afterPhaseSame++;
    if (sameList(rulesSections(p1.promptText), rulesSections(p2.promptText))) s.afterRulesSectionsSame++;
    if (sameList(ids(p1), ids(prep(request1, opts)))) s.repeatIdentical++;
    // Carry-forward premise: the opening question re-run with the history attached selects exactly turn 1's rules.
    if (sameList(ids(p1), ids(prep(request1WithHistory, opts)))) s.historyIgnored++;
    if (request1.mode === "game" && !sameList(ids(p1), system3WithTopicsFrom(request1, request2, frozen.vector, frozen.cardEmbeddings))) {
      s.inDepthSystem3OnlyDiffers++;
    }
  } else {
    s.notFresh++;
  }

  // Today's follow-up, keyword half only (no vector exists for the follow-up text offline).
  const l1 = prep(request1, { queryEmbedding: null });
  const l2 = prep(request2, { queryEmbedding: null });
  const a = ids(l1), b = ids(l2);
  s.lexTurn1.push(a.length);
  s.lexTurn2.push(b.length);
  s.lexShared.push(b.filter((x) => a.includes(x)).length);
  const kw = keywordSetRuleIds(request1);
  const a2 = a.filter((x) => !kw.has(x)), b2 = b.filter((x) => !kw.has(x));
  s.searchTurn1.push(a2.length);
  s.searchShared.push(b2.filter((x) => a2.includes(x)).length);
  if (request1.mode === "game") {
    if (!sameList(topics(l1), topics(l2))) s.inDepthTopicsChanged++;
    s.inDepthTopicsLost += topics(l1).filter((t) => !topics(l2).includes(t)).length;
  } else {
    if (hasPhase(l1)) s.phaseTurn1++;
    if (hasPhase(l1) && !hasPhase(l2)) s.phaseLost++;
  }
}

console.log(JSON.stringify({
  cases: s.cases, lookup: s.lookup, inDepth: s.inDepth,
  frozenVectorFresh: s.fresh, frozenVectorNotFresh: s.notFresh, semanticTurn1: s.semanticTurn1,
  hybridTurn1SelectedMean: mean(s.hybridTurn1), hybridTurn1SelectedMin: Math.min(...s.hybridTurn1), hybridTurn1SelectedMax: Math.max(...s.hybridTurn1),
  hybridRepeatIdentical: `${s.repeatIdentical}/${s.fresh}`,
  openingQuestionWithHistorySelectsTurn1Rules: `${s.historyIgnored}/${s.fresh}`,
  followUpQueryTextDiffersToday: `${s.queryTextChanged}/${s.cases}`,
  keywordHalfToday_allSelected: {
    turn1Total: sum(s.lexTurn1), turn2Total: sum(s.lexTurn2), sharedTotal: sum(s.lexShared), sharedMean: mean(s.lexShared),
    casesKeepingAll: s.lexShared.filter((x, i) => x === s.lexTurn1[i]).length
  },
  keywordHalfToday_searchExcerptsOnly: {
    turn1Total: sum(s.searchTurn1), sharedTotal: sum(s.searchShared), turn1Mean: mean(s.searchTurn1), sharedMean: mean(s.searchShared),
    casesKeepingAll: s.searchShared.filter((x, i) => x === s.searchTurn1[i]).length,
    casesKeepingNone: s.searchShared.filter((x, i) => x === 0 && s.searchTurn1[i] > 0).length
  },
  inDepthCuratedTopicsChangedOnFollowUpToday: `${s.inDepthTopicsChanged}/${s.inDepth}`,
  inDepthCuratedTopicsLostOnFollowUpToday: s.inDepthTopicsLost,
  inDepthSystem3CarriedWithoutSystem2DiffersFromTurn1: `${s.inDepthSystem3OnlyDiffers}/${s.inDepth}`,
  lookupPhaseGuidance: { presentTurn1: s.phaseTurn1, lostOnFollowUpToday: s.phaseLost },
  afterChange: {
    system3SelectionEqualsOpening: `${s.afterSystem3Same}/${s.fresh}`,
    inDepthCuratedTopicsEqualOpening: `${s.afterTopicsSame}/${s.inDepth}`,
    lookupPhaseGuidanceEqualsOpening: `${s.afterPhaseSame}/${s.lookup}`,
    threeRulesSectionsByteIdentical: `${s.afterRulesSectionsSame}/${s.fresh}`,
    retrievalQueryTextEqualsOpening: `${s.afterQuerySame}/${s.cases}`
  }
}, null, 2));
