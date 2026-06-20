import { resolve } from "node:path";
import { createApp } from "../app/createApp.js";
import { loadCardRulingsIndex } from "../cardRulings.js";
import { readServerConfig } from "../config/index.js";
import { loadGameRulesTopics } from "../gameRules.js";
import { loadGameRulesRuleIndex } from "../gameRulesRetrieval.js";
import { createAppLogger } from "../logging.js";
import { createAskAiProvider } from "../providers/createAskAiProvider.js";

export type RuntimeApp = {
  app: ReturnType<typeof createApp>;
  config: ReturnType<typeof readServerConfig>;
  cardRulingsCardCount: number;
  gameRulesTopicCount: number;
  gameRulesRuleCount: number;
};

export function createConfiguredApp(repoRoot: string, env: NodeJS.ProcessEnv = process.env): RuntimeApp {
  const config = readServerConfig(env);
  const cardRulingsPath = resolve(repoRoot, "apps/backend/data/cardRulingsByOracleId.json");
  const cardRulingsIndex = loadCardRulingsIndex(cardRulingsPath);
  const gameRulesPath = resolve(repoRoot, "apps/backend/data/gameRulesByTopic.json");
  const gameRulesTopics = loadGameRulesTopics(gameRulesPath);
  const gameRulesRuleIndexPath = resolve(repoRoot, "apps/backend/data/gameRulesRuleIndex.json");
  const gameRulesRuleIndex = loadGameRulesRuleIndex(gameRulesRuleIndexPath);

  return {
    app: createApp({
      frontendOrigin: config.frontendOrigin,
      debugLoggingEnabled: config.debugLoggingEnabled,
      payloadLoggingEnabled: config.payloadLoggingEnabled,
      askAiProvider: createAskAiProvider(config),
      cardRulingsIndex,
      gameRulesTopics,
      gameRulesRuleIndex,
      collectEnrichmentDebug: config.askAiProvider !== "openai",
      logger: createAppLogger(config.debugLoggingEnabled)
    }),
    config,
    cardRulingsCardCount: cardRulingsIndex.size,
    gameRulesTopicCount: gameRulesTopics.length,
    gameRulesRuleCount: gameRulesRuleIndex.length
  };
}
