# Small fixes: cats Easter egg, desktop menu button, default white, menu scrollbar

Four small player-facing fixes, one package. Owner words are in `intake/owner-request.md` (evidence, not authority).

## Problem

1. Easter egg. Tapping the app title 10 times used to show a picture of cats. The owner says it no longer appears.
2. Desktop menu button. The ☰ sits in the far-left corner (the owner likes the spot) but reads as nearly invisible at normal Chrome zoom.
3. Default colour. First-time visitors land on Blue. The owner wants White.
4. Menu scrollbar. The open menu shows a horizontal scrollbar along its bottom on desktop despite ample space. Mobile is unchecked.

## Outcome

1. Owner can trigger the cats picture again, as the product truth already describes.
2. The desktop ☰ is easier to see yet stays subtle, in the same corner.
3. A visitor with no saved colour choice sees White first; saved choices are untouched.
4. The open menu never shows a horizontal scrollbar on desktop or phone.

## Non-goals

- No new menu position, no new menu contents, no redesign of the menu.
- No new cats asset and no change to what the picture is.
- No change to saved colour choices or to the other colour personalities.
- Fixes and sizes are decided in refinement, not here.

## Findings so far (pointers, not decisions)

1. Easter egg: not removed, only partly wired. The code is alive: `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (`brandClickCount`, `showCatEasterEgg >= 10`, image `/assets/cats-homescreen.png`, shown only inside the `game-context` step, ~lines 188 and 878-895). The asset exists at `apps/frontend/public/assets/cats-homescreen.png`. `onBrandClick` is passed only from that one step; every other screen header (`DestinationOutlet.tsx`, `EnrichmentStep.tsx`, `ZoneCollectionStep.tsx`, `ZoneConfirmStep.tsx`) renders `StagedStepHeader` with no handler, and the portal tray's brand is `decorative`. The PRD says the egg must work on every in-scope screen with a session-wide count (REQ-203, `PRD/sections/functional-requirements.md` ~line 5192; also REQ-056 ~line 1216). So the likely cause: the header redesign moved the owner off the one screen that still counts taps, and REQ-203's suite-wide count was never built. Unverified in a browser. Origin: story 015 (`PRD/archive/mvp1/stories/STORY-015-empty-state-cats-homescreen-photo.md`).
2. Menu button: `FeaturePortalMenu.tsx` (`railTrigger`, class `menu-toggle`, ~line 335) styled in `apps/frontend/src/styles/shell.css` (~lines 302-314): 50px on phone, 54px on desktop, font 1.5rem. REQ-207 (~line 5383 and ~line 1591 of `functional-requirements.md`) says "about a quarter larger on a phone and a third on desktop". Docked via `PortalSlot.tsx`.
3. Default colour: `apps/frontend/src/lib/theme/palettes.ts` line 28, `DEFAULT_PALETTE_ID = "blue"`. Pinned by tests in `palettes.test.ts` (line 77), `themePrefs.test.ts`, `useThemePalette.test.ts`, `App.mtg-color-themes.test.tsx`. Load and fallback in `lib/theme/themePrefs.ts` and `hooks/useThemePalette.ts`. PRD wording to check: colour-theme requirements (blue as default) in `PRD/sections/`.
4. Menu scrollbar: the tray is `<nav class="menu-tray">` in `FeaturePortalMenu.tsx` (~line 237), styled in `apps/frontend/src/index.css` (~line 61) and `styles/shell.css`. No `overflow-x` rule was found on it; cause is unknown and needs a live measurement on desktop and phone widths.

## Prior run

- `PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md` — earlier work on the Menu trigger (corner rail, sliding drawer).
- `PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md` — follow-up on the Menu drawer clipping inside the shell.
- `PRD/instructions/receipts/chrome-hit-areas-and-mid-flight-exits-2026-08-05.md` — Menu rail hit areas.
- `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` — built the ☰ banner trigger (`menu-toggle`, REQ-207) that item 2 resizes.
- `PRD/instructions/receipts/responsive-containment-and-density-2026-08-06.md` — Menu tray and overflow containment work, relevant to item 4.
- `PRD/instructions/receipts/tab-personality-color-sync-2026-10-04.md` — tab icon and colour follow the chosen profile; touches the default colour (item 3).
- `PRD/instructions/receipts/blue-ambient-personality-2026-10-05.md` — Blue profile work; matches on "default blue" (item 3).
- `PRD/instructions/receipts/ui-look-translation-2026-10-02.md` — matches "default" colour profile wording (item 3).
- No receipt matches the Easter egg, cats, or title clicks.
