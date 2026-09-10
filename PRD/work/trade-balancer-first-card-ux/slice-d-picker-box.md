# Slice D — Printing picker becomes a scrollable, filterable box

## Status: planned

## Goal

A long printing list (Sol Ring: 128 rows) stays inside a short scrollable box
with a set filter, instead of unrolling the page to ten thousand pixels and
pushing Side B off the bottom.

## Requirements

1. `PrintingPicker` gains an `N printings` count in its header, computed from
   the list it already has — no artifact or index field is added (A2).
2. The printing list region-scrolls, capped at about `40vh` and about five to
   six rows, instead of growing the page with the card's printing count.
3. Row images get `loading="lazy"` (they are already derived from the
   printing id — no new fetch).
4. A set-name/set-code filter input appears above the list when a card has
   more than eight printings.
5. The row carrying `aria-current` (the entry's current printing, when
   re-picking via "Change printing") scrolls into view when the picker opens.
6. Apply `PRD/sections/screen-layout.md` — the Trade Balancer's `Fit` row
   gains "and the printing picker" to its region-scroll clause, and a new
   `Printing picker` row records the scroll cap, lazy images, filter
   threshold, and the corpus's measured bounds (Sol Ring 128, corpus max 771)
   — per `GATE-QUESTIONS.md`'s `screen-layout.md` block, re-derived against
   live text.
7. Apply `REQ-065` from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md`, re-derived against live text
   with the owner's gate edit applied to the foil bullet (non-foil when
   `usd` exists, foil only when `usd` is null and `usd_foil` is not — no
   "current mode is kept" clause; Slice B already ships this behavior). This
   block also carries REQ-175's fetch-timing line (`functional-requirements.md:4052`,
   "on add" → once-per-card, cached-per-session — Slice C already ships the
   suggestion-tap timing this describes).

## Acceptance criteria

- [ ] D1: The picker's header shows the printing count (`N printings`) —
      unit/component test.
- [ ] D2: The printing list is contained in a scroll region (not a plain
      `<ul>` that grows the page) — unit/component test asserting the
      scroll-container class/style, or a rendered-height assertion.
- [ ] D3: Row `<img>` elements carry `loading="lazy"`.
- [ ] D4: The set filter input is absent for a card with eight or fewer
      printings and present for one with more than eight — unit/component
      test.
- [ ] D5: Typing in the filter narrows the visible rows to those matching set
      name or set code — unit/component test.
- [ ] D6: The row matching `selectedPrintingId` receives `aria-current` and
      the picker calls `scrollIntoView` on it when it opens — unit/component
      test (mock `scrollIntoView`, since jsdom has no layout).
- [ ] D7: `PRD/sections/screen-layout.md` is amended per the
      `GATE-QUESTIONS.md` block, re-derived against live text.
- [ ] D8: `PRD/sections/functional-requirements.md`'s `REQ-065` is amended
      per the `GATE-QUESTIONS.md` block (owner's foil-rule edit applied), and
      REQ-175's fetch-timing line is corrected, re-derived against live text.
- [ ] D9 (manual, browser-observable — the picker box is the primary named
      risk item): at 390×844, open the picker for a card with 128+ printings
      (Sol Ring or an equivalent fixture); observe the page does not grow
      past the viewport, the picker itself scrolls, Side B's totals stay
      reachable without page-scrolling, and the picker's own scroll height is
      at or under roughly `40vh`. Observe the set filter appears and narrows
      rows when typed into. Observe row images load lazily (not all 128
      requested on open — check the network panel or `loading` attribute).
- [ ] D10: Browser closed, owned server(s) stopped, ports released; capture
      output path recorded (or `none` if no screenshot was taken), per
      `PRD/instructions/runtime-process-hygiene.md`.

## Verification

```bash
cd apps/frontend && npx vitest run src/components/trade/PrintingPicker.test.tsx
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/trade/PrintingPicker.tsx`
- `apps/frontend/src/components/trade/PrintingPicker.test.tsx` (new)
- `PRD/sections/screen-layout.md`
- `PRD/sections/functional-requirements.md` (`REQ-065`)
