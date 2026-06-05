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
    turnPhase: "stack_resolving",
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
});
