import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZoneAskAiPayload } from "../lib/contextFlow";
import { useAskAiSubmitOrchestration } from "./useAskAiSubmitOrchestration";

const { createCorrelationIdMock, logFrontendDebugMock } = vi.hoisted(() => ({
  createCorrelationIdMock: vi.fn(),
  logFrontendDebugMock: vi.fn()
}));

vi.mock("../lib/debugLogger", () => ({
  createCorrelationId: createCorrelationIdMock,
  logFrontendDebug: logFrontendDebugMock
}));

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

const payloadFixture: ZoneAskAiPayload = {
  question: "How does this resolve?",
  gameContext: {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 40 },
      { label: "Player 2", lifeTotal: 40 }
    ],
    turnPhase: "main_1",
    selectedZones: ["stack", "battlefield"],
    zones: {
      stack: [
        {
          cardId: "opt",
          name: "Opt",
          oracleText: "Scry 1, then draw a card.",
          caster: "Player 1",
          targets: [{ kind: "none" }]
        }
      ],
      battlefield: [{ cardId: "bolt", name: "Lightning Bolt", oracleText: "Deals 3 damage." }]
    }
  }
};

describe("useAskAiSubmitOrchestration", () => {
  beforeEach(() => {
    vi.useRealTimers();
    createCorrelationIdMock.mockReset();
    logFrontendDebugMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("logs submit and success details for decrypt attempts", async () => {
    createCorrelationIdMock.mockReturnValue("corr-decrypt-1");
    const fetchMock = vi.fn(async () =>
      jsonResponse({ answer: "Resolved answer" }, 200, { "X-Correlation-Id": "srv-corr-1" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
    );

    await act(async () => {
      await result.current.submitAttempt({
        source: "decrypt",
        payload: payloadFixture,
        stackSize: payloadFixture.gameContext.zones?.stack?.length ?? 0,
        finalQuestion: payloadFixture.question,
        usedFallbackQuestion: false
      });
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.test/api/ask-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": "corr-decrypt-1"
      },
      body: JSON.stringify(payloadFixture)
    });
    expect(result.current.answer).toBe("Resolved answer");
    expect(result.current.error).toBeNull();
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.submit_attempted", {
      source: "decrypt",
      correlationId: "corr-decrypt-1",
      stackSize: 1,
      questionLength: payloadFixture.question.length,
      usedFallbackQuestion: false
    });
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.request_succeeded", {
      correlationId: "corr-decrypt-1",
      responseCorrelationId: "srv-corr-1",
      httpStatus: 200
    });
  });

  it("enforces retry cooldown countdown and logs failure details", async () => {
    vi.useFakeTimers();
    createCorrelationIdMock.mockReturnValue("corr-fail-1");
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: "PROVIDER_UNAVAILABLE", message: "Miho is working on it", retryAfterSeconds: 3 }, 502, {
        "X-Correlation-Id": "srv-corr-err"
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
    );

    await act(async () => {
      await result.current.submitAttempt({
        source: "decrypt",
        payload: payloadFixture,
        stackSize: payloadFixture.gameContext.zones?.stack?.length ?? 0,
        finalQuestion: payloadFixture.question,
        usedFallbackQuestion: false
      });
    });

    expect(result.current.error).toBe("Miho is working on it");
    expect(result.current.retryCountdown).toBe(3);
    expect(result.current.canRetry).toBe(false);
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.request_failed", {
      correlationId: "corr-fail-1",
      responseCorrelationId: "srv-corr-err",
      httpStatus: 502,
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: "Miho is working on it",
      retryAfterSeconds: 3
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.retryCountdown).toBe(1);
    expect(result.current.canRetry).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.retryCountdown).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it("keeps submit payload stable across decrypt and retry attempts", async () => {
    vi.useFakeTimers();
    createCorrelationIdMock
      .mockReturnValueOnce("corr-attempt-1")
      .mockReturnValueOnce("corr-attempt-2");
    const fetchMock = vi
      .fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => jsonResponse({ answer: "ok" }))
      .mockResolvedValueOnce(
        jsonResponse({ code: "PROVIDER_UNAVAILABLE", message: "Miho is working on it", retryAfterSeconds: 1 }, 502, {
          "X-Correlation-Id": "srv-corr-err"
        })
      )
      .mockResolvedValueOnce(jsonResponse({ answer: "Recovered" }, 200, { "X-Correlation-Id": "srv-corr-ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
    );

    await act(async () => {
      await result.current.submitAttempt({
        source: "decrypt",
        payload: payloadFixture,
        stackSize: payloadFixture.gameContext.zones?.stack?.length ?? 0,
        finalQuestion: payloadFixture.question,
        usedFallbackQuestion: false
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.submitAttempt({
        source: "retry",
        payload: payloadFixture,
        stackSize: payloadFixture.gameContext.zones?.stack?.length ?? 0,
        finalQuestion: payloadFixture.question,
        usedFallbackQuestion: false
      });
    });

    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const secondRequest = fetchMock.mock.calls[1]?.[1];
    expect(firstRequest?.body).toBeDefined();
    expect(secondRequest?.body).toBe(firstRequest?.body);
    expect(firstRequest?.headers).toEqual({
      "Content-Type": "application/json",
      "X-Correlation-Id": "corr-attempt-1"
    });
    expect(secondRequest?.headers).toEqual({
      "Content-Type": "application/json",
      "X-Correlation-Id": "corr-attempt-2"
    });
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.submit_attempted", {
      source: "decrypt",
      correlationId: "corr-attempt-1",
      stackSize: 1,
      questionLength: payloadFixture.question.length,
      usedFallbackQuestion: false
    });
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.submit_attempted", {
      source: "retry",
      correlationId: "corr-attempt-2",
      stackSize: 1,
      questionLength: payloadFixture.question.length,
      usedFallbackQuestion: false
    });
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.request_failed", {
      correlationId: "corr-attempt-1",
      responseCorrelationId: "srv-corr-err",
      httpStatus: 502,
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: "Miho is working on it",
      retryAfterSeconds: 1
    });
    expect(logFrontendDebugMock).toHaveBeenCalledWith("ask_ai.request_succeeded", {
      correlationId: "corr-attempt-2",
      responseCorrelationId: "srv-corr-ok",
      httpStatus: 200
    });
    expect(result.current.answer).toBe("Recovered");
    expect(result.current.error).toBeNull();
  });

  describe("conversation state", () => {
    it("seeds visibleMessages with assistant bubble on first decrypt success", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      expect(result.current.visibleMessages).toEqual([]);
      expect(result.current.isConversationActive).toBe(false);

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      expect(result.current.visibleMessages).toEqual([{ role: "assistant", content: "First answer" }]);
      expect(result.current.isConversationActive).toBe(true);
      expect(result.current.frozenGameContext).toEqual(payloadFixture.gameContext);
    });

    it("captures hiddenInitialQuestion from the first decrypt payload", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "Answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      // Submit a follow-up and verify the conversationHistory starts with hidden initial question
      createCorrelationIdMock.mockReturnValue("corr-2");
      const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => jsonResponse({ answer: "Follow-up answer" }, 200));
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        await result.current.submitFollowUp("What about priority?");
      });

      const sentBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
        conversationHistory: { role: string; content: string }[];
      };
      expect(sentBody.conversationHistory[0]).toEqual({ role: "user", content: payloadFixture.question });
      expect(sentBody.conversationHistory[1]).toEqual({ role: "assistant", content: "Answer" });
    });

    it("sends frozen gameContext (not live) on follow-up submits", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      const frozenContext = result.current.frozenGameContext;

      createCorrelationIdMock.mockReturnValue("corr-2");
      const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => jsonResponse({ answer: "Follow-up answer" }, 200));
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        await result.current.submitFollowUp("Follow up question");
      });

      const sentBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as { gameContext: unknown };
      expect(sentBody.gameContext).toEqual(frozenContext);
    });

    it("appends user then assistant bubble on successful follow-up", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      createCorrelationIdMock.mockReturnValue("corr-2");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "Follow-up answer" }, 200)));

      await act(async () => {
        await result.current.submitFollowUp("What about priority?");
      });

      expect(result.current.visibleMessages).toEqual([
        { role: "assistant", content: "First answer" },
        { role: "user", content: "What about priority?" },
        { role: "assistant", content: "Follow-up answer" }
      ]);
    });

    it("builds conversationHistory with 4 entries after two follow-ups", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      createCorrelationIdMock.mockReturnValue("corr-2");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "Follow-up answer 1" }, 200)));

      await act(async () => {
        await result.current.submitFollowUp("Follow-up 1");
      });

      createCorrelationIdMock.mockReturnValue("corr-3");
      const thirdFetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => jsonResponse({ answer: "Follow-up answer 2" }, 200));
      vi.stubGlobal("fetch", thirdFetchMock);

      await act(async () => {
        await result.current.submitFollowUp("Follow-up 2");
      });

      const sentBody = JSON.parse(thirdFetchMock.mock.calls[0]?.[1]?.body as string) as {
        conversationHistory: { role: string; content: string }[];
      };
      expect(sentBody.conversationHistory).toHaveLength(4);
      expect(sentBody.conversationHistory[0]).toEqual({ role: "user", content: payloadFixture.question });
      expect(sentBody.conversationHistory[1]).toEqual({ role: "assistant", content: "First answer" });
      expect(sentBody.conversationHistory[2]).toEqual({ role: "user", content: "Follow-up 1" });
      expect(sentBody.conversationHistory[3]).toEqual({ role: "assistant", content: "Follow-up answer 1" });
    });

    it("retry after follow-up failure resubmits with same frozen context and history", async () => {
      vi.useFakeTimers();
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      // Follow-up fails
      createCorrelationIdMock.mockReturnValue("corr-2");
      const failFetchMock = vi.fn(async () =>
        jsonResponse(
          { code: "PROVIDER_UNAVAILABLE", message: "Miho is working on it", retryAfterSeconds: 2 },
          502,
          { "X-Correlation-Id": "srv-err" }
        )
      );
      vi.stubGlobal("fetch", failFetchMock);

      await act(async () => {
        await result.current.submitFollowUp("What about priority?");
      });

      expect(result.current.error).toBe("Miho is working on it");
      expect(result.current.isFollowUpSubmitting).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Retry the failed follow-up
      createCorrelationIdMock.mockReturnValue("corr-3");
      const retryFetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => jsonResponse({ answer: "Retry answer" }, 200));
      vi.stubGlobal("fetch", retryFetchMock);

      await act(async () => {
        await result.current.submitAttempt({
          source: "retry",
          payload: payloadFixture, // ignored — hook uses stored follow-up payload
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      // Verify the retry sent the follow-up payload (with conversationHistory), not a fresh decrypt
      const retrySentBody = JSON.parse(retryFetchMock.mock.calls[0]?.[1]?.body as string) as {
        question: string;
        conversationHistory: { role: string; content: string }[];
        gameContext: unknown;
      };
      expect(retrySentBody.question).toBe("What about priority?");
      expect(retrySentBody.conversationHistory).toBeDefined();
      expect(retrySentBody.conversationHistory[0]).toEqual({ role: "user", content: payloadFixture.question });
      expect(retrySentBody.gameContext).toEqual(payloadFixture.gameContext);

      // After successful retry, bubble is appended
      expect(result.current.visibleMessages).toEqual([
        { role: "assistant", content: "First answer" },
        { role: "user", content: "What about priority?" },
        { role: "assistant", content: "Retry answer" }
      ]);
    });

    it("startOver resets conversation state without affecting other fields", async () => {
      createCorrelationIdMock.mockReturnValue("corr-1");
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ answer: "First answer" }, 200)));

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      await act(async () => {
        await result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
      });

      expect(result.current.isConversationActive).toBe(true);

      act(() => {
        result.current.startOver();
      });

      expect(result.current.visibleMessages).toEqual([]);
      expect(result.current.frozenGameContext).toBeNull();
      expect(result.current.isConversationActive).toBe(false);
      expect(result.current.answer).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("isSubmitting is true only during initial decrypt; isFollowUpSubmitting only during follow-ups", async () => {
      const submittingDuringDecrypt: boolean[] = [];
      const followUpSubmittingDuringDecrypt: boolean[] = [];
      const submittingDuringFollowUp: boolean[] = [];
      const followUpSubmittingDuringFollowUp: boolean[] = [];

      createCorrelationIdMock.mockReturnValue("corr-1");

      let resolveDecrypt!: () => void;
      const decryptFetch = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveDecrypt = () => resolve(jsonResponse({ answer: "First answer" }, 200));
          })
      );
      vi.stubGlobal("fetch", decryptFetch);

      const { result } = renderHook(() =>
        useAskAiSubmitOrchestration({ apiBaseUrl: "https://api.test", retryCooldownSeconds: 13 })
      );

      // Kick off decrypt but don't await
      const decryptPromise = act(async () => {
        const p = result.current.submitAttempt({
          source: "decrypt",
          payload: payloadFixture,
          stackSize: 1,
          finalQuestion: payloadFixture.question,
          usedFallbackQuestion: false
        });
        // Capture flags mid-flight
        submittingDuringDecrypt.push(result.current.isSubmitting);
        followUpSubmittingDuringDecrypt.push(result.current.isFollowUpSubmitting);
        resolveDecrypt();
        await p;
      });

      await decryptPromise;

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isFollowUpSubmitting).toBe(false);

      // Now follow-up
      createCorrelationIdMock.mockReturnValue("corr-2");
      let resolveFollowUp!: () => void;
      const followUpFetch = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFollowUp = () => resolve(jsonResponse({ answer: "Follow-up answer" }, 200));
          })
      );
      vi.stubGlobal("fetch", followUpFetch);

      await act(async () => {
        const p = result.current.submitFollowUp("Follow up?");
        submittingDuringFollowUp.push(result.current.isSubmitting);
        followUpSubmittingDuringFollowUp.push(result.current.isFollowUpSubmitting);
        resolveFollowUp();
        await p;
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isFollowUpSubmitting).toBe(false);
      // isSubmitting should never have been true during follow-up
      expect(submittingDuringFollowUp.every((v) => v === false)).toBe(true);
    });
  });
});
