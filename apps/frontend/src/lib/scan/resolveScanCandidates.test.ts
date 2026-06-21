import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../../types";
import type { Candidate } from "./types";
import { resolveScanCandidates, type CardScanMap } from "./resolveScanCandidates";

function makeMetadata(cardId: string, name: string): CardMetadataItem {
  return {
    cardId,
    name,
    oracleText: "",
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

const COUNTERSPELL_ORACLE_ID = "oracle-counterspell";
const LIGHTNING_BOLT_ORACLE_ID = "oracle-lightning-bolt";

const scanMap: CardScanMap = {
  "printing-counterspell-a": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell" },
  "printing-counterspell-b": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell" },
  "printing-lightning-bolt": { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt" },
  "printing-unresolvable-metadata": { oracleId: "oracle-not-in-metadata", name: "Ghost Card" }
};

const cardMetadata: CardMetadataItem[] = [
  makeMetadata(COUNTERSPELL_ORACLE_ID, "Counterspell"),
  makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt")
];

describe("resolveScanCandidates", () => {
  it("resolves a known printing id to the expected CardMetadataItem", () => {
    const candidates: Candidate[] = [{ card_id: "printing-lightning-bolt", distance: 10 }];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt")]);
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

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt")]);
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
