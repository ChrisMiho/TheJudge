import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EnrichmentStep } from "../components/EnrichmentStep";
import type { GameContext, ZoneCardItem } from "../types";

export const card: ZoneCardItem = {
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

export const card1: ZoneCardItem = { ...card, instanceId: "inst-1" };

export const card2: ZoneCardItem = { ...card, instanceId: "inst-2" };

export const singlePlayerGameContext: GameContext = {
  playerCount: 1,
  players: [{ label: "Player 1", lifeTotal: 20 }],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};

export const twoPlayerGameContext: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};

type EnrichmentStepProps = Parameters<typeof EnrichmentStep>[0];

export function renderEnrichment(
  overrides: Partial<EnrichmentStepProps> = {}
): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  render(
    <EnrichmentStep
      gameContext={singlePlayerGameContext}
      zones={{ stack: [card] }}
      onZonesChange={vi.fn()}
      activePlayers={["Player 1"]}
      question=""
      onQuestionChange={vi.fn()}
      onDecryptStack={vi.fn()}
      onBack={vi.fn()}
      canDecrypt
      isSubmitting={false}
      answer={null}
      error={null}
      canRetry
      retryCountdown={0}
      onRetry={vi.fn()}
      statusMessage={null}
      isConversationActive={false}
      isFollowUpSubmitting={false}
      visibleMessages={[]}
      frozenGameContext={null}
      onFollowUp={vi.fn()}
      onStartOver={vi.fn()}
      {...overrides}
    />
  );
  return user;
}

export function renderEnrichmentWithDuplicates(
  onZonesChange = vi.fn()
): ReturnType<typeof userEvent.setup> {
  return renderEnrichment({
    gameContext: twoPlayerGameContext,
    zones: { stack: [card1, card2] },
    activePlayers: ["Player 1", "Player 2"],
    onZonesChange
  });
}
