# Design brief — browser-smoke-suite

**What you need to do:** Decide three product-truth changes in
`GATE-QUESTIONS.md`: one new requirement (NFR-021) and two small amendments
(REQ-166, NFR-012). All three go on top of the built-backend check you
accepted in docs PR #326. There are no blocker questions.

## What it means for a player

Today a pull request can pass every check and still ship a site where a
player opens TheJudge and gets a blank screen, or taps a tool and nothing
loads, or presses send and no answer ever comes back. The existing tests run
the app's source code inside a simulated page. They never open the site the
deploy actually ships, in a real browser, talking to the real server.

After this change, every pull request builds the site the way the deploy does,
starts the built server with the free pretend AI, opens the site in Chrome, and
does the one thing a player does first in each tool:

- **Ask a Question:** type a question, send it, see an answer.
- **In-Depth Question:** walk the four steps with Sol Ring on the battlefield,
  press "Decrypt Stack", see an answer.
- **Life Tracker:** reach it from the ☰ Menu, tap minus on Player 1, see 39.
- **Trade Balancer:** add Sol Ring to Side A, pick a printing, see a dollar
  total.
- **Scanner:** open it and see its card data load (no real camera in CI).
- **Send feedback:** open the form (nothing is sent).

If any of that breaks, the check turns red on the PR and the deploy from `main`
does not run.

## What a real browser catches that the existing tests cannot

Each row is a failure a player would see, and why today's tests miss it.

| Player sees | Why the existing tests miss it |
| --- | --- |
| A blank page on first load | Tests import source files one by one. They never load the bundled, minified files, so a bundling or chunk-ordering error (for example a value used before its chunk has run) only exists in the built site. |
| A tool that never opens from the Menu or a link | Every tool's code is loaded up front before each test file (`beforeAll(preloadPortalDestinations)`, `apps/frontend/src/test/setup.ts:15-17`). The on-demand download a real visit triggers (NFR-014's lazy loading) never runs in a test. |
| Send pressed, no answer ever arrives | Tests replace the browser's network call with a stub in 21 files (`vi.stubGlobal("fetch", …)`; shared harness `apps/frontend/src/test/interactionFlowsHarness.ts:59-90`). The real path — the API address baked into the build, the cross-origin permission check (CORS: the browser asks the server whether this site may call it), the built server's reply — is never exercised end to end. |
| Card search says "unavailable" or finds nothing | Tests serve small fixture card lists; the real 5 MB `cardMetadata.json` and the scanner's 13 MB and 11 MB files are never parsed by the app in a test. |
| A button that is there but cannot be tapped | The simulated page applies no CSS (`apps/frontend/src/test/setup.ts`; stylesheets are only read as text). A real browser refuses to click a button that is hidden or covered by another layer, so an overlay sitting on the send button fails the check. |

What it still does not catch: anything about production hosting (S3,
CloudFront, the custom domain), the Lambda wrapper, the real AI's answers,
camera recognition, exact layout, or speed. Those stay with the existing tests,
the post-deploy live checks, and the Playwright verification policy in
`PRD/instructions/runtime-process-hygiene.md`.

## What exists today (grounded in the repository)

**The CI workflow.** One workflow, `.github/workflows/quality-check.yml`, runs
on `pull_request`, on push to `main`, and on `workflow_dispatch`:

| Job | On PRs | What it does | Node |
| --- | --- | --- | --- |
| `static` | yes | `typecheck`, `lint`, `format:check`, `test:scripts` | 22 |
| `backend` | yes | backend vitest with coverage | 22 |
| `frontend` (3 shards) | yes | frontend vitest coverage shards (jsdom) | 22 |
| `coverage-merge` | yes | merges shards, applies the coverage threshold | 22 |
| `changes` | no (main push / dispatch) | deploy-or-skip decision (REQ-166) | — |
| `deploy` | no | `needs: [static, backend, coverage-merge, changes]`; backend build, then `scripts/aws-deploy.sh`, which builds the frontend | 24 |

#326's accepted build adds a seventh job, `built-server`, and lists it in
`deploy.needs`; it is not in the workflow yet (checked 2026-10-19). This
package's `browser-smoke` job is the eighth.

**The frontend build already runs on every PR — it is just never opened.**
`npm --workspace apps/frontend run build` is `tsc -b && vite build`
(`apps/frontend/package.json`). On a PR, `npm run typecheck` runs the same
single `tsconfig.json` check that `tsc -b` does, and `npm run test:scripts`
(in `static`) runs a real `vite build` inside
`scripts/frontend-public-static-files.test.mjs:54-90`, which then only checks
that `robots.txt` and `.well-known/security.txt` were copied (REQ-198). So the
claim in `IDEA.md` that nothing on a PR builds the production frontend is not
quite right: a PR proves the bundle *compiles*, but nothing proves it *runs*.

**Build output.** Measured: 3.7–4.8 s, 441 modules, `dist/` 33 MB (29 MB of it
the committed data files, 4.0 MB assets), gitignored by `dist/`. Chunk table
in `evidence/measurements.md` §1.

**How the built site reaches the backend.** No proxy. The browser calls the
backend directly at `VITE_API_URL`, which `vite build` bakes into the shell
chunk (`apps/frontend/src/lib/env.ts:62`; default `http://localhost:3000`). The
deploy bakes in the Lambda Function URL (`scripts/aws-deploy.sh:118`). The
backend allows exactly one browser origin when `FRONTEND_ORIGIN` is set
(production sets it, `scripts/aws-deploy.sh:108`) and every origin when it is
not (`apps/backend/src/app/createApp.ts:47`).

**The tools a player can open today** (`apps/frontend/src/components/portal/destinationRegistry.tsx`):

| Tool | Path | Most basic action | Backend calls |
| --- | --- | --- | --- |
| Ask a Question (Quick Question) | `/quick-lookup` (also `/`) | type in "Magic question", send ("Ask TheJudge") | `POST /api/ask-ai` |
| In-Depth Question | `/in-depth` (no Menu row; reached by the "In-depth" chip or URL, `App.tsx:35-36`) | four steps → "Decrypt Stack" | `GET /api/cards/:oracleId`, `POST /api/ask-ai` |
| Life Tracker | `/life-tracker` | "Decrease life for Player 1" | none |
| Trade Balancer | `/trade-balancer` | Side A "Add card" → search → pick a printing price | `GET /api/health` (warm-up), `GET /api/cards/:oracleId/prices` |

Plus two shared surfaces: the scanner ("Scan a card", reachable from Ask a
Question, Trade Balancer and In-Depth) and the "Send feedback" form in the ☰
Menu.

**What the existing tests already cover per tool.** 156 frontend test files,
58 backend, 61 script tests. Feature behavior is thoroughly covered; this
suite does not repeat any of it:

| Surface | Covered by (examples) |
| --- | --- |
| Shell, Menu, deep links | `App.persist-active-destination.test.tsx`, `FeaturePortalMenu.test.tsx`, `DestinationOutlet.test.tsx`, `destinationRegistry.test.tsx`, `useActiveDestination.test.ts`, theming tests |
| Ask a Question | `QuickLookupApp.test.tsx`, `App.answered-state`, `App.mid-flight-draft`, `App.conversation-history-delete`, `App.ui-flare-chat-motion` |
| In-Depth | four `App.interaction-flows*` files, `App.game-setup-zones`, `App.zoneFlow`, `App.conversation-header`, `App.excess-player-ui`, `MtgAssistantApp.*`, step component tests |
| Life Tracker | `PlayerLifeTrackerApp.test.tsx`, `PlayerLifeCard.test.tsx`, `CounterPanel.test.tsx`, `GameSetupPanel.test.tsx`, two `App.player-life-tracker-*` files, `lib/lifeTracker/*` |
| Trade Balancer | `TradeBalancer.test.tsx`, `TradeBalancer.scan.test.tsx`, `TradeSide.test.tsx`, `PrintingPicker.test.tsx`, `lib/trade/*` |
| Scanner | the `Scan*` component tests, `useScanCapture.test.ts`, ~25 files under `lib/scan/**` |
| Feedback | `FeedbackModal.test.tsx`, `App.feedback.test.tsx`, `useFeedbackForm.test.ts`, `lib/feedback/*` |
| Backend routes | supertest route tests in `apps/backend/src` |

The suite's job is the one thing none of these do: run the built site in a
real browser against the built server. It checks each tool *opens and
answers*, not that each rule inside it is right.

**Data files the built site downloads — all committed.** From
`apps/frontend/public/data/` (in `git ls-files`): `cardMetadata.json` (5.1 MB),
`cardhashes.bin` (13 MB), `cardScanMap.json` (11 MB), `gameRulesCoreTopics.json`,
`cardhashManifest.json`, `cardhashSkiplist.json`. The backend reads only
committed files under `apps/backend/data/` with the mock providers (measured by
#326 and again here: 37,854 cards loaded, no warnings). The gitignored card dump
is never read. **One outside dependency:** card images load from
`cards.scryfall.io` (`apps/frontend/src/lib/cardImage.ts`); the suite answers
those requests itself so CI needs no outside network.

**What cannot run headless in CI, and how the suite treats it.**

| Feature | Why | Treatment |
| --- | --- | --- |
| Scanner camera | the runner has no camera | Chrome's fake camera flags supply a synthetic test pattern and auto-grant permission; the suite checks the panel opens, its two data files load, and it does not show "Camera unavailable". Card recognition is never asserted (covered by `lib/scan/**` tests). If the runner's Chrome cannot start the fake camera, the "not Camera unavailable" assertion is dropped and the rest stays. |
| Microphone dictation | no microphone; speech recognition is a vendor service | not exercised |
| Sending feedback | goes to Formspree, an outside service, and a PR build has no form id | the form is opened, never sent |
| Real AI answers | paid, needs a secret | the built server runs the free mock provider |
| Card images | outside host | answered locally with a placeholder image |

## Live verification

Full record in `evidence/measurements.md`. Summary: frontend build 3.7–4.8 s,
backend build 1.1 s, boot under a second. In Chrome 155 at desktop and phone
width, every tool opened and its basic action worked: two mock answers, life
40 → 39, Side A total $1.19, In-Depth answer after the four steps, scanner
panel open with 18 MB of scan data loaded, feedback form open. Zero console
errors or warnings, zero failed local requests. First paint 164 ms. Ports 4317
and 4318 released; `browser_close` called.

## The design

1. **A committed command, `npm run smoke:browser`** (root `package.json`),
   running `node scripts/smoke-browser.mjs`. The script:
   - picks two free local ports (bind port 0, read it, release it);
   - builds the frontend with the deploy's own build command,
     `npm --workspace apps/frontend run build -- --outDir .tmp/browser-smoke/dist --emptyOutDir`,
     with `VITE_API_URL=http://127.0.0.1:<backend port>`,
     `VITE_DEBUG_LOGGING=false`, and `ASK_AI_PROVIDER`,
     `VITE_ASK_AI_PROVIDER` and `VITE_FEEDBACK_FORMSPREE_ID` unset — the same
     bundle a player gets apart from the API address, so no mock banner
     (REQ-063) and no feedback delivery. Its own output folder (gitignored
     `.tmp/`) means it never overwrites `apps/frontend/dist/`, which the REQ-198
     test and the deploy use;
   - builds the backend (`npm --workspace apps/backend run build`) and starts
     `node apps/backend/dist/index.js` with `PORT`, and
     `FRONTEND_ORIGIN=http://127.0.0.1:<frontend port>` so the single-origin
     CORS rule production uses is exercised; `ASK_AI_PROVIDER`,
     `EMBEDDING_PROVIDER`, `OPENAI_API_KEY` and `NODE_ENV` are removed, so both
     providers are `mock` and no `.env` or `.secrets/` file is read;
   - serves the built folder with `vite preview --outDir … --port <frontend port> --strictPort --host 127.0.0.1`
     (its single-page fallback gives deep links the same result as
     CloudFront's error mapping);
   - opens headless Google Chrome through the `playwright` library
     (`chromium.launch({ channel: "chrome" })`) with the fake camera flags.
     The GitHub runner and the owner's Mac both already have Chrome, so no
     browser is downloaded;
   - answers `https://cards.scryfall.io/*` with a tiny local placeholder image
     and aborts, and fails on, any request to any other outside host;
   - runs the six steps listed under "What it means for a player" at phone
     width (390 × 844) and at desktop width (1280 × 800), each in a fresh
     browser context (empty storage);
   - passes only when every step finishes within 15 s, with zero console
     errors, zero uncaught page errors, and no local request failing or
     answering 400 or above;
   - asserts by visible labels and shapes, never exact answer wording, prices
     or card text, so a data refresh cannot turn it red;
   - on failure prints the step, console messages, failed requests and both
     servers' output, and saves a screenshot under `.tmp/browser-smoke/`;
   - always closes the browser and stops both servers.
2. **Its pass/fail rules are unit-tested** in `scripts/smoke-browser.test.mjs`
   (request classification, console filtering, port picking), run by
   `npm run test:scripts`.
3. **It joins `npm run quality:check`**, so the one local pre-PR command and
   CI stay the same (NFR-012). Local cost: roughly 20–30 s, and Google Chrome
   must be installed.
4. **A new CI job, `browser-smoke`**, in `.github/workflows/quality-check.yml`:
   `ubuntu-24.04`, checkout, `setup-node` with Node 24 (the deploy builds the
   frontend on Node 24), `npm ci`, `npm run smoke:browser`; on failure it
   uploads `.tmp/browser-smoke/` as an artifact kept 7 days. It runs on every
   PR and every push to `main`, no path filter, no extra permissions, no
   secrets. The existing parity guard (`scripts/ci-workflow-parity.test.mjs`)
   then requires it automatically.
5. **The deploy waits for it.** `deploy.needs` gains `browser-smoke`.
6. **One new dev dependency:** `playwright`, pinned to an exact version (1.64.1
   today; 18.7 MB unpacked with `playwright-core`; no install script, so
   `npm ci` downloads no browser). This is the only new dependency and it is
   the main thing the NFR-021 verdict approves.

**CI cost.** Estimated, not measured on the runner: ~17 s setup and `npm ci`
(NFR-012's measured per-job overhead), ~10 s of builds, ~20–40 s of browser
steps on a GPU-less runner — about 1 minute, running beside the frontend shards
(1m58s gate), so PR wall time should not grow. Chrome is preinstalled
(runner image 20261012: Chrome 155.0.8059.39). If the repository ever goes
private, about one more billed minute per run.

## Relationship to docs PR #326 (`ci-built-server-smoke`)

**This proposal goes on top of #326's accepted changes.** Docs PR #326 merged
on 2026-10-19 with all three verdicts accept, and the owner dropped the
suggested widening to "also build the frontend", because every PR already
builds it (see "What exists today"). Refinement only proposes, so
`PRD/sections/` does not contain #326's text yet; #326's own build writes it.

- #326's accepted NFR-020: build the backend, start it, require `/api/health`
  and one Sol Ring lookup to answer, in a `built-server` job that joins
  `quality:check` and `deploy.needs`. This package does not reuse or redefine
  NFR-020, its `smoke:built-server` command, its script or its job. It
  reserves its own ID, NFR-021.
- Overlap: this suite also boots the built backend and, through In-Depth and
  the Trade Balancer, looks up Sol Ring. #326's check stays the fast,
  browser-free one that names a missing data file directly. The two share no
  command, script or job, and neither needs the other's code to run.
- Order of the shared edits: both packages amend REQ-166's job list, NFR-012's
  job count and the `system-map.md` "Deploy and cost guardrails" entry, and
  both append an NFR. #326's accepted text is applied first, then this
  package's. So after both: NFR-021 follows NFR-020; REQ-166's list reads
  `static`, `backend`, `frontend`, `coverage-merge`, `built-server`,
  `browser-smoke`; NFR-012 counts 8 jobs on a pull request; and the
  system-map entry names both checks and both jobs.
- Each diff in `GATE-QUESTIONS.md` therefore shows two things: the exact text
  in `PRD/sections/` today (what #326's build replaces), and the exact text
  after #326's accepted change (what this package's build replaces). Each diff
  applies after #326's accepted change has been written into `PRD/sections/`.
  The build queue runs approved specs in merge order, and #326 merged first,
  so its build runs first. If this package's build ever finds #326's text
  still missing, it parks and asks rather than writing another package's
  product truth.

## Answers to the open questions in `IDEA.md`

1. **Which tools, which action?** All four tools plus the scanner and feedback
   form, one action each (table above). Chosen because each is the first thing
   a player does there and each crosses a different seam: Ask a Question and
   In-Depth reach `/api/ask-ai` and `/api/cards`, Trade Balancer reaches the
   price route, Life Tracker and the Menu prove an on-demand tool download and
   a local-only tool, the scanner proves the large data files load.
2. **Which browser, which widths?** One browser, Google Chrome (preinstalled on
   the runner; most phones run a Chromium-family browser or Safari, and Safari
   cannot run on Linux). Phone and desktop width both, because the phone path
   differs (REQ-207's phone ambient scene, the narrower question-box
   placeholder) and the second pass costs seconds.
3. **Real or mock backend?** The real built backend with the free mock AI.
   No paid call, no secret, no AWS access — CI already needs none (REQ-237).
4. **Time budget, blocks merge?** About a minute, in parallel with the
   frontend shards. It behaves like every other gate job: red on the PR, and it
   stops the deploy from `main`. No job is a GitHub required check today (the
   `main` ruleset requires none, per #326's finding), so this one is not
   either; making checks required is a GitHub setting, outside this package.
5. **Relation to #326?** Kept separate. #326 merged with all three verdicts
   accept and without the frontend-build widening (the build already runs on
   every PR). This package's three edits go on top of #326's; see the section
   above.
6. **Data absent in CI?** None needed. Every file the built site or the mock
   backend reads is committed; card images are answered locally.

## Material assumptions (conservative ladder)

| Assumption | Evidence | Ladder rung |
| --- | --- | --- |
| A real browser, so one new dev dependency (`playwright`) | `IDEA.md` outcome: "opens it in a headless browser"; jsdom cannot run the built ES-module bundle; no browser tool is installed today | request text; the NFR-021 verdict approves the dependency |
| `playwright` library under `node:test`-style scripts, not the `@playwright/test` runner | `scripts/` already hosts `node --test` checks; one smoke script needs no test runner | established pattern; smallest scope |
| Preinstalled Google Chrome, no browser download | runner image lists Chrome 155; the Mac has Chrome; avoids a ~192 MB download or cache | equivalent technical choice |
| Node 24 for the job | the deploy builds the frontend on Node 24; #326 made the same choice | closest to production |
| Production-shaped bundle (no mock flag at build), mock only on the server | REQ-063: no banner unless mock is configured at build | preserve shipped behavior |
| `FRONTEND_ORIGIN` set, so CORS is single-origin | production sets it (`aws-deploy.sh:108`) | closest to production |
| Phone and desktop width | REQ-207 phone path; cost is seconds | smallest scope that covers both shipped layouts |
| Joins `quality:check` | NFR-012 local/CI equivalence; #326 and NFR-017 precedent | PRD |
| Fails on any unexpected outside host | a smoke check must not depend on the internet; a new outside call becomes a deliberate allow-list edit | smallest reversible scope |
| Not a GitHub required check | no job is one today | established pattern |
| No retries | a retry hides real breakage; generous 15 s step timeouts absorb CPU-only rendering | smallest scope |
| Shared edits apply on top of #326's accepted text, #326 first | #326 merged 2026-10-19 with all three verdicts accept (`PRD/work/ci-built-server-smoke/GATE-QUESTIONS.md`); it merged first, so its build runs first | owner verdict on #326 |

## Non-goals

- No change to any player-facing behavior, screen, route, response or data
  file.
- No re-testing of feature rules the unit and flow tests already cover.
- No production-hosting check (S3, CloudFront, domain, headers), no Lambda
  wrapper check, no real AI call, no card-recognition check, no layout or
  speed measurement.
- No change to the deploy scripts.
- No GitHub settings change.
- Does not replace the Playwright MCP verification policy for slices
  (`runtime-process-hygiene.md`); the companion edit in the NFR-021 block says
  so.

## Product truth this needs

Full diffs in `GATE-QUESTIONS.md`:

- **NFR-021 (new)** — the built site opens in a real browser and each tool does
  its most basic action on every pull request; companion edits to
  `system-map.md` (Deploy and cost guardrails) and
  `PRD/instructions/runtime-process-hygiene.md` (its "no CI browser harness"
  sentence).
- **REQ-166 (amend)** — its list of quality-check jobs that run on every push
  to `main` gains `browser-smoke`, after #326's `built-server`.
- **NFR-012 (amend)** — its concurrent-jobs note, which #326's accepted change
  sets to 7, becomes 8.

All three apply on top of #326's accepted changes (see "Relationship to docs
PR #326").

NFR-021 is free: `PRD/sections/non-functional-requirements.md` ends at NFR-019
(re-checked 2026-10-19: `grep -rn 'NFR-02[01]' PRD/sections` finds nothing);
NFR-020 is reserved by #326's accepted proposal, which its build has not yet
written; `git grep NFR-021` over every remote branch's `PRD/` found nothing in
attempt 1.

## Amendment set — disposition per grep hit

**Grep 1** over `PRD/sections/` (CI, quality gate, smoke, end-to-end,
headless, Playwright, deploy verification, production build):
`grep -rniE "\bCI\b|quality gate|quality-check\.yml|quality:check|smoke|end-to-end|e2e|headless|playwright|deploy verif|post-deploy|vite build|production build"` — 74 hits. Both greps were re-run on 2026-10-19 after `origin/main` (with merged #326 and #337) was merged into this branch: same hit counts, no new hits; line numbers below are the current ones.

| # | Hit | Disposition |
| --- | --- | --- |
| 1 | `user-feedback/README.md:108` — live-send smoke of the feedback modal | unaffected; a manual check, different "smoke"; the suite never sends feedback |
| 2 | `decisions/deployment.md:15` — deploy runs `quality:check` first | unaffected; stays true, the suite joins `quality:check` |
| 3 | `system-map.md:277` — scanner summary ("end-to-end" identify path) | unaffected |
| 4 | `system-map.md:501` — on-demand rules-corpus answer run | unaffected |
| 5 | `system-map.md:508` — offline rules-corpus checks in `quality:check` | unaffected |
| 6 | `system-map.md:516` — AWS production deployment "Lives in" | unaffected; the deploy does not change |
| 7 | `system-map.md:536` — Deploy and cost guardrails summary | **amend in NFR-021 block** |
| 8 | `system-map.md:537` — Deploy and cost guardrails "Lives in" | **amend in NFR-021 block** (adds the `browser-smoke` job and script) |
| 9 | `system-map.md:579` — feedback feature summary | unaffected |
| 10 | `decisions.md:127` — DEC-086 (retired) index row | unaffected; historical index |
| 11 | `decisions.md:196` — DEC-155 (retired) CI parallelization row | unaffected; historical index |
| 12 | `decisions.md:202` — DEC-161 (retired) combo A/B row | unaffected |
| 13 | `in-depth/README.md:446` — combo A/B never in `quality:check` | unaffected; the suite makes no model call |
| 14 | `goals-and-non-goals.md:83` — answer quality never gates `quality:check` | unaffected; mock answers are checked for presence, never content |
| 15 | `scan/README.md:344` — laptop-camera end-to-end acceptance is qualitative | unaffected; the suite asserts no recognition |
| 16 | `non-functional-requirements.md:116` (NFR-009) — eval golden CI gate | unaffected |
| 17 | `non-functional-requirements.md:152` (NFR-011) — colour contrast note | unaffected; unrelated |
| 18 | `non-functional-requirements.md:185` (NFR-012 title) | unaffected |
| 19 | `non-functional-requirements.md:186` (NFR-012 description) | unaffected |
| 20 | `non-functional-requirements.md:188` (NFR-012) — every test runs once | unaffected; the suite is not a vitest test and runs once |
| 21 | `non-functional-requirements.md:189` (NFR-012) — `quality:check` stays canonical | satisfied by design step 3; no edit |
| 22 | `non-functional-requirements.md:190` (NFR-012) — parallel jobs | satisfied; the new job runs in parallel; no edit |
| 23 | `non-functional-requirements.md:191` (NFR-012) — coverage every run | unaffected |
| 24 | `non-functional-requirements.md:193` (NFR-012) — deploy depends on gate jobs | satisfied by design step 5; no edit |
| 25 | `non-functional-requirements.md:194` (NFR-012) — parity guard | satisfied; the existing guard covers the new leaf |
| 26 | `non-functional-requirements.md:206` (NFR-012 note) — DEC-086 deferral | unaffected |
| 27 | `non-functional-requirements.md:207` (NFR-012 note) — shard scaling rule | unaffected; frontend-shard measure |
| 28 | `non-functional-requirements.md:209` (NFR-012 note) — "against the 6 this workflow uses" (7 once #326's accepted change is applied) | **amend: NFR-012 block** (7 → 8, on top of #326) |
| 29 | `non-functional-requirements.md:288` (NFR-017) — package-size test fails the PR, not after merge | unaffected; precedent for joining `quality:check` |
| 30 | `non-functional-requirements.md:299` (NFR-017) — onnxruntime platforms | unaffected |
| 31 | `non-functional-requirements.md:303` (NFR-017) — CUDA download on x64 CI | unaffected; the new job inherits the workflow-level skip |
| 32 | `non-functional-requirements.md:313` (NFR-018) — prompt gate in `quality:check` | unaffected |
| 33 | `non-functional-requirements.md:314` (NFR-018) — practice suite never in CI | unaffected |
| 34 | `functional-requirements.md:676` — scan golden-vector parity tests | unaffected |
| 35 | `functional-requirements.md:786` (REQ-039) — no CI image refresh | unaffected; the suite downloads no images |
| 36 | `functional-requirements.md:795` — `cardhashes.bin` production build | unaffected; different "build" |
| 37 | `functional-requirements.md:894` — scan fixtures regenerated | unaffected |
| 38 | `functional-requirements.md:1381` (REQ-060) — visual review of conversation surfaces | unaffected |
| 39 | `functional-requirements.md:1487` (REQ-063) — no mock banner in a production build unless configured | unaffected; design builds without the mock flag, consistent with it |
| 40 | `functional-requirements.md:2246` (REQ-093) — brotli, Node 22 vs 24 | unaffected; one reason the job runs Node 24 |
| 41 | `functional-requirements.md:3308` — fix verified via Playwright | unaffected; historical verification note |
| 42 | `functional-requirements.md:3344` — Playwright confirmed scrim handler | unaffected; historical note |
| 43 | `functional-requirements.md:3583` (REQ-146) — comparison never in `quality:check` | unaffected |
| 44 | `functional-requirements.md:3586` (REQ-146) — never fail CI on model answers | unaffected; mock answers only, content never asserted |
| 45 | `functional-requirements.md:3913` (REQ-165) — deploy only after `quality:check` | unaffected; stays true |
| 46 | `functional-requirements.md:3928` (REQ-166) — deploy only on code-set changes | unaffected |
| 47 | `functional-requirements.md:3930` (REQ-166) — job list `static`, `backend`, `frontend`, `coverage-merge` (`built-server` once #326's accepted change is applied) | **amend: REQ-166 block** (adds `browser-smoke`) |
| 48 | `functional-requirements.md:4201` — retrieval report parity test fails the PR | unaffected |
| 49 | `functional-requirements.md:4430` (REQ-184) — sharp arm64 binding | unaffected; the mock boot loads no native module |
| 50 | `functional-requirements.md:4572` — evidence trace never in `quality:check` | unaffected |
| 51 | `functional-requirements.md:4646` — answer latency notes | unaffected |
| 52 | `functional-requirements.md:4749` — graph close writes receipt | unaffected |
| 53 | `functional-requirements.md:4782` (REQ-195) — never a CI cron | unaffected |
| 54 | `functional-requirements.md:4816` (REQ-195) — no CI cron | unaffected |
| 55 | `functional-requirements.md:4931` (REQ-198) — robots/security.txt served as files | unaffected |
| 56 | `functional-requirements.md:4933` (REQ-198) — robots.txt copied by the production build, proven by a script test | unaffected; the suite builds into its own folder and leaves that test's `dist/` alone |
| 57 | `functional-requirements.md:4935` (REQ-198) — security.txt copied, proven at build | unaffected; same |
| 58 | `functional-requirements.md:5011` — colour measurement in the shipped app | unaffected |
| 59 | `functional-requirements.md:5163` (REQ-202) — screenshot pair is not a CI job | unaffected; a review attachment, separate from this check |
| 60 | `functional-requirements.md:5164` (REQ-202) — does not enter `quality:check` | unaffected; applies only to the screenshot pair |
| 61 | `functional-requirements.md:5178` (REQ-202) — captures in `.playwright-mcp/` | unaffected |
| 62 | `functional-requirements.md:5902` (REQ-222) — offline prompt gate on every PR | unaffected |
| 63 | `functional-requirements.md:5907` (REQ-222) — frozen query vectors | unaffected |
| 64 | `functional-requirements.md:5935` (REQ-223) — mechanic gate in `quality:check` | unaffected |
| 65 | `functional-requirements.md:5980` — staleness never a gate | unaffected |
| 66 | `functional-requirements.md:6092` — trace never a gate | unaffected |
| 67 | `functional-requirements.md:6166` (REQ-232) — practice suite description | unaffected |
| 68 | `functional-requirements.md:6181` (REQ-232) — never a gate | unaffected |
| 69 | `functional-requirements.md:6187` (REQ-232) — never a standing CI gate | unaffected |
| 70 | `functional-requirements.md:6290` — measured at intake | unaffected |
| 71 | `functional-requirements.md:6314` (REQ-236) — never in CI | unaffected |
| 72 | `functional-requirements.md:6315` (REQ-236) — Python never a CI dependency | unaffected; the new dependency is a Node package |
| 73 | `functional-requirements.md:6346` (REQ-237) — CI cannot provision | unaffected |
| 74 | `functional-requirements.md:6347` (REQ-237) — CI needs no AWS and no model | unaffected; NFR-021 depends on it |

**Grep 2** over `PRD/sections/` for browser wording not already in grep 1:
`grep -rniE "browser" PRD/sections/` minus grep-1 hits — 101 hits. Every one
uses "browser" for the player's browser or a browser feature; none describes a
test browser or a CI check.

| # | Hit | Disposition |
| --- | --- | --- |
| B1 | `overview.md:13` — card scanning, browser-local personalization | unaffected — a player's browser or a browser feature, not a test browser |
| B2 | `user-flows.md:173` — app stores the selected profile for the browser | unaffected — a player's browser or a browser feature, not a test browser |
| B3 | `user-flows.md:178` — browser storage unavailable | unaffected — a player's browser or a browser feature, not a test browser |
| B4 | `user-flows.md:236` — refresh restores the last active destination | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B5 | `user-flows.md:275` — Ask a Question is not a rules browser | unaffected — a player's browser or a browser feature, not a test browser |
| B6 | `user-flows.md:300` — tracker state persists to browser-local storage | unaffected — a player's browser or a browser feature, not a test browser |
| B7 | `user-flows.md:397` — Draft remains browser-local | unaffected — a player's browser or a browser feature, not a test browser |
| B8 | `user-flows.md:423` — browser-local history exists | unaffected — a player's browser or a browser feature, not a test browser |
| B9 | `screen-layout.md:46` — "fill available space" vs browser chrome | unaffected — a player's browser or a browser feature, not a test browser |
| B10 | `system-map.md:221` — theme settings summary | unaffected — a player's browser or a browser feature, not a test browser |
| B11 | `system-map.md:228` — profiles persisted in browser storage | unaffected — a player's browser or a browser feature, not a test browser |
| B12 | `system-map.md:368` — submit orchestration summary | unaffected — a player's browser or a browser feature, not a test browser |
| B13 | `system-map.md:375` — context freeze, restore/save hooks | unaffected — a player's browser or a browser feature, not a test browser |
| B14 | `system-map.md:389` — browser-local conversation history | unaffected — a player's browser or a browser feature, not a test browser |
| B15 | `system-map.md:522` — static frontend via S3 + CloudFront | unaffected — production hosting; the suite serves the build locally and does not test hosting |
| B16 | `system-map.md:550` — Life Tracker summary | unaffected — a player's browser or a browser feature, not a test browser |
| B17 | `system-map.md:557` — Commander Spellbook enrichment summary | unaffected — a player's browser or a browser feature, not a test browser |
| B18 | `system-map.md:571` — layout / feature-portal summary | unaffected — a player's browser or a browser feature, not a test browser |
| B19 | `decisions.md:107` — DEC-066 (retired) | unaffected — a player's browser or a browser feature, not a test browser |
| B20 | `decisions.md:144` — DEC-103 (retired) | unaffected — a player's browser or a browser feature, not a test browser |
| B21 | `decisions.md:152` — DEC-111 (retired) active destination persists in a tab | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B22 | `decisions.md:165` — DEC-124 (retired) | unaffected — a player's browser or a browser feature, not a test browser |
| B23 | `decisions.md:171` — DEC-130 (retired) | unaffected — a player's browser or a browser feature, not a test browser |
| B24 | `decisions.md:184` — DEC-143 (retired) | unaffected — a player's browser or a browser feature, not a test browser |
| B25 | `decisions.md:195` — DEC-154 (retired) Git ownership | unaffected — a player's browser or a browser feature, not a test browser |
| B26 | `functional-requirements.md:36` — matching stays in the browser | unaffected — a player's browser or a browser feature, not a test browser |
| B27 | `functional-requirements.md:916` — colour profile control | unaffected — a player's browser or a browser feature, not a test browser |
| B28 | `functional-requirements.md:921` — palette persists per browser | unaffected — a player's browser or a browser feature, not a test browser |
| B29 | `functional-requirements.md:1163` — scanner camera capture mode | unaffected — scanner; the suite only opens the panel and checks its data loads |
| B30 | `functional-requirements.md:1219` — cat-wizard egg | unaffected — a player's browser or a browser feature, not a test browser |
| B31 | `functional-requirements.md:2006` — tracker state persistence | unaffected — a player's browser or a browser feature, not a test browser |
| B32 | `functional-requirements.md:2008` — tracker state fields | unaffected — a player's browser or a browser feature, not a test browser |
| B33 | `functional-requirements.md:2019` — reuses ThemeControl persistence | unaffected — a player's browser or a browser feature, not a test browser |
| B34 | `functional-requirements.md:2148` — a new tab opens on the first destination | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B35 | `functional-requirements.md:2153` — sessionStorage, not localStorage | unaffected — a player's browser or a browser feature, not a test browser |
| B36 | `functional-requirements.md:2303` — no combo browser | unaffected — a player's browser or a browser feature, not a test browser |
| B37 | `functional-requirements.md:2434` — presentation and browser-local only | unaffected — a player's browser or a browser feature, not a test browser |
| B38 | `functional-requirements.md:2455` — default theme moved to White | unaffected — a player's browser or a browser feature, not a test browser |
| B39 | `functional-requirements.md:2547` — Question History | unaffected — a player's browser or a browser feature, not a test browser |
| B40 | `functional-requirements.md:2549` — auto-save to browser-local history | unaffected — a player's browser or a browser feature, not a test browser |
| B41 | `functional-requirements.md:2555` — history scoped to one browser | unaffected — a player's browser or a browser feature, not a test browser |
| B42 | `functional-requirements.md:2562` — frontend-only, browser-local | unaffected — a player's browser or a browser feature, not a test browser |
| B43 | `functional-requirements.md:2690` — Draft browser-local | unaffected — a player's browser or a browser feature, not a test browser |
| B44 | `functional-requirements.md:2803` — Menu tray never scrolls sideways | unaffected — a player's browser or a browser feature, not a test browser |
| B45 | `functional-requirements.md:2920` — delete history entries | unaffected — a player's browser or a browser feature, not a test browser |
| B46 | `functional-requirements.md:3428` (REQ-140 title) — deep links and browser history | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B47 | `functional-requirements.md:3430` (REQ-140) — each destination at its own URL | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B48 | `functional-requirements.md:3434` (REQ-140) — Menu updates the URL | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B49 | `functional-requirements.md:3457` (REQ-140) — narrows REQ-090 | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B50 | `functional-requirements.md:4300` — browser payload carries less | unaffected — a player's browser or a browser feature, not a test browser |
| B51 | `functional-requirements.md:4917` — HSTS, no preload | unaffected — a player's browser or a browser feature, not a test browser |
| B52 | `functional-requirements.md:4919` — the backend's single allowed browser origin and CORS untouched | unaffected — production allows one browser origin; the suite sets the same single allowed origin, so it exercises this CORS rule |
| B53 | `functional-requirements.md:4960` — corporate block-page checklist | unaffected — a player's browser or a browser feature, not a test browser |
| B54 | `functional-requirements.md:5212` — state survives destination switches | unaffected — a player's browser or a browser feature, not a test browser |
| B55 | `functional-requirements.md:5362` — "Add in-depth details" carries cards over | unaffected — a player's browser or a browser feature, not a test browser |
| B56 | `functional-requirements.md:5483` — zones reorder by drag | unaffected — a player's browser or a browser feature, not a test browser |
| B57 | `functional-requirements.md:5564` — microphone in the send pill | unaffected — microphone dictation; not exercised by the suite |
| B58 | `functional-requirements.md:5566` — where the browser exposes speech recognition | unaffected — microphone dictation; not exercised by the suite |
| B59 | `functional-requirements.md:5567` — tap the mic to listen | unaffected — microphone dictation; not exercised by the suite |
| B60 | `functional-requirements.md:5571` — tests with and without the browser API | unaffected — microphone dictation; not exercised by the suite |
| B61 | `functional-requirements.md:5573` — browser-native only, no dependency | unaffected — microphone dictation; not exercised by the suite |
| B62 | `functional-requirements.md:5579` — vendor speech service note | unaffected — microphone dictation; not exercised by the suite |
| B63 | `functional-requirements.md:5595` — per-flow list filter removed | unaffected — a player's browser or a browser feature, not a test browser |
| B64 | `functional-requirements.md:5777` — anchor-ask-composer root cause | unaffected — a player's browser or a browser feature, not a test browser |
| B65 | `functional-requirements.md:5782` (REQ-219 title) — browser tab personality | unaffected — a player's browser or a browser feature, not a test browser |
| B66 | `functional-requirements.md:5784` — the Chrome/Firefox tab | unaffected — a player's browser or a browser feature, not a test browser |
| B67 | `functional-requirements.md:5786` — three things the browser paints | unaffected — a player's browser or a browser feature, not a test browser |
| B68 | `functional-requirements.md:5788` — theme-color tints browser chrome | unaffected — a player's browser or a browser feature, not a test browser |
| B69 | `functional-requirements.md:5792` — default blank page icon | unaffected — a player's browser or a browser feature, not a test browser |
| B70 | `functional-requirements.md:5795` — mobile browser bar tinted | unaffected — a player's browser or a browser feature, not a test browser |
| B71 | `functional-requirements.md:5802` — browser-chrome only | unaffected — a player's browser or a browser feature, not a test browser |
| B72 | `functional-requirements.md:5807` — not the default blank icon | unaffected — a player's browser or a browser feature, not a test browser |
| B73 | `functional-requirements.md:5830` — pure frontend/browser-chrome | unaffected — a player's browser or a browser feature, not a test browser |
| B74 | `functional-requirements.md:5839` — theme-color alone tints the bar | unaffected — a player's browser or a browser feature, not a test browser |
| B75 | `functional-requirements.md:5840` — browser chrome only, no new screen | unaffected — a player's browser or a browser feature, not a test browser |
| B76 | `functional-requirements.md:5849` — the "tab" is the browser tab | unaffected — a player's browser or a browser feature, not a test browser |
| B77 | `functional-requirements.md:5863` — owner clarified the browser tab | unaffected — a player's browser or a browser feature, not a test browser |
| B78 | `functional-requirements.md:6618` — scan-data-failed copy | unaffected — scanner; the suite only opens the panel and checks its data loads |
| B79 | `user-feedback/README.md:21` — feedback happens in the browser | unaffected — a player's browser or a browser feature, not a test browser |
| B80 | `life-tracker/README.md:123` — presentation preferences saved browser-local | unaffected — a player's browser or a browser feature, not a test browser |
| B81 | `goals-and-non-goals.md:41` — browser-local palette | unaffected — a player's browser or a browser feature, not a test browser |
| B82 | `goals-and-non-goals.md:43` — chat-first workspace | unaffected — a player's browser or a browser feature, not a test browser |
| B83 | `goals-and-non-goals.md:71` — no saved sessions beyond history | unaffected — a player's browser or a browser feature, not a test browser |
| B84 | `goals-and-non-goals.md:82` — no combo browser | unaffected — a player's browser or a browser feature, not a test browser |
| B85 | `scan/README.md:31` — the scanner runs entirely in the browser | unaffected — scanner; the suite only opens the panel and checks its data loads |
| B86 | `decisions/deployment.md:6` — DEC-084 serverless deployment | unaffected — production hosting; the suite serves the build locally and does not test hosting |
| B87 | `non-functional-requirements.md:150` (NFR-011) — palette persistence degrades gracefully | unaffected — a player's browser or a browser feature, not a test browser |
| B88 | `non-functional-requirements.md:240` (NFR-014) — tiered background download | unaffected — observed working in the built bundle; the suite does not assert it |
| B89 | `in-depth/README.md:311` — ephemeral workspace | unaffected — a player's browser or a browser feature, not a test browser |
| B90 | `in-depth/README.md:586` — superseded by browser-local history | unaffected — a player's browser or a browser feature, not a test browser |
| B91 | `shared-chrome/README.md:85` — back/forward between destinations | unaffected — deep links and tool switching; the suite opens tools by URL and by the Menu, so it exercises this in the built site |
| B92 | `shared-chrome/README.md:103` — tier 2 background download | unaffected — observed working in the built bundle; the suite does not assert it |
| B93 | `shared-chrome/README.md:152` — browser tab personality | unaffected — a player's browser or a browser feature, not a test browser |
| B94 | `shared-chrome/README.md:156` — tab icon and title | unaffected — a player's browser or a browser feature, not a test browser |
| B95 | `shared-chrome/README.md:158` — theme-color meta | unaffected — a player's browser or a browser feature, not a test browser |
| B96 | `shared-chrome/README.md:188` — reload behavior | unaffected — a player's browser or a browser feature, not a test browser |
| B97 | `shared-chrome/README.md:196` — palette persistence | unaffected — a player's browser or a browser feature, not a test browser |
| B98 | `shared-chrome/README.md:261` — history list capped at 20 | unaffected — a player's browser or a browser feature, not a test browser |
| B99 | `shared-chrome/README.md:284` — one Draft slot per flow | unaffected — a player's browser or a browser feature, not a test browser |
| B100 | `quick-lookup/README.md:36` — not a rules browser | unaffected — a player's browser or a browser feature, not a test browser |
| B101 | `quick-lookup/README.md:117` — send-pill edge styling | unaffected — a player's browser or a browser feature, not a test browser |

Outside `PRD/sections/`, one process sentence is touched:
`PRD/instructions/runtime-process-hygiene.md` — "This policy introduces no new
`@playwright/test` CI harness." It stays accurate in letter (the suite uses
the `playwright` library, not `@playwright/test`) but would mislead in spirit,
so the NFR-021 block amends it.

## Related material (citations only, not opened)

- `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md`
- `PRD/ideasForLater/codebase-cleanup-followups/evidence/GRAPH-BRIEF-backend-health.md`
- `PRD/ideasForLater/codebase-cleanup-followups/evidence/FINDINGS-scripts-tooling-tests.md`
- Prior runs listed in `IDEA.md`.
