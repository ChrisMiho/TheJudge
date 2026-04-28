import { useState } from "react";
import { createCorrelationId, logFrontendDebug } from "./debugLogger";
import type { AskAiError, AskAiRequest, AskAiResponse } from "../types";

type SubmitSource = "decrypt" | "retry";

type SubmitAttemptOptions = {
  source: SubmitSource;
  payload: AskAiRequest;
  stackSize: number;
  finalQuestion: string;
  usedFallbackQuestion: boolean;
};

type UseAskAiSubmitOrchestrationOptions = {
  apiBaseUrl: string;
  retryCooldownSeconds: number;
};

type UseAskAiSubmitOrchestrationResult = {
  answer: string | null;
  error: string | null;
  isSubmitting: boolean;
  retryCountdown: number;
  canRetry: boolean;
  submitAttempt: (options: SubmitAttemptOptions) => Promise<void>;
};

export function useAskAiSubmitOrchestration({
  apiBaseUrl,
  retryCooldownSeconds
}: UseAskAiSubmitOrchestrationOptions): UseAskAiSubmitOrchestrationResult {
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const canRetry = retryCountdown === 0 && !isSubmitting;

  function startRetryCooldown(seconds: number): void {
    setRetryCountdown(seconds);
    const intervalId = window.setInterval(() => {
      setRetryCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function submitRequest(payload: AskAiRequest, correlationId: string): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": correlationId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as AskAiError;
        const responseCorrelationId = response.headers.get("x-correlation-id")?.trim() || correlationId;
        logFrontendDebug("ask_ai.request_failed", {
          correlationId,
          responseCorrelationId,
          httpStatus: response.status,
          retryAfterSeconds: body.retryAfterSeconds ?? retryCooldownSeconds
        });
        setError("Miho is working on it");
        startRetryCooldown(body.retryAfterSeconds ?? retryCooldownSeconds);
        return;
      }

      const body = (await response.json()) as AskAiResponse;
      const responseCorrelationId = response.headers.get("x-correlation-id")?.trim() || correlationId;
      logFrontendDebug("ask_ai.request_succeeded", {
        correlationId,
        responseCorrelationId,
        httpStatus: response.status
      });
      setAnswer(body.answer);
      setError(null);
    } catch (submitError) {
      logFrontendDebug("ask_ai.request_failed", {
        correlationId,
        responseCorrelationId: correlationId,
        httpStatus: null,
        failureType: "network_or_unexpected",
        message: submitError instanceof Error ? submitError.message : "unknown"
      });
      setError("Miho is working on it");
      startRetryCooldown(retryCooldownSeconds);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitAttempt({
    source,
    payload,
    stackSize,
    finalQuestion,
    usedFallbackQuestion
  }: SubmitAttemptOptions): Promise<void> {
    const correlationId = createCorrelationId();
    logFrontendDebug("ask_ai.submit_attempted", {
      source,
      correlationId,
      stackSize,
      questionLength: finalQuestion.length,
      usedFallbackQuestion
    });
    await submitRequest(payload, correlationId);
  }

  return {
    answer,
    error,
    isSubmitting,
    retryCountdown,
    canRetry,
    submitAttempt
  };
}
