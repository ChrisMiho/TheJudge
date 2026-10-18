import { CardIdentifier } from "./identify";
import { loadHashDb } from "./loadHashDb";
import { loadScanMap } from "./loadScanMap";
import type { CardScanMap } from "./resolveScanCandidates";

export type ScanResources = {
  identifier: Pick<CardIdentifier, "identify">;
  scanMap: CardScanMap;
};

let cachedResourcesPromise: Promise<ScanResources> | null = null;

/**
 * Loads the fingerprint library and the scan map and builds one card identifier,
 * shared by every scanner on the page. Called only when a player first opens a
 * scanner (NFR-014). A failed load is not remembered, so the next call retries;
 * a newer in-flight attempt is never discarded by an older failure (REQ-249).
 */
export function loadScanResources(): Promise<ScanResources> {
  if (!cachedResourcesPromise) {
    const attempt: Promise<ScanResources> = Promise.all([loadHashDb(), loadScanMap()])
      .then(([db, scanMap]) => ({ identifier: new CardIdentifier(db), scanMap }))
      .catch((error: unknown) => {
        if (cachedResourcesPromise === attempt) cachedResourcesPromise = null;
        throw error;
      });
    cachedResourcesPromise = attempt;
  }

  return cachedResourcesPromise;
}
