# GAMEPLAN — responsive-containment-and-density

Source: `DESIGN-BRIEF.md`; `DEC-145`–`DEC-148` and `REQ-120`–`REQ-125` in
`PRD/sections/decisions/{ui-presentation,conversation-ux,navigation}.md` and
`PRD/sections/functional-requirements.md`; inherited `DEC-128` / `REQ-106`.

## Architecture

Frontend presentation only. Eight slices, each closing one measured defect from
the 2026-08-05 Playwright MCP sweep. No backend, contract, prompt, schema, or
data-pipeline file is touched by any slice.

Three defects have a confirmed mechanical cause found during map-out, so the
slices that own them start from a known edit rather than an investigation:

1. **Composer collapse** — `useAutoGrowTextarea.ts:41` writes
   `height: ${min(scrollHeight, ceiling)}px`. For an inactive destination the
   textarea is unrendered, `scrollHeight` is `0`, and the window-resize handler
   pins `height: 0px`. The sizing effect depends only on `[value, textareaRef]`,
   so re-activation never recomputes.
2. **Banner overlap** — `index.css` offsets shell content by a hardcoded
   `2rem` (`.page-shell[data-mock-banner="true"]`), but the fixed banner wraps
   to two lines at narrow widths and measures 56px. The offset does not track
   the banner's rendered height, so headers with less top padding are covered.
3. **Tray overflow** — `.portal-menu-drawer` is `height: 100dvh` from a sticky
   `top: 0` origin inside a shell that starts below the viewport top, so the
   tray's own box ends up `100dvh + offset` and extends past the viewport bottom.

## Data flow

Unchanged. No slice alters `AskAiRequest`, Zod schemas, `GameContext`, stack
ordering, prompt assembly, providers, backend routes, card metadata, or scan
behavior. Every acceptance criterion is a rendered-geometry or computed-style
measurement plus existing unit coverage.

## Slice sequence

| Slice | Objective | Owns | Depends on |
| --- | --- | --- | --- |
| A | Auto-grow hook never pins a collapsed height | REQ-120 | — (parallel-ready) |
| B | Pre-submit composer composition | REQ-121, DEC-146 | A |
| C | Menu tray opacity, bounds, hit area | REQ-122, DEC-147 | — (parallel-ready) |
| D | Banner clears every destination header | REQ-123 | C |
| E | Viewport fill on both axes | REQ-124, DEC-145 | D |
| F | Card detail height reduction | REQ-125, DEC-148 | E |
| G | In-Depth roster containment | REQ-106, DEC-128 | — (parallel-ready) |
| H | Full-flow re-verification and ship gates | all | A–G |

Sequencing rationale — B after A because B's "no clipping at rest" criterion
cannot pass while the hook pins `0px`; D and E after C because all three edit the
same shell/tray rules in `apps/frontend/src/index.css` and would conflict at the
file level; F after E because its page-height budget depends on the shell's
vertical composition. A, C, and G touch disjoint files and carry no slice
prerequisite.

## Verification checklist

Every slice verifies with `npm run quality:check` (or the scoped workspace test
command while iterating) plus Playwright MCP measurement at **390×844** and
**1440×900**. Playwright means the MCP plugin (`browser_navigate`,
`browser_resize`, `browser_click`, `browser_evaluate`, `browser_take_screenshot`)
— **do not add `@playwright/test`**. Per `CLAUDE.md`, call `browser_close` when
browser verification for a slice is finished.

Baseline measurements to beat are recorded per slice and come from the sweep in
`README.md`.

## Non-goals (do not implement)

- Theme, typography, or brand redesign.
- Any change to Ask AI behavior, prompt assembly, payload shape, stack ordering,
  `GameContext`, Zod schemas, providers, or backend routes.
- A new `@playwright/test` CI harness.
- Changes to the conversation-history drawer or the answered-view follow-up
  composer — both measured correct and used as reference patterns.
- Moving Menu tray rows or changing DEC-135's full-bleed row geometry.
- Sticky or floating chrome over the card preview.
