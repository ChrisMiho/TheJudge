status: active

# in-depth-spec

Current-state feature spec for the In-Depth destination (Phase A #7, the
last of the docs-refactor gameplan). See `IDEA.md` for problem, outcome, and
non-goals.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/in-depth-spec

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/in-depth-spec/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Scope | Status | Dependency |
| --- | --- | --- | --- |
| [A](./slice-a-verify-staged-flow.md) | Verify What it is, the staged-flow bullet, and Steps 1–4 against cited sources; independently re-check the DEC-018/DEC-122 header-citation gap | done | none |
| [B](./slice-b-verify-submit-and-conversation.md) | Verify Submit, the wait/conversation subsection, Measured bounds, Rejected alternatives, and the frontend half of Where it lives | done | none |
| [C](./slice-c-verify-backend-path.md) | Verify The full backend path (`mode: "game"`) section against real `apps/backend/src/` source and the backend half of Where it lives; independently re-check the DEC-047/REQ-033 header-citation gap | done | none |
| [D](./slice-d-header-nav-and-diff-proof.md) | Reconcile the header `Backed by:`/cross-boundary lines against A and C's results; verify the `PRD/README.md` nav row; prove the package diff stayed in scope | planned | A, B, C |

## Implementation map

Full architecture, the known-candidate header-citation findings, and the
package-level verification checklist: `GAMEPLAN.md`.

## Next step

`/thejudge-implement PRD/work/in-depth-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/in-depth-spec/ slice A` (Codex).
