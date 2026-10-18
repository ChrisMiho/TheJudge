// Bridges on-device identify() candidates (Scryfall printing ids) to existing
// CardMetadataItem records via the build-time printing-id -> oracle-id map
// (cardScanMap.json). Pure, decode-free, no network. (REQ-036, DEC-053.)

import type { CardMetadataItem } from "../../types";
import { deriveCardImageUrl } from "../cardImage";
import type { Candidate } from "./types";

/** One entry of the build-time printing-id -> oracle-id scan map. */
export interface CardScanMapEntry {
  oracleId: string;
  name: string;
}

/** cardScanMap.json shape: Scryfall printing id -> { oracleId, name }. */
export type CardScanMap = Record<string, CardScanMapEntry>;

/** A resolved metadata candidate paired with its best engine distance and scanned printing image. */
export interface ResolvedScanCandidate {
  card: CardMetadataItem;
  distance: number;
  /** Scanned printing's image, derived from its printing id; falls back to the oracle-level image when empty. */
  scanImageUrl: string;
}

// The card-id lookup is built once per card-list array, not once per camera frame.
const metadataLookups = new WeakMap<CardMetadataItem[], Map<string, CardMetadataItem>>();

/** @internal exported for tests: the cached card-id lookup for a card list. */
export function metadataLookupFor(cardMetadata: CardMetadataItem[]): Map<string, CardMetadataItem> {
  let lookup = metadataLookups.get(cardMetadata);
  if (!lookup) {
    lookup = new Map(cardMetadata.map((item) => [item.cardId, item]));
    metadataLookups.set(cardMetadata, lookup);
  }
  return lookup;
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
  const metadataByCardId = metadataLookupFor(cardMetadata);
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
    // REQ-048: the scanned printing's image is derived from its printing id (REQ-174's
    // single template); an empty derived address falls back to the oracle-level image.
    const scanImageUrl =
      deriveCardImageUrl(candidate.card_id) || deriveCardImageUrl(metadataItem.imageId);
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
