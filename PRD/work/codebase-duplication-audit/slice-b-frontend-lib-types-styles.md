# Slice B — Frontend lib, types, and styles surface pass

## Status: planned

## Goal

Read every hand-authored file under `apps/frontend/src/lib/**`,
`apps/frontend/src/types/**`, the top-level `apps/frontend/src/*` files
(`App.tsx` and its co-located `App.*.test.tsx` files, `main.tsx`, `types.ts`),
`apps/frontend/src/test/**`, and the app's CSS (`apps/frontend/src/index.css`),
seeded by (not replaced by) searches, and record every duplication finding
that clears the brief's floor.

## Requirements

1. Enumerate the surface's file inventory with `git ls-files
   apps/frontend/src/lib apps/frontend/src/types apps/frontend/src/test` plus
   the top-level files and `index.css`, and record the total count.
2. Run seeding searches per `DESIGN-BRIEF.md`'s `## Method`, scoped to this
   surface: repeated literal class strings and magic numbers, repeated
   exported symbol names, near-identical function signatures, and parallel
   handler names.
3. Read the files the searches surface, plus enough of the rest of the
   inventory to not rely on grep alone.
4. For each finding clearing the floor, record in
   `audit-notes/surface-b-lib-types-styles.md`: Need, Locations (two or more,
   `path:line-range` plus symbol), Verdict, Consolidation, Size, Complexity
   removed — same field shape as the brief's `### F-##` entries.
5. Record confirmed healthy reuse separately from findings.
6. Draft this surface's coverage-table row.
7. Note (do not resolve — slice E owns this) anything in this surface that
   looks like a cross-boundary duplicate with backend or scripts code, for
   slice E to confirm or dismiss. In particular this surface contains
   `apps/frontend/src/lib/scan/recipe.ts` (perceptual-hash recipe) and the
   `*Policy.test.ts` files the brief names as cross-boundary starting points —
   read them for this surface's own within-surface findings, but leave the
   cross-boundary verdict to slice E.

## Acceptance criteria

- [ ] B1. This surface's file inventory is enumerated with `git ls-files`
      covering `apps/frontend/src/lib` and `apps/frontend/src/types`, and the
      count is recorded in the notes file.
- [ ] B2. `audit-notes/surface-b-lib-types-styles.md` exists, recording every
      finding in the brief's per-finding field shape and a draft coverage-table
      row for this surface.
- [ ] B3. At least one seeding search was run scoped to this surface, per the
      brief's Method.

## Verification

```bash
git ls-files apps/frontend/src/lib apps/frontend/src/types apps/frontend/src/test | wc -l
cat PRD/work/codebase-duplication-audit/audit-notes/surface-b-lib-types-styles.md
```

## Files touched

- `PRD/work/codebase-duplication-audit/audit-notes/surface-b-lib-types-styles.md`
