# Slice B — Foil mode auto-selects from the printing's prices

## Status: planned

## Goal

A card's foil toggle opens in whichever mode actually has a price — a
foil-only printing shows its real price on the spot, instead of $0.00 with a
caution triangle.

## Requirements

1. Add a pure helper `defaultFoilForPrinting(printing: CardPrintingPrice): boolean`
   in `apps/frontend/src/lib/trade/pricing.ts` (beside `sideTotal`,
   `difference`, `formatUsd` — A5): returns `false` (non-foil) when `usd` is
   present, `true` (foil) only when `usd` is `null` and `usdFoil` is not,
   and `false` when neither is present (the $0-plus-caution case).
2. Call it every time an entry receives a printing — re-deriving the mode
   from scratch, never carrying the entry's current toggle forward (the
   owner's gate edit on `REQ-065`):
   - `loadPricingForEntry` in `TradeBalancer.tsx`, once the fetch resolves
     and `selectPrinting` picks the printing (covers scan-add and, after
     Slice C, pick-before-add's own resolution path).
   - `handleChangePrinting` in `TradeBalancer.tsx`.
   - `handleRetryPricing`'s resolution path (same code path as
     `loadPricingForEntry`).
3. A brand-new entry still starts non-foil (`foil: false` at add time, before
   any printing is known) — unchanged.
4. No `GATE-QUESTIONS.md` block is applied in this slice. Every block that
   describes the foil rule also describes pick-before-add and/or the picker
   box (not yet shipped); GAMEPLAN's sequencing table defers all of them to
   Slice C, D, or E, where they become fully accurate.

## Acceptance criteria

- [ ] B1: `defaultFoilForPrinting` returns `false` when `usd` is present,
      regardless of `usdFoil` — unit test.
- [ ] B2: `defaultFoilForPrinting` returns `true` only when `usd` is `null`
      and `usdFoil` is present — unit test.
- [ ] B3: `defaultFoilForPrinting` returns `false` when neither price is
      present — unit test.
- [ ] B4: A player who manually toggles foil, then changes to a printing
      with a non-foil price, lands back on non-foil — the toggle is never
      carried over — unit test on `handleChangePrinting`'s resolution path.
- [ ] B5: `TradeBalancer.scan.test.tsx` stays green — the scan path's default
      foil mode now comes from the same helper with no behavior change for a
      non-foil-priced scan (A11).
- [ ] B6 (manual, browser-observable — foil auto-select is a named risk item
      per `runtime-process-hygiene.md`): at 390×844, search and add a card
      known to have a foil-only printing in the corpus; observe the entry's
      foil toggle opens pressed (`aria-pressed="true"`) and shows the real
      `usdFoil` price, not $0.00 with the caution triangle. Then use "Change
      printing" to switch to a non-foil-priced printing of the same card and
      observe the toggle switches back to non-foil unprompted.
- [ ] B7: Browser closed, owned server(s) stopped, ports released; capture
      output path recorded (or `none` if no screenshot was taken), per
      `PRD/instructions/runtime-process-hygiene.md`.

## Verification

```bash
cd apps/frontend && npx vitest run src/lib/trade/pricing.test.ts src/components/trade/TradeBalancer.test.tsx src/components/trade/TradeBalancer.scan.test.tsx
```

## Files touched

- `apps/frontend/src/lib/trade/pricing.ts`
- `apps/frontend/src/lib/trade/pricing.test.ts`
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
