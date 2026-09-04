import cors from "cors";
import express from "express";
import { createErrorHandler } from "./errorHandler.js";
import { createAppLogger, type AppLogger } from "../logging.js";
import { mockAskAiProvider } from "../providers/mockAskAiProvider.js";
import type { RulingEntry } from "../cardRulings.js";
import type { CardDetailEntry } from "../cardDetail.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import type { ComboCatalog } from "../commanderSpellbook/catalog.js";
import type { AskAiProvider } from "../providers/askAiProvider.js";
import { registerAskAiRoute } from "../routes/askAi.js";
import { registerCardDetailRoute } from "../routes/cardDetail.js";
import { registerHealthRoute } from "../routes/health.js";

export type AppOptions = {
  frontendOrigin?: string;
  askAiProvider?: AskAiProvider;
  askAiProviderMode?: "mock" | "openai";
  debugLoggingEnabled?: boolean;
  payloadLoggingEnabled?: boolean;
  logger?: AppLogger;
  cardRulingsIndex?: Map<string, RulingEntry[]>;
  cardDetailIndex?: Map<string, CardDetailEntry>;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesRuleIndex?: GameRulesRuleIndexEntry[];
  comboCatalog?: ComboCatalog;
  collectEnrichmentDebug?: boolean;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const askAiProvider = options.askAiProvider ?? mockAskAiProvider;
  const isDebug = options.debugLoggingEnabled ?? false;
  const isPayloadLoggingEnabled = options.payloadLoggingEnabled ?? false;
  const logger = options.logger ?? createAppLogger(isDebug);
  const cardDetailIndex = options.cardDetailIndex ?? new Map<string, CardDetailEntry>();

  app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined));
  app.use(express.json());

  registerHealthRoute(app);
  registerCardDetailRoute(app, { cardDetailIndex });
  registerAskAiRoute(app, {
    askAiProvider,
    askAiProviderMode: options.askAiProviderMode,
    logger,
    payloadLoggingEnabled: isPayloadLoggingEnabled,
    cardRulingsIndex: options.cardRulingsIndex,
    gameRulesTopics: options.gameRulesTopics,
    gameRulesRuleIndex: options.gameRulesRuleIndex,
    comboCatalog: options.comboCatalog,
    collectEnrichmentDebug: options.collectEnrichmentDebug
  });

  app.use(createErrorHandler(logger, isDebug));

  return app;
}
