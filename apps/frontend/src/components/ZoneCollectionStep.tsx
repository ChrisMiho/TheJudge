import { useEffect, useMemo, useState } from "react";
import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { NO_MATCH_COPY } from "../lib/search";
import { ZONE_LABELS } from "../lib/zoneLabels";
import {
  appendZoneCard,
  buildZoneCardFromMetadata,
  removeZoneCardById,
  validateZoneCardAdd
} from "../lib/zoneCards";
import { useAutocompleteKeyboard } from "../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../hooks/useAutocompleteSuggestions";
import type { CardMetadataItem, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
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

  function updateZoneCards(zoneId: ZoneId, cards: ZoneCardItem[]): void {
    onZonesChange({
      ...zones,
      [zoneId]: cards
    });
  }

  function handleAddSelectedCard(): void {
    if (!activeZone || !selectedCard) {
      return;
    }

    const nextCard = buildZoneCardFromMetadata(selectedCard);
    if (activeZone !== "stack") {
      nextCard.owner = pendingOwner;
    }
    const validation = validateZoneCardAdd(activeZoneCards, nextCard, activeZone);
    if (!validation.ok) {
      onFlashStatus(validation.message);
      return;
    }

    updateZoneCards(activeZone, appendZoneCard(activeZoneCards, nextCard));
    setSearchInput("");
    setSelectedCard(null);
    onFlashStatus(activeZone === "stack" ? "Stacked" : "Card added");
  }

  function handleRemoveCard(cardId: string): void {
    if (!activeZone) {
      return;
    }
    updateZoneCards(activeZone, removeZoneCardById(activeZoneCards, cardId));
  }

  const addButtonLabel =
    activeZone === "stack" ? (activeZoneCards.length === 0 ? "Begin stackening!" : "Add to Stack") : "Add card";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
        <header>
          <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TheJudge
          </h1>
          <p className="text-sm text-slate-300">Stack Assistant</p>
        </header>

        <h2 className="text-2xl font-semibold text-sky-300">Add cards to zones</h2>
        <p className="text-sm text-slate-400">
          Add at least one card in a selected zone. Other selected zones may stay empty.
        </p>

        {orderedSelectedZones.length === 0 ? (
          <p className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 text-sm text-slate-300">
            No zones selected. Continue when you are ready to enrich context or ask a timing question.
          </p>
        ) : (
          <>
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
                    onClick={() => setActiveZoneIndex(index)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                      isActive
                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-200"
                        : "border-slate-600 bg-slate-800/70 text-slate-300 hover:bg-slate-700/80"
                    ].join(" ")}
                  >
                    {`${ZONE_LABELS[zone]}${count > 0 ? ` (${count})` : ""}`}
                  </button>
                );
              })}
            </div>

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
              />
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-500 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700/80"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>

        {!canContinue && (
          <p className="text-xs text-slate-400">
            Add at least one card in a selected zone before continuing.
          </p>
        )}

        {statusMessage && (
          <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
            {statusMessage}
          </p>
        )}
      </section>
    </main>
  );
}
