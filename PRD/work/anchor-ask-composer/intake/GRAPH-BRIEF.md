# Graph-run brief — Anchor the question box so the stage doesn't slide

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

When you type a question longer than one line — in Quick lookup or In-depth —
the card stage stays on screen and the question box stays put. The box grows
**upward in place** over a stage that shrinks/scrolls to make room, instead of
the whole page sliding so the cards leave the screen and the send button drops
below the fold. The In-depth chip and the mic|send pill stay visible on a stable
bottom row the entire time. Same behavior on desktop and mobile.

## Why (measured — do not re-derive)

Reproduced live (Playwright) on 2026-10-03, box filled to the 300-char cap.
Screens in `PRD/work/probe-composer-growth-space/.playwright-mcp/`.

| Surface | Window | Page height when grown | Result |
| --- | --- | --- | --- |
| Quick lookup | 1440×716 | 784px (> 716) | page scrolls; caret-follow pushes the card stage off-screen, send controls fall below the fold mid-type |
| Quick lookup | 390×740 (mobile) | 783px (> 740) | same overflow + auto-scroll; card stage leaves the screen |

Root cause is **page layout, not the textarea** (the textarea already caps at
`max-height: 176px` and scrolls internally):
- The composer sits **below the card stage in normal document flow**, top-anchored
  in a grid (`.qq` for Quick, `.idq` for In-depth) inside a `<main>` flex column
  that is **allowed to grow taller than the viewport** (`overflow: visible`, no
  `100dvh` cap). So growing the box lengthens the page; the browser auto-scrolls
  to the caret and shoves the stage out. The composer is `position: relative`,
  **not pinned**.

**This violates existing product truth.** `PRD/sections/quick-lookup/README.md`
already requires the box grow "up to the space available before bottom chrome,
**capped so the page itself never scrolls from field growth**" (REQ-110,
REQ-121, DEC-146, DEC-131) and that "the send pill stays in the first viewport"
(REQ-129/REQ-141/REQ-167, lines 348-353). The implementation does not honor
either. So this is largely a **conformance fix** plus a layout refinement.

## Decisions already made — do not re-litigate

- **Anchored chat layout** (owner chose this over a lighter composer-only pin or
  just taming growth). Give the Ask screen a screen-height frame: card stage takes
  the flexible middle and shrinks/scrolls; the question box stays pinned at the
  bottom and grows upward in place up to a cap, then scrolls internally.
- **Controls stay visible; text doesn't yank the page up** (owner chose this over
  keeping today's reshape untouched). Keep the In-depth chip + mic|send on a
  stable bottom row of the box; the text grows above them without the page moving.
  Smooth the one-line → multi-line transition so it reads as the box expanding in
  place, not the question leaping over the UI.
- **Reuse the existing fit pattern, don't invent one.** Trade Balancer already
  ships this exact no-page-scroll frame (`.page-shell-fit` / `.page-content-wide-fit`,
  `index.css:289-336`), and its review already handled the 1440px
  `overflow: hidden` clipping gotcha. Apply that pattern; don't write a parallel one.

## Design direction (converged)

- Put both Ask screens in a `100dvh` flex-column frame (reuse `page-shell-fit` +
  a content-fit child). Header, mock banner, title/actions row, and the flow head
  take natural height; the **card stage region flexes (`flex: 1; min-height: 0`)
  and scrolls/shrinks**; the **composer takes natural height at the bottom** and
  is the pinned anchor.
- One shared change covers everything: both surfaces render the same
  `ComposerPill` (`apps/frontend/src/components/ComposerPill.tsx`) and share
  `flow.css` `.q-box`. The frame goes on the two page columns:
  - Quick lookup: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
    `<section className="qq">` (line 590), styled at `index.css:227`.
  - In-depth: `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
    `<section className="idq">` (line 879) / `.idq-step`, composer at
    `EnrichmentStep.tsx:911`.
- `ComposerPill` structure stays. The two-row grown shape lives at
  `flow.css:204-207` (`flex: 1 0 100%; order: -1`) with the `grown` toggle at
  `ComposerPill.tsx:90-101`; growth cap at `useAutoGrowTextarea.ts:76-79` +
  `flow.css:211`. With the page no longer scrolling, the grown reshape now happens
  in place — refinement decides whether to soften the 1→2-line reorder further.
- **Mobile keyboard:** the pinned composer must stay above the on-screen keyboard.
  Prefer `dvh` units (already used elsewhere) and account for `visualViewport` so
  the box isn't hidden behind the keyboard when focused.

## Current-state PRD truth to amend

Name the files; do not edit them here (refinement/graph-kickoff own that write).

- `PRD/sections/quick-lookup/README.md` — reconcile the growth behavior with
  REQ-110 / REQ-121 (page never scrolls from field growth) and the "send pill
  stays in the first viewport" intent (REQ-129/REQ-141/REQ-167): state the
  anchored-frame behavior as built. Review REQ-206's two-row wording (lines
  106-111) against the owner's "don't yank text up" decision.
- `PRD/sections/in-depth/README.md` — apply the same anchored Ask-screen frame
  to the In-depth composer surface.
- `PRD/sections/screen-layout.md` — if it codifies region-scroll / viewport-fit
  rules, add the Ask screens to them (Trade Balancer is likely already there).

## Constraints (don't rediscover)

- **NFR-001 44px touch targets** are already enforced for the composer controls
  (`index.css:232-250`) — keep them.
- **Reuse `page-shell-fit`; don't re-add `overflow: hidden` on the inner column**
  at 1440px — the Trade Balancer review found that clips because the column is
  narrower than the viewport (`index.css:306-314` comment). Follow that precedent.
- **Mock-default is unaffected** (frontend-only layout change).
- Keep working: the search-open behavior that folds the card stage into a strip
  on a phone (`flow.css` `@media`, stage hidden while searching), the card detail
  panel, and the **answered-view follow-up composer** (`FollowUpComposer.tsx`,
  same `ComposerPill` with `.followup`) — verify all three after the frame change.

## Evidence + reusable tooling

Full findings and live repro: `PRD/work/probe-composer-growth-space/`
(`FINDINGS-repro.md` + `.playwright-mcp/` screenshots). Re-run by typing a
300-char question in Quick lookup at 1440×716 and 390×740 and watching the page
height exceed the viewport.

## What the graph run should produce

A DESIGN-BRIEF for anchoring both Ask screens (Quick + In-depth) in the existing
`100dvh` no-page-scroll frame so the composer pins and the card stage flexes; the
REQ amendments above (conformance to REQ-110/121 + the anchored-frame behavior,
the In-depth parity, and the REQ-206 two-row reconciliation); and slices that
apply the frame, verify no page scroll on desktop and mobile, keep the composer
above the mobile keyboard, and confirm search-fold / detail-panel / follow-up
composer still work. The layout approach and the two-row decision are already
settled above — do not reopen them.

## How to hand this off

/graph-kickoff "Anchor the Quick + In-depth question box so typing a long question grows it in place instead of scrolling the card stage off-screen" PRD/work/probe-composer-growth-space/GRAPH-BRIEF.md
