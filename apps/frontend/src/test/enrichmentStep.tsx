import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EnrichmentStep } from "../components/EnrichmentStep";
import {
  card,
  card1,
  card2,
  singlePlayerGameContext,
  twoPlayerGameContext
} from "./enrichmentFixtures";
import { StatefulEnrichmentHarness } from "./StatefulEnrichmentHarness";

export { card, card1, card2, singlePlayerGameContext, twoPlayerGameContext };

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
