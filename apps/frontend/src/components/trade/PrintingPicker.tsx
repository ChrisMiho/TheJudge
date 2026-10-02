import { useEffect, useId, useMemo, useRef, useState } from "react";

import { deriveCardImageUrl } from "../../lib/cardImage";
import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import { formatUsd } from "../../lib/trade/pricing";
import { SheetShell } from "../SheetShell";

export type PrintingPickerProps = {
  cardName: string;
  printings: CardPrintingPrice[];
  /** A tap picks both the printing and the finish in one action (REQ-065). */
  onSelect: (printing: CardPrintingPrice, foil: boolean) => void;
  onCancel: () => void;
  /** Marks the printing/finish currently in use, when re-pricing an existing entry. */
  selectedPrintingId?: string;
  selectedFoil?: boolean;
};

// REQ-065 (owner-edited): the filter earns its place once the list is long
// enough to need narrowing — 5, not 8.
const FILTER_THRESHOLD = 5;

function printingCountLabel(count: number): string {
  return count === 1 ? "only printing" : `${count} printings`;
}

function matchesSetFilter(printing: CardPrintingPrice, normalizedQuery: string): boolean {
  return (
    printing.setName.toLowerCase().includes(normalizedQuery) ||
    printing.set.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * The suite's printing picker (REQ-065), hosted on the shared `SheetShell`
 * (REQ-208) — the same component used before an add and behind "Change
 * printing". Each row carries its own Nonfoil and Foil price pill; a tap
 * picks that printing and that finish in one action. A printing with no foil
 * price shows a disabled Foil pill. `CardPrintingPrice` carries no release
 * date, so the row reads set name, code, and collector number — "code · year"
 * is not shown (no year field exists on the price route's response; adding
 * one is a backend-contract change out of this slice's scope).
 */
export function PrintingPicker({
  cardName,
  printings,
  onSelect,
  onCancel,
  selectedPrintingId,
  selectedFoil
}: PrintingPickerProps): JSX.Element {
  const [filter, setFilter] = useState("");
  const selectedRowRef = useRef<HTMLLIElement | null>(null);
  const showFilter = printings.length > FILTER_THRESHOLD;
  const titleId = useId();

  // D6: scroll the current printing into view the moment the picker opens —
  // once per mount, matching "when it opens" rather than every re-render.
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const visiblePrintings = useMemo(() => {
    const normalizedQuery = filter.trim().toLowerCase();
    if (!showFilter || normalizedQuery.length === 0) return printings;
    return printings.filter((printing) => matchesSetFilter(printing, normalizedQuery));
  }, [filter, printings, showFilter]);

  const cardImageUrl = printings[0] ? deriveCardImageUrl(printings[0].id) : undefined;

  return (
    <SheetShell
      isOpen
      onClose={onCancel}
      closeLabel={`Cancel choosing a printing for ${cardName}`}
      titleId={titleId}
      testId="printing-picker"
    >
      {/* Look-matching pass (slice O), requirement 9: an art-crop hero with the
          card's name over it (`trade-balancer.html`'s `#pp-art`/`#pp-title`),
          reusing slice L's `.card-detail-hero*` shell — the same classes
          `CardPresentation.tsx`'s own card-detail popup uses, so this picker
          and the card-detail popup share one visual family rather than a
          second hero built from scratch. The mockup's hero also shows the
          card's mana cost (`#pp-cost`, from its own demo data's `card.cost`
          field); `CardPrintingPrice` carries no mana-cost field — fetching one
          would be a backend-contract change out of this look-only slice's
          scope (`DESIGN-BRIEF.md`'s non-goal), so the hero here shows the art
          and name only, with no sourceless cost line. */}
      <div className="card-detail-hero-wrap">
        <div className="card-detail-hero">
          {cardImageUrl && (
            <img src={cardImageUrl} alt="" aria-hidden="true" className="card-detail-hero-img" />
          )}
          <div className="card-detail-hero-title">
            <h2 id={titleId} className="card-detail-hero-name">
              {cardName}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-2" aria-label={`Choose a printing for ${cardName}`} role="group">
        <p className="pp-lede px-1 text-xs text-zinc-400">
          Tap a price to use that printing and finish.
        </p>
        <p className="px-1 text-xs text-zinc-400">{printingCountLabel(printings.length)}</p>

        {showFilter && (
          <input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label={`Filter printings for ${cardName} by set`}
            placeholder="Filter by set name or code"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          />
        )}

        {printings.length === 0 ? (
          <p className="px-2 py-1 text-sm text-zinc-400">No printings available for this card.</p>
        ) : visiblePrintings.length === 0 ? (
          <p className="px-2 py-1 text-sm text-zinc-400">No printings match that set.</p>
        ) : (
          // D2: region-scrolls at ~5-6 rows, capped near 40vh, instead of
          // growing the page with the card's printing count (Sol Ring: 128;
          // corpus max 771) — REQ-065, screen-layout.md.
          <ul className="tb-printing-list flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
            {visiblePrintings.map((printing) => {
              // REQ-066/REQ-174 (Slice D): each printing's image derives from its
              // own Scryfall id — printings of the same card look different
              // (different set art), which is exactly why an image disambiguates.
              const imageUrl = deriveCardImageUrl(printing.id);
              const isNonfoilSelected = printing.id === selectedPrintingId && selectedFoil === false;
              const isFoilSelected = printing.id === selectedPrintingId && selectedFoil === true;
              const hasFoilPrice = printing.usdFoil !== null;

              return (
                <li
                  key={printing.id}
                  ref={isNonfoilSelected || isFoilSelected ? selectedRowRef : undefined}
                  data-current={printing.id === selectedPrintingId ? "true" : undefined}
                  className="tb-printing-row"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="tb-printing-thumb"
                    />
                  )}
                  <div className="tb-printing-set">
                    <span className="tb-printing-set-name">
                      {printing.setName}
                      <small>{`${printing.set.toUpperCase()} · #${printing.collectorNumber}`}</small>
                    </span>
                    <span className="tb-printing-finishes">
                      <button
                        type="button"
                        aria-label={`${printing.setName} ${printing.set.toUpperCase()} nonfoil`}
                        aria-current={isNonfoilSelected ? "true" : undefined}
                        onClick={() => onSelect(printing, false)}
                        className="tb-finish"
                      >
                        <small>Nonfoil</small>
                        <b>{printing.usd === null ? "— no price" : formatUsd(printing.usd)}</b>
                      </button>
                      <button
                        type="button"
                        aria-label={`${printing.setName} ${printing.set.toUpperCase()} foil`}
                        aria-current={isFoilSelected ? "true" : undefined}
                        disabled={!hasFoilPrice}
                        onClick={() => onSelect(printing, true)}
                        className="tb-finish"
                      >
                        <small>Foil</small>
                        <b>{printing.usdFoil === null ? "— no price" : formatUsd(printing.usdFoil)}</b>
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SheetShell>
  );
}
