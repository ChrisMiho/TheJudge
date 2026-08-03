# Slice D — Global reach, verification, and ship closure

## Status: done

## Goal

Prove the completed unified theme system reaches every named destination and scanner surface without
state loss or contract drift, then leave an auditable cleanup handoff.

## Requirements

1. Extend App-level integration coverage so one profile selection at the feature-portal Menu
   immediately retints representative consumers in:
   - In-Depth Question across an in-progress staged state and answered/conversation state;
   - Quick Question with typed/selected card or topic context preserved;
   - Player Life Tracker with life/counter/setup state preserved;
   - feature-portal trigger, active destination row, and Theme section;
   - scanner capture/reticle/progress/confirmation/review classes through the existing scanner test
     seam, without changing scan logic.
2. Exercise all six fixed profiles through the same global root-token path and assert exact document
   root variables. Do not snapshot duplicate per-component profile matrices.
3. Cover selection fallback and custom Colorless behavior at App level: retired/unknown stored ids
   are removed and Blue is applied; malformed custom data is removed; unavailable storage does not
   block render; custom Colorless and reset do not reset any active destination/workflow state.
4. Confirm through tests and diff review that the neutral slate backdrop, card-identity ring contract,
   REQ-060 ambient inventory, scanner behavior/motion, backend, request schemas, prompt assembly,
   provider selection, metadata, and stack ordering are unchanged.
5. Run the focused frontend tests, complete frontend suite/typecheck, and repository quality gate from
   a fresh final run. Run `git diff --check` and review status for accidental artifacts or secrets.
6. Perform a manual visual review of the five fixed Magic profiles plus Colorless on representative
   dark and light surfaces. Explicitly confirm Black remains legible and distinct from Colorless and
   the slate shell, and that White remains warm ivory/gold rather than neutral gray.
7. Carry the PRD promotion checklist below for `thejudge-cleanup`; this slice does not edit durable
   truth merely to claim shipped status, write the receipt, or delete the work folder itself.

## Tests

- New `App.mtg-color-themes.test.tsx`: global WUBRGC application, In-Depth staged/answered state
  preservation, destination switching, Quick state preservation, Life Tracker state preservation,
  invalid-storage fallback, and custom/reset. Reuse helpers from `src/test/appTestHelpers.tsx`; do
  not duplicate the existing `App.theming.test.tsx` staged-flow scenarios.
- Existing `QuickLookupApp`, Life Tracker, `FeaturePortalMenu`, `ThemeSection`,
  `ScanCameraSurface`, `ScanReviewBubble`, ambient-accent foundation, and card-identity-ring tests:
  representative reach and non-regression coverage.
- Full frontend/repository gates for regression and coverage thresholds.

## Acceptance criteria

- [x] App-level tests select every fixed profile and assert the exact four document-root variables
      while the current In-Depth workflow/answer remains mounted and unchanged.
- [x] App-level tests switch to Quick Question and Player Life Tracker, select a profile, and prove
      typed/selected Quick state and life/counter/setup state survive; portal chrome reflects the same
      root tokens.
- [x] Scanner component tests prove capture, reticle, progress, confirmation, and review surfaces use
      the shared tokens and retain their existing behavior/motion tests.
- [x] Invalid selected/custom storage and unavailable storage cases render safely, delete only the
      relevant malformed value when possible, and select the documented Blue/fixed-gray fallback.
- [x] `npm --workspace apps/frontend run test`,
      `npm --workspace apps/frontend run typecheck`, and `npm run quality:check` all pass from the
      final worktree state.
- [x] Manual visual check records that Black is readable on representative dark/light surfaces and
      distinct from Colorless/slate; White reads as warm ivory/gold; custom low-contrast Colorless is
      applied unchanged with no warning (accepted behavior).
- [x] Final diff review confirms no new token role, per-profile component branch, ambient-inventory
      member, backend/API/prompt/provider/metadata/scan-engine change, shipped preview asset, raw
      output, temporary file, or secret.
- [ ] The cleanup handoff covers durable truth review, system-map update, dated receipt, and deletion
      of this work folder.

## Verification

```bash
npm --workspace apps/frontend run test -- App.theming QuickLookupApp PlayerLifeTrackerApp FeaturePortalMenu ThemeSection ScanCameraSurface ScanReviewBubble ambient-accent cardIdentityRing
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run quality:check
git diff --check
git status --short
```

Manual check:

1. Run `npm run dev:mock` and visit In-Depth Question (staged and answered), Quick Question, Player
   Life Tracker, the portal Menu/Theme section, and a scanner surface.
2. Select White, Blue, Black, Red, Green, and Colorless; verify one global retint and no state reset.
3. Compare Black with Colorless on dark shell chrome, light Life Tracker surfaces, filled controls,
   and accent text; confirm Black's plum identity remains visible and legible.
4. Choose an intentionally low-contrast custom Colorless value; confirm it applies unchanged with no
   warning, then `Reset to gray` and confirm fixed gray returns without state loss.

## Files touched

- `apps/frontend/src/App.mtg-color-themes.test.tsx` (new)
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/portal/ThemeSection.test.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/src/components/ScanReviewBubble.test.tsx`
- `apps/frontend/src/test/ambient-accent-foundation.test.ts`
- `apps/frontend/src/lib/cardIdentityRing.test.ts`

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-119 in `sections/decisions/personalization.md` and its router entry in
      `sections/decisions.md` match the shipped WUBRGC catalog, four-token contract, permissive
      Colorless behavior, and retired-id deletion.
- [ ] Confirm REQ-099 in `sections/functional-requirements.md`, FLOW-007 in
      `sections/user-flows.md`, and NFR-011 in `sections/non-functional-requirements.md` match the
      verified implementation; preserve the custom-Colorless contrast exception.
- [ ] Update the **Frontend personalization** and **Theme palettes** entries in
      `sections/system-map.md` to describe the shipped six-profile catalog, separate custom RGB
      persistence/reset, and representative global reach. Apply the receipt/code system-map gate;
      do not use DEC/REQ status fields as shipped-state flags.
- [ ] Confirm `sections/goals-and-non-goals.md` still preserves no per-player/per-flow palettes,
      Magic branding assets, light mode, accounts, server sync, or theming framework.
- [ ] Write the cleanup receipt at
      `PRD/instructions/receipts/unified-mtg-color-themes-<YYYY-MM-DD>.md`, including the fixed-profile
      contrast result, manual Black/Colorless review, and final verification commands.
- [ ] Delete `PRD/work/unified-mtg-color-themes/` entirely, including the planning-only comparison
      image, after durable promotion and receipt creation.
- [ ] Leave `PRD/README.md` unchanged unless navigation/read-order guidance genuinely changed.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/unified-mtg-color-themes/` ready to delete
