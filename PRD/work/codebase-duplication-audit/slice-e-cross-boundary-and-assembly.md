# Slice E — Cross-boundary surface pass and final assembly

## Status: planned

## Depends on

Slices A, B, C, D. Sequential, stated blocker: this surface "reads the other
four's inventories rather than a new file set" (`DESIGN-BRIEF.md`), and this
slice is the only one that writes the single shared deliverable file
`DUPLICATION-AUDIT.md`, so it must run after every note file it reads exists.

## Goal

Confirm or dismiss the brief's three cross-boundary starting points on the
code, find any other same-need-two-implementations pairs the FE↔BE↔scripts
boundary surfaces once slices A–D's inventories are in hand, then assemble the
one deliverable: `PRD/work/codebase-duplication-audit/DUPLICATION-AUDIT.md`.

## Requirements

1. Read `audit-notes/surface-a-components-hooks.md`,
   `audit-notes/surface-b-lib-types-styles.md`,
   `audit-notes/surface-c-backend.md`, and `audit-notes/surface-d-scripts.md`.
2. Confirm or dismiss, on the code, each of the brief's three named starting
   points — these are starting points to verify, not pre-accepted findings:
   - Perceptual-hash recipe: `apps/frontend/src/lib/scan/recipe.ts` versus
     `scripts/build-scan-vectors.mjs`, against the single-authoritative-recipe
     requirement at `PRD/sections/functional-requirements.md:629`.
   - Player-label list: the `PlayerLabel` union in
     `apps/frontend/src/types.ts` versus `PLAYER_LABELS` in
     `apps/backend/src/constants.ts`.
   - The frontend `*Policy.test.ts` files (`cardRulingsTransformPolicy`,
     `gameRulesBuildPolicy`, `metadataTransformPolicy`,
     `scryfallRefreshPolicy`) asserting behavior implemented in
     `scripts/*.mjs`.
3. Look for any other cross-boundary pair the four surfaces' inventories
   surface — the brief expects this surface to produce the highest-value
   findings.
4. Assemble `DUPLICATION-AUDIT.md` with the brief's four required sections, in
   order:
   - **Header** — commit SHA (`git rev-parse HEAD`), date, scope, exclusions.
   - **Findings** — every `### F-##` entry from all five surfaces (A–D's notes
     plus this slice's cross-boundary findings), ranked by complexity
     removed, not duplicated line count.
   - **Healthy reuse** — everything recorded as healthy across all five
     surfaces, with `DEC-157`'s `useScanCapture.ts` /
     `ScanCameraSurface.tsx` pair as the first entry per the brief.
   - **Coverage table** — all five surfaces' rows (the four from A–D's notes
     plus this slice's cross-boundary row), each with its directory, file
     count examined, and whether it produced findings.
5. Verify every location cited in every finding resolves: the path exists and
   the named symbol is present at the given lines.
6. Verify the coverage table's total file count reconciles against `git
   ls-files apps scripts` minus the brief's exclusion list.
7. Confirm read-only proof: `git status --porcelain` shows changes only under
   `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`.
8. Run `npm run quality:check` and confirm it exits 0, unchanged from the
   pre-audit baseline.

## Acceptance criteria

- [ ] E1. All four surface note files (A–D) were read before cross-boundary
      analysis began.
- [ ] E2. The perceptual-hash cross-boundary starting point was confirmed or
      dismissed by reading both `apps/frontend/src/lib/scan/recipe.ts` and
      `scripts/build-scan-vectors.mjs`.
- [ ] E3. The player-label cross-boundary starting point was confirmed or
      dismissed by reading both `apps/frontend/src/types.ts` and
      `apps/backend/src/constants.ts`.
- [ ] E4. The `*Policy.test.ts` versus `scripts/*.mjs` cross-boundary starting
      point was confirmed or dismissed by reading at least one of the four
      `*Policy.test.ts` files.
- [ ] E5. `DUPLICATION-AUDIT.md` exists with all four required sections
      (Header, Findings, Healthy reuse, Coverage table).
- [ ] E6. The coverage table's total reconciles against `git ls-files apps
      scripts`, minus the exclusion list.
- [ ] E7. `git status --porcelain` was run and shows changes only under
      `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`.
- [ ] E8. `npm run quality:check` was run and exits 0.

## Verification

```bash
git rev-parse HEAD
git ls-files apps scripts | wc -l
git status --porcelain
npm run quality:check
```

## Files touched

- `PRD/work/codebase-duplication-audit/DUPLICATION-AUDIT.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete

Promotion note for cleanup: per `DESIGN-BRIEF.md`'s Material assumption 1,
`DUPLICATION-AUDIT.md` is not promoted into `PRD/sections/`. Cleanup carries it
into `PRD/instructions/receipts/codebase-duplication-audit-<date>.md` and
deletes the package. No `PRD/sections/` edit applies to this package.
