import type { CardPrintingPrice } from "./fetchCardPrintings";

export type TradeSideId = "A" | "B";

/**
 * One card on one side of a trade. `printing` is a pricing/display concern only —
 * printing identity is never pushed into prompt context, rulings, or any request
 * payload (DEC-053 oracle-level identity is unchanged).
 */
export interface TradeEntry {
  instanceId: string;
  printing: CardPrintingPrice;
  foil: boolean;
  quantity: number;
}

export interface TradeDifference {
  amount: number;
  higher: TradeSideId | "equal";
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** The USD price for the entry's selected mode; `null` when the source has no price. */
export function entryUnitPrice(entry: TradeEntry): number | null {
  const price = entry.foil ? entry.printing.usdFoil : entry.printing.usd;
  return typeof price === "number" ? price : null;
}

/** True when the selected mode (foil / non-foil) has no USD price. */
export function entryHasMissingPrice(entry: TradeEntry): boolean {
  return entryUnitPrice(entry) === null;
}

/** `qty × unit price`; a missing price contributes `$0`. */
export function entryContribution(entry: TradeEntry): number {
  return roundToCents((entryUnitPrice(entry) ?? 0) * entry.quantity);
}

/** `Σ qty × (foil ? usdFoil : usd)` across a side's entries. */
export function sideTotal(entries: TradeEntry[]): number {
  return roundToCents(
    entries.reduce((total, entry) => total + entryContribution(entry), 0)
  );
}

/** Absolute gap between the two sides plus which side is higher. */
export function difference(totalA: number, totalB: number): TradeDifference {
  const amount = roundToCents(Math.abs(totalA - totalB));

  if (amount === 0) {
    return { amount: 0, higher: "equal" };
  }

  return { amount, higher: totalA > totalB ? "A" : "B" };
}

/** USD-only display formatting (NFR-013 / DEC-087: no other currencies). */
export function formatUsd(amount: number): string {
  return `$${roundToCents(amount).toFixed(2)}`;
}

export type PileTier = 1 | 2 | 3 | 4 | 5;

/** REQ-215: a pile's relative tier, 1-5. The richer side (or either, when the
 * two totals tie) is always tier 5; the lighter side's tier is its share of
 * the richer: 95%+ -> 5, 75%+ -> 4, 50%+ -> 3, 25%+ -> 2, under -> 1. Two
 * empty sides both read tier 1 — callers show the empty-ground state instead
 * of a pile at all once `sideTotal` is 0 on both sides. */
export function pileTier(ownTotal: number, otherTotal: number): PileTier {
  const richer = Math.max(ownTotal, otherTotal);
  if (richer === 0) return 1;
  if (ownTotal >= richer) return 5;

  const share = ownTotal / richer;
  if (share >= 0.95) return 5;
  if (share >= 0.75) return 4;
  if (share >= 0.5) return 3;
  if (share >= 0.25) return 2;
  return 1;
}

export type TradeVerdict =
  | { kind: "even" }
  | { kind: "fair" }
  | { kind: "slightly-favors" | "leans-toward"; side: TradeSideId }
  | { kind: "lopsided"; side: TradeSideId; percent: number };

/** REQ-215/REQ-064: the verdict line, by the smaller side's share of the
 * larger — a different threshold set from `pileTier`'s (95/85/60, not
 * 95/75/50/25), because the verdict reads coarser than the five pile tiers.
 * "Even" only when the totals tie to the cent; `percent` in the lopsided case
 * is how far behind the smaller side is (100 - its share), rounded. */
export function tradeVerdict(totalA: number, totalB: number): TradeVerdict {
  const gap = difference(totalA, totalB);
  if (gap.higher === "equal") return { kind: "even" };

  const richer = Math.max(totalA, totalB);
  const lighter = Math.min(totalA, totalB);
  const share = lighter / richer;
  const side = gap.higher;

  if (share >= 0.95) return { kind: "fair" };
  if (share >= 0.85) return { kind: "slightly-favors", side };
  if (share >= 0.6) return { kind: "leans-toward", side };
  return { kind: "lopsided", side, percent: Math.round((1 - share) * 100) };
}

/** REQ-215: renders a verdict + `sideName` pair into the exact approved copy. */
export function formatTradeVerdict(verdict: TradeVerdict, sideName: (side: TradeSideId) => string): string {
  switch (verdict.kind) {
    case "even":
      return "Even";
    case "fair":
      return "Fair trade";
    case "slightly-favors":
      return `Slightly favors ${sideName(verdict.side)}`;
    case "leans-toward":
      return `Leans toward ${sideName(verdict.side)}`;
    case "lopsided":
      return `Lopsided — ${sideName(verdict.side)} by ${verdict.percent}%`;
  }
}

/** REQ-215: the plain dollar difference line beneath the verdict, e.g. "Side A +$1.85". */
export function formatTradeDifference(
  totalA: number,
  totalB: number,
  sideName: (side: TradeSideId) => string
): string {
  const gap = difference(totalA, totalB);
  if (gap.higher === "equal") return `${sideName("A")} and ${sideName("B")} are even`;
  return `${sideName(gap.higher)} +${formatUsd(gap.amount)}`;
}

/** REQ-215: a side's name, trimmed to 1-20 characters; blank restores the default
 * "Side A"/"Side B". Side names are ephemeral — never persisted. */
export function normalizeSideName(sideId: TradeSideId, rawName: string): string {
  const trimmed = rawName.trim().slice(0, 20);
  return trimmed.length > 0 ? trimmed : `Side ${sideId}`;
}

/**
 * REQ-065 (owner's gate edit): whenever an entry receives a printing — picked
 * before an add, resolved from a scan, changed, or re-fetched on retry — the
 * foil mode is re-derived from that printing's own prices, never carried over
 * from the entry's current toggle. Non-foil when `usd` is present; foil only
 * when `usd` is `null` and `usdFoil` is not; non-foil (the $0-plus-caution
 * case) when neither price is present.
 */
export function defaultFoilForPrinting(printing: CardPrintingPrice): boolean {
  if (printing.usd !== null) return false;
  return printing.usdFoil !== null;
}
