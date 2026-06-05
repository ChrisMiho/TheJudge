import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

const bulkDataEndpoint = "https://api.scryfall.com/bulk-data";
const sourceOutputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const rulingsOutputPath = path.resolve("apps/backend/data/scryfall/rulings.json");
const metadataOutputPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const tempDownloadPath = `${sourceOutputPath}.tmp`;
const rulingsTempDownloadPath = `${rulingsOutputPath}.tmp`;

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fetchBulkDataDownloadRecords() {
  const response = await fetch(bulkDataEndpoint);
  if (!response.ok) {
    throw new Error(`Could not fetch Scryfall bulk metadata: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.data)) {
    throw new Error("Unexpected Scryfall bulk metadata response shape.");
  }

  const defaultCardsRecord = payload.data.find((entry) => entry?.type === "default_cards");
  if (!defaultCardsRecord?.download_uri) {
    throw new Error("Could not find default_cards download URI from Scryfall.");
  }

  const rulingsRecord = payload.data.find((entry) => entry?.type === "rulings");
  if (!rulingsRecord?.download_uri) {
    throw new Error("Could not find rulings download URI from Scryfall.");
  }

  return {
    defaultCards: {
      downloadUrl: defaultCardsRecord.download_uri,
      updatedAt: defaultCardsRecord.updated_at ?? "unknown",
      estimatedSize: typeof defaultCardsRecord.size === "number" ? defaultCardsRecord.size : null
    },
    rulings: {
      downloadUrl: rulingsRecord.download_uri,
      updatedAt: rulingsRecord.updated_at ?? "unknown",
      estimatedSize: typeof rulingsRecord.size === "number" ? rulingsRecord.size : null
    }
  };
}

async function downloadBulkFile(downloadUrl, outputPath, tempPath, label) {
  const response = await fetch(downloadUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${label}: ${response.status} ${response.statusText}`);
  }

  ensureParentDirectory(outputPath);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempPath));
  fs.renameSync(tempPath, outputPath);
}

function runDataBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "data:build"], {
      stdio: "inherit",
      shell: true
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run data:build failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  console.log("Fetching Scryfall bulk-data metadata...");
  const { defaultCards, rulings } = await fetchBulkDataDownloadRecords();
  console.log(`Found default_cards feed (updated: ${defaultCards.updatedAt}).`);
  if (defaultCards.estimatedSize !== null) {
    console.log(`Estimated default_cards source size: ${formatBytes(defaultCards.estimatedSize)}.`);
  }
  console.log(`Found rulings feed (updated: ${rulings.updatedAt}).`);
  if (rulings.estimatedSize !== null) {
    console.log(`Estimated rulings source size: ${formatBytes(rulings.estimatedSize)}.`);
  }

  console.log(`Downloading default cards to ${sourceOutputPath}...`);
  await downloadBulkFile(defaultCards.downloadUrl, sourceOutputPath, tempDownloadPath, "default-cards.json");
  const downloadedBytes = fs.statSync(sourceOutputPath).size;
  console.log(`Default cards download complete (${formatBytes(downloadedBytes)}).`);

  console.log(`Downloading rulings to ${rulingsOutputPath}...`);
  await downloadBulkFile(rulings.downloadUrl, rulingsOutputPath, rulingsTempDownloadPath, "rulings.json");
  const rulingsBytes = fs.statSync(rulingsOutputPath).size;
  console.log(`Rulings download complete (${formatBytes(rulingsBytes)}; updated: ${rulings.updatedAt}; path: ${rulingsOutputPath}).`);

  console.log("Running metadata transform (npm run data:build)...");
  await runDataBuild();

  if (!fs.existsSync(metadataOutputPath)) {
    throw new Error(`Expected output metadata was not found: ${metadataOutputPath}`);
  }

  const metadataBytes = fs.statSync(metadataOutputPath).size;
  console.log(`Metadata refresh complete: ${metadataOutputPath} (${formatBytes(metadataBytes)}).`);
}

main().catch((error) => {
  if (fs.existsSync(tempDownloadPath)) {
    fs.rmSync(tempDownloadPath, { force: true });
  }
  if (fs.existsSync(rulingsTempDownloadPath)) {
    fs.rmSync(rulingsTempDownloadPath, { force: true });
  }
  console.error(error);
  process.exitCode = 1;
});
