# Slice D — Scripts surface pass

## Status: planned

## Goal

Read every hand-authored file under `scripts/**` (including `scripts/lib/**`
and `scripts/fixtures/**`, which are hand-authored code and stay in scope per
the brief's fixtures carve-out) plus the `scripts` block of the root
`package.json`, `apps/frontend/package.json`, and `apps/backend/package.json`,
seeded by (not replaced by) searches, and record every duplication finding
that clears the brief's floor.

## Requirements

1. Enumerate the surface's file inventory with `git ls-files scripts` and
   record the count.
2. Read the `scripts` block of the three `package.json` files (root,
   `apps/frontend/package.json`, `apps/backend/package.json`). `DEC-155`
   already treats CI's decomposition of `quality:check` into sub-scripts as a
   duplication-bearing surface guarded by
   `scripts/ci-workflow-parity.test.mjs` — confirm that guard exists and
   record it under Healthy reuse, not as a new finding, per the brief's
   Material assumption 4.
3. Run seeding searches per `DESIGN-BRIEF.md`'s `## Method`, scoped to this
   surface: repeated literal class strings and magic numbers, repeated
   exported symbol names, near-identical function signatures, and parallel
   handler names.
4. Read the files the searches surface, plus enough of the rest of the
   inventory to not rely on grep alone.
5. For each finding clearing the floor, record in
   `audit-notes/surface-d-scripts.md`: Need, Locations (two or more,
   `path:line-range` plus symbol), Verdict, Consolidation, Size, Complexity
   removed.
6. Record confirmed healthy reuse separately from findings (including the
   `DEC-155` / `ci-workflow-parity.test.mjs` guard from step 2).
7. Draft this surface's coverage-table row, noting the `package.json` script
   blocks were included in the pass.
8. Note (do not resolve — slice E owns this) anything that looks like a
   cross-boundary duplicate with frontend or backend code — in particular
   `scripts/build-scan-vectors.mjs` (perceptual-hash builder side) and the
   `.mjs` scripts the frontend `*Policy.test.ts` files assert behavior
   against.

## Acceptance criteria

- [ ] D1. This surface's file inventory is enumerated with `git ls-files
      scripts` and the count is recorded in the notes file.
- [ ] D2. `audit-notes/surface-d-scripts.md` exists, recording every finding
      in the brief's per-finding field shape and a draft coverage-table row
      for this surface.
- [ ] D3. At least one seeding search was run scoped to this surface, per the
      brief's Method.
- [ ] D4. The `scripts` block of the root, frontend, and backend
      `package.json` files was read as part of this pass.

## Verification

```bash
git ls-files scripts | wc -l
cat PRD/work/codebase-duplication-audit/audit-notes/surface-d-scripts.md
```

## Files touched

- `PRD/work/codebase-duplication-audit/audit-notes/surface-d-scripts.md`
