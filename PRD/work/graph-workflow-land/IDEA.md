# Idea — graph-workflow-land

Building one idea through the graph workflow today costs three pull requests
and a hand-resolved merge conflict every time. The driver commits the run
ledger, the package README, the `STATUS.*` marker, and the board row on the
base branch while the builder commits the same four files on the `-work`
branch, so the code PR conflicts at `land` in every recorded run. GitHub then
deletes the base branch when the docs PR merges, the build half re-creates it,
and cleanup needs a second base→main PR.

Outcome: a package costs two PRs (docs, then code) and `land` never conflicts,
because exactly one branch writes a package's files at any moment and the
build half no longer depends on a branch GitHub deletes.

Non-goals: no change to the spec-forming half (`graph-kickoff`, shipped as part
1), no change to the hook, lock, caps, or gate-parking model, no concurrent
multi-idea builds.

## Prior run

- `PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md` — part 1
  of the same audit (findings 1, 3–6, 8); this package is findings 2 and 7.
