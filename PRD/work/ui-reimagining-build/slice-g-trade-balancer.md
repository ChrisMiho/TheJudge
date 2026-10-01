# Slice G — Trade Balancer: piles, verdict, New trade, rename, picker pills

## Status: done

## Goal

Trade Balancer weighs two piles of gold with relative tiers and a verdict
line ("Fair trade" … "Lopsided — … by NN%", "Even"), the dollar difference
beneath. ↺ New trade asks first through the shared confirm sheet; a side is
renamed by tapping its name. The printing picker moves into the shared sheet
with a Nonfoil and a Foil price pill per printing.

## Dependencies

Slice A (frame, tokens), slice B (shared sheet, confirm sheet — New trade
and the printing picker both consume it).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-215 — two piles of gold with relative tiers, a verdict line, the
   dollar difference beneath; ↺ New trade through the confirm sheet; a side
   renamed by tapping its name (both new — verified absent today).
2. REQ-064 — the difference gets a verdict ("Fair trade" / "Lopsided — …
   by NN%" / "Even") and the New trade control.
3. REQ-065 — the printing picker (moved into the shared sheet) shows a
   Nonfoil and a Foil price pill per printing; the set filter appears past
   five printings.
4. FLOW-009 — piles and verdict update live as cards are added or removed.

Phone tabs (REQ-204) stand as written — no change in this slice. The whole
screen fits 390×844 and 1440×900; the price date moves to the header on
desktop.

## Files touched

- `apps/frontend/src/components/trade/TradeBalancer.tsx` (+ `.test.tsx`,
  `.scan.test.tsx`) — piles, verdict line, dollar difference, live update.
- `apps/frontend/src/components/trade/TradeSide.tsx` (+ `.test.tsx`) — tap
  name to rename (`:60` fixes the label today).
- `apps/frontend/src/components/trade/TradeEntryRow.tsx` — relative tier
  presentation within a pile.
- `apps/frontend/src/components/trade/PrintingPicker.tsx` (+ `.test.tsx`) —
  rehosted on `SheetShell` (slice B); Nonfoil/Foil price pills; set filter
  past five printings.
- New trade confirm wiring onto `ConfirmSheet` (slice B).
- `PRD/sections/trade-balancer/README.md`,
  `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md`
  — apply REQ-215, REQ-064, REQ-065, FLOW-009 by intent.

## Tests

- `TradeBalancer.test.tsx` — verdict line thresholds (Fair/Lopsided/Even),
  dollar difference, live update on add/remove.
- `TradeSide.test.tsx` — rename by tapping the name.
- `PrintingPicker.test.tsx` — Nonfoil/Foil pills, set filter threshold.

## Acceptance criteria

- [x] G1. `npm run quality:check` passes.
- [x] G2. `npm --workspace apps/frontend run test` passes.
- [x] G3. Each pile shows relative tiers; the verdict line reads "Fair
      trade", "Lopsided — … by NN%", or "Even" as the dollar difference
      crosses the documented thresholds; the difference is shown beneath.
- [x] G4. ↺ New trade opens the shared confirm sheet before clearing either
      side.
- [x] G5. Tapping a side's name renames it in place.
- [x] G6. The printing picker (inside the shared sheet) shows a Nonfoil and
      a Foil price pill per printing, and a set filter once more than five
      printings are listed.
- [x] G7. Verdict and piles update live as a card is added or removed,
      without a manual refresh.
- [x] G8. `PRD/sections/` carries REQ-215, REQ-064, REQ-065, FLOW-009 by
      intent.
- [x] G9 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice (it reuses `SheetShell`/`ConfirmSheet` from slice B but touches
      no shared token/stylesheet file directly) — captured at 390×844 and
      1440×900 to confirm no regression, saved to
      `docs/design/ui-reimagining/build-screenshots/g/`.
- [x] G10 (manual). Browser scenarios at 390×844 and 1440×900: the whole
      screen fits without horizontal scroll at both widths; the price date
      moves to the header on desktop.
- [x] G11 (manual). Cleanup evidence recorded: browser closed, owned
      servers stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
