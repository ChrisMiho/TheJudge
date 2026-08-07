# Slice D — Split outlier test files to lower the shard floor

## Status: done

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

- [x] Frontend case count is exactly **1227** before and after — record both
- [x] No file among the three originals exceeds ~8s in the duration breakdown
      after the split
- [x] Slowest shard wall time drops relative to the slice B measurement; both
      numbers recorded in this slice doc
- [x] Total `expect(` count across the whole frontend test tree is **greater
      than or equal to** its pre-slice value — compare tree-wide totals before
      and after, not diff removals (a split necessarily removes lines from the
      original file and adds them to the new one, so counting deletions would
      flag every correct split)
- [x] Every new file's outermost `describe` matches `Frontend - <Feature>`
- [x] New `src/lib/scan/**` files still run under the `node` environment
- [x] Coverage thresholds unchanged and coverage still passes on merged totals
- [x] `npm run quality:check` green locally

## Measurements

### Nothing was lost

| Metric | Before | After |
| --- | --- | --- |
| Frontend cases | 1227 | **1227** |
| `expect(` across the frontend test tree | 3376 | **3376** |
| Frontend test files | 115 | 124 |
| Full local suite wall (no coverage) | 15.0s | **9.6s** |

The assertion total is compared tree-wide, not as diff removals: a split moves
lines out of one file and into another, so counting deletions would flag every
correct split.

### The outliers are gone

Slowest files under coverage after the split (was 18.2s / 17.6s / 16.6s):

| File | Duration |
| --- | --- |
| `App.interaction-flows.presentation.test.tsx` | 7.3s |
| `detector.committed-fixtures.test.ts` | 7.3s |
| `App.interaction-flows.stack-context.test.tsx` | 7.1s |
| `detectorFixtures.groups.test.ts` | 7.0s |
| `detectorFixtures.report.test.ts` | 6.8s |
| `App.interaction-flows.submission.test.tsx` | 6.7s |
| `detector.test.ts` | 6.7s |
| `detector.real-frames.test.ts` | 6.1s |
| `detectorFixtures.frame-loading.test.ts` | 5.9s |

No descendant of the three originals exceeds 7.3s, against the ~8s target.

### How each file was split

| Original | Split into | Seam |
| --- | --- | --- |
| `App.interaction-flows.test.tsx` (50) | `.test.tsx` (10), `.stack-context` (16), `.presentation` (13), `.submission` (11) | contiguous behaviour runs within the single `Interaction flows` describe |
| `detector.test.ts` (15) | `.geometry` (5), `.test.ts` (7), `.committed-fixtures` (2), `.real-frames` (1) | the file's own `describe` blocks, then the committed-fixture cases that carry the cost |
| `detectorFixtures.test.ts` (7) | `.test.ts` (4), `.frame-loading` (1), `.report` (1), `.groups` (1) | the three ~900ms corpus-evaluation cases isolated from the four cheap manifest cases |

Cases were relocated verbatim — no assertion was rewritten, weakened, merged, or
skipped. The only edits inside a moved case are three
`metadataFixture = X` statements, now `setMetadataFixture(X)`, because that state
moved into the shared harness.

### Shared setup lives once, not once per file

Two helper modules were extracted rather than copied (technical-design-rules:
reuse before creating). Both sit under `src/test/**`, which coverage already
excludes:

- `src/test/interactionFlowsHarness.ts` — the `fetchMock`/ask-ai queue,
  `beforeEach`/`afterEach`, and the `debugLogger` mock functions shared by the
  four `App.interaction-flows*` files. `fetchMock` is exported as a live ESM
  binding so the moved cases read it unchanged.
- `src/test/detectorImageHelpers.ts` — `makeImage`, `setPixel`, `fillRect`, and
  `quadCentroid`, shared by the four detector files.

Every new file's outermost `describe` is unchanged (`Frontend - Card Scan`,
`Frontend - MTG Assistant`), with no Slice/REQ/DEC label, per
`PRD/instructions/test-naming.md`. All new `src/lib/scan/**` files still match
slice C's `node` glob.

### Slowest shard

Measured on run `31114869983` (attempt 3, green) against slice B's run
`31113323253`:

| Measurement | Slice B | Slice D |
| --- | --- | --- |
| Slowest shard **job wall** | 2m34s | **1m20s** |
| Slowest shard **test step** | 90s | **69s** |
| Fastest shard test step | 46s | 52s |
| Shard spread (slowest / fastest) | 1.96x | **1.33x** |

Both figures are reported because job wall includes runner acquisition, which
was noisy during these runs (see below); the test step is the infra-independent
number. The spread narrowing from 1.96x to 1.33x is the point of the slice: the
shards are now balanced, so the critical path tracks total work instead of one
oversized file. Slices C and D together took the slowest shard's test step from
90s to 69s while adding nine files.

### GitHub Actions incident during measurement

Attempts 1 and 2 of run `31114869983` are not usable as timings. Attempt 1 spent
3m57s in runner provisioning before `coverage-merge`'s first step; attempt 2
failed with `Failed to resolve action download info. Error: Service Unavailable`
and `Bad Gateway` while downloading actions, and `static` took 5m40s. Those are
GitHub infrastructure faults, not test or configuration failures — no assertion
failed in any of them. Attempt 3 is the recorded green run, and even there
`frontend-shard 2/3` waited ~5 minutes for a runner while its actual test step
ran 69s. Slice E measures the end-to-end gate on a run free of this.

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
