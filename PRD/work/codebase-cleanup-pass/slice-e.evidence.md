# Slice E evidence

## Precondition (read before coding)

Read `buildCandidate`, `annotateIngredient`, `cardIngredientSpec` and `templateIngredientSpec` in `apps/backend/src/commanderSpellbook/matcher.ts`, and the loader and index builder.

- A card ingredient's spec names exactly one candidate id: `candidateCardIds: [ingredient.cardId]`. `annotateIngredient` assigns only instances found in the pool under those ids (`availableInstances`), and an ingredient counts as satisfied only when `assigned.length === spec.quantity`.
- `quantity` is validated as a positive integer when a variant loads (`assertQuantity`, `catalog.ts`), so a card ingredient always needs at least one instance of its own oracle id.
- `fullyAssigned` is `missingCount === 0`, and `missingCount` sums every ingredient's shortfall. So "every distinct card-ingredient oracle id was submitted" is a necessary condition for `fullyAssigned`. Template ingredients only add requirements (an unresolved template can never be satisfied); they never remove this one.
- Without explicit intent the eligibility filter keeps only `fullyAssigned` candidates, so dropping variants that cannot be fully assigned cannot change the result. The final sort ends on `variantId` (a total order), so fetch order cannot change output.
- The index builder (`scripts/build-commander-spellbook-combos.mjs`, lines 452-459) lists a variant under each distinct card-ingredient oracle id exactly once (a `Set`), so the number of `byOracleId` lists that contain a variant is its distinct card-ingredient count. Template members go to `byTemplateOracleId`, which the count ignores.

Precondition holds; the slice proceeds.

## Baseline (tip after slice D, 2026-10-18)

Time of one `selectComboCandidates` call (game mode, one copy of the card on the battlefield, no combo wording) over the committed catalog, Node v26, scratch script run twice:

- Ashnod's Altar (6,148 variants): first call 160-165 ms, warm median 139 ms.
- Phyrexian Altar (5,296): first call 171-177 ms, warm median 175 ms.
- Sensei's Divining Top (3,102): first call 78-83 ms, warm median 76 ms.
- `matcher.test.ts`: 32 tests (the `commanderSpellbook` folder: 5 files, 84 tests).

## After

- Ashnod's Altar: first call 23-26 ms (includes building the per-catalog counts once, about 22 ms), warm median 0.6 ms.
- Phyrexian Altar: first call 0.6-0.7 ms, warm median 0.4 ms.
- Sensei's Divining Top: first call 0.4 ms, warm median 0.2 ms.
- `matcher.test.ts` unchanged (`git diff --stat HEAD` on it, and on `catalog.ts`, prints nothing): 32 tests pass. `commanderSpellbook` folder: 6 files, 89 tests (84 plus 5 new) pass.
- New file `commanderSpellbook/matcherPrefilter.test.ts` (outermost `describe` "Backend - Ask AI", per the closed feature vocabulary in `test-naming.md`): the 50 most-comboed cards alone, 16 boards built from real variants (full ingredient sets and pairs, from the lighter half of the top 50, seeded), and 6 seeded random pairs; each compared with the unfiltered scan (`{ prefilter: false }`, the same code path as before the change) in game mode without combo wording (at least 6 boards return combos, so the comparison is not vacuous); a sample of boards with combo wording in game and lookup modes; lookup without wording returns nothing; a fetch-count test (the prefilter fetches under a tenth of the variants). The integrity test decodes all committed variants in stored order and finds none failing. The new test file runs in about 9.7 s.
- `npm --workspace apps/backend run test`: 56 files, 896 tests pass (891 plus 5). Backend typecheck exits 0. Eval fixtures and `catalog.ts` byte-identical to `origin/main` (`git diff --stat origin/main` prints nothing for them).

## Dated observations (manual criteria)

2026-10-18 E1 — precondition confirmed by reading `matcher.ts` and the index builder; see "Precondition" above.

2026-10-18 E8 — timings, one call per board, before then after: Ashnod's Altar 139 ms to 0.6 ms warm (160 ms to 25 ms first call); Phyrexian Altar 175 ms to 0.4 ms warm (171 ms to 0.7 ms); Sensei's Divining Top 76 ms to 0.2 ms warm (79 ms to 0.4 ms).

## Notes

- Seam: `selectComboCandidates` gained an optional third argument `{ prefilter?: boolean }`. Production callers pass nothing (prefilter on). `{ prefilter: false }` exists so the test can run the pre-change scan as its reference. No call site changes.
- Log-only consequence (recorded in the brief's follow-ups): a corrupt variant that can never be fully assigned is no longer fetched without combo wording, so it no longer logs an integrity warning. The integrity test shows no committed variant is corrupt.

## Reverted findings

None.
