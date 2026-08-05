# DESIGN-BRIEF: mobile-player-details-overflow

Status: approved (user explicit approval of kickoff plan 2026-08-04).

## Problem

On mobile viewports in In-Depth Question's game-context step, expanding synchronized
secondary player details (Poison, Energy, Experience, Commander damage, named counters)
causes the expanded player boxes to slide horizontally off the page. Desktop composition
is acceptable; the defect is mobile containment only and blocks editing player context
on phones.

## Outcome

When secondary player details are expanded below the `sm` / phone-width viewport,
every expanded player card and its controls remain fully within the viewport width with
no horizontal document overflow. Debug, root-cause confirmation, and post-fix visual
verification use Cursor's Playwright MCP plugin (`plugin-playwright-playwright`) at a
phone-sized viewport (e.g. 390×844). No new `@playwright/test` CI harness is introduced
unless a later decision adds one.

## Confirmed choices

| Question | Choice |
| --- | --- |
| Scope surface | In-Depth Question game-context roster extras only (`MtgAssistantApp` `renderPlayerExtras` + `PlayerRosterEditor` chrome as needed) |
| Desktop changes | Incidental shared safety only (`min-w-0`, wrapping) — no deliberate redesign of `sm+` composition |
| Verification method | Playwright MCP: resize → navigate → expand → screenshot + overflow measurement; re-verify after fix |
| CI Playwright harness | Out of scope — do not add `@playwright/test` |
| Behavior / data | Unchanged DEC-120 disclosure semantics, player values, `GameContext`, Ask AI |
| Life Tracker / chat shell | Out of scope |

## Product truth

| ID | Role |
| --- | --- |
| DEC-128 | New — mobile containment for expanded In-Depth secondary player details; presentation-only; refinement of DEC-120 / DEC-117 |
| REQ-106 | New — acceptance: no horizontal overflow when secondary details expanded on narrow viewports; Playwright MCP verify path |
| REQ-100 / DEC-120 | Unchanged disclosure semantics; this package only fixes layout containment when expanded |
| DEC-117 / REQ-096 | Automatic fluid responsive CSS remains the mechanism — no JS viewport modes or duplicate trees |
| FLOW-001 | Edge/notes amended for mobile containment when secondary details expand |

## Implementation pointers (non-normative)

- Likely overflow sources: fixed-width inputs (`w-28` / `w-20`), flex children without `min-w-0`, or grids that do not shrink below content min-width inside [`MtgAssistantApp.tsx`](../../../apps/frontend/src/components/portal/MtgAssistantApp.tsx) `renderPlayerExtras` and [`PlayerRosterEditor.tsx`](../../../apps/frontend/src/components/PlayerRosterEditor.tsx).
- Confirm root cause with Playwright MCP before locking CSS (Slice A).
- Prefer mobile-first Tailwind (`min-w-0`, `w-full` / fluid widths under `sm:`, wrapping grids) over clipping with `overflow-x-hidden` on the page shell unless measurement proves clip-only is required.
- Existing Vitest coverage in `PlayerRosterEditor.test.tsx` / interaction flows may gain a narrow class or layout assertion only if stable; Playwright MCP remains the primary overflow evidence.

## Non-goals

- Desktop roster redesign beyond incidental shared safety
- Life Tracker UI, chat shell, portal chrome
- Changing player-count bounds, secondary-details synchronization, or default/reset behavior
- `AskAiRequest` / Zod / `GameContext` / prompt / backend changes
- Adding a Playwright test package to CI

## Verification (package-level)

1. Playwright MCP at ~390×844: In-Depth → expand **Players in game** → expand secondary details → document `scrollWidth <= clientWidth`; expanded cards fully visible in screenshots.
2. Spot-check at `sm+` width that the three-column poison/energy/experience row still composes as today.
3. `npm run quality:check` (or frontend workspace equivalent for touched areas) green.
