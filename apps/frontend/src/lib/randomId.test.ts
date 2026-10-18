import { afterEach, describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "./debugLogger";
import { randomId } from "./randomId";
import { createInstanceId } from "./zoneCards";

describe("Frontend - Shared", () => {
  describe("randomId", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns the browser's UUID when it has one", () => {
      vi.stubGlobal("crypto", { randomUUID: () => "uuid-from-browser" });
      expect(randomId("conv")).toBe("uuid-from-browser");
      expect(createCorrelationId()).toBe("uuid-from-browser");
      expect(createInstanceId()).toBe("uuid-from-browser");
    });

    it("falls back to a prefixed time-and-random id, keeping each kind's own prefix", () => {
      vi.stubGlobal("crypto", {});
      expect(randomId("conv")).toMatch(/^conv-\d+-[0-9a-f]+$/);
      expect(createCorrelationId()).toMatch(/^corr-\d+-[0-9a-f]+$/);
      expect(createInstanceId()).toMatch(/^inst-\d+-[0-9a-f]+$/);
    });

    it("gives different ids on different calls", () => {
      vi.stubGlobal("crypto", {});
      expect(randomId("corr")).not.toBe(randomId("corr"));
    });
  });
});
