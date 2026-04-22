import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { AskAiRequest } from "./types.js";

const app = createApp();

function createStackItem(overrides: Partial<AskAiRequest["stack"][number]> = {}): AskAiRequest["stack"][number] {
  return {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1, then draw a card.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: [],
    ...overrides
  };
}

describe("backend contract tests", () => {
  it("returns health ok", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns mock answer on valid ask-ai request", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "How does this resolve?",
      stack: [createStackItem()]
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.answer).toBe("string");
    expect(response.body.answer).toContain("MOCK RESPONSE");
    expect(response.body.answer).toContain("Final question: How does this resolve?");
    expect(response.body.answer).toContain("Stack order convention: bottom-to-top");
    expect(response.body.answer).toContain("1. [top] Opt (cardId: opt)");
    expect(response.body.answer).toContain("Mana: {U} | MV: 1");
  });

  it("applies fallback question when blank question is submitted", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "   ",
      stack: [
        createStackItem({
          cardId: "counterspell",
          name: "Counterspell",
          oracleText: "Counter target spell.",
          manaCost: "{U}{U}",
          manaValue: 2
        })
      ]
    });

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("Final question: Resolve the stack");
  });

  it("includes explicit stack order metadata in mock answer payload", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "Order check",
      stack: [
        createStackItem({
          cardId: "bottom",
          name: "Bottom Spell",
          oracleText: "Bottom oracle text.",
          manaCost: "{1}{G}",
          manaValue: 2,
          typeLine: "Creature — Elf",
          colors: ["G"],
          subtypes: ["Elf"]
        }),
        createStackItem({
          cardId: "top",
          name: "Top Spell",
          oracleText: "Top oracle text.",
          manaCost: "{2}{R}",
          manaValue: 3,
          typeLine: "Sorcery",
          colors: ["R"]
        })
      ]
    });

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("Stack order convention: bottom-to-top");
    expect(response.body.answer).toContain("1. [bottom] Bottom Spell (cardId: bottom)");
    expect(response.body.answer).toContain("2. [top] Top Spell (cardId: top)");
  });

  it("returns 400 for invalid payload shape", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "oops",
      stack: []
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request payload");
    expect(response.body.retryAfterSeconds).toBe(13);
  });

  it("returns 502 with retry hint when fail=true", async () => {
    const response = await request(app).post("/api/ask-ai?fail=true").send({
      question: "fail path",
      stack: [
        createStackItem({
          cardId: "bolt",
          name: "Lightning Bolt",
          oracleText: "Deal 3 damage to any target.",
          manaCost: "{R}",
          manaValue: 1,
          colors: ["R"]
        })
      ]
    });

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("Miho is working on it");
    expect(response.body.retryAfterSeconds).toBe(13);
  });

  it("delegates answer generation through provider boundary", async () => {
    const providerCalls: AskAiRequest[] = [];
    const appWithProvider = createApp({
      askAiProvider: {
        generateAnswer(requestPayload) {
          providerCalls.push(requestPayload);
          return { answer: "Provider boundary response" };
        }
      }
    });

    const response = await request(appWithProvider).post("/api/ask-ai").send({
      question: "Boundary check",
      stack: [createStackItem()]
    });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe("Provider boundary response");
    expect(providerCalls).toHaveLength(1);
    expect(providerCalls[0].question).toBe("Boundary check");
  });
});
