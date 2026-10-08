// Production-fidelity helpers shared by the instruments that call
// `preparePromptInput` (REQ-185, REQ-188): the worked-solutions retrieval
// check (scripts/eval-worked-solutions.mjs), the answer-quality run
// (scripts/eval-answer-quality.mjs) and the offline prompt gate. Backend
// tests reach this module through the sibling declaration
// `prompt-fidelity.d.mts`.
//
// Calling the production prompt builder is not the same as producing the
// production prompt. The route handler (apps/backend/src/routes/askAi.ts)
// supplies three things the builder never fetches for itself: the committed
// card-detail and card-rulings indexes, the attached cards, and the query
// embedding. An instrument that omits any of them measures a prompt no
// player ever gets -- and, on 2026-09-07, two paid runs did exactly that.
// Everything here exists so both instruments supply all three, and refuse
// to record a run whose embedder quietly fell back to lexical ranking.
//
// The pure helpers (buildCaseRequest, assertQueryEmbedded, describeRetrieval)
// run under plain `node --test`; the loaders isolate every TypeScript import
// inside their own function body, so importing this module never needs tsx.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** What the deployed app runs (REQ-184); an explicit `EMBEDDING_PROVIDER` always wins. */
export const DEFAULT_EMBEDDING_PROVIDER = "local";

/** `env.EMBEDDING_PROVIDER`, defaulting to the deployed provider when unset or blank. */
export function resolveEmbeddingProviderMode(env = process.env) {
  const value = env.EMBEDDING_PROVIDER?.trim();
  return value && value.length > 0 ? value : DEFAULT_EMBEDDING_PROVIDER;
}

/**
 * The request a rules test case is asked as (REQ-185, A15) -- the one request
 * builder the offline gate and the live runner share. A case asks the way a
 * player asks it, with every card it names attached:
 *
 * - a case without a `gameState` is a `mode: "lookup"` request with every
 *   `cards` entry attached by oracle id -- the key both the card-detail index
 *   (oracle text, type line) and the card-rulings index resolve by -- so the
 *   prompt carries each card's oracle text and every published ruling. A case
 *   naming no real card has an empty `cards` list and is the bare question;
 * - a case with a `gameState` is an In-Depth `mode: "game"` request whose
 *   `gameContext` is that `gameState`, each card sitting in its zone (the
 *   case loader guarantees every zone card is one of `cards` and every card
 *   in `cards` sits in a zone; a zone card missing its `name` takes it from
 *   `cards`). Stack order is the order of the stack zone, bottom first.
 */
export function buildCaseRequest(caseEntry) {
  const cards = caseEntry.cards ?? [];
  if (caseEntry.gameState) {
    const nameByOracleId = new Map(cards.map((card) => [card.oracleId, card.name]));
    const zones = {};
    for (const [zoneId, items] of Object.entries(caseEntry.gameState.zones ?? {})) {
      zones[zoneId] = items.map((item) => ({ ...item, name: item.name ?? nameByOracleId.get(item.cardId) }));
    }
    return {
      mode: "game",
      question: caseEntry.question,
      gameContext: { ...caseEntry.gameState, zones }
    };
  }
  const request = { mode: "lookup", question: caseEntry.question };
  if (cards.length > 0) {
    request.cards = cards.map((card) => ({ cardId: card.oracleId, name: card.name }));
  }
  return request;
}

/**
 * A real embedder returns `null` on failure and production quietly falls
 * back to lexical retrieval; an instrument must not. Refuses to continue a
 * run whose artifact would be labelled with a provider that never ran.
 */
export function assertQueryEmbedded({ mode, vector, caseId }) {
  if (mode === "mock" || Array.isArray(vector)) return;
  throw new Error(
    `EMBEDDING_PROVIDER=${mode} returned no embedding for gold case ${caseId}, so System 3 would silently run lexical retrieval under a "${mode}" label. Refusing to record that. For local, warm the model cache first: node scripts/warm-embedding-model-cache.mjs (apps/backend/data/models/ is gitignored, so a fresh worktree has none).`
  );
}

/**
 * What System 3 actually did for one prepared prompt, from the production
 * enrichment debug block: whether the pass ran semantic (REQ-182) or fell
 * back to lexical, which rule excerpts reached the prompt, and whether any
 * of the case's expected rule ids was among them. `requireSemantic` turns
 * an unexpected lexical pass into a refusal (the embedder ran, but the
 * committed embeddings artifact did not match the rule index, say).
 */
export function describeRetrieval(supplemental, expectedRuleIds, { requireSemantic = false, caseId = "" } = {}) {
  const selectedRuleIds = (supplemental?.selected ?? []).map((rule) => rule.ruleId);
  const usedSemantic = Boolean(supplemental?.usedSemantic);
  if (requireSemantic && !usedSemantic) {
    throw new Error(
      `System 3 ran lexical retrieval for gold case ${caseId} although the question was embedded -- the committed rule embeddings artifact is missing, malformed, or does not match gameRulesRuleIndex.json. Refusing to record a semantic-labelled run.`
    );
  }
  return {
    usedSemantic,
    selectedRuleIds,
    goldRuleInPrompt: expectedRuleIds.some((ruleId) => selectedRuleIds.includes(ruleId))
  };
}

/** The production default for combo enrichment (`config/index.ts`): on unless COMBO_ENRICHMENT_ENABLED says otherwise. */
export const COMBO_ENRICHMENT_ENV = "COMBO_ENRICHMENT_ENABLED";

/**
 * The production prompt inputs (`createConfiguredApp.ts` loads the same
 * files): curated topics, the flat rule index, the card-detail and
 * card-rulings indexes an attached card resolves through, and -- when combo
 * enrichment is on, which is production's default -- the Commander Spellbook
 * combo catalog. An evaluation prompt built without the catalog is not the
 * prompt a player gets (REQ-188). The caller learns whether the catalog loaded
 * from `Boolean(resources.comboCatalog)`; when enrichment is off the key is
 * absent, exactly as `createConfiguredApp` leaves it.
 *
 * TypeScript imports, so lazy and only ever evaluated under tsx. `modules`
 * lets a plain-node test supply fakes for them.
 */
export async function loadPromptResources({ env = process.env, modules } = {}) {
  const { join } = await import("node:path");
  const mods = modules ?? {
    ...(await import("../../apps/backend/src/gameRules.ts")),
    ...(await import("../../apps/backend/src/gameRulesRetrieval.ts")),
    ...(await import("../../apps/backend/src/cardRulings.ts")),
    ...(await import("../../apps/backend/src/cardDetail.ts")),
    ...(await import("../../apps/backend/src/commanderSpellbook/catalog.ts")),
    ...(await import("../../apps/backend/src/logging.ts"))
  };
  const dataDir = join(repoRoot, "apps/backend/data");
  const resources = {
    gameRulesTopics: mods.loadGameRulesTopics(join(dataDir, "gameRulesByTopic.json")),
    gameRulesRuleIndex: mods.loadGameRulesRuleIndex(join(dataDir, "gameRulesRuleIndex.json")),
    cardRulingsIndex: mods.loadCardRulingsIndex(join(dataDir, "cardRulingsByOracleId.json.br")),
    cardDetailIndex: mods.loadCardDetailIndex(join(dataDir, "cardDetailByOracleId.json.br"))
  };
  if (mods.resolveBooleanEnv(env[COMBO_ENRICHMENT_ENV], COMBO_ENRICHMENT_ENV, true)) {
    resources.comboCatalog = mods.loadComboCatalog(
      join(dataDir, "commanderSpellbookComboBlocks.br"),
      join(dataDir, "commanderSpellbookComboIndex.json.br")
    );
  }
  return resources;
}

/**
 * The query embedder an instrument uses, selected exactly as the server
 * selects it (`createEmbeddingProvider`): `local` is the bundled MiniLM
 * model, in process, no network; `openai` is the hosted embedder; `mock`
 * embeds nothing and leaves System 3 lexical.
 */
export async function buildEmbedder(env) {
  const mode = resolveEmbeddingProviderMode(env);
  if (mode === "mock") return { mode, embed: async () => null };
  const { createEmbeddingProvider } = await import("../../apps/backend/src/providers/createEmbeddingProvider.ts");
  const provider = createEmbeddingProvider({ embeddingProvider: mode, openAiApiKey: env.OPENAI_API_KEY });
  return { mode, embed: (text) => provider.embed(text) };
}

/**
 * Embeds every gold case's retrieval query text once -- the same text the
 * route handler embeds (`buildRetrievalQueryText`: question plus each
 * attached card's compact signal) -- and refuses on any silent fallback.
 * Returns a map from case id to vector (`null` for every case under mock).
 */
export async function embedGoldCaseQueries({ goldCases, embedder, cardDetailIndex }) {
  const { buildRetrievalQueryText } = await import("../../apps/backend/src/prompt/preparation.ts");
  const byCaseId = new Map();
  for (const caseEntry of goldCases) {
    const request = buildCaseRequest(caseEntry);
    const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex }));
    assertQueryEmbedded({ mode: embedder.mode, vector, caseId: caseEntry.id });
    byCaseId.set(caseEntry.id, vector);
  }
  return byCaseId;
}
