# Slice F — Life Tracker menus

## Status: done

## Goal

Rebuild Life Tracker's Game Setup and Counters sheets in `life-tracker-menus.html`'s DOM order, leaving the Life Tracker table pixel-unchanged. This is the final slice and carries the PRD promotion checklist.

Visual source: `docs/design/ui-reimagining/direction-1/life-tracker-menus.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: REQ-202, REQ-082. Behaviour rules that win over the mockup: REQ-202 every control, option, default and range unchanged; `lib/lifeTracker/` untouched; table pixel-unchanged; REQ-082 content-sized Counters sheet.

1. Rebuild `GameSetupPanel`, `CounterPanel` and the Reset `ConfirmSheet` usage in the mockup's order on plates and pills from `flow.css`; `CounterPanel`'s fixed `zinc-` classes become tokens.
2. REQ-202: Game Setup gets an Edit names disclosure (starts closed) and a Done foot bar that only closes the sheet (reading A13). REQ-082: the Counters sheet is content-sized like every other sheet. Every control, option, default and range is unchanged; `apps/frontend/src/lib/lifeTracker/` is untouched.
3. The Life Tracker table (`PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx`) is not edited. The table re-check pair is recorded for information; no pixel count blocks the slice (REQ-202, A9); the owner reviews it.
4. Apply the REQ-202 and REQ-082 gate blocks to `PRD/sections/` by intent, once each. Then run the PRD promotion checklist below (execution happens in cleanup).

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/ConfirmSheet.tsx`

Also touched:

- apps/frontend/src/index.css (added lines only, audited)
- PRD/sections/ (REQ-202 and REQ-082 by intent)
- `docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `GameSetupPanel.test.tsx`, `CounterPanel.test.tsx` updated; new tests: names disclosure starts closed and Done only closes; Counters sheet is content-sized
- `git diff --stat BASE..HEAD -- apps/frontend/src/lib/lifeTracker apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx` is empty

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.04 per pair (initial; measure first, lower it only with evidence, never raise it to or above 0.05). States to pair: game-setup, reset-confirm, counters, counters-tab, table-recheck.

- [x] **F1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (game-setup, reset-confirm, counters, counters-tab, table-recheck) in docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [x] **F2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.04 (itself below 0.05); every mask region is named with a reason
- [x] **F3** `npm run quality:check` is green
- [x] **F4** `npm --workspace apps/frontend run test` is green
- [x] **F5** `npm --workspace apps/backend run test` is green
- [x] **F6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **F7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **F8** Profile-switch pair: the game-setup state in two different Theme colours at 390x844 is saved as `game-setup-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/, with every element recoloured and none left behind (observed)
- [x] **F9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [x] **F10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/ (absolute paths) is recorded in DIFF-RESULTS.md
- [x] **F11** Game Setup shows an Edit names disclosure that starts closed and a Done bar that only closes the sheet; every control, option, default and range is unchanged (tests plus observation)
- [x] **F12** The Counters sheet is content-sized, with no fixed tall frame, at both viewports (observed)
- [x] **F13** `git diff --stat BASE..HEAD` over `lib/lifeTracker/`, `PlayerLifeCard.tsx` and `PlayerLifeTrackerApp.tsx` is empty
- [x] **F14** The table re-check pair is saved at both widths with a diff number recorded for information only
- [x] **F15** `CounterPanel.tsx` carries no `zinc-` class (grep count 0)
- [x] **F16** `PRD/sections/` carries the REQ-202 and REQ-082 edits, each applied once

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/<state>-mask-390x844.json] [--tolerance N]
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

## PRD promotion checklist

Execution happens in cleanup; durable truth was already written at build.

- [ ] Every gate block (NFR-006, REQ-207, REQ-216, FLOW-011, REQ-124, REQ-079 retire set, REQ-070, REQ-206, REQ-167, REQ-209, REQ-215, REQ-214, REQ-202, REQ-082) is present in `PRD/sections/`, applied once
- [ ] `PRD/sections/quick-lookup`, `system-map.md`, `user-flows.md` and the README index carry the REQ-079 retire
- [ ] Receipt names the owner's side-by-side review as the final check; the code PR stays IN PROGRESS until then

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ui-look-translation/` ready to delete
