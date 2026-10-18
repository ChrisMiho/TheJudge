# Slice B — Shared identifier and per-frame work

## Status: done

## Goal

The card identifier is built once per page and shared by all three scanners,
and each camera frame does less work, with scan results identical.

## Requirements

1. New module-level `loadScanResources()` in `apps/frontend/src/lib/scan/`
   loads the hash database and scan map, builds one `CardIdentifier`, returns
   `{ identifier, scanMap }`, caches its promise and clears it on rejection
   (same rule as slice A).
2. `useScanCapture`'s default dependencies use it; tests still inject their own
   loaders through the existing `dependencies` parameter.
3. `CardIdentifier`'s constructor (`identify.ts` lines 213-226) stops copying
   each fingerprint twice: count searchable entries, preallocate one buffer,
   copy in one pass (or use a view of the decoded buffer when no `_card_back`
   entry exists). Ids and order unchanged.
4. `identify()` (`identify.ts` line 251) replaces the full index sort with a
   bounded top-N selection keeping ties in lower-index-first order, exactly the
   stable sort's result.
5. `resolveScanCandidatesRanked` (`resolveScanCandidates.ts` line 40) caches
   the card-id lookup map per card-list array in a `WeakMap`.
6. Scan README "Where it lives" lists `loadHashDb.ts` and the new
   `loadScanResources` module (housekeeping, no owner decision).
7. No `PRD/sections/` product-truth edit in this slice.

## Parity check (QC A1)

`apps/frontend/src/lib/scan/identification/identify.test.ts` compared against
`apps/frontend/src/lib/scan/__fixtures__/vectors.json` passes unchanged.
`reference/identify.py` does not exist; do not run Python.

## Tests added or changed

- `identify.test.ts`: add one test that bounded selection equals the full sort
  on a tie-heavy synthetic database. Existing tests and `vectors.json` are not
  edited.
- New `loadScanResources` test: two scanners get the same identifier object;
  rejection clears the cache and the next call rebuilds.
- `resolveScanCandidates.test.ts`: same card-list array reuses one lookup map.
- `useScanCapture.test.ts`: default path shares the resources.

## Acceptance criteria

- [ ] `identify.test.ts` against `__fixtures__/vectors.json` passes with no edit to existing cases or the fixture
- [ ] New test: bounded top-N equals the full stable sort on a tie-heavy synthetic database
- [ ] `loadScanResources` returns the same identifier to repeated callers and clears on rejection (tests pass)
- [ ] The `CardIdentifier` constructor builds its buffer in one pass with ids and order unchanged (existing identify tests pass)
- [ ] The resolver reuses one lookup map per card-list array (test passes)
- [ ] Scan README file lists name `loadHashDb.ts` and the `loadScanResources` module
- [ ] Frontend tests, typecheck, lint and format check pass
- [ ] A reviewer confirmed `vectors.json` and existing `identify.test.ts` cases are unmodified in the diff (manual, dated observation)

## Verification

```bash
npm --workspace apps/frontend run test -- identify loadScanResources resolveScanCandidates useScanCapture
git diff origin/main -- apps/frontend/src/lib/scan/__fixtures__/vectors.json
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `apps/frontend/src/lib/scan/identify.ts`
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts`
- `apps/frontend/src/lib/scan/loadScanResources.ts` (new)
- `apps/frontend/src/hooks/useScanCapture.ts`
- the tests listed above
- `PRD/sections/scan/README.md` (file lists only)
