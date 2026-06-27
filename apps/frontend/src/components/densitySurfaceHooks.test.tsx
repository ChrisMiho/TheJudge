import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ConversationThread } from "./ConversationThread";
import { FrozenContextSummary } from "./FrozenContextSummary";
import type { CardMetadataItem, ConversationMessage, GameContext } from "../types";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const cardWithoutImage: CardMetadataItem = {
  cardId: "opt",
  name: "Opt",
  oracleText: "Scry 1, then draw a card.",
  imageUrl: "",
  manaCost: "{U}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["U"],
  supertypes: [],
  subtypes: []
};

const messages: ConversationMessage[] = [
  { role: "assistant", content: "The stack resolves." },
  { role: "user", content: "What about hexproof?" }
];

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

describe("density surface hooks", () => {
  it("uses a viewport-safe zone scroll cap without imposing a stale fixed tile height", () => {
    expect(appCss).toMatch(/\.zone-card-grid \{[^}]*max-height: 70dvh;/);
    expect(appCss).not.toContain("--zone-card-tile-height");
    expect(appCss).not.toContain('[data-layout-density="slim"] .zone-card-tile-image');
  });

  it("uses a viewport-safe enrichment scroll cap for full-width card images", () => {
    expect(appCss).toContain(".scroll-cap-4-enrichment {\n  --enrichment-card-row-gap: 0.75rem;\n  max-height: 70dvh;");
    expect(appCss).not.toContain("--enrichment-card-row-height");
  });

  it("marks the no-image card preview placeholder for slim height overrides", () => {
    render(
      <CardSelectionPreview
        card={cardWithoutImage}
        contextTitle="Stack card"
        contextContent={null}
      />
    );

    expect(screen.getByText("No image")).toHaveClass("card-preview-placeholder");
  });

  it("marks the conversation thread for slim height overrides", () => {
    render(<ConversationThread messages={messages} />);

    expect(screen.getByText("The stack resolves.").closest(".conversation-thread")).not.toBeNull();
  });

  it("marks the frozen context summary and expanded detail rows for slim disclosure padding", async () => {
    const user = userEvent.setup();
    render(<FrozenContextSummary frozenGameContext={frozenContext} />);

    expect(screen.getByLabelText("Frozen game context")).toHaveClass("frozen-context-summary");
    await user.click(screen.getByRole("button", { name: "Show full game context" }));
    expect(screen.getAllByText("Opt").at(-1)?.closest("li")).toHaveClass("frozen-context-detail-row");
  });
});
