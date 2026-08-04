const CARD_PRICES_URL = "/data/cardPrintingPrices.json";

export interface CardPrintingPrice {
  id: string;
  oracleId: string;
  name: string;
  set: string;
  setName: string;
  collectorNumber: string;
  imageUrl: string;
  /** USD price for the non-foil printing; `null` when the source has no price. */
  usd: number | null;
  /** USD price for the foil printing; `null` when the source has no price. */
  usdFoil: number | null;
}

export interface CardPrintingPriceArtifact {
  snapshotDate: string;
  printings: Record<string, CardPrintingPrice>;
  byOracleId: Record<string, string[]>;
}

export interface CardPrices {
  snapshotDate: string;
  printings: Record<string, CardPrintingPrice>;
  byOracleId: Record<string, string[]>;
  /** Returns the printing entry for a printing id, or `null` when unknown. */
  getPrintingPrice: (printingId: string) => CardPrintingPrice | null;
  /** Returns every known printing for an oracle id, in artifact order. */
  listPrintingsForOracle: (oracleId: string) => CardPrintingPrice[];
}

let cachedCardPricesPromise: Promise<CardPrices> | null = null;

export function createCardPrices(artifact: CardPrintingPriceArtifact): CardPrices {
  const printings = artifact.printings ?? {};
  const byOracleId = artifact.byOracleId ?? {};

  return {
    snapshotDate: artifact.snapshotDate ?? "",
    printings,
    byOracleId,
    getPrintingPrice: (printingId) => printings[printingId] ?? null,
    listPrintingsForOracle: (oracleId) =>
      (byOracleId[oracleId] ?? [])
        .map((printingId) => printings[printingId] ?? null)
        .filter((printing): printing is CardPrintingPrice => printing !== null)
  };
}

/**
 * Lazily fetches the committed printing-price artifact. The promise is cached, so the
 * artifact is fetched at most once per session; a failed fetch rejects with a
 * descriptive error the view can surface.
 */
export function loadCardPrices(): Promise<CardPrices> {
  if (!cachedCardPricesPromise) {
    cachedCardPricesPromise = fetch(CARD_PRICES_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load card printing prices: ${response.status} ${response.statusText}`
          );
        }
        return response.json() as Promise<CardPrintingPriceArtifact>;
      })
      .then(createCardPrices);
  }

  return cachedCardPricesPromise;
}
