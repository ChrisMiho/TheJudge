# Idea — shared-chrome-spec

Product truth for the chrome every feature destination shares — the suite
shell, the feature-portal Menu rail/tray, the mock-mode banner, the route
load fallback, the card-detail popup, the conversation history drawer, and
the View Context / adaptive context overlay — is scattered the same way the
five prior Phase A specs found their features scattered: across
`PRD/sections/decisions/navigation.md` (DEC-095, DEC-104, DEC-109–111,
DEC-121, DEC-122, DEC-133, DEC-135, DEC-137, DEC-140, DEC-147, DEC-150,
DEC-157), `decisions/conversation-ux.md` (the drawer/overlay chrome DECs —
DEC-118, DEC-123–127, DEC-129–131, DEC-134, DEC-138, DEC-141–144, DEC-146,
DEC-153), and `decisions/ui-presentation.md` (the shared sizing/popup DECs —
DEC-085, DEC-117, DEC-145, DEC-148, DEC-149, DEC-151, DEC-156, DEC-158–160).
It also spans `functional-requirements.md` (REQ-089, REQ-090, REQ-096,
REQ-100, REQ-106, REQ-113–119, REQ-122–128, REQ-131, REQ-135, REQ-140–142
among others), the `## Feature portal (app navigation)` block in
`system-map.md`, and — per the gameplan's binding constraint 7 — the rows
already grouped under `screen-layout.md`'s own `### Shared chrome` heading
(Suite shell, Destination load fallback, Mock-mode banner, Feature-portal
Menu rail + tray, Card detail popup, Conversation history drawer, View
Context / adaptive context overlay) plus its `## Shared layout language`
section (viewport bands, hybrid % model, fit rule, anti-overcalibration).
`screen-layout.md` already uses the heading text "Shared chrome" for this
exact row group, which is a strong naming signal for the spec's landing
directory. This package writes the current-state feature spec at
`PRD/sections/shared-chrome/README.md` (directory name to be confirmed at
the define gate against that existing heading), on the DEC-168 template
already established by `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, `sections/trade-balancer/README.md`,
`sections/scan/README.md`, and `sections/quick-lookup/README.md`.

Unlike the first five Phase A specs, shared chrome is not one player-facing
destination — it is the layout language and chrome surfaces every other
destination mounts into or borrows. The gameplan places it sixth on
purpose: "easier once the feature specs have shown which chrome they kept
reaching for." Five specs now exist and each one had to reference this
chrome without owning it (life-tracker's full-bleed shell exception,
quick-lookup's shared `ConversationWorkspace`/View Context/card-detail-popup
reuse, scan's cross-destination camera surface, trade-balancer and
user-feedback's shared shell bounds). This spec's job is to consolidate
those reach-arounds into one authoritative view of the chrome itself, and
to carry forward binding constraint 7's split: per-screen rows already
belong to their feature specs (Quick Question, In-Depth, Player Life
Tracker, Trade Balancer, Scan camera, Feedback modal all keep their own
`screen-layout.md` rows), while shared chrome and the shared layout
language move here.

This package consolidates current behavior and identifies backing sources
only — it does not change or re-decide any product behavior. The spec is
written draft and non-authoritative: `decisions.md` stays precedence #1 and
Read-First #1 through Phase A/B; any conflict between the new spec and a
cited DEC/REQ/FLOW is resolved in the spec's favor by correcting the spec,
not the source. This is a documentation/consolidation task, not a code
change: no `apps/` edit, no wire-contract change, no new endpoint. This is
Phase A #6 of the docs-refactor gameplan
(`PRD/work/shared-chrome-spec/intake/refactor-gameplan.md`, staged verbatim
from `.worktrees/.graph-intake/graph-20260827-001521/refactor-gameplan.md`),
following the pattern Phase A #1 (`life-tracker`), #2 (`user-feedback`), #3
(`trade-balancer`), #4 (`scan`), and #5 (`quick-lookup`) already
established.

## Prior run

- `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md` — keyword
  match (`DEC-168`, `docs-refactor`, `Phase A`); shipped. Phase A #1, first
  worked instance of the DEC-168 template.
- `PRD/instructions/receipts/user-feedback-spec-2026-08-25.md` — keyword
  match (`DEC-168`, `docs-refactor`, `Phase A`); shipped. Phase A #2.
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md` — keyword
  match (`DEC-168`, `docs-refactor`, `Phase A`); shipped. Phase A #3; first
  template instance with a `data/` corpus split.
- `PRD/instructions/receipts/scan-spec-2026-08-26.md` — keyword match
  (`DEC-168`, `docs-refactor`, `Phase A`); shipped. Phase A #4; first
  cross-cutting spec (three destinations).
- `PRD/instructions/receipts/quick-lookup-spec-2026-08-27.md` — keyword
  match (`DEC-168`, `docs-refactor`, `Phase A`, `screen-layout.md`);
  shipped. Phase A #5, the immediately preceding run in this same gameplan
  sequence; first full-backend-path spec.
- `PRD/instructions/receipts/chrome-hit-areas-and-mid-flight-exits-2026-08-05.md`
  — keyword match (`chrome`); shipped. Verified rail hit-area geometry
  (DEC-137/138/139) and a CounterPanel overlay fix; a source of *what
  shipped* for the Menu rail chrome this spec must describe, not
  spec-writing precedent.
- `PRD/instructions/receipts/chrome-tray-conversation-history-ux-2026-08-05.md`
  — keyword match (`chrome`); shipped. Verified tray-open rail inertness,
  the adaptive-context-trigger clearance retarget, and the conversation
  history delete control (DEC-140–144). Direct behavior evidence for the
  Feature-portal Menu rail + tray and History drawer rows this spec must
  cover.
- `PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md`
  — keyword match (`shared chrome surface`, explicit phrase used in that
  receipt for shell-bounds plumbing); shipped. Confirms "shared chrome" is
  already an in-repo term of art for this exact surface, not a name coined
  by this package.
- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md`
  and `-2026-08-17.md` — keyword match (`screen-layout.md`, "Destination
  load fallback" row); shipped. Source of the route-`Suspense`-boundary
  chrome row and DEC-157/NFR-014 routing decisions this spec must fold in.
- `PRD/instructions/receipts/responsive-containment-and-density-2026-08-06.md`
  — keyword match (`screen-layout.md`, DEC-150–153/REQ-127–132); shipped.
  Touches several shared-chrome DECs (Menu rail sizing, drawer widths).
- `PRD/instructions/receipts/ui-review-2026-08-11.md` — keyword match
  (`screen-layout.md` rows); shipped, but its cited rows (Quick Question,
  In-Depth, Trade Balancer) are per-feature, not shared-chrome — evidence
  that the split this spec must preserve (binding constraint 7) is already
  live in the catalog, not new ground.
- `PRD/instructions/receipts/graph-shakedown-and-deploy-2026-08-24.md` —
  keyword match (`Phase A`); shipped. Notes the `define` gate "has still
  never fired" because no prior graph-run package wrote real product truth,
  and that testing it "needs a package that genuinely writes product
  truth — the Phase A spec." This package is exactly that kind of run;
  expect the gate to fire for real here (screen-layout.md's `### Shared
  chrome` rows moving into a new file is a genuine `PRD/sections/` diff).

These first five `-spec-` receipts are the spec-writing precedent (cited
again in **Reference implementation** in the package README). The two
`chrome-*` receipts and `center-menu-tab-prominence-followup` are shipped
feature-history evidence for this spec's content. The routing and
responsive-containment receipts are evidence for two specific rows
(destination load fallback; Menu rail/drawer sizing). `ui-review` and
`graph-shakedown-and-deploy` are process/precedent notes, not content
sources.

## Non-goals

- No new or changed chrome behavior — every cited DEC in navigation.md,
  conversation-ux.md, and ui-presentation.md is read, not re-decided.
- No edits to `PRD/sections/decisions/navigation.md`,
  `decisions/conversation-ux.md`, `decisions/ui-presentation.md`,
  `functional-requirements.md`, `user-flows.md`, or any other existing
  DEC/REQ/FLOW/NFR body.
- No edit to the five already-shipped Phase A specs
  (`life-tracker/README.md`, `user-feedback/README.md`,
  `trade-balancer/README.md`, `scan/README.md`, `quick-lookup/README.md`)
  beyond whatever cross-reference this spec adds pointing *at* them; their
  own per-screen `screen-layout.md` rows are not moved here.
- No GAMEPLAN, slice docs, or DESIGN-BRIEF from this shape step — those
  come from `thejudge-refinement` and `thejudge-map-out`.
- No `apps/` code change; this is a documentation-only package.
- No decision here about the exact shape of how the seven `screen-layout.md`
  `### Shared chrome` rows and the `## Shared layout language` section are
  presented inside the new spec (folded verbatim, restructured, or
  summarized with a pointer back) — that authoring shape is a decision for
  refinement, not decided here.
- No decision on the final directory name — `shared-chrome` is proposed
  from `screen-layout.md`'s own `### Shared chrome` heading and confirmed
  or corrected at the define gate.
