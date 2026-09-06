# Receipt — graph-workflow-land — 2026-09-06

**What happened:** building an idea through the graph now costs two pull
requests instead of three, and the code PR no longer conflicts on the run's
bookkeeping files. The build half gets one folder (`.worktrees/implement-<slug>`)
and one branch (`thejudge-auto/<slug>-work`) cut from `origin/main`; every build
step works there and the driver's own notes go to the same branch between steps.
Cleanup runs *before* you merge, inside the code PR, so your merge of that PR
lands the code, the product truth, the receipt, and the work-folder deletion at
once. The docs branch GitHub deletes when you merge the docs PR is finished;
nothing re-creates it. `npm run graph:prune -- --apply` (note the `--`) is the
working spelling everywhere.

**What it means for you:** after this merges, a package is: answer and merge the
docs PR, then merge the code PR. Nothing follows. Three of the skill files this
package changes sit in folders the agent's tools are denied — the edits are
finished in `PRD/work/graph-workflow-land/staged/` and you apply them with the
four commands under `## Notes for the owner`; until then the package folder
stays and this receipt reads `partial`.

- Date: 2026-09-06
- Slug: `graph-workflow-land`
- Status: partial — slices A, C, D, E shipped; slice B's edits are complete but
  staged, pending the owner's `!cp` (see below). Flips to shipped when the
  staged copies are applied, `npm run skills:ai-sync` runs clean, and the
  package folder is deleted
- Branch: `fix/graph-workflow-land` from `origin/main` (`8d29ce4`), built in
  `.worktrees/graph-workflow-land`; manual package (`OPERATOR.md` recipe 9), no
  graph run, no intake
- PR: opened from this branch into `main`; the owner merges
- Evidence: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
  (the 2026-09-06 audit, findings 2 and 7); part 1 is
  `graph-workflow-branching-2026-09-06.md` (PR #201)

## Design in one paragraph

Decisions D1–D9 in the package's `DESIGN-BRIEF.md`. One folder, one branch, two
writers in turns (the driver only between nodes). Build from `origin/main`; keep
`delete_branch_on_merge` on. Node order `plan → build → review → close → land`:
`close` is `thejudge-cleanup` on the code branch before the merge, `land` is the
owner's merge and gets no ledger row; the run ends `COMPLETE` with the code PR
open. Cleanup's autonomous gate gains a pre-merge "PR-ready" path chosen by PR
state, and keeps the merged path unchanged for direct packages. The claim is the
branch; the status marker stays `refined` until `plan`. Prune deletes any merged
`thejudge-auto/*` branch. Drivers use `cd <worktree> && git …`, never `git -C`
(the profile allows the former only). Refinement went through four quality
checks (14, 12, 16 findings, then PASS); every finding is recorded in the brief.

## Actions taken

| Slice | What shipped |
| --- | --- |
| A | `scripts/graph-prune.mjs`: keep rule, `packageSlug`, `parsePackagesOnMain`, `packagesOnMain`, and the `ls-tree` call removed; any merged branch deletes with reason `merged into origin/main`. `scripts/graph-ledger-check.mjs`: `buildWriteScope` is `[".worktrees/implement-<slug>/"]`; a bare `PRD/work/<slug>/…` path parks. `scripts/graph-digest.mjs`: scans `.worktrees/*/PRD/work/*/GRAPH-RUN.md` too (`preferWorktreeLedgers`, worktree copy wins, printed `[in .worktrees/<dir>]`), heading `## PRs waiting on you`, `OPEN_GRAPH_PRS_COMMAND` / `pendingGraphPRs`. `boundary-rules.mjs` comment + test message → node 9. Tests updated; 464/464 |
| B | **Staged, not applied** (permission deny on `.claude/skills/thejudge-*/`): `thejudge-implement-all/SKILL.md` (`## Mode` in-place rule + explicit-shared-branch block, `## Inputs`, workflow item 1, completion gate, common mistakes), `thejudge-implement-all/reference.md` (preflight 3–7), `thejudge-cleanup/SKILL.md` (mode; reads 6–7; `- PR:` line; summary line written by `close`; delete mechanism per path; `### Autonomous gate: merged path and PR-ready path` with `#### Merged path` unchanged and `#### PR-ready path` new; node 8). Applied directly: path-note lines in `deleted-base-branch.md`, `gh-outage-during-merge-proof.md`, `promote-once-at-close.md`; two pointer rewordings in `intake-in-the-receipt.md`; new fixture `close-inside-the-code-pr.md` (unmeasured) |
| C | `graph-implement/SKILL.md`: sequences read `… → close → land`; build loop items 1–4 rewritten (`git show origin/main:…` queue, ready adds no-branch/no-worktree, kickoff worktree first with dirty → skip unclaimed, claim = `git worktree add … -b … origin/main` + first commit + push, marker left `refined`, every node in the worktree, driver commits between nodes); `## Loop` item 3 (node 8 `close`, node 9 never dispatched, porcelain + root-relative write check); `## Resolving the gate` (gate-review in the build worktree; second PR); `## Next step` (`COMPLETE` at `close`, post-`close` resume). `graph-implement/reference.md`: node table, entry-point table with post-`close` and remote-branch rows, "run `graph-preflight` first" removed, node 6 assertion, publish-before-build, "base is frozen" section removed, worktree shape, `## Node 9 (land)`. `graph-kickoff/SKILL.md`: `cd && git` wording, docs PR "answer and merge — that merge is the build signal", base definition for both halves; `reference.md` node-4 note. `graph-preflight/SKILL.md` line 212 `cd && git`. `graph-gate-review/SKILL.md`: node 9, runs in the build worktree when dispatched. Fixture `build-loop-ready-detection.md` rewritten. Both skill trees synced |
| D | `graph-workflow-contract.md`: §Overall flow 5 and 7, §Propose/apply/close, §The two runs (both PR paragraphs), node table rows 7–9, §Autonomous metadata (base = the branch the next PR targets), §Ledger header lines, §Instruction ledger write-scope paragraph, §Boundaries "the one merge", §The ledger outlives the run (summary line + `close` row), `COMPLETE` row. `preparation-contract.md` `## Autonomous base` scoping paragraph. `OPERATOR.md` recipe 6 rewritten ("Merge the code PR"), recipe 7 reminder dropped, "Where to look" ledger row + `-- --apply`. `AGENT-SKILLS.md` graph rows. `PRD/README.md` line 130. Part-1 receipt lines 17 and 83 `-- --apply`. `codehealth/SKILL.md` line 43 **staged** (same deny) |
| E | Product truth applied by intent from `GATE-QUESTIONS.md` (13 `Current:` excerpts byte-verified immediately before): REQ-193, REQ-194 new; REQ-171 (5 bullets), REQ-191 (2), REQ-192 (2), REQ-164 (1) amended in `functional-requirements.md`; FLOW-021 steps 7–8 + one edge case and FLOW-022 step 8 in `user-flows.md`. Sweeps run with named survivors (table in the slice doc). Claim rehearsal run locally, nothing pushed (transcript in the slice doc) |

## Files

Created: `scripts/` — none new; `PRD/instructions/skill-fixtures/thejudge-cleanup/close-inside-the-code-pr.md`;
`PRD/work/graph-workflow-land/staged/{thejudge-implement-all/SKILL.md,thejudge-implement-all/reference.md,thejudge-cleanup/SKILL.md,codehealth/SKILL.md}` (to be applied and then deleted with the folder); this receipt.

Updated: `scripts/graph-prune.mjs` (+test), `scripts/graph-ledger-check.mjs`
(+test), `scripts/graph-digest.mjs` (+test), `scripts/lib/boundary-rules.mjs`
(+test); `.claude/skills/graph-implement/{SKILL,reference}.md`,
`.claude/skills/graph-kickoff/{SKILL,reference}.md`,
`.claude/skills/graph-preflight/SKILL.md`, `.claude/skills/graph-gate-review/SKILL.md`
and their `.agents/skills/` mirrors; `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md`;
four fixtures under `PRD/instructions/skill-fixtures/thejudge-cleanup/`;
`PRD/instructions/graph-workflow-contract.md`, `PRD/instructions/preparation-contract.md`,
`OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`,
`PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md`,
`PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md`,
`PRD/work/STATUS.md`.

Deleted: nothing yet — `PRD/work/graph-workflow-land/` is deleted once the
staged copies are applied (see below).

## Verification

- `npm run quality:check` exit 0 after slices A, C, D, E (2026-09-06): 464
  script tests.
- `npm run skills:ai-sync` then `diff -rq .claude/skills .agents/skills` empty
  after slices C and E.
- `Current:` excerpts: 13/13 byte-identical before slice E's edits
  (`verify-current.mjs`).
- Sweeps: `frozen once` none outside receipts/probe; `node 8 (land)` /
  `node 9 (close)` none; `graph:prune --apply` and "add `--apply`" none without
  `--` outside the package's own docs; `git -C` in `graph-*/SKILL.md` only the
  script-run preflight line 52; `ls-tree` in skills none; `PRD/work/<slug>/` as
  a write prefix none; `base→main` only in the named history survivors plus
  REQ-194's two "no third base→main PR" statements and the staged
  `codehealth` line.
- Rehearsal (from the worktree, nothing pushed): `git worktree add
  .worktrees/implement-smoke -b thejudge-auto/smoke-land-work origin/main` ✓;
  `git show origin/main:PRD/work/` listed the two packages ✓; `cd … && git commit
  --allow-empty` committed on the branch ✓; `git worktree remove` ✓;
  `git branch -D thejudge-auto/smoke-land-work` denied to the agent (owner form).
- Quality checks on the brief: four fresh-context read-only reviewers; FAIL
  ×3 (14, 12, 16 findings, every one reworked in the brief), then PASS with 14
  non-blocking notes folded in.
- `PRD/sections/system-map.md`: no graph-workflow entry to flip.
- Fixture re-runs (AGENT-SKILLS.md step 2): `close-inside-the-code-pr.md` and
  `build-loop-ready-detection.md` are unmeasured by construction; the three
  measured cleanup fixtures keep their keys (merged path unchanged). Re-running
  is the owner's call, as in part 1.

## Notes for the owner

1. **Apply the staged skill edits** (the agent's tools are denied in these
   folders; the edits are complete). Run from this session's terminal in the
   worktree, then tell the agent to finish:

   ```
   !cp PRD/work/graph-workflow-land/staged/thejudge-implement-all/SKILL.md .claude/skills/thejudge-implement-all/SKILL.md
   !cp PRD/work/graph-workflow-land/staged/thejudge-implement-all/reference.md .claude/skills/thejudge-implement-all/reference.md
   !cp PRD/work/graph-workflow-land/staged/thejudge-cleanup/SKILL.md .claude/skills/thejudge-cleanup/SKILL.md
   !cp PRD/work/graph-workflow-land/staged/codehealth/SKILL.md .claude/skills/codehealth/SKILL.md
   !npm run skills:ai-sync
   ```

   The agent then verifies B1–B5, marks slice B done, deletes
   `PRD/work/graph-workflow-land/`, strips the board row, sets this receipt to
   `shipped`, and pushes.
2. Delete the never-pushed local rehearsal branch:
   `git branch -D thejudge-auto/smoke-land-work` (from any checkout of this
   repo).
3. Still open from part 1: delete `thejudge-auto/smoke-20260906` on GitHub;
   run `npm run graph:prune -- --apply` from the repo root.
4. After this PR merges: `/loop graph-implement` (launched with
   `claude --settings .claude/graph-profile.json`) builds
   `ai-answer-quality-baseline` under the new shape — one worktree, one
   branch, code PR into `main`, cleanup inside it. The skill files are served
   from the session's original project folder, so start a fresh session after
   the merge.
5. The two unmeasured fixtures (`close-inside-the-code-pr.md`,
   `build-loop-ready-detection.md`) owe a three-rep run when you want them
   measured.
