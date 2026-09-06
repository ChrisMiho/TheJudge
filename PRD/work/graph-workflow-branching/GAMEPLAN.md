# Gameplan — graph-workflow-branching

Brief: `DESIGN-BRIEF.md` (decisions D1–D6). Proposal: `GATE-QUESTIONS.md`
(seven blocks, applied to `PRD/sections/` in slice E).

## Architecture

Three scripts change and one is added, all under `scripts/` with pure,
tested decision functions and I/O in `main()`:

| Script | Change |
| --- | --- |
| `scripts/graph-preflight.mjs` | fresh-run plan becomes worktree-add + push off `origin/main`; in-place plan for a linked-worktree root; working-tree classification, stash, auto-commit, and the base→main guard removed; `--slug` required on the fresh path |
| `scripts/lib/boundary-rules.mjs` + `scripts/graph-boundary-hook.mjs` | `protected-path-write` normalizes a written path to repo-relative and strips a leading `.worktrees/<dir>/` before `isProtectedPath()`; the hook passes the project root into the rule context |
| `scripts/graph-digest.mjs` | owns `OPEN_BASE_TO_MAIN_PRS_COMMAND`; still imports `GRAPH_BRANCH_PREFIX` |
| `scripts/graph-prune.mjs` (new) | classify branches, worktrees, and intake folders; dry-run default, `--apply` deletes the safe subset |

The driver skills (`graph-preflight`, `graph-kickoff`, `graph-implement`),
the contract, and the owner docs are rewritten to the new plan. Product truth
is applied last, from the gate file, by intent.

## Data flow (a fresh run after this ships)

1. Owner runs `/graph-kickoff "<idea>"` from a root checkout on `main`.
2. Node 1 (preflight): lock at root → `git fetch origin` → collision check →
   `git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main`
   → `git -C … push -u origin …` → prints `worktree:` and `base: origin/main`.
3. Driver writes `- Worktree:` into the ledger header; nodes 2–4 get
   `Working directory: <root>/.worktrees/kickoff-<slug>`; intake stays at
   `<root>/.worktrees/.graph-intake/<run-id>/`.
4. Docs PR opened from the worktree branch; park; worktree stays.
5. Owner merges; `graph-implement` claims from `main`, removes the kickoff
   worktree (branch kept), builds in `implement-<slug>` as today.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Preflight rewrite (script + tests + digest constant + profile) | parallel-ready |
| B | Worktree-aware protected-path rule (hook + tests) | parallel-ready |
| C | `graph:prune` (script + tests + npm script) | parallel-ready |
| D | Skills, contract, and owner docs rewritten to the new plan | A (the docs describe the script's real flags and output) |
| E | Apply product truth, rewrite the two fixtures, live smoke, ship gates | A, B, C, D |

## Verification checklist

- `npm run test:scripts` green after every slice; `npm run quality:check`
  green at E.
- Slice A: dry-run from a root checkout prints the worktree plan and
  `base: origin/main`; from a linked worktree prints the in-place plan; dirty
  in-place tree exits 1; no `gh` call on the fresh path.
- Slice B: the four protected-path forms deny with the lock, allow without.
- Slice C: `npm run graph:prune` on this checkout lists the audit's leftovers
  and keeps `thejudge-auto/ai-answer-quality-baseline`.
- Slice E: every `Current:` excerpt replaced by its `Proposed:` text (script
  check that no `Current:` text survives and every `Proposed:` text is
  present); live smoke recorded.

## Out of scope

Part 2 (single writer per branch; base-branch fate). Any change to the hook's
tiers, the lock record, the node table, or terminal states.
