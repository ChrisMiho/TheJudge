import { useState } from "react";

import { deriveCardImageUrl } from "../../lib/cardImage";
import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import {
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatUsd,
  type TradeEntry
} from "../../lib/trade/pricing";
import { PrintingPicker } from "./PrintingPicker";

/** FLOW-025: one entry's per-card fetch state, computed and owned by
 * `TradeBalancer` (kept out of `pricing.ts`'s own `TradeEntry` type). */
export type TradeEntryPricingMeta = {
  oracleId: string;
  name: string;
  status: "loading" | "loaded" | "error";
  printings: CardPrintingPrice[];
};

export type TradeEntryRowProps = {
  entry: TradeEntry;
  /** Undefined only transiently, before `TradeBalancer` seeds meta for a just-added instanceId. */
  meta: TradeEntryPricingMeta | undefined;
  sideLabel: string;
  onToggleFoil: (instanceId: string) => void;
  onQuantityChange: (instanceId: string, quantity: number) => void;
  onRemove: (instanceId: string) => void;
  onChangePrinting: (instanceId: string, printing: CardPrintingPrice) => void;
  onRetryPricing: (instanceId: string) => void;
};

export function TradeEntryRow({
  entry,
  meta,
  sideLabel,
  onToggleFoil,
  onQuantityChange,
  onRemove,
  onChangePrinting,
  onRetryPricing
}: TradeEntryRowProps): JSX.Element {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const missingPrice = entryHasMissingPrice(entry);
  const unitPrice = entryUnitPrice(entry);
  const { printing } = entry;
  const name = meta?.name ?? "";
  const isLoading = meta?.status === "loading";
  const isError = meta?.status === "error";
  const alternatePrintings = meta?.printings ?? [];
  const entryDescription = `${name} (${sideLabel})`;
  const imageUrl = deriveCardImageUrl(printing.id);

  return (
    <li
      className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/35 p-3"
      data-missing-price={missingPrice ? "true" : undefined}
      data-pricing-status={meta?.status}
    >
      <div className="flex flex-wrap items-start gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="h-16 w-auto shrink-0 rounded-md object-contain"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{name}</p>
            {isLoading ? (
              <p className="text-xs text-zinc-400" role="status">
                Loading price…
              </p>
            ) : printing.setName ? (
              <p className="text-xs text-zinc-400">
                {`${printing.setName} (${printing.set.toUpperCase()}) #${printing.collectorNumber}`}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-semibold ${missingPrice ? "text-amber-300" : "text-zinc-100"}`}
              data-testid="entry-contribution"
            >
              {missingPrice && !isLoading && (
                <span role="img" aria-label={`No ${entry.foil ? "foil " : ""}price for ${name}`}>
                  {"⚠ "}
                </span>
              )}
              {formatUsd(entryContribution(entry))}
            </p>
            <p className="text-xs text-zinc-400">
              {isLoading
                ? ""
                : missingPrice
                  ? "No price — counts as $0"
                  : `${formatUsd(unitPrice ?? 0)} × ${entry.quantity}`}
            </p>
          </div>
        </div>
      </div>

      {isError && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-700/50 bg-amber-950/20 px-2 py-1.5">
          <p className="text-xs text-amber-200">Price unavailable right now.</p>
          <button
            type="button"
            onClick={() => onRetryPricing(entry.instanceId)}
            className="min-h-8 rounded-lg border border-amber-600/60 bg-zinc-950/60 px-2 py-1 text-xs font-semibold text-amber-200 transition hover:bg-zinc-800"
          >
            Retry
          </button>
        </div>
      )}

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
          disabled={isLoading || alternatePrintings.length === 0}
          onClick={() => setIsPickerOpen((open) => !open)}
          className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
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
          cardName={name}
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
