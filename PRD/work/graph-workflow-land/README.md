status: active

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
- `GAMEPLAN.md` — architecture, slice table, data flow, package verification

Refined 2026-09-06 without a live owner approval: the session brief delegated
both decisions (see `DESIGN-BRIEF.md`, `## Deviation from the refinement
skill, stated as one`). Quality checks 1–3 (fresh-context read-only reviewers)
returned FAIL with 14, 12, and 16 findings; the brief and proposal were
reworked after each the same day. Quality check 4 returned PASS with 14
non-blocking notes, folded in before the status moved to `refined`. Mapped out
the same day.

## Slices

| Slice | Doc | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-scripts.md](./slice-a-scripts.md) | planned | — |
| B | [slice-b-thejudge-skills.md](./slice-b-thejudge-skills.md) | planned | — |
| C | [slice-c-graph-skills.md](./slice-c-graph-skills.md) | planned | — |
| D | [slice-d-contract-and-owner-docs.md](./slice-d-contract-and-owner-docs.md) | planned | — |
| E | [slice-e-product-truth-and-ship.md](./slice-e-product-truth-and-ship.md) | planned | A, B, C, D |

## Implementation map

| Area | Files | Slice |
| --- | --- | --- |
| Scripts | `scripts/graph-prune.mjs`, `scripts/graph-ledger-check.mjs`, `scripts/graph-digest.mjs`, `scripts/lib/boundary-rules.mjs` (+ tests) | A |
| `thejudge-*` skills + cleanup fixtures | `.claude/skills/thejudge-implement-all/`, `.claude/skills/thejudge-cleanup/`, `PRD/instructions/skill-fixtures/thejudge-cleanup/` | B |
| `graph-*` skills + implement fixture | `.claude/skills/graph-{implement,kickoff,preflight,gate-review}/`, `PRD/instructions/skill-fixtures/graph-implement/` | C |
| Contract and owner docs | `PRD/instructions/graph-workflow-contract.md`, `PRD/instructions/preparation-contract.md`, `OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`, `.claude/skills/codehealth/SKILL.md`, part-1 receipt | D |
| Product truth | `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md` | E |

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/graph-workflow-land/DESIGN-BRIEF.md`
- Findings: none blocking (check 4, 2026-09-06: 13 of 13 `Current:` excerpts byte-identical; REQ-193/194 free; every named command form allowed by the profile; 14 non-blocking notes folded in before `refined`)
