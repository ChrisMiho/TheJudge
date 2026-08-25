status: active

# user-feedback-spec

Write the current-state feature spec for the Feedback & Bug Report feature —
Phase A #2 of the docs-refactor gameplan. Land it at
`PRD/sections/user-feedback/README.md` on the DEC-168 template (the pattern
`sections/life-tracker/README.md` already established for Phase A #1).
Frontend-only feature, one external dependency (Formspree), no server state.
Consolidates current behavior only; kept draft and non-authoritative, with
`decisions.md` staying precedence #1.

## Backing sources (evidence, not yet read into a spec)

- `PRD/sections/decisions/feedback.md` — DEC-104 (portal action-entry kind),
  DEC-105 (Feedback & Bug Report feature body)
- `PRD/sections/functional-requirements.md` — REQ-086, REQ-087, REQ-088
- `PRD/sections/user-flows.md` — FLOW-014
- `PRD/sections/system-map.md` — `Feedback & bug report` entry (shipped)
- `PRD/sections/non-functional-requirements.md` — NFR-001, NFR-006 (cited by
  the analogous life-tracker spec for accessibility/motion; confirm relevance
  at refinement)

## Reference implementation

`PRD/sections/life-tracker/README.md` (DEC-168, shipped PR #105/#106) is the
worked template: `Status:` / `Backed by:` header, **What it is**, **How it
works**, **Measured bounds**, **Rejected alternatives and deferred scope**,
**Where it lives**.

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, copied
  verbatim from `.worktrees/.graph-intake/graph-20260825-150903/`. Evidence
  only, not authority. Do not open the documents it cites
  (`workflow.md`, `workflow-decomposition.md`, `answers.md`) — their paths
  only are recorded, in that file.

## Non-goals

No product-behavior decisions here. No `apps/` code change. No edit to
`PRD/sections/decisions/feedback.md` or any other existing DEC/REQ/FLOW body.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/user-feedback-spec

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/user-feedback-spec/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Scope | Dependency | Status |
| --- | --- | --- | --- |
| [A](./slice-a-verify-spec.md) | Verify `PRD/sections/user-feedback/README.md` (already committed) against its cited sources and the DEC-168 template; close any confirmed, sourced gap with a bounded additive correction only. | none | done |
| [B](./slice-b-diff-proof.md) | Verify the `PRD/README.md` Section Inventory row (already committed); prove the package-wide diff since its fork point touched nothing outside the licensed set. | none | planned |

GAMEPLAN: `PRD/work/user-feedback-spec/GAMEPLAN.md`.

## Implementation map

- `PRD/sections/user-feedback/README.md` — already written and committed
  (`562d1c6`); verified (and, if needed, bounded-corrected) by slice A.
- `PRD/README.md` — already carries one Section Inventory row for
  `sections/user-feedback/`; verified by slice B, alongside the
  package-wide diff-scope proof.

## Next step

`/thejudge-implement PRD/work/user-feedback-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/user-feedback-spec/ slice A` (Codex). Slice B
has no ordering dependency on A.
