# Slice A — Frame: tokens, ambient scene, banner header, Menu tray, Theme band, font

## Status: planned

## Goal

A player picks a mana colour and the whole app — ground, scene, header,
Menu, Theme band — becomes that colour's place. This is the direction-1
frame every later slice builds on: one shared stylesheet, one set of colour
tokens, one Menu tray that lists the single Ask a Question door.

## Dependencies

None — first slice. Every other slice depends on this one for tokens, the
shared stylesheet, the header and the Menu.

## Requirements

Realises these `GATE-QUESTIONS.md` ids (verdict `accept` unless noted),
applied to `PRD/sections/` by intent together with the code:

1. REQ-207 — banner header (☰ left, brand centred on a lit band carrying the
   colour's element, cat-wizard Easter egg kept), Menu tray, Theme band, the
   colour's CSS-animated scene (one flat dark ground per profile, density and
   opacity as single numbers, still under reduced motion).
2. REQ-200 — colour roles and contrast floors in all six profiles over the
   scene; the wash never goes fully black.
3. REQ-099 — the custom Colorless colour keeps its hue, lifted for
   readability.
4. REQ-131 — Theme orbs become the six-cell Theme band (40px cells, no
   names, arrows only when six cells don't fit).
5. REQ-113 — the Menu tray floats as a card on desktop (full height on
   phone).
6. REQ-114 — the ☰ button's tap area matches what it paints.
7. REQ-115 — Menu-over-History occlusion check retired (nothing left to
   cover once the History rail icon is gone).
8. REQ-127 — the open Menu hides the ☰ button and closes three ways
   (outside tap, Escape, re-tap).
9. REQ-067 — the feature portal (Menu) lists one question door: **Ask a
   Question · Question History · Life Tracker · Trade Balancer**, then
   **Send feedback**, then the Theme band.
10. REQ-116 — top clearance no longer checks a History icon (retired rail).
11. FLOW-007 — Theme flow: picking a six-cell swatch repaints the app; custom
    Colorless stays readable.
12. FLOW-010 — switching destinations goes through the ☰ Menu to the one
    question door.

One typeface (Inter, self-hosted within the asset budget per NFR-013; system
stack fallback if it cannot fit — `A2`). No corner decoration. Every card
keeps its colour-identity ring (REQ-058, applied where card tiles render;
the ring rule itself is carried, not re-defined, by this slice).

## Files touched

- `apps/frontend/src/index.css` — remove the four hard-coded accent tokens
  (`:822-825`) and the hard-coded body gradient (`:866-869`); add the token
  set, the 600px sheet-family boundary variable, Inter `@font-face`.
- `apps/frontend/src/lib/theme/applyPalette.ts`, `palettes.ts` — colour
  roles and contrast floors (REQ-200), Colorless lift (REQ-099).
- `apps/frontend/src/components/portal/ThemeSection.tsx` (+ `.test.tsx`) —
  six-cell band.
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (+
  `.test.tsx`) — one-door inventory, tray geometry, ☰ tap area, three-way
  close.
- `apps/frontend/src/components/PageShell.tsx` — banner header, ☰ control.
- `apps/frontend/src/components/BrandMark.tsx` — lit band, cat-wizard egg.
- New `apps/frontend/src/components/AmbientScene.tsx` (+ `.test.tsx`) —
  CSS-animated per-colour scene (ported language from
  `docs/design/ui-reimagining/direction-1/ambience.css`, `ambience.js`,
  `motifs.js`, `motifs/` — reference only, not shipped as script/canvas
  per the brief's non-goals).
- `apps/frontend/public/fonts/` or equivalent — self-hosted Inter, if it
  fits NFR-013's asset budget.
- `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md`,
  `PRD/sections/screen-layout.md`, `PRD/sections/shared-chrome/README.md`,
  `PRD/sections/system-map.md` — apply REQ-207/099/113/114/115/127/131/067/
  200/116 and FLOW-007/010 by intent (system-map's code-location lines
  per `A23`).

## Tests

- `ThemeSection.test.tsx`, `FeaturePortalMenu.test.tsx`, `applyPalette.test.ts`
  — updated for the six-cell band, one-door inventory, contrast floors.
- `App.theming.test.tsx`, `App.mtg-color-themes.test.tsx` — updated for the
  new token set and scene.
- New `AmbientScene.test.tsx` — renders per colour, honours
  `prefers-reduced-motion`.

## Acceptance criteria

- [ ] A1. `npm run quality:check` passes.
- [ ] A2. `npm --workspace apps/frontend run test` passes.
- [ ] A3. `FeaturePortalMenu` lists exactly one question door ("Ask a
      Question") and the full REQ-067 inventory, with no leftover Quick
      Question / In-Depth Question split.
- [ ] A4. The Theme band renders six 40px cells with no colour names;
      overflow arrows appear only when six cells do not fit.
- [ ] A5. The ☰ button's hit target matches its painted bounds (REQ-114)
      and the Menu closes on outside tap, Escape, and re-tap (REQ-127).
- [ ] A6. Custom Colorless renders with its hue kept and passes the REQ-200
      contrast floor over the scene in all six profiles.
- [ ] A7. `PRD/sections/` carries REQ-207, REQ-099, REQ-113, REQ-114,
      REQ-115, REQ-127, REQ-131, REQ-067, REQ-200, REQ-116, FLOW-007,
      FLOW-010 by intent.
- [ ] A8 (manual). The ambient scene is CSS-only (no canvas, no animation
      library, no script-driven loop) and visibly stills under
      `prefers-reduced-motion: reduce`, observed in the browser.
- [ ] A9 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice's token and header changes, at 390×844 and 1440×900, saved to
      `docs/design/ui-reimagining/build-screenshots/a/`.
- [ ] A10 (manual). Browser scenarios observed at 390×844 and 1440×900: Menu
      slides in full-height on phone / floats as a card on desktop; all six
      Theme cells fit without arrows at both widths; each colour repaints
      ground, scene and header band on selection (FLOW-007).
- [ ] A11 (manual). Cleanup evidence recorded: browser closed, any
      agent-started dev server stopped, ports released, capture output path
      named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
