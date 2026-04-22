import { describe, expect, it } from "vitest";
import type { BattlefieldContextItem, CardMetadataItem, GameContext, StackItem } from "../types";
import {
  appendToStack,
  buildAskAiRequest,
  buildStackItemFromMetadata,
  DEFAULT_CASTER,
  DEFAULT_QUESTION,
  DUPLICATE_CARD_MESSAGE,
  MAX_STACK_SIZE,
  removeFromStackById,
  STACK_LIMIT_MESSAGE,
  validateStackAdd
} from "./stackState";

function createMetadataCard(cardId: string, name: string): CardMetadataItem {
  return {
    cardId,
    name,
    oracleText: `${name} text`,
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

function createStackCard(cardId: string, name: string): StackItem {
  return buildStackItemFromMetadata(createMetadataCard(cardId, name));
}

function createGameContext(): GameContext {
  return {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ]
  };
}

function createBattlefieldContext(): BattlefieldContextItem[] {
  return [];
}

describe("stack state helpers", () => {
  it("falls back to default question when input is empty", () => {
    const card = createStackCard("opt", "Opt");
    const request = buildAskAiRequest("   ", createGameContext(), createBattlefieldContext(), [card]);
    expect(request.question).toBe(DEFAULT_QUESTION);
  });

  it("uses trimmed user question when provided", () => {
    const card = createStackCard("opt", "Opt");
    const request = buildAskAiRequest("  What happens? ", createGameContext(), createBattlefieldContext(), [card]);
    expect(request.question).toBe("What happens?");
  });

  it("rejects duplicate card adds", () => {
    const stack = [createStackCard("opt", "Opt")];
    const result = validateStackAdd(stack, createStackCard("opt", "Opt"));
    expect(result).toEqual({ ok: false, message: DUPLICATE_CARD_MESSAGE });
  });

  it("rejects adds when stack is at max size", () => {
    const fullStack = Array.from({ length: MAX_STACK_SIZE }, (_, index) =>
      createStackCard(`card-${index}`, `Card ${index}`)
    );
    const result = validateStackAdd(fullStack, createStackCard("new-card", "New Card"));
    expect(result).toEqual({ ok: false, message: STACK_LIMIT_MESSAGE });
  });

  it("appends card to end to preserve bottom-to-top order", () => {
    const initial = [createStackCard("opt", "Opt")];
    const updated = appendToStack(initial, createStackCard("bolt", "Lightning Bolt"));
    expect(updated.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
  });

  it("removes one card by id and keeps order of remaining cards", () => {
    const stack = [
      createStackCard("opt", "Opt"),
      createStackCard("counterspell", "Counterspell"),
      createStackCard("bolt", "Lightning Bolt")
    ];
    const updated = removeFromStackById(stack, "counterspell");
    expect(updated.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
  });

  it("builds stack entries with default caster and trimmed optional notes", () => {
    const entry = buildStackItemFromMetadata(createMetadataCard("bolt", "Lightning Bolt"), {
      contextNotes: "  kicked  "
    });

    expect(entry.caster).toBe(DEFAULT_CASTER);
    expect(entry.targets).toEqual([]);
    expect(entry.contextNotes).toBe("kicked");
  });

  it("includes provided context fields in ask-ai request", () => {
    const request = buildAskAiRequest("what now", createGameContext(), [{ name: "Rhystic Study", targets: [] }], [
      createStackCard("opt", "Opt")
    ]);

    expect(request.gameContext.playerCount).toBe(2);
    expect(request.battlefieldContext).toHaveLength(1);
  });
});
