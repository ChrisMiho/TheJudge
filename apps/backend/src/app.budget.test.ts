import { vi } from "vitest";

// getPromptDiagnostics internally reads MAX_PROMPT_CHAR_BUDGET from its own module scope,
// so mocking the exported constant alone doesn't change the function's behavior.
// We mock the function itself to force exceedsBudget: true, which exercises the route's
// budget-rejection code path. This is the only way to hit the 1M budget with valid input
// (schema caps mean a valid payload tops out at ~353K chars, well under 1M).
vi.mock("./prompt/normalization.js", async (importOriginal) => {
  const module = await importOriginal<typeof import("./prompt/normalization.js")>();
  return {
    ...module,
    getPromptDiagnostics: (...args: Parameters<typeof module.getPromptDiagnostics>) => ({
      ...module.getPromptDiagnostics(...args),
      exceedsBudget: true
    })
  };
});

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app/createApp.js";
import { createAskAiRequest, createGameContext, createZoneCardItem } from "./test-utils/requestBuilders.js";

const app = createApp();

describe("budget-exceeded contract", () => {
  it("returns validation error when prompt budget is exceeded", async () => {
    const response = await request(app)
      .post("/api/ask-ai")
      .send(
        createAskAiRequest({
          question: "prompt budget check",
          gameContext: {
            ...createGameContext(2),
            zones: { stack: [createZoneCardItem({ name: "Counterspell" })] }
          }
        })
      );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("prompt exceeds max budget");
  });
});
