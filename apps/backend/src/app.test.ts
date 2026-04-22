import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp();

describe("backend contract tests", () => {
  it("returns health ok", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns mock answer on valid ask-ai request", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "How does this resolve?",
      stack: [
        {
          cardId: "opt",
          name: "Opt",
          oracleText: "Scry 1, then draw a card.",
          imageUrl: ""
        }
      ]
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.answer).toBe("string");
    expect(response.body.answer).toContain("MOCK RESPONSE");
    expect(response.body.answer).toContain("How does this resolve?");
  });

  it("applies fallback question when blank question is submitted", async () => {
    const response = await request(app).post("/api/ask-ai").send({
      question: "   ",
      stack: [
        {
          cardId: "counterspell",
          name: "Counterspell",
          oracleText: "Counter target spell.",
          imageUrl: ""
        }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("\"question\": \"Resolve the stack\"");
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
        {
          cardId: "bolt",
          name: "Lightning Bolt",
          oracleText: "Deal 3 damage to any target.",
          imageUrl: ""
        }
      ]
    });

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("Miho is working on it");
    expect(response.body.retryAfterSeconds).toBe(13);
  });
});
