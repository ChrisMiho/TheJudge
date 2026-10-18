import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../../../types";
import { deriveCardImageUrl } from "../../cardImage";
import type { Candidate } from "../types";
import {
  metadataLookupFor,
  resolveScanCandidates,
  resolveScanCandidatesRanked,
  type CardScanMap
} from "../resolveScanCandidates";

function makeMetadata(cardId: string, name: string, imageId = ""): CardMetadataItem {
  return {
    cardId,
    name,
    imageId,
    colors: [],
  };
}

const COUNTERSPELL_ORACLE_ID = "oracle-counterspell";
const LIGHTNING_BOLT_ORACLE_ID = "oracle-lightning-bolt";

// REQ-048: the scan map carries `{ oracleId, name }` only; the scanned printing's
// image is derived from its printing id (REQ-174's template).
const scanMap: CardScanMap = {
  "printing-counterspell-a": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell" },
  "printing-counterspell-b": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell" },
  "printing-lightning-bolt": { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt" },
  "printing-unresolvable-metadata": { oracleId: "oracle-not-in-metadata", name: "Ghost Card" },
  "printing-no-image": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell" }
};

const cardMetadata: CardMetadataItem[] = [
  makeMetadata(COUNTERSPELL_ORACLE_ID, "Counterspell", "counterspell-oracle-id"),
  makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "lightning-bolt-oracle-id")
];

describe("Frontend - Card Scan", () => {
describe("resolveScanCandidates", () => {
  it("resolves a known printing id to the expected CardMetadataItem", () => {
    const candidates: Candidate[] = [{ card_id: "printing-lightning-bolt", distance: 10 }];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "lightning-bolt-oracle-id")]);
  });

  it("collapses multiple printings of one oracle id to a single candidate by best distance", () => {
    const candidates: Candidate[] = [
      { card_id: "printing-counterspell-a", distance: 40 },
      { card_id: "printing-counterspell-b", distance: 5 }
    ];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].cardId).toBe(COUNTERSPELL_ORACLE_ID);
  });

  it("drops candidates with no scan-map entry without breaking the resolver", () => {
    const candidates: Candidate[] = [
      { card_id: "printing-not-in-scan-map", distance: 1 },
      { card_id: "printing-lightning-bolt", distance: 10 }
    ];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "lightning-bolt-oracle-id")]);
  });

  it("drops scan-map entries whose oracle id is missing from committed metadata", () => {
    const candidates: Candidate[] = [{ card_id: "printing-unresolvable-metadata", distance: 1 }];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toEqual([]);
  });

  it("returns candidates ranked ascending by distance regardless of input order", () => {
    const candidates: Candidate[] = [
      { card_id: "printing-counterspell-a", distance: 50 },
      { card_id: "printing-lightning-bolt", distance: 5 }
    ];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved.map((item) => item.cardId)).toEqual([
      LIGHTNING_BOLT_ORACLE_ID,
      COUNTERSPELL_ORACLE_ID
    ]);
  });
});

describe("resolveScanCandidatesRanked — scanImageUrl", () => {
  // Literal pairs taken from the committed cardScanMap.json before it dropped `imageUrl`:
  // the derived address equals the old address with its `?<timestamp>` suffix removed.
  it.each([
    [
      "0000419b-0bba-4488-8f7a-6194544ce91e",
      "https://cards.scryfall.io/normal/front/0/0/0000419b-0bba-4488-8f7a-6194544ce91e.jpg?1721427487"
    ],
    [
      "02a35eac-b962-466e-a4da-a4010c68ef16",
      "https://cards.scryfall.io/normal/front/0/2/02a35eac-b962-466e-a4da-a4010c68ef16.jpg?1562825453"
    ],
    [
      "8615e46e-56c3-49f6-b4ad-44ec25be5f05",
      "https://cards.scryfall.io/normal/front/8/6/8615e46e-56c3-49f6-b4ad-44ec25be5f05.jpg?1698988526"
    ],
    [
      "fd95daa3-c1f6-4f4c-8dde-ad5a50bfea00",
      "https://cards.scryfall.io/normal/front/f/d/fd95daa3-c1f6-4f4c-8dde-ad5a50bfea00.jpg?1712353775"
    ]
  ])("derives printing %s to the old address minus its timestamp", (printingId, oldImageUrl) => {
    const map: CardScanMap = { [printingId]: { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt" } };

    const ranked = resolveScanCandidatesRanked([{ card_id: printingId, distance: 1 }], map, cardMetadata);

    expect(ranked[0].scanImageUrl).toBe(oldImageUrl.split("?")[0]);
  });

  it("carries the best-distance printing image as scanImageUrl", () => {
    const candidates: Candidate[] = [{ card_id: "printing-lightning-bolt", distance: 10 }];

    const ranked = resolveScanCandidatesRanked(candidates, scanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].scanImageUrl).toBe(deriveCardImageUrl("printing-lightning-bolt"));
  });

  it("uses the best-distance printing image when multiple printings exist for one oracle id", () => {
    const candidates: Candidate[] = [
      { card_id: "printing-counterspell-a", distance: 40 },
      { card_id: "printing-counterspell-b", distance: 5 }
    ];

    const ranked = resolveScanCandidatesRanked(candidates, scanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    // printing-b has best distance (5); its derived image should be carried
    expect(ranked[0].scanImageUrl).toBe(deriveCardImageUrl("printing-counterspell-b"));
  });

  it("falls back to the oracle-level image when the derived printing address is empty (id under 2 characters)", () => {
    const noImageScanMap: CardScanMap = {
      x: { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt" }
    };
    const candidates: Candidate[] = [{ card_id: "x", distance: 10 }];

    const ranked = resolveScanCandidatesRanked(candidates, noImageScanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].scanImageUrl).toBe(deriveCardImageUrl("lightning-bolt-oracle-id"));
  });
});

  it("reuses one card-id lookup per card-list array and builds a new one for a new array", () => {
    const first = metadataLookupFor(cardMetadata);
    resolveScanCandidatesRanked([{ card_id: "printing-lightning-bolt", distance: 1 }], scanMap, cardMetadata);
    expect(metadataLookupFor(cardMetadata)).toBe(first);
    expect(metadataLookupFor([...cardMetadata])).not.toBe(first);
  });
});
