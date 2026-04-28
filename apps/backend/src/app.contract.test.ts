import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createAskAiProvider } from "./providers/createAskAiProvider.js";
import { readServerConfig } from "./config.js";
import { createAskAiRequest, createGameContext, createStackItem } from "./test-utils/requestBuilders.js";

const app = createApp();

describe("ask-ai endpoint contract", () => {
  it("returns health ok", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns deterministic mock answer for valid ask-ai request", async () => {
    const response = await request(app)
      .post("/api/ask-ai")
      .set("X-Correlation-Id", "corr-success-1")
      .send(
        createAskAiRequest({
          gameContext: createGameContext(4),
          battlefieldContext: [{ name: "Rhystic Study", targets: [{ kind: "none" }] }],
          stack: [
            createStackItem({
              caster: "Player 4",
              targets: [{ kind: "none" }, { kind: "other", targetDescription: "retarget to token copy" }]
            })
          ]
        })
      );

    expect(response.status).toBe(200);
    expect(response.header["x-correlation-id"]).toBe("corr-success-1");
    expect(response.body.answer).toContain("MOCK RESPONSE");
    expect(response.body.answer).toContain("Final question: How does this resolve?");
  });

  it("applies fallback question when blank question is submitted", async () => {
    const response = await request(app)
      .post("/api/ask-ai")
      .send(createAskAiRequest({ question: "   ", stack: [createStackItem({ name: "Counterspell" })] }));

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("Final question: Resolve the stack");
  });

  it("returns validation error payload for invalid request shape", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "oops",
      gameContext: createGameContext(),
      battlefieldContext: [],
      stack: []
    });

    expect(response.status).toBe(400);
    expect(response.header["x-correlation-id"]).toMatch(/^srv-/);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("Invalid request payload:");
    expect(response.body.metadata.correlationId).toMatch(/^srv-/);
    expect(response.body.retryAfterSeconds).toBeUndefined();
  });

  it("returns validation error for malformed caster and target fields", async () => {
    const badCasterResponse = await request(app)
      .post("/api/ask-ai")
      .send(createAskAiRequest({ stack: [{ ...createStackItem(), caster: "Player 5" }] }));
    expect(badCasterResponse.status).toBe(400);
    expect(badCasterResponse.body.code).toBe("VALIDATION_ERROR");
    expect(badCasterResponse.body.message).toContain("stack.0.caster");

    const badTargetResponse = await request(app)
      .post("/api/ask-ai")
      .send(createAskAiRequest({ stack: [{ ...createStackItem(), targets: [{ kind: "other" }] }] }));
    expect(badTargetResponse.status).toBe(400);
    expect(badTargetResponse.body.code).toBe("VALIDATION_ERROR");
    expect(badTargetResponse.body.message).toContain("stack.0.targets.0.targetDescription");
  });

  it("returns validation error when prompt budget is exceeded", async () => {
    const response = await request(app).post("/api/ask-ai").send(
      createAskAiRequest({
        question: "prompt budget check",
        gameContext: createGameContext(4),
        battlefieldContext: Array.from({ length: 16 }, (_, index) => ({
          name: `Permanent ${index + 1}`,
          details: "x".repeat(280),
          targets: [{ kind: "none" }]
        })),
        stack: Array.from({ length: 10 }, (_, index) =>
          createStackItem({
            cardId: `card-${index}`,
            name: `Card ${index}`,
            oracleText: "z".repeat(1000),
            contextNotes: "y".repeat(280)
          })
        )
      })
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("prompt exceeds max budget");
  });

  it("returns provider-unavailable contract for forced fail query", async () => {
    const response = await request(app).post("/api/ask-ai?fail=true").send(createAskAiRequest());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PROVIDER_UNAVAILABLE");
    expect(response.body.message).toBe("Miho is working on it");
    expect(response.body.metadata.correlationId).toMatch(/^srv-/);
    expect(response.body.retryAfterSeconds).toBe(13);
  });

  it("maps bedrock readiness provider failures through API error contract", async () => {
    const appWithBedrockReadiness = createApp({
      askAiProvider: createAskAiProvider(
        readServerConfig({
          ASK_AI_PROVIDER: "bedrock",
          AWS_REGION: "us-east-1",
          BEDROCK_MODEL_ID: "anthropic.claude-v2"
        })
      )
    });

    const response = await request(appWithBedrockReadiness).post("/api/ask-ai").send(createAskAiRequest());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PROVIDER_UNAVAILABLE");
    expect(response.body.message).toBe("Miho is working on it");
    expect(response.body.retryAfterSeconds).toBe(13);
  });
});
