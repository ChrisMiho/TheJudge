import { useState } from "react";

import { NO_MATCH_COPY } from "../../lib/search";
import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import { formatUsd, sideTotal, type TradeEntry, type TradeSideId } from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";
import { ScanCameraSurface } from "../ScanCameraSurface";
import { TradeEntryRow, type TradeEntryPricingMeta } from "./TradeEntryRow";
import type { TradeScan } from "./useTradeScan";
import {
  MIN_TRADE_SEARCH_LENGTH,
  searchOracleIndex,
  type OracleSearchEntry
} from "./oracleSearch";

export type TradeSideProps = {
  sideId: TradeSideId;
  entries: TradeEntry[];
  cardMetadata: CardMetadataItem[];
  searchIndex: OracleSearchEntry[];
  isMetadataLoading: boolean;
  isSearchDisabled: boolean;
  entryMetaById: Record<string, TradeEntryPricingMeta>;
  scan: TradeScan;
  onAddByOracle: (sideId: TradeSideId, oracleId: string, name: string, preferredPrintingId?: string) => void;
  onToggleFoil: (sideId: TradeSideId, instanceId: string) => void;
  onQuantityChange: (sideId: TradeSideId, instanceId: string, quantity: number) => void;
  onRemove: (sideId: TradeSideId, instanceId: string) => void;
  onChangePrinting: (sideId: TradeSideId, instanceId: string, printing: CardPrintingPrice) => void;
  onRetryPricing: (instanceId: string) => void;
};

export function TradeSide({
  sideId,
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
  const [query, setQuery] = useState("");
  const sideLabel = `Side ${sideId}`;
  const total = sideTotal(entries);
  const isScanOpen = scan.activeSideId === sideId;
  const scanNotice = scan.notice?.sideId === sideId ? scan.notice.message : null;
  const isInputDisabled = isSearchDisabled;
  const suggestions = searchOracleIndex(searchIndex, query);
  const showSuggestionPanel = query.trim().length >= MIN_TRADE_SEARCH_LENGTH;

  // REQ-065/FLOW-025: the card is added immediately on selection — its printings
  // and prices are not known yet (no bulk artifact to pick a printing from up
  // front); the balancer fetches them on add and the entry shows a brief loading
  // state while they resolve. The existing "Change printing" affordance on the
  // resolved entry is how the player picks a different printing than the default.
  function addByOracle(oracleId: string, name: string): void {
    onAddByOracle(sideId, oracleId, name);
    setQuery("");
  }

  return (
    <section
      aria-label={sideLabel}
      className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-100">{sideLabel}</h3>
        <p className="text-sm font-semibold text-zinc-100" aria-label={`${sideLabel} total`}>
          {formatUsd(total)}
        </p>
      </div>

      {isScanOpen ? (
        <div className="space-y-3 rounded-xl border border-zinc-600 bg-zinc-950/40 p-3">
          <div className="flex min-h-10 items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
              {`Scanning onto ${sideLabel}`}
            </p>
            <button
              type="button"
              onClick={scan.closeScan}
              className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              Exit scan
            </button>
          </div>
          {scan.isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
              Loading scan data...
            </p>
          ) : (
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
          )}
          {scan.error && (
            <p role="alert" className="text-sm text-amber-200">
              {scan.error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
            <span>Add a card</span>
            <span className="mt-2 grid gap-2 normal-case tracking-normal sm:grid-cols-[1fr_auto] sm:items-center">
              <input
                aria-label={`${sideLabel} card search`}
                value={query}
                disabled={isInputDisabled}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={
                  isMetadataLoading
                    ? "Loading card list…"
                    : `Type at least ${MIN_TRADE_SEARCH_LENGTH} characters`
                }
              />
              <button
                type="button"
                aria-label={`Scan a card onto ${sideLabel}`}
                disabled={isInputDisabled}
                onClick={() => scan.openScan(sideId)}
                className="min-h-10 rounded-xl border border-accent/70 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-soft transition hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Scan
              </button>
            </span>
          </label>
          {scanNotice && (
            <p role="status" className="text-sm text-amber-200">
              {scanNotice}
            </p>
          )}
        </div>
      )}

      {!isScanOpen && showSuggestionPanel && (
        <div className="rounded-xl border border-zinc-600 bg-zinc-800/70 p-2">
          {suggestions.length === 0 ? (
            <p className="px-2 py-1 text-sm text-zinc-400">{NO_MATCH_COPY}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion.oracleId}>
                  <button
                    type="button"
                    onClick={() => addByOracle(suggestion.oracleId, suggestion.name)}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-700 hover:text-accent-soft"
                  >
                    {suggestion.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">No cards on this side yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
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
              onChangePrinting={(instanceId, printing) =>
                onChangePrinting(sideId, instanceId, printing)
              }
              onRetryPricing={onRetryPricing}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
