# Receipt — graph-workflow-branching — 2026-09-06

**What happened:** starting an idea with `/graph-kickoff` no longer touches your
checkout. The run makes its own folder under `.worktrees/kickoff-<slug>`,
always branched from `origin/main`, and works there; the rule that refused a
new idea while another idea's docs PR was open is gone; the hook rule that
stops a run editing its own skills and settings now also catches those files
inside any worktree (it never did before, including for the build half); and a
new `npm run graph:prune` shows what finished runs left behind and deletes the
safe subset only with `--apply`.

**What it means for you:** run `/graph-kickoff` for idea B while idea A waits
for your answers, from the same terminal, and stay on `main`. For two ideas at
the same moment, open a second session in a throwaway checkout (`OPERATOR.md`
recipe 2). One session per folder while a run is executing. When you want the
nine merged run branches and six stale staging folders gone, run
`npm run graph:prune -- --apply` from the repo root.

- Date: 2026-09-06
- Slug: `graph-workflow-branching`
- Status: shipped (PR 1 of 2; part 2 — one writer per branch, base-branch fate
  under delete-on-merge — is a separate package)
- Branch: `fix/graph-workflow-branching` from `origin/main` (`cbab6fb`), built
  in `.worktrees/graph-workflow-fix`; manual package (`OPERATOR.md` recipe 9),
  no graph run, no intake
- Evidence: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
  (the 2026-09-06 read-only audit; kept for part 2, findings 2 and 7)

## Actions taken

| Slice | What shipped |
| --- | --- |
| A | `scripts/graph-preflight.mjs` rewritten: fresh runs `git fetch`, `git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main`, push from inside it; a linked-worktree root works in place on a clean tree and refuses a dirty one; `--slug` required; the working-tree classifier, thresholds, secret gate, auto-commit, stash, and the base→main guard (`classifyPendingBaseToMain`) removed; `OPEN_BASE_TO_MAIN_PRS_COMMAND` moved to `scripts/graph-digest.mjs`; the profile's two `git stash` allow rules removed (owner-applied) |
| B | `scripts/lib/boundary-rules.mjs`: `repoRelativeWritePath()` makes a written path repo-relative and strips one leading `.worktrees/<dir>/` before `isProtectedPath()`; the hook passes its resolved root in. Relative, absolute, `.worktrees/kickoff-x/…`, and `.worktrees/implement-x/…` forms all deny under the lock, all allow without |
| C | `scripts/graph-prune.mjs` + `npm run graph:prune`: pure `classifyLeftovers` over branches, worktrees, intake folders; dry-run default; `--apply` uses `git branch -d`, `git worktree remove`, never a remote ref or a `.graph-*` control file; a merged docs branch whose package is still on `main` is kept as the build half's base; `.worktrees/.codehealth/` excluded; out-of-root worktrees reported only |
| D | `graph-preflight`, `graph-kickoff`, `graph-implement` (+reference), `graph-gate-review/reference.md`, `codehealth` skills and their `.agents/` mirror; `PRD/instructions/graph-workflow-contract.md` (preflight step, guard sentence, ledger `- Worktree:` line, `## Stashed work handoff` removed, gate trigger, `git add -A` paragraph, `## One run at a time`); `OPERATOR.md` (new recipe 2, per-root rule in recipe 4, recipe 6 guard sentence, prune row); `AGENT-SKILLS.md`; `PRD/README.md`; stale comments in `scripts/fixture-rig.mjs` and its test |
| E | Product truth applied by intent from `GATE-QUESTIONS.md` (7 blocks, all accepted by the owner in refinement): new REQ-191, REQ-192; amended REQ-170, REQ-162, REQ-164, REQ-161 (`functional-requirements.md`), FLOW-022 (`user-flows.md`). Fixtures: `dirty-checkout-and-gate.md` renamed to `untouched-checkout-and-gate.md` and regraded; `single-door-and-thin-request.md` item 7 reworded |

## Files

Created: `scripts/graph-prune.mjs`, `scripts/graph-prune.test.mjs`,
`PRD/instructions/skill-fixtures/graph-kickoff/untouched-checkout-and-gate.md`
(renamed from `dirty-checkout-and-gate.md`), this receipt.

Updated: `scripts/graph-preflight.mjs` (+test), `scripts/graph-digest.mjs`
(+test), `scripts/lib/boundary-rules.mjs` (+test),
`scripts/graph-boundary-hook.mjs` (+test), `scripts/fixture-rig.mjs` (+test),
`package.json`, `.claude/graph-profile.json`, the five skills above in both
trees, `PRD/instructions/graph-workflow-contract.md`, `OPERATOR.md`,
`AGENT-SKILLS.md`, `PRD/README.md`, `PRD/sections/functional-requirements.md`,
`PRD/sections/user-flows.md`,
`PRD/instructions/skill-fixtures/graph-kickoff/single-door-and-thin-request.md`,
`PRD/work/STATUS.md`.

Deleted: `PRD/work/graph-workflow-branching/` (this cleanup).

## Verification

- `npm run quality:check` exit 0 on 2026-09-06: 464 script tests, coverage
  92.13% lines.
- Root-shape smoke: three rig-built reps (scoped fixture re-run, recorded in
  `untouched-checkout-and-gate.md`) — dry run first, launch tree byte-unchanged
  (status, `HEAD`, branch `main`, empty stash), kickoff worktree on the
  requested branch cut from `origin/main` and pushed to each rep's bare origin;
  3 of 3, zero divergence. Invoking repository unchanged per the rig snapshot.
- In-place smoke from the `.worktrees/graph-workflow-fix` worktree: dry run
  printed `shape: linked-worktree`, `tree: clean`, `base: origin/main
  (default)`; the real run cut and pushed `thejudge-auto/smoke-20260906` at
  `cbab6fb`, took the lock, and was released through the documented release
  record. The remote smoke branch is the owner's to delete.
- `npm run graph:prune` (dry run) lists 10 deletable items including the smoke
  branch, keeps `thejudge-auto/ai-answer-quality-baseline` ("package still on
  main: the build half's base"), reports the two `.claude/worktrees/*` trees.
  `--apply` not run.
- Skill fixture re-run for `single-door-and-thin-request.md` deferred (owner's
  choice); its one changed item is report wording.
- `PRD/sections/system-map.md`: no graph-workflow entry to flip.

## Notes for the owner

- Delete `thejudge-auto/smoke-20260906` on GitHub (remote deletion is denied
  to a run).
- `npm run graph:prune -- --apply` from the repo root when ready.
- Part 2 package: one writer per branch (the `land` conflicts) and the base
  branch's fate under `delete_branch_on_merge` — findings 2 and 7 in the probe
  folder.
- The harness serves skill files from the session's original project folder,
  so a session rooted in the main checkout reads the new skills only after
  this PR merges.
