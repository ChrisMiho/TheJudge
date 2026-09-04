import { existsSync, readFileSync } from "node:fs";

/**
 * One card's descriptive block, keyed by Scryfall `oracle_id` (REQ-175). Two
 * server-side readers share this one committed artifact
 * (`apps/backend/data/cardDetailByOracleId.json`): the read-only
 * `GET /api/cards/:oracleId` route and ask-ai's internal server-side
 * resolution (REQ-176) — so the route and the prompt cannot drift.
 */
export type CardDetailEntry = {
  oracleText: string;
  typeLine: string;
  manaCost: string;
  manaValue: number;
  colors: string[];
  supertypes: string[];
  subtypes: string[];
};

const warnedLoadFailures = new Set<string>();

function isCardDetailEntry(value: unknown): value is CardDetailEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CardDetailEntry>;
  return (
    typeof candidate.oracleText === "string" &&
    typeof candidate.typeLine === "string" &&
    typeof candidate.manaCost === "string" &&
    typeof candidate.manaValue === "number" &&
    Array.isArray(candidate.colors) &&
    Array.isArray(candidate.supertypes) &&
    Array.isArray(candidate.subtypes)
  );
}

function normalizeCardDetailIndex(value: unknown): Map<string, CardDetailEntry> {
  const index = new Map<string, CardDetailEntry>();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return index;
  }

  for (const [oracleId, entry] of Object.entries(value)) {
    if (oracleId.trim().length > 0 && isCardDetailEntry(entry)) {
      index.set(oracleId, entry);
    }
  }

  return index;
}

export function loadCardDetailIndex(filePath: string): Map<string, CardDetailEntry> {
  if (!existsSync(filePath)) {
    warnLoadFailureOnce(
      filePath,
      `Card detail file missing; GET /api/cards/:oracleId and ask-ai's server-side card-text resolution are disabled: ${filePath}`
    );
    return new Map();
  }

  try {
    return normalizeCardDetailIndex(JSON.parse(readFileSync(filePath, "utf8")));
  } catch (error) {
    warnLoadFailureOnce(filePath, `Card detail file could not be parsed: ${filePath}`, error);
    return new Map();
  }
}

function warnLoadFailureOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) {
    return;
  }

  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}
