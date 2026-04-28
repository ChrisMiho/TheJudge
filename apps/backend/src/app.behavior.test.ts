import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { PreparedPromptInput } from "./promptPreparation.js";
import { createAskAiRequest } from "./test-utils/requestBuilders.js";

describe("ask-ai route behavior", () => {
  it("delegates answer generation through provider boundary", async () => {
    const providerCalls: PreparedPromptInput[] = [];
    const appWithProvider = createApp({
      askAiProvider: {
        generateAnswer(preparedPrompt) {
          providerCalls.push(preparedPrompt);
          return { answer: "Provider boundary response" };
        }
      }
    });

    const response = await request(appWithProvider).post("/api/ask-ai").send(createAskAiRequest({ question: "Boundary check" }));

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe("Provider boundary response");
    expect(providerCalls).toHaveLength(1);
    expect(providerCalls[0]?.context.finalQuestion).toBe("Boundary check");
    expect(providerCalls[0]?.context.orderedStack).toHaveLength(1);
  });

  it("maps timeout-like provider exceptions to provider-timeout status/code", async () => {
    const appWithTimeoutProvider = createApp({
      askAiProvider: {
        generateAnswer() {
          throw new Error("provider timeout while contacting upstream");
        }
      }
    });

    const response = await request(appWithTimeoutProvider).post("/api/ask-ai").send(createAskAiRequest());

    expect(response.status).toBe(504);
    expect(response.body.code).toBe("PROVIDER_TIMEOUT");
    expect(response.body.message).toBe("Miho is working on it");
    expect(response.body.retryAfterSeconds).toBe(13);
  });

  it("includes provider error details in development mode responses", async () => {
    const appWithDebugDetails = createApp({
      debugLoggingEnabled: true,
      askAiProvider: {
        generateAnswer() {
          throw new Error("bedrock client unavailable in this environment");
        }
      }
    });

    const response = await request(appWithDebugDetails).post("/api/ask-ai").send(createAskAiRequest());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PROVIDER_UNAVAILABLE");
    expect(response.body.metadata).toMatchObject({
      correlationId: expect.any(String),
      details: "bedrock client unavailable in this environment"
    });
  });

  it("includes full request payload in lifecycle logs when payload logging is enabled", async () => {
    const events: Array<{ level: "info" | "error"; event: string; payload?: Record<string, unknown> }> = [];
    const appWithPayloadLogging = createApp({
      debugLoggingEnabled: true,
      payloadLoggingEnabled: true,
      logger: {
        info(event, payload) {
          events.push({ level: "info", event, payload });
        },
        error(event, payload) {
          events.push({ level: "error", event, payload });
        }
      },
      askAiProvider: {
        generateAnswer() {
          return { answer: "ok" };
        }
      }
    });

    await request(appWithPayloadLogging).post("/api/ask-ai").send(createAskAiRequest({ question: "payload logging check" }));

    const requestReceivedEvent = events.find((entry) => entry.event === "ask_ai.request_received");
    expect(requestReceivedEvent?.payload?.requestPayload).toMatchObject({
      question: "payload logging check"
    });
  });

  it("omits full request payload from lifecycle logs when payload logging is disabled", async () => {
    const events: Array<{ level: "info" | "error"; event: string; payload?: Record<string, unknown> }> = [];
    const appWithoutPayloadLogging = createApp({
      debugLoggingEnabled: true,
      payloadLoggingEnabled: false,
      logger: {
        info(event, payload) {
          events.push({ level: "info", event, payload });
        },
        error(event, payload) {
          events.push({ level: "error", event, payload });
        }
      },
      askAiProvider: {
        generateAnswer() {
          return { answer: "ok" };
        }
      }
    });

    await request(appWithoutPayloadLogging)
      .post("/api/ask-ai")
      .send(createAskAiRequest({ question: "payload logging disabled check" }));

    const requestReceivedEvent = events.find((entry) => entry.event === "ask_ai.request_received");
    expect(requestReceivedEvent?.payload?.requestPayload).toBeUndefined();
  });

  it("logs lifecycle events with shared correlation id", async () => {
    const events: Array<{ level: "info" | "error"; event: string; payload?: Record<string, unknown> }> = [];
    const appWithLogger = createApp({
      logger: {
        info(event, payload) {
          events.push({ level: "info", event, payload });
        },
        error(event, payload) {
          events.push({ level: "error", event, payload });
        }
      },
      askAiProvider: {
        generateAnswer() {
          return { answer: "Provider boundary response" };
        }
      }
    });

    const response = await request(appWithLogger)
      .post("/api/ask-ai")
      .set("X-Correlation-Id", "corr-test-123")
      .send(createAskAiRequest({ question: "Boundary check" }));

    expect(response.status).toBe(200);
    const eventNames = events.map((entry) => entry.event);
    expect(eventNames).toContain("ask_ai.request_received");
    expect(eventNames).toContain("ask_ai.request_validation_succeeded");
    expect(eventNames).toContain("ask_ai.prompt_context_build_started");
    expect(eventNames).toContain("ask_ai.provider_invocation_started");
    expect(eventNames).toContain("ask_ai.provider_invocation_completed");
    expect(eventNames).toContain("ask_ai.prompt_context_build_completed");
    expect(eventNames).toContain("ask_ai.response_success");

    const correlationIds = events
      .map((entry) => entry.payload?.correlationId)
      .filter((value): value is string => typeof value === "string");
    expect(correlationIds.length).toBeGreaterThan(0);
    expect(new Set(correlationIds)).toEqual(new Set(["corr-test-123"]));
  });
});
