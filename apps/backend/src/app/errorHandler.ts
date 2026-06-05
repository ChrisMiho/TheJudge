import type { NextFunction, Request, Response } from "express";
import {
  AppError,
  createUnexpectedError
} from "../errors.js";
import { resolveCorrelationId, type AppLogger } from "../logging.js";
import type { AskAiError } from "../types/index.js";

export function toValidationErrorMessage(issues: { path: (string | number)[]; message: string }[]): string {
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

export function createErrorHandler(logger: AppLogger, isDebug: boolean) {
  return (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
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
  };
}
