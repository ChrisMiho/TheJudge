# Slice M — Fixture rig owns rep setup

## Status: planned

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

- [ ] `node --test scripts/fixture-rig.test.mjs` passes; setup and snapshot
      comparison are tested pure functions
- [ ] Each rep gets its **own** clone and its **own** bare origin — asserted, not
      assumed. Two reps run concurrently without either seeing the other's
      `feature/collection-manager` push
- [ ] The rig never points a rep at the real remote — asserted by inspecting the
      rep clone's `origin` URL
- [ ] Every dispatch prompt the rig emits contains the rep's **absolute** clone
      path
- [ ] `node_modules` in a rep clone is a **directory**, not a symlink:
      `test -d … && ! test -L …`
- [ ] **The leak check:** with a rep deliberately made to write into the invoking
      repository, the after-snapshot differs and the run **fails**, naming the
      changed paths
- [ ] With a well-behaved rep, `git -C <real-repo> status --porcelain` is empty
      after the run and the snapshot comparison passes
- [ ] `scripts/protected-write-guard.test.mjs` passes with `fixture-rig.mjs` on
      the tree and **no new exemption**
- [ ] `npm run quality:check` green

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
