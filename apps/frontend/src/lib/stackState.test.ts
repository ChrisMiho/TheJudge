import { describe, expect, it } from "vitest";
import type { StackItem } from "../types";
import {
  appendToStack,
  buildAskAiRequest,
  DEFAULT_QUESTION,
  DUPLICATE_CARD_MESSAGE,
  MAX_STACK_SIZE,
  removeFromStackById,
  STACK_LIMIT_MESSAGE,
  validateStackAdd
} from "./stackState";

function createCard(cardId: string, name: string): StackItem {
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

describe("stack state helpers", () => {
  it("falls back to default question when input is empty", () => {
    const card = createCard("opt", "Opt");
    const request = buildAskAiRequest("   ", [card]);
    expect(request.question).toBe(DEFAULT_QUESTION);
  });

  it("uses trimmed user question when provided", () => {
    const card = createCard("opt", "Opt");
    const request = buildAskAiRequest("  What happens? ", [card]);
    expect(request.question).toBe("What happens?");
  });

  it("rejects duplicate card adds", () => {
    const stack = [createCard("opt", "Opt")];
    const result = validateStackAdd(stack, createCard("opt", "Opt"));
    expect(result).toEqual({ ok: false, message: DUPLICATE_CARD_MESSAGE });
  });

  it("rejects adds when stack is at max size", () => {
    const fullStack = Array.from({ length: MAX_STACK_SIZE }, (_, index) =>
      createCard(`card-${index}`, `Card ${index}`)
    );
    const result = validateStackAdd(fullStack, createCard("new-card", "New Card"));
    expect(result).toEqual({ ok: false, message: STACK_LIMIT_MESSAGE });
  });

  it("appends card to end to preserve bottom-to-top order", () => {
    const initial = [createCard("opt", "Opt")];
    const updated = appendToStack(initial, createCard("bolt", "Lightning Bolt"));
    expect(updated.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
  });

  it("removes one card by id and keeps order of remaining cards", () => {
    const stack = [
      createCard("opt", "Opt"),
      createCard("counterspell", "Counterspell"),
      createCard("bolt", "Lightning Bolt")
    ];
    const updated = removeFromStackById(stack, "counterspell");
    expect(updated.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
  });
});
