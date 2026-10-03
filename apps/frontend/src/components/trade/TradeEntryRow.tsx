import { useState } from "react";

import { getCardIdentityRingStyle } from "../../lib/cardIdentityRing";
import { deriveCardImageUrl } from "../../lib/cardImage";
import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import {
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatUsd,
  type TradeEntry
} from "../../lib/trade/pricing";
import { CardDetailPopup } from "../CardPresentation";
import { PrintingPicker } from "./PrintingPicker";

/** FLOW-025: one entry's per-card fetch state, computed and owned by
 * `TradeBalancer` (kept out of `pricing.ts`'s own `TradeEntry` type). */
export type TradeEntryPricingMeta = {
  oracleId: string;
  name: string;
  /** The card's colour identity, for the row's identity ring (REQ-058). */
  colors?: string[];
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

/**
 * One trade row in `trade-balancer.html`'s `.entry` order: the card tile (a tap opens the card detail),
 * the name, printing line and Foil / − / quantity / + controls, and the money column.
 */
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
      className="entry"
      data-missing-price={missingPrice ? "true" : undefined}
      data-pricing-status={meta?.status}
      data-foil={entry.foil ? "true" : "false"}
    >
      {imageUrl ? (
        <button
          type="button"
          className="card card-identity-ring"
          style={getCardIdentityRingStyle(meta?.colors)}
          title="Card details"
          aria-label={`Show details for ${name}`}
          aria-haspopup="dialog"
          onClick={() => setIsDetailOpen(true)}
        >
          <img src={imageUrl} alt="" aria-hidden="true" />
        </button>
      ) : (
        <span className="card" aria-hidden="true" />
      )}
      <div className="info">
        <span className="nm">{name}</span>
        {isLoading ? (
          <span className="printing" role="status">
            Loading price…
          </span>
        ) : printing.setName ? (
          <span className="printing">
            {`${printing.setName} · ${printing.set.toUpperCase()} · `}
            {alternatePrintings.length > 1 ? (
              <button
                type="button"
                aria-label={`Change printing for ${entryDescription}`}
                disabled={isLoading}
                onClick={() => setIsPickerOpen((open) => !open)}
              >
                Change
              </button>
            ) : (
              <span className="only">only printing</span>
            )}
          </span>
        ) : null}

        {isError && (
          <div className="entry-error">
            <p>Price unavailable right now.</p>
            <button type="button" onClick={() => onRetryPricing(entry.instanceId)} className="ctl">
              Retry
            </button>
          </div>
        )}

        <div className="controls">
          <button
            type="button"
            aria-label={`Toggle foil for ${entryDescription}`}
            aria-pressed={entry.foil}
            onClick={() => onToggleFoil(entry.instanceId)}
            className="ctl"
          >
            Foil
          </button>

          <button
            type="button"
            aria-label={`Decrease quantity for ${entryDescription}`}
            disabled={entry.quantity <= 1}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity - 1)}
            className="ctl"
          >
            −
          </button>
          <span aria-label={`Quantity for ${entryDescription}`} className="qty">
            {entry.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity for ${entryDescription}`}
            onClick={() => onQuantityChange(entry.instanceId, entry.quantity + 1)}
            className="ctl"
          >
            +
          </button>
        </div>
      </div>

      <div className="money">
        <span className={missingPrice ? "line missing" : "line"} data-testid="entry-contribution">
          {missingPrice && !isLoading && (
            <span role="img" aria-label={`No ${entry.foil ? "foil " : ""}price for ${name}`}>
              {"⚠ "}
            </span>
          )}
          {formatUsd(entryContribution(entry))}
        </span>
        <span className="unit">
          {isLoading ? "" : missingPrice ? "No price — $0" : `${formatUsd(unitPrice ?? 0)} × ${entry.quantity}`}
        </span>
        <button type="button" className="x" aria-label={`Remove ${entryDescription}`} onClick={() => onRemove(entry.instanceId)}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {isDetailOpen && (
        <CardDetailPopup
          card={{ cardId: meta?.oracleId ?? "", name, imageId: printing.id }}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

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
