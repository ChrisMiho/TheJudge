import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Frontend - Card Scan", () => {
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

    await import("../loadScanMap");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches once across repeated calls and returns the parsed scan map", async () => {
    const payload = {
      "printing-opt": { oracleId: "opt", name: "Opt" }
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);
    const { loadScanMap } = await import("../loadScanMap");

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
    const { loadScanMap } = await import("../loadScanMap");

    await expect(loadScanMap()).rejects.toThrow("Could not load card scan map: 404 Not Found");
  });

  it("re-requests after a failed download and then reuses the arrived map (REQ-249)", async () => {
    const payload = { "printing-opt": { oracleId: "opt", name: "Opt" } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("down", { status: 503, statusText: "Service Unavailable" }))
      .mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);
    const { loadScanMap } = await import("../loadScanMap");

    await expect(loadScanMap()).rejects.toThrow("503");
    const retried = await loadScanMap();
    const again = await loadScanMap();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(retried).toEqual(payload);
    expect(again).toBe(retried);
  });

  it("a newer in-flight attempt survives an older failure (REQ-249)", async () => {
    let rejectOld: (error: Error) => void = () => undefined;
    const payload = { "printing-opt": { oracleId: "opt", name: "Opt" } };
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectOld = reject)))
      .mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);
    const { loadScanMap } = await import("../loadScanMap");

    const old = loadScanMap();
    old.catch(() => undefined);
    rejectOld(new Error("offline"));
    await expect(old).rejects.toThrow("offline");
    const newer = loadScanMap();
    // The old failure has already cleared; a late second rejection must not clear `newer`.
    rejectOld(new Error("late"));
    await expect(newer).resolves.toEqual(payload);
    expect(await loadScanMap()).toBe(await newer);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
});
