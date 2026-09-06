status: active

# graph-workflow-branching

Part 1 of the graph-workflow fix: start every run from `origin/main`, run the
spec-forming half in its own worktree so the launch checkout stays on `main`,
retire the base→main guard so a second idea can start while the first waits,
make the hook's protected-path rule reach inside worktrees, add
`npm run graph:prune`, and give the owner a runbook for parallel ideas.

- Idea: `IDEA.md` · Brief: `DESIGN-BRIEF.md` · Proposal: `GATE-QUESTIONS.md` (7 blocks) · Plan: `GAMEPLAN.md`
- Evidence: `../probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
- Branch: `fix/graph-workflow-branching` (worktree `.worktrees/graph-workflow-fix`, from `origin/main`); PR to `main`, owner merges
- Part 2 (separate package, later): single writer per branch; base-branch fate under delete-on-merge

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/graph-workflow-branching/DESIGN-BRIEF.md`
- Findings: none (attempt 2, 2026-09-06; attempt 1 FAIL's three blocking and three should-fix findings were folded into the brief)

## Slices

| Slice | Doc | Objective | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | `slice-a-preflight-worktree.md` | Preflight branches from `origin/main` into `.worktrees/kickoff-<slug>`; auto-commit, stash, guard removed | parallel-ready | done |
| B | `slice-b-hook-worktree-paths.md` | Protected-path rule reaches inside worktrees | parallel-ready | done |
| C | `slice-c-graph-prune.md` | `npm run graph:prune` | parallel-ready | done |
| D | `slice-d-skills-contract-docs.md` | Skills, contract, owner docs describe the new plan | A | in-progress (two `codehealth` sentences await the owner) |
| E | `slice-e-product-truth-and-ship.md` | Apply the seven gate blocks, rewrite fixtures, live smoke, ship gates | A, B, C, D | done |

## Smoke

Both preflight shapes ran for real on 2026-09-06 after slices A–D:

- **Root shape — three rig reps** (recorded in
  `PRD/instructions/skill-fixtures/graph-kickoff/untouched-checkout-and-gate.md`):
  from a root clone with a 15-path dirty tree, `npm run graph:preflight --
  --branch feature/collection-manager --slug card-collection-manager --run-id … --dry-run`
  then the real run created `.worktrees/kickoff-card-collection-manager` on the
  branch cut from `origin/main` and pushed it to the rep's bare origin; the
  launch tree's status, `HEAD`, branch (`main`), and empty stash were identical
  before and after in all three reps.
- **In-place shape — this worktree** (`.worktrees/graph-workflow-fix`, a linked
  worktree, clean tree): the dry run printed `shape: linked-worktree`, `tree:
  clean`, `base: origin/main (default)` and the three in-place commands; the real
  run (`--branch thejudge-auto/smoke-20260906 --slug smoke-20260906 --run-id
  graph-smoke-20260906 --pid <session pid>`) switched this worktree to the new
  branch, pushed it (`git ls-remote --heads origin` shows
  `refs/heads/thejudge-auto/smoke-20260906` at `cbab6fb`, the `origin/main` tip),
  and took the lock at this root. The driver then switched back, wrote
  `.worktrees/.graph-run-release.json` (`state: COMPLETE`) and removed the lock.
- **Prune:** `npm run graph:prune` afterwards lists
  `delete branch thejudge-auto/smoke-20260906 — merged into origin/main; package
  smoke-20260906 is gone from main` (10 to delete, 5 kept, 2 reported; nothing
  changed). `--apply` is the owner's act and was not run. The remote smoke
  branch is the owner's to delete (remote deletion is denied to a run).

## Implementation map

| Area | Files |
| --- | --- |
| Preflight | `scripts/graph-preflight.mjs` (+test), `scripts/graph-digest.mjs` (+test), `.claude/graph-profile.json` |
| Hook | `scripts/lib/boundary-rules.mjs` (+test), `scripts/graph-boundary-hook.mjs` (+test) |
| Prune | `scripts/graph-prune.mjs` (+test), `package.json` |
| Skills | `.claude/skills/graph-preflight`, `graph-kickoff`, `graph-implement`, `codehealth`, `graph-gate-review/reference.md`; mirror via `npm run skills:ai-sync` |
| Docs | `PRD/instructions/graph-workflow-contract.md`, `OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`, two `graph-kickoff` fixtures |
| Product truth | `PRD/sections/functional-requirements.md` (REQ-191, REQ-192 new; REQ-170, 162, 164, 161 amended), `PRD/sections/user-flows.md` (FLOW-022) |
