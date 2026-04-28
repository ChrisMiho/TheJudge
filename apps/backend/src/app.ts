import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import {
  AppError,
  classifyProviderError,
  createProviderUnavailableError,
  createUnexpectedError,
  createValidationError
} from "./errors.js";
import { createAppLogger, resolveCorrelationId, type AppLogger } from "./logging.js";
import { mockAskAiProvider } from "./providers/mockAskAiProvider.js";
import type { AskAiProvider } from "./providers/askAiProvider.js";
import { buildPromptContext } from "./promptContext.js";
import { buildPromptText, getPromptDiagnostics } from "./promptNormalization.js";
import { askAiRequestSchema } from "./validation.js";
import type { AskAiError } from "./types.js";

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

function correlationIdFromResponse(res: Response): string {
  const existing = res.getHeader("X-Correlation-Id");
  return typeof existing === "string" && existing.trim().length > 0 ? existing : resolveCorrelationId(undefined);
}

function toApiErrorPayload(error: AppError, correlationId: string, includeDetails: boolean): AskAiError {
  const metadataEntries: Array<[string, string]> = [["correlationId", correlationId]];
  if (includeDetails && error.details) {
    metadataEntries.push(["details", error.details]);
  }

  const metadata = Object.fromEntries(metadataEntries);
  return {
    code: error.code,
    message: error.message,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    retryAfterSeconds: error.retryAfterSeconds
  };
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const askAiProvider = options.askAiProvider ?? mockAskAiProvider;
  const isDebug = options.debugLoggingEnabled ?? false;
  const logger = options.logger ?? createAppLogger(isDebug);

  app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/api/ask-ai", async (req, res, next) => {
    const correlationId = resolveCorrelationId(req.header("x-correlation-id"));
    res.set("X-Correlation-Id", correlationId);
    try {
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
        throw createValidationError(toValidationErrorMessage(parsed.error.issues));
      }

      logger.info("ask_ai.request_validation_succeeded", {
        correlationId,
        stackSize: parsed.data.stack.length
      });

      if (req.query.fail === "true") {
        logger.info("ask_ai.response_failure", {
          correlationId,
          failureType: "forced_fail_query"
        });
        throw createProviderUnavailableError("Miho is working on it", "forced fail query parameter");
      }

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
        response = await askAiProvider.generateAnswer(parsed.data);
      } catch (cause) {
        throw classifyProviderError(cause);
      }

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
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const correlationId = correlationIdFromResponse(res);
    if (!res.getHeader("X-Correlation-Id")) {
      res.set("X-Correlation-Id", correlationId);
    }

    const unexpectedDetails = error instanceof Error ? error.message : String(error);
    const appError =
      error instanceof AppError ? error : createUnexpectedError("Miho is working on it", unexpectedDetails);
    const includeDetails = isDebug;
    if (appError.status >= 500) {
      logger.error("ask_ai.response_failure", {
        correlationId,
        code: appError.code,
        status: appError.status,
        details: includeDetails ? appError.details : undefined
      });
    } else {
      logger.info("ask_ai.response_failure", {
        correlationId,
        code: appError.code,
        status: appError.status,
        details: includeDetails ? appError.details : undefined
      });
    }

    const payload = toApiErrorPayload(appError, correlationId, includeDetails);
    res.status(appError.status).json(payload);
  });

  return app;
}
