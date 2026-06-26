import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ConversationThread } from "./ConversationThread";
import { FrozenContextSummary } from "./FrozenContextSummary";
import type { CardMetadataItem, ConversationMessage, GameContext } from "../types";

afterEach(cleanup);

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
