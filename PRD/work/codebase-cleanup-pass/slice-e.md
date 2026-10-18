# Slice E — Combo matching skips combos that cannot be complete

## Status: planned

Depends on: none (must land before G; both edit `commanderSpellbook/matcher.ts`). Finding: K-01.

## Goal

In In-Depth, when a heavily comboed card is on the board and the question does not mention combos, the server stops unpacking thousands of combos it would discard anyway (up to about 170 ms per question). The answer is the same.

## Requirements

1. **Precondition, first.** Read `buildCandidate` and the template-ingredient path (`byTemplateOracleId`) in `apps/backend/src/commanderSpellbook/matcher.ts`. Confirm: a card ingredient can be satisfied solely by an instance with that oracle id, so "every card ingredient hit" is a necessary condition for `fullyAssigned`. If this does not hold, **stop slice E**, revert nothing else, and record why in `slice-e.evidence.md` and in `## Reverted findings`.
2. Record the base: timing of `selectComboCandidates` for Ashnod's Altar (6,148 variants), Phyrexian Altar and Sensei's Divining Top (the probe measured 152, 167 and 72 ms), and the existing matcher test count.
3. In `matcher.ts` only (not `catalog.ts`, which the backend-health brief edits): compute once per catalog, in a `WeakMap` keyed by the catalog, each variant's count of distinct card-ingredient oracle ids from `byOracleId`. When `!request.hasExplicitIntent`, keep only variants whose distinct submitted-id hit count equals that count before calling `catalog.getVariant`. (`selectComboCandidates` is about `:355-390`; re-read.) The final sort ends on `variantId`, a total order, so fetch order cannot change output.
4. **New test** `Backend - Combo matching` (own file, e.g. `commanderSpellbook/matcherPrefilter.test.ts`): over boards built from the real committed catalog (each of the 50 most-comboed cards alone, plus a seeded sample of pairs; with and without combo wording; game and lookup modes) the prefiltered `selectComboCandidates` deep-equals the result of the pre-change pipeline, kept as a test helper built on the public catalog API. Keep the test under about 10 s.
5. **Second new test:** decode every committed variant once and assert none fails integrity validation (this makes the log-only consequence, no integrity warning for never-complete corrupt variants, unreachable for committed data).
6. Existing `matcher.test.ts` and prompt goldens stay green and unchanged.

## Acceptance criteria

- [ ] E1. The precondition is confirmed in the evidence log (or the slice is stopped and recorded).
- [ ] E2. `matcher.ts` computes a per-catalog `WeakMap` of distinct card-ingredient counts and filters before `getVariant` when `!request.hasExplicitIntent`; `catalog.ts` is unchanged.
- [ ] E3. The equivalence test exists, covers the 50 most-comboed cards, a seeded pair sample, with/without combo wording, game and lookup modes, and passes in about 10 s or less.
- [ ] E4. The integrity test decodes every committed variant and passes.
- [ ] E5. Existing `matcher.test.ts` passes unchanged (no edit to that file beyond slice A's).
- [ ] E6. `npm --workspace apps/backend run test` is green and eval goldens are byte-identical: `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
- [ ] E7. `npm --workspace apps/backend run typecheck` exits 0.
- [ ] E8. Before/after timings for Ashnod's Altar, Phyrexian Altar and Sensei's Divining Top are recorded in the evidence log.

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
git diff --stat origin/main -- apps/backend/src/eval/fixtures apps/backend/src/commanderSpellbook/catalog.ts
```

## Reverted findings

None yet.

## Files touched

- `apps/backend/src/commanderSpellbook/matcher.ts`
- new test file(s) under `apps/backend/src/commanderSpellbook/`
