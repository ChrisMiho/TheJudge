import type { CardPrintingPrice } from "./loadCardPrices";

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
