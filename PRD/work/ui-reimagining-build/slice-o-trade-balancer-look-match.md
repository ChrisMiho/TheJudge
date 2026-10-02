# Slice O — Trade Balancer takes the look

## Status: done

## Goal

Trade Balancer fits one screen instead of scrolling 2,900px on a phone. A
single scale band shows both sides' totals and piles, with a serif verdict
line underneath. On phone, the two sides sit behind a tab pair instead of
stacking; rows shrink to one line each. The printing picker gets an
art-crop hero and price pills.

Behaviour does not change in this slice. Slice G already built the piles,
verdict, New trade, rename and picker; this slice restyles what G built to
match the mockup pixel values below, inside the frame slice L just landed.

## Dependencies

Slice L (frame — the header and shared sheet this screen's printing picker
uses) and slice G (piles, verdict, New trade, rename, picker — restyled
here, both `done`).

## Mockup source

`docs/design/ui-reimagining/direction-1/trade-balancer.html`.

## LOOK-GAPS.md section closed

`## Trade Balancer` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:172-205`).

## Requirements

No new `GATE-QUESTIONS.md` id beyond what slice G already applied (REQ-215,
REQ-064, REQ-065, FLOW-009) — presentation only, except where the owner
question below says otherwise.

1. Fit to viewport: `trade-balancer.html:16` `.tb` (`height: calc(100dvh -
   var(--chrome, 100px) - 0.6rem)`, with the desktop and phone footer
   buffers at `:16-20`). The page stops scrolling.
2. Title: an `h1` "Trade Balancer" plus a "↺ New trade" chip, replacing the
   gradient "TRADE BALANCER" eyebrow and the small grey New trade button.
3. Prices date: `trade-balancer.html:23` `.asof`, placed under the title
   ("Prices as of <date> · USD"), not inside the verdict panel.
4. Scale band: `:30-42` `.scale`, `.pan`, `.total`, `.count` (Side A/B
   labels, totals at 1.35rem/700 glowing accent-soft when heavier, "N
   cards"), with `:51-52` piles (SVG hoards, a gem and cup) and `:65-67`
   `.verdict` (serif italic, Georgia, "Leans toward Side A" / "Lopsided —
   Side A by N%" with the difference in small sans beneath), plus `:69-80`
   desktop/narrow variants. Replaces the build's gold-pile-icon verdict
   panel.
5. Side tabs on phone: `:84-93` `.side-tabs`/`.sides` (one side shown at a
   time behind a "Side A $X | Side B $Y" tab pair on phone; both columns on
   desktop, per the existing two-column desktop layout G built).
6. Side foot: a "Side A total $X" foot bar per side, replacing the absence
   of one today.
7. Rows shrink to one line (~80px): thumbnail, name, "set · code · Change"
   (Change as an inline accent link, not a separate button), unit price on
   the right, then Foil / −1+ / ✕ on the same row.
8. ＋ Add card / ▣ Scan become the `icon-chip` pair (slice M's shared
   component) in the side's head row, replacing the full-width "ADD A
   CARD" label, search field and Scan button stacked inside each side.
9. Printing picker: an art-crop hero with the name and cost, "Tap a price
   to use that printing and finish.", then price-pill rows (the
   `.detail-panel` shape slice L already restyled for card detail),
   replacing the separate Nonfoil/Foil buttons with no art.

## Files touched

- `apps/frontend/src/components/trade/TradeBalancer.tsx` (+ `.test.tsx`,
  `.scan.test.tsx`) — fit-to-viewport, title/New-trade chip, scale band,
  side tabs on phone.
- `apps/frontend/src/components/trade/TradeSide.tsx` (+ `.test.tsx`) — side
  head row (icon-chip Add/Scan), side foot total.
- `apps/frontend/src/components/trade/TradeEntryRow.tsx` — one-line row
  layout, inline Change link.
- `apps/frontend/src/components/trade/TradePile.tsx` — SVG hoard
  presentation for the scale's piles.
- `apps/frontend/src/components/trade/PrintingPicker.tsx` (+ `.test.tsx`) —
  art-crop hero, price-pill rows (reuses slice L's `.detail-panel` shell).

## Tests

- `TradeBalancer.test.tsx`, `TradeSide.test.tsx`, `PrintingPicker.test.tsx`
  — updated for the new markup/classes. The same-printing-twice behaviour
  (see the owner question below) is asserted explicitly, whichever reading
  this slice ships.

## Owner questions — the build follows the accepted requirement until answered

Carried verbatim from LOOK-GAPS.md's `## Trade Balancer`
`### Conflicts with accepted requirements`:

- "The same card added twice. The mockup shows one row with a quantity
  ('Birds of Paradise ×2'). The build adds a second, separate row each time
  the same printing is picked. Should picking an identical printing raise
  that row's quantity, as the mockup shows, or stay as separate rows, as
  today?" Until answered, this slice keeps today's behaviour — picking an
  identical printing adds a second, separate row — and applies only the
  mockup's row styling to each row.

## Acceptance criteria

- [x] O1. `npm run quality:check` passes.
- [x] O2. `npm --workspace apps/frontend run test` passes.
- [x] O3. The page fits the viewport with no page scroll at 390×844 and
      1440×900, in `TradeBalancer.tsx`.
- [x] O4. A single scale band shows both sides' totals, pile art and a
      serif verdict line, replacing the gold-pile verdict panel, in
      `TradeBalancer.tsx` and `TradePile.tsx`.
- [x] O5. On phone, the two sides sit behind a "Side A $X | Side B $Y" tab
      pair; both show on desktop, in `TradeBalancer.tsx`.
- [x] O6. Each card row renders as one ~80px line (thumbnail, name,
      set/code/Change link, price, Foil/stepper/✕), in `TradeEntryRow.tsx`.
- [x] O7. The printing picker shows an art-crop hero and price-pill rows,
      in `PrintingPicker.tsx`.
- [x] O8 (manual). Side-by-side pairs saved under
      `docs/design/ui-reimagining/build-screenshots/o/`, build next to
      mockup, Blue, at 390×844 and 1440×900: the default trade
      (`trade-balancer-build-*.png`, `trade-balancer-mockup-*.png`) and the
      printing picker open (`trade-balancer-printing-build-*.png`,
      `trade-balancer-printing-mockup-*.png`) — 8 files, matching
      LOOK-GAPS.md's Trade Balancer pairs list.
- [x] O9 (manual). Each pair in O8 was compared side by side against the
      build at the matching state; every `### Differences` bullet under
      LOOK-GAPS.md's `## Trade Balancer` is closed, or is the owner
      question above (never resolved past the stated interim reading).
- [x] O10 (manual). Browser scenario at 390×844 and 1440×900: add cards to
      both sides until the page would have scrolled under the old layout,
      confirm it still fits; on phone, switch the side tabs; open the
      printing picker and confirm the art-crop hero and price pills render.
- [x] O11 (manual). Cleanup evidence recorded: browser closed, owned dev
      server(s) stopped, ports released, disposable captures under
      `PRD/work/ui-reimagining-build/.playwright-mcp/` named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
