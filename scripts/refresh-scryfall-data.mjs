import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

const bulkDataEndpoint = "https://api.scryfall.com/bulk-data";
const sourceOutputPath = path.resolve("apps/frontend/data/scryfall/default-cards.json");
const metadataOutputPath = path.resolve("apps/frontend/public/data/cardMetadata.json");
const tempDownloadPath = `${sourceOutputPath}.tmp`;

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fetchDefaultCardsDownloadUrl() {
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

  return {
    downloadUrl: defaultCardsRecord.download_uri,
    updatedAt: defaultCardsRecord.updated_at ?? "unknown",
    estimatedSize: typeof defaultCardsRecord.size === "number" ? defaultCardsRecord.size : null
  };
}

async function downloadDefaultCards(downloadUrl) {
  const response = await fetch(downloadUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download default-cards.json: ${response.status} ${response.statusText}`);
  }

  ensureParentDirectory(sourceOutputPath);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempDownloadPath));
  fs.renameSync(tempDownloadPath, sourceOutputPath);
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
  const { downloadUrl, updatedAt, estimatedSize } = await fetchDefaultCardsDownloadUrl();
  console.log(`Found default_cards feed (updated: ${updatedAt}).`);
  if (estimatedSize !== null) {
    console.log(`Estimated source size: ${formatBytes(estimatedSize)}.`);
  }

  console.log(`Downloading default cards to ${sourceOutputPath}...`);
  await downloadDefaultCards(downloadUrl);
  const downloadedBytes = fs.statSync(sourceOutputPath).size;
  console.log(`Download complete (${formatBytes(downloadedBytes)}).`);

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
  console.error(error);
  process.exitCode = 1;
});
