import { describe, expect, it } from "vitest";

describe("Frontend - Shared", () => {
  describe("global browser history cleanup", () => {
    it("can leave a routed URL for the shared cleanup to reset", () => {
      window.history.replaceState(null, "", "/in-depth");

      expect(window.location.pathname).toBe("/in-depth");
    });

    it("starts the following case at bare root", () => {
      expect(window.location.pathname).toBe("/");
    });
  });
});
