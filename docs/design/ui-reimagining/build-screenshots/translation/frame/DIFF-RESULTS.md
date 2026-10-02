# Slice A — Frame: pair results

Screen: the shared chrome (header and banner, ambient scene, Menu tray with Theme band, Send feedback, Question History, card-detail sheet). Visual source: `docs/design/ui-reimagining/direction-1/shared-chrome-menu.html`.

Slice threshold: differing fraction at most 0.03 per pair (below the 0.05 ceiling). Measured maximum 0.0152; the threshold is left at 0.03.
Tolerance: 12 per channel on every pair (recorded in each row). At tolerance 0 the same pairs measure 0.002 to 0.026 with masks, except the open Menu (0.218 at 390x844, 0.083 at 1440x900): the tray ground is the one REQ-122 deviation (a solid ground under the mockup's glass gradients, so the page shows through 0 percent instead of 4 to 8 percent) and the difference stays inside 12 per channel.

How the pairs are made. Build: the app in mock mode on port 5411 (mock provider, `VITE_FEEDBACK_FORMSPREE_ID` set so the feedback sheet shows no "not configured" hint), reduced motion emulated, profile Blue, the page column hidden on both sides (`.page-content { display: none }`, because the mockup page's own demo text and the app's screens are compared in their own slices). Mockup: a copy of `docs/design/ui-reimagining/` served on port 5413. The copy differs from the originals in two ways, both only so the two sides are comparable: its `ambience.js` has the same seeded random source and the same one-frame paint under reduced motion the app's `AmbientScene` has (the original draws nothing under reduced motion), and its Inter font link points at the same self-hosted font file the app ships. Captures at 390x844 and 1440x900; the Playwright browser, same profile on both sides, the Scryfall card art loads live on both sides.

How the scene is made identical run to run (design brief A7). Under `prefers-reduced-motion` the renderer seeds its random source with the fixed value 20261002 and paints one frame, so the dust, runes and shapes land in the same place every time. Both sides use the same seed, so the scene region is compared, not masked.

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| at-rest 390x844 | at-rest-mask-390x844.json | 12 | 0.00000 (0 / 246760) | 0.03 | PASS |
| at-rest 1440x900 | at-rest-mask-1440x900.json | 12 | 0.00219 (2678 / 1224000) | 0.03 | PASS |
| menu-open 390x844 | menu-open-mask-390x844.json | 12 | 0.01518 (4711 / 310440) | 0.03 | PASS |
| menu-open 1440x900 | none | 12 | 0.00363 (4710 / 1296000) | 0.03 | PASS |
| send-feedback 390x844 | send-feedback-mask-390x844.json | 12 | 0.00014 (34 / 234524) | 0.03 | PASS |
| send-feedback 1440x900 | send-feedback-mask-1440x900.json | 12 | 0.00003 (34 / 1208774) | 0.03 | PASS |
| question-history 390x844 | question-history-mask-390x844.json | 12 | 0.00000 (0 / 231396) | 0.03 | PASS |
| question-history 1440x900 | question-history-mask-1440x900.json | 12 | 0.00025 (311 / 1221884) | 0.03 | PASS |
| card-detail 390x844 | card-detail-mask-390x844.json | 12 | 0.00222 (544 / 244500) | 0.03 | PASS |
| card-detail 1440x900 | card-detail-mask-1440x900.json | 12 | 0.00049 (600 / 1219868) | 0.03 | PASS |

Pairs live beside this file as `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and `<state>-mask-<viewport>.json`.

## Named mask regions (every one has its reason in the mask file)

- closed tray shadow (x 0 to 80, full height; at-rest and the three sheet states): the mockup keeps its closed Menu tray mounted off-screen and its 24px accent shadow bleeds onto the left edge; the app mounts the tray only while open.
- closed bottom sheets glow (y 796 to 844 at 390x844 only): the mockup keeps three closed bottom sheets mounted just below the screen and their accent glow bleeds up into the bottom edge on a phone; the app mounts a sheet only while open.
- overlay close button: REQ-142 keeps the close glyph in the active profile's light; the mockup's is plain white.
- feedback type pills: REQ-205 floor, the pills paint 44px tall (the mockup's are 40px); a negative block margin keeps the sheet's layout exactly the mockup's.
- per-row Delete (Question History at 390x844): REQ-213 and DEC-143 keep a Delete on each row below 600px; the mockup has none.
- price and colour pip (card detail): live data (the app reads the current price) and the card's colour-identity ring colour (REQ-058).

## Behaviour that wins over the mockup (named, not hidden)

- REQ-122: the open Menu tray is opaque: `.menu-tray` has `background-color: var(--surface-ground)` under the mockup's gradients; measured computed background `rgb(9, 9, 11)`, alpha 1, at both viewports.
- REQ-123: the mock banner renders under the header at both viewports.
- REQ-142: the close glyph colour (above). REQ-205: the pills (above). REQ-213: the phone row Delete (above).
- The confirm sheet has no close button, as in the mockup; Keep, Esc and the backdrop dismiss it.
- REQ-113 (full-height tray bounded to the shell, a floating card at 768px and wider) conflicts with the mockup's tray, which is a fixed full-height left tray at every width. The tray now follows the mockup at every width. This is a look change the owner has not ruled on; the requirement text is unchanged and needs an owner decision. Recorded for review.
- Font: REQ-207 requires a self-hosted Inter and no font CDN. The build ships one variable latin file, `apps/frontend/public/fonts/inter-latin.woff2` (48 KB), declared in `index.css`; no request to a font service.

## A15 — header top edge (browser bounding box, `.app-header`.top)

390x844 and 1440x900, in every state (at-rest, menu-open, send-feedback, question-history, card-detail): 0.

## A16 — tray opacity, banner, touch floor

- Tray alpha: computed `background-color` of `.menu-tray` is `rgb(9, 9, 11)` (alpha 1) at both viewports.
- Mock banner: present in all five states at both viewports.
- 44px floor, the frame's own controls (header, tray rows and close, Theme band, sheets and their close buttons): none under 44px in any state at either viewport after the feedback pills were raised to 44px. Controls on the Ask a Question page behind the sheets are slice B's: the composer's In-depth chip 37x40, mic and send 40x40, the General rules topic chips 118x38 (removed in B), the card widgets 32x32; slice B owns them.

## A8 — profile-switch pair

`menu-open-profile-red-build-390x844.png` and `menu-open-profile-green-build-390x844.png` (with the mockup's own `-mockup-` capture beside each): the open Menu in Red and in Green; the header band, brand orb, tray brand, current-row bar and check, destination glyphs, Theme band selection, the tray's pool of light and the scene all recolour; nothing is left on Blue. Differing fractions against the mockup (unmasked, tolerance 12): red 0.044, green 0.029, shown for completeness (they include the unmasked bottom-edge glow and the closed-tray shadow, which the pairs above mask).

## A9 — Life Tracker table (REQ-202), for the owner's review

`translation/life-tracker-table/before-build-<viewport>.png` is the table as PR #239's tip rendered it (copied from `build-screenshots/q/`), `after-build-<viewport>.png` is the table now. The cards, counters and layout are the table's own and unchanged; the banner under the shared header is now the mockup's 41px strip and the brand mark is the mockup's, so the table starts about 12px higher on a phone. The page padding around the table is kept. No pixel count blocks the slice.

## A6 and A7 — REQ-216 audit (the brief's verbatim command)

`BASE` is `aeef8d3` (the commit this slice started from). `FILES` is the rebuilt components: `PageShell.tsx`, `StagedStepHeader.tsx`, `portal/FeaturePortalMenu.tsx`, `portal/ThemeSection.tsx`, `SheetShell.tsx`, `ConfirmSheet.tsx`, `ConversationHistoryDrawer.tsx`, `feedback/FeedbackModal.tsx`, `MockModeBanner.tsx`, `OverlayCloseButton.tsx`, `BrandMark.tsx`, and `CardPresentation.tsx` (it hosts the card-detail sheet), all under `apps/frontend/src/components/`.

```
PAT='#[0-9a-fA-F]{3,8}\b|rgba?\( *[0-9.]|hsla?\( *[0-9.]|\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|shadow-\[|box-shadow: *-?[0-9]|--[a-zA-Z][a-zA-Z0-9-]*"? *:|setProperty\('
SKIP='\.test\.tsx?$|/(tokens|shell|flow|ambience)\.css$|^apps/frontend/src/lib/theme/|^apps/frontend/src/components/AmbientScene\.tsx$|^apps/frontend/src/components/trade/TradePile\.tsx$|^apps/frontend/src/components/(ScanCardOutline|ScanDebugOverlay)\.tsx$|^apps/frontend/src/lib/cardIdentityRing\.ts$|^apps/frontend/src/components/portal/life-tracker/(PlayerLifeCard|PlayerLifeTrackerApp)\.tsx$'
printf '%s\n' $FILES | grep -vE "$SKIP" | while read -r f; do cat "$f"; done | grep -cE "$PAT"      # (a1)
git diff -U0 "$BASE"..HEAD -- apps/frontend/src | SKIP="$SKIP" awk '/^\+\+\+ /{f=substr($0,7); keep=(f !~ ENVIRON["SKIP"]); next} keep && /^\+/' | grep -cE "$PAT"      # (a2)
```

(a1) printed 0. (a2) printed 0 over the working tree against `BASE` before the milestone commit (the same lines the commit holds). To get a2 to zero, the old stylesheet's one-off glows moved into named tokens in `apps/frontend/src/lib/theme/glows.css` (token layer), the fixed ground colour `rgb(9 9 11 / n)` became `color-mix(in srgb, var(--surface-ground) n%, transparent)`, and every `rgb(var(--accent) / n)` form became `color-mix(in srgb, var(--accent) n%, transparent)` so the ported hex tokens drive the old stylesheet too.

## A10 — cleanup evidence

- Playwright browser closed with `browser_close` (result: no open tabs).
- Servers this slice started and stopped: the build server (`VITE_ASK_AI_PROVIDER=mock PORT=3411 FRONTEND_PORT=5411 node scripts/dev.mjs`), the mockup server (`python3 -m http.server 5413` on a scratch copy of `docs/design/ui-reimagining/`, and 5412 earlier), and a one-file capture collector on 5414 (it saved the mask JSON the capture script posted).
- Ports released: `lsof -i :5411`, `:3411`, `:5412`, `:5413`, `:5414` each printed nothing. Ports 5273, 3100 and 5300 were never touched.
- Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/frame/` (scratch captures only under `PRD/work/ui-look-translation/.playwright-mcp/`).
