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

function printingPriceLabel(printing: CardPrintingPrice): string {
  const nonFoil = printing.usd === null ? "no price" : formatUsd(printing.usd);
  const foil = printing.usdFoil === null ? "no foil price" : `${formatUsd(printing.usdFoil)} foil`;
  return `${nonFoil} · ${foil}`;
}

export function PrintingPicker({
  cardName,
  printings,
  onSelect,
  onCancel,
  selectedPrintingId
}: PrintingPickerProps): JSX.Element {
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

      {printings.length === 0 ? (
        <p className="px-2 py-1 text-sm text-zinc-400">No printings available for this card.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {printings.map((printing) => {
            // REQ-066/REQ-174 (Slice D): each printing's image derives from its
            // own Scryfall id — printings of the same card look different
            // (different set art), which is exactly why an image disambiguates.
            const imageUrl = deriveCardImageUrl(printing.id);
            return (
              <li key={printing.id}>
                <button
                  type="button"
                  onClick={() => onSelect(printing)}
                  aria-current={printing.id === selectedPrintingId ? "true" : undefined}
                  className={`flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                    printing.id === selectedPrintingId
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
