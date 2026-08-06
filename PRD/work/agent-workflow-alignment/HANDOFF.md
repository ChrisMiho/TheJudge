# Handoff — agent workflow alignment

## Resume prompt

Implement this package: seven sequential slices (A→G) aligning TheJudge's agent
workflow tooling. Nothing has been implemented yet — all slices are `planned`.

```text
$thejudge-implement-all PRD/work/agent-workflow-alignment/
```

Read `DESIGN-BRIEF.md`, `DEC-154`, and `GAMEPLAN.md` first. Do not re-litigate
the design or re-ask design questions — it was approved by the user on
2026-08-05. Verify the live Git state before the first edit.

## Phase status

Refinement, quality-check, and map-out are **complete**. The package is
`status: active` with `STATUS.active`, a `GAMEPLAN.md`, and seven slice docs.

| Phase | State |
| --- | --- |
| Refinement | complete — `DESIGN-BRIEF.md` written, `DEC-154` promoted |
| Quality-check | complete — passed |
| Map-out | complete — `GAMEPLAN.md` + slices A–G |
| Implementation | **not started** — all seven slices `planned` |

## Authority

- `DESIGN-BRIEF.md` and `DEC-154` (`PRD/sections/decisions/doc-process.md`) are
  the approved design. Slices implement that decision's Impact list verbatim.
- `GAMEPLAN.md` owns architecture, slice ordering, and the verification
  checklist.
- `README.md`'s slice table is the progress board; update slice status there.

## Repository facts at handoff (re-confirm, do not assume)

- Branch `feature/agent-flow`, clean working tree, in sync with
  `origin/feature/agent-flow`.
- `.cursor/skills`, `.agents/skills`, and `.claude/skills` are byte-identical.
  Run `diff -rq` before the first skill edit so later drift is attributable.
- Not yet done, confirming implementation has not started:
  - `.cursor/skills/thejudge-map-out-parallel/` still exists (slice A deletes it)
  - `.cursor/skills/thejudge-implement-parallel/` still exists (slice A)
  - `.cursor/skills/thejudge-defer/` does not exist (slice E creates it)
  - `PRD/instructions/runtime-process-hygiene.md` does not exist (slice F)
  - `scripts/process-manager.mjs` does not exist (slice G)

## Implementation constraints

- Slices are strictly sequential — each depends on the previous slice's file
  state. One agent, no wave grouping, no slice-level parallelism.
- Edit canonical `.cursor/skills/thejudge-*/` only. Never edit the `.agents/` or
  `.claude/` mirrors directly. Every canonical skill edit (slices A–F) ends with
  `npm run skills:ai-sync` plus a byte-identical mirror check — a per-slice
  acceptance criterion, not deferred to the end.
- `DEC-154` requires failing-baseline-first contract scenarios before each
  canonical skill edit: establish a scenario the current skill fails, edit, then
  re-run it.
- Slices A–F are docs/skills only. Only slice G touches executable code
  (`scripts/dev.mjs`, new `scripts/process-manager.mjs` plus tests,
  `apps/frontend/vite.config.ts`, `package.json`).
- No product code: no `apps/frontend` or `apps/backend` behavior, API contract,
  prompt assembly, or data handling changes.
- `npm run quality:check` must be green at the end of slice G, with
  `node --test scripts/*.test.mjs` wired into it.

## Bootstrap note

This package rewrites the skills that would otherwise run it. `DEC-154`
specifies autonomous implementation in `.worktrees/implement-<slug>` against a
recorded remote base — but that behavior is what slices B–D create, so it does
not exist yet. Implement this package in the current checkout on the current
branch, which is what `DEC-154` prescribes for collaborative work.

## Git discipline

- Commit per slice on `feature/agent-flow`. Do not merge to `main`, and do not
  push without explicit authorization.
- Do not remove, prune, or repoint any other worktree or branch.
- Preserve the rescue refs below and the unrelated 2026-08-03 stash.

### Rescue refs (verified present 2026-08-05, leave alone)

- `rescue/merge-abort-20260805-1905` — `dbd8dd1`, tracked responsive state
  captured before a parallel task committed it
- `rescue/automated-refinement-main-merge-20260805` — `0a82914`, the feature/main
  merge commit
- `rescue/agent-workflow-refinement-20260805` — `6bf7e02`, tracked approved
  refinement edits captured before the earlier pause

Untracked package archive (ephemeral `/tmp`, may not survive reboot):

```text
/private/tmp/thejudge-agent-workflow-refinement-20260805.tar.gz
SHA-256 c68a4c6098c0820fec0aef4e1757a073a4ded4f699e072d83ce500bc354f970c
```

`stash@{0}` (`wip: player-life-tracker + commander-spellbook-combos (do not
lose)`, 2026-08-03) is unrelated to this package. Do not drop or apply it.

## Resolved — no longer action items

The earlier refinement-phase handoff paused on two concurrency issues. Both have
since resolved; they are recorded here so a future session does not reopen them.

- **Board row from responsive commit `ad3d1bb`.** That commit swept this
  package's board row into an unrelated commit while the row was still
  `refining`. The row now sits correctly under `## active` in
  `PRD/work/STATUS.md`. Nothing to reconcile. `ad3d1bb` remains pushed and must
  not be amended or reset.
- **`feature/automated-refinement` branch pointer.** The earlier handoff left an
  open question about which of three states to restore. The branch is now at
  `6f1ca0f` both locally and on `origin`, so the divergence is gone and no
  operator decision is pending.

## Next step after implementation

When all seven slices verify, set `STATUS.ship-ready` and stop. Do not run
cleanup in the same session; hand off to:

```text
$thejudge-cleanup PRD/work/agent-workflow-alignment/
```
