// Type declarations for `prompt-fidelity.mjs`, the production-fidelity helpers
// shared by the retrieval check, the answer-quality run and the offline prompt
// gate (REQ-185, REQ-188). Backend vitest tests import the real module at run
// time; this file only lets the backend typecheck accept that import. It
// states types and never logic. The backend types are imported as types only.

import type { CardDetailEntry } from "../../apps/backend/src/cardDetail.js";
import type { RulingEntry } from "../../apps/backend/src/cardRulings.js";
import type { ComboCatalog } from "../../apps/backend/src/commanderSpellbook/catalog.js";
import type { GameRulesTopic } from "../../apps/backend/src/gameRules.js";
import type { GameRulesRuleIndexEntry } from "../../apps/backend/src/gameRulesRetrieval.js";
import type { CaseRequest, GoldCase } from "./gold-cases.mjs";

export type PromptResources = {
  gameRulesTopics: GameRulesTopic[];
  gameRulesRuleIndex: GameRulesRuleIndexEntry[];
  cardRulingsIndex: Map<string, RulingEntry[]>;
  cardDetailIndex: Map<string, CardDetailEntry>;
  /** Present when combo enrichment is on (production's default); absent otherwise (REQ-188). */
  comboCatalog?: ComboCatalog;
};

export type Embedder = { mode: string; embed: (text: string) => Promise<number[] | null> };

export type RetrievalDescription = {
  usedSemantic: boolean;
  selectedRuleIds: string[];
  goldRuleInPrompt: boolean;
};

export const DEFAULT_EMBEDDING_PROVIDER: string;

export function resolveEmbeddingProviderMode(env?: Record<string, string | undefined>): string;
export function buildCaseRequest(caseEntry: Pick<GoldCase, "question" | "cards" | "gameState">): CaseRequest;
export function assertQueryEmbedded(input: { mode: string; vector: number[] | null; caseId: string }): void;
export function describeRetrieval(
  supplemental: { selected?: Array<{ ruleId: string }>; usedSemantic?: boolean } | undefined,
  expectedRuleIds: readonly string[],
  options?: { requireSemantic?: boolean; caseId?: string }
): RetrievalDescription;
export const COMBO_ENRICHMENT_ENV: string;
export function loadPromptResources(options?: {
  env?: Record<string, string | undefined>;
  modules?: Record<string, unknown>;
}): Promise<PromptResources>;
export function buildEmbedder(env: Record<string, string | undefined>): Promise<Embedder>;
export function embedGoldCaseQueries(input: {
  goldCases: Array<Pick<GoldCase, "id" | "question" | "cards" | "gameState">>;
  embedder: Embedder;
  cardDetailIndex: Map<string, CardDetailEntry>;
}): Promise<Map<string, number[] | null>>;
