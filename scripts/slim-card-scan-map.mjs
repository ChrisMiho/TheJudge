import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MAP = path.resolve("apps/frontend/public/data/cardScanMap.json");

// Drops only the `imageUrl` field from every entry. Keys, key order, `oracleId`
// and `name` stay as they are. Running it on an already slim map changes nothing.
export function slimScanMap(scanMap) {
  const slim = {};
  for (const [printingId, entry] of Object.entries(scanMap)) {
    const rest = { ...entry };
    delete rest.imageUrl;
    slim[printingId] = rest;
  }
  return slim;
}

export function slimScanMapFile(mapPath) {
  const scanMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const slim = slimScanMap(scanMap);
  // Same formatting build-card-scan-map.mjs writes: compact JSON, no trailing newline.
  fs.writeFileSync(mapPath, JSON.stringify(slim));
  return Object.keys(slim).length;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  const entries = slimScanMapFile(DEFAULT_MAP);
  console.log(`[slim-card-scan-map] Entries: ${entries}`);
  console.log(`[slim-card-scan-map] Wrote: ${DEFAULT_MAP}`);
}
