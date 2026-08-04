import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCardPrices, type CardPrintingPriceArtifact } from "./loadCardPrices";

const artifactFixture: CardPrintingPriceArtifact = {
  snapshotDate: "2026-06-05T16:21:00.000Z",
  printings: {
    "printing-lotus-lea": {
      id: "printing-lotus-lea",
      oracleId: "oracle-lotus",
      name: "Black Lotus",
      set: "lea",
      setName: "Limited Edition Alpha",
      collectorNumber: "232",
      imageUrl: "https://example.test/lotus-lea.jpg",
      usd: 42000,
      usdFoil: null
    },
    "printing-lotus-leb": {
      id: "printing-lotus-leb",
      oracleId: "oracle-lotus",
      name: "Black Lotus",
      set: "leb",
      setName: "Limited Edition Beta",
      collectorNumber: "233",
      imageUrl: "https://example.test/lotus-leb.jpg",
      usd: null,
      usdFoil: null
    },
    "printing-bolt": {
      id: "printing-bolt",
      oracleId: "oracle-bolt",
      name: "Lightning Bolt",
      set: "2ed",
      setName: "Unlimited Edition",
      collectorNumber: "162",
      imageUrl: "https://example.test/bolt.jpg",
      usd: 3.5,
      usdFoil: 12.75
    }
  },
  byOracleId: {
    "oracle-lotus": ["printing-lotus-lea", "printing-lotus-leb"],
    "oracle-bolt": ["printing-bolt"]
  }
};

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => payload
  } as unknown as Response;
}

function errorResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({})
  } as unknown as Response;
}

async function importLoader() {
  vi.resetModules();
  return import("./loadCardPrices");
}

describe("createCardPrices", () => {
  it("exposes the artifact indexes and snapshot date", () => {
    const prices = createCardPrices(artifactFixture);

    expect(prices.snapshotDate).toBe("2026-06-05T16:21:00.000Z");
    expect(Object.keys(prices.printings)).toHaveLength(3);
    expect(Object.keys(prices.byOracleId)).toHaveLength(2);
  });

  it("returns the printing entry by printing id", () => {
    const prices = createCardPrices(artifactFixture);

    expect(prices.getPrintingPrice("printing-bolt")).toMatchObject({
      name: "Lightning Bolt",
      set: "2ed",
      collectorNumber: "162",
      usd: 3.5,
      usdFoil: 12.75
    });
  });

  it("returns null for an unknown printing id", () => {
    const prices = createCardPrices(artifactFixture);

    expect(prices.getPrintingPrice("printing-missing")).toBeNull();
  });

  it("lists every printing for an oracle id, including unpriced printings", () => {
    const prices = createCardPrices(artifactFixture);

    const printings = prices.listPrintingsForOracle("oracle-lotus");

    expect(printings.map((printing) => printing.id)).toEqual([
      "printing-lotus-lea",
      "printing-lotus-leb"
    ]);
    expect(printings[1]).toMatchObject({ usd: null, usdFoil: null });
  });

  it("returns an empty list for an unknown oracle id", () => {
    const prices = createCardPrices(artifactFixture);

    expect(prices.listPrintingsForOracle("oracle-missing")).toEqual([]);
  });

  it("tolerates an artifact with missing indexes", () => {
    const prices = createCardPrices({} as CardPrintingPriceArtifact);

    expect(prices.snapshotDate).toBe("");
    expect(prices.getPrintingPrice("anything")).toBeNull();
    expect(prices.listPrintingsForOracle("anything")).toEqual([]);
  });
});

describe("loadCardPrices", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the committed artifact from /data/cardPrintingPrices.json", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(artifactFixture));
    vi.stubGlobal("fetch", fetchMock);

    const { loadCardPrices } = await importLoader();
    const prices = await loadCardPrices();

    expect(fetchMock).toHaveBeenCalledWith("/data/cardPrintingPrices.json");
    expect(prices.snapshotDate).toBe("2026-06-05T16:21:00.000Z");
    expect(prices.getPrintingPrice("printing-bolt")?.usdFoil).toBe(12.75);
  });

  it("fetches only once across repeated calls", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(artifactFixture));
    vi.stubGlobal("fetch", fetchMock);

    const { loadCardPrices } = await importLoader();
    const [first, second] = await Promise.all([loadCardPrices(), loadCardPrices()]);
    const third = await loadCardPrices();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("rejects with a descriptive error when the response is not ok", async () => {
    const fetchMock = vi.fn(async () => errorResponse(404, "Not Found"));
    vi.stubGlobal("fetch", fetchMock);

    const { loadCardPrices } = await importLoader();

    await expect(loadCardPrices()).rejects.toThrow(
      "Could not load card printing prices: 404 Not Found"
    );
  });
});
