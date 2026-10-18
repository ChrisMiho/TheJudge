# Graph-run brief — Every card keeps its ring

Self-contained intake for `graph-kickoff`. Measured by the 2026-10-17 code health
probe; refinement can go straight to a DESIGN-BRIEF.

## What the player gets

Every card picture carries its colour-identity ring, in its real colour, and the
theme never draws on a card's edge — the owner's standing rule: the theme owns the
glow behind a card, never its edge. Today four surfaces break it.

## Why (measured — do not re-derive)

1. **Wrong ring.** `apps/frontend/src/components/trade/PrintingPicker.tsx:124` always
   passes `getCardIdentityRingStyle(undefined)`, so every printing of a red or green
   card shows the silver colourless ring, while the same card's trade row shows its
   real colour (`TradeEntryRow.tsx:75-76`). The colours are available to the caller
   as `meta?.colors` (`TradeEntryRow.tsx:179`, `TradeSide.tsx:323`). Verified by the
   driver.
2. **No ring.**
   - Quick Question's search-result thumbnail `<span className="thumb">`
     (`portal/quick-lookup/QuickLookupApp.tsx:81-87`); its chat-card thumbnails on the
     same page do carry the ring (`:626-627`).
   - In-Depth's selected-card preview: `CardPresentation.tsx:304-320` (used via
     `CardSelectionPreview.tsx:31`) renders the image with no `card-identity-ring`.
3. **Theme on the edge.** `.shelf .card.dragging` uses `box-shadow: var(--idq-shadow-9)`
   (`index.css:1593-1597`), defined as `0 22px 40px -14px #000, 0 0 0 2px
   var(--accent-soft)` (`lib/theme/glows.css:31`) — a solid 2 px theme-coloured band
   around the dragged card's edge.
4. **Ring width silently overridden.** `styles/flow.css:338-346` draws the ring at
   `padding: var(--ring-w, 1px)` and `flow.css:87` sets `--ring-w: 2px` for the front
   carousel card, but `index.css:2636-2641` re-declares `.card-identity-ring::before`
   with `padding: 1px`, and `index.css` loads last (`main.tsx:4-10`). So the front
   card's intended 2 px ring renders at 1 px and `--ring-w` (also set at
   `glows.css:72`) does nothing. Verified by the driver.
5. **Root cause of 4.** About 15 selectors are defined both in a ported layer
   (`styles/flow.css`, `styles/shell.css`) and in `index.css`, which silently wins:
   `.card-identity-ring`, `.flow-head`, `.ring`, `.send-pair`, `.send-wrap`, `.msg.you`,
   `.q-box .deep`, `.menu-tray`, `.fb-pill`, `.drawer-panel .overlay-close`,
   `.page-content`, `.shelf`, `.ctx-art .hero`. REQ-216: a screen's own selector "may
   use what those layers set but may not redefine it".
6. Three literal colours equal existing tokens: `DestinationOutlet.tsx:17`
   `text-zinc-400` (= `--text-muted`), `index.css:395-396` `#ff8fa3` (= `--status-error`)
   and `#ffd1da`, `index.css:2720` `#e2e8f0` (= `--text-primary`).

Healthy, for contrast: every other tile goes through `getCardIdentityRingStyle`
(12 files); `lib/cardIdentityRing.ts` is the only source of ring colours; the front
card glow (`flow.css:94-99`) is a blur behind the card, not an edge.

## Decisions already made — do not re-litigate

- The ring rule itself: every card tile keeps its identity ring; the theme owns the
  glow behind it, never its edge.
- The named colour exemptions in REQ-216 (ambient scene canvas, trade pile, scan debug
  overlays, Life Tracker's frozen Tailwind colours) are not violations.

## Open decisions for the define gate

1. Front carousel card ring: restore the intended 2 px, or settle on 1 px everywhere
   and delete `--ring-w` (recommendation: restore 2 px — it was the ported design).
2. Dragged shelf card: replace the 2 px accent spread with a blurred glow behind the
   card, or drop it (recommendation: blurred glow).

## Design direction (converged)

- Pass the card's colours into `PrintingPicker`.
- Add `card-identity-ring` + style to the Quick Question result thumbnail and the
  `CardPresentation` image.
- Fix the drag shadow per decision 2.
- For each duplicated selector, keep one definition in the owning layer and delete or
  merge the `index.css` copy; values that differ are listed in the DESIGN-BRIEF and
  resolved deliberately (the ring width per decision 1), identical ones just go.
- Swap the three literal colours for their tokens (`#ffd1da` gets a token or a
  `color-mix` from `--status-error`).

## Current-state PRD truth to amend

- REQ-058 / REQ-060 (identity ring requirements, `PRD/sections/functional-requirements.md`)
  — name the printing picker, search thumbnails and selected-card preview as ringed
  surfaces, and the "no theme on the edge" rule if it is not already written there.
- REQ-216 only if the stylesheet-ownership rule needs sharpening.

## Constraints (don't rediscover)

- Life Tracker is pixel-frozen (REQ-202).
- Some `*.test.ts` files read stylesheets by text (mockup-parity tests) — check them
  before deleting a selector.
- `CardPresentation.tsx` is also touched by the `codehealth` session-cache target —
  land this cluster first.

## Evidence + reusable tooling

`PRD/work/probe-codebase-health-pass/FINDINGS-ui-and-personalities.md` (U-05, U-07,
U-13).

## What the graph run should produce

A DESIGN-BRIEF, two gate questions, the ring-requirement amendments, and slices: the
four ring surfaces first, then the stylesheet de-duplication, then the token swaps.
Each slice is checked live in the browser across at least two colour personalities.

## How to hand this off

/graph-kickoff "Every card keeps its colour-identity ring, and index.css stops overriding the shared stylesheets" PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-card-rings.md
