import { useEffect, useMemo, useRef, useState } from "react";

import { PageShell } from "../PageShell";
import { StagedStepHeader } from "../StagedStepHeader";
import { StepEyebrow } from "../StepEyebrow";
import {
  loadCardPrices,
  type CardPrices,
  type CardPrintingPrice
} from "../../lib/trade/loadCardPrices";
import {
  difference,
  formatUsd,
  sideTotal,
  type TradeEntry,
  type TradeSideId
} from "../../lib/trade/pricing";
import { TradeSide } from "./TradeSide";
import { buildOracleSearchIndex } from "./oracleSearch";
import { useTradeScan } from "./useTradeScan";

const PRICE_LOAD_ERROR_COPY =
  "Card prices are unavailable right now. Cards you add will show $0 until prices load.";

function updateEntries(
  entries: TradeEntry[],
  instanceId: string,
  update: (entry: TradeEntry) => TradeEntry
): TradeEntry[] {
  return entries.map((entry) => (entry.instanceId === instanceId ? update(entry) : entry));
}

/**
 * Two-sided, ephemeral trade balancer (REQ-064, FLOW-009). State lives only in this
 * component: no persistence, no history, no suggestions. Printing choice is a pricing
 * and display concern only — it never reaches prompt context or any request payload.
 */
export function TradeBalancer(): JSX.Element {
  const [prices, setPrices] = useState<CardPrices | null>(null);
  const [isPricesLoading, setIsPricesLoading] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState<string | null>(null);
  const [entriesBySide, setEntriesBySide] = useState<Record<TradeSideId, TradeEntry[]>>({
    A: [],
    B: []
  });
  const nextInstanceIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    loadCardPrices()
      .then((loaded) => {
        if (!isMounted) return;
        setPrices(loaded);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const reason = error instanceof Error ? error.message : String(error);
        setPriceLoadError(`${PRICE_LOAD_ERROR_COPY} (${reason})`);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsPricesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const searchIndex = useMemo(
    () => (prices ? buildOracleSearchIndex(prices) : []),
    [prices]
  );

  function setSideEntries(
    sideId: TradeSideId,
    update: (entries: TradeEntry[]) => TradeEntry[]
  ): void {
    setEntriesBySide((current) => ({ ...current, [sideId]: update(current[sideId]) }));
  }

  function handleAddPrinting(sideId: TradeSideId, printing: CardPrintingPrice): void {
    nextInstanceIdRef.current += 1;
    const instanceId = `${printing.id}-${nextInstanceIdRef.current}`;
    setSideEntries(sideId, (entries) => [
      ...entries,
      { instanceId, printing, foil: false, quantity: 1 }
    ]);
  }

  function handleToggleFoil(sideId: TradeSideId, instanceId: string): void {
    setSideEntries(sideId, (entries) =>
      updateEntries(entries, instanceId, (entry) => ({ ...entry, foil: !entry.foil }))
    );
  }

  function handleQuantityChange(sideId: TradeSideId, instanceId: string, quantity: number): void {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    setSideEntries(sideId, (entries) =>
      updateEntries(entries, instanceId, (entry) => ({ ...entry, quantity: nextQuantity }))
    );
  }

  function handleRemove(sideId: TradeSideId, instanceId: string): void {
    setSideEntries(sideId, (entries) =>
      entries.filter((entry) => entry.instanceId !== instanceId)
    );
  }

  function handleChangePrinting(
    sideId: TradeSideId,
    instanceId: string,
    printing: CardPrintingPrice
  ): void {
    setSideEntries(sideId, (entries) =>
      updateEntries(entries, instanceId, (entry) => ({ ...entry, printing }))
    );
  }

  // Scan input (REQ-065 scan path): one camera at a time, adding to the side that
  // opened it. The scanned printing is the new entry's default and stays changeable.
  const scan = useTradeScan({ prices, onAddPrinting: handleAddPrinting });

  const totalA = sideTotal(entriesBySide.A);
  const totalB = sideTotal(entriesBySide.B);
  const gap = difference(totalA, totalB);
  const differenceCopy =
    gap.higher === "equal"
      ? "Even trade"
      : `Side ${gap.higher} is ahead by ${formatUsd(gap.amount)}`;

  const sideProps = {
    prices,
    searchIndex,
    isPricesLoading,
    scan,
    onAddPrinting: handleAddPrinting,
    onToggleFoil: handleToggleFoil,
    onQuantityChange: handleQuantityChange,
    onRemove: handleRemove,
    onChangePrinting: handleChangePrinting
  };

  return (
    <PageShell>
      <StagedStepHeader />
      <StepEyebrow stepName="Trade Balancer" />

      <section className="space-y-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
          Difference
        </p>
        <p className="text-lg font-semibold text-zinc-100" aria-label="Trade difference">
          {differenceCopy}
        </p>
        <p className="text-xs text-zinc-400">
          {`Side A ${formatUsd(totalA)} · Side B ${formatUsd(totalB)} · USD only`}
        </p>
        {isPricesLoading && <p className="text-sm text-zinc-400">Loading card prices…</p>}
        {priceLoadError && (
          <p role="alert" className="text-sm text-amber-200">
            {priceLoadError}
          </p>
        )}
        {prices && !isPricesLoading && prices.snapshotDate && (
          <p className="text-xs text-zinc-500">{`Prices as of ${prices.snapshotDate}`}</p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <TradeSide sideId="A" entries={entriesBySide.A} {...sideProps} />
        <TradeSide sideId="B" entries={entriesBySide.B} {...sideProps} />
      </div>
    </PageShell>
  );
}
