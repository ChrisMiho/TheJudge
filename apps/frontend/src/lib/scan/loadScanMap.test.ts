import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("loadScanMap", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch the scan map until invoked", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await import("./loadScanMap");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches once across repeated calls and returns the parsed scan map", async () => {
    const payload = {
      "printing-opt": { oracleId: "opt", name: "Opt" }
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);
    const { loadScanMap } = await import("./loadScanMap");

    const first = loadScanMap();
    const second = loadScanMap();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/cardScanMap.json");
    await expect(first).resolves.toEqual(payload);
    await expect(second).resolves.toBe(await first);
  });

  it("throws when the scan map cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("missing", { status: 404, statusText: "Not Found" }))
    );
    const { loadScanMap } = await import("./loadScanMap");

    await expect(loadScanMap()).rejects.toThrow("Could not load card scan map: 404 Not Found");
  });
});
