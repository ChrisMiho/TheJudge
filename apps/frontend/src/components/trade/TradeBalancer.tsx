import { useEffect, useMemo, useRef, useState } from "react";

import { ConfirmSheet } from "../ConfirmSheet";
import { PageShell } from "../PageShell";
import { StagedStepHeader } from "../StagedStepHeader";
import { apiBaseUrl } from "../../lib/env";
import { fetchCardPrintings, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import {
  defaultFoilForPrinting,
  formatTradeDifference,
  formatTradeVerdict,
  formatUsd,
  normalizeSideName,
  pileTier,
  sideTotal,
  tradeVerdict,
  type PileTier,
  type TradeEntry,
  type TradeSideId
} from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";
import { TradePile, type TradePileTransition } from "./TradePile";
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
  /** The finish explicitly picked alongside `preferredPrintingId` (REQ-065's Nonfoil/Foil
   * pills); `undefined` re-derives the finish from the resolved printing's own prices
   * instead (the scan path, and retry). */
  preferredFoil?: boolean;
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

type PileAnimState = { key: number; transition: TradePileTransition };

const INITIAL_PILE_ANIM: Record<TradeSideId, PileAnimState> = {
  A: { key: 0, transition: "none" },
  B: { key: 0, transition: "none" }
};

/**
 * Two-sided, ephemeral trade balancer (REQ-064, REQ-215, FLOW-009). State lives only in
 * this component: no persistence, no history, no suggestions. Printing choice is a pricing
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
  const [sideNames, setSideNames] = useState<Record<TradeSideId, string>>({ A: "Side A", B: "Side B" });
  const [isNewTradeConfirmOpen, setIsNewTradeConfirmOpen] = useState(false);
  // Look-matching pass (slice O), requirement 5: on phone, one side shows at a
  // time behind a tab pair (`trade-balancer.html:84-93`); both always show on
  // desktop (CSS media query) regardless of this state. Both `TradeSide`
  // instances stay mounted either way, so switching tabs loses no side state.
  const [activeSideTab, setActiveSideTab] = useState<TradeSideId>("A");
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

  // REQ-064: one fire-and-forget warm-up ping alongside the cardMetadata
  // load, so a cold backend wakes while the card list downloads and the
  // player types instead of that wait landing on the first card's price
  // fetch. Result discarded, errors swallowed, no UI, no state — it never
  // blocks or fails search, and mock-default local dev with no backend
  // running is unaffected.
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/health`).catch(() => undefined);
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
  function loadPricingForEntry(
    instanceId: string,
    oracleId: string,
    preferredPrintingId?: string,
    preferredFoil?: boolean
  ): void {
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
          return {
            ...entry,
            printing,
            foil: preferredFoil !== undefined ? preferredFoil : defaultFoilForPrinting(printing)
          };
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
   * printing/finish; the fetch's first printing and its own default finish apply),
   * the printing picker's Nonfoil/Foil pills (REQ-065 — both preferred), and scan
   * (the scanned printing id, DEC-070, no preferred finish). The entry appears
   * immediately with a loading state; pricing arrives asynchronously (FLOW-025). */
  function handleAddByOracle(
    sideId: TradeSideId,
    oracleId: string,
    name: string,
    preferredPrintingId?: string,
    preferredFoil?: boolean
  ): void {
    nextInstanceIdRef.current += 1;
    const instanceId = `${oracleId}-${nextInstanceIdRef.current}`;

    setSideEntries(sideId, (entries) => [
      ...entries,
      {
        instanceId,
        printing: preferredPrintingId ? { ...EMPTY_PRINTING, id: preferredPrintingId } : EMPTY_PRINTING,
        foil: preferredFoil ?? false,
        quantity: 1
      }
    ]);
    setEntryMetaById((current) => ({
      ...current,
      [instanceId]: { oracleId, name, status: "loading", printings: [], preferredPrintingId, preferredFoil }
    }));

    loadPricingForEntry(instanceId, oracleId, preferredPrintingId, preferredFoil);
  }

  function handleRetryPricing(instanceId: string): void {
    const meta = entryMetaById[instanceId];
    if (!meta) return;
    loadPricingForEntry(instanceId, meta.oracleId, meta.preferredPrintingId, meta.preferredFoil);
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

  /** REQ-065: the picker's Nonfoil/Foil pills pass the chosen finish explicitly —
   * no re-derivation, unlike the scan/retry path. */
  function handleChangePrinting(
    sideId: TradeSideId,
    instanceId: string,
    printing: CardPrintingPrice,
    foil: boolean
  ): void {
    setSideEntries(sideId, (entries) =>
      updateEntries(entries, instanceId, (entry) => ({ ...entry, printing, foil }))
    );
  }

  function handleRenameSide(sideId: TradeSideId, name: string): void {
    setSideNames((current) => ({ ...current, [sideId]: normalizeSideName(sideId, name) }));
  }

  // Scan input (REQ-065 scan path): one camera at a time, adding to the side that
  // opened it. The scanned printing is the new entry's default and stays changeable.
  const scan = useTradeScan({ cardMetadata: cardMetadata ?? [], onAddByOracle: handleAddByOracle });

  const totalA = sideTotal(entriesBySide.A);
  const totalB = sideTotal(entriesBySide.B);
  const verdict = tradeVerdict(totalA, totalB);
  const sideName = (side: TradeSideId) => sideNames[side];
  const verdictCopy = formatTradeVerdict(verdict, sideName);
  const differenceCopy = formatTradeDifference(totalA, totalB, sideName);
  const bothSidesEmpty = entriesBySide.A.length === 0 && entriesBySide.B.length === 0;
  // Look-matching pass (slice O), requirement 4: the scale band's own verdict
  // line reads "Add cards to weigh the trade" at $0/$0 — `verdictCopy` above
  // (`tradeVerdict`'s "Even" case) is correct once either side has a card.
  const scaleVerdictCopy = bothSidesEmpty ? "Add cards to weigh the trade" : verdictCopy;
  const countA = entriesBySide.A.reduce((sum, entry) => sum + entry.quantity, 0);
  const countB = entriesBySide.B.reduce((sum, entry) => sum + entry.quantity, 0);
  const countLabel = (count: number) => `${count} card${count === 1 ? "" : "s"}`;

  const tierA: PileTier = pileTier(totalA, totalB);
  const tierB: PileTier = pileTier(totalB, totalA);
  // `.pan[data-heavy]` (the heavier side's glowing total) tracks the same
  // "richer" reading the piles already use — tied at $0 or any other amount
  // reads neither side as heavy, matching `trade-balancer.html`'s own
  // `heavy = ta === tb ? null : ...`.
  const isHeavyA = totalA !== totalB && tierA >= tierB;
  const isHeavyB = totalA !== totalB && tierB >= tierA;

  // REQ-215: a tier-up drops in with a slight overshoot, a tier-down lifts and
  // fades — tracked per side so each pile's SVG re-keys and replays its own
  // transition exactly once, rather than looping idle.
  const [pileAnim, setPileAnim] = useState<Record<TradeSideId, PileAnimState>>(INITIAL_PILE_ANIM);
  const prevTiersRef = useRef<Record<TradeSideId, PileTier>>({ A: tierA, B: tierB });

  useEffect(() => {
    const prev = prevTiersRef.current;
    const nextA = tierA;
    const nextB = tierB;
    if (nextA === prev.A && nextB === prev.B) return;

    setPileAnim((current) => ({
      A:
        nextA === prev.A
          ? current.A
          : { key: current.A.key + 1, transition: nextA > prev.A ? "up" : "down" },
      B:
        nextB === prev.B
          ? current.B
          : { key: current.B.key + 1, transition: nextB > prev.B ? "up" : "down" }
    }));
    prevTiersRef.current = { A: nextA, B: nextB };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierA, tierB]);

  function openNewTradeConfirm(): void {
    if (bothSidesEmpty) return;
    setIsNewTradeConfirmOpen(true);
  }

  function handleConfirmNewTrade(): void {
    setEntriesBySide({ A: [], B: [] });
    setEntryMetaById({});
    // Side names are kept (REQ-215); only the cards clear.
    setIsNewTradeConfirmOpen(false);
  }

  const cardCountAcrossBothSides =
    entriesBySide.A.reduce((sum, entry) => sum + entry.quantity, 0) +
    entriesBySide.B.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalValueAcrossBothSides = totalA + totalB;

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
    onRetryPricing: handleRetryPricing,
    onRenameSide: handleRenameSide
  };

  return (
    <PageShell variant="wide-fit">
      <StagedStepHeader
        rightSlot={
          snapshotCopy ? (
            <p className="text-xs text-zinc-500" aria-label="Price snapshot date (header)">
              {`Prices as of ${snapshotCopy}`}
            </p>
          ) : undefined
        }
      />
      {/* Look-matching pass (slice O): `trade-balancer.html`'s `.tb` — the
          title row, the scale band, the phone side tabs, and the two sides —
          takes the screen's remaining height below the header (`.tb` in
          index.css) and scrolls nowhere itself; only `.tb-entries` below
          does. */}
      <section className="tb">
        <div className="flow-head">
          <h1>Trade Balancer</h1>
          {/* Requirement 3: the price date sits under the title, not inside
              the scale/verdict band — shown here for phone; the header's own
              `rightSlot` above covers desktop (REQ-215's existing dual
              placement, unchanged by this slice). */}
          {snapshotCopy && (
            <p className="asof text-xs text-zinc-500 md:hidden">{`Prices as of ${snapshotCopy}`}</p>
          )}
          <div className="flow-head-tools">
            <button
              type="button"
              aria-label="New trade"
              disabled={bothSidesEmpty}
              onClick={openNewTradeConfirm}
              className="icon-chip"
            >
              <span className="glyph" aria-hidden="true">
                ↺
              </span>
              New trade
            </button>
          </div>
        </div>

        {/* Requirement 4: one scale band — both sides' totals, pile art, and a
            serif verdict line — replacing the old gold-pile verdict panel. */}
        <div className="tb-scale">
          <div className="tb-pan a" data-heavy={isHeavyA ? "true" : "false"}>
            <span className="tb-pan-label">{sideNames.A}</span>
            <span className="tb-pan-total" aria-label="Side A total (scale)">
              {formatUsd(totalA)}
            </span>
            {!bothSidesEmpty && <span className="tb-pan-count">{countLabel(countA)}</span>}
          </div>
          <div className="tb-piles-wrap">
            <div className="tb-piles" aria-hidden="true">
              <TradePile tier={tierA} isRicher={tierA >= tierB} transition={pileAnim.A.transition} animationKey={pileAnim.A.key} />
              <TradePile tier={tierB} isRicher={tierB >= tierA} transition={pileAnim.B.transition} animationKey={pileAnim.B.key} />
            </div>
            <div className="tb-verdict" aria-live="polite">
              <span aria-label="Trade verdict">{scaleVerdictCopy}</span>
              {!bothSidesEmpty && (
                <small aria-label="Trade difference">{differenceCopy}</small>
              )}
            </div>
          </div>
          <div className="tb-pan b" data-heavy={isHeavyB ? "true" : "false"}>
            <span className="tb-pan-label">{sideNames.B}</span>
            <span className="tb-pan-total" aria-label="Side B total (scale)">
              {formatUsd(totalB)}
            </span>
            {!bothSidesEmpty && <span className="tb-pan-count">{countLabel(countB)}</span>}
          </div>
        </div>

        {isMetadataLoading && <p className="text-sm text-zinc-400">Loading card list…</p>}
        {metadataLoadError && (
          <p role="alert" className="text-sm text-amber-200">
            {metadataLoadError}
          </p>
        )}

        {/* Requirement 5: on phone, the two sides sit behind a tab pair; CSS
            hides this row and shows both `TradeSide` columns on desktop. */}
        <div className="tb-side-tabs" role="tablist" aria-label="Trade side">
          <button
            type="button"
            role="tab"
            aria-selected={activeSideTab === "A"}
            onClick={() => setActiveSideTab("A")}
          >
            <span>{sideNames.A}</span>
            <b>{formatUsd(totalA)}</b>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSideTab === "B"}
            onClick={() => setActiveSideTab("B")}
          >
            <span>{sideNames.B}</span>
            <b>{formatUsd(totalB)}</b>
          </button>
        </div>

        <div className="tb-sides">
          <TradeSide
            sideId="A"
            sideName={sideNames.A}
            isActiveOnPhone={activeSideTab === "A"}
            entries={entriesBySide.A}
            {...sideProps}
          />
          <TradeSide
            sideId="B"
            sideName={sideNames.B}
            isActiveOnPhone={activeSideTab === "B"}
            entries={entriesBySide.B}
            {...sideProps}
          />
        </div>
      </section>

      <ConfirmSheet
        isOpen={isNewTradeConfirmOpen}
        onKeep={() => setIsNewTradeConfirmOpen(false)}
        onConfirm={handleConfirmNewTrade}
        question="Start a new trade?"
        detail={`This clears ${cardCountAcrossBothSides} card${cardCountAcrossBothSides === 1 ? "" : "s"} worth ${formatUsd(totalValueAcrossBothSides)} from both sides. Side names are kept.`}
        keepLabel="Keep this trade"
        confirmLabel="↺ Clear both sides"
        testId="new-trade-confirm-sheet"
      />
    </PageShell>
  );
}
