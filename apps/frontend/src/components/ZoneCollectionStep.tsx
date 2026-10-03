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
import { CardHero } from "./CardHero";
import { useCardDetailBlock } from "../hooks/useCardDetailBlock";
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
  // Look-matching pass (slice N, review 1 fix — finding 3), requirement 6: the
  // search popover opens from the ＋ Add card chip under the rail now, instead
  // of sitting permanently visible inside the plate.
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    setIsSearchOpen(false);
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

  // Look-matching pass (slice N, review 1 fix — finding 3): named so both the
  // new `.attach` row's own Scan button and `ZoneCardPicker`'s `scan.onOpen`
  // (passed through for the scanner's own internal affordances) share one path.
  async function handleOpenScan(): Promise<void> {
    setSelectedCard(null);
    setIsSearchOpen(false);
    await scanCapture.openScan();
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
      <PageShell variant="narrow">
        <StagedStepHeader historyTrigger={historyTrigger} />
        <section className="idq">
          {stationsRail}
          <section className="idq-step" aria-label="Add cards to zones" data-placing="true">
            <PlacementPlate
              card={placingCard}
              placedSoFar={placedSoFar}
              placementTotal={placementTotal}
              selectedZones={selectedZones}
              onPlaceCard={onPlaceCard}
              onLeaveCardOut={onLeaveCardOut}
            />
            {statusMessage && <p className="idq-status">{statusMessage}</p>}
          </section>
        </section>
      </PageShell>
    );
  }

  const stackSelected = activeZone === "stack";

  return (
    <PageShell variant="narrow">
      {!isScanOpen && <StagedStepHeader historyTrigger={historyTrigger} />}
      <section className="idq">
        {!isScanOpen && stationsRail}

        {/* `in-depth-question.html`'s own DOM order: the rail, the `.attach` row, the zone tabs and
            the lit shelf hint all sit above the shelf's stage, which holds nothing but the shelf
            and its `.plate-next` foot. */}
        {!isScanOpen && activeZone && (
          <div className="attach">
            {/* `aria-label` disambiguates this toggle from the zone's own confirm button (also
                named "Add card" for non-Stack zones) — visible text stays the mockup's. */}
            <button
              type="button"
              aria-label={`Add a card to ${ZONE_LABELS[activeZone]}`}
              aria-expanded={isSearchOpen}
              aria-controls="zone-card-search-pop"
              onClick={() => setIsSearchOpen((open) => !open)}
              className="icon-chip motion-focus"
            >
              <span className="glyph" aria-hidden="true">
                ＋
              </span>{" "}
              {stackSelected ? "Add to Stack" : "Add card"}
            </button>
            <button type="button" onClick={() => void handleOpenScan()} className="icon-chip motion-focus">
              <span className="glyph" aria-hidden="true">
                ▣
              </span>{" "}
              Scan
            </button>
          </div>
        )}

        <section className="idq-step" aria-label="Add cards to zones" data-placing="false">
          {!isScanOpen &&
            (orderedSelectedZones.length === 0 ? (
              <p className="lede">
                No zones selected. Continue when you are ready to enrich context or ask a timing question.
              </p>
            ) : (
              <div className="zone-tabs">
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
                      className="ambient-accent-surface ambient-accent-interactive motion-hover motion-press motion-focus"
                    >
                      {/* D5: every zone tab shows its own card count, Stack included — no
                        zero-count special case. */}
                      {ZONE_LABELS[zone]}
                      <b>{count}</b>
                    </button>
                  );
                })}
              </div>
            ))}

          {/* The lit reorder hint (`#shelf-hint`, 2+ cards only), in the mockup's own wording. */}
          {!isScanOpen && activeZone && activeZoneCards.length > 1 && (
            <p className="shelf-hint">
              <span className="glyph" aria-hidden="true">
                {"⇄"}
              </span>
              <span>
                {stackSelected ? (
                  <>
                    <b>Top resolves first</b>, then 2nd, 3rd… down to the bottom. Drag a card to reorder it (hold first
                    on a phone), or tap it for Move up / Move down.
                  </>
                ) : (
                  <>
                    <b>Drag to reorder</b> (hold first on a phone). Tap a card to move it to another zone.
                  </>
                )}
              </span>
            </p>
          )}

          {/* The stage always mounts (`ZoneCardPicker` owns its own internal scan-camera view and
            must stay mounted while scanning); only the foot hides during scan. */}
          {activeZone && (
            <ZoneCardPicker
              zoneId={activeZone}
              cards={activeZoneCards}
              activePlayers={activePlayers}
              displayNamesByPlayer={displayNamesByPlayer}
              pendingOwner={pendingOwner}
              onPendingOwnerChange={setPendingOwner}
              isSearchOpen={isSearchOpen}
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
                // Keeps the search popover open (unchanged behaviour, DEC-160): the
                // field now shows the selected card's exact canonical name, with the
                // preview/Add action below it, until the player adds it or dismisses.
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
                onOpen: handleOpenScan,
                onExitToManual: scanCapture.closeScan,
                identify: scanCapture.identify,
                onCameraStatusChange: scanCapture.setCameraStatus,
                onAcquisitionDiagnostic: scanCapture.recordAcquisitionDiagnostic
              }}
            >
              {!isScanOpen && (
                <>
                  {!canContinue && (
                    <p className="lede">Add at least one card by searching or scanning before continuing.</p>
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
            </ZoneCardPicker>
          )}

          {!isScanOpen && statusMessage && <p className="idq-status">{statusMessage}</p>}
        </section>
      </section>
    </PageShell>
  );
}

type PlacementPlateProps = {
  card: CardMetadataItem;
  placedSoFar: number;
  placementTotal: number;
  selectedZones: ZoneId[];
  onPlaceCard: (zone: ZoneId) => void;
  onLeaveCardOut: () => void;
};

/**
 * `in-depth-question.html`'s `#place-plate`: the carried card as the hero beside "From your
 * question", its name, type line and counter, and one tile per zone. REQ-018: every zone stays
 * one tap away, so the zones already chosen lead and the rest follow as dashed tiles rather than
 * folding behind "Other zones ▾".
 */
function PlacementPlate({
  card,
  placedSoFar,
  placementTotal,
  selectedZones,
  onPlaceCard,
  onLeaveCardOut
}: PlacementPlateProps): JSX.Element {
  const detail = useCardDetailBlock(card.cardId);
  const chosen = CANONICAL_ZONE_ORDER.filter((zone) => selectedZones.includes(zone));
  const rest = CANONICAL_ZONE_ORDER.filter((zone) => !selectedZones.includes(zone));

  return (
    <div className="plate place-plate" data-testid="card-placement-gate">
      <div className="ctx-art">
        <CardHero card={card} />
      </div>
      <div className="ctx-head">
        <div className="eyebrow">
          <span>From your question</span>
          <button type="button" onClick={onLeaveCardOut} className="link danger motion-focus">
            Leave this card out
          </button>
        </div>
        <h2>{card.name}</h2>
        {detail?.typeLine ? (
          <div className="sub">
            {detail.typeLine}
            {detail.manaCost ? (
              <>
                {" · "}
                <span>{detail.manaCost}</span>
              </>
            ) : null}
          </div>
        ) : null}
        <span className="counter" aria-live="polite">
          <span aria-hidden="true">
            {placedSoFar + 1}&nbsp;/&nbsp;{placementTotal}
          </span>
          <small aria-hidden="true">to place</small>
          <span className="sr-only">{`Card ${placedSoFar + 1} of ${placementTotal}`}</span>
        </span>
      </div>
      <div className="ctx-form">
        <span className="lbl">
          <span className="t">
            Which zone is it in?<small>tap one — the next card follows</small>
          </span>
        </span>
        <div className="place-zones">
          {[...chosen, ...rest].map((zone) => (
            <button
              key={zone}
              type="button"
              data-zone={zone}
              data-extra={!selectedZones.includes(zone)}
              onClick={() => onPlaceCard(zone)}
              className="motion-focus"
            >
              <span className="mark" aria-hidden="true" />
              {ZONE_LABELS[zone]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
