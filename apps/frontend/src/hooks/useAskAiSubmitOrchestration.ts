import { useState } from "react";
import { createCorrelationId, logFrontendDebug } from "../lib/debugLogger";
import { buildLookupAskAiRequest } from "../lib/contextFlow";
import { randomId } from "../lib/randomId";
import type { LookupAskAiPayload, LookupWireCard, ZoneAskAiPayload } from "../lib/contextFlow";
import type {
  AskAiError,
  AskAiResponse,
  ConversationMessage,
  GameContext
} from "../types";

type SubmitSource = "decrypt" | "retry";

type AskAiPayload = ZoneAskAiPayload | LookupAskAiPayload;

/** REQ-176: a frozen lookup context only ever needs to re-render identity
 * (image, name) and re-send identity on a follow-up — `LookupWireCard` is the
 * wire shape now, and it is what `payload.cards` actually is once built. */
export type FrozenAskAiContext =
  | { kind: "game"; gameContext: GameContext }
  | { kind: "lookup"; cards: LookupWireCard[] };

function isLookupAskAiPayload(payload: AskAiPayload): payload is LookupAskAiPayload {
  return "mode" in payload && payload.mode === "lookup";
}

type SubmitAttemptOptions = {
  source: SubmitSource;
  payload: AskAiPayload;
  stackSize: number;
  finalQuestion: string;
  usedFallbackQuestion: boolean;
};

type PendingRetry =
  | { kind: "decrypt"; payload: AskAiPayload; stackSize: number; finalQuestion: string; usedFallbackQuestion: boolean }
  | { kind: "followup"; payload: AskAiPayload; text: string };

export type ConversationUpdateSnapshot = {
  conversationId: string;
  frozenContext: FrozenAskAiContext;
  hiddenInitialQuestion: string;
  visibleMessages: ConversationMessage[];
};

export type RestoredConversationEntry = {
  id: string;
  frozenContext: FrozenAskAiContext;
  hiddenInitialQuestion: string;
  visibleMessages: ConversationMessage[];
};

type UseAskAiSubmitOrchestrationOptions = {
  apiBaseUrl: string;
  retryCooldownSeconds: number;
  onConversationUpdated?: (snapshot: ConversationUpdateSnapshot) => void;
};

type UseAskAiSubmitOrchestrationResult = {
  error: string | null;
  isSubmitting: boolean;
  isFollowUpSubmitting: boolean;
  retryCountdown: number;
  canRetry: boolean;
  /** True while a failed request is saved and Retry can resend it. */
  hasPendingRetry: boolean;
  retryPending: () => Promise<void>;
  visibleMessages: ConversationMessage[];
  frozenContext: FrozenAskAiContext | null;
  frozenGameContext: GameContext | null;
  isConversationActive: boolean;
  submitAttempt: (options: SubmitAttemptOptions) => Promise<void>;
  submitFollowUp: (text: string) => Promise<void>;
  startOver: () => void;
  restoreConversation: (entry: RestoredConversationEntry) => void;
};

export function useAskAiSubmitOrchestration({
  apiBaseUrl,
  retryCooldownSeconds,
  onConversationUpdated
}: UseAskAiSubmitOrchestrationOptions): UseAskAiSubmitOrchestrationResult {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUpSubmitting, setIsFollowUpSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<ConversationMessage[]>([]);
  const [frozenContext, setFrozenContext] = useState<FrozenAskAiContext | null>(null);
  const [hiddenInitialQuestion, setHiddenInitialQuestion] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);

  const canRetry = retryCountdown === 0 && !isSubmitting && !isFollowUpSubmitting;
  const frozenGameContext = frozenContext?.kind === "game" ? frozenContext.gameContext : null;
  const isConversationActive = visibleMessages.length > 0;

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
    payload: AskAiPayload,
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
      setError(null);
      setPendingRetry(null);
      const nextFrozenContext: FrozenAskAiContext = isLookupAskAiPayload(payload)
        ? { kind: "lookup", cards: payload.cards ?? [] }
        : { kind: "game", gameContext: payload.gameContext };
      // REQ-025 (amended): the player's own question opens the thread, shown first as a
      // right-aligned bubble exactly as sent — including the silent fallback — then the
      // assistant's answer underneath it.
      const nextVisibleMessages: ConversationMessage[] = [
        { role: "user", content: payload.question },
        { role: "assistant", content: body.answer }
      ];
      const nextConversationId = randomId("conv");
      setFrozenContext(nextFrozenContext);
      setHiddenInitialQuestion(payload.question);
      setVisibleMessages(nextVisibleMessages);
      setConversationId(nextConversationId);
      onConversationUpdated?.({
        conversationId: nextConversationId,
        frozenContext: nextFrozenContext,
        hiddenInitialQuestion: payload.question,
        visibleMessages: nextVisibleMessages
      });
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
    payload: AskAiPayload,
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
      const nextVisibleMessages: ConversationMessage[] = [
        ...visibleMessages,
        { role: "user", content: text },
        { role: "assistant", content: body.answer }
      ];
      setVisibleMessages(nextVisibleMessages);
      if (conversationId && frozenContext && hiddenInitialQuestion) {
        onConversationUpdated?.({
          conversationId,
          frozenContext,
          hiddenInitialQuestion,
          visibleMessages: nextVisibleMessages
        });
      }
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

  /** REQ-014: resend the saved failed request (decrypt or follow-up) with no new payload. */
  async function retryPending(): Promise<void> {
    if (!pendingRetry) return;
    const correlationId = createCorrelationId();

    if (pendingRetry.kind === "followup") {
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
      source: "retry",
      correlationId,
      stackSize: pendingRetry.stackSize,
      questionLength: pendingRetry.finalQuestion.length,
      usedFallbackQuestion: pendingRetry.usedFallbackQuestion
    });
    await doDecryptRequest(
      pendingRetry.payload,
      correlationId,
      pendingRetry.stackSize,
      pendingRetry.finalQuestion,
      pendingRetry.usedFallbackQuestion
    );
  }

  async function submitAttempt({
    source,
    payload,
    stackSize,
    finalQuestion,
    usedFallbackQuestion
  }: SubmitAttemptOptions): Promise<void> {
    if (source === "retry" && pendingRetry) {
      await retryPending();
      return;
    }

    const correlationId = createCorrelationId();
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
    if (!frozenContext || !hiddenInitialQuestion) return;

    const correlationId = createCorrelationId();

    // conversationHistory: visibleMessages already opens with the initial question (REQ-025
    // as amended), so it is the whole wire history verbatim — no separate prepend.
    const conversationHistory: ConversationMessage[] = visibleMessages;

    const followUpPayload: AskAiPayload =
      frozenContext.kind === "lookup"
        ? buildLookupAskAiRequest(text, frozenContext.cards, conversationHistory)
        : {
            question: text,
            gameContext: frozenContext.gameContext,
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
    setFrozenContext(null);
    setHiddenInitialQuestion(null);
    setConversationId(null);
    setPendingRetry(null);
    setError(null);
  }

  function restoreConversation(entry: RestoredConversationEntry): void {
    setFrozenContext(entry.frozenContext);
    setHiddenInitialQuestion(entry.hiddenInitialQuestion);
    setVisibleMessages(entry.visibleMessages);
    setConversationId(entry.id);
    setPendingRetry(null);
    setError(null);
    setRetryCountdown(0);
  }

  return {
    error,
    isSubmitting,
    isFollowUpSubmitting,
    retryCountdown,
    canRetry,
    hasPendingRetry: pendingRetry !== null,
    retryPending,
    visibleMessages,
    frozenContext,
    frozenGameContext,
    isConversationActive,
    submitAttempt,
    submitFollowUp,
    startOver,
    restoreConversation
  };
}
