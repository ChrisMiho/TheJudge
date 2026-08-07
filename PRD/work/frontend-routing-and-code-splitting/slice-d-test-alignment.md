# Slice D — Test alignment, CI shard headroom, and promotion

## Status: planned

## Goal

Bring the test suite into line with routing, keep the CI gate inside its
measured budget, and leave the package ship-ready.

## Requirements

1. Rewrite `apps/frontend/src/App.persist-active-destination.test.tsx` against
   DEC-157: it currently asserts the superseded sessionStorage-as-source-of-truth
   behavior. It must now assert the resolution order — deep link wins,
   bare `/` consults `sessionStorage`, unregistered value falls back to registry
   order, unknown path redirects.
2. **Reset history globally between tests.** `<BrowserRouter>` lives inside
   `App` (slice A req 1), so no test needs its own router provider — do **not**
   add provider wrappers, and do not nest a second router. The real hazard is
   that jsdom's `window.history`/`location` is file-global while
   `src/test/setup.ts` currently clears only `localStorage`
   (`setup.ts:5-8`). Under routing, a test that switches destinations leaves the
   URL dirty for the next `it()` in the same file.

   Concretely: `App.persist-active-destination.test.tsx` navigates to In-Depth,
   and the following case — the unregistered-stored-destination fallback — then
   renders at `/in-depth` and fails. Its failure looks exactly like a
   sessionStorage-fallback bug, which is the assertion this slice is rewriting,
   so the misdiagnosis risk is high.

   Add the history reset to `src/test/setup.ts`'s `afterEach`, alongside the
   existing `cleanup()` and `localStorage.clear()`, so it applies to every test
   file rather than to the ones someone remembers. Keep it consistent with
   `appTestHelpers.tsx`'s existing `installMemorySessionStorage` approach.
3. Add regression coverage for the keep-alive guarantee: switch away from a
   destination carrying in-session state and back, and assert the state survived
   and the component did not remount. This is the guarantee most at risk from a
   future `<Routes>` refactor, so it must fail loudly.
4. Add coverage for the routeless feedback action entry: opening the modal
   changes neither URL nor history length.
5. Add coverage for the seed handoff asymmetry: menu selection from Life Tracker
   seeds; arriving at `/in-depth` by deep link or Back does not.
6. Vitest titles follow `PRD/instructions/test-naming.md` — outermost `describe`
   is `Frontend - <Feature>`. No Slice / STORY / REQ / DEC / MVP labels in suite
   titles.
7. If any new test file is DOM-free, add it to `vite.config.ts`'s
   `environmentMatchGlobs` as a named `node` entry only after a full green run
   proves it needs no DOM (DEC-155). Do not add a blanket directory or extension
   rule.
8. Measure the frontend case count after the suite is green. NFR-012's measured
   rule is `N ≥ frontend_cases / 440`, with 3 shards holding to ~1330 cases
   against the 1227 baseline. If the count crosses ~1330, bump
   `.github/workflows/quality-check.yml`'s shard matrix from 3 to 4 — a one-line
   matrix change plus the `--shard=X/N` and job-name references. Do not delete or
   trim tests to stay under the ceiling.
9. Do **not** regroup the 19 `App.*.test.tsx` files along route boundaries. That
   is a separate NFR-012 hygiene package (DESIGN-BRIEF D7).
10. No coverage threshold is lowered; frontend `lines: 45` stays.

## Acceptance criteria

- [ ] `App.persist-active-destination.test.tsx` asserts DEC-157 resolution order, with no assertion of the superseded sessionStorage-first behavior remaining
- [ ] Keep-alive regression test present and failing if destinations are moved into `<Routes>`
- [ ] Feedback-modal routelessness covered
- [ ] Seed-handoff asymmetry covered (menu seeds, deep link does not)
- [ ] `src/test/setup.ts` resets `window.history`/`location` in `afterEach`; adding a destination-switching test to any existing `App.*.test.tsx` file does not change the outcome of the case that follows it
- [ ] No test file adds its own router provider, and no second router is nested inside `App`'s `<BrowserRouter>`
- [ ] Any test that failed during this slice was fixed by correcting setup or implementation — no assertion was weakened or deleted to make a red test pass
- [ ] Vitest titles conform to `test-naming.md`
- [ ] Frontend case count measured and recorded; shard matrix bumped to 4 if the count crosses ~1330, otherwise the 3-shard matrix is left unchanged and the measured count is recorded as the reason
- [ ] No coverage threshold lowered; no test deleted to hit a timing target
- [ ] `npm run quality:check` green
- [ ] CI gate green on the PR, with recorded wall time

## PRD promotion checklist

Execution happens in `thejudge-cleanup`; this slice confirms the content is
present and correct.

- [ ] DEC-157 body in `PRD/sections/decisions/navigation.md` + router index line in `PRD/sections/decisions.md`
- [ ] REQ-140 in `PRD/sections/functional-requirements.md`
- [ ] NFR-014 in `PRD/sections/non-functional-requirements.md`
- [ ] REQ-090 and DEC-111 amendment notes pointing at DEC-157
- [ ] `PRD/sections/screen-layout.md` **Destination load fallback** row
- [ ] `PRD/sections/system-map.md` feature-portal Routing line and updated Backed-by
- [ ] Measured chunk evidence from slice C carried into the receipt

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test:coverage
```

## Files touched

- `apps/frontend/src/App.persist-active-destination.test.tsx`
- `apps/frontend/src/App.*.test.tsx` (router context only)
- `apps/frontend/src/test/` (shared router test helper)
- `apps/frontend/vite.config.ts` (only if a new DOM-free test file needs a named `node` entry)
- `.github/workflows/quality-check.yml` (only if the shard bump triggers)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/frontend-routing-and-code-splitting/` ready to delete
