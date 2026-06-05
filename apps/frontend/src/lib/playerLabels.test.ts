import { describe, expect, it } from "vitest";
import { buildPlayerDisplayNameMap, formatPlayerDisplayLabel } from "./playerLabels";
import type { GamePlayerContext } from "../types";

describe("playerLabels", () => {
  it("keeps the canonical label when display name is unset, blank, or the same as the label", () => {
    expect(formatPlayerDisplayLabel("Player 1")).toBe("Player 1");
    expect(formatPlayerDisplayLabel("Player 1", "   ")).toBe("Player 1");
    expect(formatPlayerDisplayLabel("Player 1", "Player 1")).toBe("Player 1");
  });

  it("adds a trimmed custom display name in parentheses", () => {
    expect(formatPlayerDisplayLabel("Player 2", "  Bob  ")).toBe("Player 2 (Bob)");
  });

  it("builds a player display-name lookup from game context players", () => {
    const players: GamePlayerContext[] = [
      { label: "Player 1", lifeTotal: 40, displayName: "Alice" },
      { label: "Player 2", lifeTotal: 40 }
    ];

    expect(buildPlayerDisplayNameMap(players)).toEqual({
      "Player 1": "Alice",
      "Player 2": undefined
    });
  });
});
