import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeDb } from "../dbformat";

function dbResponse(): Response {
  const bytes = writeDb({ ids: ["a", "b"], hashes: new Uint8Array(2 * 96), count: 2 });
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body);
}

const scanMapPayload = { a: { oracleId: "o", name: "A" } };

describe("Frontend - Card Scan", () => {
  describe("loadScanResources", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("hands every scanner the same identifier and downloads each file once", async () => {
      const fetchMock = vi.fn(async (url: string) =>
        url.endsWith("cardhashes.bin") ? dbResponse() : new Response(JSON.stringify(scanMapPayload))
      );
      vi.stubGlobal("fetch", fetchMock);
      const { loadScanResources } = await import("../loadScanResources");

      const [first, second] = await Promise.all([loadScanResources(), loadScanResources()]);
      const third = await loadScanResources();

      expect(second.identifier).toBe(first.identifier);
      expect(third.identifier).toBe(first.identifier);
      expect(first.scanMap).toEqual(scanMapPayload);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not download anything until called", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      await import("../loadScanResources");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("clears on rejection so the next call rebuilds", async () => {
      let fail = true;
      const fetchMock = vi.fn(async (url: string) => {
        if (fail) return new Response("down", { status: 503, statusText: "Service Unavailable" });
        return url.endsWith("cardhashes.bin") ? dbResponse() : new Response(JSON.stringify(scanMapPayload));
      });
      vi.stubGlobal("fetch", fetchMock);
      const { loadScanResources } = await import("../loadScanResources");

      await expect(loadScanResources()).rejects.toThrow("503");
      fail = false;
      const rebuilt = await loadScanResources();

      expect(rebuilt.identifier).toBeDefined();
      expect(await loadScanResources()).toBe(rebuilt);
    });
  });
});
