# Master Roadmap

## Current Baseline

- Product remains a flow-validation assistant (`DEC-001`, `DEC-002`).
- Stack-order consistency is non-negotiable (`DEC-004`, `REQ-006`).
- Current execution focus is MVP2 reliability/provider hardening plus context-flow eval coverage (see `PRD/README.md` and active analysis roadmap files).

## Now

- Finish active context-flow eval backlog slices still open in `PRD/README.md`.
- Execute `PRD/gameplan/features/context-flow-eval-closure.md` wave-by-wave as the primary closure path.
- Keep backend/provider work aligned to active MVP2 roadmap sequencing.
- Preserve contract stability while expanding test/eval coverage.

## Next

- Promote completed context-flow test and logging slices into stable QA and release checks.
- Resolve high-impact open questions that block feature parallelization.
- Convert prioritized feature ideas into dedicated `PRD/gameplan/features/<slug>.md` plans.

## Later

- Revisit deferred roadmap items only after "Now" lane quality gates are green.
- Consider optional eval expansions only when core coverage and reliability are stable.

## Dependency Notes

- Decisions override backlog interpretation when conflicts appear.
- Sequential work must call out blocker stories explicitly; default to parallel-ready slices otherwise.
- Open questions remain non-committed until promoted into confirmed decisions.

## Traceability Anchors

- Requirements: `REQ-001` to `REQ-017`
- Flows: `FLOW-001` to `FLOW-004`
- Non-functional: `NFR-001` to `NFR-008`
- Decisions: `DEC-001` to `DEC-019`
