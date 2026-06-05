import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app/createApp.js";
import { createAskAiProvider } from "./providers/createAskAiProvider.js";
import { readServerConfig } from "./config/index.js";
import { createAskAiRequest, createGameContext, createZoneCardItem } from "./test-utils/requestBuilders.js";

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
          gameContext: {
            ...createGameContext(4),
            zones: {
              battlefield: [
                createZoneCardItem({
                  cardId: "rhystic-study",
                  name: "Rhystic Study",
                  oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
                  caster: undefined,
                  targets: [{ kind: "none" }]
                })
              ],
              stack: [
                createZoneCardItem({
                  caster: "Player 4",
                  targets: [{ kind: "none" }, { kind: "other", targetDescription: "retarget to token copy" }]
                })
              ]
            }
          }
        })
      );

    expect(response.status).toBe(200);
    expect(response.header["x-correlation-id"]).toBe("corr-success-1");
    expect(response.body.answer).toContain("MOCK RESPONSE");
    expect(response.body.answer).toContain("PROMPT STATS");
    expect(response.body.answer).toContain("FULL PROMPT (SENT TO PROVIDER)");
    expect(response.body.answer).toContain("QUESTION\nHow does this resolve?");
  });

  it("applies fallback question when blank question is submitted", async () => {
    const response = await request(app)
      .post("/api/ask-ai")
      .send(
        createAskAiRequest({
          question: "   ",
          gameContext: {
            ...createGameContext(),
            zones: { stack: [createZoneCardItem({ name: "Counterspell" })] }
          }
        })
      );

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("QUESTION\nResolve the stack");
  });

  it("applies board-state fallback question for blank battlefield-only submissions", async () => {
    const response = await request(app)
      .post("/api/ask-ai")
      .send(
        createAskAiRequest({
          question: "   ",
          gameContext: {
            ...createGameContext(),
            selectedZones: ["battlefield", "stack"],
            zones: {
              battlefield: [
                createZoneCardItem({
                  cardId: "rhystic-study",
                  name: "Rhystic Study",
                  oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
                  caster: undefined
                })
              ]
            }
          }
        })
      );

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain(
      "QUESTION\nExplain the interaction with the provided game state"
    );
  });

  it("returns validation error payload for invalid request shape", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "oops",
      gameContext: {
        playerCount: 2,
        players: [
          { label: "Player 1", lifeTotal: 20 },
          { label: "Player 2", lifeTotal: 20 }
        ]
        // missing: turnPhase, selectedZones
      }
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
      .send(
        createAskAiRequest({
          gameContext: {
            ...createGameContext(),
            zones: {
              stack: [{ ...createZoneCardItem(), caster: "Player 9" as never }]
            }
          }
        })
      );
    expect(badCasterResponse.status).toBe(400);
    expect(badCasterResponse.body.code).toBe("VALIDATION_ERROR");
    expect(badCasterResponse.body.message).toContain("gameContext.zones.stack.0.caster");

    const badTargetResponse = await request(app)
      .post("/api/ask-ai")
      .send(
        createAskAiRequest({
          gameContext: {
            ...createGameContext(),
            zones: {
              stack: [{ ...createZoneCardItem(), targets: [{ kind: "other" } as never] }]
            }
          }
        })
      );
    expect(badTargetResponse.status).toBe(400);
    expect(badTargetResponse.body.code).toBe("VALIDATION_ERROR");
    expect(badTargetResponse.body.message).toContain("gameContext.zones.stack.0.targets.0.targetDescription");
  });

  it("rejects control characters in free-text input fields", async () => {
    const response = await request(app).post("/api/ask-ai").send(
      createAskAiRequest({
        question: "Can this resolve?\u0007",
        gameContext: {
          ...createGameContext(),
          zones: { stack: [createZoneCardItem({ contextNotes: "targets player\u0000 unexpectedly" })] }
        }
      })
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("contains unsupported control characters");
  });

  it("returns validation error when prompt budget is exceeded", async () => {
    const largeCard = (id: string, name: string) =>
      createZoneCardItem({ cardId: id, name, contextNotes: "x".repeat(280), caster: undefined });
    const response = await request(app).post("/api/ask-ai").send(
      createAskAiRequest({
        question: "prompt budget check",
        gameContext: {
          ...createGameContext(4),
          selectedZones: ["stack", "battlefield", "hand", "graveyard", "exile"],
          zones: {
            stack: Array.from({ length: 10 }, (_, i) =>
              createZoneCardItem({
                cardId: `card-${i}`,
                name: `Card ${i}`,
                oracleText: "z".repeat(1000),
                contextNotes: "y".repeat(280)
              })
            ),
            battlefield: Array.from({ length: 30 }, (_, i) => largeCard(`bf-${i}`, `Permanent ${i}`)),
            hand: Array.from({ length: 20 }, (_, i) => largeCard(`hand-${i}`, `Hand Card ${i}`)),
            graveyard: Array.from({ length: 30 }, (_, i) => largeCard(`gy-${i}`, `Graveyard Card ${i}`)),
            exile: Array.from({ length: 30 }, (_, i) => largeCard(`ex-${i}`, `Exile Card ${i}`))
          }
        }
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

  it("maps openai provider failures through API error contract", async () => {
    const fakeOpenAiClient = {
      responses: {
        async create() {
          return {};
        }
      }
    };

    const appWithOpenAiProvider = createApp({
      askAiProvider: createAskAiProvider(
        readServerConfig({
          ASK_AI_PROVIDER: "openai",
          OPENAI_API_KEY: "sk-test",
          OPENAI_MODEL: "gpt-4.1-mini"
        }),
        { openAiClient: fakeOpenAiClient }
      )
    });

    const response = await request(appWithOpenAiProvider).post("/api/ask-ai").send(createAskAiRequest());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PROVIDER_UNAVAILABLE");
    expect(response.body.message).toBe("Miho is working on it");
    expect(response.body.retryAfterSeconds).toBe(13);
  });

  it("returns validation error when zones object contains an empty array", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "oops",
      gameContext: {
        ...createGameContext(),
        zones: { stack: [] }
      }
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when no selected zone contains a card", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "How does this resolve?",
      gameContext: {
        ...createGameContext(),
        zones: {}
      }
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("gameContext.zones");
  });
});
