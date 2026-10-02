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
  onChangePrinting: (instanceId: string, printing: CardPrintingPrice, foil: boolean) => void;
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
      className="tb-entry"
      data-missing-price={missingPrice ? "true" : undefined}
      data-pricing-status={meta?.status}
      data-foil={entry.foil ? "true" : undefined}
    >
      {imageUrl && <img src={imageUrl} alt="" aria-hidden="true" className="tb-entry-card" />}
      <div className="tb-entry-info">
        <p className="tb-entry-name">{name}</p>
        {isLoading ? (
          <p className="tb-entry-printing" role="status">
            Loading price…
          </p>
        ) : printing.setName ? (
          <p className="tb-entry-printing">
            {`${printing.setName} · ${printing.set.toUpperCase()} · `}
            {alternatePrintings.length > 1 ? (
              <button
                type="button"
                aria-label={`Change printing for ${entryDescription}`}
                disabled={isLoading}
                onClick={() => setIsPickerOpen((open) => !open)}
                className="tb-entry-printing-link"
              >
                Change
              </button>
            ) : (
              <span className="tb-entry-printing-only">only printing</span>
            )}
          </p>
        ) : null}

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

        <div className="tb-entry-controls">
          <button
            type="button"
            aria-label={`Toggle foil for ${entryDescription}`}
            aria-pressed={entry.foil}
            onClick={() => onToggleFoil(entry.instanceId)}
            className="tb-entry-ctl"
          >
            Foil
          </button>

          <button
            type="button"
            aria-label={`Decrease quantity for ${entryDescription}`}
            disabled={entry.quantity <= 1}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity - 1)}
            className="tb-entry-ctl"
          >
            −
          </button>
          <span aria-label={`Quantity for ${entryDescription}`} className="tb-entry-qty">
            {entry.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity for ${entryDescription}`}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity + 1)}
            className="tb-entry-ctl"
          >
            +
          </button>
        </div>
      </div>

      <div className="tb-entry-money">
        <p
          className={`tb-entry-line ${missingPrice ? "text-amber-300" : ""}`}
          data-testid="entry-contribution"
        >
          {missingPrice && !isLoading && (
            <span role="img" aria-label={`No ${entry.foil ? "foil " : ""}price for ${name}`}>
              {"⚠ "}
            </span>
          )}
          {formatUsd(entryContribution(entry))}
        </p>
        <p className="tb-entry-unit">
          {isLoading
            ? ""
            : missingPrice
              ? "No price — $0"
              : `${formatUsd(unitPrice ?? 0)} × ${entry.quantity}`}
        </p>
        <button
          type="button"
          aria-label={`Remove ${entryDescription}`}
          onClick={() => onRemove(entry.instanceId)}
          className="tb-entry-remove"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {isPickerOpen && (
        <PrintingPicker
          cardName={name}
          printings={alternatePrintings}
          selectedPrintingId={printing.id}
          selectedFoil={entry.foil}
          onCancel={() => setIsPickerOpen(false)}
          onSelect={(nextPrinting, foil) => {
            onChangePrinting(entry.instanceId, nextPrinting, foil);
            setIsPickerOpen(false);
          }}
        />
      )}
    </li>
  );
}
