# Slice A — Frontend components and hooks surface pass

## Status: planned

## Goal

Read every hand-authored file under `apps/frontend/src/components/**` and
`apps/frontend/src/hooks/**`, seeded by (not replaced by) searches, and record
every duplication finding that clears the brief's floor — at least two
independent implementations a future change to the same need would have to
touch together.

## Requirements

1. Enumerate the surface's file inventory with `git ls-files
   apps/frontend/src/components apps/frontend/src/hooks` and record the count.
2. Run seeding searches per `DESIGN-BRIEF.md`'s `## Method`: repeated literal
   class strings and magic numbers, repeated exported symbol names,
   near-identical function signatures, and parallel handler names (open,
   close, dismiss, retry) — scoped to this surface.
3. Read the files the searches surface, plus enough of the rest of the
   inventory to not rely on grep alone (grep finds literal repetition; it does
   not find two helpers computing the same value by different routes).
4. For each finding clearing the floor, record in
   `audit-notes/surface-a-components-hooks.md`: Need, Locations (two or more,
   each `path:line-range` plus symbol name), Verdict (`accidental` /
   `deliberate but consolidatable` / `healthy`), Consolidation (suggested
   single home, roughly which files change), Size (`small` / `medium` /
   `large`), Complexity removed (how many independent places must currently
   change together, what silently diverges if one copy is edited and the
   others are not).
5. Record any surface item that looks duplicated in a grep but is confirmed
   healthy reuse (e.g. the already-known `useScanCapture.ts` /
   `ScanCameraSurface.tsx` pair from `DEC-157`, if it falls in this surface)
   as Healthy reuse, not a finding.
6. Draft this surface's coverage-table row: directory, file count examined,
   whether it produced findings.

## Acceptance criteria

- [ ] A1. This surface's file inventory is enumerated with `git ls-files
      apps/frontend/src/components apps/frontend/src/hooks` and the count is
      recorded in the notes file.
- [ ] A2. `audit-notes/surface-a-components-hooks.md` exists, recording every
      finding in the brief's per-finding field shape and a draft coverage-table
      row for this surface.
- [ ] A3. At least one seeding search (repeated literals/magic numbers,
      repeated exported symbol names, near-identical signatures, or parallel
      handler names) was run scoped to this surface, per the brief's Method.

## Verification

```bash
git ls-files apps/frontend/src/components apps/frontend/src/hooks | wc -l
cat PRD/work/codebase-duplication-audit/audit-notes/surface-a-components-hooks.md
```

## Files touched

- `PRD/work/codebase-duplication-audit/audit-notes/surface-a-components-hooks.md`
