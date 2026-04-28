export const ASK_AI_ERROR_CODES = [
  "VALIDATION_ERROR",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "UNEXPECTED_ERROR"
] as const;

export type AskAiErrorCode = (typeof ASK_AI_ERROR_CODES)[number];

type AppErrorParams = {
  code: AskAiErrorCode;
  status: number;
  message: string;
  retryAfterSeconds?: number;
  details?: string;
};

export class AppError extends Error {
  readonly code: AskAiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;
  readonly details?: string;

  constructor({ code, status, message, retryAfterSeconds, details }: AppErrorParams) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.details = details;
  }
}

export function createValidationError(message: string, details?: string): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details
  });
}

export function createProviderUnavailableError(message = "Miho is working on it", details?: string): AppError {
  return new AppError({
    code: "PROVIDER_UNAVAILABLE",
    status: 503,
    message,
    retryAfterSeconds: 13,
    details
  });
}

export function createProviderTimeoutError(message = "Miho is working on it", details?: string): AppError {
  return new AppError({
    code: "PROVIDER_TIMEOUT",
    status: 504,
    message,
    retryAfterSeconds: 13,
    details
  });
}

export function createUnexpectedError(message = "Miho is working on it", details?: string): AppError {
  return new AppError({
    code: "UNEXPECTED_ERROR",
    status: 500,
    message,
    details
  });
}

export function classifyProviderError(cause: unknown): AppError {
  if (cause instanceof AppError) {
    return cause;
  }

  const causeMessage = cause instanceof Error ? cause.message : String(cause);
  if (/timeout/i.test(causeMessage)) {
    return createProviderTimeoutError("Miho is working on it", causeMessage);
  }

  if (cause instanceof Error) {
    return createProviderUnavailableError("Miho is working on it", causeMessage);
  }

  return createProviderUnavailableError();
}
