# Slice D — Split outlier test files to lower the shard floor

## Status: planned

## Goal

Break up the three longest test files, preserving every assertion and case, so
no single file bounds how much sharding can help.

## Requirements

1. Split these measured outliers, which are 52s of the 114s frontend test CPU:

   | File | Cases | Duration |
   | --- | --- | --- |
   | `src/App.interaction-flows.test.tsx` | 50 | 18.2s |
   | `src/lib/scan/detection/detector.test.ts` | 15 | 17.6s |
   | `src/lib/scan/detection/detectorFixtures.test.ts` | 7 | 16.6s |

2. This is an **assertion-preserving refactor only** — the same operation
   DEC-086 authorized for `App.test.tsx`. No test is deleted, merged away,
   skipped, or weakened, and no assertion is dropped. Case count before and
   after must be identical.
3. Split along behavior seams already present in the files' `describe` blocks
   (for `detector.test.ts`: `orderQuadCorners`, `convexHull`/`polygonArea`,
   `minAreaRect`, `warpPerspective`, `detectCard`), not by arbitrary line count.
4. Preserve the `PRD/instructions/test-naming.md` convention — the outermost
   `describe` stays `Frontend - <Feature>` (e.g. `Frontend - Card Scan`) in every
   new file. Do not introduce Slice/REQ/DEC labels in suite titles.
5. Keep any shared fixture/setup in a single authoritative helper rather than
   copying it into each new file (technical-design-rules: reuse before creating).
6. Preserve slice C's `environmentMatchGlobs` coverage: new files split out of
   `src/lib/scan/**` must still match the `node` glob.

## Acceptance criteria

- [ ] Frontend case count is exactly **1227** before and after — record both
- [ ] No file among the three originals exceeds ~8s in the duration breakdown
      after the split
- [ ] Slowest shard wall time drops relative to the slice B measurement; both
      numbers recorded in this slice doc
- [ ] Total `expect(` count across the whole frontend test tree is **greater
      than or equal to** its pre-slice value — compare tree-wide totals before
      and after, not diff removals (a split necessarily removes lines from the
      original file and adds them to the new one, so counting deletions would
      flag every correct split)
- [ ] Every new file's outermost `describe` matches `Frontend - <Feature>`
- [ ] New `src/lib/scan/**` files still run under the `node` environment
- [ ] Coverage thresholds unchanged and coverage still passes on merged totals
- [ ] `npm run quality:check` green locally

## Verification

```bash
cd apps/frontend

# case count must be identical to 1227
npx vitest run --reporter=json --outputFile=/tmp/after.json
node -e "const r=require('/tmp/after.json');console.log('cases:',r.numTotalTests)"

# assertion count must not fall — compare tree-wide totals, not diff removals
# run this BEFORE the split and record the number, then again after
grep -rho 'expect(' src --include='*.test.ts' --include='*.test.tsx' | wc -l

# per-file durations after the split
npx vitest run src/App.interaction-flows src/lib/scan/detection

# naming convention
grep -rh 'describe("Frontend' src --include='*.test.ts*' | sort -u | head

cd ../.. && npm run quality:check
```

## Files touched

- `apps/frontend/src/App.interaction-flows.test.tsx` (split)
- `apps/frontend/src/lib/scan/detection/detector.test.ts` (split)
- `apps/frontend/src/lib/scan/detection/detectorFixtures.test.ts` (split)
- new sibling test files created by the splits
- `apps/frontend/vite.config.ts` only if a new glob is needed
- `PRD/work/ci-quality-check-runtime/slice-d-split-outlier-test-files.md`
