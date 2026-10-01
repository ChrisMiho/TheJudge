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
      head={
        <div className="flex items-center gap-3">
          {cardImageUrl && (
            <img src={cardImageUrl} alt="" aria-hidden="true" className="h-10 w-auto shrink-0 rounded object-contain" />
          )}
          <div>
            <h2 id={titleId} className="text-base font-semibold text-zinc-100">
              {`Choose a printing — ${cardName}`}
            </h2>
            <p className="text-xs text-zinc-400">{printingCountLabel(printings.length)}</p>
          </div>
        </div>
      }
    >
      <div className="space-y-2" aria-label={`Choose a printing for ${cardName}`} role="group">
        <p className="px-1 text-xs text-zinc-400">Tap Nonfoil or Foil to pick that printing and finish.</p>

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
          <ul className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-200"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-10 w-auto shrink-0 rounded object-contain"
                      />
                    )}
                    <span className="font-medium">
                      {`${printing.setName} (${printing.set.toUpperCase()}) #${printing.collectorNumber}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`${printing.setName} ${printing.set.toUpperCase()} nonfoil`}
                      aria-current={isNonfoilSelected ? "true" : undefined}
                      onClick={() => onSelect(printing, false)}
                      className={`min-h-10 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                        isNonfoilSelected
                          ? "border-accent/70 bg-accent/20 text-accent-soft"
                          : "border-zinc-600 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-700"
                      }`}
                    >
                      {`Nonfoil ${printing.usd === null ? "— no price" : formatUsd(printing.usd)}`}
                    </button>
                    <button
                      type="button"
                      aria-label={`${printing.setName} ${printing.set.toUpperCase()} foil`}
                      aria-current={isFoilSelected ? "true" : undefined}
                      disabled={!hasFoilPrice}
                      onClick={() => onSelect(printing, true)}
                      className={`min-h-10 rounded-lg border px-2 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isFoilSelected
                          ? "border-accent/70 bg-accent/20 text-accent-soft"
                          : "border-zinc-600 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-700"
                      }`}
                    >
                      {`Foil ${printing.usdFoil === null ? "— no price" : formatUsd(printing.usdFoil)}`}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SheetShell>
  );
}
