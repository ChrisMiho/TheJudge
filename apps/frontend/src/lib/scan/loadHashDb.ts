import { readDb } from "./dbformat";
import type { HashDb } from "./types";

const HASH_DB_URL = "/data/cardhashes.bin";

let cachedHashDbPromise: Promise<HashDb> | null = null;

export function loadHashDb(): Promise<HashDb> {
  if (!cachedHashDbPromise) {
    const attempt: Promise<HashDb> = fetch(HASH_DB_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load card hash DB: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => readDb(new Uint8Array(buffer)))
      .catch((error: unknown) => {
        // A failed download is not remembered: the next call fetches fresh. A newer
        // in-flight attempt is never discarded by an older failure (REQ-249).
        if (cachedHashDbPromise === attempt) cachedHashDbPromise = null;
        throw error;
      });
    cachedHashDbPromise = attempt;
  }

  return cachedHashDbPromise;
}
