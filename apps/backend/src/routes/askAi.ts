import type { Express, NextFunction, Request, Response } from "express";
import {
  classifyProviderError,
  createProviderUnavailableError,
  createValidationError
} from "../errors.js";
import { resolveCorrelationId, type AppLogger } from "../logging.js";
import { buildRetrievalQueryText, preparePromptInput } from "../prompt/preparation.js";
import type { CardDetailIndex } from "../prompt/context.js";
import type { RulingEntry } from "../cardRulings.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import type { ComboCatalog } from "../commanderSpellbook/catalog.js";
import type { AskAiProvider } from "../providers/askAiProvider.js";
import type { EmbeddingProvider } from "../providers/embeddingProvider.js";
import type { AskAiRequest } from "../types/index.js";
import { askAiRequestSchema } from "../validation/askAiRequest.js";
import { toValidationErrorMessage } from "../app/errorHandler.js";
import { getAnswerSizeDiagnostics } from "../responseSizeDiagnostics.js";

export type AskAiRouteDeps = {
  askAiProvider: AskAiProvider;
  askAiProviderMode?: "mock" | "openai";
  logger: AppLogger;
  payloadLoggingEnabled: boolean;
  cardRulingsIndex?: Map<string, RulingEntry[]>;
  cardDetailIndex?: CardDetailIndex;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesRuleIndex?: GameRulesRuleIndexEntry[];
  comboCatalog?: ComboCatalog;
  collectEnrichmentDebug?: boolean;
  /** REQ-181: absent under `EMBEDDING_PROVIDER=mock` (the default) — System 3 stays lexical-only. */
  embeddingProvider?: EmbeddingProvider;
};

export function registerAskAiRoute(app: Express, deps: AskAiRouteDeps): void {
  const {
    askAiProvider,
    askAiProviderMode = "mock",
    logger,
    payloadLoggingEnabled,
    cardRulingsIndex,
    cardDetailIndex,
    gameRulesTopics,
    gameRulesRuleIndex,
    comboCatalog,
    collectEnrichmentDebug,
    embeddingProvider
  } = deps;

  app.post("/api/ask-ai", async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = resolveCorrelationId(req.header("x-correlation-id"));
    res.set("X-Correlation-Id", correlationId);
    try {
      logger.info("ask_ai.request_received", {
        correlationId,
        method: req.method,
        path: req.path,
        stackSize: (req.body?.gameContext?.zones?.stack as unknown[] | undefined)?.length,
        requestPayload: payloadLoggingEnabled ? req.body : undefined
      });

      const parsed = askAiRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        logger.info("ask_ai.request_validation_failed", {
          correlationId,
          issueCount: parsed.error.issues.length
        });
        throw createValidationError(toValidationErrorMessage(parsed.error.issues));
      }
      const askAiRequest = parsed.data as AskAiRequest;

      logger.info("ask_ai.request_validation_succeeded", {
        correlationId,
        stackSize: askAiRequest.mode === "lookup" ? 0 : askAiRequest.gameContext.zones?.stack?.length ?? 0
      });

      if (req.query.fail === "true") {
        logger.info("ask_ai.response_failure", {
          correlationId,
          failureType: "forced_fail_query"
        });
        throw createProviderUnavailableError("Miho is working on it", "forced fail query parameter");
      }

      // REQ-181: the one async step in prompt preparation. Embedding happens
      // here, before the otherwise-synchronous `preparePromptInput`, so the
      // vector is passed in as an option rather than making prompt assembly
      // itself async. `embeddingProvider` is absent under the default
      // `EMBEDDING_PROVIDER=mock`, and any embedding failure resolves to
      // `null` (never throws) — either way System 3 falls back to lexical
      // retrieval with no change in behavior or latency shape.
      let queryEmbedding: number[] | null = null;
      if (embeddingProvider) {
        const queryText = buildRetrievalQueryText(askAiRequest, { cardDetailIndex });
        queryEmbedding = await embeddingProvider.embed(queryText);
      }

      logger.info("ask_ai.prompt_context_build_started", { correlationId });
      const promptBuildStartedAt = Date.now();
      const preparedPrompt = preparePromptInput(askAiRequest, {
        cardRulingsIndex,
        cardDetailIndex,
        gameRulesTopics,
        gameRulesRuleIndex,
        comboCatalog,
        collectEnrichmentDebug,
        queryEmbedding
      });
      const diagnostics = preparedPrompt.diagnostics;
      logger.info("ask_ai.prompt_context_build_completed", {
        correlationId,
        promptChars: diagnostics.promptChars,
        promptBudgetChars: diagnostics.promptBudgetChars,
        promptUtilizationPercent: diagnostics.utilizationPercent,
        rulingsSectionChars: diagnostics.rulingsSectionChars,
        rulingsCardCount: diagnostics.rulingsCardCount,
        gameRulesSectionChars: diagnostics.gameRulesSectionChars,
        gameRulesTopicCount: diagnostics.gameRulesTopicCount,
        ...(diagnostics.supplementalRuleCount != null
          ? {
              supplementalRuleCount: diagnostics.supplementalRuleCount,
              supplementalRulesSectionChars: diagnostics.supplementalRulesSectionChars,
              supplementalRuleIds: diagnostics.supplementalRuleIds
            }
          : {}),
        promptBuildElapsedMs: Date.now() - promptBuildStartedAt
      });

      if (diagnostics.exceedsBudget) {
        logger.info("ask_ai.prompt_budget_exceeded", {
          correlationId,
          promptChars: diagnostics.promptChars,
          promptBudgetChars: diagnostics.promptBudgetChars
        });
        throw createValidationError(`Invalid request payload: prompt exceeds max budget (${diagnostics.promptBudgetChars} chars)`);
      }

      if (diagnostics.nearLimit) {
        logger.info("ask_ai.prompt_budget_near_limit", {
          correlationId,
          promptChars: diagnostics.promptChars,
          promptBudgetChars: diagnostics.promptBudgetChars,
          promptRemainingChars: diagnostics.remainingChars
        });
      }

      logger.info("ask_ai.provider_invocation_started", { correlationId });
      const providerStartedAt = Date.now();
      let response;
      try {
        response = await askAiProvider.generateAnswer(preparedPrompt);
      } catch (cause) {
        throw classifyProviderError(cause);
      }

      const providerElapsedMs = Date.now() - providerStartedAt;
      logger.info("ask_ai.provider_invocation_completed", {
        correlationId,
        providerElapsedMs,
        ...(askAiProviderMode === "openai" ? getAnswerSizeDiagnostics(response.answer) : {})
      });
      if (providerElapsedMs > 1200) {
        logger.info("ask_ai.provider_latency_warning", {
          correlationId,
          providerElapsedMs,
          thresholdMs: 1200
        });
      }
      logger.info("ask_ai.response_success", { correlationId });
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });
}
