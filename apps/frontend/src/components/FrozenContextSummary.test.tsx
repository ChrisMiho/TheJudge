import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FrozenContextSummary } from "./FrozenContextSummary";
import type { GameContext } from "../types";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const frozenContext: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "combat",
  combatStep: "declare_blockers",
  activePlayer: "Player 1",
  selectedZones: ["stack"],
  zones: {
    stack: [{ cardId: "opt", name: "Opt", oracleText: "Scry 1, then draw a card." }]
  }
};

describe("FrozenContextSummary", () => {
  it("toggles the animated expanded state without changing disclosure semantics", async () => {
    const user = userEvent.setup();
    render(<FrozenContextSummary frozenGameContext={frozenContext} />);

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    expect(summary).toHaveAttribute("data-expanded", "false");
    expect(screen.queryByText("Setup")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show full game context" }));

    expect(summary).toHaveAttribute("data-expanded", "true");
    expect(screen.getByText("Setup").closest(".frozen-context-disclosure")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Hide full game context" }));

    expect(summary).toHaveAttribute("data-expanded", "false");
    expect(screen.queryByText("Setup")).not.toBeInTheDocument();
  });

  it("uses shared motion tokens and participates in reduced-motion suppression", () => {
    expect(appCss).toMatch(
      /\.frozen-context-summary \{[^}]*var\(--motion-base\)[^}]*var\(--motion-ease-emphasized\)/
    );
    expect(appCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.frozen-context-summary/
    );
  });
});
