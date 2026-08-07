# DESIGN-BRIEF: ui-review

Status: approved (explicit user approval 2026-08-06).

## Problem

`braindump.md` lists ten concrete UI issues observed live across the Quick Question
card-search flow and In-Depth player/game panels. Code grounding during refinement found
that three of the ten issues (card detail popup, View Context outside-click dismiss,
player-details triangle icon) already have the *mechanism* implemented per DEC-151/DEC-142/
DEC-120, but the product owner confirmed all ten are still observed broken live — so those
three are scoped as verify-and-fix defects, not net-new builds. `screen-layout.md` (DEC-149)
is the layout guardrail for every sizing/containment change here, per this package's problem
framing.

## Outcome

Seven requirements (REQ-133–139) close the bug list without inventing a new design system
pass: the card-image area consolidates around the existing DEC-151 corner popup, the
question-composer character counter is fixed to actually track edits, View Context gets a
themed close icon and a verified outside-click dismiss, the answered-workspace gap above
the conversation shrinks, the In-Depth player-expand triangle is verified/fixed, commander
damage gets a tighter layout, and poison/energy/experience become bounded stacked dropdowns.
One new decision (DEC-156) records the three presentation changes that go beyond a pure
bugfix (card-area consolidation, close-icon convention, dropdown counter shape).

## Confirmed choices

| Question | Choice |
| --- | --- |
| Already-implemented-looking items (popup, outside-click, triangle) | Still broken live per product owner — scope as verify-and-fix, not drop |
| Counter backspace/stuck-at-35 bug location | Quick Question's pre-submit question composer only (`QuickLookupApp`); `EnrichmentStep`'s duplicate composer pattern gets a check-and-fix-if-reproducible note, not full scope |
| Commander damage control shape | Tighter layout only — stays a plain numeric input, no dropdown, no cap |
| Poison/energy/experience control shape | Stack vertically; bounded dropdown/select (poison 0–11, energy 0–100, experience 0–100); does **not** reuse Life Tracker's `CounterControl` tap/hold stepper — different interaction model by design |
| Card-area rework end state | Remove card is the only control left beside the image, moved smaller, below it; everything else lives in the existing DEC-151 popup |
| Scope boundary | Bugfix/tuning pass only — no new `screen-layout.md` row, no new design system, no revisiting `responsive-containment-and-density` (ship-ready, separate) |

## Product truth

| ID | Role |
| --- | --- |
| DEC-156 | New — card-area popup consolidation, themed close icon, bounded dropdown counters |
| REQ-133 | New — card area consolidation around the corner detail popup |
| REQ-134 | New — question composer character counter integrity |
| REQ-135 | New — View Context close affordance + outside-click reliability |
| REQ-136 | New — answered-workspace vertical density above the conversation |
| REQ-137 | New — In-Depth player-details expand affordance correctness |
| REQ-138 | New — commander damage entry tighter layout |
| REQ-139 | New — poison/energy/experience stacked bounded controls |
| DEC-151 / DEC-142 / DEC-120 / DEC-102 / DEC-149 | Unchanged; this pass fixes live defects against them and tunes presentation within them |
| `screen-layout.md` | Unchanged — no new screen/overlay row; existing "Card detail popup", "Quick Question — answered workspace", and "In-Depth — Game context" rows already cover these surfaces |

## Braindump → requirements

| braindump item | Lands on |
| --- | --- |
| Quick Question 1: card image too small | REQ-133 |
| Quick Question 2: rework area beside image / Remove card | REQ-133 |
| Quick Question 3: text overlay too small, should be a popup | REQ-133 (popup already exists per DEC-151; consolidation removes the duplicate sidebar) |
| Quick Question 4: counter doesn't decrement / sticks at 35 | REQ-134 |
| Quick Question 5: click outside View Context to close | REQ-135 (verify-and-fix against DEC-142) |
| Quick Question 6: inelegant close button, should be themed X | REQ-135 |
| Quick Question 7: gap above "Quick question" once conversation starts | REQ-136 |
| In-depth 1: expand control should read as a triangle | REQ-137 (verify-and-fix against DEC-120) |
| In-depth 2: commander damage awkward "From" + box layout | REQ-138 |
| In-depth 3: poison/energy/experience waste space, want stacked dropdown | REQ-139 |

## Non-goals

- A new design system pass or pixel-perfect fidelity.
- Revisiting `responsive-containment-and-density` (already ship-ready, separate scope).
- Re-deriving `sections/screen-layout.md` / DEC-149 / REQ-126 — read as the layout guardrail, not rewritten.
- Redesigning Life Tracker's `CounterPanel`/`CounterControl` stepper, or any change to its DEC-136/DEC-139 surface geometry.
- Any change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, or backend routes.
- Assuming root cause for the "already implemented but broken live" items without live verification (`systematic-debugging` applies at implementation).

## Implementation pointers (non-normative)

- REQ-133 touches the shared `CardPresentation`/`CardSelectionPreview` component, so fixing
  it once naturally applies to both Quick Question and In-Depth Enrichment — do not fork a
  per-screen copy.
- REQ-134's likely root cause: the displayed counter reads `composedQuestion.length`
  (trimmed, topic-prefixed) while the bound textarea tracks raw `question` state in
  `QuickLookupApp.tsx` — confirm with `systematic-debugging` before fixing, and check
  `EnrichmentStep.tsx`'s duplicate `MAX_QUESTION_CHARS` composer for the same pattern.
- REQ-135/REQ-137: reproduce live (Playwright MCP or manual) before changing code — the
  underlying mechanism (DEC-142 outside-click, DEC-120 triangle glyph) already exists in
  source, so the defect may be a narrower rendering/event-wiring bug rather than a missing
  feature.
- REQ-139's dropdown is a new, simple control local to In-Depth — there is no existing
  bounded-select component to reuse; do not adapt Life Tracker's `CounterControl`, which is
  a different interaction model (tap/hold stepper) built for a different surface (DEC-136/
  DEC-139 full-height overlay).
- Measure any layout change at 390×844 and 1440×900 per `screen-layout.md`'s viewport bands.
