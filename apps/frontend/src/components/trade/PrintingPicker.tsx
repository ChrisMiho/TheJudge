import { useEffect, useId, useMemo, useRef, useState } from "react";

import { getCardIdentityRingStyle } from "../../lib/cardIdentityRing";
import { deriveCardArtCropUrl, deriveCardImageUrl } from "../../lib/cardImage";
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

function matchesSetFilter(printing: CardPrintingPrice, normalizedQuery: string): boolean {
  return (
    printing.setName.toLowerCase().includes(normalizedQuery) ||
    printing.set.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * The suite's printing picker (REQ-065), hosted on the shared `SheetShell`
 * (REQ-208) — the same component used before an add and behind "Change
 * printing". It takes `trade-balancer.html`'s `#pp-panel`: the card's art-crop hero with its name
 * over it, "Tap a price to use that printing and finish.", the set filter (only once a card has
 * more than five printings), and one row per printing. Each row carries its own Nonfoil and Foil
 * price pill; a tap picks that printing and that finish in one action. A printing with no foil
 * price shows a disabled Foil pill. `CardPrintingPrice` carries no release date or mana cost, so
 * the row reads set name, code and collector number — "code · year" and the hero's cost are not
 * shown (adding either is a backend-contract change out of this slice's scope).
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

  const artCropUrl = printings[0] ? deriveCardArtCropUrl(printings[0].id) : undefined;

  return (
    <SheetShell
      isOpen
      onClose={onCancel}
      closeLabel={`Cancel choosing a printing for ${cardName}`}
      titleId={titleId}
      panelClassName="detail-panel"
      testId="printing-picker"
    >
      <div className="art">
        {artCropUrl && <img src={artCropUrl} alt="" aria-hidden="true" />}
        <div className="title">
          <h2 id={titleId}>{cardName}</h2>
        </div>
      </div>

      <div className="body" aria-label={`Choose a printing for ${cardName}`} role="group">
        <p className="pp-lede">Tap a price to use that printing and finish.</p>

        {showFilter && (
          <input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label={`Filter printings for ${cardName} by set`}
            placeholder="Filter by set name or code"
            className="field pp-filter"
          />
        )}

        {printings.length === 0 ? (
          <p className="pp-lede">No printings available for this card.</p>
        ) : visiblePrintings.length === 0 ? (
          <p className="pp-lede">No printings match that set.</p>
        ) : (
          // D2: the list scrolls with the sheet's own body instead of growing the page with the
          // card's printing count (Sol Ring: 128; corpus max 771) — REQ-065, screen-layout.md.
          <ul className="printing-list">
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
                  data-current={printing.id === selectedPrintingId ? "true" : "false"}
                  className="printing-row"
                >
                  {imageUrl && (
                    <span className="thumb card-identity-ring" style={getCardIdentityRingStyle(undefined)}>
                      <img src={imageUrl} alt="" aria-hidden="true" loading="lazy" />
                    </span>
                  )}
                  <div className="set">
                    <span className="n">
                      {printing.setName}
                      <small>{`${printing.set.toUpperCase()} · #${printing.collectorNumber}`}</small>
                    </span>
                    <span className="finishes">
                      <button
                        type="button"
                        aria-label={`${printing.setName} ${printing.set.toUpperCase()} nonfoil`}
                        aria-pressed={isNonfoilSelected}
                        aria-current={isNonfoilSelected ? "true" : undefined}
                        onClick={() => onSelect(printing, false)}
                        className="finish"
                      >
                        <small>Nonfoil</small>
                        <b>{printing.usd === null ? "— no price" : formatUsd(printing.usd)}</b>
                      </button>
                      <button
                        type="button"
                        aria-label={`${printing.setName} ${printing.set.toUpperCase()} foil`}
                        aria-pressed={isFoilSelected}
                        aria-current={isFoilSelected ? "true" : undefined}
                        disabled={!hasFoilPrice}
                        onClick={() => onSelect(printing, true)}
                        className="finish foil"
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
