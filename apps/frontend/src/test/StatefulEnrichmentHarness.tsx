import { useState } from "react";
import { vi } from "vitest";
import { EnrichmentStep } from "../components/EnrichmentStep";
import type { ZoneCardItem, ZoneId } from "../types";
import { singlePlayerGameContext } from "./enrichmentFixtures";

type EnrichmentStepProps = Parameters<typeof EnrichmentStep>[0];

/** A thin stateful wrapper: unlike `renderEnrichment`'s mocked `onZonesChange` (which
 * drops the update, fine for tests that only inspect the mock's call args), this
 * actually feeds `onZonesChange` back into `zones`, so a target pill, a Mana spent
 * edit, or a note really re-renders — needed for tests that assert on the DOM after
 * an interaction rather than on a mock call. */
export function StatefulEnrichmentHarness(
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
