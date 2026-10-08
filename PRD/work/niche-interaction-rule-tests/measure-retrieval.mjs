// Define-node measurement for niche-interaction-rule-tests (graph-20261006-150550).
//
// Asks the tester's two verbatim Quick Lookup questions through the same
// offline path `npm run eval:worked-solutions` uses (scripts/lib/prompt-fidelity.mjs
// + preparePromptInput, production cap), with and without the named cards
// attached, and prints what reaches the prompt: the always-on curated topics'
// rule ids, the System 3 top-N (selected) and the runners-up, plus whether each
// candidate rule is in the prompt and at what System 3 rank.
//
// No network, no live model call. Run from the repo root:
//   npx tsx PRD/work/niche-interaction-rule-tests/measure-retrieval.mjs
//   EMBEDDING_PROVIDER=mock npx tsx PRD/work/niche-interaction-rule-tests/measure-retrieval.mjs
import { buildEmbedder, loadPromptResources } from "../../../scripts/lib/prompt-fidelity.mjs";

const CARDS = {
  manufactor: { cardId: "f36d1d8b-8303-44a9-ab56-531931641ea2", name: "Academy Manufactor" },
  esix: { cardId: "9d22960b-babc-4cf3-b228-d32e13bc6014", name: "Esix, Fractal Bloom" },
  silence: { cardId: "8aed54cb-d1bb-45ad-adbe-38e55d84ff31", name: "Silence" },
  necro: { cardId: "94a844d2-0574-45a7-b347-e0e329767c42", name: "Necropotence" },
  borne: { cardId: "ce19962d-94f9-4b2b-b668-963c0acce308", name: "Borne Upon a Wind" }
};

const Q1 = "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?";
const Q2 =
  "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?";

const CANDIDATES_Q1 = ["616.1", "616.1e", "616.1f", "616.2", "614.5", "614.1a", "614.6", "111.10a", "707.2"];
const CANDIDATES_Q2 = ["514.1", "514.2", "514.3", "514.3a", "603.2", "603.3", "117.3a", "513.1", "702.8a"];

// Card text and rulings that only reach the prompt when the card is attached.
const PROMPT_PROBES = [
  "instead create one of each",
  "replace creating a Treasure token with creating a copy",
  "Whenever you discard a card, exile that card",
  "Your opponents can't cast spells this turn",
  "as though they had flash"
];

const VARIANTS = [
  { id: "q1-bare", question: Q1, cards: [], candidates: CANDIDATES_Q1 },
  { id: "q1-cards", question: Q1, cards: [CARDS.manufactor, CARDS.esix], candidates: CANDIDATES_Q1 },
  { id: "q2-bare", question: Q2, cards: [], candidates: CANDIDATES_Q2 },
  { id: "q2-cards", question: Q2, cards: [CARDS.silence, CARDS.necro, CARDS.borne], candidates: CANDIDATES_Q2 },
  // Diagnostic only, not the tester's words: does naming the mechanic change what is pulled?
  {
    id: "q1-diag-names-replacement",
    question:
      "Academy Manufactor and Esix, Fractal Bloom are both replacement effects on creating a Treasure token. Which one applies first, and can both apply?",
    cards: [CARDS.manufactor, CARDS.esix],
    candidates: CANDIDATES_Q1
  }
];

const { preparePromptInput, buildRetrievalQueryText } = await import("../../../apps/backend/src/prompt/preparation.ts");
const resources = await loadPromptResources();
const embedder = await buildEmbedder(process.env);

console.log(`Embedding provider: ${embedder.mode}`);
for (const variant of VARIANTS) {
  const request = { mode: "lookup", question: variant.question };
  if (variant.cards.length > 0) request.cards = variant.cards.map((card) => ({ ...card }));
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  if (embedder.mode !== "mock" && !Array.isArray(vector)) throw new Error(`embedder returned no vector for ${variant.id}`);
  const prepared = preparePromptInput(request, { ...resources, queryEmbedding: vector ?? null, collectEnrichmentDebug: true });
  const debug = prepared.enrichmentDebug;
  const sup = debug?.supplemental;
  const curated = new Set((debug?.curatedGameRules?.topics ?? []).flatMap((topic) => topic.ruleNumbers ?? []));
  const selected = (sup?.selected ?? []).map((rule) => rule.ruleId);
  const runnerUp = (sup?.runnerUp ?? []).map((rule) => rule.ruleId);
  console.log(`\n=== ${variant.id} (cards: ${variant.cards.map((c) => c.name).join(", ") || "none"})`);
  console.log(`System 3 ran ${sup?.usedSemantic ? "semantic (hybrid)" : "lexical"}; top ${selected.length}:`);
  (sup?.selected ?? []).forEach((rule, i) => console.log(`  ${i + 1}. ${rule.ruleId} [${rule.sectionTitle}] ${rule.score.toFixed(3)}`));
  console.log(`Runners-up: ${runnerUp.join(", ")}`);
  console.log(`Always-on curated topics: ${(debug?.curatedGameRules?.topicIds ?? []).join(", ")}`);
  const rulingsDebug = debug?.rulings;
  if (rulingsDebug) console.log(`Rulings debug: ${JSON.stringify(rulingsDebug).slice(0, 400)}`);
  const text = prepared.promptText ?? "";
  for (const probe of PROMPT_PROBES) console.log(`  prompt contains "${probe}": ${text.includes(probe)}`);
  console.log("Candidate rules:");
  for (const ruleId of variant.candidates) {
    const rank = selected.indexOf(ruleId);
    const ru = runnerUp.indexOf(ruleId);
    const where = rank >= 0 ? `IN PROMPT (System 3 rank ${rank + 1})` : curated.has(ruleId) ? "IN PROMPT (curated topic)" : ru >= 0 ? `not in prompt (runner-up #${ru + 1})` : "not in prompt";
    console.log(`  ${ruleId}: ${where}`);
  }
  // Depth pass: same request, cap raised to 300, to show how far below the
  // production cutoff each candidate the prompt missed actually ranks.
  const deep = preparePromptInput(request, {
    ...resources,
    queryEmbedding: vector ?? null,
    collectEnrichmentDebug: true,
    supplementalRuleCap: 300
  });
  const deepIds = (deep.enrichmentDebug?.supplemental?.selected ?? []).map((rule) => rule.ruleId);
  console.log(
    `Depth ranks (cap 300): ${variant.candidates
      .map((ruleId) => `${ruleId}=${deepIds.indexOf(ruleId) >= 0 ? deepIds.indexOf(ruleId) + 1 : curated.has(ruleId) ? "curated" : ">300"}`)
      .join(", ")}`
  );
}
