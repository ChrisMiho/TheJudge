import cors from "cors";
import express from "express";
import { createAppLogger, resolveCorrelationId, type AppLogger } from "./logging.js";
import { mockAskAiProvider } from "./providers/mockAskAiProvider.js";
import type { AskAiProvider } from "./providers/askAiProvider.js";
import { buildPromptContext } from "./promptContext.js";
import { buildPromptText, getPromptDiagnostics } from "./promptNormalization.js";
import { askAiRequestSchema } from "./validation.js";
import type { AskAiError } from "./types.js";

const retryAfterSeconds = 13;

type AppOptions = {
  frontendOrigin?: string;
  askAiProvider?: AskAiProvider;
  debugLoggingEnabled?: boolean;
  logger?: AppLogger;
};

function toValidationErrorMessage(issues: { path: (string | number)[]; message: string }[]): string {
  const firstIssue = issues[0];
  if (!firstIssue) {
    return "Invalid request payload";
  }

  const pathLabel = firstIssue.path.length > 0 ? firstIssue.path.join(".") : "request";
  return `Invalid request payload: ${pathLabel} ${firstIssue.message}`;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const askAiProvider = options.askAiProvider ?? mockAskAiProvider;
  const logger = options.logger ?? createAppLogger(options.debugLoggingEnabled ?? false);

  app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/api/ask-ai", async (req, res) => {
    const correlationId = resolveCorrelationId(req.header("x-correlation-id"));
    logger.info("ask_ai.request_received", {
      correlationId,
      method: req.method,
      path: req.path,
      stackSize: Array.isArray(req.body?.stack) ? req.body.stack.length : undefined
    });

    const parsed = askAiRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.info("ask_ai.request_validation_failed", {
        correlationId,
        issueCount: parsed.error.issues.length
      });
      const error: AskAiError = {
        error: toValidationErrorMessage(parsed.error.issues),
        retryAfterSeconds
      };
      res.status(400).json(error);
      return;
    }

    logger.info("ask_ai.request_validation_succeeded", {
      correlationId,
      stackSize: parsed.data.stack.length
    });

    const shouldFail = req.query.fail === "true";
    if (shouldFail) {
      logger.info("ask_ai.response_failure", {
        correlationId,
        failureType: "forced_fail_query"
      });
      const error: AskAiError = {
        error: "Miho is working on it",
        retryAfterSeconds
      };
      res.status(502).json(error);
      return;
    }

    try {
      logger.info("ask_ai.prompt_context_build_started", { correlationId });
      const promptBuildStartedAt = Date.now();
      const promptContext = buildPromptContext(parsed.data);
      const promptText = buildPromptText(promptContext);
      const diagnostics = getPromptDiagnostics(promptText);
      logger.info("ask_ai.prompt_context_build_completed", {
        correlationId,
        promptChars: diagnostics.promptChars,
        promptBudgetChars: diagnostics.promptBudgetChars,
        promptUtilizationPercent: diagnostics.utilizationPercent,
        promptBuildElapsedMs: Date.now() - promptBuildStartedAt
      });

      if (diagnostics.exceedsBudget) {
        logger.info("ask_ai.prompt_budget_exceeded", {
          correlationId,
          promptChars: diagnostics.promptChars,
          promptBudgetChars: diagnostics.promptBudgetChars
        });
        const error: AskAiError = {
          error: `Invalid request payload: prompt exceeds max budget (${diagnostics.promptBudgetChars} chars)`,
          retryAfterSeconds
        };
        res.status(400).json(error);
        return;
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
      const response = await askAiProvider.generateAnswer(parsed.data);
      const providerElapsedMs = Date.now() - providerStartedAt;
      logger.info("ask_ai.provider_invocation_completed", { correlationId, providerElapsedMs });
      if (providerElapsedMs > 1200) {
        logger.info("ask_ai.provider_latency_warning", {
          correlationId,
          providerElapsedMs,
          thresholdMs: 1200
        });
      }
      logger.info("ask_ai.response_success", { correlationId });
      res.status(200).json(response);
    } catch (cause) {
      logger.error("ask_ai.response_failure", {
        correlationId,
        failureType: "provider_exception",
        message: cause instanceof Error ? cause.message : "unknown"
      });
      const error: AskAiError = {
        error: "Miho is working on it",
        retryAfterSeconds
      };
      res.status(502).json(error);
    }
  });

  return app;
}
