status: refined

# graph-workflow-land

Part 2 of the graph-workflow fix: one writer per branch so `land` never
conflicts, and a decision on the base branch's fate under GitHub's
delete-branch-on-merge setting so a package costs two PRs, not three. Also
corrects four `npm run graph:prune --apply` mentions to the working
`npm run graph:prune -- --apply` form.

Source: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`,
findings 2 and 7. Manual package (`OPERATOR.md` recipe 9), branch
`fix/graph-workflow-land` off `origin/main` in `.worktrees/graph-workflow-land`.

- `IDEA.md` — problem, outcome, non-goals
- `DESIGN-BRIEF.md` — the design record: decisions D1–D9, amendment set by grep, verification plan
- `GATE-QUESTIONS.md` — the proposed product truth: REQ-193, REQ-194 new; REQ-171, REQ-191, REQ-192, REQ-164, FLOW-021, FLOW-022 amended; verdict slots answered at PR review

Refined 2026-09-06 without a live owner approval: the session brief delegated
both decisions (see `DESIGN-BRIEF.md`, `## Deviation from the refinement
skill, stated as one`). Quality checks 1–3 (fresh-context read-only reviewers)
returned FAIL with 14, 12, and 16 findings; the brief and proposal were
reworked after each the same day. Quality check 4 returned PASS with 14
non-blocking notes, folded in before the status moved to `refined`.
