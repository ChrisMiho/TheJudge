import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { CardDetailPopup } from "./CardPresentation";
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
  /** The shelf's own way forward (the `.plate-next` foot) — it sits inside the same `.stage`
   * as the shelf, as in `in-depth-question.html`'s `#shelf-stage`. */
  children?: ReactNode;
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
  scan,
  children
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
    // `display: contents` wrapper: the picker as a whole is the current ambient-accent surface
    // (the shared contract), while its search, preview and stage keep the mockup's own boxes.
    <div data-accent-current="true" className="ambient-accent-surface idq-picker">
      {!isScanOpen && isSearchOpen && (
        // `in-depth-question.html`'s `.search-pop`/`.search-row`, opened from the caller's own
        // "＋ Add card" chip: it sits between the shelf hint and the stage, as there.
        <div className="search-pop open" id="zone-card-search-pop">
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
                <p className="px-2 py-1 text-sm">Loading cards...</p>
              ) : suggestions.length === 0 ? (
                <p className="px-2 py-1 text-sm">{noMatchCopy}</p>
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

      {!isScanOpen && selectedCard && zoneId !== "stack" && (
        <label className="ctx-form">
          <span className="t">Card owner</span>
          <select
            aria-label={`Owner for ${selectedCard.name}`}
            value={pendingOwner}
            onChange={(event) => onPendingOwnerChange(event.target.value as PlayerLabel)}
            className="field"
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
            <button type="button" onClick={onAddSelectedCard} className="btn primary">
              {addButtonLabel}
            </button>
          }
        />
      )}

      {/* `#shelf-stage`: the shelf and the way forward on one panel. The stage always mounts —
          it also holds the scan camera while scanning — and the foot hides during a scan. */}
      <div className="stage" data-accent-current="true">
        {isScanOpen && scan && (
          <div className="scan-panel">
            {scan.isLoading ? (
              <p className="px-3 py-2 text-sm">Loading scan data...</p>
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
                  className="icon-round absolute right-3 top-3 z-10"
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
              <p className="motion-error idq-error" role="alert">
                {scan.error}
              </p>
            )}
          </div>
        )}

        {!isScanOpen && (
          <div ref={shelfRef} className="shelf zone-card-grid" data-stack={zoneId === "stack"}>
            {cards.length === 0 ? (
              <div className="empty">
                <div>
                  <strong>{zoneId === "stack" ? "Begin stackening!" : `Nothing in ${ZONE_LABELS[zoneId]} yet`}</strong>
                  Add a card with search or scan.
                </div>
              </div>
            ) : (
              cards.map((card, index) => {
                const instanceId = resolveInstanceId(card);
                const isDragging = draggingInstanceId === instanceId;
                return (
                  <div
                    key={card.instanceId ?? `${zoneId}-${card.cardId}-${index}`}
                    data-shelf-instance-id={instanceId}
                    data-front="true"
                    // The tile itself is the "Card actions" trigger (a tap opens the menu); the
                    // ✕ and ⓘ corner widgets are quick actions that bypass it.
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
                    className={`card card-identity-ring zone-card-tile enrichment-card-enter card-state-remove${isDragging ? " dragging" : ""}`}
                    style={{
                      ...getCardIdentityRingStyle(card.colors),
                      transform: isDragging ? `translate(${dragOffsetX}px, -8px) scale(1.04)` : undefined
                    }}
                    onPointerDown={(event) => handlePointerDown(event, instanceId)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                  >
                    <ShelfCardImage card={card} />
                    {zoneId === "stack" && (
                      <span className="pos" data-top={index === cards.length - 1}>
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
                      className="card-widget remove card-state-remove-trigger motion-focus"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Show details for ${card.name}`}
                      aria-haspopup="dialog"
                      aria-expanded={detailInstanceId === instanceId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailInstanceId(instanceId);
                      }}
                      className="card-widget info"
                    >
                      <span aria-hidden="true">ⓘ</span>
                    </button>
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
              })
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** A shelf tile's art: the card's own image, or — when none loads — its name alone
 * (`flow.css`'s `.card .fallback`), reading no descriptive field and fetching nothing (D3). */
function ShelfCardImage({ card }: { card: ZoneCardItem }): JSX.Element {
  const [failed, setFailed] = useState(false);
  const imageUrl = card.imageUrl?.trim() || undefined;
  if (!imageUrl || failed) {
    return (
      <div className="fallback" data-testid="card-presentation-fallback">
        <div>
          <strong>{card.name}</strong>
        </div>
      </div>
    );
  }
  return <img src={imageUrl} alt={card.name} className="zone-card-tile-image" onError={() => setFailed(true)} />;
}
