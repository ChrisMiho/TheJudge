import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CardDetailPopup, CardPresentation } from "./CardPresentation";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ScanCameraSurface, type ScanCameraStatus } from "./ScanCameraSurface";
import { ScanReviewBubble } from "./ScanReviewBubble";
import { ZoneCardMenu } from "./ZoneCardMenu";
import type { HeldScanEntry, ScanAddConfirmation, ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";
import type { AcquisitionFrameDiagnostic } from "../lib/scan/acquisitionDiagnostics";
import type { IdentifyResult, RgbImage } from "../lib/scan/types";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { computeShelfDropIndex, DRAG_START_THRESHOLD_PX, type ShelfTileRect } from "../lib/shelfDragReorder";
import { stackPositionTag } from "../lib/stackTags";
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
  /** REQ-214: the scanner's own holding list for this session — not yet in this zone. */
  heldEntries: HeldScanEntry[];
  onRemoveHeld: (id: number) => void;
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
  /** Look-matching pass (slice N, review 1 fix — finding 3), requirement 6: the
   * search field now opens from the caller's own "＋ Add card" chip (a row of
   * its own under the rail, `in-depth-question.html:452-455`'s `.attach`)
   * rather than sitting permanently visible inside this plate. */
  isSearchOpen: boolean;
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
  /** REQ-209: the card menu's "Move to" — moves this card out of `zoneId` into another
   * zone (and, when that zone was not yet selected, selects it too — handled by the
   * caller, `ZoneCollectionStep`). */
  onMoveCard: (instanceId: string, toZone: ZoneId) => void;
  /** REQ-005/REQ-209: reorders a card within this zone. `toIndexAfterRemoval` is the
   * target index in the zone's card array *with the moved card already removed* — the
   * shared contract both the card menu's Down/Up/To top/Left/Right buttons and the
   * shelf's drag reorder use, so a button press and a drag land identically. */
  onReorderCard: (instanceId: string, toIndexAfterRemoval: number) => void;
  scan?: ZoneCardPickerScanProps;
};

type DragState = {
  instanceId: string;
  startX: number;
  pointerId: number;
  dragging: boolean;
};

export function ZoneCardPicker({
  zoneId,
  cards,
  activePlayers,
  displayNamesByPlayer,
  pendingOwner,
  onPendingOwnerChange,
  isSearchOpen,
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
  onMoveCard,
  onReorderCard,
  scan
}: ZoneCardPickerProps): JSX.Element {
  const isScanOpen = scan?.isOpen ?? false;
  const [menuInstanceId, setMenuInstanceId] = useState<string | null>(null);
  const [detailInstanceId, setDetailInstanceId] = useState<string | null>(null);
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const shelfRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function resolveInstanceId(card: ZoneCardItem): string {
    return card.instanceId ?? card.cardId;
  }

  function endDrag(): void {
    dragRef.current = null;
    setDraggingInstanceId(null);
    setDragOffsetX(0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, instanceId: string): void {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    dragRef.current = { instanceId, startX: event.clientX, pointerId: event.pointerId, dragging: false };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.instanceId !== resolveInstanceIdFromTarget(event)) {
      return;
    }
    const deltaX = event.clientX - drag.startX;
    if (!drag.dragging) {
      if (Math.abs(deltaX) < DRAG_START_THRESHOLD_PX) {
        return;
      }
      drag.dragging = true;
      setDraggingInstanceId(drag.instanceId);
      (event.currentTarget as Element).setPointerCapture?.(drag.pointerId);
    }
    setDragOffsetX(deltaX);
  }

  // Pointer capture keeps move/up events targeted at the tile that started the drag
  // regardless of where the pointer travels, so this check only ever matters for an
  // event that fires before capture is established.
  function resolveInstanceIdFromTarget(event: ReactPointerEvent<HTMLDivElement>): string {
    return event.currentTarget.dataset.shelfInstanceId ?? dragRef.current?.instanceId ?? "";
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    if (!drag.dragging) {
      endDrag();
      return;
    }

    const container = shelfRef.current;
    if (container) {
      const tileRects: ShelfTileRect[] = Array.from(
        container.querySelectorAll<HTMLElement>("[data-shelf-instance-id]")
      ).map((element) => {
        const rect = element.getBoundingClientRect();
        return { instanceId: element.dataset.shelfInstanceId!, left: rect.left, width: rect.width };
      });
      const dropIndex = computeShelfDropIndex(tileRects, drag.instanceId, event.clientX);
      onReorderCard(drag.instanceId, dropIndex);
    }
    endDrag();
  }

  function handlePointerCancel(): void {
    endDrag();
  }

  return (
    <div data-accent-current="true" className="ambient-accent-surface space-y-4">
      {!isScanOpen && zoneId === "stack" && (
        <p className="text-xs text-zinc-400">
          Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.
        </p>
      )}

      {!isScanOpen && isSearchOpen && (
        // Look-matching pass (slice N, review 1 fix — finding 3), requirement 6:
        // the search popover (`in-depth-question.html:516-522`'s `.search-pop`/
        // `.search-row`) — opened from the caller's own "＋ Add card" chip now,
        // so Scan (previously inline here) moved to that same row under the rail.
        <div className="search-pop" id="zone-card-search-pop">
          <div className="search-row">
            <span className="glyph" aria-hidden="true">
              ⌕
            </span>
            <input
              aria-label={`${ZONE_LABELS[zoneId]} search input`}
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              onKeyDown={onSearchKeyDown}
              className="field"
              placeholder="Search for a card to add"
            />
          </div>
          {showSuggestions && (
            <div className="search-results">
              {isMetadataLoading ? (
                <p className="px-2 py-1 text-sm text-zinc-400">Loading cards...</p>
              ) : suggestions.length === 0 ? (
                <p className="px-2 py-1 text-sm text-zinc-400">{noMatchCopy}</p>
              ) : (
                suggestions.map((card, index) => (
                  <button
                    key={`${zoneId}-${card.cardId}`}
                    type="button"
                    onClick={() => onSuggestionSelect(card)}
                    onMouseEnter={() => onSuggestionHover(index)}
                    data-active={activeSuggestionIndex === index}
                  >
                    {card.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isScanOpen && scan && (
        <div className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-3">
          {scan.isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
              Loading scan data...
            </p>
          ) : (
            <div className="relative">
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
              {/* REQ-214: a box with an ✕ above the camera's top-right corner — the only
                  way out; closing commits the holding list below to this zone. */}
              <button
                type="button"
                aria-label="Exit scan"
                onClick={scan.onExitToManual}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-950/70 text-sm font-semibold text-zinc-200 shadow transition hover:bg-zinc-800"
              >
                <span aria-hidden="true">✕</span>
              </button>
              <ScanReviewBubble
                entries={scan.heldEntries.map((entry) => ({
                  id: entry.id,
                  card: { cardId: entry.card.cardId, name: entry.card.name, imageUrl: entry.scanImageUrl },
                  colors: entry.card.colors
                }))}
                onRemove={scan.onRemoveHeld}
                destinationLabel={`the ${ZONE_LABELS[zoneId]}`}
              />
            </div>
          )}
          {scan.error && (
            <p className="motion-error rounded-xl border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {scan.error}
            </p>
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
          action={
            <button
              type="button"
              onClick={onAddSelectedCard}
              className="min-h-11 rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-accent-contrast shadow-md transition hover:opacity-90"
            >
              {addButtonLabel}
            </button>
          }
        />
      )}

      {/* Look-matching pass (slice N, review 2 fix — finding 1): the bordered box
          round the shelf is dropped — the mockup's `.stage` (`in-depth-question.html:523`)
          holds the shelf plainly, with no nested border of its own, and the shelf-hint
          immediately above it (`ZoneCollectionStep.tsx`) is no longer rendered in here
          either, since it now sits above the plate too. The "<Zone> cards (N)" sub-header
          already retired at review 1 — the zone tab pill (`ZoneCollectionStep.tsx`)
          shows this zone's own count in accent-soft, right next to the zone it names. */}
      {!isScanOpen && cards.length > 0 && (
        <div ref={shelfRef} className="zone-card-grid flex gap-2 overflow-x-auto pb-1">
          {cards.map((card, index) => {
            const instanceId = resolveInstanceId(card);
            const isDragging = draggingInstanceId === instanceId;
            return (
              <div
                key={card.instanceId ?? `${zoneId}-${card.cardId}-${index}`}
                data-shelf-instance-id={instanceId}
                // Look-matching pass (slice N), requirement 6/N5: the tile itself is the
                // "Card actions" trigger now (`in-depth-question.html:174-195` `.shelf
                // .card` — a tap opens the menu), replacing the old under-card text
                // button; the accessible name is unchanged so this stays the same control
                // by name, not a new one. ✕/ⓘ corner widgets below are quick actions that
                // bypass the menu, matching `:233-243` `.card-widget`.
                role="button"
                tabIndex={0}
                aria-label={`Card actions for ${card.name}`}
                aria-haspopup="dialog"
                aria-expanded={menuInstanceId === instanceId}
                onClick={() => {
                  if (!dragRef.current?.dragging) setMenuInstanceId(instanceId);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setMenuInstanceId(instanceId);
                  }
                }}
                className="card-identity-ring shelf-card zone-card-tile enrichment-card-enter card-state-remove relative flex w-40 shrink-0 cursor-pointer select-none touch-pan-x flex-col gap-1 rounded-xl border border-zinc-700/80 bg-zinc-950/40 p-2"
                style={{
                  ...getCardIdentityRingStyle(card.colors),
                  transform: isDragging ? `translateX(${dragOffsetX}px) translateY(-6px) scale(1.03)` : undefined,
                  zIndex: isDragging ? 20 : undefined,
                  transition: isDragging ? "none" : undefined
                }}
                onPointerDown={(event) => handlePointerDown(event, instanceId)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                {zoneId === "stack" && (
                  <span className="shelf-card-pos" data-top={index === cards.length - 1}>
                    {stackPositionTag(index, cards.length)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${card.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveCard(instanceId);
                  }}
                  className="shelf-card-widget remove card-state-remove-trigger motion-focus"
                >
                  <span aria-hidden="true">×</span>
                </button>
                {/* DEC-160/REQ-130: the tile keeps its fixed w-40 footprint and its place in
                    the horizontal strip; only the image inside it grows, from the shared
                    92px render to roughly the tile's interior width. `CardPresentation`
                    already draws its own ⓘ corner widget and detail popup (requirement 6's
                    second widget) — this tile adds only the ✕ beside it. */}
                <CardPresentation card={card} className="w-full" imageClassName="zone-card-tile-image rounded" />
                {/* Both overlays stop propagation so a click inside them never bubbles back
                    up to the tile's own onClick (which would immediately reopen the menu
                    it is in the middle of closing). */}
                {menuInstanceId === instanceId && (
                  <div onClick={(event) => event.stopPropagation()}>
                    <ZoneCardMenu
                      isOpen
                      onClose={() => setMenuInstanceId(null)}
                      card={card}
                      zoneId={zoneId}
                      cardIndex={index}
                      cardCount={cards.length}
                      onMoveTo={(toZone) => {
                        setMenuInstanceId(null);
                        onMoveCard(instanceId, toZone);
                      }}
                      onReorder={(toIndexAfterRemoval) => {
                        setMenuInstanceId(null);
                        onReorderCard(instanceId, toIndexAfterRemoval);
                      }}
                      onShowDetails={() => {
                        setMenuInstanceId(null);
                        setDetailInstanceId(instanceId);
                      }}
                      onRemove={() => {
                        setMenuInstanceId(null);
                        onRemoveCard(instanceId);
                      }}
                    />
                  </div>
                )}
                {detailInstanceId === instanceId && (
                  <div onClick={(event) => event.stopPropagation()}>
                    <CardDetailPopup card={card} onClose={() => setDetailInstanceId(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
