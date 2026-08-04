# DESIGN-BRIEF: center-menu-tab-prominence

Status: approved (user explicit approval 2026-08-04).

## Problem

The feature-portal Menu tab was originally hard to notice at top-middle. Refinement moved past a
narrow "widen and glow it" fix (approved 2026-08-03, never implemented) into a bigger pivot:
relocate Menu off the header row entirely, into a corner-anchored trigger with a sliding drawer.
That pivot also surfaced two more header problems worth fixing at the same time: the brand block's
center placement read as visually off-center once the trigger moved to a corner, and the
step-name text opposite it (top-right) read as a disconnected floating label rather than
integrated chrome.

## Outcome

Restructure the app-chrome header for every destination screen:

1. **Menu trigger relocates to a top-left edge-strip rail** — a radial-gradient glow anchored at
   the header's top-left corner, fading to fully transparent inside its own bounding box. No
   border, no separate button/pill rendered on top of the glow; the glow area itself is the
   trigger, same click target and role as today's Menu button.
2. **Opens a partial-height drawer that slides in horizontally from the left edge** (`transform:
   translateX`), not a dropdown box and not a flyout that appears to drop from a seam under the
   header. Stays docked inline per-screen — the drawer and rail are not fixed-to-viewport chrome,
   preserving DEC-109's "never floats fixed" guarantee.
3. **Brand block moves to true center** of the header row.
4. **Step-name text drops the top-right header slot and becomes an in-flow eyebrow label** — a
   small, uppercase label in the same accent gradient family as the brand block, sitting directly
   above each step's own heading/first line of content instead of living in header chrome. Carries
   the same `stepName` values used today (REQ-045's content is unchanged, only its position
   moves). Stays empty on Life Tracker and the conversation view, matching today's behavior.

Root-cause note carried forward into the brief: the header grid (`1fr auto 1fr`) was always
mathematically centered — what read as "off-center" was a visual-weight mismatch between a
solid glowing rail on one side and bare text of varying width on the other. Moving the step-name
out of the header removes that mismatch and resolves the centering complaint without any special
centering logic.

## Confirmed choices

| Question | Choice |
| --- | --- |
| Trigger visual treatment | Radial-gradient corner fade, no border, no separate button-on-glow (rejected: floating pill-shaped tab; rejected: hard-edged bordered rectangle) |
| Tray shape | Partial-height drawer (rejected: compact flyout, full-height sidebar) |
| Tray motion | Slides in horizontally from the left edge (rejected: dropping from a header seam) |
| Docking behavior | Inline per-screen, never fixed to viewport (preserves DEC-109) |
| Trigger hit area | Edge strip (rejected: corner-tab-only, full-height edge) |
| Brand placement | True center of header row |
| Step-name placement | Eyebrow label above each step's own content heading (rejected: kept top-right with only rebalancing; rejected: mirrored right-edge rail; rejected: folded into the card's own heading, to preserve REQ-045's existing heading structure) |
| Step-name content | Unchanged — same step-name strings as REQ-045/DEC-067 today |
| Life Tracker / conversation view | No step-name slot, unchanged from today |

## Product truth

| ID | Role |
| --- | --- |
| DEC-122 | New decision amending DEC-095/DEC-109/DEC-110/DEC-121's placement/interaction clauses for the corner-rail, sliding drawer, centered brand, and eyebrow step-name |
| REQ-045 | Amended — step-name now renders as an eyebrow label above step content, not inline in the header row |
| REQ-067 | Amended — Menu trigger placement moves top-middle → top-left corner rail; drawer replaces dropdown |
| REQ-089 | Amended — "docks flush" language now describes the corner rail, not a top-middle tab |
| REQ-101 | Superseded outright by DEC-122 — the widen-and-glow trigger prominence pass was never implemented and does not apply to the rebuilt rail trigger, which uses a different visual language (radial fade vs. border + glow ring) |
| DEC-117 / REQ-096 | Automatic responsive presentation — unchanged, still governs rail/drawer sizing across viewports |
| NFR-001 / NFR-006 | Touch target minimum and reduced-motion — unchanged, apply to the rail hit area and drawer slide transition |

No new FLOW — the navigation interaction (open Menu, pick a destination, land on it) is unchanged;
only its visual presentation changes.

## Implementation pointers (non-normative)

- Trigger + dropdown structure lives in `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
  (currently pre-DEC-121 plain classes on the button; nothing from prior scope has landed in code).
- Rail treatment: radial-gradient anchored at 0% 0%, fading through decreasing alpha stops to fully
  transparent well inside its own bounding box; `border: none`. Same technique for hover/expanded
  states, darkening the same gradient rather than adding a border.
- Drawer: `position: absolute`, closed state `translateX(-100%)`, open state `translateX(0)`,
  transition on `transform` only (not `max-height`), so it visibly originates from the left edge.
- `apps/frontend/src/components/BrandMark.tsx`, `StagedStepHeader.tsx` — recenter brand block in
  the header grid; remove the right-hand step-name column from the header row.
- Step-name eyebrow: reuses `stepName` prop already threaded into `StagedStepHeader`, just
  relocated in the render tree to sit above each step's own heading/first content line rather than
  in the header grid. Each staged step component (`ZoneConfirmStep.tsx`, `ZoneCollectionStep.tsx`,
  `EnrichmentStep.tsx`, game-context step, `TradeBalancer.tsx`) renders it in that new position.
- `apps/frontend/src/index.css` — new rail/drawer classes; retire `.portal-slot-tab`'s top-middle
  flush treatment and `.staged-step-name`'s header-row positioning in favor of the corner rail and
  eyebrow classes.
- Rail/drawer pixel dimensions are an implementation detail sized against the real header (not the
  refinement mockup's eyeballed values), constrained only by NFR-001's 44px touch-target minimum —
  not a product decision requiring further sign-off.
- Reduced-motion: drawer slide respects `prefers-reduced-motion` (snap open/closed instead of
  animating the transform), per NFR-006, no new decision needed.

## Non-goals

- Redesigning the dropdown/drawer's contents, the destination registry, or the Theme section
  (DEC-095/DEC-104/DEC-110 unchanged)
- Consolidating `EnrichmentStep.tsx`'s separately-duplicated brand-block JSX (pre-existing code
  duplication, unrelated to this visual pivot — left for a future code-health pass)
- Carrying forward any part of DEC-121's widen-and-glow visual treatment (border thickness, glow
  ring) — superseded outright, not partially reused
- A step-progress indicator (dots/breadcrumb) replacing the step-name text — explicitly out of
  scope for this pass
- Backend, contract, prompt, scan, or destination-behavior changes

## Success check

Every destination header reads as visually centered on the brand block regardless of screen; the
Menu trigger is discoverable as an integrated corner affordance, not a pasted-on box or floating
pill; the step name (where present) reads as part of the screen's own content rather than as
disconnected header chrome; Life Tracker and the conversation view are unaffected by the missing
step-name slot.
