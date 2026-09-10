import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";
import {
  choosePreferredCard,
  getColors,
  getKeywords,
  getManaCost,
  getManaValue,
  getOracleText,
  getTypeLine,
  parseTypeLine,
  shouldIncludeCard
} from "./build-card-metadata.mjs";

// Same committed Scryfall bulk build-card-metadata.mjs trims (REQ-175) — the
// only bulk file carrying oracle text, type line, mana cost/value, and colors.
const inputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
// REQ-066: the same source's `snapshotDate` sidecar (from the human-approved
// `data:refresh`), reused here rather than re-derived, so the two artifacts
// this file emits agree on when the corpus was captured.
const inputMetaPath = path.resolve("apps/frontend/data/scryfall/default-cards.meta.json");
// REQ-175: committed brotli-compressed, not raw JSON — the raw shape is
// ~12.7 MB for the current corpus; brotli takes it to a small fraction of
// that with no change to what it holds or serves. The backend decodes it
// once at startup.
const outputPath = path.resolve("apps/backend/data/cardDetailByOracleId.json.br");
// REQ-066: the price/printing projection unified into this build. Committed
// brotli-compressed — the raw JSON (~15.6 MB for ~102k printings) would leave
// the Lambda package's 120 MB committed-data budget with under 1 MB of
// headroom (`scripts/lambda-package-budget.test.mjs`); brotli lands smaller
// still than gzip, mirroring the brotli pattern the backend data folder uses
// across the combo blocks, combo index, rulings, and card detail. The backend
// decompresses it once at startup (REQ-175), the same way
// `apps/backend/src/commanderSpellbook/catalog.ts` already does for its blocks.
const pricesOutputPath = path.resolve("apps/backend/data/cardPrintingPricesByOracleId.json.br");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * Brotli-compress with the fixed, named params this repository uses
 * everywhere: quality 11, a size hint set to the raw input length, no
 * `dictionary` option (Node 22 in CI silently ignores a brotli dictionary
 * while Node 24 on Lambda honours it, which would make CI and Lambda
 * disagree).
 */
function brotliCompress(buffer) {
  return zlib.brotliCompressSync(buffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
    }
  });
}

export function buildDetailEntry(card) {
  const typeLine = getTypeLine(card);
  const { supertypes, subtypes } = parseTypeLine(typeLine);

  return {
    oracleText: getOracleText(card),
    typeLine,
    manaCost: getManaCost(card),
    manaValue: getManaValue(card),
    colors: getColors(card),
    supertypes,
    subtypes,
    // REQ-180: Scryfall's keyword list, feeds System 3's keyword signal;
    // never reaches the up-front frontend card list.
    keywords: getKeywords(card)
  };
}

/** REQ-066: a null non-foil/foil price is stored as `null`, never coerced to
 * `0` or omitted — the frontend's $0-plus-caution treatment (`pricing.ts`)
 * depends on being able to tell "no price" apart from "free". */
export function normalizePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** REQ-066: one printing's price/identity fields — deliberately excludes
 * `oracleId` (the map key already carries it), `name`, and `imageUrl`: name
 * comes from the shared `cardMetadata` index (REQ-174) and the image derives
 * from `id` via the Scryfall template, so neither is repeated per printing on
 * the committed artifact or the wire (REQ-175). */
export function buildPriceEntry(card) {
  return {
    id: card.id,
    set: typeof card.set === "string" ? card.set : "",
    setName: typeof card.set_name === "string" ? card.set_name : "",
    collectorNumber: typeof card.collector_number === "string" ? card.collector_number : "",
    usd: normalizePrice(card.prices?.usd),
    usdFoil: normalizePrice(card.prices?.usd_foil)
  };
}

/**
 * Snapshot date preference: persisted Scryfall bulk metadata (`updated_at`) when a
 * sidecar exists, then the source file's mtime, then the build date. Ported
 * from the retired `scripts/build-card-prices.mjs` (REQ-066).
 */
export function resolveSnapshotDate(inputFilePath, metaPath = inputMetaPath, now = new Date()) {
  if (metaPath && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      const updatedAt = meta?.updated_at ?? meta?.updatedAt;
      if (typeof updatedAt === "string" && !Number.isNaN(Date.parse(updatedAt))) {
        return new Date(updatedAt).toISOString();
      }
    } catch {
      // Fall through to the mtime / build-date fallbacks.
    }
  }

  try {
    if (inputFilePath && fs.existsSync(inputFilePath)) {
      return fs.statSync(inputFilePath).mtime.toISOString();
    }
  } catch {
    // Fall through to the build date.
  }

  return now.toISOString();
}

export function createDetailTransformState() {
  return {
    parsedCount: 0,
    skippedByFilter: 0,
    skippedMissingOracleId: 0,
    skippedAsDuplicate: 0,
    cardsByOracleId: new Map(),
    // REQ-066: every qualifying printing (not deduped — a card has one
    // rules block but several printings, each carrying its own price).
    printingsByOracleId: new Map()
  };
}

/** A1/A2: `released_at` is read here only to sort — it rides alongside the
 * entry in `printingsByOracleId` (never inside `buildPriceEntry`'s own
 * return) so `finalizePriceTransformState` can order printings newest-first
 * without ever emitting the field. */
function parseReleasedAtMs(card) {
  const raw = card?.released_at;
  if (typeof raw !== "string") return null;
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : time;
}

function ingestPriceEntry(state, oracleId, card) {
  const wrapper = { entry: buildPriceEntry(card), releasedAtMs: parseReleasedAtMs(card) };
  const existing = state.printingsByOracleId.get(oracleId);
  if (existing) {
    existing.push(wrapper);
    return;
  }
  state.printingsByOracleId.set(oracleId, [wrapper]);
}

/** A1: numeric-aware ascending collector-number compare — "10" sorts after
 * "9", not before it as a plain string compare would. A non-numeric
 * collector number (e.g. a promo suffix) sorts after every numeric one, then
 * falls back to a plain string compare between two non-numeric values. */
function compareCollectorNumbers(a, b) {
  const aMatch = /^(\d+)/.exec(a);
  const bMatch = /^(\d+)/.exec(b);
  if (aMatch && bMatch) {
    const diff = Number(aMatch[1]) - Number(bMatch[1]);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  }
  if (Boolean(aMatch) !== Boolean(bMatch)) return aMatch ? -1 : 1;
  return a.localeCompare(b);
}

/** A1/A2: released_at descending (newest first), then numeric-aware
 * collector number ascending, then printing id as a deterministic final
 * tiebreak. A printing with a missing/unparseable released_at sorts last. */
function comparePrintingWrappers(a, b) {
  const aHasDate = a.releasedAtMs !== null;
  const bHasDate = b.releasedAtMs !== null;
  if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
  if (aHasDate && a.releasedAtMs !== b.releasedAtMs) return b.releasedAtMs - a.releasedAtMs;

  const collectorDiff = compareCollectorNumbers(a.entry.collectorNumber, b.entry.collectorNumber);
  if (collectorDiff !== 0) return collectorDiff;

  return a.entry.id.localeCompare(b.entry.id);
}

export function ingestDetailCard(state, card) {
  state.parsedCount += 1;

  if (!shouldIncludeCard(card)) {
    state.skippedByFilter += 1;
    return;
  }

  const oracleId = typeof card?.oracle_id === "string" ? card.oracle_id.trim() : "";
  if (oracleId.length === 0) {
    state.skippedMissingOracleId += 1;
    return;
  }

  // REQ-066: record this printing's price entry for every qualifying card,
  // independent of the rules-text dedupe below — a printing that loses the
  // "preferred card" comparison still has its own price.
  ingestPriceEntry(state, oracleId, card);

  const existing = state.cardsByOracleId.get(oracleId);
  if (!existing) {
    state.cardsByOracleId.set(oracleId, card);
    return;
  }

  state.skippedAsDuplicate += 1;
  state.cardsByOracleId.set(oracleId, choosePreferredCard(existing, card));
}

export function finalizeDetailTransformState(state) {
  const sortedOracleIds = [...state.cardsByOracleId.keys()].sort();
  const output = {};

  for (const oracleId of sortedOracleIds) {
    output[oracleId] = buildDetailEntry(state.cardsByOracleId.get(oracleId));
  }

  return {
    cardDetailByOracleId: output,
    stats: {
      parsedCount: state.parsedCount,
      skippedByFilter: state.skippedByFilter,
      skippedMissingOracleId: state.skippedMissingOracleId,
      skippedAsDuplicate: state.skippedAsDuplicate,
      cardsWithDetail: sortedOracleIds.length
    }
  };
}

/** REQ-066: the sibling artifact this build now also emits — every
 * qualifying printing, grouped by oracle id, with a top-level snapshot date. */
export function finalizePriceTransformState(state, snapshotDate) {
  const sortedOracleIds = [...state.printingsByOracleId.keys()].sort();
  const byOracleId = {};
  let totalPrintings = 0;
  let withUsd = 0;
  let withUsdFoil = 0;
  let withoutAnyPrice = 0;

  for (const oracleId of sortedOracleIds) {
    const printings = [...state.printingsByOracleId.get(oracleId)]
      .sort(comparePrintingWrappers)
      .map((wrapper) => wrapper.entry);
    byOracleId[oracleId] = { printings };
    totalPrintings += printings.length;
    for (const printing of printings) {
      if (printing.usd !== null) withUsd += 1;
      if (printing.usdFoil !== null) withUsdFoil += 1;
      if (printing.usd === null && printing.usdFoil === null) withoutAnyPrice += 1;
    }
  }

  return {
    cardPrintingPricesByOracleId: { snapshotDate, byOracleId },
    priceStats: {
      oraclesWithPrintings: sortedOracleIds.length,
      totalPrintings,
      withUsd,
      withUsdFoil,
      withoutAnyPrice
    }
  };
}

export function transformCardDetail(cards) {
  const state = createDetailTransformState();
  for (const card of cards) {
    ingestDetailCard(state, card);
  }
  return finalizeDetailTransformState(state);
}

/** Test-only convenience mirroring `transformCardDetail`: builds the price
 * artifact from an in-memory card list via the same ingest path the real
 * single-pass build uses. */
export function transformCardPrintingPrices(cards, snapshotDate) {
  const state = createDetailTransformState();
  for (const card of cards) {
    ingestDetailCard(state, card);
  }
  return finalizePriceTransformState(state, snapshotDate);
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    // REQ-066: the unified build degrades gracefully — a missing source
    // keeps both prior committed artifacts (cardDetailByOracleId.json.br and
    // cardPrintingPricesByOracleId.json.br) rather than breaking the rest of
    // `data:build`.
    console.warn(`[build-card-detail-by-oracle-id] Source not found, keeping existing artifacts: ${inputPath}`);
    return;
  }

  try {
    const state = createDetailTransformState();

    let startedArray = false;
    let collectingObject = false;
    let inString = false;
    let escapeNext = false;
    let depth = 0;
    let objectBuffer = "";

    const stream = fs.createReadStream(inputPath, {
      encoding: "utf8",
      highWaterMark: 1024 * 1024
    });

    for await (const chunk of stream) {
      for (let index = 0; index < chunk.length; index += 1) {
        const char = chunk[index];

        if (!startedArray) {
          if (char === "[") startedArray = true;
          continue;
        }

        if (!collectingObject) {
          if (char === "{") {
            collectingObject = true;
            inString = false;
            escapeNext = false;
            depth = 1;
            objectBuffer = "{";
          }
          continue;
        }

        objectBuffer += char;

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          if (inString) escapeNext = true;
          continue;
        }

        if (char === "\"") {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            depth += 1;
          } else if (char === "}") {
            depth -= 1;

            if (depth === 0) {
              collectingObject = false;

              const card = JSON.parse(objectBuffer);
              objectBuffer = "";
              ingestDetailCard(state, card);
            }
          }
        }
      }
    }

    const { cardDetailByOracleId, stats } = finalizeDetailTransformState(state);
    const detailOutput = brotliCompress(Buffer.from(JSON.stringify(cardDetailByOracleId), "utf8"));
    ensureParentDirectory(outputPath);
    fs.writeFileSync(outputPath, detailOutput);

    const snapshotDate = resolveSnapshotDate(inputPath, inputMetaPath);
    const { cardPrintingPricesByOracleId, priceStats } = finalizePriceTransformState(state, snapshotDate);
    const pricesOutput = brotliCompress(Buffer.from(JSON.stringify(cardPrintingPricesByOracleId), "utf8"));
    ensureParentDirectory(pricesOutputPath);
    fs.writeFileSync(pricesOutputPath, pricesOutput);

    console.log(`Parsed cards: ${stats.parsedCount}`);
    console.log(`Cards with detail: ${stats.cardsWithDetail}`);
    console.log(`Skipped by filter: ${stats.skippedByFilter}`);
    console.log(`Skipped missing oracle_id: ${stats.skippedMissingOracleId}`);
    console.log(`Skipped duplicates: ${stats.skippedAsDuplicate}`);
    console.log(`Detail output bytes (brotli): ${detailOutput.length}`);
    console.log(`Wrote: ${outputPath}`);
    console.log(`Priced oracle ids: ${priceStats.oraclesWithPrintings}`);
    console.log(`Priced printings: ${priceStats.totalPrintings}`);
    console.log(`With usd: ${priceStats.withUsd}, with usdFoil: ${priceStats.withUsdFoil}`);
    console.log(`Without any price: ${priceStats.withoutAnyPrice}`);
    console.log(`Snapshot date: ${snapshotDate}`);
    console.log(`Price output bytes (brotli): ${pricesOutput.length}`);
    console.log(`Wrote: ${pricesOutputPath}`);
  } catch (error) {
    console.warn(
      `[build-card-detail-by-oracle-id] Build failed, keeping existing artifacts: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
