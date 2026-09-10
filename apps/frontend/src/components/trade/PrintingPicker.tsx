import { useEffect, useMemo, useRef, useState } from "react";

import { deriveCardImageUrl } from "../../lib/cardImage";
import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import { formatUsd } from "../../lib/trade/pricing";

export type PrintingPickerProps = {
  cardName: string;
  printings: CardPrintingPrice[];
  onSelect: (printing: CardPrintingPrice) => void;
  onCancel: () => void;
  /** Marks the printing currently in use, when re-pricing an existing entry. */
  selectedPrintingId?: string;
};

// D4: a set filter only earns its place once the list is long enough to need
// narrowing — Sol Ring's 128 rows do, most cards' few printings don't.
const FILTER_THRESHOLD = 8;

function printingPriceLabel(printing: CardPrintingPrice): string {
  const nonFoil = printing.usd === null ? "no price" : formatUsd(printing.usd);
  const foil = printing.usdFoil === null ? "no foil price" : `${formatUsd(printing.usdFoil)} foil`;
  return `${nonFoil} · ${foil}`;
}

function printingCountLabel(count: number): string {
  return `${count} printing${count === 1 ? "" : "s"}`;
}

function matchesSetFilter(printing: CardPrintingPrice, normalizedQuery: string): boolean {
  return (
    printing.setName.toLowerCase().includes(normalizedQuery) ||
    printing.set.toLowerCase().includes(normalizedQuery)
  );
}

export function PrintingPicker({
  cardName,
  printings,
  onSelect,
  onCancel,
  selectedPrintingId
}: PrintingPickerProps): JSX.Element {
  const [filter, setFilter] = useState("");
  const selectedRowRef = useRef<HTMLLIElement | null>(null);
  const showFilter = printings.length > FILTER_THRESHOLD;

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

  return (
    <div
      className="space-y-2 rounded-xl border border-zinc-600 bg-zinc-800/70 p-2"
      aria-label={`Choose a printing for ${cardName}`}
      role="group"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
          {`Choose a printing — ${cardName}`}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
        >
          Cancel
        </button>
      </div>

      {/* D1: printing count, computed from the fetched list — never a stored field. */}
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
        <ul className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
          {visiblePrintings.map((printing) => {
            // REQ-066/REQ-174 (Slice D): each printing's image derives from its
            // own Scryfall id — printings of the same card look different
            // (different set art), which is exactly why an image disambiguates.
            const imageUrl = deriveCardImageUrl(printing.id);
            const isSelected = printing.id === selectedPrintingId;
            return (
              <li key={printing.id} ref={isSelected ? selectedRowRef : undefined}>
                <button
                  type="button"
                  onClick={() => onSelect(printing)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-zinc-700 text-accent-soft"
                      : "text-zinc-200 hover:bg-zinc-700 hover:text-accent-soft"
                  }`}
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
                  <span className="text-xs text-zinc-400">{printingPriceLabel(printing)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
