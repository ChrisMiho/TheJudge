import { useState } from "react";
import { createCorrelationId, logFrontendDebug } from "../lib/debugLogger";
import type { ZoneAskAiPayload } from "../lib/contextFlow";
import type { AskAiError, AskAiResponse, ConversationMessage, GameContext } from "../types";

type SubmitSource = "decrypt" | "retry";

type SubmitAttemptOptions = {
  source: SubmitSource;
  payload: ZoneAskAiPayload;
  stackSize: number;
  finalQuestion: string;
  usedFallbackQuestion: boolean;
};

type PendingRetry =
  | { kind: "decrypt"; payload: ZoneAskAiPayload; stackSize: number; finalQuestion: string; usedFallbackQuestion: boolean }
  | { kind: "followup"; payload: ZoneAskAiPayload; text: string };

type UseAskAiSubmitOrchestrationOptions = {
  apiBaseUrl: string;
  retryCooldownSeconds: number;
};

type UseAskAiSubmitOrchestrationResult = {
  answer: string | null;
  error: string | null;
  isSubmitting: boolean;
  isFollowUpSubmitting: boolean;
  retryCountdown: number;
  canRetry: boolean;
  visibleMessages: ConversationMessage[];
  frozenGameContext: GameContext | null;
  isConversationActive: boolean;
  submitAttempt: (options: SubmitAttemptOptions) => Promise<void>;
  submitFollowUp: (text: string) => Promise<void>;
  startOver: () => void;
};

export function useAskAiSubmitOrchestration({
  apiBaseUrl,
  retryCooldownSeconds
}: UseAskAiSubmitOrchestrationOptions): UseAskAiSubmitOrchestrationResult {
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUpSubmitting, setIsFollowUpSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<ConversationMessage[]>([]);
  const [frozenGameContext, setFrozenGameContext] = useState<GameContext | null>(null);
  const [hiddenInitialQuestion, setHiddenInitialQuestion] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);

  const canRetry = retryCountdown === 0 && !isSubmitting && !isFollowUpSubmitting;
  const isConversationActive = frozenGameContext !== null;

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

  async function doDecryptRequest(
    payload: ZoneAskAiPayload,
    correlationId: string,
    stackSize: number,
    finalQuestion: string,
    usedFallbackQuestion: boolean
  ): Promise<void> {
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
          errorCode: body.code,
          errorMessage: body.message,
          retryAfterSeconds: body.retryAfterSeconds ?? retryCooldownSeconds
        });
        setError(body.message || "Miho is working on it");
        startRetryCooldown(body.retryAfterSeconds ?? retryCooldownSeconds);
        setPendingRetry({ kind: "decrypt", payload, stackSize, finalQuestion, usedFallbackQuestion });
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
      setPendingRetry(null);
      setFrozenGameContext(payload.gameContext);
      setHiddenInitialQuestion(payload.question);
      setVisibleMessages([{ role: "assistant", content: body.answer }]);
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
      setPendingRetry({ kind: "decrypt", payload, stackSize, finalQuestion, usedFallbackQuestion });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function doFollowUpRequest(
    payload: ZoneAskAiPayload,
    text: string,
    correlationId: string
  ): Promise<void> {
    setIsFollowUpSubmitting(true);
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
          errorCode: body.code,
          errorMessage: body.message,
          retryAfterSeconds: body.retryAfterSeconds ?? retryCooldownSeconds
        });
        setError(body.message || "Miho is working on it");
        startRetryCooldown(body.retryAfterSeconds ?? retryCooldownSeconds);
        setPendingRetry({ kind: "followup", payload, text });
        return;
      }

      const body = (await response.json()) as AskAiResponse;
      const responseCorrelationId = response.headers.get("x-correlation-id")?.trim() || correlationId;
      logFrontendDebug("ask_ai.request_succeeded", {
        correlationId,
        responseCorrelationId,
        httpStatus: response.status
      });
      setError(null);
      setPendingRetry(null);
      setVisibleMessages((current) => [
        ...current,
        { role: "user", content: text },
        { role: "assistant", content: body.answer }
      ]);
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
      setPendingRetry({ kind: "followup", payload, text });
    } finally {
      setIsFollowUpSubmitting(false);
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

    if (source === "retry" && pendingRetry?.kind === "followup") {
      logFrontendDebug("ask_ai.submit_attempted", {
        source: "retry",
        correlationId,
        stackSize: 0,
        questionLength: pendingRetry.text.length,
        usedFallbackQuestion: false
      });
      await doFollowUpRequest(pendingRetry.payload, pendingRetry.text, correlationId);
      return;
    }

    logFrontendDebug("ask_ai.submit_attempted", {
      source,
      correlationId,
      stackSize,
      questionLength: finalQuestion.length,
      usedFallbackQuestion
    });
    await doDecryptRequest(payload, correlationId, stackSize, finalQuestion, usedFallbackQuestion);
  }

  async function submitFollowUp(text: string): Promise<void> {
    if (!frozenGameContext || !hiddenInitialQuestion) return;

    const correlationId = createCorrelationId();

    // conversationHistory: hidden initial question + all visible messages (assistant-first)
    const conversationHistory: ConversationMessage[] = [
      { role: "user", content: hiddenInitialQuestion },
      ...visibleMessages
    ];

    const followUpPayload: ZoneAskAiPayload = {
      question: text,
      gameContext: frozenGameContext,
      conversationHistory
    };

    logFrontendDebug("ask_ai.submit_attempted", {
      source: "followup",
      correlationId,
      stackSize: 0,
      questionLength: text.length,
      usedFallbackQuestion: false
    });

    await doFollowUpRequest(followUpPayload, text, correlationId);
  }

  function startOver(): void {
    setVisibleMessages([]);
    setFrozenGameContext(null);
    setHiddenInitialQuestion(null);
    setPendingRetry(null);
    setAnswer(null);
    setError(null);
  }

  return {
    answer,
    error,
    isSubmitting,
    isFollowUpSubmitting,
    retryCountdown,
    canRetry,
    visibleMessages,
    frozenGameContext,
    isConversationActive,
    submitAttempt,
    submitFollowUp,
    startOver
  };
}
