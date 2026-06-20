import type { CardScanMap } from "./resolveScanCandidates";

const SCAN_MAP_URL = "/data/cardScanMap.json";

let cachedScanMapPromise: Promise<CardScanMap> | null = null;

export function loadScanMap(): Promise<CardScanMap> {
  if (!cachedScanMapPromise) {
    cachedScanMapPromise = fetch(SCAN_MAP_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load card scan map: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<CardScanMap>;
    });
  }

  return cachedScanMapPromise;
}
