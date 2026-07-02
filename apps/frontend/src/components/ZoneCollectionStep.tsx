import { useEffect, useMemo, useState } from "react";
import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { NO_MATCH_COPY } from "../lib/search";
import { ZONE_LABELS } from "../lib/zoneLabels";
import {
  appendZoneCard,
  buildZoneCardFromMetadata,
  removeZoneCardByInstanceId,
  validateZoneCardAdd
} from "../lib/zoneCards";
import { useAutocompleteKeyboard } from "../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../hooks/useAutocompleteSuggestions";
import { useScanCapture, type ScanAddOutcome } from "../hooks/useScanCapture";
import type { CardMetadataItem, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import { PageShell } from "./PageShell";
import { StagedStepHeader } from "./StagedStepHeader";
import { ZoneCardPicker } from "./ZoneCardPicker";

type ZoneCollectionStepProps = {
  selectedZones: ZoneId[];
  zones: Partial<Record<ZoneId, ZoneCardItem[]>>;
  onZonesChange: (zones: Partial<Record<ZoneId, ZoneCardItem[]>>) => void;
  cardMetadata: CardMetadataItem[];
  isMetadataLoading: boolean;
  activePlayer: PlayerLabel;
  activePlayers: PlayerLabel[];
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  onFlashStatus: (message: string) => void;
  statusMessage: string | null;
};

export function ZoneCollectionStep({
  selectedZones,
  zones,
  onZonesChange,
  cardMetadata,
  isMetadataLoading,
  activePlayer,
  activePlayers,
  displayNamesByPlayer,
  onBack,
  onContinue,
  canContinue,
  onFlashStatus,
  statusMessage
}: ZoneCollectionStepProps): JSX.Element {
  const orderedSelectedZones = useMemo(
    () => CANONICAL_ZONE_ORDER.filter((zone) => selectedZones.includes(zone)),
    [selectedZones]
  );
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardMetadataItem | null>(null);
  const [pendingOwner, setPendingOwner] = useState<PlayerLabel>(activePlayer);
  // instanceIds auto-added to the active zone during the current scan session; feeds the
  // top-right review bubble. Resets when the scan screen opens or the zone changes.
  const [scanSessionInstanceIds, setScanSessionInstanceIds] = useState<string[]>([]);

  const activeZone = orderedSelectedZones[activeZoneIndex];
  const activeZoneCards = activeZone ? (zones[activeZone] ?? []) : [];

  useEffect(() => {
    if (activeZoneIndex >= orderedSelectedZones.length) {
      setActiveZoneIndex(Math.max(orderedSelectedZones.length - 1, 0));
    }
  }, [activeZoneIndex, orderedSelectedZones.length]);

  useEffect(() => {
    setSearchInput("");
    setSelectedCard(null);
    setPendingOwner(activePlayer);
  }, [activeZone, activePlayer]);

  const suggestions = useAutocompleteSuggestions({
    cards: cardMetadata,
    query: searchInput
  });

  const keyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: (card) => setSelectedCard(card)
  });

  const scanCapture = useScanCapture({
    cardMetadata,
    onScanCandidateSelected: (card, scanImageUrl) => {
      const outcome = addCardToActiveZone(card, scanImageUrl);
      if (outcome.added) {
        const instanceId = outcome.instanceId;
        if (instanceId) {
          setScanSessionInstanceIds((ids) => (ids.includes(instanceId) ? ids : [...ids, instanceId]));
        }
      }
      return outcome;
    }
  });
  const closeScan = scanCapture.closeScan;
  const isScanOpen = scanCapture.isOpen;

  useEffect(() => {
    closeScan();
    setScanSessionInstanceIds([]);
  }, [activeZone, closeScan]);

  function updateZoneCards(zoneId: ZoneId, cards: ZoneCardItem[]): void {
    onZonesChange({
      ...zones,
      [zoneId]: cards
    });
  }

  function addCardToActiveZone(card: CardMetadataItem, scanImageUrl?: string): ScanAddOutcome {
    if (!activeZone) {
      return { added: false, message: "No active zone" };
    }

    const nextCard = buildZoneCardFromMetadata(card, scanImageUrl);
    if (activeZone !== "stack") {
      nextCard.owner = pendingOwner;
    }
    const validation = validateZoneCardAdd(activeZoneCards, nextCard, activeZone);
    if (!validation.ok) {
      return { added: false, message: validation.message };
    }

    updateZoneCards(activeZone, appendZoneCard(activeZoneCards, nextCard));
    return { added: true, instanceId: nextCard.instanceId };
  }

  function handleAddSelectedCard(): void {
    if (!activeZone || !selectedCard) {
      return;
    }

    const outcome = addCardToActiveZone(selectedCard);
    if (!outcome.added) {
      onFlashStatus(outcome.message);
      return;
    }

    setSearchInput("");
    setSelectedCard(null);
    onFlashStatus(activeZone === "stack" ? "Stacked" : "Card added");
  }

  function handleRemoveCard(instanceId: string): void {
    if (!activeZone) {
      return;
    }
    updateZoneCards(activeZone, removeZoneCardByInstanceId(activeZoneCards, instanceId));
  }

  function handleContinue(): void {
    if (
      canContinue &&
      selectedZones.includes("stack") &&
      (zones.stack?.length ?? 0) === 0
    ) {
      onFlashStatus(
        "Stack zone is selected but empty - fine for board-state questions; add stack cards if you want stack resolution."
      );
    }

    onContinue();
  }

  const addButtonLabel =
    activeZone === "stack" ? (activeZoneCards.length === 0 ? "Begin stackening!" : "Add to Stack") : "Add card";

  return (
    <PageShell>
      {!isScanOpen && (
        <>
          <StagedStepHeader stepName="Add cards to zones" />
          <p className="text-sm text-zinc-400">
            Add at least one card in a selected zone. Other selected zones may stay empty.
          </p>
        </>
      )}

      {orderedSelectedZones.length === 0 ? (
        !isScanOpen && (
          <p className="rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 text-sm text-zinc-300">
            No zones selected. Continue when you are ready to enrich context or ask a timing question.
          </p>
        )
      ) : (
        <>
          {!isScanOpen && (
            <div className="flex flex-wrap gap-2">
              {orderedSelectedZones.map((zone, index) => {
                const count = zones[zone]?.length ?? 0;
                const isActive = index === activeZoneIndex;
                return (
                  <button
                    key={zone}
                    type="button"
                    aria-label={`Zone tab: ${ZONE_LABELS[zone]}`}
                    aria-pressed={isActive}
                    data-accent-current={isActive}
                    onClick={() => setActiveZoneIndex(index)}
                    className="ambient-accent-surface ambient-accent-interactive motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700/80"
                  >
                    {`${ZONE_LABELS[zone]}${count > 0 ? ` (${count})` : ""}`}
                  </button>
                );
              })}
            </div>
          )}

          {activeZone && (
            <ZoneCardPicker
              zoneId={activeZone}
              cards={activeZoneCards}
              activePlayers={activePlayers}
              displayNamesByPlayer={displayNamesByPlayer}
              pendingOwner={pendingOwner}
              onPendingOwnerChange={setPendingOwner}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearchKeyDown={keyboard.handleKeyDown}
              showSuggestions={searchInput.trim().length >= 3 && keyboard.isOpen}
              isMetadataLoading={isMetadataLoading}
              suggestions={suggestions}
              noMatchCopy={NO_MATCH_COPY}
              activeSuggestionIndex={keyboard.activeIndex}
              onSuggestionHover={keyboard.setActiveIndex}
              onSuggestionSelect={(card) => {
                setSelectedCard(card);
                keyboard.closeSuggestions();
              }}
              selectedCard={selectedCard}
              addButtonLabel={addButtonLabel}
              onAddSelectedCard={handleAddSelectedCard}
              onRemoveCard={handleRemoveCard}
              scan={{
                isOpen: isScanOpen,
                isLoading: scanCapture.isLoading,
                error: scanCapture.error,
                convergence: scanCapture.convergence,
                addConfirmation: scanCapture.addConfirmation,
                scanDebug: scanCapture.scanDebug,
                sessionInstanceIds: scanSessionInstanceIds,
                onOpen: async () => {
                  setSelectedCard(null);
                  setScanSessionInstanceIds([]);
                  await scanCapture.openScan();
                },
                onExitToManual: scanCapture.closeScan,
                identify: scanCapture.identify,
                onCameraStatusChange: scanCapture.setCameraStatus,
                onAcquisitionDiagnostic: scanCapture.recordAcquisitionDiagnostic
              }}
            />
          )}
        </>
      )}

      {!isScanOpen && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onBack}
              className="motion-hover motion-press motion-focus rounded-xl border border-zinc-500 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="motion-hover motion-press motion-focus rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>

          {!canContinue && (
            <p className="text-xs text-zinc-400">
              Add at least one card in a selected zone before continuing.
            </p>
          )}
        </>
      )}

      {!isScanOpen && statusMessage && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
          {statusMessage}
        </p>
      )}
    </PageShell>
  );
}
