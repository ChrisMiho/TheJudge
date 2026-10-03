import { describe, expect, it } from "vitest";
import { MAX_LOOKUP_CARDS, MAX_STACK_SIZE } from "./stackLimits";

describe("Frontend - Shared caps", () => {
  it("shares the Stack's 10-card bound with Ask a Question's lookup cap (REQ-167 as amended, REQ-206)", () => {
    expect(MAX_LOOKUP_CARDS).toBe(10);
    expect(MAX_LOOKUP_CARDS).toBe(MAX_STACK_SIZE);
  });
});
