import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InDepthCarryContext, useInDepthCarry } from "./inDepthCarryContext";

describe("Frontend - Shared", () => {
  describe("In-depth carry context (REQ-206)", () => {
    it("is a no-op without a provider instead of throwing", () => {
      const { result } = renderHook(() => useInDepthCarry());

      expect(() => result.current.goToInDepthDetails([], "")).not.toThrow();
    });

    it("calls through to the provided implementation", () => {
      const goToInDepthDetails = vi.fn();
      const { result } = renderHook(() => useInDepthCarry(), {
        wrapper: ({ children }) => (
          <InDepthCarryContext.Provider value={{ goToInDepthDetails }}>{children}</InDepthCarryContext.Provider>
        )
      });

      const cards = [{ cardId: "urza", name: "Urza, Lord High Artificer", imageId: "img-urza", colors: ["U"] }];
      result.current.goToInDepthDetails(cards, "Tell me about Urza.");

      expect(goToInDepthDetails).toHaveBeenCalledWith(cards, "Tell me about Urza.");
    });
  });
});
