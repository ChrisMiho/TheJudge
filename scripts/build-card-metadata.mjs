import fs from "node:fs";
import path from "node:path";

const inputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const outputPath = path.resolve("apps/frontend/src/data/cardMetadata.json");

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function getImageUrl(card) {
  if (card.image_uris?.small) return card.image_uris.small;
  if (card.image_uris?.normal) return card.image_uris.normal;

  if (Array.isArray(card.card_faces)) {
    for (const face of card.card_faces) {
      if (face?.image_uris?.small) return face.image_uris.small;
      if (face?.image_uris?.normal) return face.image_uris.normal;
    }
  }

  return "";
}

function getOracleText(card) {
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

function shouldIncludeCard(card) {
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

function buildOutputCard(card) {
  return {
    cardId: typeof card.oracle_id === "string" && card.oracle_id.length > 0 ? card.oracle_id : card.id,
    name: card.name.trim(),
    oracleText: getOracleText(card),
    imageUrl: getImageUrl(card)
  };
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const seenNames = new Set();
  const trimmedCards = [];

  let parsedCount = 0;
  let skippedByFilter = 0;
  let skippedAsDuplicate = 0;

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
            parsedCount += 1;

            const card = JSON.parse(objectBuffer);
            objectBuffer = "";

            if (!shouldIncludeCard(card)) {
              skippedByFilter += 1;
              continue;
            }

            const normalized = normalizeName(card.name);
            if (seenNames.has(normalized)) {
              skippedAsDuplicate += 1;
              continue;
            }

            seenNames.add(normalized);
            const outputCard = buildOutputCard(card);
            if (outputCard.oracleText.length === 0) {
              skippedByFilter += 1;
              continue;
            }

            trimmedCards.push(outputCard);
          }
        }
      }
    }
  }

  trimmedCards.sort((a, b) => a.name.localeCompare(b.name));
  ensureParentDirectory(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(trimmedCards));

  console.log(`Parsed cards: ${parsedCount}`);
  console.log(`Included cards: ${trimmedCards.length}`);
  console.log(`Skipped by filter: ${skippedByFilter}`);
  console.log(`Skipped duplicates: ${skippedAsDuplicate}`);
  console.log(`Wrote: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
