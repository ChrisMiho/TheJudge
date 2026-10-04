import { useRef, useState } from "react";

import { NO_MATCH_COPY } from "../../lib/search";
import { fetchCardPrintings, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import {
  formatUsd,
  normalizeSideName,
  sideTotal,
  type TradeEntry,
  type TradeSideId
} from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";
import { ScanCameraSurface } from "../ScanCameraSurface";
import { ScanReviewBubble } from "../ScanReviewBubble";
import { PrintingPicker } from "./PrintingPicker";
import { TradeEntryRow, type TradeEntryPricingMeta } from "./TradeEntryRow";
import type { TradeScan } from "./useTradeScan";
import {
  MIN_TRADE_SEARCH_LENGTH,
  searchOracleIndex,
  type OracleSearchEntry
} from "./oracleSearch";

/** C1-C4: the card whose printing list is being fetched/shown before it is
 * added — swaps the suggestion list for a loading state then the printing
 * picker. `null` when no suggestion tap is pending. */
type PendingCard = { oracleId: string; name: string } | null;

export type TradeSideProps = {
  sideId: TradeSideId;
  /** REQ-215: the side's current name — "Side A"/"Side B" by default, or a
   * player's own rename (1-20 characters, ephemeral — never persisted). */
  sideName: string;
  onRenameSide: (sideId: TradeSideId, name: string) => void;
  /** Look-matching pass (slice O): on phone, only the active side's section
   * shows (`.tb-side[data-active]`, `trade-balancer.html:84-93`'s side tabs);
   * both always show on desktop (CSS media query). Both sides stay mounted
   * regardless, so neither side's state is lost switching tabs. */
  isActiveOnPhone: boolean;
  entries: TradeEntry[];
  cardMetadata: CardMetadataItem[];
  searchIndex: OracleSearchEntry[];
  isMetadataLoading: boolean;
  isSearchDisabled: boolean;
  entryMetaById: Record<string, TradeEntryPricingMeta>;
  scan: TradeScan;
  onAddByOracle: (
    sideId: TradeSideId,
    oracleId: string,
    name: string,
    preferredPrintingId?: string,
    preferredFoil?: boolean
  ) => void;
  onToggleFoil: (sideId: TradeSideId, instanceId: string) => void;
  onQuantityChange: (sideId: TradeSideId, instanceId: string, quantity: number) => void;
  onRemove: (sideId: TradeSideId, instanceId: string) => void;
  onChangePrinting: (sideId: TradeSideId, instanceId: string, printing: CardPrintingPrice, foil: boolean) => void;
  onRetryPricing: (instanceId: string) => void;
};

export function TradeSide({
  sideId,
  sideName,
  onRenameSide,
  isActiveOnPhone,
  entries,
  searchIndex,
  isMetadataLoading,
  isSearchDisabled,
  entryMetaById,
  scan,
  onAddByOracle,
  onToggleFoil,
  onQuantityChange,
  onRemove,
  onChangePrinting,
  onRetryPricing
}: TradeSideProps): JSX.Element {
  // Look-matching pass (slice O), requirement 8: the search now opens from the
  // "＋ Add card" chip (`flow.css`'s `.icon-chip`, the same control slice M
  // built) instead of sitting permanently visible — the same change slice M
  // made to Ask a Question's own card search. Stays open across several adds
  // (no auto-close on select), so a sequence of adds takes one open tap.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingCard, setPendingCard] = useState<PendingCard>(null);
  const [pendingPrintings, setPendingPrintings] = useState<CardPrintingPrice[] | null>(null);
  // Guards a pending fetch's resolution against a stale write after Cancel or
  // a second suggestion tap swapped `pendingCard` out from under it.
  const pendingOracleIdRef = useRef<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(sideName);
  const sideLabel = sideName;
  const total = sideTotal(entries);
  const isScanOpen = scan.activeSideId === sideId;
  const scanNotice = scan.notice?.sideId === sideId ? scan.notice.message : null;
  const isInputDisabled = isSearchDisabled;
  const suggestions = searchOracleIndex(searchIndex, query);
  const showSuggestionPanel = pendingCard === null && query.trim().length >= MIN_TRADE_SEARCH_LENGTH;

  function clearPending(): void {
    pendingOracleIdRef.current = null;
    setPendingCard(null);
    setPendingPrintings(null);
  }

  // C4: the pre-add fetch failed, or resolved with zero printings — the
  // picker never traps the player. The card is added the way it is added
  // today (no preferred printing), and `TradeBalancer`'s own fetch takes over
  // the loading/error/retry state (FLOW-025's existing degrade path).
  function fallBackToAddThenDegrade(oracleId: string, name: string): void {
    onAddByOracle(sideId, oracleId, name);
    clearPending();
    setQuery("");
  }

  // C1: tapping a suggestion fetches that card's printing list (cached per
  // session) and swaps the suggestion list for a loading state, then the
  // printing picker — the choice happens before the card is added (REQ-065).
  function handleSuggestionTap(oracleId: string, name: string): void {
    pendingOracleIdRef.current = oracleId;
    setPendingCard({ oracleId, name });
    setPendingPrintings(null);

    fetchCardPrintings(oracleId)
      .then((block) => {
        if (pendingOracleIdRef.current !== oracleId) return;
        const printings = block?.printings ?? [];
        if (printings.length === 0) {
          fallBackToAddThenDegrade(oracleId, name);
          return;
        }
        setPendingPrintings(printings);
      })
      .catch(() => {
        if (pendingOracleIdRef.current !== oracleId) return;
        fallBackToAddThenDegrade(oracleId, name);
      });
  }

  // C2: picking a printing adds the card carrying that exact printing and
  // finish — `preferredPrintingId`/`preferredFoil` select them once
  // `TradeBalancer`'s own fetch resolves, which it does immediately
  // (`fetchCardPrintings` cache hit).
  function handleSelectPendingPrinting(printing: CardPrintingPrice, foil: boolean): void {
    if (!pendingCard) return;
    onAddByOracle(sideId, pendingCard.oracleId, pendingCard.name, printing.id, foil);
    clearPending();
    setQuery("");
  }

  // C3: Cancel returns to the search box with the query text intact and no
  // card added.
  function handleCancelPending(): void {
    clearPending();
  }

  // REQ-215: a side is renamed by tapping its name — a short inline text
  // field (1-20 characters; blank restores the default). The name lives only
  // as long as the trade.
  function beginRename(): void {
    setNameDraft(sideName);
    setIsRenaming(true);
  }

  function commitRename(): void {
    onRenameSide(sideId, normalizeSideName(sideId, nameDraft));
    setIsRenaming(false);
  }

  return (
    <section
      aria-label={sideLabel}
      className="side"
      data-active={isActiveOnPhone ? "true" : "false"}
    >
      <div className="side-head">
        {isRenaming ? (
          <input
            autoFocus
            aria-label={`Rename ${sideLabel}`}
            value={nameDraft}
            maxLength={20}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") setIsRenaming(false);
            }}
            className="name motion-focus"
          />
        ) : (
          <button
            type="button"
            aria-label={`Rename ${sideLabel}`}
            onClick={beginRename}
            className="name motion-focus"
          >
            {sideLabel}
          </button>
        )}
        {!isScanOpen && (
          <div className="attach">
            {/* The chip toggles this side's card search. While it is open, the
                label/glyph (and its screen-reader name) flip to "✕ Close search"
                — the only hint that tapping it again closes the search. Mirrors
                Ask a Question's own Add-card chip (QuickLookupApp). */}
            <button
              type="button"
              aria-label={isSearchOpen ? "Close search" : "Add card"}
              aria-expanded={isSearchOpen}
              disabled={isInputDisabled}
              onClick={() => setIsSearchOpen((open) => !open)}
              className="icon-chip"
            >
              <span className="glyph" aria-hidden="true">
                {isSearchOpen ? "✕" : "＋"}
              </span>
              {isSearchOpen ? "Close search" : "Add card"}
            </button>
            <button
              type="button"
              aria-label={`Scan a card onto ${sideLabel}`}
              disabled={isInputDisabled}
              onClick={() => scan.openScan(sideId)}
              className="icon-chip"
            >
              <span className="glyph" aria-hidden="true">
                ▣
              </span>
              Scan
            </button>
          </div>
        )}
      </div>

      {scanNotice && (
        <p role="status" className="tb-note">
          {scanNotice}
        </p>
      )}

      {isScanOpen ? (
        <div className="scan-panel">
          <p className="scan-title">{`Scanning onto ${sideLabel}`}</p>
          {scan.isLoading ? (
            <p className="tb-note">Loading scan data...</p>
          ) : (
            <div className="relative">
              <ScanCameraSurface
                onCapture={() => undefined}
                identify={scan.identify}
                onStatusChange={scan.setCameraStatus}
                onAcquisitionDiagnostic={scan.recordAcquisitionDiagnostic}
                convergence={scan.convergence}
                confirmation={scan.addConfirmation}
                debug={scan.scanDebug}
                autoScanFps={3}
              />
              {/* REQ-214: a box with an ✕ above the camera's top-right corner — the only
                  way out; closing commits the holding list below to this side. */}
              <button
                type="button"
                aria-label="Exit scan"
                onClick={scan.closeScan}
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
                onRemove={scan.removeHeld}
                destinationLabel={sideLabel}
              />
            </div>
          )}
          {scan.error && (
            <p role="alert" className="idq-error">
              {scan.error}
            </p>
          )}
        </div>
      ) : (
        isSearchOpen && (
          <section className="search-pop open" aria-label={`Add a card to ${sideLabel}`}>
            <div className="search-row">
              <span className="glyph" aria-hidden="true">
                ⌕
              </span>
              <input
                aria-label={`${sideLabel} card search`}
                value={query}
                disabled={isInputDisabled}
                onChange={(event) => setQuery(event.target.value)}
                className="field"
                placeholder={
                  isMetadataLoading
                    ? "Loading card list…"
                    : `Type at least ${MIN_TRADE_SEARCH_LENGTH} characters`
                }
              />
            </div>

            {pendingCard ? (
              <div className="search-results">
                {pendingPrintings === null ? (
                  <p className="tb-note">Loading printings…</p>
                ) : (
                  <PrintingPicker
                    cardName={pendingCard.name}
                    printings={pendingPrintings}
                    onSelect={handleSelectPendingPrinting}
                    onCancel={handleCancelPending}
                  />
                )}
              </div>
            ) : (
              showSuggestionPanel && (
                <div className="search-results">
                  {suggestions.length === 0 ? (
                    <p className="tb-note">{NO_MATCH_COPY}</p>
                  ) : (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.oracleId}
                        type="button"
                        onClick={() => handleSuggestionTap(suggestion.oracleId, suggestion.name)}
                      >
                        <span>{suggestion.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )
            )}
          </section>
        )
      )}

      {entries.length === 0 ? (
        <p className="entry-empty">No cards on this side yet — add one, or scan it.</p>
      ) : (
        <ul className="entries">
          {entries.map((entry) => (
            <TradeEntryRow
              key={entry.instanceId}
              entry={entry}
              meta={entryMetaById[entry.instanceId]}
              sideLabel={sideLabel}
              onToggleFoil={(instanceId) => onToggleFoil(sideId, instanceId)}
              onQuantityChange={(instanceId, quantity) =>
                onQuantityChange(sideId, instanceId, quantity)
              }
              onRemove={(instanceId) => onRemove(sideId, instanceId)}
              onChangePrinting={(instanceId, printing, foil) =>
                onChangePrinting(sideId, instanceId, printing, foil)
              }
              onRetryPricing={onRetryPricing}
            />
          ))}
        </ul>
      )}

      <div className="side-foot">
        <span>{`${sideLabel} total `}</span>
        <b aria-label={`${sideLabel} total`}>{formatUsd(total)}</b>
      </div>
    </section>
  );
}
