import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import { layoutPromptRuleSections } from "../prompt/ruleLayout.js";

/** REQ-239: the search excerpts in rule-book order, grouped and labelled (see `layoutPromptRuleSections`). */
export function formatSupplementalRulesSection(rules: RetrievedGameRule[]): string {
  return layoutPromptRuleSections({ topics: [], supplementalRules: rules }).supplementalRulesSection;
}
