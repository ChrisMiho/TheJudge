// Bridges on-device identify() candidates (Scryfall printing ids) to existing
// CardMetadataItem records via the build-time printing-id -> oracle-id map
// (cardScanMap.json). Pure, decode-free, no network. (REQ-036, DEC-053.)

import type { CardMetadataItem } from "../../types";
import type { Candidate } from "./types";

/** One entry of the build-time printing-id -> oracle-id scan map. */
export interface CardScanMapEntry {
  oracleId: string;
  name: string;
  imageUrl: string;
}

/** cardScanMap.json shape: Scryfall printing id -> { oracleId, name }. */
export type CardScanMap = Record<string, CardScanMapEntry>;

/** A resolved metadata candidate paired with its best engine distance and scanned printing image. */
export interface ResolvedScanCandidate {
  card: CardMetadataItem;
  distance: number;
  /** Scanned printing's imageUrl; falls back to card.imageUrl when printing image is absent. */
  scanImageUrl: string;
}

/**
 * Resolve ranked engine candidates (Scryfall printing ids) to existing
 * CardMetadataItem records, collapsing repeated oracle ids to the single best
 * (lowest-distance) candidate and dropping anything that doesn't resolve to a
 * committed metadata record. Distances are preserved so the caller can apply
 * confidence gating and temporal voting on the *oracle* identity (different
 * printings of one card must not split a vote). Ranked ascending by distance.
 */
export function resolveScanCandidatesRanked(
  candidates: Candidate[],
  scanMap: CardScanMap,
  cardMetadata: CardMetadataItem[]
): ResolvedScanCandidate[] {
  const metadataByCardId = new Map(cardMetadata.map((item) => [item.cardId, item]));
  const ordered = [...candidates].sort((a, b) => a.distance - b.distance);

  const resolved: ResolvedScanCandidate[] = [];
  const seenOracleIds = new Set<string>();

  for (const candidate of ordered) {
    const scanEntry = scanMap[candidate.card_id];
    if (!scanEntry) continue;
    if (seenOracleIds.has(scanEntry.oracleId)) continue;

    const metadataItem = metadataByCardId.get(scanEntry.oracleId);
    if (!metadataItem) continue;

    seenOracleIds.add(scanEntry.oracleId);
    const scanImageUrl = scanEntry.imageUrl || metadataItem.imageUrl;
    resolved.push({ card: metadataItem, distance: candidate.distance, scanImageUrl });
  }

  return resolved;
}

/**
 * Resolve ranked engine candidates to existing CardMetadataItem records
 * (distances dropped). Thin wrapper over resolveScanCandidatesRanked.
 */
export function resolveScanCandidates(
  candidates: Candidate[],
  scanMap: CardScanMap,
  cardMetadata: CardMetadataItem[]
): CardMetadataItem[] {
  return resolveScanCandidatesRanked(candidates, scanMap, cardMetadata).map((entry) => entry.card);
}
