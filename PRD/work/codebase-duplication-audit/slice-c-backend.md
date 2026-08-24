# Slice C — Backend surface pass

## Status: planned

## Goal

Read every hand-authored file under `apps/backend/src/**`, seeded by (not
replaced by) searches, and record every duplication finding that clears the
brief's floor.

## Requirements

1. Enumerate the surface's file inventory with `git ls-files
   apps/backend/src` and record the count.
2. Run seeding searches per `DESIGN-BRIEF.md`'s `## Method`, scoped to this
   surface: repeated literal class strings and magic numbers, repeated
   exported symbol names, near-identical function signatures, and parallel
   handler names.
3. Read the files the searches surface, plus enough of the rest of the
   inventory (including `app/`, `commanderSpellbook/`, `config/`, `eval/`,
   `prompt/`, `providers/`, `routes/`, `runtime/`, `test-utils/`, `types/`,
   `validation/`) to not rely on grep alone.
4. For each finding clearing the floor, record in
   `audit-notes/surface-c-backend.md`: Need, Locations (two or more,
   `path:line-range` plus symbol), Verdict, Consolidation, Size, Complexity
   removed.
5. Record confirmed healthy reuse separately from findings.
6. Draft this surface's coverage-table row.
7. Note (do not resolve — slice E owns this) anything that looks like a
   cross-boundary duplicate with frontend or scripts code — in particular
   `apps/backend/src/constants.ts` (`PLAYER_LABELS`), which the brief names as
   a cross-boundary starting point against the frontend `PlayerLabel` union.

## Acceptance criteria

- [ ] C1. This surface's file inventory is enumerated with `git ls-files
      apps/backend/src` and the count is recorded in the notes file.
- [ ] C2. `audit-notes/surface-c-backend.md` exists, recording every finding
      in the brief's per-finding field shape and a draft coverage-table row
      for this surface.
- [ ] C3. At least one seeding search was run scoped to this surface, per the
      brief's Method.

## Verification

```bash
git ls-files apps/backend/src | wc -l
cat PRD/work/codebase-duplication-audit/audit-notes/surface-c-backend.md
```

## Files touched

- `PRD/work/codebase-duplication-audit/audit-notes/surface-c-backend.md`
