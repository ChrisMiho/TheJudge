import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GameContext } from "../types";
import {
  FrozenGameContextDetails,
  getFrozenGameContextTriggerLabel
} from "./FrozenGameContextDetails";

afterEach(cleanup);

const frozenContext: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", displayName: "Chris", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 18 }
  ],
  turnPhase: "combat",
  combatStep: "declare_blockers",
  activePlayer: "Player 1",
  selectedZones: ["battlefield", "stack"],
  zones: {
    battlefield: [
      {
        cardId: "bear",
        name: "Grizzly Bears",
        typeLine: "Creature — Bear",
        oracleText: "",
        owner: "Player 2"
      }
    ],
    stack: [
      {
        cardId: "opt",
        name: "Opt",
        oracleText: "Scry 1, then draw a card.",
        caster: "Player 1",
        manaSpent: 4,
        contextNotes: "Cast for an alternate cost"
      }
    ]
  }
};

describe("Frontend - Frozen game context details", () => {
  it("builds a terse trigger label from the phase and populated-zone count", () => {
    expect(getFrozenGameContextTriggerLabel(frozenContext)).toBe(
      "Combat — Declare Blockers · 2 populated zones"
    );
  });

  it("renders complete frozen context read-only from the authoritative label maps", () => {
    render(<FrozenGameContextDetails frozenGameContext={frozenContext} />);

    expect(screen.getByText("Combat — Declare Blockers")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "Active player: Player 1 (Chris)")
    ).toBeInTheDocument();
    expect(screen.getByText("Player 1 (Chris): 20 life")).toBeInTheDocument();
    expect(screen.getByText("Player 2: 18 life")).toBeInTheDocument();
    expect(screen.getByText("Grizzly Bears")).toBeInTheDocument();
    expect(screen.getByText("Owner: Player 2")).toBeInTheDocument();
    expect(screen.getByText("Opt")).toBeInTheDocument();
    expect(screen.getByText("Caster: Player 1 (Chris)")).toBeInTheDocument();
    expect(screen.getByText("Mana spent: 4")).toBeInTheDocument();
    expect(screen.getByText("Notes: Cast for an alternate cost")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
  });
});
