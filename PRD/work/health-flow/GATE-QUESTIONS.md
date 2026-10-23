# Gate questions — health-flow

**Decide:** seventeen product-truth changes, one block each. Answer each
`Verdict:` with accept, edit or reject; a reason is required for edit and
reject. The design is in `DESIGN-BRIEF.md`; the live walks and the bug
diagnosis are in `evidence/`. There is one blocker question at the end
(Q-015): whether the Life Tracker tap "bug" (fix 10) is a bug at all.

**The test-case list:** the NFR-022 block ends with it, one row per player
flow. It is where the build starts, not a list you must approve first. The
build fixes the bugs, builds these tests and opens the code PR, and the run
ends there. Before you merge, you watch the tests run and name what's
missing; a Claude Code session you start on that PR's branch adds your
misses to the same PR. Nothing freezes until you merge. You may still edit a
row now through NFR-022's verdict.

**How to read the blocks.** The first four set up the flow tests (NFR-022,
NFR-021, NFR-012, REQ-166). The next two delete the retired flows (FLOW-008,
FLOW-012). The next four record decisions you already made in the session
(REQ-027, FLOW-017, REQ-206, REQ-058). The last six bring flow wording up to
date with what the app already does (FLOW-005, FLOW-006, FLOW-007, FLOW-010,
FLOW-013, FLOW-023) plus one unmentioned price chip (FLOW-024). Each old text
was checked on 2026-10-20, and again on 2026-10-22 after the NFR-012 and
NFR-021 hunks grew, to match exactly once in its file.

---

## NFR-022 — every player flow has a frozen browser test

**What this decides:** whether each of the 18 player flows gets one browser
test that walks it like a player and checks what the PRD promises, frozen so
that a failing one means something broke — and the rules for changing those
tests later.

**In plain terms:** a test opens the real built site in Chrome, at phone and
desktop size, using the free pretend AI (the "mock" provider — same answer
every time, no cost), and does what a player does: add Sol Ring, ask a
question, tap minus, delete a saved question. It checks the result the flow
promises, never exact AI wording, prices or pixels. A map file lists every
flow and the test that guards it, plus a fingerprint of the flow's PRD text:
if anyone edits a flow in the PRD, a check fails until they update its test
too. Every test must be shown to fail when its feature is broken on purpose,
so no test is decoration. Beside each test sits a short plain list of what
it checks and what it skips, so a gap shows as a missing line. The tests run
on every pull request, split across
parallel CI jobs ("shards") so they add no waiting time. Unit tests stay
editable; these do not, except by you or a feature or bug-fix PR you merge.
The future code-health pipeline (Part 2) may never touch them. This also
replaces the six-step browser smoke check (NFR-021) — each of its steps is
inside a flow test now.

**What happens if you say no:** the six-step smoke check stays the only
browser test, Part 2 has no behavior baseline to trust, and auto-merge stays
off.

```diff
+### NFR-022
+- Title: Every player flow has a frozen browser test that proves it still works
+- Description: Each player flow in `user-flows.md` has one browser test that walks it the way a player does in the built site, at phone and desktop sizes, and checks the outcome the flow promises. The suite is the project's behavior baseline: unit and component tests may change when code is rewritten, the flow tests may not, so a failing flow test is the sign a change broke something a player relies on. It runs on every pull request and in `npm run quality:check`, under NFR-021's harness rules.
+- Constraints:
+  - one test file per flow in `e2e/flows/` (`flow-NNN-<slug>.spec.ts`); a flow's edge cases are steps inside its file, never a second file for the same flow
+  - the runner is `@playwright/test`, a root dev dependency pinned to the same exact version as `playwright`; `npm run test:flows` runs the suite
+  - every test runs at 390 × 844 and 1280 × 800, each in a fresh browser context with empty storage, unless its coverage-map row records why one size suffices
+  - assertions use visible labels, accessible names, request bodies and shapes (an answer is present, a total is above $0.00), never exact AI wording, prices, card text or pixels; there are no screenshot comparisons
+  - a test may replace the mock answer with a short fixed answer through a route when its flow needs a second turn; FLOW-005's test also sends one follow-up after the full-length mock answer
+  - the scanner tests play one committed card image through Chrome's fake camera (`--use-file-for-fake-video-capture`), expanded to video at run time with Node built-ins or an existing direct dependency; recognition is asserted by card name, never by printing; the fixture card and `cardhashes.bin` are paired, so a hash-data rebuild re-checks the fixture
+  - the feedback test runs with no Formspree id and routes the Formspree host to fail, so no report can be sent
+  - `e2e/flows/coverage-map.json` has one row per FLOW id in `user-flows.md`: the guarding test file, its sizes, its must-fail proof and a fingerprint (hash) of the flow's PRD text — or an exemption with its reason. Exempt: FLOW-015 (backend-only combo enrichment, covered by `apps/backend/src/prompt/comboPromptIntegration.test.ts` and the Commander Spellbook prompt goldens); FLOW-020, FLOW-021, FLOW-022 (owner process flows, not player flows)
+  - a unit-tested script run by `npm run test:scripts` fails when a FLOW in `user-flows.md` has no map row, a row names a missing file, or a flow's PRD text no longer matches its fingerprint; a fingerprint update is an edit inside `e2e/flows/`
+  - beside each test file sits `flow-NNN-<slug>.md`, a plain list in player words of what the test checks and what it deliberately skips; a check added to or removed from the test changes that list in the same commit
+  - must-fail proof: before a test first merges, the feature it guards is broken on purpose, the test is seen to fail at the expected step, the break is reverted, and the break and failing step are recorded in its map row; no break is ever committed
+  - changing a flow test: a bug in a covered flow is fixed by first adding a check to that flow's file that fails on the unfixed code; new checks join the flow's existing file and bugs outside any flow get unit tests; a PR that changes a flow's PRD text updates its test and fingerprint in the same PR; the automated code-health pipeline never adds, edits or deletes a file under `e2e/flows/` and may only file an issue to the owner
+  - CI builds the frontend and backend once in a `flow-build` job and runs the suite in a `flow-tests` matrix of shards against that build; neither job gets `id-token` permission or a secret; the `deploy` job lists `flow-tests` in `needs:`, so it waits for every shard
+  - the shard count is set from measured CI time so the slowest flow shard finishes no later than the slowest other quality-check job; changing it is the matrix line only (NFR-012)
+  - every CI run uploads the HTML report — each test's player-worded steps with a screenshot at each checkpoint — as an artifact kept 7 days
+- Dependencies:
+  - NFR-012
+  - NFR-021
+  - REQ-166
+  - REQ-237
+- Notes:
+  - the 18 guarded flows, the test-case list and each test's must-fail record are in the health-flow receipt, written at close and updated on the same pull request after the owner watched a run; live walks of every flow on 2026-10-20 are folded into it at close
+  - the card fixture is one card image the owner approved for the public repo on 2026-10-20
+  - machine enforcement of "the pipeline never touches `e2e/flows/`" belongs to the merge gate in the health-pipeline package
```

### Test-case list (where the build starts; enhanced after the owner watches a run)

Every row runs at phone and desktop size unless it says otherwise. "Check"
means the test fails if this is not true. "Break" is the deliberate fault the
build uses to prove the test can fail.

| Flow | What the test does, as a player | What it checks | Break that must make it fail |
| --- | --- | --- | --- |
| FLOW-001 In-Depth: set up a game and ask | Opens In-Depth, names Player 1 "Alice" with 17 life, opens both players' extra details with one arrow, picks Stack and Battlefield, adds Lightning Bolt to the stack and Sol Ring to the battlefield, walks Context, sends with the question left blank | One arrow opens every player's details; "Player 1 (Alice)" in the player list; Continue is blocked with no zone picked; only picked zones get tabs; the blank question becomes "Resolve the stack"; the request carries Alice, 17 life, the two zones only; an answer appears under the question | Change the blank-question fallback text |
| FLOW-002 In-Depth: inspect and remove cards | Adds Sol Ring for Player 1, Sol Ring for Player 2, then Lightning Bolt to Battlefield; removes the first Sol Ring; checks the review; removes the rest; repeats with card images failing | Cards sit in add order with a count of 3; removing one copy leaves the other and the count drops; the review shows the remaining Sol Ring as Player 2's; an empty zone blocks Continue; with images failing each tile shows the card name and still removes; the card menu offers move, order, details and remove | Remove by card instead of by copy (both Sol Rings vanish) |
| FLOW-003 Failed AI request | The AI request fails with the real error shape; the player waits out the countdown and presses Retry, twice | "Miho is working on it" shows; the question and card stay; Retry counts down then resubmits; a second failure keeps everything; Retry then succeeds | Make the failure branch clear the error |
| FLOW-004 In-Depth: duplicate stack card blocked | Adds Sol Ring to an empty stack, tries Sol Ring again, then fills the stack to ten and tries an eleventh (eleventh: phone only) | The add button reads "Begin stackening!" then "Add to Stack"; the duplicate is refused with "Duplicate cards are not supported"; count stays 1; BOTTOM/TOP tags; the eleventh card is refused at 10 | Let the duplicate check pass |
| FLOW-005 Follow-up chat | Asks in In-Depth, opens View context, sends a follow-up after the full-length mock answer, sends one that fails then retries, then (with short answers) keeps going to an 11th follow-up, starts over | Question then answer in order; View context is a bottom sheet on phone and a right drawer on desktop and returns focus on close; the follow-up after a long answer works (fix 1); the 11th follow-up gets an answer (fix 6); box stops at 300 characters; Send is off while waiting; Retry resends with the same history; Start over lands on a clean Ask a Question page with the roster kept | Drop the conversation history from the request |
| FLOW-006 Scan cards into a zone | In In-Depth opens Scan on Battlefield with the fake camera showing the fixture card, reads the caution note, removes one held card, toggles mute, scans two, exits | Search and the card list hide while scanning; scan data loads; the caution shows before any card; a recognized card shows "Added <name>" and the count pill; Remove lowers the count; Exit scan adds every held card in order (fix 5) | Delete the add-every-held-card loop on exit |
| FLOW-007 Color profile | Picks each of the six colors from the Menu, picks Colorless with a custom color, reloads, switches away and back, resets to gray | Six colors in order with White as default; each pick changes the page's color profile and accent; the custom color survives reload and switching away; Reset to gray removes only the custom color; the typed question stays | Stop saving the chosen color |
| FLOW-009 Trade Balancer: build a trade | Adds Sol Ring to Side A at a chosen printing, raises quantity to 2, adds the same to Side B, adds a cheaper printing, removes one, toggles Foil on a card with no foil price, picks a foil-only printing | Each side shows a total above $0.00; quantity 2 raises the total; equal sides read "Even", unequal name the side ahead and the difference; the picker shows "N printings" (fix 8); no foil price shows $0.00 with a warning; a foil-only printing opens in Foil | Swap the foil and nonfoil price choice |
| FLOW-010 Switch tools from the Menu | Types a question, opens the Menu, picks the current tool, then Life Tracker, Trade Balancer and back; reloads on Life Tracker; opens a new tab | Menu lists the four tools, Send feedback and Theme with the current one marked; switching keeps the typed question; picking the current tool changes nothing; a reload stays on Life Tracker; a new tab opens on Ask a Question; Esc closes the Menu with focus back on ☰ | Stop remembering the last tool |
| FLOW-011 Ask a Question, with or without a card | Asks with no card; starts over; attaches Sol Ring and asks with the box empty; opens the card from the Cards strip; goes back with Edit cards; tries an empty box with no card; types 320 characters | The waiting panel replaces the form; the answer follows the question; no card means no Cards strip; an empty box with a card sends "Tell me about Sol Ring."; the strip opens the card's details; Edit cards keeps card and question; Ask is off with no card and an empty box; the box holds 300 | Drop the "Tell me about" fallback |
| FLOW-013 Life Tracker and hand-off | Sets 3 players at 25 with names Ada and Bo, taps the drawn − and + (if Q-015 keeps fix 10: the centre of each − half instead), opens counters from the counters preview, sets Bo to 0, flips day/night, adds commander damage and poison, reloads, opens In-Depth from Ask a Question, comes back, resets the game | Starting life seeds each player; taps change life; 0 shows the skull and +1 clears it; day/night flips; commander damage lowers life; everything survives reload; In-Depth gets the names, life and counters but not day/night; the tracker is unchanged on return; Reset asks first, then restores life and keeps names | Stop saving tracker state |
| FLOW-014 Send feedback | Types a question, opens Send feedback from the Menu, reads the form, opens the snapshot summary, closes with Esc, reopens, closes with ✕ | The form opens over the current screen without losing the question; three kinds with Bug lit; Send is off with the "delivery isn't configured" hint and nothing leaves the machine; the snapshot lists the typed question and screen (fix 9); after Esc and after ✕ focus is on ☰ Menu (fix 3) | Treat the build as configured (Send turns on) |
| FLOW-016 Reopen a saved conversation | Makes two saved answers and a Draft, opens Question History, reopens the first (phone: tap; desktop: reading pane then Open conversation), sends a follow-up there | History shows the Draft row and both entries newest first with their details; reopening shows the conversation and its card; the follow-up continues it; the Draft row is still there afterwards (fix 2) | Skip loading the messages on reopen |
| FLOW-017 Keep a half-typed question | Types a question and attaches a card, leaves via the Menu, comes back, reloads, replaces the text and reloads, empties everything, then chooses Draft over an open answered conversation | The Draft row appears; leaving and reloading keep the work; the newer text wins; emptying everything removes the Draft; choosing Draft over an answered conversation opens the draft (fix 4); History closes with focus back on ☰ (fix 7) | Only save the Draft when the question is non-empty |
| FLOW-018 Delete a saved conversation | Makes two answers, deletes one (phone: row Delete; desktop: reading pane Delete), cancels once, then confirms | The confirm names the entry; Keep leaves it; Delete removes it from the list and from storage; the other entry stays | Make the confirm's Delete keep the entry |
| FLOW-023 Ask about several cards | Adds Sol Ring and Rhystic Study, removes and re-adds one, asks, opens each card from the Cards strip, follows up; on phone, fills ten cards and tries an eleventh | The stage shows both cards with a pager; the request carries both cards; each strip tile opens its own card; the follow-up keeps both; an eleventh card is refused with the limit message | Send only the first card |
| FLOW-024 Card details on demand | Opens a card's details while the request is held, releases it, closes and reopens; then a card whose details request fails, and Retry; then the same from Ask a Question | The name shows at once with a loading line; the rules text, type and mana value arrive; reopening sends no second request; a failure shows the name and Retry with nothing invented; Retry fetches; the Ask a Question preview opens the same view | Skip caching the details |
| FLOW-025 Printings and prices on demand | Taps a card suggestion in Trade Balancer while its price request is held, picks a price, adds it again, adds a card whose price request fails and retries, scans a card onto Side A | The picker shows a loading line, then the printings with a set filter; a repeat add sends no second request; a failed fetch still adds the card at $0.00 with a warning and Retry; Retry fetches again; a scanned card shows "Loading price…" then a price | Skip caching prices |

- Verdict:
- Reason:

---

## NFR-021 — the browser check becomes the harness the flow tests run in

**What this decides:** whether the existing six-step browser smoke check
(`npm run smoke:browser`) retires its steps into the flow tests, keeping its
rules about how the site is built and run.

**In plain terms:** today one script builds the site, starts the server with
the pretend AI, blocks the internet, and does one basic action per tool. The
flow tests do all of that and much more, so running both would test the same
things twice, which NFR-012 forbids ("every test executes exactly once per CI
run"). This keeps every rule about how the site is built and checked — no
paid call, no secret, no internet, zero console errors — and makes the flow
tests the steps. Its description, its old six-step timings (kept, marked
historical) and its "what it does not prove" line are reworded to match. Your
local pre-PR check (`npm run quality:check`) runs the flow tests instead of
the smoke script; it gets slower by the suite's run time, which the build
measures and reports.

**What happens if you say no:** both checks run on every pull request, the
six basic actions are tested twice, and CI uses one more job.

`PRD/sections/non-functional-requirements.md`, NFR-021:

```diff
-- Title: The built site opens in a real browser and each tool does its most basic action on every pull request
+- Title: The built site opens in a real browser and every player flow is walked on every pull request
```

```diff
-- Description: Every pull request and every push to `main` proves, in a real headless browser, that the frontend the deploy ships — the output of `npm --workspace apps/frontend run build` — loads against the compiled backend and that each tool a player can open does its most basic action. A change that type-checks and passes the source-level tests but leaves the built site blank, a tool unable to load, or a request failing between the built site and the built server, fails before merge and never deploys. Before this, a pull request compiled the production bundle (`npm run typecheck` and the REQ-198 build test) but nothing ever opened it: the frontend tests run source files in jsdom with every tool preloaded and every network call stubbed.
+- Description: Every pull request and every push to `main` proves, in a real headless browser, that the frontend the deploy ships — the output of `npm --workspace apps/frontend run build` — loads against the compiled backend and that every player flow works end to end (NFR-022's flow tests). A change that type-checks and passes the source-level tests but leaves the built site blank, a tool unable to load, a player flow broken, or a request failing between the built site and the built server, fails before merge and never deploys. Before this, a pull request compiled the production bundle (`npm run typecheck` and the REQ-198 build test) but nothing ever opened it: the frontend tests run source files in jsdom with every tool preloaded and every network call stubbed.
```

```diff
-  - the check is the committed command `npm run smoke:browser` (`node scripts/smoke-browser.mjs`); it picks two free local ports, builds the frontend with `npm --workspace apps/frontend run build` into its own gitignored output folder under `.tmp/browser-smoke/` (never `apps/frontend/dist/`), builds the backend with `npm --workspace apps/backend run build`, starts `node apps/backend/dist/index.js`, serves the built frontend with `vite preview`, and drives it with the `playwright` library in headless Google Chrome
+  - the check is the committed command `npm run test:flows`, which runs NFR-022's flow tests with `@playwright/test`; it picks free local ports, builds the frontend with `npm --workspace apps/frontend run build` into its own gitignored output folder under `.tmp/` (never `apps/frontend/dist/`), builds the backend with `npm --workspace apps/backend run build`, starts `node apps/backend/dist/index.js`, serves the built frontend with `vite preview`, and drives it in headless Google Chrome; in CI the build runs once and every shard reuses it (NFR-022)
```

```diff
-  - at a phone viewport (390 × 844) and a desktop viewport (1280 × 800), each in a fresh browser context with empty storage, the check: (1) opens `/`, lands on Ask a Question, sends a typed question and sees an answer in the conversation; (2) opens the ☰ Menu, chooses Life Tracker, lands on `/life-tracker`, taps "Decrease life for Player 1" and sees Player 1 at 39; (3) opens `/trade-balancer` directly, adds Sol Ring to Side A through search, picks a printing price, and sees a Side A total above $0.00; (4) opens `/in-depth` directly, walks game, zones, cards (Sol Ring on the battlefield) and context, presses "Decrypt Stack" and sees an answer; (5) from Ask a Question opens the scanner and sees `/data/cardhashes.bin` and `/data/cardScanMap.json` load; (6) opens "Send feedback" from the Menu and sees the form, without sending
+  - the steps are NFR-022's flow tests, at 390 × 844 and 1280 × 800, each in a fresh browser context with empty storage; the six basic actions this check first proved are steps inside them: ask a question and see an answer (FLOW-011), tap minus in Life Tracker (FLOW-013), price a Sol Ring in Trade Balancer (FLOW-009), walk In-Depth to an answer (FLOW-001), load the scanner's data (FLOW-006), open Send feedback without sending (FLOW-014)
```

```diff
-  - the scanner runs with Chrome's fake camera (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) and must not show "Camera unavailable"; card recognition is never asserted. If the runner's Chrome cannot start the fake camera, that one assertion is dropped and the rest of step 5 stays
+  - the scanner runs with Chrome's fake camera (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) and must not show "Camera unavailable"; recognition is asserted only for NFR-022's committed fixture card, by name
```

```diff
-  - it passes only when every step finishes within 15 seconds, with zero browser console errors, zero uncaught page errors, and no request to either local server failing or answering 400 or above; there are no automatic retries
+  - it passes only when every test finishes within its timeout (set by the build from measured times), with zero browser console errors, zero uncaught page errors, and no request to either local server failing or answering 400 or above unless the test itself routes that request to fail; there are no automatic retries
```

```diff
-  - on failure it prints the failing step, the console messages, the failed requests and both servers' output, and saves a screenshot under `.tmp/browser-smoke/`; in every case it closes the browser and stops both servers
+  - on failure it reports the failing test and step, the console messages, the failed requests and both servers' output, with a screenshot, in the HTML report under `.tmp/`; in every case it closes the browser and stops both servers
```

```diff
-  - `npm run smoke:browser` is part of `npm run quality:check`, so the canonical local pre-PR command and CI stay equivalent (NFR-012); locally it needs Google Chrome installed
-  - CI runs it in its own `browser-smoke` job in `.github/workflows/quality-check.yml` on every pull request and every push to `main`, with no path filter (REQ-166's no-trigger-filter rule), on Node 24 (the version the deploy builds the frontend with), using the runner's preinstalled Google Chrome so no browser is downloaded; on failure the job uploads `.tmp/browser-smoke/` as an artifact kept 7 days; the `deploy` job lists `browser-smoke` in `needs:`
-  - the `browser-smoke` job gets no `id-token` permission and no secret; only `deploy` may assume AWS credentials (DEC-084)
-  - `playwright` is a root dev dependency pinned to an exact version; it has no install script, so `npm ci` downloads no browser
+  - `npm run test:flows` is part of `npm run quality:check`, so the canonical local pre-PR command and CI stay equivalent (NFR-012); locally it needs Google Chrome installed
+  - CI runs it in the `flow-build` and `flow-tests` jobs in `.github/workflows/quality-check.yml` on every pull request and every push to `main`, with no path filter (REQ-166's no-trigger-filter rule), on Node 24 (the version the deploy builds the frontend with), using the runner's preinstalled Google Chrome so no browser is downloaded; every run uploads the HTML report as an artifact kept 7 days; the `deploy` job lists `flow-tests` in `needs:`, so it waits for every shard
+  - the `flow-build` and `flow-tests` jobs get no `id-token` permission and no secret; only `deploy` may assume AWS credentials (DEC-084)
+  - `playwright` and `@playwright/test` are root dev dependencies pinned to the same exact version; neither has an install script, so `npm ci` downloads no browser
```

The constraint "its pass/fail rules (request classification, console filtering, port picking) are unit-tested under `scripts/` and run by `npm run test:scripts`" stays as it is, because those rules stay under `scripts/` (`DESIGN-BRIEF.md`, section 4).

NFR-021 Notes:

```diff
-  - measured 2026-10-18 on macOS arm64 (`PRD/work/browser-smoke-suite/evidence/measurements.md`, folded into the receipt at close): frontend build 3.7–4.8 s, backend build 1.1 s, first paint 164 ms; every step passed by hand in Chrome 155 at both widths with zero console errors. CI time on the x86 runner was estimated at about one minute, in parallel with the frontend shards
+  - historical, for the six-step smoke check this requirement first shipped (retired into NFR-022's flow tests): measured 2026-10-18 on macOS arm64 (`PRD/work/browser-smoke-suite/evidence/measurements.md`, folded into the receipt at close): frontend build 3.7–4.8 s, backend build 1.1 s, first paint 164 ms; every step passed by hand in Chrome 155 at both widths with zero console errors. CI time on the x86 runner was estimated at about one minute, in parallel with the frontend shards. The flow suite's own times are recorded under NFR-012 by the build that adds it
```

```diff
-  - what it does not prove: production hosting (S3, CloudFront, domain, headers), the Lambda wrapper, the real AI, camera recognition, exact layout, or speed
+  - what it does not prove: production hosting (S3, CloudFront, domain, headers), the Lambda wrapper, the real AI, camera recognition beyond NFR-022's one fixture card, exact layout, or speed
```

`PRD/sections/system-map.md`, Deploy and cost guardrails:

```diff
-and the browser smoke check, which opens the built site in headless Chrome against the built backend on every pull request and requires each tool's most basic action to work —
+and the flow tests, which open the built site in headless Chrome against the built backend on every pull request and walk every player flow (NFR-022) —
```

```diff
-- Lives in: `.github/workflows/quality-check.yml` (`built-server`, `browser-smoke`, `changes` and `deploy` jobs), `scripts/smoke-built-server.mjs`, `scripts/smoke-browser.mjs`, `scripts/aws-bootstrap.sh`
-- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, NFR-020, NFR-021
+- Lives in: `.github/workflows/quality-check.yml` (`built-server`, `flow-build`, `flow-tests`, `changes` and `deploy` jobs), `scripts/smoke-built-server.mjs`, `e2e/flows/`, `scripts/aws-bootstrap.sh`
+- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, NFR-020, NFR-021, NFR-022
```

`PRD/instructions/runtime-process-hygiene.md`:

```diff
-of its own. The one browser check CI runs is NFR-021's smoke check
-(`npm run smoke:browser`), which proves each tool opens and does its most
-basic action in the built site; it does not replace the slice-level browser
-scenarios this policy requires, and they do not replace it.
+of its own. The browser check CI runs is NFR-022's flow suite
+(`npm run test:flows`), which walks every player flow in the built site; it
+does not replace the slice-level browser scenarios this policy requires, and
+they do not replace it. A slice that changes a flow also updates that flow's
+test (NFR-022).
```

- Verdict:
- Reason:

---

## NFR-012 — CI speed rule covers the flow-test shards

**What this decides:** whether the CI speed rule you already use for the unit
tests (split into parallel jobs, about 2 minutes total) also governs the flow
tests.

**In plain terms:** NFR-012 keeps the pull-request check near 2 minutes by
splitting the frontend unit tests into 3 parallel jobs and says when to add
one. This adds the same rule for the flow tests: they run in parallel with
everything else, and when they become the slowest job, add a shard. It also
updates the job count and the job names in its cost note, which still names
the retired smoke job (the repo is public, so CI minutes are free; the limit
is 20 jobs at once).

**What happens if you say no:** the flow tests get no speed rule and may
lengthen every pull-request check as flows are added.

`PRD/sections/non-functional-requirements.md`, NFR-012 Notes:

```diff
-  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 8 this workflow uses on a pull request (the seventh is NFR-020's `built-server` job, the eighth NFR-021's `browser-smoke` job). Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2, plus about one minute each for `built-server` and `browser-smoke` — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
+  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 7 this workflow uses on a pull request before flow tests (the seventh is NFR-020's `built-server` job) plus NFR-022's `flow-build` job and one job per `flow-tests` shard. Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2, plus at least one minute each for `built-server`, `flow-build` and every `flow-tests` shard — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
```

```diff
   - splitting an oversized test file remains an assertion- and case-count-preserving refactor; under DEC-155 it also lowers the slowest-shard floor, since a single long file bounds how much sharding can help
+  - flow-test shards (NFR-022) follow the same lever: the build job runs once and each shard reuses it, so a shard's fixed cost is its own setup only; when the slowest flow shard becomes the slowest quality-check job, add a shard (one matrix line). The suite is bounded at one file per player flow, so it grows only when a flow is added. Measured shard times are recorded here by the build that adds the suite
```

- Verdict:
- Reason:

---

## REQ-166 — the quality-check job list names the flow-test jobs

**What this decides:** whether the list of checks that still run on a
docs-only merge to `main` names the new flow-test jobs instead of the retired
smoke job.

**In plain terms:** REQ-166 says a docs-only merge skips the deploy but still
runs every check, so `main` always shows a green or red signal. Its list of
those checks changes from the old smoke job to the two flow-test jobs.

**What happens if you say no:** REQ-166 names a job that no longer exists.

`PRD/sections/functional-requirements.md`, REQ-166:

```diff
-  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`, `built-server`, `browser-smoke`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
+  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`, `built-server`, `flow-build`, `flow-tests`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
```

- Verdict:
- Reason:

---

## FLOW-008 — delete the retired "layout density" flow

**What this decides:** whether to delete the leftover entry for a flow that
no longer exists.

**In plain terms:** FLOW-008 was "choose and persist layout density". It was
retired when the app started adapting to screen size on its own (REQ-096:
responsive layout is automatic, no setting). Its entry is a two-line stub
saying so. This deletes it, as FLOW-019 was deleted before, and rewords the
two lines that mention it. The number is never reused; the next new flow is
FLOW-026.

**What happens if you say no:** the stub stays, and the coverage map lists it
as exempt.

`PRD/sections/user-flows.md`:

```diff
-### FLOW-008
-- Name: Retired — choose and persist layout density
-- Retired by DEC-117 / REQ-096. Responsive presentation is automatic and requires no replacement user flow.
-
 ### FLOW-009
```

```diff
-  - palette selection follows FLOW-007; layout density FLOW-008 is retired and responsive presentation is automatic (DEC-117 / REQ-096)
+  - palette selection follows FLOW-007; there is no layout-density choice — responsive presentation is automatic (DEC-117 / REQ-096)
```

`PRD/sections/functional-requirements.md`, REQ-096:

```diff
-  - supersedes REQ-055; FLOW-008 is retired rather than replaced by a user flow because automatic presentation requires no user action
+  - supersedes REQ-055; the former layout-density flow was removed rather than replaced because automatic presentation requires no user action
```

- Verdict:
- Reason:

---

## FLOW-012 — delete the merged "rules lookup" flow

**What this decides:** whether to delete the leftover entry for a flow that
was folded into another.

**In plain terms:** FLOW-012 was "look up a rules concept and ask". It was
merged into FLOW-011 (Ask a Question) when Card Lookup and Rules Lookup became
one screen. Its entry is a stub pointing at FLOW-011. This deletes it and
rewords FLOW-011's note that points back at it.

**What happens if you say no:** the stub stays, and the coverage map lists it
as exempt.

`PRD/sections/user-flows.md`:

```diff
-  - during quick-lookup refinement this flow was rewritten to merge the prior separate Card Lookup flow (this ID) and Rules Lookup flow (former FLOW-012) into one; see FLOW-012
+  - during quick-lookup refinement this flow was rewritten to merge the prior separate Card Lookup flow (this ID) and Rules Lookup flow into one (DEC-107)
```

```diff
-### FLOW-012
-- Name: Look up a rules concept and ask a question
-- Merged into FLOW-011 (Look up a card or ask a rules question in Quick Lookup) during quick-lookup refinement, which unified Card Lookup and Rules Lookup into one feature-portal destination (DEC-107). See FLOW-011.
-
 ### FLOW-013
```

- Verdict:
- Reason:

---

## REQ-027 — follow-up history fits the server's limits

**What this decides:** whether the app trims a conversation's history to fit
the server's limits before sending a follow-up — fixing two failures players
can hit — and whether the PRD's wrong numbers get corrected.

**In plain terms:** when a player asks a follow-up, the app sends the earlier
questions and answers too. The server rejects any single message over 10,000
characters and any history over 20 messages. The app trims neither, so a
follow-up after a very long answer fails, and the 11th follow-up in any
conversation fails (with the real AI too). The fix: before sending, cut any
message over 10,000 characters, and when the history would pass 20 messages,
drop the oldest exchanges but keep the opening question and its answer —
the server picks the rules from the opening question (REQ-246). The screen
and saved history keep everything. The PRD today says 2,000 per message and,
in one place, 6,000 total; the code says 10,000 per message and 1,000,000
total. This makes the PRD say what the code does.

**What happens if you say no:** both follow-up failures stay, and the PRD
keeps three conflicting numbers.

`PRD/sections/functional-requirements.md`, REQ-027:

```diff
-  - backend validates `conversationHistory` when present: non-empty array, max 20 turns, max 2000 chars/message, alternating user/assistant roles starting with user, last entry must be assistant
+  - backend validates `conversationHistory` when present: non-empty array, max 20 messages, max 10,000 chars/message, alternating user/assistant roles starting with user, last entry must be assistant
+  - the client sends history that always passes that validation: a message over 10,000 characters is cut to fit with a short truncation marker, and when history would pass 20 messages the oldest exchanges are dropped while the opening question and its answer are kept (the backend chooses rules from the opening question, REQ-246); the thread on screen and the saved conversation keep every message in full; both caps are defined once in the backend and imported by the client, never copied
```

`PRD/sections/integrations-and-data.md`:

```diff
-- max 20 turns
-- max 2000 chars per message
+- max 20 messages
+- max 10,000 chars per message (the client trims to fit before sending, REQ-027)
```

`PRD/sections/in-depth/README.md`:

```diff
-  ≤20 turns, ≤2000 chars/message, strictly alternating user/assistant starting
+  ≤20 messages, ≤10,000 chars/message (the client trims to fit, REQ-027), strictly alternating user/assistant starting
```

```diff
-- `conversationHistory` validation: 1–20 turns, ≤2000 chars/message, alternating
+- `conversationHistory` validation: 1–20 messages, ≤10,000 chars/message, alternating
```

```diff
-- `MAX_CONVERSATION_HISTORY_CHARS`: **ambiguous / flagged.** REQ-027 sets it to
-  `EFFECTIVELY_UNLIMITED_CHARS` = 1,000,000 (DEC-042 amendment, "revisit after
-  latency/cost sampling"); FLOW-005's edge case still reads `6000`, oldest turns
-  truncated first. The two cited sources disagree; per this file's precedence
-  marker the reader should confirm the live constant against
-  `apps/backend/src/**` rather than trust either number. (REQ-027, FLOW-005,
-  DEC-042)
+- `MAX_CONVERSATION_HISTORY_CHARS`: `EFFECTIVELY_UNLIMITED_CHARS` = 1,000,000
+  (DEC-042 amendment, "revisit after latency/cost sampling"), oldest turns
+  truncated first; the per-message and message-count caps are enforced by the
+  client trim before this budget applies. (REQ-027, FLOW-005, DEC-042)
```

`PRD/sections/user-flows.md`, FLOW-005:

```diff
-  - if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled
+  - history always fits the server's limits: a message over 10,000 characters is cut, and past 20 messages the oldest exchanges are dropped while the opening question and its answer are kept; the thread on screen keeps everything (REQ-027); a total over `MAX_CONVERSATION_HISTORY_CHARS` (1,000,000, effectively unlimited) is truncated oldest-first before the prompt is assembled
```

- Verdict:
- Reason:

---

## FLOW-017 — choosing Draft over an answered conversation opens the draft

**What this decides:** what happens when a player picks the Draft row in
Question History while reading an answered conversation. You decided in the
session: it opens the draft.

**In plain terms:** today the sheet closes and the answered conversation stays
on screen, so nothing seems to happen. After this, the app leaves the answered
conversation, the way ✎ Edit cards does, and shows the draft ready to send.
The conversation is already saved in History, so nothing is lost. In-Depth
behaves the same way, since the two flows must match (DEC-138).

**What happens if you say no:** the PRD stays silent on this case and the
current do-nothing behavior stays.

`PRD/sections/user-flows.md`, FLOW-017:

```diff
-  5. Selecting Draft restores that flow's mid-flight staged state so the user can continue toward submit — switching destination first when the Draft belongs to the other flow, then re-hydrating from storage immediately rather than waiting for a future mount (the owning flow is already mounted-but-hidden when the player started on it).
+  5. Selecting Draft restores that flow's mid-flight staged state so the user can continue toward submit — switching destination first when the Draft belongs to the other flow, then re-hydrating from storage immediately rather than waiting for a future mount (the owning flow is already mounted-but-hidden when the player started on it). When an answered conversation is on screen, the flow leaves it first, as ✎ Edit cards / Edit does — it is already saved in Question History — so the Draft shows ready to send.
```

- Verdict:
- Reason:

---

## REQ-206 — the answer screen shows a Cards strip

**What this decides:** whether the PRD describes Ask a Question's answer
screen as it was built — a strip of card tiles — instead of one "N cards"
button. You chose to update the spec.

**In plain terms:** the spec says the answer screen has one small button
naming the card (or "2 cards") that opens a bottom sheet on a phone or a side
drawer on a desktop. The app instead shows a "Cards" strip under the title,
one small tile per card, and a tap opens that card's details. It was built
that way on purpose to match the design mockup, and two other requirements
already call it "the strip": Question History reopens an Ask a Question
conversation "with its cards in the strip" (REQ-213), and In-Depth's answered
chat is "the shared workspace with the Cards strip" (REQ-209). In-Depth's
context button is unchanged.

**What happens if you say no:** the spec and the app keep disagreeing, and
the flow test cannot check either one.

`PRD/sections/functional-requirements.md`, REQ-206:

```diff
-  - the answered view keeps the existing frozen-card trigger (naming the single card or the count, "N cards") opening the frozen set's read-only presentation; a card name in the judge's message that exactly matches a card attached to this conversation renders as a tappable chip (an accent-tinted, underlined inline control) that opens that card's detail directly in the thread
+  - the answered view shows a **Cards** strip under the title with one small tile per frozen card (accessible name `View <card name>`); a tile opens that card's read-only detail in the shared card-detail view; a card name in the judge's message that exactly matches a card attached to this conversation renders as a tappable chip (an accent-tinted, underlined inline control) that opens that card's detail directly in the thread
```

REQ-075:

```diff
-  - when any card is frozen, a compact trigger naming the card or stating the count (`"N cards"`) opens the frozen set's read-only card presentation in a bottom sheet below `768px` or right-side drawer at `768px+`; without a card, no empty context trigger or container is rendered; a card name in the judge's message that exactly matches an attached card renders as a tappable chip opening that card's detail directly in the thread (REQ-206)
+  - when any card is frozen, a Cards strip under the title shows one tile per frozen card, each opening that card's read-only detail; without a card, no empty strip or container is rendered; a card name in the judge's message that exactly matches an attached card renders as a tappable chip opening that card's detail directly in the thread (REQ-206)
```

REQ-097:

```diff
-  - Quick Question with an attached frozen card renders a compact trigger naming that card and opens the existing read-only card presentation; a no-card conversation renders no empty context trigger or container
+  - Quick Question with frozen cards renders a Cards strip, one tile per card, each opening that card's read-only detail (REQ-206); a no-card conversation renders no empty strip or container
```

`PRD/sections/quick-lookup/README.md`:

```diff
-- Built: when one or more cards were attached, every one of them is frozen for
-  the conversation and shown behind a compact adaptive context trigger — a
-  bottom sheet below 768px or a right-side drawer at 768px+; the trigger label
-  names the single card or states the count (`"N cards"`) for several. A card
+- Built: when one or more cards were attached, every one of them is frozen for
+  the conversation and shown in a Cards strip under the title — one small tile
+  per card (`View <card name>`), each opening that card's read-only detail. A card
   name in the judge's message that exactly matches an attached card renders as
   a tappable chip opening that card's detail directly in the thread. Without a
-  card, no empty context trigger or container renders. **✎ Edit cards** (beside
+  card, no empty strip or container renders. **✎ Edit cards** (beside
```

`PRD/sections/user-flows.md`, FLOW-011 step 8:

```diff
-When any card was attached, a compact card-context trigger opens its read-only presentation (naming the single card or the count, "N cards") in a mobile bottom sheet or desktop right drawer; a card name in the answer that matches an attached card renders as a tappable chip opening that card's detail (REQ-206); without a card, no context trigger renders.
+When any card was attached, a Cards strip under the title shows one tile per card, each opening that card's read-only detail; a card name in the answer that matches an attached card renders as a tappable chip opening that card's detail (REQ-206); without a card, no strip renders.
```

`PRD/sections/system-map.md`, Quick Lookup:

```diff
-(when a card is attached) an adaptive read-only card-context trigger/overlay.
+(when a card is attached) a Cards strip whose tiles open each card's read-only detail.
```

- Verdict:
- Reason:

---

## REQ-058 — In-Depth card tiles keep their direct ✕ Remove

**What this decides:** whether to fix one In-Depth spec sentence that says
the card menu replaced the tile's ✕ Remove. You chose to update the spec.

**In plain terms:** each card tile in In-Depth has a ✕ to remove it straight
away, and a tap opens a menu that also has Remove. The app, REQ-058 ("retaining
Remove") and FLOW-002 all keep the ✕. One sentence in the In-Depth spec says
the menu replaced it. This corrects that sentence.

**What happens if you say no:** the one sentence keeps contradicting the app
and two other requirements.

`PRD/sections/in-depth/README.md`:

```diff
-  with no row cap (REQ-056); each tile's **Card actions** button opens a menu
-  (Move to another zone, reorder, Card details, Remove — REQ-209) in place of a
-  direct Remove button, and the card image sizes to the tile interior. Non-stack
+  with no row cap (REQ-056); each tile's **Card actions** button opens a menu
+  (Move to another zone, reorder, Card details, Remove — REQ-209) alongside the
+  tile's direct ✕ Remove (REQ-058), and the card image sizes to the tile interior. Non-stack
```

- Verdict:
- Reason:

---

## FLOW-005 — follow-up chat mentions ✎ Edit

**What this decides:** whether FLOW-005 mentions the ✎ Edit button that
already sits beside View context.

**In plain terms:** after an In-Depth answer, ✎ Edit takes the player back to
the review with everything kept; the conversation is already saved. REQ-209
and the In-Depth spec describe it; the flow does not. This adds one line.

**What happens if you say no:** the flow omits a control the app and spec have.

`PRD/sections/user-flows.md`, FLOW-005:

```diff
   - start over is not available while a request is in flight
+  - once a ruling exists, **✎ Edit** beside View Context returns to the review with the game context, every card's details and the question kept; the answered conversation is already saved to Question History and the next send starts a new conversation (REQ-209)
```

- Verdict:
- Reason:

---

## FLOW-006 — scanning: camera failure and held-card rows

**What this decides:** whether FLOW-006 describes the camera-failure path and
the held-card list as built.

**In plain terms:** when the camera can't start, the scanner shows "Camera
unavailable" and the player leaves with Exit scan to type a search (REQ-053,
REQ-071); the flow says it falls back to search on its own. And held cards
show as thumbnails you tap for details; the flow describes an older corner
button. This updates both.

**What happens if you say no:** the flow keeps describing behavior the app
and its spec no longer have.

`PRD/sections/user-flows.md`, FLOW-006:

```diff
-  - if camera permission is denied or unavailable, fall back to manual search and surface the reason
+  - if camera permission is denied or unavailable, the scanner shows the reason (`Camera unavailable`) and manual search stays available through **Exit scan** (REQ-053, REQ-071)
```

```diff
-Its viewport-capped 320px panel lists each held card with the shared container-relative image + corner detail popup presentation and a persistent Remove control
+Its viewport-capped 320px panel lists each held card as a thumbnail with its name and a persistent Remove control
```

```diff
-An available uncropped image grows to its list-row width (DEC-160) without displacing the camera chrome; the corner control opens a popup whose descriptive fields
+The thumbnail never displaces the camera chrome; a tap on it opens the shared card detail popup (the entry has no corner-detail overlay), whose descriptive fields
```

- Verdict:
- Reason:

---

## FLOW-007 — color profiles change the background wash

**What this decides:** whether FLOW-007 says a color profile changes the
background's color wash, as REQ-200 says, rather than "the flat ground".

**In plain terms:** picking a color repaints the glow over the background;
the dark base underneath stays the same in all six. REQ-200 already says
"visibly changes the background wash". One phrase changes.

**What happens if you say no:** the flow promises a base-color change the app
does not make.

`PRD/sections/user-flows.md`, FLOW-007:

```diff
-applies the selected profile to the whole surface — the flat ground,
+applies the selected profile to the whole surface — the colour wash over the flat ground,
```

- Verdict:
- Reason:

---

## FLOW-010 — Question History opens as a sheet

**What this decides:** whether FLOW-010 says Question History opens over the
current screen rather than switching tools, as REQ-213 says.

**In plain terms:** in the ☰ Menu, Question History is listed with the tools,
but choosing it opens a sheet over whatever you were doing; the address and
tool don't change. One clause is added.

**What happens if you say no:** the flow implies History is a separate tool.

`PRD/sections/user-flows.md`, FLOW-010:

```diff
-lists **Ask a Question** (current also while In-depth details is open), **Question History**, **Life Tracker**
+lists **Ask a Question** (current also while In-depth details is open), **Question History** (which opens its sheet over the current screen rather than switching destination, REQ-213), **Life Tracker**
```

- Verdict:
- Reason:

---

## FLOW-013 — reset asks first

**What this decides:** whether FLOW-013 says Reset and New Game ask for
confirmation first, as the Life Tracker spec says.

**In plain terms:** both show a Keep / Reset confirm before wiping the game
(the shared confirm sheet, REQ-208). The flow says they just reset. One clause
is added.

**What happens if you say no:** the flow omits the confirm the app shows.

`PRD/sections/user-flows.md`, FLOW-013:

```diff
-an explicit reset / New Game returns counters to starting values
+an explicit reset / New Game, after a confirm in the shared confirm sheet (REQ-208), returns counters to starting values
```

- Verdict:
- Reason:

---

## FLOW-023 — asking about several cards, as built

**What this decides:** whether FLOW-023 describes how a player opens Ask a
Question and adds cards today.

**In plain terms:** the flow still says "Quick Question from the feature
portal", an attach control above the question, and cards "previewed then
added". Today the player opens Ask a Question from the ☰ Menu, sees Add card
and Scan beside the title, and a picked card goes straight onto the stage
(REQ-206, REQ-214). Three phrases change.

**What happens if you say no:** the flow keeps describing the old screen.

`PRD/sections/user-flows.md`, FLOW-023:

```diff
-  1. User opens Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
+  1. User opens **Ask a Question** from the Menu (REQ-206); the app switches to the question page (frontend-only, no reload).
```

```diff
-the card-attach control — now able to hold more than one card — then the Question field
+the title with **Add card** and **Scan** beside it, the card stage when any card is attached, then the two-row question box
```

```diff
-each resolves to one oracle-level card, previewed then added, and each can be removed
+each resolves to one oracle-level card placed on the stage at once (a scanned card joins when the scanner closes, REQ-214), and each can be removed
```

- Verdict:
- Reason:

---

## FLOW-024 — the card-detail popup shows a price

**What this decides:** whether FLOW-024 mentions the Price chip the card
detail popup already shows.

**In plain terms:** opening a card's details also shows one price (for
example "$1.19"), fetched from the same price service Trade Balancer uses.
It was added on purpose to match the design, but no spec mentions it. This
adds one sentence so the flow test may check it is there. Saying no leaves it
unmentioned and untested; it does not remove it.

**What happens if you say no:** the chip stays in the app but outside the
spec, and the flow test ignores it.

`PRD/sections/user-flows.md`, FLOW-024 step 3:

```diff
-  3. On success the popup/preview shows the descriptive block (oracle text, type line, mana cost/value, colors, sub/supertypes), identical to today's content.
+  3. On success the popup/preview shows the descriptive block (oracle text, type line, mana cost/value, colors, sub/supertypes), identical to today's content. A Price chip beside them shows one representative USD price, read from the same per-card price route Trade Balancer uses (`GET /api/cards/:oracleId/prices`, FLOW-025).
```

- Verdict:
- Reason:

---

## Blocker questions

### Q-015 — drop Life Tracker fix 10, because the spec says the counters preview takes its own taps?

**What this decides:** whether the build changes the Life Tracker so that a
tap in the middle of a player's "−" half always lowers life, or leaves the
Life Tracker as it is, where the small counters preview sitting in that half
opens counters when tapped.

**In plain terms:** each life card is split into two invisible halves: a tap
anywhere in the "−" half loses a life, anywhere in the "+" half gains one.
Three controls sit on top and take their own taps: the life number, the
counters preview (the little seat map of commander damage) and the life
input. The spec says exactly this: the halves cover "the whole card except
its three interactive controls", and those controls "still take their own
taps" (REQ-217, the rule that puts "−" on the edge nearest each player, and
the Life Tracker spec). Thin edge strips were tried before and rejected for
these whole-card halves (DEC-136). In the default four-player layout the
counters preview sits on the player's side of the life number, inside the
"−" half. The browser smoke check tapped the exact centre of Player 1's "−"
half on a phone, hit the counters preview, and opened counters. Open docs PR
#341 parked that as a bug, and this package listed it as fix 10. A player who
taps the drawn "−" near the edge, or any empty part of that half, loses a life
today.

**Recommendation:** accept — drop fix 10. Today's behavior is what the spec
asks for; a player's thumb aims at the drawn "−", not the middle of an
invisible half; and the "miss" came from a test tapping a geometric centre
where a visible control sits. The FLOW-013 test then taps the drawn "−" and
"+" and checks that the counters preview opens counters. PR #341's item 1 can
be closed as working as specified. The fix list becomes nine.

**What happens if you say no:** fix 10 stays. The build moves the counters
preview so no seat's "−" half has it at its centre (for example beside the
life number rather than below it; moving it into the "+" half would only move
the problem there), takes the before/after Life Tracker screenshot pair the
Life Tracker requires for any visible change (REQ-202), and proves it with a
browser check: at phone size, the element at the centre of each seat's "−"
half is the "−" button (`elementFromPoint`, inside the FLOW-013 test). It
changes how every life card looks.

**Why it meets the genuine-blocker test (all three):** (1) the answers differ
in what a player's tap does on every life card and in how every card looks;
(2) the PRD (REQ-217, the Life Tracker spec, DEC-136) says today's behavior is
right, while the package you approved lists it as a bug, so the two
authorities disagree and no tested behavior or code pattern settles it;
(3) building either version silently decides the other.

Evidence: `evidence/bug-diagnosis.md`, bug 10; the PR #341 text is copied in
`evidence/browser-smoke-followups-pr341.md`.

Answer `accept` to drop fix 10 (recommended) or `reject` to keep it.

- Verdict:
- Reason:
