import { existsSync, readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

/**
 * One printing's price/identity fields (REQ-066, REQ-175). Deliberately
 * excludes `oracleId` (the map key already carries it), `name`, and
 * `imageUrl`: name comes from the shared `cardMetadata` index (REQ-174) and
 * the image derives from `id` via the Scryfall template, so neither rides
 * the wire or the committed artifact per printing.
 */
export type CardPrintingPrice = {
  id: string;
  set: string;
  setName: string;
  collectorNumber: string;
  usd: number | null;
  usdFoil: number | null;
};

/**
 * One card's printings and prices, keyed by Scryfall `oracle_id` (REQ-066,
 * REQ-175). Read-only sibling to `CardDetailEntry` (`cardDetail.ts`) — kept
 * on its own committed artifact and its own route
 * (`GET /api/cards/:oracleId/prices`) so the descriptive-block/ask-ai path
 * never carries price bytes and the balancer never carries rules text.
 * `snapshotDate` is copied in at load time from the artifact's single
 * top-level value, so each served entry is self-contained.
 */
export type CardPrintingPricesEntry = {
  snapshotDate: string;
  printings: CardPrintingPrice[];
};

const warnedLoadFailures = new Set<string>();

function isCardPrintingPrice(value: unknown): value is CardPrintingPrice {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CardPrintingPrice>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.set === "string" &&
    typeof candidate.setName === "string" &&
    typeof candidate.collectorNumber === "string" &&
    (candidate.usd === null || typeof candidate.usd === "number") &&
    (candidate.usdFoil === null || typeof candidate.usdFoil === "number")
  );
}

function isPrintingsArray(value: unknown): value is CardPrintingPrice[] {
  return Array.isArray(value) && value.every(isCardPrintingPrice);
}

function normalizeCardPrintingPricesIndex(value: unknown): Map<string, CardPrintingPricesEntry> {
  const index = new Map<string, CardPrintingPricesEntry>();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return index;
  }

  const container = value as { snapshotDate?: unknown; byOracleId?: unknown };
  const snapshotDate = typeof container.snapshotDate === "string" ? container.snapshotDate : "";

  if (typeof container.byOracleId !== "object" || container.byOracleId === null || Array.isArray(container.byOracleId)) {
    return index;
  }

  for (const [oracleId, entry] of Object.entries(container.byOracleId)) {
    if (oracleId.trim().length === 0 || typeof entry !== "object" || entry === null) {
      continue;
    }

    const printings = (entry as { printings?: unknown }).printings;
    if (isPrintingsArray(printings)) {
      index.set(oracleId, { snapshotDate, printings });
    }
  }

  return index;
}

/**
 * Loads the committed, brotli-compressed price map into memory at startup
 * (REQ-066, REQ-175) — mirroring `loadCardDetailIndex`'s fail-open posture so
 * mock-default dev boots clean with no committed file: a missing or
 * unparseable artifact logs one warning and yields an empty map rather than
 * throwing, and the route degrades every id to `404 card_not_found`.
 */
export function loadCardPrintingPricesIndex(filePath: string): Map<string, CardPrintingPricesEntry> {
  if (!existsSync(filePath)) {
    warnLoadFailureOnce(
      filePath,
      `Card printing-price file missing; GET /api/cards/:oracleId/prices is disabled: ${filePath}`
    );
    return new Map();
  }

  try {
    const parsed = JSON.parse(brotliDecompressSync(readFileSync(filePath)).toString("utf8"));
    return normalizeCardPrintingPricesIndex(parsed);
  } catch (error) {
    warnLoadFailureOnce(filePath, `Card printing-price file could not be read: ${filePath}`, error);
    return new Map();
  }
}

function warnLoadFailureOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) {
    return;
  }

  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}
