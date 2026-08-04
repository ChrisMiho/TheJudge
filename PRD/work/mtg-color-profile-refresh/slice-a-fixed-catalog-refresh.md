# Slice A — Fixed catalog refresh and ship closure

## Status: done

## Goal

Ship the approved WUBRG swatch/token refresh through the authoritative catalog with exact regression
coverage while preserving every theme behavior and Colorless contract.

## Requirements

1. Update `palettes.test.ts` first so the approved matrix is executable before implementation:
   - assert the exact `swatch`, `accent`, `accentStrong`, `accentSoft`, and `accentContrast` values
     for all six profiles;
   - retain exact WUBRGC order and Blue-default assertions;
   - prove `hexToChannelTriple(palette.swatch) === palette.accentSoft` for White, Blue, Black, Red,
     and Green only;
   - retain the calculated 4.5:1 gate for `accentContrast` against both primary gradient endpoints;
   - retain fixed Black-versus-Colorless distinction and existing Colorless helper coverage.
2. In `palettes.ts`, replace only the five refreshed WUBRG profiles' `swatch`, `accent`,
   `accentStrong`, and `accentSoft` fields with these exact values in the file's native formats:
   - White: `#FAF8F2`; `237 231 214`; `176 163 130`; `250 248 242`
   - Blue: `#38E1FF`; `0 80 216`; `30 58 156`; `56 225 255`
   - Black: `#C77DFF`; `124 58 237`; `46 26 71`; `199 125 255`
   - Red: `#FF4D6D`; `193 2 48`; `122 4 36`; `255 77 109`
   - Green: `#4AFFA0`; `10 122 66`; `10 92 51`; `74 255 160`
3. Preserve White's `accentContrast` as `9 9 11`; preserve Blue/Black/Red/Green contrast as the
   shared white constant. Do not change any Colorless field (`swatch #71717A`, `accent 82 82 91`,
   `accentStrong 39 39 42`, `accentSoft 228 228 231`, white contrast).
4. Preserve the `Palette` interface, ids, names, order, default, lookup/validation helpers, hex
   parsing/conversion, Colorless resolver, selection/persistence APIs, CSS variable application,
   and every consumer component unchanged.
5. Add no presentation effect or architecture: no CSS shadow/bloom/halo, animation, new token role,
   generated shades, profile branch, consumer-local constant, dependency, or product asset.
6. Run the targeted palette test, the broader existing theme tests, typecheck, and the complete
   repository quality gate. Review the final diff to confirm only the catalog, its direct test, and
   this work package's planning/status documents changed for implementation.
7. Manually open the Theme menu and sample representative shared-token surfaces. Confirm White reads
   substantially less yellow; Blue/Black/Red/Green read vivid; Black remains distinct from
   Colorless/slate; and no selection, persistence, reset, layout, or motion behavior changed.

## Tests

- `apps/frontend/src/lib/theme/palettes.test.ts`: exact swatches/tokens, WUBRGC order, Blue default,
  WUBRG swatch-to-soft alignment, contrast floor, Black/Colorless distinction, and unchanged custom
  Colorless resolution.
- Existing `applyPalette.test.ts`, `themePrefs.test.ts`, `useThemePalette.test.ts`,
  `ThemeSection.test.tsx`, and `App.theming.test.tsx`: unchanged theme application, selection,
  persistence, reset/failure behavior, picker rendering, and representative global retinting.
- Full repository coverage gate: regression protection for every existing consumer and public
  contract without adding consumer-specific assertions for a values-only shared-boundary change.

## Acceptance criteria

- [x] `npm --workspace apps/frontend run test -- src/lib/theme/palettes.test.ts` passes exact catalog,
      swatch-alignment, contrast, and Black-versus-Colorless assertions.
- [x] `npm --workspace apps/frontend run test -- src/lib/theme/applyPalette.test.ts src/lib/theme/themePrefs.test.ts src/hooks/useThemePalette.test.ts src/components/portal/ThemeSection.test.tsx src/App.theming.test.tsx`
      passes with no behavior or persistence changes.
- [x] `npm --workspace apps/frontend run typecheck` passes. `npm run quality:check` fails
      pre-existing/unrelated to this change: ESLint errors on `tsconfigRootDir` ambiguity caused by
      a stray `.worktrees/thejudge-prepare` directory; confirmed via `git stash` reproducing the
      identical 580-error failure with none of this slice's edits applied.
- [x] `git diff --check` passes, and diff inspection shows no consumer component, CSS effect,
      backend, API/schema, prompt, provider, card-data, scan-engine, or data-pipeline edit.
- [x] An explicit manual check of the Theme menu confirms the five refreshed swatches match their
      `accent-soft` highlights and fixed Colorless remains visually/behaviorally unchanged.
- [x] An explicit manual check on representative dark/light and filled-accent surfaces confirms the
      intended refreshed direction, readable fixed-profile contrast, and Black separation from
      Colorless and the slate shell.
- [ ] The cleanup handoff records durable PRD confirmation, receipt creation, and deletion of this
      work folder.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/theme/palettes.test.ts
npm --workspace apps/frontend run test -- src/lib/theme/applyPalette.test.ts src/lib/theme/themePrefs.test.ts src/hooks/useThemePalette.test.ts src/components/portal/ThemeSection.test.tsx src/App.theming.test.tsx
npm --workspace apps/frontend run typecheck
npm run quality:check
git diff --check
git status --short
```

## Files touched

- `apps/frontend/src/lib/theme/palettes.ts`
- `apps/frontend/src/lib/theme/palettes.test.ts`
- `PRD/work/mtg-color-profile-refresh/README.md` (slice status/handoff only)
- `PRD/work/mtg-color-profile-refresh/slice-a-fixed-catalog-refresh.md` (status/verification notes only)

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm amended DEC-119 in `sections/decisions/personalization.md` matches the shipped fixed
      catalog, swatch alignment, vivid Black direction, and unchanged theme boundaries.
- [ ] Confirm amended REQ-099 in `sections/functional-requirements.md` matches the verified exact
      swatches/tokens and coverage; edit only if shipped behavior differs.
- [ ] Confirm NFR-011 in `sections/non-functional-requirements.md` still states the verified 4.5:1
      fixed-profile floor and unchanged custom-Colorless exception.
- [ ] Confirm FLOW-007 in `sections/user-flows.md` remains accurate without a behavior amendment,
      and confirm DEC-119's router summary needs no value-level change.
- [ ] Review the shipped global-theme entry in `sections/system-map.md`; keep its shipped status and
      architecture wording unless verified behavior requires a narrow catalog note.
- [ ] Write a dated `mtg-color-profile-refresh` receipt under `PRD/instructions/receipts/` with the
      exact verification commands and manual visual evidence.
- [ ] Delete `PRD/work/mtg-color-profile-refresh/` entirely after durable truth and receipt review.
- [ ] Leave `PRD/README.md` unchanged unless navigation or read-order guidance genuinely changed.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/mtg-color-profile-refresh/` ready to delete
