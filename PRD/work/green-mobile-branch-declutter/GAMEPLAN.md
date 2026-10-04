# Gameplan: green-mobile-branch-declutter

## Outcome (what a player sees)

A player picks Green on a phone (viewport width `< 768px`). Behind the app they
see forest ambience: a few drifting leaves, soft green glow, a hint of branch.
No limbs run down the side edges across the controls and text. Other colours,
and green on tablet or desktop, look exactly as before.

## Architecture

One component: `apps/frontend/src/components/AmbientScene.tsx`, the `GREEN`
scene object (`init`, `backdrop`, `limb`, `draw`). Presentation only.

- Today the phone path in `GREEN.backdrop` fires only when
  `H > W * 1.6 && W < 520` (line 169) and hangs limbs down both side edges.
  Phones 520-767 wide fall to the wide path (long top-corner limbs) and are not
  covered by the quiet bar.
- Fix: make the quiet path serve the whole phone band (`W < 768`, including
  520-767 and the 390 reference) by pulling limbs off the side edges and out of
  the content column, and thinning leaf density and opacity through the scene's
  existing density (`k`) and opacity knobs. Tune values by looking at the
  before/after screenshots; the brief sets the bar, not the pixels.
- The narrow Menu tray uses its own copy of the scene (W < 520): it must be calm too.
- Out of scope: the other five scenes, tablet/desktop green, reduced-motion
  still frame, weak-hardware fallback, layout, backend, assets, dependencies.
- `PRD/sections/` is NOT edited by this plan; the REQ-207 amendment (three diff
  anchors in `GATE-QUESTIONS.md`) is applied at build, inside the slice.

## Data flow

Theme = green -> `AmbientScene` mounts `#ambience-canvas` (fixed, z-index 0,
pointer-events none) -> on resize `GREEN.init(W,H,k)` builds leaves and
`GREEN.backdrop(ctx,W,H,k)` paints the cached still part -> `GREEN.draw`
animates leaves each frame. Only the phone branch of `backdrop` and the leaf
count/alpha for phone widths change.

## Slices

| Slice | Name | Depends on |
| --- | --- | --- |
| A | Quiet green scene on phones | none |

One slice: one component, one objective, one screenshot evidence set.

## Implementer notes (from the Preparation gate)

1. Cover the whole phone band `< 768px` (including 520-767), not only `W < 520`.
2. Required evidence: before/after screenshot pair at 390x844 on Ask a Question,
   In-depth, and the Menu tray (six PNGs).
3. The grounding shots in `.playwright-mcp/` are gitignored and absent: capture a
   fresh "before" pair on the unmodified code first, before editing.
4. When applying the REQ-207 amendment, cite the "phone shell fills nearly the
   full viewport width" line to `PRD/sections/shared-chrome/screen-layout.md`
   rather than DEC-145 / REQ-124 (citation imprecision only; requirement unchanged).

## Verification checklist

- [ ] `npm run test -w apps/frontend -- AmbientScene` green (incl. new phone test)
- [ ] `npm run quality:check` green for touched areas
- [ ] Six screenshots at 390x844 in `PRD/work/green-mobile-branch-declutter/.playwright-mcp/`
- [ ] Other colours and green at >= 768px unchanged (test + visual spot check)
- [ ] Browser closed, owned dev server stopped, ports released
- [ ] REQ-207 amendment applied to `PRD/sections/functional-requirements.md`
