import { readDb } from "./dbformat";
import type { HashDb } from "./types";

const HASH_DB_URL = "/data/cardhashes.bin";

let cachedHashDbPromise: Promise<HashDb> | null = null;

export function loadHashDb(): Promise<HashDb> {
  if (!cachedHashDbPromise) {
    cachedHashDbPromise = fetch(HASH_DB_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load card hash DB: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => readDb(new Uint8Array(buffer)));
  }

  return cachedHashDbPromise;
}
