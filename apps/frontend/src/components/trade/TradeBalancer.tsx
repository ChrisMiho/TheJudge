import { useEffect, useMemo, useRef, useState } from "react";

import { PageShell } from "../PageShell";
import { StagedStepHeader } from "../StagedStepHeader";
import { StepEyebrow } from "../StepEyebrow";
import { fetchCardPrintings, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import {
  defaultFoilForPrinting,
  difference,
  formatUsd,
  sideTotal,
  type TradeEntry,
  type TradeSideId
} from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";
import { TradeSide } from "./TradeSide";
import { buildOracleSearchIndex } from "./oracleSearch";
import { useTradeScan } from "./useTradeScan";

const METADATA_URL = "/data/cardMetadata.json";

const METADATA_LOAD_ERROR_COPY =
  "The card list is unavailable right now. Search and scan won't find cards until it loads.";

/** REQ-065/FLOW-025: one entry's per-card price fetch, tracked outside
 * `TradeEntry` (pricing.ts's own type, untouched) so a loading/error UI state
 * never has to fake a `CardPrintingPrice`. */
type TradeEntryMeta = {
  oracleId: string;
  name: string;
  status: "loading" | "loaded" | "error";
  /** Every printing the fetch returned, for the "Change printing" picker. Empty while loading/error. */
  printings: CardPrintingPrice[];
  /** The scanned printing id, when this entry came from a scan lock (DEC-070) — reused on retry. */
  preferredPrintingId?: string;
};

const EMPTY_PRINTING: CardPrintingPrice = {
  id: "",
  set: "",
  setName: "",
  collectorNumber: "",
  usd: null,
  usdFoil: null
};

const SNAPSHOT_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

/**
 * Human-facing copy for the build-time price snapshot. The artifact carries a full ISO
 * timestamp (`2026-06-05T22:21:13.248Z`), which reads as a live quote and leaks raw
 * time/millisecond/zone detail the user cannot act on — the snapshot is only ever
 * accurate to the day it was built. Returns `null` for an unparseable value so the
 * freshness line is simply omitted rather than showing raw artifact data or throwing;
 * pricing itself never depends on this.
 */
function formatSnapshotDate(value: string): string | null {
  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }

  const parsed = new Date(`${dateOnly}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : SNAPSHOT_DATE_FORMATTER.format(parsed);
}

function updateEntries(
  entries: TradeEntry[],
  instanceId: string,
  update: (entry: TradeEntry) => TradeEntry
): TradeEntry[] {
  return entries.map((entry) => (entry.instanceId === instanceId ? update(entry) : entry));
}

/** Picks the printing an entry should show once its fetch resolves: the scanned/preferred
 * printing when it's in the fetched list, else the first printing the backend returned. */
function selectPrinting(printings: CardPrintingPrice[], preferredPrintingId?: string): CardPrintingPrice {
  const preferred = preferredPrintingId ? printings.find((p) => p.id === preferredPrintingId) : undefined;
  return preferred ?? printings[0] ?? EMPTY_PRINTING;
}

/**
 * Two-sided, ephemeral trade balancer (REQ-064, FLOW-009). State lives only in this
 * component: no persistence, no history, no suggestions. Printing choice is a pricing
 * and display concern only — it never reaches prompt context or any request payload.
 *
 * Card identity (name, search, scan preview) comes from the shared `cardMetadata`
 * index (REQ-174), loaded once up front. A card's printings and prices are fetched
 * from the backend only when it is added to a side, cached per session
 * (FLOW-025) — the balancer costs nothing at startup beyond `cardMetadata`.
 */
export function TradeBalancer(): JSX.Element {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[] | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataLoadError, setMetadataLoadError] = useState<string | null>(null);
  const [entriesBySide, setEntriesBySide] = useState<Record<TradeSideId, TradeEntry[]>>({
    A: [],
    B: []
  });
  const [entryMetaById, setEntryMetaById] = useState<Record<string, TradeEntryMeta>>({});
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const nextInstanceIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(METADATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Card list fetch failed with status ${response.status}`);
        }
        return response.json() as Promise<CardMetadataItem[]>;
      })
      .then((payload) => {
        setCardMetadata(payload);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const reason = error instanceof Error ? error.message : String(error);
        setMetadataLoadError(`${METADATA_LOAD_ERROR_COPY} (${reason})`);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsMetadataLoading(false);
      });

    return () => controller.abort();
  }, []);

  const searchIndex = useMemo(
    () => buildOracleSearchIndex(cardMetadata ?? []),
    [cardMetadata]
  );
  const snapshotCopy = snapshotDate ? formatSnapshotDate(snapshotDate) : null;

  function setSideEntries(
    sideId: TradeSideId,
    update: (entries: TradeEntry[]) => TradeEntry[]
  ): void {
    setEntriesBySide((current) => ({ ...current, [sideId]: update(current[sideId]) }));
  }

  function updateEntryOnEitherSide(
    instanceId: string,
    update: (entry: TradeEntry) => TradeEntry
  ): void {
    setEntriesBySide((current) => ({
      A: updateEntries(current.A, instanceId, update),
      B: updateEntries(current.B, instanceId, update)
    }));
  }

  /** FLOW-025: fetches one card's printings and prices, selects the preferred/first
   * printing once they arrive, and degrades the entry to $0-plus-caution with a
   * retry affordance on failure or a no-printings not-found result. */
  function loadPricingForEntry(instanceId: string, oracleId: string, preferredPrintingId?: string): void {
    setEntryMetaById((current) => ({
      ...current,
      [instanceId]: { ...current[instanceId], oracleId, status: "loading" }
    }));

    fetchCardPrintings(oracleId)
      .then((block) => {
        const printings = block?.printings ?? [];
        if (printings.length === 0) {
          setEntryMetaById((current) => ({
            ...current,
            [instanceId]: { ...current[instanceId], status: "error", printings: [] }
          }));
          return;
        }

        if (block) {
          setSnapshotDate(block.snapshotDate);
        }
        setEntryMetaById((current) => ({
          ...current,
          [instanceId]: { ...current[instanceId], status: "loaded", printings }
        }));
        updateEntryOnEitherSide(instanceId, (entry) => {
          const printing = selectPrinting(printings, preferredPrintingId);
          return { ...entry, printing, foil: defaultFoilForPrinting(printing) };
        });
      })
      .catch(() => {
        setEntryMetaById((current) => ({
          ...current,
          [instanceId]: { ...current[instanceId], status: "error", printings: [] }
        }));
      });
  }

  /** Adds a card by oracle id — the shared path for manual search (no preferred
   * printing; the fetch's first printing is the default) and scan (the scanned
   * printing id, DEC-070). The entry appears immediately with a loading state;
   * pricing arrives asynchronously (FLOW-025). */
  function handleAddByOracle(
    sideId: TradeSideId,
    oracleId: string,
    name: string,
    preferredPrintingId?: string
  ): void {
    nextInstanceIdRef.current += 1;
    const instanceId = `${oracleId}-${nextInstanceIdRef.current}`;

    setSideEntries(sideId, (entries) => [
      ...entries,
      {
        instanceId,
        printing: preferredPrintingId ? { ...EMPTY_PRINTING, id: preferredPrintingId } : EMPTY_PRINTING,
        foil: false,
        quantity: 1
      }
    ]);
    setEntryMetaById((current) => ({
      ...current,
      [instanceId]: { oracleId, name, status: "loading", printings: [], preferredPrintingId }
    }));

    loadPricingForEntry(instanceId, oracleId, preferredPrintingId);
  }

  function handleRetryPricing(instanceId: string): void {
    const meta = entryMetaById[instanceId];
    if (!meta) return;
    loadPricingForEntry(instanceId, meta.oracleId, meta.preferredPrintingId);
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
    setEntryMetaById((current) => {
      const next = { ...current };
      delete next[instanceId];
      return next;
    });
  }

  function handleChangePrinting(
    sideId: TradeSideId,
    instanceId: string,
    printing: CardPrintingPrice
  ): void {
    setSideEntries(sideId, (entries) =>
      updateEntries(entries, instanceId, (entry) => ({
        ...entry,
        printing,
        foil: defaultFoilForPrinting(printing)
      }))
    );
  }

  // Scan input (REQ-065 scan path): one camera at a time, adding to the side that
  // opened it. The scanned printing is the new entry's default and stays changeable.
  const scan = useTradeScan({ cardMetadata: cardMetadata ?? [], onAddByOracle: handleAddByOracle });

  const totalA = sideTotal(entriesBySide.A);
  const totalB = sideTotal(entriesBySide.B);
  const gap = difference(totalA, totalB);
  const differenceCopy =
    gap.higher === "equal"
      ? "Even trade"
      : `Side ${gap.higher} is ahead by ${formatUsd(gap.amount)}`;

  const sideProps = {
    cardMetadata: cardMetadata ?? [],
    searchIndex,
    isMetadataLoading,
    // Disabled while loading, and still disabled after a failed load (no
    // cardMetadata to search or scan against) — mirrors the prior
    // `isPricesLoading || prices === null` gate.
    isSearchDisabled: isMetadataLoading || cardMetadata === null,
    entryMetaById,
    scan,
    onAddByOracle: handleAddByOracle,
    onToggleFoil: handleToggleFoil,
    onQuantityChange: handleQuantityChange,
    onRemove: handleRemove,
    onChangePrinting: handleChangePrinting,
    onRetryPricing: handleRetryPricing
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
        {isMetadataLoading && <p className="text-sm text-zinc-400">Loading card list…</p>}
        {metadataLoadError && (
          <p role="alert" className="text-sm text-amber-200">
            {metadataLoadError}
          </p>
        )}
        {snapshotCopy && <p className="text-xs text-zinc-500">{`Prices as of ${snapshotCopy}`}</p>}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <TradeSide sideId="A" entries={entriesBySide.A} {...sideProps} />
        <TradeSide sideId="B" entries={entriesBySide.B} {...sideProps} />
      </div>
    </PageShell>
  );
}
