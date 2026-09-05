import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  choosePreferredCard,
  getColors,
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
const outputPath = path.resolve("apps/backend/data/cardDetailByOracleId.json");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
    subtypes
  };
}

export function createDetailTransformState() {
  return {
    parsedCount: 0,
    skippedByFilter: 0,
    skippedMissingOracleId: 0,
    skippedAsDuplicate: 0,
    cardsByOracleId: new Map()
  };
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

export function transformCardDetail(cards) {
  const state = createDetailTransformState();
  for (const card of cards) {
    ingestDetailCard(state, card);
  }
  return finalizeDetailTransformState(state);
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

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
  const output = JSON.stringify(cardDetailByOracleId);
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, output);

  console.log(`Parsed cards: ${stats.parsedCount}`);
  console.log(`Cards with detail: ${stats.cardsWithDetail}`);
  console.log(`Skipped by filter: ${stats.skippedByFilter}`);
  console.log(`Skipped missing oracle_id: ${stats.skippedMissingOracleId}`);
  console.log(`Skipped duplicates: ${stats.skippedAsDuplicate}`);
  console.log(`Output bytes: ${Buffer.byteLength(output)}`);
  console.log(`Wrote: ${outputPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
