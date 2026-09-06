# Idea — graph-workflow-branching

The owner cannot start a second idea while the first waits for a gate answer,
and after every run the launch checkout is on a run branch and out of step with
what GitHub says is ready. The cause is one design choice: the graph driver uses
the launch checkout as its own working branch, starts runs from whatever branch
is checked out, and refuses any fresh run while a docs PR is open. Outcome: a
fresh idea always branches from `origin/main`, runs in its own
`.worktrees/kickoff-<slug>` worktree so the launch checkout stays on `main`,
starts even when another idea's docs PR is open, and the owner has a one-page
runbook for running two ideas at once plus a clean set of local leftovers.
Non-goals: the single-writer-per-branch fix for land conflicts and the fate of
the base branch under GitHub's delete-on-merge setting are part 2, a separate
package; no change to the boundary hook, the lock, or the node table.

Evidence: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
(findings 1, 4, 5, 6, 8; 2026-09-06 read-only audit).
