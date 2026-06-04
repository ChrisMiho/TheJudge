import type { KeyboardEvent } from "react";
import { CardSelectionPreview } from "./CardSelectionPreview";
import type { CardMetadataItem, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import { ZONE_LABELS } from "../lib/zoneLabels";

type ZoneCardPickerProps = {
  zoneId: ZoneId;
  cards: ZoneCardItem[];
  activePlayers: PlayerLabel[];
  pendingOwner: PlayerLabel;
  onPendingOwnerChange: (owner: PlayerLabel) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showSuggestions: boolean;
  isMetadataLoading: boolean;
  suggestions: CardMetadataItem[];
  noMatchCopy: string;
  activeSuggestionIndex: number;
  onSuggestionHover: (index: number) => void;
  onSuggestionSelect: (card: CardMetadataItem) => void;
  selectedCard: CardMetadataItem | null;
  addButtonLabel: string;
  onAddSelectedCard: () => void;
  onRemoveCard: (cardId: string) => void;
};

function formatStackPosition(index: number, total: number): string {
  if (total === 1) {
    return "bottom & top";
  }
  if (index === 0) {
    return "bottom";
  }
  if (index === total - 1) {
    return "top";
  }
  return `position ${index + 1}`;
}

export function ZoneCardPicker({
  zoneId,
  cards,
  activePlayers,
  pendingOwner,
  onPendingOwnerChange,
  searchInput,
  onSearchInputChange,
  onSearchKeyDown,
  showSuggestions,
  isMetadataLoading,
  suggestions,
  noMatchCopy,
  activeSuggestionIndex,
  onSuggestionHover,
  onSuggestionSelect,
  selectedCard,
  addButtonLabel,
  onAddSelectedCard,
  onRemoveCard
}: ZoneCardPickerProps): JSX.Element {
  return (
    <div className="space-y-4">
      {zoneId === "stack" && (
        <p className="text-xs text-slate-400">
          Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.
        </p>
      )}

      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
        {`${ZONE_LABELS[zoneId]} search`}
        <input
          aria-label={`${ZONE_LABELS[zoneId]} search input`}
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onKeyDown={onSearchKeyDown}
          className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm"
          placeholder="Type to begin"
        />
      </label>

      {showSuggestions && (
        <div className="rounded-xl border border-slate-600 bg-slate-800/70 p-2">
          {isMetadataLoading ? (
            <p className="px-2 py-1 text-sm text-slate-400">Loading cards...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-2 py-1 text-sm text-slate-400">{noMatchCopy}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {suggestions.map((card, index) => (
                <li key={`${zoneId}-${card.cardId}`}>
                  <button
                    type="button"
                    onClick={() => onSuggestionSelect(card)}
                    onMouseEnter={() => onSuggestionHover(index)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:text-sky-300 ${
                      activeSuggestionIndex === index ? "bg-slate-700 text-sky-300" : "hover:bg-slate-700"
                    }`}
                  >
                    {card.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedCard && zoneId !== "stack" && (
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-[0.08em] text-slate-300">Card owner</span>
          <select
            aria-label={`Owner for ${selectedCard.name}`}
            value={pendingOwner}
            onChange={(event) => onPendingOwnerChange(event.target.value as PlayerLabel)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          >
            {activePlayers.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedCard ? (
        <CardSelectionPreview
          card={selectedCard}
          contextTitle={`${ZONE_LABELS[zoneId]} card`}
          showContextSection={false}
          contextContent={null}
          action={
            <button
              type="button"
              onClick={onAddSelectedCard}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-cyan-400"
            >
              {addButtonLabel}
            </button>
          }
        />
      ) : (
        <p className="text-xs text-slate-300">Select a suggestion to preview and add a card to {ZONE_LABELS[zoneId]}.</p>
      )}

      {cards.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            {`${ZONE_LABELS[zoneId]} cards (${cards.length})`}
          </p>
          <ul className="space-y-2">
            {cards.map((card, index) => (
              <li
                key={`${zoneId}-${card.cardId}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-100">{`${index + 1}. ${card.name}`}</p>
                  {zoneId === "stack" ? (
                    <p className="text-xs text-slate-400">{formatStackPosition(index, cards.length)}</p>
                  ) : (
                    card.owner && <p className="text-xs text-slate-400">Owner: {card.owner}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${card.name} from ${ZONE_LABELS[zoneId]}`}
                  onClick={() => onRemoveCard(card.cardId)}
                  className="rounded-lg border border-slate-600 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
