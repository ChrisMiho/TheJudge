import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const outputPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const COLOR_ORDER = ["W", "U", "B", "R", "G"];
const SUPERTYPE_SET = new Set([
  "Basic",
  "Legendary",
  "Snow",
  "World",
  "Ongoing",
  "Elite",
  "Host",
  "Token"
]);

export function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function getImageUrl(card) {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.image_uris?.small) return card.image_uris.small;

  if (Array.isArray(card.card_faces)) {
    for (const face of card.card_faces) {
      if (face?.image_uris?.normal) return face.image_uris.normal;
      if (face?.image_uris?.small) return face.image_uris.small;
    }
  }

  return "";
}

export function getOracleText(card) {
  if (typeof card.oracle_text === "string" && card.oracle_text.trim().length > 0) {
    return card.oracle_text.trim();
  }

  if (Array.isArray(card.card_faces)) {
    const parts = card.card_faces
      .map((face) => (typeof face?.oracle_text === "string" ? face.oracle_text.trim() : ""))
      .filter((text) => text.length > 0);

    if (parts.length > 0) {
      return parts.join("\n//\n");
    }
  }

  return "";
}

function normalizeInlineWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function sortColors(colors) {
  return [...new Set(colors)]
    .filter((color) => COLOR_ORDER.includes(color))
    .sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
}

export function getManaCost(card) {
  if (typeof card?.mana_cost === "string" && card.mana_cost.trim().length > 0) {
    return card.mana_cost.trim();
  }

  if (Array.isArray(card?.card_faces)) {
    const faceCosts = card.card_faces
      .map((face) => (typeof face?.mana_cost === "string" ? face.mana_cost.trim() : ""))
      .filter((cost) => cost.length > 0);

    if (faceCosts.length > 0) {
      return faceCosts.join(" // ");
    }
  }

  return "";
}

export function getManaValue(card) {
  if (typeof card?.cmc === "number" && Number.isFinite(card.cmc) && card.cmc >= 0) {
    return card.cmc;
  }
  return 0;
}

export function getTypeLine(card) {
  if (typeof card?.type_line === "string" && card.type_line.trim().length > 0) {
    return normalizeInlineWhitespace(card.type_line);
  }

  if (Array.isArray(card?.card_faces)) {
    const faceTypes = card.card_faces
      .map((face) => (typeof face?.type_line === "string" ? normalizeInlineWhitespace(face.type_line) : ""))
      .filter((line) => line.length > 0);

    if (faceTypes.length > 0) {
      return faceTypes.join(" // ");
    }
  }

  return "";
}

export function getColors(card) {
  if (Array.isArray(card?.colors) && card.colors.length > 0) {
    return sortColors(card.colors.map((color) => String(color)));
  }

  if (Array.isArray(card?.card_faces)) {
    const allFaceColors = card.card_faces.flatMap((face) =>
      Array.isArray(face?.colors) ? face.colors.map((color) => String(color)) : []
    );
    return sortColors(allFaceColors);
  }

  return [];
}

export function parseTypeLine(typeLine) {
  const normalizedTypeLine = normalizeInlineWhitespace(typeLine);
  if (normalizedTypeLine.length === 0) {
    return { supertypes: [], subtypes: [] };
  }

  const [left = "", right = ""] = normalizedTypeLine.split("—");
  const leftTokens = left
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  const supertypes = leftTokens.filter((token) => SUPERTYPE_SET.has(token));

  const subtypes = right
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return {
    supertypes,
    subtypes
  };
}

export function shouldIncludeCard(card) {
  if (card?.lang !== "en") return false;
  if (!Array.isArray(card?.games) || !card.games.includes("paper")) return false;
  if (card?.digital === true) return false;
  if (typeof card?.name !== "string" || card.name.trim().length === 0) return false;
  return true;
}

function ensureParentDirectory(filePath) {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

function getMetadataQualityScore(card) {
  const hasOracleText = getOracleText(card).length > 0;
  const hasImage = getImageUrl(card).length > 0;
  const hasOracleId = typeof card?.oracle_id === "string" && card.oracle_id.length > 0;
  const hasReleaseDate = typeof card?.released_at === "string" && card.released_at.length > 0;

  let score = 0;
  if (hasOracleText) score += 4;
  if (hasImage) score += 2;
  if (hasOracleId) score += 1;
  if (hasReleaseDate) score += 1;
  return score;
}

function getReleaseDate(card) {
  return typeof card?.released_at === "string" && card.released_at.length > 0 ? card.released_at : "9999-99-99";
}

function getDeterministicCardKey(card) {
  if (typeof card?.oracle_id === "string" && card.oracle_id.length > 0) return card.oracle_id;
  if (typeof card?.id === "string" && card.id.length > 0) return card.id;
  return normalizeName(String(card?.name ?? ""));
}

export function choosePreferredCard(existingCard, candidateCard) {
  const existingScore = getMetadataQualityScore(existingCard);
  const candidateScore = getMetadataQualityScore(candidateCard);
  if (candidateScore > existingScore) return candidateCard;
  if (candidateScore < existingScore) return existingCard;

  const existingRelease = getReleaseDate(existingCard);
  const candidateRelease = getReleaseDate(candidateCard);
  if (candidateRelease > existingRelease) return candidateCard;
  if (candidateRelease < existingRelease) return existingCard;

  const existingKey = getDeterministicCardKey(existingCard);
  const candidateKey = getDeterministicCardKey(candidateCard);
  if (candidateKey < existingKey) return candidateCard;
  return existingCard;
}

export function buildOutputCard(card) {
  const typeLine = getTypeLine(card);
  const { supertypes, subtypes } = parseTypeLine(typeLine);

  return {
    cardId: typeof card.oracle_id === "string" && card.oracle_id.length > 0 ? card.oracle_id : card.id,
    name: card.name.trim(),
    oracleText: getOracleText(card),
    imageUrl: getImageUrl(card),
    manaCost: getManaCost(card),
    manaValue: getManaValue(card),
    typeLine,
    colors: getColors(card),
    supertypes,
    subtypes
  };
}

export function createTransformState() {
  return {
    parsedCount: 0,
    skippedByFilter: 0,
    skippedAsDuplicate: 0,
    cardsByName: new Map()
  };
}

export function ingestCard(state, card) {
  state.parsedCount += 1;

  if (!shouldIncludeCard(card)) {
    state.skippedByFilter += 1;
    return;
  }

  const normalized = normalizeName(card.name);
  const existing = state.cardsByName.get(normalized);
  if (!existing) {
    state.cardsByName.set(normalized, card);
    return;
  }

  state.skippedAsDuplicate += 1;
  state.cardsByName.set(normalized, choosePreferredCard(existing, card));
}

export function finalizeTransformState(state) {
  let skippedByFilter = state.skippedByFilter;
  const trimmedCards = [];

  for (const card of state.cardsByName.values()) {
    const outputCard = buildOutputCard(card);
    if (outputCard.oracleText.length === 0) {
      skippedByFilter += 1;
      continue;
    }

    trimmedCards.push(outputCard);
  }

  trimmedCards.sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.cardId.localeCompare(b.cardId);
  });

  return {
    cards: trimmedCards,
    stats: {
      parsedCount: state.parsedCount,
      includedCount: trimmedCards.length,
      skippedByFilter,
      skippedAsDuplicate: state.skippedAsDuplicate
    }
  };
}

export function transformCards(cards) {
  const state = createTransformState();
  for (const card of cards) {
    ingestCard(state, card);
  }
  return finalizeTransformState(state);
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const state = createTransformState();

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
            ingestCard(state, card);
          }
        }
      }
    }
  }

  const { cards: trimmedCards, stats } = finalizeTransformState(state);
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(trimmedCards));

  console.log(`Parsed cards: ${stats.parsedCount}`);
  console.log(`Included cards: ${stats.includedCount}`);
  console.log(`Skipped by filter: ${stats.skippedByFilter}`);
  console.log(`Skipped duplicates: ${stats.skippedAsDuplicate}`);
  console.log(`Wrote: ${outputPath}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
