# DESIGN-BRIEF: responsive-containment-and-density

Status: approved (explicit user approval of the design summary, 2026-08-05).

## Problem

A Playwright MCP sweep of all four portal destinations at 390×844 and 1440×900
(2026-08-05) found the shell leaking in three ways.

**It clips its own content.** The shared pre-submit composer pins itself to
`height: 0px` and hides 20px of the user's typed question, showing only a sliver of
glyph tops. At phone widths the same composer's field is starved to 40% of its row by
an inline labelled button. In-Depth player rows overflow their panel by 34px.

**Overlays blend with what they cover.** The Menu tray is translucent with no scrim,
so ten destination-content elements stay legible through it and the tray's own trigger
sits on top of the first destination row. The mock-mode banner covers header controls
on the two full-bleed destinations.

**It wastes the space it owns.** 53% of desktop width and 41–43% of both viewports'
height sit empty, while the primary "Add card" action is stranded 244px below the
mobile fold behind a full-size preview and oracle text duplicated from the card art.

## Outcome

Every destination renders its content fully inside its own box at phone and desktop
widths; overlays occlude what they cover; and the shell uses the viewport it is given.
Each fix is verified with Playwright MCP measurements at both viewports before and
after — the same method that produced the evidence — with no new `@playwright/test`
CI harness.

## Confirmed choices

| Question | Choice |
| --- | --- |
| Package scope | All six sweep findings plus the absorbed roster-containment defect |
| Absorbed package | `mobile-player-details-overflow` folded in and deleted; its `DEC-128` / `REQ-106` already live in `PRD/sections/` and carry forward unchanged |
| Dead space (F5) | Both axes, fluid — new `DEC-145` supersedes `DEC-131`'s deferral; shell cap `min(90rem, ~92vw)` (≥1200px measured at 1440×900) |
| Composer composition (F2) | Match the shipped `FollowUpComposer`: full-width field, inline counter, compact circular submit |
| Card detail (F6) | Shrink preview image and drop duplicated oracle text; no sticky CTA bar |
| Verification | Playwright MCP at 390×844 and 1440×900; no `@playwright/test` harness |

## Product truth

| ID | Role |
| --- | --- |
| DEC-145 | New — shell fills the viewport on both axes; supersedes DEC-131's dead-space / shell-redesign non-goal |
| DEC-146 | New — pre-submit composers adopt the `FollowUpComposer` composition; amends DEC-131's composer clause |
| DEC-147 | New — open tray opaque against all destination content, bounded to the viewport, and first-row hit area clears the rail band; extends DEC-140 and DEC-135's inset, no row geometry change |
| DEC-148 | New — narrow-viewport card detail caps preview height and drops duplicated oracle text |
| REQ-120 | New — auto-grow composer survives destination switch + resize |
| REQ-121 | New — composer row composition |
| REQ-122 | New — opaque, bounded tray without trigger overlap |
| REQ-123 | New — banner clears every destination header (enforces DEC-085) |
| REQ-124 | New — viewport fill on both axes |
| REQ-125 | New — reachable add action in card detail |
| DEC-128 / REQ-106 | Inherited from the absorbed package — mobile roster containment, unchanged |
| REQ-110 / DEC-131 | Unchanged growth behavior; REQ-120 adds the collapsed-height case |
| DEC-085 | Unchanged banner decision; REQ-123 makes its offset guarantee measurable |
| DEC-140 | Unchanged occlusion intent; DEC-147 extends it past rail chrome |
| DEC-117 / NFR-001 | Unchanged mechanism — fluid CSS on one tree, no JS device modes |
| FLOW-001 | Edge cases and notes amended for REQ-120 and REQ-125 |

## Findings → requirements

| Finding | Measured evidence | Lands on |
| --- | --- | --- |
| F1 composer pins `height:0px` | `clientHeight` 12 vs `scrollHeight` 32; 20px clipped | REQ-120 |
| F2 field starved on mobile | 136px of a 340px row (40%); placeholder clipped 20px | REQ-121 / DEC-146 |
| F3 tray translucent, overlapping, oversized | `scrimPresent:false`; 10 elements ghost through; 88px trigger overlap; bottom 889 vs 844 and 957 vs 900 | REQ-122 / DEC-147 |
| F4 banner covers headers | 24px / 9px / 12px (Life Tracker), 11px (Trade Balancer); 3 banner nodes | REQ-123 |
| F5 dead space | 770px (53%) horizontal, 366px (41%) vertical desktop; 359px (43%) mobile | REQ-124 / DEC-145 |
| F6 CTA below fold | "Add card" at y=1088 on 844px viewport; page 1286px | REQ-125 / DEC-148 |
| F7 roster overflow (absorbed) | row 322px in a 288px box; ▾ 8px past panel border | REQ-106 / DEC-128 |

## Implementation pointers (non-normative)

- **F1 root cause is known.** [`useAutoGrowTextarea.ts:41`](../../../apps/frontend/src/hooks/useAutoGrowTextarea.ts)
  reads `textarea.scrollHeight` on window resize. For an inactive destination the
  textarea is unrendered, so `scrollHeight` is `0` and the handler writes
  `height: 0px`; the sizing effect depends only on `[value, textareaRef]`, so
  re-activation never recomputes. Guard the unrendered case and re-measure on
  activation — keep the fix in the shared hook (DEC-131 prefers one implementation).
  Repro: load → switch destination → resize → switch back.
- **Two correct in-app patterns already exist.** `ConversationHistoryDrawer` renders
  opaque over a dimming scrim and blocks pointer events beneath (target for DEC-147);
  `FollowUpComposer` gives its field 230px at a 390px viewport using a circular send
  control (target for DEC-146). Prefer aligning to these over inventing new treatments.
- Likely surfaces: `PageShell.tsx` and `index.css` (`.mock-mode-banner`,
  `data-mock-banner` offset, `.portal-shell-bounds`), `FeaturePortalMenu.tsx` /
  `.portal-menu-drawer` (tray), `CardPresentation.tsx` (card detail),
  `MtgAssistantApp.tsx` `renderPlayerExtras` and `PlayerRosterEditor.tsx` (roster).
- Prefer mobile-first fluid Tailwind (`min-w-0`, `min()` caps, flex/grid fill) over
  clipping with `overflow-x-hidden` on the shell.
- Existing Vitest suites (`PlayerRosterEditor.test.tsx`, `MockModeBanner.test.tsx`,
  `FeaturePortalMenu.test.tsx`, `ConversationWorkspace.test.tsx`) can carry stable
  assertions; Playwright MCP measurement remains the primary geometry evidence.

## Non-goals

- Theme, typography, or brand redesign.
- Any change to Ask AI behavior, prompt assembly, payload shape, stack ordering,
  `GameContext`, Zod schemas, providers, or backend routes.
- A new `@playwright/test` CI harness.
- Changes to secondary-details disclosure semantics, player-count rules, or the
  character caps and blank-question fallback.
- Changes to the conversation-history drawer or the answered-view follow-up composer —
  both measured correct and serve as reference patterns.
- Edge-to-edge desktop text with no maximum reading measure.
