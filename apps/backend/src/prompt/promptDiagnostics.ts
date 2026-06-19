import { MAX_PROMPT_CHAR_BUDGET, PROMPT_BUDGET_NEAR_LIMIT_BUFFER } from "./normalization.js";
import type { ResolvedRulings } from "../cardRulings.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";

export function estimatePromptChars(prompt: string): number {
  return prompt.length;
}

export type PromptDiagnostics = {
  promptChars: number;
  promptBudgetChars: number;
  remainingChars: number;
  utilizationPercent: number;
  nearLimit: boolean;
  exceedsBudget: boolean;
  conversationHistoryChars: number;
  rulingsSectionChars?: number;
  rulingsCardCount?: number;
  gameRulesSectionChars?: number;
  gameRulesTopicCount?: number;
  supplementalRuleCount?: number;
  supplementalRulesSectionChars?: number;
  supplementalRuleIds?: string[];
};

export type GetPromptDiagnosticsOptions = {
  resolvedRulings?: ResolvedRulings;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesSectionChars?: number;
  supplementalRules?: RetrievedGameRule[];
  supplementalRulesSectionChars?: number;
  conversationHistoryChars?: number;
};

export function getPromptDiagnostics(prompt: string, resolvedRulingsOrOptions?: ResolvedRulings | GetPromptDiagnosticsOptions): PromptDiagnostics {
  const promptChars = estimatePromptChars(prompt);
  const promptBudgetChars = MAX_PROMPT_CHAR_BUDGET;
  const remainingChars = promptBudgetChars - promptChars;
  const utilizationPercent = Math.round((promptChars / promptBudgetChars) * 1000) / 10;

  let resolvedRulings: ResolvedRulings | undefined;
  let gameRulesTopics: GameRulesTopic[] | undefined;
  let gameRulesSectionChars: number | undefined;
  let supplementalRules: RetrievedGameRule[] | undefined;
  let supplementalRulesSectionChars: number | undefined;
  let conversationHistoryChars = 0;

  if (resolvedRulingsOrOptions && "cards" in resolvedRulingsOrOptions) {
    resolvedRulings = resolvedRulingsOrOptions;
  } else if (resolvedRulingsOrOptions) {
    const opts = resolvedRulingsOrOptions as GetPromptDiagnosticsOptions;
    resolvedRulings = opts.resolvedRulings;
    gameRulesTopics = opts.gameRulesTopics;
    gameRulesSectionChars = opts.gameRulesSectionChars;
    supplementalRules = opts.supplementalRules;
    supplementalRulesSectionChars = opts.supplementalRulesSectionChars;
    conversationHistoryChars = opts.conversationHistoryChars ?? 0;
  }

  return {
    promptChars,
    promptBudgetChars,
    remainingChars,
    utilizationPercent,
    nearLimit: promptChars > promptBudgetChars - PROMPT_BUDGET_NEAR_LIMIT_BUFFER,
    exceedsBudget: promptChars > promptBudgetChars,
    conversationHistoryChars,
    ...(resolvedRulings
      ? {
          rulingsSectionChars: resolvedRulings.sectionChars,
          rulingsCardCount: resolvedRulings.cards.length
        }
      : {}),
    ...(gameRulesTopics && gameRulesTopics.length > 0
      ? {
          gameRulesSectionChars,
          gameRulesTopicCount: gameRulesTopics.length
        }
      : {}),
    ...(supplementalRules && supplementalRules.length > 0
      ? {
          supplementalRuleCount: supplementalRules.length,
          supplementalRulesSectionChars,
          supplementalRuleIds: supplementalRules.map((r) => r.ruleId)
        }
      : {})
  };
}
