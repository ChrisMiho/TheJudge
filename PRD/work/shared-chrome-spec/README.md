---
status: active
---

# shared-chrome-spec

Write the current-state feature spec for the shared chrome — Phase A #6 of
the docs-refactor gameplan. Land it at `PRD/sections/shared-chrome/README.md`
on the DEC-168 template (the pattern `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, `sections/trade-balancer/README.md`,
`sections/scan/README.md`, and `sections/quick-lookup/README.md` already
established for Phase A #1–#5). This is the shared-chrome bucket: the
shared layout language and chrome the five prior feature specs kept
reaching for without owning (suite shell, Menu rail/tray, mock-mode banner,
route load fallback, card-detail popup, conversation history drawer, View
Context overlay), plus the `screen-layout.md` rows that belong to shared
chrome rather than a single feature (gameplan binding constraint 7).
Consolidates current behavior only; kept draft and non-authoritative, with
`decisions.md` staying precedence #1 through Phase A/B.

## Backing sources (evidence, not yet read into a spec)

- `PRD/sections/screen-layout.md` — `## Shared layout language` (viewport
  bands, hybrid % model, fit rule, anti-overcalibration) and the
  `### Shared chrome` row group: Suite shell (`PageShell`/portal shell
  bounds), Destination load fallback (route `Suspense` boundary),
  Mock-mode banner, Feature-portal Menu rail + tray, Card detail popup
  (suite-wide), Conversation history drawer, View Context / adaptive
  context overlay. This heading is the existing in-repo naming signal for
  the spec's directory name.
- `PRD/sections/decisions/navigation.md` — DEC-095, DEC-104, DEC-109,
  DEC-110, DEC-111, DEC-121, DEC-122, DEC-133, DEC-135, DEC-137, DEC-140,
  DEC-147, DEC-150, DEC-157 (Menu rail/tray geometry and behavior, routing,
  destination load fallback)
- `PRD/sections/decisions/conversation-ux.md` — the drawer/overlay chrome
  DECs: DEC-118, DEC-123, DEC-124, DEC-125, DEC-126, DEC-127, DEC-129,
  DEC-130, DEC-131, DEC-134, DEC-138, DEC-141, DEC-142, DEC-143, DEC-144,
  DEC-146, DEC-153 (conversation history drawer, View Context / adaptive
  context overlay, rail-split-on-conversation-destinations behavior)
- `PRD/sections/decisions/ui-presentation.md` — the shared sizing/popup
  DECs: DEC-085 (mock-mode banner), DEC-117 (mobile-first mechanism),
  DEC-145/DEC-148/DEC-149 (shell sizing, layout-direction authority),
  DEC-151/DEC-158/DEC-159/DEC-160 (card detail popup), DEC-120, DEC-128,
  DEC-156
- `PRD/sections/functional-requirements.md` — REQ-089, REQ-090, REQ-096,
  REQ-100, REQ-106, REQ-113 through REQ-119, REQ-122 through REQ-128,
  REQ-131, REQ-135, REQ-140, REQ-141, REQ-142 (exact set to confirm during
  refinement; several are per-feature and must stay out)
- `PRD/sections/system-map.md` — the `## Feature portal (app navigation)`
  block (Menu rail/tray mechanics, routing, keep-alive mounting,
  `PortalSlot`/`ShellBounds` plumbing) with its `Lives in:` and `Backed
  by:` lines
- `PRD/sections/user-flows.md` — FLOW-001, FLOW-010 (navigation flows cited
  by the Feature portal system-map entry); confirm during refinement
  whether any flow belongs to shared chrome rather than a feature
- `PRD/sections/open-questions.md` — check for any live item touching
  shared chrome before closing out this spec's scope

## Reference implementation

`PRD/sections/life-tracker/README.md`, `PRD/sections/user-feedback/README.md`,
`PRD/sections/trade-balancer/README.md`, `PRD/sections/scan/README.md`, and
`PRD/sections/quick-lookup/README.md` (all DEC-168) are the worked
templates: `Status:` / `Backed by:` header, **What it is**, **How it
works**, **Measured bounds**, **Rejected alternatives and deferred scope**,
**Where it lives**. This spec is unlike all five: it is not one
player-facing destination but the chrome layer every destination mounts
into, so "What it is" and "How it works" will describe shared surfaces
(shell, rail, tray, drawer, overlays, popup) rather than a single screen
flow. `scan`'s cross-destination structure (a feature reached from more
than one screen) is the closest existing precedent for describing a
surface shared across destinations, though shared chrome is shared by
*all* destinations rather than three.

## Non-goals

No product-behavior decisions here. No `apps/` code change. No edit to
`decisions/navigation.md`, `decisions/conversation-ux.md`,
`decisions/ui-presentation.md`, `functional-requirements.md`,
`user-flows.md`, `system-map.md`, `screen-layout.md`, or any other existing
DEC/REQ/FLOW/NFR body. No edit to the five already-shipped Phase A specs
beyond an added cross-reference. No decision on the exact authoring shape
for folding in the `screen-layout.md` shared-chrome rows and shared layout
language. No decision on the final directory name — `shared-chrome` is
proposed and confirmed or corrected at the define gate.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/shared-chrome-spec

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/shared-chrome-spec/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Scope | Dependency | Status |
| --- | --- | --- | --- |
| [A](./slice-a-verify-structural-chrome.md) | Verify the spec's structural-chrome content (header/Backed-by structural half, What it is, first four How it works subsections — shell/mock-banner, routing/load fallback, Menu rail/tray, Theme; Shared layout language; structural portions of Measured bounds and Rejected alternatives; structural portion of Where it lives) against cited sources and the actual `apps/frontend/src/` tree. | none | done |
| [B](./slice-b-verify-conversation-chrome.md) | Verify the spec's conversation/overlay-chrome content (header/Backed-by conversation half, last four How it works subsections — answered workspace, history drawer, View Context overlay, card detail popup + close control; conversation-chrome portions of Measured bounds and Rejected alternatives; conversation-chrome portion of Where it lives) against cited sources and the actual `apps/frontend/src/` tree. | none | planned |
| [C](./slice-c-nav-scope-and-diff-proof.md) | Verify the two scope-boundary bullets in Rejected alternatives (deferred/out-of-scope; per-feature surfaces); verify the `PRD/README.md` Section Inventory row; prove the package diff from the `ee6e33f` map-out baseline stayed in scope, correctly excluding the concurrent `lambda-s3-deploy` package's already-committed changes on this branch. | none | planned |

GAMEPLAN: `PRD/work/shared-chrome-spec/GAMEPLAN.md`.

## Implementation map

- `PRD/sections/shared-chrome/README.md` — already written and committed
  (`0445150`); verified (and, if needed, bounded-corrected) by slices A and
  B, each owning a distinct half of the file, plus slice C's two
  scope-boundary bullets.
- `PRD/README.md` — needs one Section Inventory row for
  `sections/shared-chrome/`; added and verified by slice C, alongside the
  package-wide diff-scope proof.

## Next step

`/thejudge-implement PRD/work/shared-chrome-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/shared-chrome-spec/ slice A` (Codex). Slices B
and C have no ordering dependency on A or on each other.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by
this skill.
