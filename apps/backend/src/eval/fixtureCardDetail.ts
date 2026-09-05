// REQ-177: single canonical card-detail-index builder for eval fixtures.
//
// REQ-176 moved card-intrinsic field resolution server-side, behind a
// `cardId`-keyed `CardDetailIndex` (see `../prompt/context.ts`). Both the
// eval harness (`contextEvaluationHarness.test.ts`) and the retrieval
// relevance report (`retrievalReportInputs.ts`) need to resolve that index
// from a fixture's own request data — the fixture corpus is committed with
// card fields inline (as a real client sends them), not through the
// production `cardDetailByOracleId.json` artifact, so an owner-approved
// Scryfall refresh can never churn a prompt golden.
//
// Before this module existed, the harness test built this index locally and
// the report built none at all — every card came through
// `resolveCardDetail`'s empty fallback, so the report scored a query
// production would never build (blank oracle text, blank type line). This
// single implementation is what both call, so they cannot resolve
// card-intrinsic fields differently again.

import type { CardDetailEntry } from "../cardDetail.js";
import type { CardDetailIndex } from "../prompt/context.js";
import type { AskAiRequest, GameAskAiRequest, ZoneCardItem } from "../types/index.js";

export function cardDetailEntryFrom(card: Partial<ZoneCardItem>): CardDetailEntry {
  return {
    oracleText: card.oracleText ?? "",
    typeLine: card.typeLine ?? "",
    manaCost: card.manaCost ?? "",
    manaValue: card.manaValue ?? 0,
    colors: card.colors ?? [],
    supertypes: card.supertypes ?? [],
    subtypes: card.subtypes ?? []
  };
}

export function cardDetailIndexFromRequest(request: AskAiRequest): CardDetailIndex {
  const index: CardDetailIndex = new Map();

  if (request.mode === "lookup") {
    for (const card of request.cards ?? []) {
      index.set(card.cardId, cardDetailEntryFrom(card));
    }
    return index;
  }

  const zones = (request as GameAskAiRequest).gameContext.zones ?? {};
  for (const cards of Object.values(zones)) {
    for (const card of cards ?? []) {
      index.set(card.cardId, cardDetailEntryFrom(card));
    }
  }
  return index;
}
