// Bridges on-device identify() candidates (Scryfall printing ids) to existing
// CardMetadataItem records via the build-time printing-id -> oracle-id map
// (cardScanMap.json). Pure, decode-free, no network. (REQ-036, DEC-053.)

import type { CardMetadataItem } from "../../types";
import type { Candidate } from "./types";

/** One entry of the build-time printing-id -> oracle-id scan map. */
export interface CardScanMapEntry {
  oracleId: string;
  name: string;
}

/** cardScanMap.json shape: Scryfall printing id -> { oracleId, name }. */
export type CardScanMap = Record<string, CardScanMapEntry>;

/**
 * Resolve ranked engine candidates to existing CardMetadataItem records.
 * Collapses repeated oracle ids to the single best (lowest-distance) candidate
 * and drops anything that doesn't resolve to a committed metadata record.
 * Returns candidates ranked ascending by distance.
 */
export function resolveScanCandidates(
  candidates: Candidate[],
  scanMap: CardScanMap,
  cardMetadata: CardMetadataItem[]
): CardMetadataItem[] {
  const metadataByCardId = new Map(cardMetadata.map((item) => [item.cardId, item]));
  const ordered = [...candidates].sort((a, b) => a.distance - b.distance);

  const resolved: CardMetadataItem[] = [];
  const seenOracleIds = new Set<string>();

  for (const candidate of ordered) {
    const scanEntry = scanMap[candidate.card_id];
    if (!scanEntry) continue;
    if (seenOracleIds.has(scanEntry.oracleId)) continue;

    const metadataItem = metadataByCardId.get(scanEntry.oracleId);
    if (!metadataItem) continue;

    seenOracleIds.add(scanEntry.oracleId);
    resolved.push(metadataItem);
  }

  return resolved;
}
