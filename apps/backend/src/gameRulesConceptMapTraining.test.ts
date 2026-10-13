// REQ-234 / REQ-236: the search-only entries reach live search but not the training questions. In its own file
// because turning them off lasts for the rest of the process, as it does in the training export.
import { describe, expect, it } from "vitest";
import { CONCEPT_MAP, conceptTermsForCard, turnOffSearchOnlyEntriesForTraining } from "./gameRulesConceptMap.js";

describe("REQ-234 search-only concept-map entries", () => {
  it("marks exactly the 79th to 84th entries search-only", () => {
    const searchOnly = CONCEPT_MAP.flatMap(([, , options], index) => (options?.searchOnly ? [index + 1] : []));
    expect(searchOnly).toEqual([79, 80, 81, 82, 83, 84]);
  });

  it("keeps their terms in live search and drops only them once turned off for training", () => {
    const card = { name: "Ephemeral Hydra", oracleText: "At the beginning of your upkeep, draw a card.\nChoose one — Gain 2 life; or scry 2." };
    expect(conceptTermsForCard(card)).toEqual([
      "upkeep step triggered ability",
      "draw card",
      "modal spell modes",
      "handling triggered abilities",
      "casting spells"
    ]);
    turnOffSearchOnlyEntriesForTraining();
    expect(conceptTermsForCard(card)).toEqual(["upkeep step triggered ability", "draw card", "modal spell modes"]);
  });
});
