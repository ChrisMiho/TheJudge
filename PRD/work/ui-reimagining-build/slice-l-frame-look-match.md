# Slice L — Frame, Menu, Theme band and shared sheets take the look

## Status: planned

## Goal

A player sees the direction-1 frame, not today's old rounded card. The page
goes full-bleed on the colour's wash, under a sticky banner header with a
breathing orb and the colour's scene moving behind everything. The ☰ Menu
opens as a real left drawer, themed six-cell Theme band at its foot. Every
shared sheet (card detail, Send feedback, Question History, confirm) wears
the mockup's glass. This is the first look-matching slice; every other
look-matching slice (M–Q) builds its screen on top of this frame.

Behaviour does not change in this slice. Slices A and B already built the
frame's structure, the Menu's one-door inventory, and the shared sheet shell;
this slice restyles what they built to match the mockup pixel values below.
Where a LOOK-GAPS.md difference describes new structure (the ambient scene
needs repositioning, the mock-mode strip was never wired to show), this slice
makes that one change; it does not re-architect anything A or B already
delivered correctly.

## Dependencies

Slice A (tokens, header, Menu, Theme band — restyled here) and slice B
(shared sheet shell, card detail — restyled here). Both are `done`. M, N, O,
P and Q all depend on this slice for the frame they sit inside.

## Mockup source

`docs/design/ui-reimagining/direction-1/shared-chrome-menu.html`, with
`shell.css`, `tokens.css`, `flow.css`, `ambience.css`. The card-detail sheet
is `quick-question.html`'s ⓘ sheet (built on `flow.css`'s `.detail-panel`).

## LOOK-GAPS.md section closed

`## Frame, Menu, Theme band and shared sheets` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:15-69`).

## Requirements

Realises no new `GATE-QUESTIONS.md` id — REQ-067, REQ-107 and REQ-131 (the
Menu's one-door inventory, History's placement, and the six-cell Theme band)
already match the mockup per LOOK-GAPS.md's own finding ("None found on this
screen"); this slice is presentation only, built on A and B's existing
behaviour.

1. Remove the `section.page-card` wrapper. The page body becomes
   `shell.css:31-37` (`background: var(--surface-wash)`, flex column,
   `min-height: 100dvh`); content sits in a `.page-content` column
   (`shell.css:814-819`, `min(36rem, 92vw)`, pages override width per screen).
2. The header becomes `.app-header` (`shell.css:63-81`): sticky, full width,
   `grid-template-columns: 1fr auto 1fr`, `min-height: 64px` (68px desktop),
   the radial-plus-linear-gradient background, hairline bottom border,
   `box-shadow`, `backdrop-filter: blur(8px)`.
3. Brand: the orb is `shell.css:216-233` (38px, `var(--motif)` background,
   `orb-breathe` 4.5s). Wordmark is `shell.css:240-249` (800 weight, 1.2rem,
   -0.01em, gradient `accent-soft → accent-soft mixed 45% with text-primary`).
   Tagline is `shell.css:251-259` (0.6rem, 600, uppercase, 0.18em tracking,
   `--text-muted`).
4. The ☰ control's painted size and tap area become `shell.css:287-316`
   (50×50px, 54×54px desktop); it sits in the header, not inside the old
   card.
5. The mock-mode strip (`MockModeBanner.tsx`, already gated on
   `isMockProvider` from `apps/frontend/src/lib/env.ts:68`) is restyled to
   `shell.css:325-332` (0.72rem, accent 20% fill over the ground, hairline
   bottom border) and placed directly under the header. Its gating logic is
   unchanged — it still shows only when `VITE_ASK_AI_PROVIDER` is set — this
   slice only restyles it and verifies it in the browser with the launch
   form below, since no prior slice's browser pass ever set that variable.
6. The ambient scene (`AmbientScene.tsx`, already CSS-only per slice A)
   moves to `ambience.css:32-58` positioning: `position: fixed; inset: 0;
   z-index: 0`, behind the header and content, with the two haze sheets
   (`blur(46px)`, opacity 0.62/0.5, 46s/64s drift). No new layer, trigger, or
   timing system — only the container's position and stacking context
   change (NFR-006 still holds: transform/opacity only, honours
   `prefers-reduced-motion`).
7. The Menu tray becomes a true left drawer: `shell.css:336-345` backdrop
   (`rgba(0,0,0,0.55)` + `blur(2px)`), `shell.css:347-366` `.menu-tray`
   (`min(20rem, 86vw)`, full height, slide-in transform), `shell.css:453-470`
   tray brand row, `shell.css:477-550` nav list (48px rows, 28px glyph
   column, `aria-current="page"` lit with a left accent bar and ✓, a divider
   before Send feedback). Desktop keeps A's existing floating-card
   presentation for the tray (REQ-113, already built), restyled to these
   values.
   - The tray's faint background motion (`shell.css:374-411` `.tray-flair`)
     is reproduced only as the static-plus-one-keyframe CSS glow
     (`tray-flair::after`, `flair-twinkle` 6s) — a radial pool of the
     colour's light at the tray's foot. The canvas-drawn shapes
     (`.flair-canvas`, driven by the mockup's `ambience.js` `mountFlair`) are
     **not** ported: that is script/canvas animation, a stated non-goal
     (`DESIGN-BRIEF.md` `## Non-goals`, A1). The tray ships with the glow and
     no canvas.
8. The Theme band keeps A's six-cell structure, restyled to
   `shell.css:571-592` (`.theme-band`/`.theme-orbs`: one pill, 3px padding,
   2px gaps) and `shell.css:614-657` (`.theme-orb`: 40px cells, 46px tall,
   rounded end caps, current cell scale 1.08, accent glow).
9. Shared sheets (`SheetShell.tsx`, `ConfirmSheet.tsx`, `FeedbackModal.tsx`)
   take the glass shell: `shell.css:872-915` `.drawer-panel` (desktop
   centred card, radial accent glow, `backdrop-filter: blur(18px)
   saturate(1.3)`, `.overlay-close` 44px rounded-square with a glass fill),
   `shell.css:917-935` phone bottom sheet (`max-height: 88dvh`, radius
   1.1rem top, grab handle), `shell.css:433-447` `.sheet-backdrop`
   (blurs the page behind, not only dims it), `shell.css:738-741` feedback
   desktop size, `shell.css:792-795` history desktop size.
10. Card detail (`CardPresentation.tsx` / its `CardSelectionPreview.tsx`
    callers) takes `flow.css:280-317`: 150px art-crop hero (190px desktop)
    with the name and `{R}`-style cost over it, a type line with a colour
    dot, the oracle text in a lit bordered box, and three fact chips (Mana
    value, Subtypes, Price in `--accent-soft`). The build shows no price
    today; this slice adds the price fact chip using the same price data
    Trade Balancer and the card scanner already read (no new data source).

## Files touched

- `apps/frontend/src/index.css` — remove `section.page-card`; add
  `.app-header`, brand, ☰, mock-strip, `.page-content`, `.ambience`
  positioning, menu-tray, theme-band, drawer-panel/sheet-backdrop rules
  ported from the mockup stylesheets above.
- `apps/frontend/src/components/PageShell.tsx` — header structure, ☰
  control.
- `apps/frontend/src/components/BrandMark.tsx` — orb, wordmark, tagline.
- `apps/frontend/src/components/MockModeBanner.tsx` — restyled strip.
- `apps/frontend/src/components/AmbientScene.tsx` — repositioned container
  only; no new layer.
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (+
  `.test.tsx`) — tray geometry, nav row styling, divider, flair glow.
- `apps/frontend/src/components/portal/ThemeSection.tsx` (+ `.test.tsx`) —
  restyled band.
- `apps/frontend/src/components/SheetShell.tsx`, `ConfirmSheet.tsx`,
  `apps/frontend/src/components/feedback/FeedbackModal.tsx` (+ `.test.tsx`
  each) — glass shell, grab handle, backdrop blur.
- `apps/frontend/src/components/CardPresentation.tsx` (+ `.test.tsx`) — art
  hero, oracle box, fact chips including price.

## Tests

- `PageShell.test.tsx`, `BrandMark.test.tsx` (new if absent),
  `MockModeBanner.test.tsx`, `AmbientScene.test.tsx`,
  `FeaturePortalMenu.test.tsx`, `ThemeSection.test.tsx`, `SheetShell.test.tsx`,
  `ConfirmSheet.test.tsx`, `FeedbackModal.test.tsx`,
  `CardPresentation.test.tsx` — updated for the new markup/classes; no
  behavioural assertion changes (same props, same callbacks, same a11y
  roles/names).

## Owner questions — the build follows the accepted requirement until answered

None found on this screen. LOOK-GAPS.md's `## Frame, Menu, Theme band and
shared sheets` `### Conflicts with accepted requirements` reads in full:
"None found on this screen. The Menu's single Ask a Question entry, History
right under it, and the six-cell Theme band all match the accepted blocks
(REQ-067, REQ-107, REQ-131)."

## Acceptance criteria

- [ ] L1. `npm run quality:check` passes.
- [ ] L2. `npm --workspace apps/frontend run test` passes.
- [ ] L3. The page renders with no `section.page-card` wrapper; the header
      is `.app-header`-shaped (sticky, full-bleed, the gradient/blur/border
      from `shell.css:63-81`) in `PageShell.tsx` and `index.css`.
- [ ] L4. The brand mark renders the 38px breathing orb, gradient wordmark
      and uppercase tagline per `shell.css:216-259`, in `BrandMark.tsx`.
- [ ] L5. The ☰ control's painted size is 50×50px (54×54px desktop) and its
      tap area matches, in `PageShell.tsx`.
- [ ] L6. The mock-mode strip renders under the header styled per
      `shell.css:325-332`, in `MockModeBanner.tsx`.
- [ ] L7. The ambient scene container is `position: fixed; inset: 0;
      z-index: 0` behind the header and content, in `AmbientScene.tsx` and
      `index.css`.
- [ ] L8. The Menu tray is a full-height left drawer on phone (slide-in,
      backdrop blur) matching `shell.css:336-366,453-550`, and card detail,
      Send feedback and Question History carry the glass shell
      (`shell.css:872-935`), in `FeaturePortalMenu.tsx`, `SheetShell.tsx`,
      `ConfirmSheet.tsx`, `FeedbackModal.tsx`.
- [ ] L9. Card detail shows the art-crop hero, oracle box, and three fact
      chips including a price chip, in `CardPresentation.tsx`.
- [ ] L10 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice's token, header and sheet changes, at 390×844 and 1440×900,
      saved to `docs/design/ui-reimagining/build-screenshots/l/`
      (`life-tracker-before-390x844.png`, `life-tracker-after-390x844.png`,
      `life-tracker-before-1440x900.png`, `life-tracker-after-1440x900.png`).
- [ ] L11 (manual). Side-by-side pairs saved under
      `docs/design/ui-reimagining/build-screenshots/l/`, build next to
      mockup, same colour profile (Blue) and state, at 390×844 and
      1440×900: page at rest (`chrome-build-390x844.png`,
      `chrome-mockup-390x844.png`, `chrome-build-1440x900.png`,
      `chrome-mockup-1440x900.png`), Menu open (`chrome-menu-build-*.png`,
      `chrome-menu-mockup-*.png`), Send feedback open
      (`chrome-feedback-build-*.png`, `chrome-feedback-mockup-*.png`),
      Question History open (`chrome-history-build-*.png`,
      `chrome-history-mockup-*.png`), card detail open
      (`card-detail-sheet-build-*.png`, `card-detail-sheet-mockup-*.png`) —
      20 files, one pair per state named in LOOK-GAPS.md's Frame pairs list.
- [ ] L12 (manual). Each pair in L11 was compared side by side against the
      build at the matching state; every `### Differences` bullet under
      LOOK-GAPS.md's `## Frame, Menu, Theme band and shared sheets` is
      closed (the capture shows the mockup value applied) or named as an
      open owner question above — this screen carries none.
- [ ] L13 (manual). Browser scenario: launched with
      `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node
      scripts/dev.mjs` (the exact form — `scripts/dev.mjs` never sets
      `VITE_ASK_AI_PROVIDER` on its own), confirmed the mock-mode strip
      renders under the header in the styled form from L6.
- [ ] L14 (manual). Cleanup evidence recorded: browser closed, owned
      dev server(s) stopped, ports released (not 5273/3100, the owner's
      ports — this slice's Playwright pass uses its own ports), disposable
      captures under `PRD/work/ui-reimagining-build/.playwright-mcp/`
      named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
