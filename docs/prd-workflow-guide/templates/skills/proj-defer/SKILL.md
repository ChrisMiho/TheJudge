---
name: proj-defer
description: >-
  Use to park a PRD/work/<slug>/ package that is not next work, or to restore a
  previously deferred package. Reversible: preserves every artifact, worktree,
  branch, and PR. Refuses ship-ready packages and active packages with an
  in-progress slice.
---

# <Product> Defer

## Goal

Park real work that is not next work, reversibly and without losing anything.

Without this, packages that are real but not current either get deleted — losing
the work — or sit at `active`, making the board lie about what is in flight.

## Inputs

A work package slug or path, and a direction: defer or restore.

## Reads

- `PRD/work/<slug>/README.md` and its `STATUS.*` marker
- `PRD/work/STATUS.md`
- `PRD/instructions/workflow-reference.md`

## Writes

- The package README's `status:` field and its deferral record
- The `STATUS.*` marker
- The board row

## Deferring

1. Refuse if the package is `ship-ready` — finish it, do not park it.
2. Refuse if the package is `active` with any slice `in-progress` — bring that
   slice to `done` or `blocked` with a handoff block first.
3. Add to the package README:

       ## Deferral record

       - Previous status: <status>
       - Reason: <short reason>

4. Set `status: deferred`, replace the marker with `STATUS.deferred`, and move
   the board row under `## deferred`.

## Restoring

1. Read the previous status from the deferral record.
2. Restore the `status:` field, the marker, and the board row to that status.
3. Remove the deferral record section.

## Gates

- Never touch `GAMEPLAN.md`, slice documents, worktrees, branches, or PRs.
  Deferral is a status change and nothing else — that is what makes it safe.
- Never defer a `ship-ready` package.
- Never defer over an `in-progress` slice.

## Next step

Deferred: no handoff. The package is parked.

Restored: name the typical next skill for the restored status from
`PRD/instructions/workflow-reference.md` — for example, restored to `active`
hands off to `/proj-implement PRD/work/<slug>/`.
