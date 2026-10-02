import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { useScanCapture, type HeldScanEntry, type ScanAddOutcome, type ScanHoldCheck } from "../hooks/useScanCapture";
import type { CardMetadataItem, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import type { ConversationHistoryTriggerDescriptor } from "./ConversationWorkspace";
import { CardPresentation } from "./CardPresentation";
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
  /** Look-matching pass (slice N), requirement 3: no longer rendered as a per-step
   * "Back" button — the caller's shared header ‹ (above `stationsRail`) is the only
   * way back now. Kept in the prop contract so `MtgAssistantApp`'s wiring is unchanged. */
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  onFlashStatus: (message: string) => void;
  statusMessage: string | null;
  historyTrigger?: ConversationHistoryTriggerDescriptor;
  /** REQ-209: the four-station progress rail, rendered between the header and the step
   * name. Owned by the caller (`MtgAssistantApp`) since it alone tracks the walk's
   * furthest-reached station across all four steps. */
  stationsRail?: ReactNode;
  /** REQ-018/REQ-206/REQ-209: cards carried from Ask a Question's "Add in-depth
   * details", waiting to be placed one at a time. While non-empty this step shows the
   * placement gate instead of the normal zone tabs/shelf, and nothing passes Cards. */
  pendingPlacementCards: CardMetadataItem[];
  /** The total carried this walk — stays fixed while `pendingPlacementCards` shrinks, so
   * the counter reads "n / total" instead of resetting as cards are placed. */
  placementTotal: number;
  onPlaceCard: (zone: ZoneId) => void;
  onLeaveCardOut: () => void;
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
  onContinue,
  canContinue,
  onFlashStatus,
  statusMessage,
  historyTrigger,
  stationsRail,
  pendingPlacementCards,
  placementTotal,
  onPlaceCard,
  onLeaveCardOut
}: ZoneCollectionStepProps): JSX.Element {
  const orderedSelectedZones = useMemo(
    () => CANONICAL_ZONE_ORDER.filter((zone) => selectedZones.includes(zone)),
    [selectedZones]
  );
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardMetadataItem | null>(null);
  const [pendingOwner, setPendingOwner] = useState<PlayerLabel>(activePlayer);

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

  // DEC-160: selecting a card — by pointer or by keyboard — puts its exact canonical name in
  // the search field. That field is now the only place the selected name is written, which is
  // what let the duplicate standalone title below the art go.
  function selectCard(card: CardMetadataItem): void {
    setSelectedCard(card);
    setSearchInput(card.name);
  }

  const keyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: selectCard
  });

  // REQ-214: the hold-time duplicate/cap check — the same `validateZoneCardAdd`
  // rule the immediate add always ran, applied the instant a card is recognised
  // rather than deferred to commit, so a blocked re-scan still surfaces its
  // message right away. Checked against the zone's current cards *and* anything
  // already in the holding list but not yet committed, so scanning the same
  // card twice in one session is blocked exactly when a manual duplicate add
  // would be.
  function canHoldInActiveZone(card: CardMetadataItem, held: HeldScanEntry[]): ScanHoldCheck {
    if (!activeZone) {
      return { ok: false, message: "No active zone" };
    }
    const heldAsZoneCards = held.map((entry) => buildZoneCardFromMetadata(entry.card, entry.scanImageUrl));
    const candidateCard = buildZoneCardFromMetadata(card);
    if (activeZone !== "stack") {
      candidateCard.owner = pendingOwner;
    }
    const validation = validateZoneCardAdd([...activeZoneCards, ...heldAsZoneCards], candidateCard, activeZone);
    return validation.ok ? { ok: true } : { ok: false, message: validation.message };
  }

  const scanCapture = useScanCapture({
    cardMetadata,
    canHold: canHoldInActiveZone,
    // REQ-214: invoked once per held card when the scanner closes, in hold order —
    // the zone's own card list only changes at that point, not on recognition.
    onScanCandidateSelected: (card, scanImageUrl) => addCardToActiveZone(card, scanImageUrl)
  });
  const closeScan = scanCapture.closeScan;
  const isScanOpen = scanCapture.isOpen;

  useEffect(() => {
    closeScan();
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

  // REQ-209: the card menu's "Move to" — the card leaves activeZone and joins toZone,
  // subject to that zone's own add validation (e.g. the Stack's duplicate/size limit).
  function handleMoveCard(instanceId: string, toZone: ZoneId): void {
    if (!activeZone || toZone === activeZone) {
      return;
    }
    const card = activeZoneCards.find((item) => (item.instanceId ?? item.cardId) === instanceId);
    if (!card) {
      return;
    }
    const destCards = zones[toZone] ?? [];
    const movedCard: ZoneCardItem =
      toZone === "stack" ? { ...card, owner: undefined } : { ...card, owner: card.owner ?? pendingOwner };
    const validation = validateZoneCardAdd(destCards, movedCard, toZone);
    if (!validation.ok) {
      onFlashStatus(validation.message);
      return;
    }
    onZonesChange({
      ...zones,
      [activeZone]: removeZoneCardByInstanceId(activeZoneCards, instanceId),
      [toZone]: appendZoneCard(destCards, movedCard)
    });
  }

  // REQ-005/REQ-209: reorders a card within the active zone to `toIndexAfterRemoval` —
  // the index in the zone's array once the moved card is already removed from it. Both
  // the card menu's buttons and the shelf's drag reorder share this contract.
  function handleReorderCard(instanceId: string, toIndexAfterRemoval: number): void {
    if (!activeZone) {
      return;
    }
    const cards = [...activeZoneCards];
    const fromIndex = cards.findIndex((item) => (item.instanceId ?? item.cardId) === instanceId);
    if (fromIndex === -1) {
      return;
    }
    const [moved] = cards.splice(fromIndex, 1);
    const clampedIndex = Math.max(0, Math.min(cards.length, toIndexAfterRemoval));
    cards.splice(clampedIndex, 0, moved!);
    updateZoneCards(activeZone, cards);
  }

  function handleContinue(): void {
    if (canContinue && selectedZones.includes("stack") && (zones.stack?.length ?? 0) === 0) {
      onFlashStatus(
        "Stack zone is selected but empty - fine for board-state questions; add stack cards if you want stack resolution."
      );
    }

    onContinue();
  }

  const addButtonLabel =
    activeZone === "stack" ? (activeZoneCards.length === 0 ? "Begin stackening!" : "Add to Stack") : "Add card";

  // REQ-018/REQ-206/REQ-209: cards carried from Ask a Question are placed one at a
  // time; nothing else on the Cards station renders until every carried card has a
  // zone or is left out (D7's gate).
  if (pendingPlacementCards.length > 0) {
    const placingCard = pendingPlacementCards[0]!;
    const placedSoFar = placementTotal - pendingPlacementCards.length;

    return (
      <PageShell>
        <StagedStepHeader historyTrigger={historyTrigger} />
        {stationsRail}
        {/* Look-matching pass (slice N), requirement 7: the placing view takes the
            context-sheet layout (`in-depth-question.html:498-510`) — art on the left, a
            "From your question" eyebrow / name / counter on the right. */}
        <div className="plate ctx-sheet" data-testid="card-placement-gate">
          <div className="ctx-art">
            <div className="hero">
              <CardPresentation card={placingCard} className="w-full" imageClassName="rounded-xl" />
            </div>
          </div>
          <div className="ctx-head">
            <p className="eyebrow">
              <span>From your question</span>
              <button type="button" onClick={onLeaveCardOut} className="link motion-focus">
                Leave this card out
              </button>
            </p>
            <h2>{placingCard.name}</h2>
            <span className="ctx-counter" aria-live="polite">
              {`Card ${placedSoFar + 1} of ${placementTotal}`}
            </span>
          </div>
          {/* `.ctx-form`'s own grid-area ("form") already matches the mockup's
              column at both breakpoints (`in-depth-question.html:255-256`) — no
              inline override needed, and one here used to overlap `.ctx-art`
              (which spans the art+form rows together on desktop), hiding the
              zone buttons behind the card art and blocking clicks on them. */}
          {/* REQ-018: placement offers every zone, including ones the player did
              not pre-select at Step 2 — all seven stay directly tappable here
              rather than folding the rest behind "Other zones ▾" (which would
              take an extra tap to reach a zone REQ-018 says should be one tap
              away); a look-only pass does not change that reach. */}
          <div className="ctx-form">
            <span className="lbl">Which zone is it in?</span>
            <div className="flex flex-wrap gap-2">
              {CANONICAL_ZONE_ORDER.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => onPlaceCard(zone)}
                  className="ambient-accent-interactive motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
                >
                  {ZONE_LABELS[zone]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {statusMessage && (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
            {statusMessage}
          </p>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      {!isScanOpen && (
        <>
          <StagedStepHeader historyTrigger={historyTrigger} />
          {stationsRail}
        </>
      )}

      {/* Look-matching pass (slice N), requirement 3/6: the whole step is one `.plate`,
          with `.plate-next` as its own way forward — the old free-standing Back/Continue
          pair is retired (the header's ‹ covers Back now). Zone tabs become pills with
          an accent-soft count (`in-depth-question.html:141-144`). */}
      {/* The plate always mounts (`ZoneCardPicker` owns its own internal scan-camera
          view and must stay mounted while scanning); only the header/zone-tabs/foot
          hide during scan, same as before this slice. */}
      <div className="plate">
        {!isScanOpen && (
          <>
            <h2>Add cards to zones</h2>
            <p className="lede">Select a zone, then add cards by searching or scanning.</p>

            {orderedSelectedZones.length === 0 ? (
              <p className="text-sm text-zinc-300">
                No zones selected. Continue when you are ready to enrich context or ask a timing question.
              </p>
            ) : (
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
                      className="zone-tab-pill ambient-accent-surface ambient-accent-interactive motion-hover motion-press motion-focus"
                    >
                      {/* D5: every zone tab shows its own card count, Stack included — no
                          zero-count special case. */}
                      {ZONE_LABELS[zone]}
                      <b>{count}</b>
                    </button>
                  );
                })}
              </div>
            )}
          </>
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
            // Once the field holds the selected card's exact canonical name (DEC-160), that
            // name is not a query — reopening the list over the staged preview would cover
            // the very card it describes. Typing anything else brings suggestions back.
            showSuggestions={searchInput.trim().length >= 3 && keyboard.isOpen && searchInput !== selectedCard?.name}
            isMetadataLoading={isMetadataLoading}
            suggestions={suggestions}
            noMatchCopy={NO_MATCH_COPY}
            activeSuggestionIndex={keyboard.activeIndex}
            onSuggestionHover={keyboard.setActiveIndex}
            onSuggestionSelect={(card) => {
              selectCard(card);
              keyboard.closeSuggestions();
            }}
            selectedCard={selectedCard}
            addButtonLabel={addButtonLabel}
            onAddSelectedCard={handleAddSelectedCard}
            onRemoveCard={handleRemoveCard}
            onMoveCard={handleMoveCard}
            onReorderCard={handleReorderCard}
            scan={{
              isOpen: isScanOpen,
              isLoading: scanCapture.isLoading,
              error: scanCapture.error,
              convergence: scanCapture.convergence,
              addConfirmation: scanCapture.addConfirmation,
              scanDebug: scanCapture.scanDebug,
              heldEntries: scanCapture.heldEntries,
              onRemoveHeld: scanCapture.removeHeld,
              onOpen: async () => {
                setSelectedCard(null);
                await scanCapture.openScan();
              },
              onExitToManual: scanCapture.closeScan,
              identify: scanCapture.identify,
              onCameraStatusChange: scanCapture.setCameraStatus,
              onAcquisitionDiagnostic: scanCapture.recordAcquisitionDiagnostic
            }}
          />
        )}

        {!isScanOpen && (
          <>
            {!canContinue && (
              <p className="text-xs text-zinc-400">Add at least one card by searching or scanning before continuing.</p>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="plate-next motion-hover motion-press motion-focus"
            >
              <span>
                Continue
                <small aria-hidden="true">next: a few details per card</small>
              </span>
              <span className="chev" aria-hidden="true">
                ›
              </span>
            </button>
          </>
        )}
      </div>

      {!isScanOpen && statusMessage && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
          {statusMessage}
        </p>
      )}
    </PageShell>
  );
}
