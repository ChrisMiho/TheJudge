import { resolve } from "node:path";
import { createApp } from "../app/createApp.js";
import { loadCardRulingsIndex } from "../cardRulings.js";
import { loadComboCatalog, type ComboCatalog } from "../commanderSpellbook/catalog.js";
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
  comboVariantCount: number;
};

export function createConfiguredApp(repoRoot: string, env: NodeJS.ProcessEnv = process.env): RuntimeApp {
  const config = readServerConfig(env);
  const cardRulingsPath = resolve(repoRoot, "apps/backend/data/cardRulingsByOracleId.json");
  const cardRulingsIndex = loadCardRulingsIndex(cardRulingsPath);
  const gameRulesPath = resolve(repoRoot, "apps/backend/data/gameRulesByTopic.json");
  const gameRulesTopics = loadGameRulesTopics(gameRulesPath);
  const gameRulesRuleIndexPath = resolve(repoRoot, "apps/backend/data/gameRulesRuleIndex.json");
  const gameRulesRuleIndex = loadGameRulesRuleIndex(gameRulesRuleIndexPath);

  // A disabled flag means the artifacts are never read and the option is simply
  // absent downstream; no branch below learns why it is absent.
  let comboCatalog: ComboCatalog | undefined;
  if (config.comboEnrichmentEnabled) {
    comboCatalog = loadComboCatalog(
      resolve(repoRoot, "apps/backend/data/commanderSpellbookCombos.json"),
      resolve(repoRoot, "apps/backend/data/commanderSpellbookComboIndex.json")
    );
  }

  return {
    app: createApp({
      frontendOrigin: config.frontendOrigin,
      debugLoggingEnabled: config.debugLoggingEnabled,
      payloadLoggingEnabled: config.payloadLoggingEnabled,
      askAiProvider: createAskAiProvider(config),
      askAiProviderMode: config.askAiProvider,
      cardRulingsIndex,
      gameRulesTopics,
      gameRulesRuleIndex,
      comboCatalog,
      collectEnrichmentDebug: config.askAiProvider !== "openai",
      logger: createAppLogger(config.debugLoggingEnabled)
    }),
    config,
    cardRulingsCardCount: cardRulingsIndex.size,
    gameRulesTopicCount: gameRulesTopics.length,
    gameRulesRuleCount: gameRulesRuleIndex.length,
    comboVariantCount: comboCatalog?.variantCount ?? 0
  };
}
