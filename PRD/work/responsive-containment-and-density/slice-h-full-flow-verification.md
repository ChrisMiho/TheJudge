# Slice H — Full-flow re-verification and ship gates

## Status: done

## Goal

Re-run the full audit sweep end to end at both viewports after slices C, F, I, G,
J, K, and L land, confirm every measured defect from `issues.md` #1–8 is closed
and nothing shipped in the first pass (A, B, D, E, and the earlier sweep below)
regressed, then close the package.

## Requirements

1. Walk every flow the original sweep and this re-refinement cover, at 390×844
   and 1440×900: Quick Question; In-Depth Question (game context → zone
   confirmation → zone collection → card detail → enrichment → question →
   answered workspace); Life Tracker; Trade Balancer; Menu tray (rest + open);
   conversation history drawer.
2. Re-measure every `issues.md` #1–8 item against its slice's acceptance criteria
   and record before/after values in this doc.
3. Confirm the first-pass fixes (composer collapse, composer composition, banner
   clearance, shell width, roster containment) have not regressed — see "Prior
   full-flow sweep" below for the baseline to hold.
4. Confirm the reference surfaces the package deliberately did not change —
   `ConversationHistoryDrawer` and the answered-view `FollowUpComposer` (icon-only
   send control at every width) — still behave as measured.
5. Record the PRD promotion checklist for cleanup (execution happens in cleanup,
   not here).

## Acceptance criteria

- [x] Every acceptance criterion in slices C, F, I, G, J, K, L verified in one
      continuous session at both viewports, with measured values recorded in this
      doc
- [x] Every regression check carried from the first pass (A, B, D, E, prior G)
      still holds — see "Prior full-flow sweep" table below
- [x] No horizontal document overflow on any flow at either viewport
- [x] No element in any flow has `scrollWidth > clientWidth` with content clipped,
      excluding intended horizontal-scroll regions (zone-card strip)
- [x] History drawer still opens opaque over a scrim and still blocks interaction
      beneath
- [x] Answered-view `FollowUpComposer` geometry and icon-only send control are
      unchanged from the baseline sweep
- [x] `npm run quality:check` green for touched areas (pre-existing worktree/env
      red per `HANDOFF.md` is not a regression to fix here)
- [x] `browser_close` called when browser verification is finished (`CLAUDE.md`)
- [x] Package set to `ship-ready`: `STATUS.ship-ready` marker, README
      `status: ship-ready`, board row under `## ship-ready`

## Verification record (2026-08-05/06)

Implemented and verified slices C, F, G, I, J, K, L in one continuous session
(dispatched in parallel per `thejudge-implement-parallel`, then independently
re-verified and, in three cases, corrected by the orchestrator — see notes).
Full measured evidence:

**Slice C (DEC-150, rail-hide while open)** — Redesigned mid-session from
"unmount the rail while open" to "keep the rail mounted, made paint/hit-test
inert via `visibility: hidden` + `pointer-events: none` + `aria-hidden`/
`tabIndex={-1}`," because the unmount approach silently broke an unrelated
existing test (`App.feedback.test.tsx`'s focus-restore-to-portal-trigger
check) by destroying and recreating the trigger's DOM node across the
open/close cycle. Verified via Playwright at both viewports on Quick Question
(History-bearing rail) and Trade Balancer (Menu-only rail):
`document.elementFromPoint` over the former Menu/History icon centers does not
resolve to either control (falls through to tray rows or destination content);
neither icon is visible in a screenshot while open; Escape and outside-click
both close the tray and restore the rail (same DOM node, confirmed via
`document.body.contains`); rest-state hit areas and DEC-137 geometry
unchanged.

**Slice F (DEC-151 parts 1–2, compact image + popup)** — `CardSelectionPreview`
refactored to compose `CardPresentation` directly (previously a parallel
implementation with its own 80%-width image and always-visible oracle
text/metadata list). Verified: zone-collection "Add card" action `top` is
683px at 390×844 (baseline 1088px pre-DEC-148, 956px after that pass, ≤844px
target now cleared with margin); corner detail control (`ⓘ`) present on every
image-bearing surface (zone-collection tiles, `CardSelectionPreview`,
enrichment card rows, `ScanReviewBubble`); popup opens with oracle
text/mana/type/colors and a working X close, image stays mounted underneath;
no new network request fires when the popup opens (`performance.getEntriesByType('resource')`
count unchanged, 127→127); missing-image fallback unchanged in content.

**Slice G (DEC-128, roster alignment)** — Reproduced-first per the slice's own
instruction: measured the previously-reported "expanded panel misaligned
relative to its player row" defect at 390×844, 768×1024, and 1440×900 with 2
and 3 active players, secondary details expanded. Found **zero** misalignment
in every case (`leftDelta`/`widthDelta` both 0px) — `PlayerRosterEditor`
already renders the name/life row and the secondary-details region as direct
siblings inside the same bordered card, so they share the card's box model
with no independent offset. This is a structural guarantee already in the
component, not something the fix needed to add. No production code changed;
added a regression test (`PlayerRosterEditor.test.tsx`) that asserts the
sibling-within-same-card structure directly, since jsdom cannot compute real
layout to assert pixel alignment the way Playwright can. Overflow/scrollWidth
regression checks from the first pass still hold (0 overflowing nodes at
390×844 with 3 players expanded).

**Slice I (DEC-151 part 3, horizontal zone strip)** — `.zone-card-grid`
changed from `grid grid-cols-2 gap-2 overflow-y-auto` (with a `max-height:
70dvh` CSS cap) to `flex gap-2 overflow-x-auto` (tiles `w-40 shrink-0`).
Verified with 3 cards added to Battlefield at 390×844: strip
`scrollWidth`/`clientWidth` = 492/265 (region overflows and scrolls
horizontally as intended); `document.documentElement.scrollWidth`/`clientWidth`
= 390/390 (page itself does not overflow); tile order left-to-right matches
add order (Lightning Bolt, Counterspell, Giant Growth); removing a tile
updates the strip immediately; strip tiles show the slice F corner control.
Confirmed visually at both viewports (screenshot).

**Slice J (DEC-152, Theme orb row)** — All six orbs measured on one row at
390×844: identical `top` (339px) across all six, 40×40px each, row width
231px, zero overflow. Colorless custom-color input + Reset centered under the
row (row center 144.10px, controls center 144.11px, Δ≈0.004px). Non-Colorless
selection hides the Colorless-only controls (confirmed no custom-input/Reset
in DOM after selecting Blue).

**Slice K (DEC-153, Send Request label)** — Both initial-submit controls
(Enrichment decrypt, Quick Question ask) show visible **Send Request** text at
390×844 and 1440×900 with `aria-label` preserving Ask/Decrypt accessible
semantics. First pass landed at 43.5% field-width ratio (below REQ-121's 65%
floor) because the wider label plus an inline counter overran the row budget;
fixed by stacking the character counter above the submit control (instead of
beside it as a third flex sibling) and trimming the control's mobile
padding/font — re-measured at 65.2% (217px/333px), clearing the floor with the
submit control still meeting the 44px touch-target floor. Enrichment
ready-state helper text gets "No message needed — tap Send Request below when
you're ready." only when the optional question is blank. Follow-up composer
(`FollowUpComposer`) confirmed unchanged — icon-only, empty `textContent`,
`aria-label="Send"`.

**Slice L (DEC-131/REQ-110, composer growth ceiling)** — Typed a 10-line
question into the Enrichment optional-question field at 390×844:
`document.documentElement.scrollHeight` equals `window.innerHeight` exactly
(844/844, no page scroll induced) and the submit control's bounding box stays
fully within the viewport (top 617px, bottom 661px). One-line floor
(`measureSingleLineHeight`) and re-activation behavior unchanged per existing
unit tests.

**Regression checks (first pass A/B/D/E + reference surfaces):**

- Life Tracker at 390×844: banner clears the header (screenshot), one-screen
  life-table fit holds, Menu-only rail unobstructed.
- Trade Balancer at 390×844: no horizontal document overflow.
- Desktop shell at 1440×900 (In-Depth game context): screenshot shows the
  `min(48rem, 92vw)` cap holding (paired Turn phase/Active player controls
  side by side, primary CTA reads as a button not a band) — DEC-145 unchanged.
- Conversation history drawer: opens opaque (`rgb(9, 9, 11)`) with a scrim,
  blocks interaction beneath; `documentElement.scrollWidth === clientWidth`
  (390/390) while open.
- `FollowUpComposer` (answered-view follow-up composer): send control
  confirmed icon-only (empty text content, `<svg>` only) — untouched by this
  package, as required.

**Suite/typecheck evidence:**

- `npm --workspace apps/frontend run test`: 1205/1206 passing. The one red
  (`App.feedback.test.tsx` > "keeps submit a no-op with a hint when no form id
  is configured") is pre-existing and confirmed unrelated to this package —
  reproduced identically on a clean `git stash`-restored baseline at commit
  `7aa8a16` (before any of this package's slice C/F/G/I/J/K/L code existed),
  matching `HANDOFF.md`'s documented ambient-`.env` note.
- `npm --workspace apps/backend run test`: 271/271 passing (backend untouched
  by this frontend-only package, confirmed unaffected).
- `npx tsc --noEmit` clean in both workspaces.
- `npm run quality:check`: the chained script's `lint` step exits non-zero
  before reaching `format:check`/`coverage:check`, because of the
  pre-documented 900+ lint errors and 42 format hits sourced entirely from
  other registered git worktrees under `.claude/worktrees/agent-*` (confirmed
  by filtering the offending file paths — 100% resolve to worktree-prefixed
  paths, zero inside this checkout's own tree). Ran the equivalent checks
  directly against every file this package touched instead: `npx eslint
  <touched files>` → zero errors/warnings; `npx prettier "**/*.{json,yml,yaml}"
  --check` (the project's actual `format:check` scope; TS/TSX/CSS are not part
  of that gate) → zero real hits outside the same worktree pollution.

**Session note:** mid-session, a concurrent process sharing this checkout
(non-isolated per the task's own instruction) switched the working tree to an
unrelated branch while uncommitted work was in progress. Recovered in full via
a dangling `git stash` object (`git fsck --dangling` + `git stash apply
<sha>`) after confirming the branch/commit history itself was untouched; the
small amount of post-stash work (the slice C redesign above) was redone from
memory and re-verified. Two checkpoint commits were pushed immediately after
recovery to minimize any further exposure to working-tree collisions.

## PRD promotion checklist (executed by cleanup, not this slice)

- `PRD/sections/system-map.md` — flip the shipped-vs-planned signal for the
  card-presentation, tray, Theme, and submit-label entries per the system-map
  promotion gate in `doc-lifecycle.md` (product code exists **and** a cleanup
  receipt exists)
- `PRD/sections/decisions/{navigation,ui-presentation,conversation-ux,personalization}.md`
  — DEC-150 through DEC-153 stay as confirmed product truth; DEC-148 stays
  `superseded`
- `PRD/sections/functional-requirements.md` — REQ-127 through REQ-132 stay;
  amended REQ-106/REQ-110/REQ-122/REQ-125 stay in their amended form
- Receipt at
  `PRD/instructions/receipts/responsive-containment-and-density-<YYYY-MM-DD>.md`
  written **before** the work folder is deleted
- Delete `PRD/work/responsive-containment-and-density/` and remove its row from
  `PRD/work/STATUS.md`

## Verification

```bash
npm run quality:check
```

Plus the full Playwright MCP sweep described above.

## Files touched

- `PRD/work/responsive-containment-and-density/` status files and this doc
- `PRD/work/STATUS.md`

## Dependencies

- Slices C, F, I, G, J, K, L — this slice verifies their combined result.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change (no
      `AskAiRequest`/Zod schema/prompt/backend route change anywhere in the
      package; confirmed by scope of touched files, all frontend presentation)
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete (promotion
      itself executed by `thejudge-cleanup`, not this slice, per the PRD
      promotion checklist above)

## Prior full-flow sweep (2026-08-05) — regression baseline, not this slice's scope

Full sweep re-run at 390×844 and 1440×900 across Quick Question, In-Depth Question
(game context → zone confirmation → zone collection → card detail → enrichment →
question → answered workspace), Life Tracker, Trade Balancer, the Menu tray, and
the history drawer, before the re-refinement in `issues.md`.

| # | Finding | Before | After | Status |
| --- | --- | --- | --- | --- |
| F1 | Composer pins `height: 0px` | 12px client vs 32px scroll, 20px clipped | 32/32, 0px clipped | closed |
| F2 | Composer field starved | 40% of row (136/340) | 65.6–68.4% | closed |
| F3 | Tray translucent, content ghosts through | `rgba(…,0.95)`, 10 elements visible through | alpha 1, none visible | closed |
| F3 | Trigger paints on first row | ☰ over "Quick Question" | label clears the rail band | closed (superseded by DEC-150 rail-hide in slice C) |
| F4 | Banner covers headers | 24/9/12px Life Tracker, 11px Trade Balancer | none | closed |
| F5 | Shell width | 670px (53% unused) | 768px (47% unused) | closed |
| F5 | Vertical dead space | 359px | 359px | accepted (DEC-145) |
| F6 | Add action below fold | 244px below | 112px below | superseded by DEC-151 density path (slices F/I) |
| F7 | Roster rows break panel | 6 nodes clipped, ▾ 8px past border | 0 / 0 | closed, alignment defect open (slice G) |

Frontend suite was 1187/1188 with the single pre-existing `App.feedback` env
failure. `browser_close` was called at the end of that sweep.
