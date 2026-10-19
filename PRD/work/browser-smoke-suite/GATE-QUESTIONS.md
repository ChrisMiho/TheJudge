# Gate questions — browser-smoke-suite

**Decide:** three product-truth changes, one block each. Answer each
`Verdict:` with accept, edit or reject; a reason is required for edit and
reject. The design behind them is in `DESIGN-BRIEF.md`; the live measurements
are in `evidence/measurements.md`. There are no blocker questions.

**This proposal goes on top of #326's accepted changes.** Docs PR #326 (the
built-backend boot check, NFR-020) merged on 2026-10-19 with all three
verdicts accept. Its build has not written that text into `PRD/sections/` yet.
#326's accepted REQ-166, NFR-012 and system-map text is applied first, then
this package's. After both: NFR-021 follows NFR-020, REQ-166's job list
includes `built-server` and then `browser-smoke`, and NFR-012 counts 8 jobs.

Each diff below therefore gives two exact texts: what `PRD/sections/` says
today (checked 2026-10-19, after `origin/main` was merged into this branch;
each line matches exactly once), and what it will say after #326's accepted
change. Each diff applies after #326's accepted change has been written into
`PRD/sections/`, so this package's build replaces the post-#326 text.

## NFR-021 — every pull request opens the built site in a real browser and uses each tool once

**What this decides:** whether every pull request must prove, in a real
browser, that the site the deploy would ship opens and that each tool does its
most basic thing — and whether to add one testing tool (`playwright`, a
library that drives Chrome from a script) to the project to do it.

**In plain terms:** today's tests run the app's code inside a simulated page
that never loads the real built files, never applies the styles, and fakes
every call to the server. Every pull request already builds the site (a
script test runs the production build to check two files get copied), but
nothing ever opens that build. So a change can pass every check and still ship
a blank page, a tool that never opens, or a send button that never gets an
answer. This adds one check to every pull request: it builds the site exactly
as the deploy does (pointed at a local server), starts the built server with
the free pretend AI (the "mock" provider — no paid call, no secret, no AWS
access, which CI already never needs, REQ-237), opens the site in Google
Chrome without a screen, and at phone and desktop width does one thing per
tool: asks a question and gets an answer; walks In-Depth's four steps with Sol
Ring and gets an answer; taps minus on Player 1 in the Life Tracker; adds Sol
Ring to the Trade Balancer and sees a dollar total; opens the scanner and sees
its card data load; opens Send feedback. It fails on any error in the browser
console or any failed request. It never sends feedback, never uses a real
camera, and never checks answer wording or prices, so a data refresh cannot
turn it red. It also joins `npm run quality:check`, the one command you run
locally before a PR, so local and CI stay the same (NFR-012) — locally it needs
Google Chrome, which you have. A red result shows on the PR and stops the
deploy from `main`, like every other check; it does not lock the merge button,
because no check does today. It sits beside the built-backend check you
accepted in #326 (NFR-020) and shares nothing with it. Measured locally: the
build takes about 4 seconds, every tool worked, zero console errors.

**What happens if you say no:** nothing new is checked and no testing tool is
added. A build that compiles but does not run in a browser is still first
found after deploy — by you or by players.

Proposed diff — `PRD/sections/non-functional-requirements.md`: append after
the NFR-020 block that #326's accepted change adds at the end of the file.
This applies after #326's accepted change has been written into
`PRD/sections/`.

Today the file ends with NFR-019's last Notes line (this is the line #326's
diff anchors on, not this one):

```
  - re-measured after REQ-174/Slice C (trade-balancer-price-slim): the slim shape now stores a representative-printing id (`imageId`) instead of the full `imageUrl` string, so it compresses further — gzipped drops ~57.2% (4.23 MB → 1.81 MB, measured against the same live 33,399-card corpus). The ≥40% floor is unchanged and still has headroom
```

After #326's accepted change, the file ends with NFR-020's last Notes line.
This diff appends after it:

```diff
@@ end of file, after the NFR-020 Notes @@
   - measured 2026-10-18 on macOS arm64: build 1.2 s, server listening ~0.5 s after launch, both calls under 2 ms; with the data folder removed, health answered `200` and Sol Ring `404`; the built code booted on Node 22, 24 and 26
+
+### NFR-021
+- Title: The built site opens in a real browser and each tool does its most basic action on every pull request
+- Description: Every pull request and every push to `main` proves, in a real headless browser, that the frontend the deploy ships — the output of `npm --workspace apps/frontend run build` — loads against the compiled backend and that each tool a player can open does its most basic action. A change that type-checks and passes the source-level tests but leaves the built site blank, a tool unable to load, or a request failing between the built site and the built server, fails before merge and never deploys. Before this, a pull request compiled the production bundle (`npm run typecheck` and the REQ-198 build test) but nothing ever opened it: the frontend tests run source files in jsdom with every tool preloaded and every network call stubbed.
+- Constraints:
+  - the check is the committed command `npm run smoke:browser` (`node scripts/smoke-browser.mjs`); it picks two free local ports, builds the frontend with `npm --workspace apps/frontend run build` into its own gitignored output folder under `.tmp/browser-smoke/` (never `apps/frontend/dist/`), builds the backend with `npm --workspace apps/backend run build`, starts `node apps/backend/dist/index.js`, serves the built frontend with `vite preview`, and drives it with the `playwright` library in headless Google Chrome
+  - the frontend is built with `VITE_API_URL` set to the local backend (`http://127.0.0.1:<port>`), `VITE_DEBUG_LOGGING=false`, and `ASK_AI_PROVIDER`, `VITE_ASK_AI_PROVIDER` and `VITE_FEEDBACK_FORMSPREE_ID` unset, so the bundle matches production apart from its API address: no mock banner (REQ-063) and no feedback delivery
+  - the backend runs with `FRONTEND_ORIGIN` set to the local frontend origin, so the single-allowed-origin CORS rule production uses is exercised, and with `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY` and `NODE_ENV` unset, so both providers are `mock` and no `.env` or `.secrets/` file is read; the check reads only committed data, makes no paid call and downloads no model (REQ-237)
+  - requests to `cards.scryfall.io` (card images) are answered locally with a placeholder image; a request to any other host than the two local servers is blocked and fails the check, so the check never depends on the internet
+  - at a phone viewport (390 × 844) and a desktop viewport (1280 × 800), each in a fresh browser context with empty storage, the check: (1) opens `/`, lands on Ask a Question, sends a typed question and sees an answer in the conversation; (2) opens the ☰ Menu, chooses Life Tracker, lands on `/life-tracker`, taps "Decrease life for Player 1" and sees Player 1 at 39; (3) opens `/trade-balancer` directly, adds Sol Ring to Side A through search, picks a printing price, and sees a Side A total above $0.00; (4) opens `/in-depth` directly, walks game, zones, cards (Sol Ring on the battlefield) and context, presses "Decrypt Stack" and sees an answer; (5) from Ask a Question opens the scanner and sees `/data/cardhashes.bin` and `/data/cardScanMap.json` load; (6) opens "Send feedback" from the Menu and sees the form, without sending
+  - the scanner runs with Chrome's fake camera (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) and must not show "Camera unavailable"; card recognition is never asserted. If the runner's Chrome cannot start the fake camera, that one assertion is dropped and the rest of step 5 stays
+  - it passes only when every step finishes within 15 seconds, with zero browser console errors, zero uncaught page errors, and no request to either local server failing or answering 400 or above; there are no automatic retries
+  - assertions use visible labels and shapes — an answer is present, a total is above zero — never exact answer wording, prices or card text, so a data refresh cannot fail it; microphone dictation and real AI answers are not exercised
+  - on failure it prints the failing step, the console messages, the failed requests and both servers' output, and saves a screenshot under `.tmp/browser-smoke/`; in every case it closes the browser and stops both servers
+  - its pass/fail rules (request classification, console filtering, port picking) are unit-tested under `scripts/` and run by `npm run test:scripts`
+  - `npm run smoke:browser` is part of `npm run quality:check`, so the canonical local pre-PR command and CI stay equivalent (NFR-012); locally it needs Google Chrome installed
+  - CI runs it in its own `browser-smoke` job in `.github/workflows/quality-check.yml` on every pull request and every push to `main`, with no path filter (REQ-166's no-trigger-filter rule), on Node 24 (the version the deploy builds the frontend with), using the runner's preinstalled Google Chrome so no browser is downloaded; on failure the job uploads `.tmp/browser-smoke/` as an artifact kept 7 days; the `deploy` job lists `browser-smoke` in `needs:`
+  - the `browser-smoke` job gets no `id-token` permission and no secret; only `deploy` may assume AWS credentials (DEC-084)
+  - `playwright` is a root dev dependency pinned to an exact version; it has no install script, so `npm ci` downloads no browser
+  - it is independent of NFR-020, the built-backend boot check: it shares no command, script or job with it, and both run on every pull request
+- Dependencies:
+  - NFR-012
+  - NFR-014
+  - REQ-063
+  - REQ-140
+  - REQ-166
+  - REQ-198
+  - REQ-237
+  - DEC-084
+- Notes:
+  - measured 2026-10-18 on macOS arm64 (`PRD/work/browser-smoke-suite/evidence/measurements.md`, folded into the receipt at close): frontend build 3.7–4.8 s, backend build 1.1 s, first paint 164 ms; every step passed by hand in Chrome 155 at both widths with zero console errors. CI time on the x86 runner was estimated at about one minute, in parallel with the frontend shards
+  - the runner renders without a GPU, so the check never times animation or asserts frame rates
+  - what it does not prove: production hosting (S3, CloudFront, domain, headers), the Lambda wrapper, the real AI, camera recognition, exact layout, or speed
```

Companion edit — `PRD/sections/system-map.md`, `### Deploy and cost guardrails`.
This applies after #326's accepted change has been written into
`PRD/sections/`.

Today the entry reads (lines 535–538; #326's diff replaces these):

```
- Status: shipped
- Summary: Gates every main-branch deploy on `quality:check`, skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
- Lives in: `.github/workflows/quality-check.yml` (`changes` and `deploy` jobs), `scripts/aws-bootstrap.sh`
- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017
```

This diff replaces the post-#326 text:

```diff
 - Status: shipped
-- Summary: Gates every main-branch deploy on `quality:check` — including the built-backend boot check, which starts the compiled server on every pull request and requires the health check and one card lookup to answer — skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
-- Lives in: `.github/workflows/quality-check.yml` (`built-server`, `changes` and `deploy` jobs), `scripts/smoke-built-server.mjs`, `scripts/aws-bootstrap.sh`
-- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, NFR-020
+- Summary: Gates every main-branch deploy on `quality:check` — including the built-backend boot check, which starts the compiled server on every pull request and requires the health check and one card lookup to answer, and the browser smoke check, which opens the built site in headless Chrome against the built backend on every pull request and requires each tool's most basic action to work — skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
+- Lives in: `.github/workflows/quality-check.yml` (`built-server`, `browser-smoke`, `changes` and `deploy` jobs), `scripts/smoke-built-server.mjs`, `scripts/smoke-browser.mjs`, `scripts/aws-bootstrap.sh`
+- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, NFR-020, NFR-021
```

Companion edit — `PRD/instructions/runtime-process-hygiene.md`,
`## Playwright verification policy` (process text, not product truth; kept true
so the policy and the new check do not contradict each other). #326 does not
touch this file, so the text below is current today (lines 22–26):

```diff
 observations and measurements, and cleanup checks directly in the affected
 slices' acceptance criteria. Unit and component tests remain required where
-appropriate; Playwright does not replace them. This policy introduces no new
-`@playwright/test` CI harness.
+appropriate; Playwright does not replace them. This policy adds no CI harness
+of its own. The one browser check CI runs is NFR-021's smoke check
+(`npm run smoke:browser`), which proves each tool opens and does its most
+basic action in the built site; it does not replace the slice-level browser
+scenarios this policy requires, and they do not replace it.
```

- Verdict:
- Reason:

## REQ-166 — the new check also runs on every merge to main

**What this decides:** whether the list of checks that still run on a
documentation-only merge to `main` names the new browser check.

**In plain terms:** REQ-166 is the rule that a merge touching only documents
skips the production deploy but still runs every quality check, so `main`
always shows a green or red result. Its acceptance list names those checks one
by one. Today it lists `static`, `backend`, `frontend` and `coverage-merge`;
the change you accepted in #326 adds `built-server`. The new `browser-smoke`
check (NFR-021, above) also runs on every merge, so it joins that list after
`built-server`. Nothing about when the deploy runs or skips changes.

**What happens if you say no:** REQ-166's list stays shorter than what CI
actually runs, so the written rule no longer matches the workflow.

Proposed diff — `PRD/sections/functional-requirements.md`, `### REQ-166`
Acceptance Criteria. This applies after #326's accepted change has been
written into `PRD/sections/`.

Today the line reads (line 3930; #326's diff replaces it):

```
  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
```

This diff replaces the post-#326 line:

```diff
-  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`, `built-server`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
+  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`, `built-server`, `browser-smoke`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
```

- Verdict:
- Reason:

## NFR-012 — the CI job count note goes from 7 to 8

**What this decides:** whether the CI-cost note in the test-speed requirement
records the new job in its count of jobs that run at once.

**In plain terms:** NFR-012 is the rule that keeps CI fast without weakening
any check. One of its notes says the repository is public, so runner minutes
are free, and that the real limit is how many jobs run at the same time — 20
allowed. Today the note says "against the 6 this workflow uses"; the change
you accepted in #326 makes it 7, for the built-backend job. The browser check
(NFR-021) is one more job on every pull request, so the note says 8. If the
repository ever went private, it would add about one more billed minute per
run, which the note now says too.

**What happens if you say no:** the note keeps a job count the workflow no
longer has.

Proposed diff — `PRD/sections/non-functional-requirements.md`, `### NFR-012`
Notes. This applies after #326's accepted change has been written into
`PRD/sections/`.

Today the line reads (line 209; #326's diff replaces it):

```
  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 6 this workflow uses. Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2 — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
```

This diff replaces the post-#326 line:

```diff
-  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 7 this workflow uses on a pull request (the seventh is NFR-020's `built-server` job). Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2, plus about one minute for `built-server` — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
+  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 8 this workflow uses on a pull request (the seventh is NFR-020's `built-server` job, the eighth NFR-021's `browser-smoke` job). Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2, plus about one minute each for `built-server` and `browser-smoke` — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
```

- Verdict:
- Reason:

## Blocker questions

None. Each open question in `IDEA.md` was answered from the repository, the
PRD and the live run (`DESIGN-BRIEF.md`, "Answers to the open questions"). The
one real choice — adding the `playwright` dev dependency — is the NFR-021
verdict above, not a separate blocker.
