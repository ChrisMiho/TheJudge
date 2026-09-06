# Probe — graph workflow audit

- Date: 2026-09-06
- Mode: answer (analysis only, no changes to skills, scripts, or product truth)
- Question: why does the graph workflow still feel clunky after a few days —
  specifically branching, worktree and GitHub sync gaps, and why parallel runs
  feel unsafe — and what has the owner missed?

## What ran

Read-only. No subagents.

- Read the four `graph-*` skills, `PRD/instructions/graph-workflow-contract.md`,
  `scripts/graph-preflight.mjs`, `scripts/graph-boundary-hook.mjs`, the
  `thejudge-implement-all` and `thejudge-cleanup` branch rules.
- Read the current run ledger `PRD/work/ai-answer-quality-baseline/GRAPH-RUN.md`
  and the `land`/`close` rows of every receipt carrying a `## Graph run` section.
- Inspected live state: `git worktree list`, local `thejudge-auto/*` branches
  versus `origin`, `.worktrees/` control files, open PRs, repo settings
  (`gh api repos/ChrisMiho/TheJudge`), `npm run graph:digest`.

## Result

See `FINDINGS-graph-workflow-gaps.md`. Nine findings, ranked; a recommended
order of fixes at the end. Nothing here was applied.
