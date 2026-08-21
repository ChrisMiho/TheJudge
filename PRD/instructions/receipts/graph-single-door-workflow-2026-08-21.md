# Receipt — graph-single-door-workflow — 2026-08-21

## Status: shipped

`graph-run` is now TheJudge's single intake door. The owner describes an
idea, an observation, or a bug — or hands over a context document — and the
same flow carries it through refinement, PRD review, and implementation.
`thejudge-prepare` is retired as an entry point. Refined 2026-08-20 as
DEC-167: REQ-160..164, FLOW-021, FLOW-022. Mapped out into nine slices
(A–I), all done.

## Actions taken

- Package built in an ordinary session, not a graph run — REQ-161, REQ-162,
  and REQ-163 edit three `thejudge-*` skills, which the graph contract
  forbids a graph run from touching.
- Implemented via PR #94 (`thejudge-auto/graph-single-door-workflow` →
  `feature/graph-workflow-hardening`), merged 2026-08-21T19:02:12Z at merge
  commit `c7aac47`.
- `feature/graph-workflow-hardening` carried to `main` via PR #92, merged
  2026-08-21T19:13:15Z at merge commit `c5322b8`.
- Recorded autonomous base `origin/feature/graph-workflow-hardening` was
  deleted on GitHub after PR #92 merged (normal end state for a base branch).
  Verified locally instead: `c7aac47` is an ancestor of `main`'s current
  `HEAD` (`c5322b8`), and PR #94's marker
  `thejudge-auto:v1:registered:graph-single-door-workflow` confirms it
  targeted the recorded base.
- `npm run skills:ai-sync` run against the finished state;
  `diff -rq .claude/skills .agents/skills` printed nothing.
- `npm run quality:check` green (295 tests passing) on `main` post-merge.
- PRD promotion confirmed already present from the PR #94/#92 merges — no
  new edits needed this cleanup:
  - `PRD/sections/functional-requirements.md` — REQ-160..164 present.
  - `PRD/sections/user-flows.md` — FLOW-021, FLOW-022 present.
  - `PRD/sections/decisions/doc-process.md` — DEC-167 body present.
  - `PRD/sections/decisions.md` — DEC-167 router index line present.
  - No `PRD/sections/system-map.md` entry added — this package ships agent
    process, not product code under `apps/` or `scripts/`; the system-map
    promotion gate does not apply, per the precedent set by the prior graph
    package.
- This package discharges the first follow-up recorded in
  `PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md`:
  intake now lands in the receipt via the `## Intake` section slice G added
  to `thejudge-cleanup`.
- `docs/whatIsGraph/` was **not** committed. It remains untracked working
  material in the owner's checkout; sweeping it into the repository stays
  the owner's call, exactly as the prior receipt stated.
- Local branches `feature/graph-workflow-hardening` and
  `thejudge-auto-impl/graph-single-door-workflow-1787272528` deleted
  (`git branch -d`, both fully merged, remotes already gone). Worktree
  `.worktrees/implement-graph-single-door-workflow` removed
  (`git worktree remove`).
- `PRD/work/graph-single-door-workflow/` deleted with `git rm -r`.
- Slug removed from every section of `PRD/work/STATUS.md`.

## Files touched (package implementation, PR #94/#92)

| File | Slices |
| --- | --- |
| `.claude/skills/graph-run/SKILL.md` | B, C, F |
| `.claude/skills/thejudge-kickoff/SKILL.md` | B, C, E |
| `.claude/skills/thejudge-refinement/SKILL.md` | D |
| `.claude/skills/thejudge-cleanup/SKILL.md` | G |
| `PRD/instructions/graph-workflow-contract.md` | A, B, C, D, F |
| `AGENT-SKILLS.md` | A |
| `PRD/instructions/skill-fixtures/**` | H |
| `.agents/skills/**` | every skill-editing slice, via `npm run skills:ai-sync` |

Deliberately not touched: `.claude/skills/thejudge-prepare/SKILL.md`,
`PRD/instructions/preparation-contract.md`, `.claude/graph-profile.json`,
`scripts/graph-preflight.mjs`, `scripts/graph-boundary-hook.mjs`, and the
contract's `## Boundaries` list.

## Files deleted (this cleanup)

- `PRD/work/graph-single-door-workflow/` (README.md, DESIGN-BRIEF.md,
  GAMEPLAN.md, IDEA.md, STATUS.ship-ready, slice-a through slice-i docs and
  criteria JSON)

## Verification results

- `npm run skills:ai-sync && diff -rq .claude/skills .agents/skills` — clean,
  no output.
- `npm run quality:check` — exit 0, 295/295 tests passing.
- Autonomous merge-proof gate: all four checks satisfied (base deletion +
  ancestor proof; PR #94 merged into the recorded base per `gh pr view`;
  implementation worktree already removed and clean; no runtime-cleanup
  acceptance criteria recorded for this package — GAMEPLAN states no
  browser-observable risk, so none apply).

No `GRAPH-RUN.md` in this package — no `## Graph run` section added. No
`intake/` folder in this package — no `## Intake` section added.
