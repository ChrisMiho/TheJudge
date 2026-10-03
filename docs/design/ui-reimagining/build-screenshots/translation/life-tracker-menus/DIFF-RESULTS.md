# Slice F — Life Tracker menus: pair results

Screens: Life Tracker's Game Setup sheet, the Reset confirm, and a player's Counters sheet (both tabs). Visual source: `docs/design/ui-reimagining/direction-1/life-tracker-menus.html`.

Slice threshold: differing fraction at most 0.04 per pair (below the 0.05 ceiling), tolerance 12 per channel. Measured maximum 0.0218 (Counters, Counters tab, 390x844), so the planner's 0.04 is kept.

How the pairs are made: the same as `translation/frame/DIFF-RESULTS.md` (build in mock mode on 5411, the seeded-scene mockup copy on 5413, reduced motion, Blue, Playwright). Both sides start from the same four-player game at 40 life: Player 2 holds 3 Poison, 2 Treasure, 14 commander damage from Player 3 and a custom "Storm count" at 4. Each pair is compared inside the sheet (`contentBox`), so the page behind the sheet (the app's header banner against the mockup's, the blurred table) is not part of the number.

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| game-setup 390x844 | game-setup-mask-390x844.json | 12 | 0.00052 (88 / 169880) | 0.04 | PASS |
| game-setup 1440x900 | game-setup-mask-1440x900.json | 12 | 0.00056 (150 / 266240) | 0.04 | PASS |
| reset-confirm 390x844 | reset-confirm-mask-390x844.json | 12 | 0.00000 (0 / 9300) | 0.04 | PASS (see below: copy masked) |
| reset-confirm 1440x900 | reset-confirm-mask-1440x900.json | 12 | 0.00000 (0 / 11520) | 0.04 | PASS (see below: copy masked) |
| counters 390x844 | counters-mask-390x844.json | 12 | 0.00083 (106 / 127720) | 0.04 | PASS |
| counters 1440x900 | counters-mask-1440x900.json | 12 | 0.00078 (183 / 233472) | 0.04 | PASS |
| counters-tab 390x844 | counters-tab-mask-390x844.json | 12 | 0.02184 (4705 / 215450) | 0.04 | PASS |
| counters-tab 1440x900 | counters-tab-mask-1440x900.json | 12 | 0.01757 (6080 / 346112) | 0.04 | PASS |
| table-recheck 390x844 (information only) | table-recheck-mask-390x844.json | 12 | 0.26879 (66327 / 246760) | n/a | informational |
| table-recheck 1440x900 (information only) | table-recheck-mask-1440x900.json | 12 | 0.25774 (315477 / 1224000) | n/a | informational |

Pairs live beside this file as `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and `<state>-mask-<viewport>.json`.

## Reset confirm: the number needs its caveat

Unmasked, the reset-confirm pair measures 0.096 (390x844) and 0.122 (1440x900). The difference is words and a focus ring, not look: the shared confirm component keeps its own copy ("Every life total goes back to the starting life and all counters clear. Players, names, and settings stay.", "Keep" and "Reset", no glyph), where the mockup writes "back to 40", "Keep playing" and "↺ Reset" and focuses its first button on open. The button labels stay because REQ-070 freezes every control's accessible name; the body sentence is the app's own confirmation copy, not protected by any requirement, and whether to adopt the mockup's wording is an open owner question. So the region below the heading is masked as `confirm copy and focus ring` and only the heading and the sheet's surface are compared. This is a named deviation: copy and focus ring differ from the mockup on purpose; the owner can ask for the mockup's wording.

## Named mask regions (every one has its reason in the mask file)

- closed tray shadow and closed bottom sheets glow: as in `frame`.
- confirm copy and focus ring (reset-confirm only): see above.
- `contentBox` around the sheet on every Life Tracker menu pair: the page behind the sheet is the frame's job (slice A) and the Life Tracker table is unchanged.

## Table re-check (information only, F14)

`table-recheck-*` compares the Life Tracker table against the mockup's table (the build's table is pixel-unchanged by rule, REQ-202), so its fraction is not a gate and no pixel count blocks the slice. The before/after pair that matters is under `translation/life-tracker-table/`: the table captured after this slice differs from the pre-slice capture by 0.00015 (390x844) and 0.00007 (1440x900), two to nine anti-aliasing pixels, and `after-build-*` from slice C compares at exactly 0. The owner reviews that pair.

## Behaviour that wins over the mockup, and where the build differs on purpose

- The custom counter tile keeps both its remove ✕ and its ⋯ menu (set a number, take one away, clear), with the ✕ at the top-left. The mockup's custom tile shows only a ✕ at the top-right. REQ-202 keeps every control, so the ⋯ stays, and the ✕ moved left to make room.
- The mockup's "life-note" explanatory strip is not drawn (hidden on the mockup side of the pair as demo furniture).
- On a phone the mockup's tab strip is squeezed to a sliver when the sheet's content is tall (a layout fault in the mock); the build keeps the tab strip whole and scrolls the body instead. At the pair's state the tile rows line up within 0.022.
- The "New game" glyph keeps the danger colour in every theme colour (as in the mockup).

## REQ-216 audits

Command: the brief's verbatim `PAT` / `SKIP`, `BASE` = `ad63150` (the commit this slice started from).

- (a1) over `GameSetupPanel.tsx`, `CounterPanel.tsx`, `ConfirmSheet.tsx`: prints 0.
- (a2) over every line added under `apps/frontend/src` against `BASE` (working tree before the milestone commit): prints 0.
- `CounterPanel.tsx` carries no `zinc-` class (grep count 0, F15).
- `git diff --stat` over `lib/lifeTracker/`, `PlayerLifeCard.tsx` and `PlayerLifeTrackerApp.tsx` is empty against both `ad63150` and the package start `aeef8d3` (F13).

## Profile switch (F8)

`game-setup-profile-red-build-390x844.png` and `game-setup-profile-green-build-390x844.png` (with their mockup partners) show the Game Setup sheet in Red and Green. Observed: every accent, border, pill, glyph and the Done bar recolours; nothing is left in Blue.

## Gates

`npm run quality:check` exit 0 (0 errors, 12 existing warnings); frontend tests 1483 passed (145 files); backend tests 519 passed.

## Hygiene (F10)

The Playwright browser was closed with `browser_close`; the build server (5411, backend 3411), the mockup server (5413) and the capture collector (5414) were stopped; `lsof -i` on 5411, 3411, 5413 and 5414 returns nothing. Ports 5273, 3100 and 5300 were never touched. Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/life-tracker-menus/`.
