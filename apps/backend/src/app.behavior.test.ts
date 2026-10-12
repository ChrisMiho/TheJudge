import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app/createApp.js";
import { mockAskAiProvider } from "./providers/mockAskAiProvider.js";
import { buildPerCardSearchTexts, buildRetrievalQueryText, type PreparedPromptInput } from "./prompt/preparation.js";
import type { EmbeddingProvider } from "./providers/embeddingProvider.js";
import { createAskAiRequest } from "./test-utils/requestBuilders.js";

describe("Backend - Ask AI", () => {
  describe("route behavior", () => {
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
      expect(
        providerCalls[0] && "orderedStack" in providerCalls[0].context
          ? providerCalls[0].context.orderedStack
          : undefined
      ).toHaveLength(1);
    });

    it("adds official rulings to prepared prompt through app dependency injection", async () => {
      const providerCalls: PreparedPromptInput[] = [];
      const appWithRulings = createApp({
        cardRulingsIndex: new Map([
          ["opt", [{ publishedAt: "2020-04-17", comment: "Use the published ruling as reference." }]]
        ]),
        askAiProvider: {
          generateAnswer(preparedPrompt) {
            providerCalls.push(preparedPrompt);
            return { answer: "ok" };
          }
        }
      });

      const response = await request(appWithRulings).post("/api/ask-ai").send(createAskAiRequest());

      expect(response.status).toBe(200);
      expect(providerCalls[0]?.promptText).not.toContain("OFFICIAL RULINGS");
      expect(providerCalls[0]?.promptText).toContain("Rulings for Opt (published by Wizards of the Coast; apply one only when the situation matches it):");
      expect(providerCalls[0]?.promptText).toContain("- 2020-04-17: Use the published ruling as reference.");
      expect(providerCalls[0]?.diagnostics.rulingsCardCount).toBe(1);
    });

    it("embeds a follow-up's opening question, not the follow-up text, and hands the prompt the opening question's rules (REQ-246, REQ-181)", async () => {
      const embedded: string[] = [];
      const recordingEmbedder: EmbeddingProvider = {
        async embed(text) {
          embedded.push(text);
          return null;
        }
      };
      const providerCalls: PreparedPromptInput[] = [];
      const app = createApp({
        embeddingProvider: recordingEmbedder,
        askAiProvider: {
          generateAnswer(preparedPrompt) {
            providerCalls.push(preparedPrompt);
            return { answer: "ok" };
          }
        }
      });
      const opening = createAskAiRequest({ question: "How does copying a spell work while it is on the stack?" });
      const followUp = {
        ...opening,
        question: "I don't think that's right. Can you check it again?",
        conversationHistory: [
          { role: "user" as const, content: opening.question },
          { role: "assistant" as const, content: "A first answer." }
        ]
      };

      await request(app).post("/api/ask-ai").send(opening).expect(200);
      const openingEmbedded = [...embedded];
      embedded.length = 0;
      await request(app).post("/api/ask-ai").send(followUp).expect(200);

      expect(openingEmbedded[0]).toBe(buildRetrievalQueryText(opening));
      expect(embedded).toEqual(openingEmbedded);
      expect(embedded.join("\n")).not.toContain("check it again");
      expect(embedded[0]).toBe(buildRetrievalQueryText(followUp));
      expect(buildPerCardSearchTexts(followUp)).toEqual(buildPerCardSearchTexts(opening));
      // The prompt's QUESTION is still the follow-up text, with the history attached.
      expect(providerCalls[1]?.promptText.endsWith("QUESTION\nI don't think that's right. Can you check it again?")).toBe(true);
      expect(providerCalls[1]?.promptText).toContain("CONVERSATION HISTORY");
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
            throw new Error("openai client unavailable in this environment");
          }
        }
      });

      const response = await request(appWithDebugDetails).post("/api/ask-ai").send(createAskAiRequest());

      expect(response.status).toBe(503);
      expect(response.body.code).toBe("PROVIDER_UNAVAILABLE");
      expect(response.body.metadata).toMatchObject({
        correlationId: expect.any(String),
        details: "openai client unavailable in this environment"
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

    it("mock provider returns context, diagnostics, and enrichmentDebug sidecars when collectEnrichmentDebug is true", async () => {
      const appWithMock = createApp({
        askAiProvider: mockAskAiProvider,
        collectEnrichmentDebug: true
      });

      const response = await request(appWithMock).post("/api/ask-ai").send(createAskAiRequest());

      expect(response.status).toBe(200);
      expect(response.body.answer).toContain("MOCK RESPONSE");
      expect(response.body.context).toBeDefined();
      expect(response.body.diagnostics).toBeDefined();
      expect(response.body.enrichmentDebug).toBeDefined();
      expect(response.body.enrichmentDebug.supplemental).toBeDefined();
      expect(response.body.enrichmentDebug.curatedGameRules).toBeDefined();
      expect(response.body.enrichmentDebug.rulings).toBeDefined();
    });

    it("mock provider omits sidecars beyond answer when collectEnrichmentDebug is not set", async () => {
      const appWithMock = createApp({
        askAiProvider: mockAskAiProvider
      });

      const response = await request(appWithMock).post("/api/ask-ai").send(createAskAiRequest());

      expect(response.status).toBe(200);
      expect(response.body.answer).toContain("MOCK RESPONSE");
      expect(response.body.enrichmentDebug).toBeUndefined();
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

    it("logs answer-size diagnostics when provider invocation completes", async () => {
      const events: Array<{ level: "info" | "error"; event: string; payload?: Record<string, unknown> }> = [];
      const providerAnswer = "123456789";
      const appWithLogger = createApp({
        askAiProviderMode: "openai",
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
            return { answer: providerAnswer };
          }
        }
      });

      const response = await request(appWithLogger)
        .post("/api/ask-ai")
        .set("X-Correlation-Id", "corr-size-123")
        .send(createAskAiRequest({ question: "Answer size check" }));

      expect(response.status).toBe(200);
      const completedEvent = events.find((entry) => entry.event === "ask_ai.provider_invocation_completed");
      expect(completedEvent?.payload).toMatchObject({
        correlationId: "corr-size-123",
        providerElapsedMs: expect.any(Number),
        answerChars: providerAnswer.length,
        estimatedAnswerTokens: Math.ceil(providerAnswer.length / 4),
        charsPerTokenEstimate: 4
      });
    });

    it("omits answer-size diagnostics outside live openai provider mode", async () => {
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
            return { answer: "default provider answer" };
          }
        }
      });

      const response = await request(appWithLogger)
        .post("/api/ask-ai")
        .set("X-Correlation-Id", "corr-mock-size-123")
        .send(createAskAiRequest({ question: "Default provider size check" }));

      expect(response.status).toBe(200);
      const completedEvent = events.find((entry) => entry.event === "ask_ai.provider_invocation_completed");
      expect(completedEvent?.payload).toMatchObject({
        correlationId: "corr-mock-size-123",
        providerElapsedMs: expect.any(Number)
      });
      expect(completedEvent?.payload).not.toHaveProperty("answerChars");
      expect(completedEvent?.payload).not.toHaveProperty("estimatedAnswerTokens");
      expect(completedEvent?.payload).not.toHaveProperty("charsPerTokenEstimate");
    });
  });
});
