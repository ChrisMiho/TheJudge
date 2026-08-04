import { useState } from "react";

import type { CardPrices, CardPrintingPrice } from "../../lib/trade/loadCardPrices";
import {
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatUsd,
  type TradeEntry
} from "../../lib/trade/pricing";
import { PrintingPicker } from "./PrintingPicker";

export type TradeEntryRowProps = {
  entry: TradeEntry;
  sideLabel: string;
  prices: CardPrices | null;
  onToggleFoil: (instanceId: string) => void;
  onQuantityChange: (instanceId: string, quantity: number) => void;
  onRemove: (instanceId: string) => void;
  onChangePrinting: (instanceId: string, printing: CardPrintingPrice) => void;
};

export function TradeEntryRow({
  entry,
  sideLabel,
  prices,
  onToggleFoil,
  onQuantityChange,
  onRemove,
  onChangePrinting
}: TradeEntryRowProps): JSX.Element {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const missingPrice = entryHasMissingPrice(entry);
  const unitPrice = entryUnitPrice(entry);
  const { printing } = entry;
  const alternatePrintings = prices?.listPrintingsForOracle(printing.oracleId) ?? [];
  const entryDescription = `${printing.name} (${sideLabel})`;

  return (
    <li
      className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/35 p-3"
      data-missing-price={missingPrice ? "true" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">{printing.name}</p>
          <p className="text-xs text-zinc-400">
            {`${printing.setName} (${printing.set.toUpperCase()}) #${printing.collectorNumber}`}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${missingPrice ? "text-amber-300" : "text-zinc-100"}`}
            data-testid="entry-contribution"
          >
            {missingPrice && (
              <span role="img" aria-label={`No ${entry.foil ? "foil " : ""}price for ${printing.name}`}>
                {"⚠ "}
              </span>
            )}
            {formatUsd(entryContribution(entry))}
          </p>
          <p className="text-xs text-zinc-400">
            {missingPrice
              ? "No price — counts as $0"
              : `${formatUsd(unitPrice ?? 0)} × ${entry.quantity}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={`Toggle foil for ${entryDescription}`}
          aria-pressed={entry.foil}
          onClick={() => onToggleFoil(entry.instanceId)}
          className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            entry.foil
              ? "border-accent/70 bg-accent/15 text-accent-soft"
              : "border-zinc-600 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          Foil
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Decrease quantity for ${entryDescription}`}
            disabled={entry.quantity <= 1}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity - 1)}
            className="min-h-10 min-w-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span
            aria-label={`Quantity for ${entryDescription}`}
            className="min-w-8 text-center text-sm font-semibold text-zinc-100"
          >
            {entry.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity for ${entryDescription}`}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity + 1)}
            className="min-h-10 min-w-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700"
          >
            +
          </button>
        </div>

        <button
          type="button"
          aria-label={`Change printing for ${entryDescription}`}
          onClick={() => setIsPickerOpen((open) => !open)}
          className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
        >
          Change printing
        </button>

        <button
          type="button"
          aria-label={`Remove ${entryDescription}`}
          onClick={() => onRemove(entry.instanceId)}
          className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
        >
          Remove
        </button>
      </div>

      {isPickerOpen && (
        <PrintingPicker
          cardName={printing.name}
          printings={alternatePrintings}
          selectedPrintingId={printing.id}
          onCancel={() => setIsPickerOpen(false)}
          onSelect={(nextPrinting) => {
            onChangePrinting(entry.instanceId, nextPrinting);
            setIsPickerOpen(false);
          }}
        />
      )}
    </li>
  );
}
