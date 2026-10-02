# Slice A — Frame

## Status: done

## Goal

Port the mockup's stylesheet layer and ambient scene into the app, put the header at the top edge, and switch surfaces to glass, so every later screen slice only re-orders its DOM onto layers that already exist. Also create the pixel-comparison script every slice runs.

Visual source: `docs/design/ui-reimagining/direction-1/shared-chrome-menu.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: NFR-006, REQ-207, REQ-216. Behaviour rules that win over the mockup: REQ-122 opaque tray; REQ-123 mock banner; REQ-205 44px floor; REQ-213 history list; REQ-142 close colour.

1. Port `tokens.css`, `shell.css`, `flow.css` and `ambience.css` from `docs/design/ui-reimagining/direction-1/` as a layer (suggested home `apps/frontend/src/styles/`, files keeping the mockup names so the audit SKIP pattern matches), with the mockup's selectors and values. Order: tokens, shell (`shell.css`, `ambience.css`), flow (`flow.css`).
2. Map REQ-200's named roles and `lib/theme/palettes.ts` / `applyPalette.ts` onto the ported variables; the custom Colorless colour (REQ-099) is derived the way the mockup derives its six `?profile=` profiles. Add a test that every value `palettes.ts` shares with `tokens.css` equals it.
3. Port `ambience.js` as one `AmbientScene` (canvas, fixed behind the page, active profile drives colours, one painted frame under reduced motion). It replaces the internals of `components/AmbientScene.tsx`, keeping the page and tray variants; no second scene component, no library.
4. Header outside page padding: `PageShell` + `StagedStepHeader` render the header at y=0 in mockup DOM order. Menu tray, Theme band, `SheetShell`, `ConfirmSheet`, `ConversationHistoryDrawer`, Send feedback and card-detail sheets render in the DOM order of `shared-chrome-menu.html`.
5. Panels take the mockup's glass values. Behaviour that wins over the mockup: opaque Menu tray (REQ-122), mock banner (REQ-123), 44px touch floor (REQ-205), REQ-200 contrast floors over glass and the scene, REQ-213 history list, REQ-142 palette-derived close colour. Each deviation from the mockup is a named mask region.
6. Create `scripts/compare-screenshot-pair.mjs` and `scripts/compare-screenshot-pair.test.mjs` to the brief's exact usage (`--build --mockup [--mask] [--tolerance]`), one JSON line output (`build, mockup, mask, tolerance, comparedPixels, maskedPixels, differingPixels, differingFraction`), mask format (`contentBox`, `regions` with name and reason) and non-zero exit with both sizes on a size mismatch. Uses `pngjs` (already a devDependency); the test runs under `npm run test:scripts`.
7. Record how the scene region is handled in pairs (reduced motion emulated on both sides, A7) in `translation/frame/DIFF-RESULTS.md` before any screen slice relies on it.
8. Apply the NFR-006, REQ-207 and REQ-216 gate blocks to `PRD/sections/` by intent, once each.

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/frame/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/components/StagedStepHeader.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/ThemeSection.tsx`
- `apps/frontend/src/components/SheetShell.tsx`
- `apps/frontend/src/components/ConfirmSheet.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx`
- `apps/frontend/src/components/MockModeBanner.tsx`
- `apps/frontend/src/components/OverlayCloseButton.tsx`
- `apps/frontend/src/components/BrandMark.tsx`

Also touched:

- apps/frontend/src/components/AmbientScene.tsx (exempt; canvas port)
- apps/frontend/src/index.css, apps/frontend/src/main.tsx
- apps/frontend/src/styles/tokens.css, shell.css, flow.css, ambience.css (new, ported)
- apps/frontend/src/lib/theme/palettes.ts, applyPalette.ts (token layer)
- The card-detail sheet component (found at build; candidates `components/CardPresentation.tsx`, `components/CardSelectionPreview.tsx`)
- scripts/compare-screenshot-pair.mjs, scripts/compare-screenshot-pair.test.mjs (new)
- PRD/sections/ (NFR-006, REQ-207, REQ-216 by intent)
- `docs/design/ui-reimagining/build-screenshots/translation/frame/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `scripts/compare-screenshot-pair.test.mjs` (same-size diff, tolerance, mask, size-mismatch exit)
- `AmbientScene.test.tsx` (canvas mounts, reduced motion paints one frame, profile change recolours)
- Palette/token equality test in `lib/theme/`
- Existing `PageShell`, `StagedStepHeader`, `FeaturePortalMenu`, `ThemeSection`, `SheetShell`, `ConfirmSheet`, `ConversationHistoryDrawer`, `FeedbackModal` tests updated for DOM order, behaviour assertions kept

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.03 per pair (initial; measured maximum 0.0152 at tolerance 12, kept at 0.03; never raised to or above 0.05). States to pair: at-rest, menu-open, send-feedback, question-history, card-detail.

- [x] **A1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (at-rest, menu-open, send-feedback, question-history, card-detail) in docs/design/ui-reimagining/build-screenshots/translation/frame/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [x] **A2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/frame/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.03 (itself below 0.05); every mask region is named with a reason
- [x] **A3** `npm run quality:check` is green
- [x] **A4** `npm --workspace apps/frontend run test` is green
- [x] **A5** `npm --workspace apps/backend run test` is green
- [x] **A6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **A7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **A8** Profile-switch pair: the menu-open state in two different Theme colours at 390x844 is saved as `menu-open-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/frame/, with every element recoloured and none left behind (observed)
- [x] **A9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [x] **A10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/frame/ (absolute paths) is recorded in DIFF-RESULTS.md
- [x] **A11** `node --test scripts/compare-screenshot-pair.test.mjs` passes and `npm run test:scripts` is green
- [x] **A12** `scripts/compare-screenshot-pair.mjs` run on two PNGs prints one JSON line with exactly the keys `build, mockup, mask, tolerance, comparedPixels, maskedPixels, differingPixels, differingFraction`, and exits non-zero printing both sizes on a size mismatch
- [x] **A13** `tokens.css`, `shell.css`, `flow.css`, `ambience.css` exist under `apps/frontend/src/styles/` with the mockup's selectors and values, loaded in the order tokens, shell, flow
- [x] **A14** `AmbientScene` draws the ported `ambience.js` renderer on one fixed canvas, recolours on a Theme change, paints one still frame under emulated reduced motion, and no second scene component or library exists
- [x] **A15** At 390x844 and 1440x900 the header's top edge is at y=0 (measured with the browser's bounding box, value recorded in DIFF-RESULTS.md) in every state
- [x] **A16** Menu tray alpha is 1 (REQ-122), the mock banner still renders (REQ-123), and every control paints at least 44px (REQ-205); each is observed in the browser at both viewports and any mockup difference is a named mask
- [x] **A17** `PRD/sections/` carries the NFR-006, REQ-207 and REQ-216 edits, each applied once, by intent against current truth

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node --test scripts/compare-screenshot-pair.test.mjs
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/frame/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/frame/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/frame/<state>-mask-390x844.json] [--tolerance N]
# REQ-216 audit, brief's verbatim command (BASE = commit this slice started from, FILES = list above)
PAT='#[0-9a-fA-F]{3,8}\b|rgba?\( *[0-9.]|hsla?\( *[0-9.]|\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|shadow-\[|box-shadow: *-?[0-9]|--[a-zA-Z][a-zA-Z0-9-]*"? *:|setProperty\('
SKIP='\.test\.tsx?$|/(tokens|shell|flow|ambience)\.css$|^apps/frontend/src/lib/theme/|^apps/frontend/src/components/AmbientScene\.tsx$|^apps/frontend/src/components/trade/TradePile\.tsx$|^apps/frontend/src/components/(ScanCardOutline|ScanDebugOverlay)\.tsx$|^apps/frontend/src/lib/cardIdentityRing\.ts$|^apps/frontend/src/components/portal/life-tracker/(PlayerLifeCard|PlayerLifeTrackerApp)\.tsx$'
# (a1) rebuilt components, whole file
printf '%s\n' $FILES | grep -vE "$SKIP" | while read -r f; do cat "$f"; done | grep -cE "$PAT"
# (a2) every added line under apps/frontend/src
git diff -U0 "$BASE"..HEAD -- apps/frontend/src \
  | SKIP="$SKIP" awk '/^\+\+\+ /{f=substr($0,7); keep=(f !~ ENVIRON["SKIP"]); next} keep && /^\+/' \
  | grep -cE "$PAT"
```
