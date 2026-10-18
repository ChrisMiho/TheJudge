import type { RulingsDebug } from "../cardRulings.js";
import type { SupplementalRulesDebug } from "../gameRulesRetrieval.js";
import type { RuleLayoutStats } from "./ruleLayout.js";

/**
 * The mock-only debug sidecar (DEC-033): what retrieval, the curated topics, the rulings and the
 * rules layout chose for one prepared prompt. A plain type built from the parts' own debug types;
 * nothing parses it.
 */
export type EnrichmentDebug = {
  supplemental: SupplementalRulesDebug;
  curatedGameRules: {
    topicIds: string[];
    topics: Array<{ id: string; title: string; ruleNumbers: string[] }>;
  };
  ruleLayout?: RuleLayoutStats;
  rulings: RulingsDebug;
};
