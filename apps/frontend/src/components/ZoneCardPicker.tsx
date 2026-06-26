import type { KeyboardEvent } from "react";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ScanCameraSurface, type ScanCameraStatus } from "./ScanCameraSurface";
import { ScanReviewBubble } from "./ScanReviewBubble";
import type { ScanAddConfirmation, ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";
import type { AcquisitionFrameDiagnostic } from "../lib/scan/acquisitionDiagnostics";
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
  /** cardIds auto-added to this zone during the current scan session (review bubble). */
  sessionCardIds: string[];
  onOpen: () => void | Promise<void>;
  onExitToManual: () => void;
  identify: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>;
  onCameraStatusChange: (status: ScanCameraStatus) => void;
  onAcquisitionDiagnostic?: (diagnostic: AcquisitionFrameDiagnostic) => void;
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
        <p className="text-xs text-zinc-400">
          Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.
        </p>
      )}

      {!isScanOpen && (
        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
          {`${ZONE_LABELS[zoneId]} search`}
          <span className="mt-2 grid gap-2 normal-case tracking-normal sm:grid-cols-[1fr_auto] sm:items-center">
            <input
              aria-label={`${ZONE_LABELS[zoneId]} search input`}
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              onKeyDown={onSearchKeyDown}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm"
              placeholder="Type to begin"
            />
            {scan && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  void scan.onOpen();
                }}
                className="rounded-xl border border-accent/70 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-soft transition hover:bg-accent/25"
              >
                Scan
              </button>
            )}
          </span>
        </label>
      )}

      {isScanOpen && scan && (
        <div className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-3">
          {scan.isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
              Loading scan data...
            </p>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={scan.onExitToManual}
                className="absolute right-3 top-3 z-20 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                Exit scan
              </button>
              <ScanCameraSurface
                onCapture={() => undefined}
                identify={scan.identify}
                onStatusChange={scan.onCameraStatusChange}
                onAcquisitionDiagnostic={scan.onAcquisitionDiagnostic}
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
        </div>
      )}

      {!isScanOpen && showSuggestions && (
        <div className="rounded-xl border border-zinc-600 bg-zinc-800/70 p-2">
          {isMetadataLoading ? (
            <p className="px-2 py-1 text-sm text-zinc-400">Loading cards...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-2 py-1 text-sm text-zinc-400">{noMatchCopy}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {suggestions.map((card, index) => (
                <li key={`${zoneId}-${card.cardId}`}>
                  <button
                    type="button"
                    onClick={() => onSuggestionSelect(card)}
                    onMouseEnter={() => onSuggestionHover(index)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-200 transition hover:text-accent-soft ${
                      activeSuggestionIndex === index ? "bg-zinc-700 text-accent-soft" : "hover:bg-zinc-700"
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

      {!isScanOpen && selectedCard && zoneId !== "stack" && (
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-[0.08em] text-zinc-300">Card owner</span>
          <select
            aria-label={`Owner for ${selectedCard.name}`}
            value={pendingOwner}
            onChange={(event) => onPendingOwnerChange(event.target.value as PlayerLabel)}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            {activePlayers.map((player) => (
              <option key={player} value={player}>
                {formatPlayerDisplayLabel(player, displayNamesByPlayer[player])}
              </option>
            ))}
          </select>
        </label>
      )}

      {!isScanOpen && selectedCard && (
        <CardSelectionPreview
          card={selectedCard}
          contextTitle={`${ZONE_LABELS[zoneId]} card`}
          showContextSection={false}
          contextContent={null}
          action={
            <button
              type="button"
              onClick={onAddSelectedCard}
              className="rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-accent-contrast shadow-md transition hover:opacity-90"
            >
              {addButtonLabel}
            </button>
          }
        />
      )}

      {!isScanOpen && cards.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
            {`${ZONE_LABELS[zoneId]} cards (${cards.length})`}
          </p>
          <div className="zone-card-grid grid grid-cols-2 gap-2 overflow-y-auto">
            {cards.map((card, index) => (
              <div
                key={`${zoneId}-${card.cardId}-${index}`}
                className="zone-card-tile flex flex-col gap-1 rounded-xl border border-zinc-700/80 bg-zinc-950/40 p-2"
              >
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="zone-card-tile-image h-20 w-14 shrink-0 self-center rounded object-cover"
                  />
                )}
                <p className="truncate text-xs font-medium text-zinc-100">{card.name}</p>
                {zoneId === "stack" ? (
                  <p className="text-xs text-zinc-400">{formatStackPosition(index, cards.length)}</p>
                ) : (
                  card.owner && (
                    <p className="truncate text-xs text-zinc-400">
                      {formatPlayerDisplayLabel(card.owner, displayNamesByPlayer[card.owner])}
                    </p>
                  )
                )}
                <button
                  type="button"
                  aria-label={`Remove ${card.name} from ${ZONE_LABELS[zoneId]}`}
                  onClick={() => onRemoveCard(card.cardId)}
                  className="mt-auto rounded-lg border border-zinc-600 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
