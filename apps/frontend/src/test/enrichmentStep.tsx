import { useState } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EnrichmentStep } from "../components/EnrichmentStep";
import type { GameContext, ZoneCardItem, ZoneId } from "../types";

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
      onEditRequest={vi.fn()}
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

/** A thin stateful wrapper: unlike `renderEnrichment`'s mocked `onZonesChange` (which
 * drops the update, fine for tests that only inspect the mock's call args), this
 * actually feeds `onZonesChange` back into `zones`, so a target pill, a Mana spent
 * edit, or a note really re-renders — needed for tests that assert on the DOM after
 * an interaction rather than on a mock call. */
function StatefulEnrichmentHarness(
  overrides: Partial<EnrichmentStepProps> & { initialZones: Partial<Record<ZoneId, ZoneCardItem[]>> }
): JSX.Element {
  const { initialZones, ...rest } = overrides;
  const [zones, setZones] = useState(initialZones);
  return (
    <EnrichmentStep
      gameContext={singlePlayerGameContext}
      zones={zones}
      onZonesChange={setZones}
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
      onEditRequest={vi.fn()}
      {...rest}
    />
  );
}

export function renderStatefulEnrichmentWithDuplicates(): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  render(
    <StatefulEnrichmentHarness
      gameContext={twoPlayerGameContext}
      initialZones={{ stack: [card1, card2] }}
      activePlayers={["Player 1", "Player 2"]}
    />
  );
  return user;
}
