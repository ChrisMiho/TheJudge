import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => payload
  } as unknown as Response;
}

function notFoundResponse(): Response {
  return { ok: false, status: 404, statusText: "Not Found", json: async () => ({ error: "card_not_found" }) } as unknown as Response;
}

function serverErrorResponse(): Response {
  return { ok: false, status: 500, statusText: "Internal Server Error", json: async () => ({}) } as unknown as Response;
}

const boltResponse = {
  oracleId: "oracle-bolt",
  snapshotDate: "2026-06-05T16:21:00.000Z",
  printings: [
    {
      id: "printing-bolt-2ed",
      set: "2ed",
      setName: "Unlimited Edition",
      collectorNumber: "162",
      usd: 3.5,
      usdFoil: 12.75
    },
    {
      id: "printing-bolt-m10",
      set: "m10",
      setName: "Magic 2010",
      collectorNumber: "146",
      usd: null,
      usdFoil: null
    }
  ]
};

async function importModule() {
  vi.resetModules();
  return import("./fetchCardPrintings");
}

describe("Frontend - Trade - fetchCardPrintings", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches one card's printings by oracle id and caches the result", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => jsonResponse(boltResponse));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCardPrintings } = await importModule();
    const block = await fetchCardPrintings("oracle-bolt");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/cards/oracle-bolt/prices");
    expect(block?.snapshotDate).toBe("2026-06-05T16:21:00.000Z");
    expect(block?.printings).toHaveLength(2);
    // Missing prices are kept as null, never coerced to 0 or dropped.
    expect(block?.printings[1]).toMatchObject({ usd: null, usdFoil: null });
  });

  it("fetches only once across repeated calls for the same oracle id (per-session cache)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(boltResponse));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCardPrintings } = await importModule();
    const [first, second] = await Promise.all([
      fetchCardPrintings("oracle-bolt"),
      fetchCardPrintings("oracle-bolt")
    ]);
    const third = await fetchCardPrintings("oracle-bolt");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("caches a confirmed not-found (404) as null rather than throwing", async () => {
    const fetchMock = vi.fn(async () => notFoundResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCardPrintings, peekCardPrintings } = await importModule();
    const block = await fetchCardPrintings("oracle-unknown");

    expect(block).toBeNull();
    expect(peekCardPrintings("oracle-unknown")).toBeNull();

    await fetchCardPrintings("oracle-unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects with a descriptive error on a non-ok, non-404 response, and does not cache the failure", async () => {
    const fetchMock = vi.fn(async () => serverErrorResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { fetchCardPrintings, peekCardPrintings } = await importModule();

    await expect(fetchCardPrintings("oracle-bolt")).rejects.toThrow(
      "Card prices request failed with status 500"
    );
    expect(peekCardPrintings("oracle-bolt")).toBeUndefined();

    // A retry re-fetches: the failed result was not cached (D7, FLOW-025).
    fetchMock.mockResolvedValueOnce(jsonResponse(boltResponse) as never);
    const retried = await fetchCardPrintings("oracle-bolt");
    expect(retried?.printings).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("peekCardPrintings returns undefined before any request and after a failure", async () => {
    const { peekCardPrintings } = await importModule();
    expect(peekCardPrintings("never-requested")).toBeUndefined();
  });
});
