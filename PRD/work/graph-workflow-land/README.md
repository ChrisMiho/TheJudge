status: ideation

# graph-workflow-land

Part 2 of the graph-workflow fix: one writer per branch so `land` never
conflicts, and a decision on the base branch's fate under GitHub's
delete-branch-on-merge setting so a package costs two PRs, not three. Also
corrects three `npm run graph:prune --apply` mentions to the working
`npm run graph:prune -- --apply` form.

Source: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`,
findings 2 and 7. Manual package (`OPERATOR.md` recipe 9), branch
`fix/graph-workflow-land` off `origin/main` in `.worktrees/graph-workflow-land`.

- `IDEA.md` — problem, outcome, non-goals
