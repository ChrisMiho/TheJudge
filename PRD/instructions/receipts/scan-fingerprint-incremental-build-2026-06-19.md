# scan-fingerprint-incremental-build cleanup receipt

- Date: 2026-06-19
- Slug: `scan-fingerprint-incremental-build`
- Status: shipped

## Actions taken

- [x] Verified Slice A acceptance criteria against `hashLibBuild.ts`, `build-card-hashes.mjs`, the self-test, and `dbformat` round-trip tests.
- [x] Verified Slice B acceptance criteria for `--limit`, `--max-minutes`, and checkpoint/resume helper coverage.
- [x] Verified Slice C acceptance criteria for skip-list normalization, permanent failure parking, transient failure handling, and `--retry-parked` diff behavior.
- [x] Verified Slice D acceptance criteria for non-destructive `--fresh` target resolution and clobber guards.
- [x] Verified Slice E acceptance criteria for npm aliases, progress/help text, README operator docs, and `data:scan-hashes` reconciliation.
- [x] Confirmed `DEC-054` and `REQ-039` are promoted in durable PRD sections and match the shipped behavior.
- [x] Confirmed public runtime contracts stay unchanged: `CARDHSH1` v1, `recipe.ts`, `identify.ts`, `loadHashDb.ts`, and the `dbformat.ts` round trip.
- [x] Confirmed no backend/API/prompt contract surface changed for this work.
- [x] Ran a secret scan over the touched cleanup/build docs and code; findings were expected references to secret-handling docs, token-budget text, excluded Scryfall token layouts, and no key material.
- [x] Wrote this durable receipt before deleting the work folder.
- [x] Applied the system-map promotion gate: product code exists and this receipt exists, so `Fingerprint library build` is ready to flip from `planned` to `shipped`.
- [x] Deleted `PRD/work/scan-fingerprint-incremental-build/` after durable promotion was confirmed.

## Files created

- `PRD/instructions/receipts/scan-fingerprint-incremental-build-2026-06-19.md`
- `apps/frontend/src/lib/scan/hashLibBuild.ts`
- `apps/frontend/src/lib/scan/hashLibBuild.test.ts`

## Files updated

- `PRD/sections/decisions.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/work/cardomancer-card-detection-summary/README.md`
- `PRD/work/cardomancer-card-detection-summary/slice-b-fingerprint-library.md`
- `README.md`
- `package.json`
- `package-lock.json`
- `scripts/build-card-hashes.mjs`

## Files deleted

- `PRD/work/scan-fingerprint-incremental-build/DESIGN-BRIEF.md`
- `PRD/work/scan-fingerprint-incremental-build/GAMEPLAN.md`
- `PRD/work/scan-fingerprint-incremental-build/IDEA.md`
- `PRD/work/scan-fingerprint-incremental-build/README.md`
- `PRD/work/scan-fingerprint-incremental-build/slice-a-resumable-core.md`
- `PRD/work/scan-fingerprint-incremental-build/slice-b-budgets-checkpoint.md`
- `PRD/work/scan-fingerprint-incremental-build/slice-c-skiplist-parking.md`
- `PRD/work/scan-fingerprint-incremental-build/slice-d-fresh-rebuild.md`
- `PRD/work/scan-fingerprint-incremental-build/slice-e-cli-docs.md`

## Verification results

- `npm --workspace apps/frontend run test -- src/lib/scan/hashLibBuild` passed: 1 file, 26 tests.
- `npm --workspace apps/frontend run test -- src/lib/scan/dbformat` passed: 1 file, 3 tests.
- `npx tsx scripts/build-card-hashes.mjs --self-test` passed outside the sandbox after sandboxed `tsx` IPC failed with `listen EPERM`; output confirmed 3 entries, 351 bytes, and round-trip OK.
- `npx tsx scripts/build-card-hashes.mjs --help` passed outside the sandbox after sandboxed `tsx` IPC failed with `listen EPERM`; help documents default resume, budgets, pacing/backoff, skip-list, fresh rebuild, and approval posture.
- `npm run quality:check` passed:
  - typecheck passed
  - lint passed
  - format check passed
  - frontend tests passed: 29 files, 256 tests
  - backend tests passed: 21 files, 218 tests
  - frontend coverage check passed
  - backend coverage check passed
