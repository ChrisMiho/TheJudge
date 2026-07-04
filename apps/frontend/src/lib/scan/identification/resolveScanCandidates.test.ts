import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../../../types";
import type { Candidate } from "../types";
import { resolveScanCandidates, resolveScanCandidatesRanked, type CardScanMap } from "../resolveScanCandidates";

function makeMetadata(cardId: string, name: string, imageUrl = ""): CardMetadataItem {
  return {
    cardId,
    name,
    oracleText: "",
    imageUrl,
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
  "printing-counterspell-a": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell", imageUrl: "https://img/counterspell-a.jpg" },
  "printing-counterspell-b": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell", imageUrl: "https://img/counterspell-b.jpg" },
  "printing-lightning-bolt": { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt", imageUrl: "https://img/lightning-bolt.jpg" },
  "printing-unresolvable-metadata": { oracleId: "oracle-not-in-metadata", name: "Ghost Card", imageUrl: "" },
  "printing-no-image": { oracleId: COUNTERSPELL_ORACLE_ID, name: "Counterspell", imageUrl: "" }
};

const cardMetadata: CardMetadataItem[] = [
  makeMetadata(COUNTERSPELL_ORACLE_ID, "Counterspell", "https://img/counterspell-oracle.jpg"),
  makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "https://img/lightning-bolt-oracle.jpg")
];

describe("resolveScanCandidates", () => {
  it("resolves a known printing id to the expected CardMetadataItem", () => {
    const candidates: Candidate[] = [{ card_id: "printing-lightning-bolt", distance: 10 }];

    const resolved = resolveScanCandidates(candidates, scanMap, cardMetadata);

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "https://img/lightning-bolt-oracle.jpg")]);
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

    expect(resolved).toEqual([makeMetadata(LIGHTNING_BOLT_ORACLE_ID, "Lightning Bolt", "https://img/lightning-bolt-oracle.jpg")]);
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
  it("carries the best-distance printing image as scanImageUrl", () => {
    const candidates: Candidate[] = [{ card_id: "printing-lightning-bolt", distance: 10 }];

    const ranked = resolveScanCandidatesRanked(candidates, scanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].scanImageUrl).toBe("https://img/lightning-bolt.jpg");
  });

  it("uses the best-distance printing image when multiple printings exist for one oracle id", () => {
    const candidates: Candidate[] = [
      { card_id: "printing-counterspell-a", distance: 40 },
      { card_id: "printing-counterspell-b", distance: 5 }
    ];

    const ranked = resolveScanCandidatesRanked(candidates, scanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    // printing-b has best distance (5); its imageUrl should be carried
    expect(ranked[0].scanImageUrl).toBe("https://img/counterspell-b.jpg");
  });

  it("falls back to card.imageUrl when the printing image is empty", () => {
    const noImageScanMap: CardScanMap = {
      "printing-no-img": { oracleId: LIGHTNING_BOLT_ORACLE_ID, name: "Lightning Bolt", imageUrl: "" }
    };
    const candidates: Candidate[] = [{ card_id: "printing-no-img", distance: 10 }];

    const ranked = resolveScanCandidatesRanked(candidates, noImageScanMap, cardMetadata);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].scanImageUrl).toBe("https://img/lightning-bolt-oracle.jpg");
  });
});
