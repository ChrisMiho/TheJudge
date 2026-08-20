# Slice M — Fixture rig owns rep setup

## Status: done

Scope item 5. Depends on: **C**. **Parallel-ready** — `scripts/fixture-rig.mjs`
and its test share no file with slices D–L.

## Goal

A fixture rep cannot leak into the real repository, and if it does, the rig says
so mechanically rather than waiting for someone to notice.

## Requirements

1. `scripts/fixture-rig.mjs` owns rep setup instead of leaving it to bullet
   points in a fixture file:
   - **one clone and one bare `origin` per rep** — never the real remote, because
     the scenario pushes `feature/collection-manager` and reps collide on a
     shared origin
   - the clone path **baked into every dispatch prompt it emits**
   - `node_modules` as a **real directory, never a symlink** —
     `.gitignore`'s `node_modules/` does not match a symlink, so `stash -u` swept
     it up and broke the toolchain
   - the invoking repository's `HEAD` and `git status --porcelain` snapshotted
     **before and after**, failing the run on any difference
2. That last line is the one that matters: it detects a leak mechanically rather
   than depending on someone noticing.
3. The rig writes only to temp dirs and per-rep clones — never a protected path,
   so slice C's guard passes it without an exemption. Keep it that way.

## Acceptance criteria

- [x] `node --test scripts/fixture-rig.test.mjs` passes; setup and snapshot
      comparison are tested pure functions
- [x] Each rep gets its **own** clone and its **own** bare origin — asserted, not
      assumed. Two reps run concurrently without either seeing the other's
      `feature/collection-manager` push
- [x] The rig never points a rep at the real remote — asserted by inspecting the
      rep clone's `origin` URL
- [x] Every dispatch prompt the rig emits contains the rep's **absolute** clone
      path
- [x] `node_modules` in a rep clone is a **directory**, not a symlink:
      `test -d … && ! test -L …`
- [x] **The leak check:** with a rep deliberately made to write into the invoking
      repository, the after-snapshot differs and the run **fails**, naming the
      changed paths
- [x] With a well-behaved rep, `git -C <real-repo> status --porcelain` is empty
      after the run and the snapshot comparison passes
- [x] `scripts/protected-write-guard.test.mjs` passes with `fixture-rig.mjs` on
      the tree and **no new exemption**
- [x] `npm run quality:check` green

## Verification

```bash
node --test scripts/fixture-rig.test.mjs
node --test scripts/protected-write-guard.test.mjs
npm run test:scripts
git status --porcelain    # empty after any rig exercise
npm run quality:check
```

## Files touched

- `scripts/fixture-rig.mjs` (new)
- `scripts/fixture-rig.test.mjs` (new)
- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md` — rep
  setup delegated to the rig

## Result

`scripts/fixture-rig.mjs` owns rep setup. Ten tests in
`scripts/fixture-rig.test.mjs`, all passing; `npm run test:scripts` is 133.

| Export | Guarantee |
| --- | --- |
| `repLayouts` / `layoutsAreIsolated` | one clone and one bare origin per rep, distinct |
| `createRep` | own bare origin, never the real remote; `node_modules` a real directory |
| `dispatchPrompt` | the rep's **absolute** clone path baked in, with the propagate-verbatim instruction; a relative path throws |
| `repUsesOwnOrigin`, `nodeModulesIsRealDirectory` | the assertions, so they are checks rather than intentions |
| `snapshotRepo` / `compareSnapshots` | the invoking repository before and after; any new path or moved `HEAD` fails the run and names what changed |

### Isolation, asserted not assumed

Three reps get distinct clones and origins. **Two reps then push
`feature/collection-manager` — the scenario's real branch — and both succeed**,
with each origin holding only its own rep's commit. On a shared origin the
second push fails and the run measures the collision instead of the skill.

A rep built from a seed repository whose `origin` points at
`https://github.com/example/real.git` comes out pointing at its own bare origin;
the test asserts the URL contains no `github.com`.

### The leak check

The 2026-08-17 failure, reproduced: a rep writes
`PRD/sections/decisions/card-collection.md` into the invoking repository. The
comparison returns `ok: false`, `leaked` holding exactly that path, and the
message "A rep wrote outside its clone. Revert these paths before recording any
result."

Two cases the requirements did not name and the check needs:

- **A committed leak leaves a clean status.** `compareSnapshots` also compares
  `HEAD`, so a rep that commits into the invoking repository fails with
  "HEAD moved <a> -> <b>" rather than passing on an empty porcelain.
- **Pre-existing dirt is not a leak.** The invoking checkout may already be
  dirty; only paths that are *new* since the before-snapshot count.

### A defect the leak check caught

The first run reported the leak as `PRD/sections/decisions/` — plain
`--porcelain` collapses a new untracked directory to its folder. The criterion
is "naming the changed paths", and a folder name is not the file a reviewer has
to go revert. `snapshotRepo` now uses `--porcelain -uall`.

### The drift guard did its job on its first real case

`fixture-rig.mjs` initially failed `protected-write-guard.test.mjs`:
`scripts/fixture-rig.mjs (mkdirSync( + "thejudge-")`. The rig writes directories
and its header comment named a `thejudge-*` skill by filename. Per requirement 3
the fix was to **stop naming a protected path**, not to add an exemption — the
comment now names phase skills by role, and says so explicitly so a later editor
does not reintroduce it. The exemption list still holds exactly one entry.

### Fixture doc

`dirty-checkout-and-gate.md` gains `## Rep setup is the rig's, not this file's`
— a table mapping each rig function to what it guarantees, the statement that
the notes below are the reasoning rather than a hand-build checklist, and the
separate-deliberate-commit rule for recording results. The `node_modules`
warning now records that `createRep` enforces it.

`git status --porcelain` in this worktree is empty of unintended paths after
every rig exercise — the tests build and tear down their own sandboxes under
`os.tmpdir()`.

`npm run quality:check` exits 0.
