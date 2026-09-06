status: refined

# graph-workflow-branching

Part 1 of the graph-workflow fix: start every run from `origin/main`, run the
spec-forming half in its own worktree so the launch checkout stays on `main`,
retire the base→main guard so a second idea can start while the first waits,
prune local leftovers, and give the owner a runbook for parallel ideas.

- Idea: `IDEA.md`
- Evidence: `../probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
- Branch: `fix/graph-workflow-branching` (worktree `.worktrees/graph-workflow-fix`, from `origin/main`)
- Part 2 (separate package, later): single writer per branch; base-branch fate under delete-on-merge
