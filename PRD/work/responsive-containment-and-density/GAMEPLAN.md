# GAMEPLAN — responsive-containment-and-density (re-refined)

Source: `DESIGN-BRIEF.md`; `DEC-150`–`DEC-153` / `REQ-127`–`REQ-132` and amended
`DEC-140`/`DEC-147`/`DEC-148`/`DEC-078`/`DEC-146`/`DEC-128`/`DEC-131`/`DEC-092`/`DEC-076`
in `PRD/sections/decisions/{navigation,ui-presentation,conversation-ux,personalization}.md`
and `PRD/sections/functional-requirements.md`. Supersedes the first-pass GAMEPLAN (slices
A/B/D/E/H already shipped and are not touched here).

## Architecture

Frontend presentation only. Six slices close `issues.md` #1–8 and re-verify the whole
package. No backend, contract, prompt, schema, or data-pipeline file is touched by any
slice.

Mechanical starting points found during map-out:

1. **Tray rail hit-through** — `.portal-menu-rail` sits at `z-index: 3` above the open
   drawer's `2`, so Menu/History stay hittable and visible while the tray paints beneath.
   DEC-150 replaces "let the trigger win the hit" with "hide the rail while open."
2. **Card density** — `CardPresentation.tsx` renders full-intrinsic-size images with an
   image↔metadata three-dot swap (`showMetadata` toggle); `ZoneCardPicker.tsx:246` lays
   added cards out in a `grid grid-cols-2` two-column list. DEC-151 replaces both: images
   shrink, a corner control opens an overlay popup instead of swapping the image away, and
   the zone list becomes a horizontal strip.
3. **Composer growth ceiling** — `useAutoGrowTextarea.ts:76` computes
   `window.innerHeight - top - margin`, i.e. viewport bottom, not "bottom of the UI below
   the field." Long input can grow the field until page chrome below it (submit row,
   destination footer) is pushed off-screen.
4. **Submit label** — `EnrichmentStep.tsx:554` (`label="Decrypt Stack"`) and
   `QuickLookupApp.tsx:537` (`label="Ask TheJudge"`) both pass a `ComposerSubmitButton`
   label that only renders at `sm+`; DEC-153 makes that label visible-by-default at every
   width for the *initial* submit only.
5. **Roster alignment** — DEC-128's containment fix (`min-w-0` shrink-safety) shipped, but
   product-owner review of PR #75 found the *expanded panel* itself misaligned relative to
   its player row on both viewports — a distinct defect from the resolved overflow one.

## Data flow

Unchanged. No slice alters `AskAiRequest`, Zod schemas, `GameContext`, stack ordering,
prompt assembly, providers, backend routes, or card metadata. Every acceptance criterion is
a rendered-geometry, computed-style, or copy/label measurement plus existing unit coverage.

## Slice sequence

| Slice | Objective | Owns | Depends on |
| --- | --- | --- | --- |
| C | Menu tray rail-hide while open (amends prior opacity/inset work) | REQ-127, DEC-150 | — (parallel-ready) |
| F | Compact card images + suite-wide detail popup | REQ-128, REQ-129, DEC-151 | — (parallel-ready) |
| I | Horizontal In-Depth zone-card strip | REQ-130, DEC-151 | F |
| G | In-Depth player-details alignment (mobile + desktop) | REQ-106, DEC-128 | — (parallel-ready) |
| J | Theme orb single row + centered Colorless options | REQ-131, DEC-152 | — (parallel-ready) |
| K | Send Request label + Enrichment ready copy | REQ-132, DEC-153 | — (parallel-ready) |
| L | Composer growth ceiling accounts for chrome below the field | REQ-110 (amended), DEC-131 | — (parallel-ready) |
| H | Full-flow re-verification and ship gates | all | C, F, I, G, J, K, L |

Sequencing rationale — I after F because the horizontal strip's tiles render through the
same `CardPresentation` component F changes to compact+popup; building I first would mean
redoing its tile markup once F lands. Every other new/updated slice (C, F, G, J, K, L)
touches a disjoint file set and carries no prerequisite among itself. H is last because it
re-verifies the whole package including the four already-shipped slices (A, B, D, E).

## Verification checklist

Every slice verifies with `npm run quality:check` (or the scoped workspace test command
while iterating) plus Playwright MCP measurement at **390×844** and **1440×900**.
Playwright means the MCP plugin (`browser_navigate`, `browser_resize`, `browser_click`,
`browser_evaluate`, `browser_take_screenshot`) — **do not add `@playwright/test`**. Per
`CLAUDE.md`, call `browser_close` when browser verification for a slice is finished.

`npm run quality:check` carries pre-existing, unrelated red (see `HANDOFF.md`): 902 lint
errors from two other sessions' registered git worktrees, 42 `format:check` hits inside
those same worktrees, and one `App.feedback.test.tsx` failure from ambient `.env` state.
None are this package's regressions — do not attempt to fix them here.

## Non-goals (do not implement)

- Theme, typography, or brand redesign beyond DEC-152's orb-row layout.
- Any change to Ask AI behavior, prompt assembly, payload shape, stack ordering,
  `GameContext`, Zod schemas, providers, or backend routes.
- A new `@playwright/test` CI harness.
- Changes to the conversation-history drawer or the answered-view follow-up composer —
  both measured correct and used as reference patterns; the follow-up send control stays
  arrow/icon-only (DEC-153 non-goal).
- Moving Menu tray rows, changing DEC-135's full-bleed row geometry, or reintroducing the
  trigger∩row proxy criterion (DEC-150 supersedes it).
- Sticky or floating chrome over the card preview.
- Independent per-player expansion, Life Tracker changes, or `gameContext` payload changes
  (roster alignment slice is presentation-only).
- Revisiting the DEC-145 48rem desktop shell width.
- Implementing or absorbing `chrome-tray-conversation-history-ux` slices.
