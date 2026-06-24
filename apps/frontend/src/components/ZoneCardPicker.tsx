import type { KeyboardEvent } from "react";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ScanCameraSurface, type ScanCameraStatus } from "./ScanCameraSurface";
import { ScanReviewBubble } from "./ScanReviewBubble";
import type { ScanAddConfirmation, ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";
import type { IdentifyResult, RgbImage } from "../lib/scan/types";
import type { CardMetadataItem, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import { formatPlayerDisplayLabel } from "../lib/playerLabels";
import { ZONE_LABELS } from "../lib/zoneLabels";

type ZoneCardPickerScanProps = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  convergence: ScanConvergence;
  addConfirmation: ScanAddConfirmation | null;
  scanDebug: ScanDebugMetrics | null;
  showManualEntryPrompt: boolean;
  /** cardIds auto-added to this zone during the current scan session (review bubble). */
  sessionCardIds: string[];
  onOpen: () => void | Promise<void>;
  onExitToManual: () => void;
  identify: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>;
  onCameraStatusChange: (status: ScanCameraStatus) => void;
};

type ZoneCardPickerProps = {
  zoneId: ZoneId;
  cards: ZoneCardItem[];
  activePlayers: PlayerLabel[];
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>;
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
  scan?: ZoneCardPickerScanProps;
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
  displayNamesByPlayer,
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
  onRemoveCard,
  scan
}: ZoneCardPickerProps): JSX.Element {
  const isScanOpen = scan?.isOpen ?? false;
  // Derive the review-bubble cards from the live zone list + this-session id set,
  // so removals (here or in the main list) drop out automatically — no scan-only store.
  const scanSessionCards = scan
    ? scan.sessionCardIds
        .map((cardId) => cards.find((card) => card.cardId === cardId))
        .filter((card): card is ZoneCardItem => Boolean(card))
    : [];

  return (
    <div className="space-y-4">
      {zoneId === "stack" && (
        <p className="text-xs text-slate-400">
          Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.
        </p>
      )}

      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
        {`${ZONE_LABELS[zoneId]} search`}
        <span className="mt-2 grid gap-2 normal-case tracking-normal sm:grid-cols-[1fr_auto] sm:items-center">
          <input
            aria-label={`${ZONE_LABELS[zoneId]} search input`}
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm"
            placeholder="Type to begin"
          />
          {scan && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void scan.onOpen();
              }}
              className="rounded-xl border border-emerald-400/70 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
            >
              Scan
            </button>
          )}
        </span>
      </label>

      {isScanOpen && scan && (
        <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Scan card</p>
            <button
              type="button"
              onClick={scan.onExitToManual}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Exit scan
            </button>
          </div>
          {scan.isLoading ? (
            <p className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
              Loading scan data...
            </p>
          ) : (
            <div className="relative">
              <ScanCameraSurface
                onCapture={() => undefined}
                identify={scan.identify}
                onStatusChange={scan.onCameraStatusChange}
                convergence={scan.convergence}
                confirmation={scan.addConfirmation}
                debug={scan.scanDebug}
                autoScanFps={3}
              />
              <ScanReviewBubble cards={scanSessionCards} onRemove={onRemoveCard} />
            </div>
          )}
          {scan.error && (
            <p className="rounded-xl border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {scan.error}
            </p>
          )}
          {scan.showManualEntryPrompt && (
            <div className="flex flex-col gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-100 sm:flex-row sm:items-center sm:justify-between">
              <span>Still no confident scan match. Manual search is available.</span>
              <button
                type="button"
                onClick={scan.onExitToManual}
                className="rounded-lg border border-cyan-400/70 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
              >
                Use manual search
              </button>
            </div>
          )}
        </div>
      )}

      {!isScanOpen && showSuggestions && (
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
                {formatPlayerDisplayLabel(player, displayNamesByPlayer[player])}
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
                    card.owner && (
                      <p className="text-xs text-slate-400">
                        Owner: {formatPlayerDisplayLabel(card.owner, displayNamesByPlayer[card.owner])}
                      </p>
                    )
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
