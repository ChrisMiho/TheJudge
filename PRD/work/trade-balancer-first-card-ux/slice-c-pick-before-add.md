# Slice C — Pick the printing before the card is added (search path)

## Status: planned

## Goal

Tapping a search suggestion opens that card's printing list right there —
the card is added with the printing the player taps, not whatever printing
happened to sort first.

## Requirements

1. `TradeSide` gains a `pendingCard` state (`{ oracleId, name }`, or `null`).
   Tapping a suggestion calls `fetchCardPrintings(oracleId)` (already cached
   per session, `lib/trade/fetchCardPrintings.ts`) and sets `pendingCard`,
   which swaps the suggestion list for the printing picker: a
   `Loading printings…` state first, then `PrintingPicker` once the fetch
   resolves.
2. Picking a printing calls the existing seam
   `onAddByOracle(sideId, oracleId, name, printing.id)` — `preferredPrintingId`
   already selects that printing once `TradeBalancer`'s own fetch resolves
   (from cache, so it resolves immediately) — then clears `pendingCard` and
   the search query.
3. Cancel (the picker's existing Cancel button) clears `pendingCard` and
   returns to the search box with the query intact.
4. If the pre-add fetch fails, or resolves to zero printings, `pendingCard`
   clears and the card is added the way it is added today — immediately, in
   the `$0`-plus-caution state with the existing retry affordance (A7).
   Manual search stays the permanent fallback path.
5. The scan path is untouched: `useTradeScan` still calls `handleAddByOracle`
   with the scanned printing id (A11); `TradeBalancer.scan.test.tsx` stays
   green with no edits to `useTradeScan.ts`.
6. Apply the `PRD/sections/trade-balancer/data/cardPrintingPrices.md` block
   from `GATE-QUESTIONS.md`, re-derived against the live file text: the
   `byOracleId` shape gains the newest-first ordering rule (Slice A's
   behavior, already shipped), and the Runtime posture sentence changes from
   "fetched only when that card is added to a side" to the once-per-card,
   cached-per-session wording naming the suggestion-tap timing this slice
   ships and the scan-on-add timing that is unchanged.

## Acceptance criteria

- [ ] C1: Tapping a suggestion shows a loading state, then the printing
      picker in place of the suggestion list — unit/component test.
- [ ] C2: Tapping a printing row adds the card to the side carrying that
      exact printing (not `printings[0]`) — unit/component test.
- [ ] C3: Cancel returns to the search box with the query text intact and no
      card added — unit/component test.
- [ ] C4: A failed or empty pre-add printings fetch adds the card anyway in
      the `$0`-plus-caution state with the retry affordance — unit/component
      test.
- [ ] C5: `TradeBalancer.scan.test.tsx` passes unmodified — the scan path is
      unaffected (A11).
- [ ] C6: `PRD/sections/trade-balancer/data/cardPrintingPrices.md` is amended
      per the `GATE-QUESTIONS.md` block, re-derived against live text.
- [ ] C7 (manual, browser-observable — pick-before-add is a named risk item):
      at 390×844, type a search query, tap a suggestion, observe the picker
      replaces the suggestion list with a loading state then rows; tap a
      printing and observe the entry appears already priced with that
      printing (no intermediate `$0`/loading flash); tap Cancel on a fresh
      search and observe the search box returns with the typed query intact.
- [ ] C8: Browser closed, owned server(s) stopped, ports released; capture
      output path recorded (or `none` if no screenshot was taken), per
      `PRD/instructions/runtime-process-hygiene.md`.

## Verification

```bash
cd apps/frontend && npx vitest run src/components/trade/TradeSide.test.tsx src/components/trade/TradeBalancer.test.tsx src/components/trade/TradeBalancer.scan.test.tsx
```

## Files touched

- `apps/frontend/src/components/trade/TradeSide.tsx`
- `apps/frontend/src/components/trade/TradeSide.test.tsx` (new)
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
