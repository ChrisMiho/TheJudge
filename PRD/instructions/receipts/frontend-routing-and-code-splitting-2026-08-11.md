# Receipt — frontend-routing-and-code-splitting

- Date: 2026-08-11
- Slug: `frontend-routing-and-code-splitting`
- Status: shipped

## Actions taken

- [x] Verified all four slices A–D are `done` and the package carried `status: ship-ready` + `STATUS.ship-ready`.
- [x] Confirmed product code for every slice is present on the current checkout (see **Shipped behavior**).
- [x] Confirmed the durable truth this package owed was already promoted by preparation PR #84 (commit `3bc93c6`) and verified each item is still in place at cleanup time (see **Durable truth verified**).
- [x] Confirmed `system-map.md`'s **Feature portal (app navigation)** entry is `shipped` and its **Routing** line describes shipped reality — no status flip was needed, because routing landed inside an already-`shipped` catalog entry rather than as a new one.
- [x] Ran the autonomous merge-proof gate; three of four checks passed, check 1 was force-overridden by the operator (see **Gate deviation**).
- [x] `npm run quality:check` green across the whole repo (exit 0), including the 12 script tests and full frontend/backend coverage runs.
- [x] Wrote this receipt **before** deleting the work folder.
- [x] Deleted `PRD/work/frontend-routing-and-code-splitting/` and removed the slug from `PRD/work/STATUS.md`.
- [x] Removed the clean, fully-merged `.worktrees/implement-frontend-routing-and-code-splitting` worktree and its local branch `thejudge-impl/frontend-routing-and-code-splitting-root-20260806-1`. No remote branch was deleted.

## Shipped behavior

The four registered feature-portal destinations are addressable at flat
top-level URLs — `/quick-lookup`, `/in-depth`, `/life-tracker`,
`/trade-balancer` — via `react-router`, with the path declared on each registry
entry. The URL is the source of truth for the active destination; DEC-111's
`sessionStorage` value survives only as the bare-`/` fallback, and an unknown
path redirects to `/`.

The router supplies location and history **only**. `DestinationOutlet` keeps
every visited destination mounted and hidden rather than wiring destinations
into `<Routes>` elements, because `<Routes>` unmounts non-matching routes and
that would break DEC-095/REQ-067's in-session data guarantee. Each destination
sits behind a `React.lazy` boundary with its **own** per-destination `Suspense`
boundary — a single boundary around the outlet would blank already-loaded
siblings. `vite.config.ts` declares function-form `manualChunks` groups for the
shared scan surface (wider than `src/lib/scan/**`: it also includes
`hooks/useScanCapture.ts` and `components/ScanCameraSurface.tsx`) and for
framework code (`react`, `react-dom`, `react/jsx-runtime`, `react-router`).
**Send feedback** remains a routeless action entry (DEC-104).

Shipped through PR #85 (`thejudge-auto/frontend-routing-and-code-splitting` →
`feature/routing`, merged 2026-08-07, merge commit `90caf3a`), which reached
`main` via PR #87.

## Durable truth verified

Promoted by preparation PR #84 (commit `3bc93c6`), re-verified present at cleanup:

- `sections/decisions/navigation.md` — DEC-157 body, plus the in-place
  supersession note on DEC-111 recording that its "no URL-based routing"
  clause no longer applies while its guarded `sessionStorage` semantics survive
  as the bare-`/` fallback
- `sections/decisions.md` — DEC-157 router index line
- `sections/functional-requirements.md` — REQ-140, plus the DEC-157/REQ-140
  amendment note on REQ-090 narrowing the brand-new-tab default to the
  bare-`/` case
- `sections/non-functional-requirements.md` — NFR-014 (initial payload scales
  with what a user opens, and keeps doing so as destinations are added)
- `sections/screen-layout.md` — **Destination load fallback (route `Suspense`
  boundary)** row
- `sections/system-map.md` — feature-portal **Routing** line and the updated
  **Backed by** list (`DEC-157`, `REQ-140`, `NFR-014` appended)

## Verification results

`npm run quality:check` — green, exit 0, run on the cleanup branch.

Per-slice evidence recorded during implementation:

- **Slice A** — 124 files / 1,235 frontend tests green. Playwright MCP on the
  worktree-owned Vite server at `127.0.0.1:4177` verified all four direct
  paths, stored and registry-order `/` fallback, unknown-path fallback, Menu
  URL updates, Back/Forward, keep-alive field state, and feedback-modal
  routelessness at `390x844` and `1280x900`.
- **Slice B** — 124 files / 1,237 tests green; the build emitted separate
  `QuickLookupApp`, `MtgAssistantApp`, `PlayerLifeTrackerApp`, and
  `TradeBalancer` chunks. Fallback height held at or below resolved height at
  both widths (phone `131px` → `693px`; desktop `218px` → `478px`), and a
  revisit to a retained destination showed no fallback.
- **Slice C** — `src/lib/viteChunking.test.ts` passed 12 cases proving
  function-form chunk ownership, including the intentional exclusion of
  destination-owned `ZoneCardPicker` and `useTradeScan`. Emitted graph:
  `vendor-BVF4lV-E.js`, `scan-2BdhZY_b.js`, and four distinct destination
  chunks. Each destination's unique string appeared in exactly one chunk and
  was absent from `index-Crmthum1.js`; both scan-surface strings appeared
  exactly once, in `scan-2BdhZY_b.js`. A fresh `/trade-balancer` preview load
  requested `index`, `vendor`, `TradeBalancer`, `StepEyebrow`, and `scan` and
  did **not** request the other three destination chunks. A separate
  `ASK_AI_PROVIDER=mock` build proved the client define bridge still works.
- **Slice D** — full frontend coverage 126 files / **1,255 cases**, 96.38% line
  coverage. NFR-012 requires `ceil(1255 / 440) = 3` shards; 1,255 is below the
  measured ~1330 ceiling, so `.github/workflows/quality-check.yml` stayed at 3
  shards and no test was deleted or trimmed. The `lines: 45` frontend threshold
  is unchanged. `src/test/setup.ts` now resets `window.history`/`location` in
  `afterEach` globally, and `src/test/setup.history-reset.test.ts` proves a case
  that leaves `/in-depth` does not leak into the next one. No test file adds its
  own router provider and no second router is nested inside `App`'s
  `<BrowserRouter>`.

Runtime cleanup (per `runtime-process-hygiene.md`) — all recorded passing:
server/preview sessions `43127`, `95086`, `81077`, `44971`, `74602`, `31419`,
and `54723` were all **started** by their own worktree and stopped through their
exact handles; `browser_close` completed after every browser run; `lsof -nP
-iTCP:<port> -sTCP:LISTEN` returned no listener on ports 4177, 4178, and 4179
after cleanup. Slice D was test-only and started no browser or server session.
The only console error observed anywhere was the pre-existing missing
`/favicon.ico` response.

## Gate deviation

The autonomous merge-proof gate's **check 1** (current branch equals the
recorded autonomous base exactly) did not hold: the recorded base is
`feature/routing`, and cleanup ran on `feature/enhancement-bangers`. The
operator was shown the failing check and explicitly authorized proceeding on
the current branch.

The override is narrow and the mismatch is benign: `origin/feature/routing`
(`0552b9b`) is an ancestor of the cleanup branch's HEAD, so every line of
routing code and every promoted PRD section this receipt describes was already
present in the checkout that was verified. Checks 2, 3, and 4 passed on their
own terms:

- **Check 2** — PR #85 is `MERGED` with `baseRefName: feature/routing`,
  matching the recorded base (confirmed via `gh pr view`, not inferred from
  local branch state).
- **Check 3** — `.worktrees/implement-frontend-routing-and-code-splitting` had
  an empty `git status --porcelain` and zero commits absent from
  `origin/feature/routing`. Its own `PRD/work/<slug>/.playwright-mcp/` captures
  are gitignored and correctly did not register as dirt.
- **Check 4** — every runtime-cleanup acceptance criterion above is passing.

No remote branch was deleted.

## Files created

- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md` (this receipt)

## Files updated

- `PRD/work/STATUS.md` — removed the slug from `## ship-ready`, leaving that section empty

## Files deleted

- `PRD/work/frontend-routing-and-code-splitting/README.md`
- `PRD/work/frontend-routing-and-code-splitting/IDEA.md`
- `PRD/work/frontend-routing-and-code-splitting/DESIGN-BRIEF.md`
- `PRD/work/frontend-routing-and-code-splitting/GAMEPLAN.md`
- `PRD/work/frontend-routing-and-code-splitting/STATUS.ship-ready`
- `PRD/work/frontend-routing-and-code-splitting/slice-a-router-foundation.md`
- `PRD/work/frontend-routing-and-code-splitting/slice-b-lazy-boundaries.md`
- `PRD/work/frontend-routing-and-code-splitting/slice-c-chunking.md`
- `PRD/work/frontend-routing-and-code-splitting/slice-d-test-alignment.md`

The slice A–C Playwright captures were never in the main checkout — being
gitignored, they existed only inside
`.worktrees/implement-frontend-routing-and-code-splitting/PRD/work/frontend-routing-and-code-splitting/.playwright-mcp/`
and went away with that worktree.

## Not changed

- `PRD/README.md` — navigation is unchanged; it still carries a single pointer
  to `work/STATUS.md`
- `sections/system-map.md` status fields — the feature-portal entry was already
  `shipped`
- No `DEC`/`REQ` `Status:` field was edited; the shipped-vs-planned signal lives
  only in `sections/system-map.md`
- `.github/workflows/quality-check.yml` — stays at 3 shards (1,255 measured
  cases, below the ~1330 ceiling)
- Remote branches — none deleted
