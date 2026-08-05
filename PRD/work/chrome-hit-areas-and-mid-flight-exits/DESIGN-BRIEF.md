# DESIGN BRIEF: chrome-hit-areas-and-mid-flight-exits

Post-ship UX audit findings from the three shipped UX packages, re-verified against `main` at
`6f4b1d7` with Playwright MCP at 430 × 900. Evidence and measurements: [`IDEA.md`](./IDEA.md).

## Problem

Three independent defects, two of which cost the user real work during a game:

1. **Suite chrome intercepts destination taps.** The feature-portal corner rail is an `88 × 168`
   box whose only paint is a radial gradient reaching full transparency at 78% of its own extent,
   at `z-index: 3`. The remainder is an invisible interceptor sitting above destination content.
2. **A mid-flight exit loses staged work.** Opening a saved conversation discards the staged
   attempt with nothing written to the Draft slot, while the other two exits from the same state
   both snapshot it.
3. **One overlay is shaped unlike the rest.** The counter panel is still a content-sized bottom
   sheet — the shape DEC-134 already retired for the history drawer, for stated reasons that apply
   here verbatim.

## Scope

Findings 1–4 from `IDEA.md`. Finding 5 (empty pre-submit lower half) stays deferred as an
explicit DEC-131 non-goal.

### Slice 1 — Rail hit area (findings 1 + 2) → `DEC-137` / `REQ-114`

Both findings share one root cause, but the two rail variants need different corrections.

**Single-zone rail (Life Tracker, Trade Balancer).** Interactive box capped to
`5.5rem × 3.5rem` — height only. The gradient keeps painting at today's `5.5rem × 10.5rem` extent
from a `pointer-events: none` decorative layer. **Zero visual change.**

Height is what does the work: the life control begins at `y=57`, so any box ending at or above it
has zero overlap *regardless of width*. The width is deliberately **not** narrowed — the icon is
centered in `5.5rem`, so a `3.5rem`-wide box would re-center it 16px to the left, which is a
visual change. Measured:

| Geometry | Overlap with life control |
| --- | --- |
| Today `88 × 168` | 8,325px² |
| Width-only `56 × 168` | 4,773px² ❌ |
| **Height-capped `88 × 56`** | **0px²** ✓ |

**Split rail (In-Depth, Quick Question).** Zones move from **stacked to side-by-side**, each
`2.75rem × 2.75rem` within the existing `5.5rem` width, Menu leading. This is forced arithmetic,
not taste: only **70px** exists between the rail's top (`y=45`) and the eyebrow (`y=115`), while
two stacked zones at NFR-001's 44px floor need **88px**. Stacked geometry cannot satisfy both
constraints; side-by-side clears by 26px. This **amends DEC-126** and is the one visible change in
this package.

Verification is **hit-testing** (`document.elementFromPoint` across the contested regions), not
screenshots. This is a requirement-level constraint, not a suggestion: the defect is invisible by
construction, so a screenshot cannot detect its return — and the first draft of this slice was
itself wrong in a way only measurement caught.

The single-zone correction is not a supersession — DEC-122 already states *"the glow area itself
is the trigger"* and the implementation drifted. The split-rail change does amend DEC-126.

### Slice 2 — Mid-flight Draft on history-select (finding 3) → `DEC-138` / `REQ-108` amended

- `saveDraft` before `restoreConversation`, in **both** destinations.
- Silent — no dialog, no toast. The work is not lost, it is recoverable from the drawer already
  on screen.
- Empty staging writes nothing, matching Menu-leave.

### Slice 3 — Counter panel surface (finding 4) → `DEC-139` / `REQ-082` amended

- Surface fills the available shell height instead of sizing to content; scrolls internally when
  content exceeds it.
- Counter semantics entirely unchanged.

## Non-goals

Redesigning the rail's visual language, the drawer's contents, the destination registry, seat
arrangements, or the conversation contract; adding counters, destinations, or Draft slots;
inserting a confirm dialog or transient notice on the mid-flight exit; the `"me"`-cell seat-map
placement problem (stays with `life-tracker-me-map-and-tray`); pre-submit empty lower-half fill
(DEC-131); any backend, prompt, `AskAiRequest`, Zod, or data-pipeline change.

## Product truth written

| ID | Where | What |
| --- | --- | --- |
| `DEC-137` | `decisions/navigation.md` | Chrome's interactive box may not exceed the affordance it paints; single-zone rail capped to its icon band with the gradient becoming decoration, split rail's zones move stacked → side-by-side (amends DEC-126) |
| `DEC-138` | `decisions/conversation-ux.md` | History-select is the third Draft-covered mid-flight exit, in both destinations, silently |
| `DEC-139` | `decisions/player-life-tracker.md` | Counter panel joins the full-height overlay family |
| `REQ-114` | `functional-requirements.md` | New — hit areas bounded to painted affordance, verified by hit-testing |
| `REQ-108` | `functional-requirements.md` | Amended — exit coverage extended beyond "Menu leave or reload" |
| `REQ-082` | `functional-requirements.md` | Amended — panel surface geometry clause |
| `FLOW-017` | `user-flows.md` | Amended — step 5a, two edge cases, three-exits note |

## Corrections made during refinement

Three claims did not survive verification. All are recorded because each changed what gets built.

**From quality-check, against this brief's own first draft:** the original Slice 1 proposed
narrowing the rail's width only, and asserted the split rail's zone overflow was accidental. Both
were wrong. Width-only narrowing leaves 4,773px² of the Life Tracker mis-tap in place, and the
stacked-zone overflow is forced by a 70px-available / 88px-required conflict rather than being
sloppiness. Slice 1 above is the corrected version; `DEC-137` and `REQ-114` record the reasoning
so the same mistake is not re-derived later.

**From the source material:**

- **Finding 3 affects both conversation destinations, not just In-Depth.** `IDEA.md` recorded it
  against In-Depth only. Re-verification found the identical defect in both history-select
  handlers (`MtgAssistantApp.tsx:651`, `QuickLookupApp.tsx:272`), and it was reproduced live on
  Quick Question. Building only the In-Depth fix would have left half the defect shipped.
- **The counter panel is not "non-scrollable".** The `life-tracker-me-map-and-tray` package
  describes the tray as "height-locked and non-scrollable, cutting off most of the matrix". The
  panel carries `overflow-y-auto` with a `max-h-[94dvh]` cap, and at 4 players
  `scrollHeight === clientHeight` — nothing is cut off. The real defect is 358px of dead scrim
  (40% of a 430 × 900 viewport) and family inconsistency.

## Package boundary

This package takes ownership of the counter panel's **surface geometry** from
`life-tracker-me-map-and-tray`, which retains only the `"me"`-map seat placement problem. That
package's `IDEA.md` has been trimmed accordingly, so the two cannot ship contradictory tray
treatments. Approved by the owner during refinement.

## Verification posture

- Slice 1: hit-test assertions over the former overlap regions on Life Tracker and on a
  History-bearing destination, asserting **zero** remaining overlap rather than "less" overlap;
  assertions that the split rail's zones are side-by-side and both clear NFR-001's floor; an
  assertion that the single-zone rail's icon position is unchanged. A screenshot does not satisfy
  this slice.
- Slice 2: assert `thejudge.conversationDraft.<mode>` is written on history-select from staging,
  in both modes, plus the empty-staging and already-answered cases.
- Slice 3: assert the panel's surface height against the shell rather than its content, at
  multiple player counts.

## Next step

`/thejudge-quality-check PRD/work/chrome-hit-areas-and-mid-flight-exits/`
