// Production-fidelity helpers shared by the two offline instruments that
// call `preparePromptInput` (REQ-185, REQ-188): the worked-solutions
// retrieval check (scripts/eval-worked-solutions.mjs) and the answer-quality
// run (scripts/eval-answer-quality.mjs).
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
 * The request a gold case is asked as (REQ-185). A tier-2 case tests whether
 * the model honours the ruling the prompt attaches for its card, so it is
 * asked the way a player's lookup asks it: with the cited card attached, by
 * oracle id -- the key both the card-detail index (oracle text, type line)
 * and the card-rulings index resolve by -- so the prompt carries that card's
 * oracle text and every published ruling. A tier-1 case is the bare question.
 */
export function buildCaseRequest(caseEntry) {
  const request = { mode: "lookup", question: caseEntry.question };
  if (caseEntry.tier === 2) {
    request.cards = [{ cardId: caseEntry.source.oracleId, name: caseEntry.source.cardName }];
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

/**
 * The production prompt inputs (`createConfiguredApp.ts` loads the same
 * four files): curated topics, the flat rule index, and the card-detail and
 * card-rulings indexes an attached card resolves through. TypeScript
 * imports, so lazy and only ever evaluated under tsx.
 */
export async function loadPromptResources() {
  const { loadGameRulesTopics } = await import("../../apps/backend/src/gameRules.ts");
  const { loadGameRulesRuleIndex } = await import("../../apps/backend/src/gameRulesRetrieval.ts");
  const { loadCardRulingsIndex } = await import("../../apps/backend/src/cardRulings.ts");
  const { loadCardDetailIndex } = await import("../../apps/backend/src/cardDetail.ts");
  const { join } = await import("node:path");
  const dataDir = join(repoRoot, "apps/backend/data");
  return {
    gameRulesTopics: loadGameRulesTopics(join(dataDir, "gameRulesByTopic.json")),
    gameRulesRuleIndex: loadGameRulesRuleIndex(join(dataDir, "gameRulesRuleIndex.json")),
    cardRulingsIndex: loadCardRulingsIndex(join(dataDir, "cardRulingsByOracleId.json.br")),
    cardDetailIndex: loadCardDetailIndex(join(dataDir, "cardDetailByOracleId.json.br"))
  };
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
