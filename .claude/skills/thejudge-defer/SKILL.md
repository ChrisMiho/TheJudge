---
name: thejudge-defer
description: >-
  Use to park a PRD/work/<slug>/ package that is not next work, or to restore a
  previously deferred package. Reversible: preserves every artifact, worktree,
  branch, and PR. Refuses ship-ready packages and active packages with an
  in-progress slice.
---

# TheJudge Defer

## Goal

Toggle a work package between its current status and `deferred` without losing
any artifact, worktree, branch, or PR. Deferral is reversible in both
directions and touches nothing but status signals and the board.

## Inputs

Work slug. Optional short reason — required on the deferring invocation. If no
reason was supplied in the same message, ask once rather than writing an empty
reason.

## Reads

1. `PRD/work/<slug>/README.md`
2. `PRD/work/<slug>/STATUS.*` marker
3. `PRD/work/STATUS.md`
4. `PRD/instructions/workflow-reference.md` — status vocabulary and marker rules

## Writes

### Deferring (package is not currently `deferred`)

Refuse if `status: ship-ready` — that package belongs to `thejudge-cleanup`.
Refuse if `status: active` and any slice doc's status line is `in-progress`,
naming which slice. Otherwise:

1. Add this section to `README.md`:

   ```markdown
   ## Deferral record

   - Previous status: <status>
   - Reason: <short reason>
   ```

2. Change the README's `status:` field to `deferred`.
3. Replace the marker with `STATUS.deferred`.
4. Move the board row to `## deferred` in `PRD/work/STATUS.md`.

### Restoring (package is currently `deferred`)

1. Read `## Deferral record`'s "Previous status".
2. Set the README's `status:` field back to that value.
3. Replace the marker with `STATUS.<previous status>`.
4. Move the board row back to that status's section in `PRD/work/STATUS.md`.
5. Remove the `## Deferral record` section entirely.

## Gates

- Never touch `GAMEPLAN.md`, slice docs, worktrees, branches, or PRs. Deferral
  is a status-and-board operation only.
- Never defer a package with no `README.md` or no `STATUS.*` marker — report it
  as not a valid package instead.
- Exactly one marker file at all times; replace, never add a second.

## Next step

Deferred → no required handoff; the package is parked.
Restored → name the typical next skill for the restored status from
`workflow-reference.md`'s vocabulary table (for example, restored to `active` →
`/thejudge-implement PRD/work/<slug>/`).

(`$thejudge-*` in Codex.)
