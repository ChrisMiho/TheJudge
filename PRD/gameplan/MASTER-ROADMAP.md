# Master Roadmap

## Current Baseline

- Product remains a flow-validation assistant (`DEC-001`, `DEC-002`).
- Stack-order consistency is non-negotiable (`DEC-004`, `REQ-006`).
- Current execution focus is context-flow eval closure first, then provider reliability hardening without contract drift (see `PRD/README.md` and active analysis roadmap files).

## Now

- Finish active context-flow eval backlog slices still open in `PRD/README.md`.
- Execute `PRD/gameplan/features/context-flow-eval-closure.md` wave-by-wave as the primary closure path.
- Keep provider reliability hardening as completed baseline; do not reopen without new scope approved in `PRD/sections/decisions.md`.
- Preserve contract stability while expanding test/eval coverage.

## Next

- Promote completed context-flow and provider reliability slices into stable QA/release checks before pulling deferred scope.
- Sequence remaining MVP2 post-reliability slices using current roadmap constraints (no contract drift, no prompt-scope expansion in provider lanes).

## Later

- Revisit deferred roadmap items only after "Now" and "Next" lane quality gates are green.
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
