# Idea — quick-lookup-spec

Product truth for Quick Lookup is scattered across
`PRD/sections/decisions/lookup-suite.md` (DEC-097/DEC-099, both superseded,
plus DEC-107/DEC-108/DEC-112/DEC-113/DEC-114, confirmed), the `mode:
"lookup"` wire contract in `decisions/providers-and-contract.md` (DEC-106,
DEC-020), roughly a dozen REQ entries in `functional-requirements.md`
(REQ-072 through REQ-080, REQ-091, REQ-092, REQ-134 — several merged into
one another during quick-lookup refinement), FLOW-011 in `user-flows.md`,
the "## Quick Lookup" block in `system-map.md`, and two rows in
`screen-layout.md` ("Quick Question — pre-submit" / "— answered
workspace"). Reading current Quick Lookup behavior today means walking a
merge history (two destinations reconciled into one, DEC-107) rather than
reading one page. This package writes the current-state feature spec at
`PRD/sections/quick-lookup/README.md`, on the DEC-168 template already
established by `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, `sections/trade-balancer/README.md`, and
`sections/scan/README.md`.

Unlike the first four Phase A specs, Quick Lookup is the gameplan's chosen
full-backend-path test case: it is the first spec whose subject runs the
entire Ask AI backend — prompt assembly (`apps/backend/src/prompt/`:
`preparation.ts`, `promptAssembly.ts`, `context.ts`, `mtgReference.ts`,
`phaseGuidance.ts`), question-driven rules retrieval
(`apps/backend/src/gameRulesRetrieval.ts`, System 3 per DEC-046), and the
provider boundary (`apps/backend/src/providers/`: `askAiProvider.ts`,
`createAskAiProvider.ts`, `mockAskAiProvider.ts`,
`openAiResponsesProvider.ts`, DEC-020) — not just a frontend screen. The
spec must capture that full request path (validation → branching prompt
assembly → retrieval → provider call → response), not only the
`QuickLookupApp.tsx` UI the way life-tracker, user-feedback, and
trade-balancer's specs could stay frontend-only.

Quick Lookup is also a reconciliation case: it was refined and shipped as
one destination (DEC-107) after two separate destinations — Card Lookup
(DEC-097) and Rules Lookup (DEC-099) — were designed and superseded before
either shipped. The spec must describe the one shipped path, not the two
superseded designs; superseded DEC-097/DEC-099 content is history, not
current behavior, and several REQ IDs (REQ-076/077/078/080) are merge
stubs pointing at their surviving counterpart (REQ-073/074/075). The
"rejected alternatives" field this template requires is a natural fit here:
the two-destination design is a real dead end, not spec filler.

This package consolidates current behavior and identifies backing sources
only — it does not change or re-decide any product behavior. The spec is
written draft and non-authoritative: `decisions.md` stays precedence #1 and
Read-First #1 through Phase A/B; any conflict between the new spec and a
cited DEC/REQ/FLOW is resolved in the spec's favor by correcting the spec,
not the source. This is a documentation/consolidation task, not a code
change: no `apps/` edit, no wire-contract change, no new endpoint. Out of
scope: deciding new Quick Lookup behavior, editing
`PRD/sections/decisions/lookup-suite.md` or `providers-and-contract.md` or
any other decision body, and resolving the two open questions this feature
already carries (Q-003 optional game context, Q-004 answer-seeded
second-pass retrieval) — those stay open, not decided by this spec. This is
Phase A #5 of the docs-refactor gameplan
(`PRD/work/adhoc/refactor-gameplan.md`), following the pattern Phase A #1
(`life-tracker`), #2 (`user-feedback`), #3 (`trade-balancer`), and #4
(`scan`) already established.

## Prior run

- `PRD/instructions/receipts/quick-lookup-2026-08-01.md` — slug match
  (`quick-lookup`); shipped. This is the original build receipt for the
  feature this spec now consolidates (Slices A–E: mode contract, lookup
  prompt assembly, core-topics browse artifact, portal registration,
  conversation thread reuse). It is a source of *what shipped and where*
  (files created/updated, listed per slice), not spec-writing precedent.
- `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md` — keyword
  match (`DEC-168`, `docs-refactor`); shipped. Phase A #1, first worked
  instance of the DEC-168 template.
- `PRD/instructions/receipts/user-feedback-spec-2026-08-25.md` — keyword
  match (`DEC-168`, `docs-refactor`); shipped. Phase A #2.
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md` — keyword
  match (`DEC-168`, `docs-refactor`); shipped. Phase A #3; first template
  instance with a `data/` corpus split.
- `PRD/instructions/receipts/scan-spec-2026-08-26.md` — keyword match
  (`DEC-168`, `docs-refactor`); shipped. Phase A #4; first cross-cutting
  spec (three destinations) and the immediately preceding run in this same
  gameplan sequence.

These four `-spec-` receipts are the spec-writing precedent, cited again in
**Reference implementation** in the package README. The `quick-lookup-2026-08-01`
receipt is feature-history evidence for this spec's content instead.

## Non-goals

- No new or changed Quick Lookup behavior — DEC-097, DEC-099, DEC-106,
  DEC-107, DEC-108, DEC-112, DEC-113, DEC-114 are not touched.
- No edits to `PRD/sections/decisions/lookup-suite.md`,
  `providers-and-contract.md`, `functional-requirements.md`,
  `user-flows.md`, `system-map.md`, `screen-layout.md`, or any other
  existing DEC/REQ/FLOW/NFR body.
- No GAMEPLAN, slice docs, or DESIGN-BRIEF from this shape step — those come
  from `thejudge-refinement` and `thejudge-map-out`.
- No `apps/` code change; this is a documentation-only package.
- No resolution of Q-003 (optional lightweight game context on the `card`
  field) or Q-004 (answer-seeded second-pass retrieval) — both stay open;
  the spec records them as deferred/live, not decided.
- No decision here about the exact shape of the "full backend path" section
  (how prompt assembly, retrieval, and the provider boundary are
  presented) — this package only establishes that it is required, since
  Quick Lookup is the gameplan's chosen backend-path test case; the
  authoring shape is a decision for refinement.
