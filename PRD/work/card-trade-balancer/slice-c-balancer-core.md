# Slice C — Trade balancer core: state, pricing engine, manual entry

## Status: done

## Dependencies

Depends on **Slice A** (price loader `loadCardPrices`) and the **`feature-portal`** package (its destination registry + Trade Balancer mount slot; DEC-095, REQ-067 — a cross-package prerequisite, ships first). Wave 2.

## Goal

Build the two-sided Trade Balancer view with a pure pricing engine, manual-search input with a printing picker, per-entry foil/quantity/remove, and live per-side totals + difference. (REQ-064, REQ-065 manual path, FLOW-009, DEC-087)

## Requirements

1. New `apps/frontend/src/lib/trade/pricing.ts` (pure): `TradeEntry = { instanceId, printing, foil, quantity }` where `printing` is a `PrintingPrice` (id, oracleId, name, set, collectorNumber, imageUrl, usd, usdFoil). Selectors:
   - `entryUnitPrice(entry)` → `foil ? usdFoil : usd` (may be `null`).
   - `entryHasMissingPrice(entry)` → selected-mode price is `null`/absent.
   - `entryContribution(entry)` → `(entryUnitPrice ?? 0) × quantity`.
   - `sideTotal(entries)` → `Σ entryContribution`.
   - `difference(totalA, totalB)` → `{ amount: |A−B|, higher: 'A' | 'B' | 'equal' }`.
2. New `apps/frontend/src/components/trade/TradeBalancer.tsx` mounts in the `feature-portal` Trade Balancer destination slot: two sides (**Side A**, **Side B**), each an ordered `TradeEntry[]` in component state; each side shows its running total; the view shows the difference (amount + which side is higher, or equal). Totals/difference update live on add, remove, foil toggle, and quantity change. Ephemeral: no persistence, no history, no suggestions.
3. On first open, lazy-load prices via `loadCardPrices` (Slice A). While loading, show a lightweight loading state; on load failure surface the reason and let entries render with the $0 + caution treatment rather than a broken screen (FLOW-009 edge case). The view may display `snapshotDate` ("prices as of …").
4. **Manual-search input** (`TradeSide` / picker): reuse `search.ts` to find a card by name, then `PrintingPicker` lists that card's printings via `listPrintingsForOracle(oracleId)`; the user chooses a printing before the entry is added, and that printing's price applies. Duplicates allowed (repeated adds and/or a per-entry quantity ≥ 1); the stack duplicate-block and 10-card cap do **not** apply.
5. Per-entry controls (`TradeEntryRow.tsx`): foil toggle (default non-foil), quantity control (≥ 1), remove. **Missing price** for the selected mode → entry contributes $0, price rendered in a distinct color, and a caution-triangle indicator shown. A `PrintingPicker`-backed "change printing" control on an existing entry re-prices it (shared with Slice D's scan default).
6. Printing selection is pricing/display only: no prompt context, rulings, or request-payload change; DEC-053 oracle-level identity unchanged. Mobile-first, touch-friendly (NFR-001). USD only.

## Acceptance criteria

- [x] `sideTotal` computes `Σ qty × (foil ? usdFoil : usd)`; a foil entry with `usdFoil: null` contributes $0 and is `entryHasMissingPrice === true` (unit tests in `pricing.test.ts`).
- [x] `difference` returns the absolute amount and the higher side, and `'equal'` on a tie (unit test).
- [x] Manual search → choose a printing → add appends an entry to the chosen side; adding the same card twice yields two entries (or an incremented quantity) and both count toward the total (component test).
- [x] Toggling foil, changing quantity, and removing an entry each update that side's total and the difference live (component test).
- [x] An entry whose selected-mode price is null renders the distinct color + caution triangle and contributes $0 (component test).
- [x] Changing an entry's printing re-prices it and updates the total (component test).
- [x] A simulated price-artifact load failure surfaces the reason and does not crash the view (component test with rejected `loadCardPrices`).

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/trade/pricing.test.ts
npm --workspace apps/frontend run test -- src/components/trade/TradeBalancer.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/trade/pricing.ts` (new)
- `apps/frontend/src/lib/trade/pricing.test.ts` (new)
- `apps/frontend/src/components/trade/TradeBalancer.tsx` (new)
- `apps/frontend/src/components/trade/TradeSide.tsx` (new)
- `apps/frontend/src/components/trade/TradeEntryRow.tsx` (new)
- `apps/frontend/src/components/trade/PrintingPicker.tsx` (new)
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx` (new)
- Register `TradeBalancer` as the Trade Balancer destination in the `feature-portal` registry (the portal owns the `App.tsx` mount + mode switch; no nav chrome built here)
</content>
