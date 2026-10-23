# Design brief — health-flow

Refined with the owner in direct mode on 2026-10-20. Part 1 of the
self-healing idea in `IDEA.md`; Part 2 (the finder → triage → builder →
reviewer pipeline and the merge gate) was split out to
`PRD/work/health-pipeline/` and waits on this package.

## What it means for a player

Nothing a player does changes. Nine things that are broken today get fixed
(listed below; a tenth waits on blocker question Q-015), and from then on every player flow is walked in a real
browser on every pull request. A change that breaks something a player relies
on fails before it can merge or deploy.

For the owner: the project gains a frozen behavior baseline. Unit and
component tests (about 280 files) may change as code is rewritten; the new
flow tests may not. A failing flow test is the sign something broke. That is
the trust Part 2 needs before any fix may merge without the owner.

## Owner decisions (2026-10-20, this session)

1. **Coverage first, then auto-merge.** Nothing merges on its own until every
   player flow has a browser test. Part 2 builds no code fixes until this
   package has merged.
2. **The flow tests are Playwright tests that walk PRD user flows**, because
   unit tests change with rewrites but a flow should stay intact. Each test
   checks the outcome the PRD states, at phone and desktop sizes, with the
   mock AI. No screenshot comparisons.
3. **Frozen layer.** Only the flow tests are frozen; unit tests stay editable.
   The automated pipeline (Part 2) may never touch a flow test. The owner, or
   a feature or bug-fix PR the owner merges, may.
4. **Grow tests without bloat.** A coverage map names the test guarding each
   flow; one test file per flow; every test proves it can fail.
5. **Owner reviews the tests by watching them run, then they are enhanced
   (changed 2026-10-22).** One gameplan: fix the bugs, build the tests from
   the test-case list in `GATE-QUESTIONS.md` (NFR-022 appendix, a starting
   point, not a pre-approved list) and open the code PR; before merging it,
   the owner watches a run in Playwright UI mode, a viewer that plays each
   test step by step with a screenshot at each step. Beside each test sits a plain list of what it
   checks and what it skips, so a gap shows as a missing line. The owner's
   misses are added, each with its must-fail proof, before the tests freeze.
   They freeze when the code PR merges. The owner's own use-case list
   (`intake/owner-use-cases.md`) is optional input to the same round.
6. **Clean up retired flows.** Delete the FLOW-008 and FLOW-012 stubs, as
   FLOW-019 was. Their numbers are never reused.
7. **Fix the bugs found in the flows before they freeze**, so the tests check
   PRD behavior rather than today's bugs. Seven bugs plus two app-versus-spec
   fixes (below). *Count note, 2026-10-22:* the table in section 5 lists ten —
   those nine plus fix 10, the Life Tracker tap parked in open docs PR #341,
   which this package took in because it sits in FLOW-013. The spec says fix 10
   is not a bug, so it waits on blocker question Q-015 in `GATE-QUESTIONS.md`
   (recommended: drop it, leaving nine).
8. **Choosing "Draft" in Question History while an answered conversation is
   open opens the draft.** The answered conversation is already saved.
9. **One card image may be committed** so the fake camera can show the
   scanner a real card.
10. **The four places the app and its spec disagree:** amend the spec for the
    Ask a Question "Cards" strip and for In-Depth's direct ✕ Remove; fix the
    app for the missing "N printings" heading and for Ask a Question's
    feedback snapshot.
11. **Settled from the PRD, owner agreed:** stale flow text is corrected where
    the feature spec matches the live app (feature specs outrank
    `user-flows.md`); the six browser smoke steps fold into the flow tests
    because NFR-012 already says every check runs once per CI run.
12. **CI and sharding.** The flow tests run in GitHub Actions on every pull
    request, sharded like the frontend unit tests (NFR-012) so the check adds
    no wall time.

## What exists today (checked 2026-10-20)

- `user-flows.md` holds 24 flow entries. FLOW-008 is a retired stub, FLOW-012
  a merged stub, FLOW-019 already deleted. FLOW-020–022 are owner process
  flows. FLOW-015 is backend combo enrichment. That leaves **18 player flows**
  for the browser suite: 001, 002, 003, 004, 005, 006, 007, 009, 010, 011, 013,
  014, 016, 017, 018, 023, 024, 025.
- 5 of 24 flows and 125 of 242 requirements are named in any test file today.
- NFR-021's browser smoke check (`npm run smoke:browser`,
  `scripts/smoke-browser.mjs`) already builds the production frontend, starts
  the compiled backend with the mock AI, stubs card images, blocks the
  internet, and does one basic action per tool at both sizes in headless
  Chrome. It runs in the `browser-smoke` CI job and in `quality:check`. Its
  harness is the base for this package.
- `playwright` 1.63.0 is a root dev dependency, but the main checkout's
  `node_modules` lacks it (no `npm ci` since #340). The owner should run
  `npm ci` before the build; the build worktree installs its own.
- Frontend tests already import from `apps/backend/src/`
  (`apps/frontend/src/lib/sharedContractLists.test.ts` imports `constants.js`
  and `validation/askAiRequest.js`); no runtime frontend code does yet.
  `apps/backend/src/constants.ts` has only a type import, so exporting the two
  history caps from it and importing them in the client keeps each cap
  single-sourced without pulling backend runtime code into the bundle
  (corrected 2026-10-22; see `evidence/bug-diagnosis.md`, bug 6).

## Live verification

Four helpers walked all 19 candidate flows live on 2026-10-20 against a
production build with the mock AI, at 390×844 and 1280×800, in their own
headless Chrome. Two more sorted every difference and diagnosed every bug.

- `evidence/flow-walks-in-depth.md` — FLOW-001, 002, 004, 005, 015
- `evidence/flow-walks-ask.md` — FLOW-003, 011, 016, 017, 018, 023
- `evidence/flow-walks-trade-scan.md` — FLOW-006, 009, 024, 025
- `evidence/flow-walks-chrome-life.md` — FLOW-007, 010, 013, 014
- `evidence/flow-text-reconciliation.md` — every PRD-versus-live difference
  sorted: 10 stale flow text, 4 app-versus-spec, 7 spec gaps, 30 test notes
- `evidence/bug-diagnosis.md` — root cause, file and line evidence, fix
  sketch, size and the named unit test for each of the ten fixes (bugs 6–10
  added 2026-10-22 by code reading)
- `evidence/browser-smoke-followups-pr341.md` — fix 10's source text, copied
  from open docs PR #341 so the package reads alone
- `evidence/flow-id-dispositions.md` — every `PRD/sections/` line naming a flow
  this package rewords, with its disposition (122 hits)

Each walk file holds the per-flow setup, player-worded steps, expected results
tied to PRD sentences, sizes, must-fail breaks, edge-case include/skip calls,
and what cannot be asserted. The planner slices from these files.

## The design

### 1. The flow suite (NFR-022)

- **One test file per player flow**, in `e2e/flows/`, named
  `flow-NNN-<slug>.spec.ts`. A flow's edge cases are steps inside its file.
  18 files.
- **Runner:** `@playwright/test`, pinned to the same exact version as
  `playwright`. It gives per-file tests, native sharding (`--shard i/N`), and
  an HTML report with named steps and screenshots. That report is the owner's
  after-build review.
- **Harness:** NFR-021's rules carry over unchanged in substance. Build the
  frontend as the deploy does (pointed at the local backend; no mock banner;
  no Formspree id), start the compiled backend with both providers on `mock`,
  answer `cards.scryfall.io` with a placeholder image, block every other
  non-local host. Fail on any console error, uncaught page error, or local
  request failing or answering ≥400 — unless the test itself routes that
  request to fail (FLOW-003, FLOW-024 and FLOW-025 failure legs). No
  automatic retries. Reuse the tested pure rules in `scripts/smoke-browser.mjs`
  (request classification, console filtering, env builders, port picking)
  rather than re-writing them (technical-design-rules: reuse before creating).
- **Sizes:** every test at 390×844 and 1280×800, each in a fresh context with
  empty storage, unless its coverage-map row records why one size suffices.
- **Assertions:** visible labels, accessible names, request bodies and shapes
  (an answer is present, a total is above $0.00). Never exact AI wording,
  prices, card text or pixels.
- **The mock answer** is about 19,000 characters because it prints the whole
  prompt. A test that needs a second turn may swap it for a short fixed answer
  through a route. After bug 1 is fixed, FLOW-005's test also sends one
  follow-up after the full-length mock answer, to pin the fix.
- **Scanner:** Chrome's fake camera plays a short video of one real card
  (`--use-file-for-fake-video-capture`). The live walk locked and added
  "Fury Sliver" from a 2-frame 1280×960 `.y4m`. The committed fixture is small
  (owner approved one card image) and is expanded to the `.y4m` at run time
  using Node built-ins or an existing direct dependency — no new dependency
  for this. Recognition is asserted by card name, never by printing (scans
  can land on a same-art reprint, a known parked issue). The fixture card and
  `cardhashes.bin` are paired: a hash-data rebuild re-checks the fixture.
- **Feedback:** the suite builds with no Formspree id and routes the Formspree
  host to fail, so a report can never be sent.

### 2. The coverage map and the drift check

- `e2e/flows/coverage-map.json` has one row per FLOW id in `user-flows.md`:
  either the test file that guards it, the sizes it runs at, its must-fail
  proof, and a fingerprint (a hash) of the flow's PRD text — or an exemption
  with its reason.
- **Exempt:** FLOW-015 (backend-only combo enrichment; covered by
  `apps/backend/src/prompt/comboPromptIntegration.test.ts` and the Commander
  Spellbook prompt goldens); FLOW-020, 021, 022 (owner process flows, not
  player flows).
- **Drift check:** a script (unit-tested, run by `npm run test:scripts`) fails
  when a FLOW in `user-flows.md` has no map row, when a row names a missing
  file, or when a flow's PRD text no longer matches its fingerprint. Updating
  a fingerprint is an edit inside `e2e/flows/`, so changing a flow in the PRD
  always comes with a look at its test. This works the same locally and in
  CI, with no git-diff logic.
- **Must-fail proof:** before a test merges, the build breaks the feature on
  purpose (the walk files suggest a break per flow), confirms the test fails
  at the expected step, reverts the break, and records the break and the
  failing step in the map row. A break is never committed.

### 3. Rules for changing a flow test later (owner decision, recorded in NFR-022)

1. A bug in a covered flow is fixed by first adding a check to that flow's
   file that fails on the unfixed code, then fixing the code.
2. New checks join the flow's existing file. Bugs outside any flow get unit
   tests.
3. A PR that changes a flow's PRD text updates its test and fingerprint in
   the same PR; the drift check enforces it.
4. The automated pipeline (health-pipeline, future) never adds, edits or
   deletes anything under `e2e/flows/`. It may file an issue to the owner.
   Machine enforcement of this rule is Part 2's merge gate; this package
   states the rule.

### 4. CI and sharding

- One `flow-build` job builds the frontend and backend once and uploads them;
  a `flow-tests` matrix job runs one shard each against that build. Neither job
  gets `id-token` permission or any secret; the `deploy` job lists `flow-tests`
  in `needs:`, so it waits for every shard (same wording in NFR-021 and NFR-022).
- **Target:** the slowest flow shard finishes no later than the slowest other
  quality-check job, so the flow suite adds no wall time to a pull request.
  The build measures the suite on CI and sets the shard count from that; a
  later change is the matrix line only. NFR-012 gains the matching scaling
  note. The coverage map bounds the suite at one file per flow, so growth is
  slow and visible.
- The CI job uploads the HTML report on every run (kept 7 days), so the owner
  can open the after-build review from the PR.
- `npm run test:flows` runs the suite locally; it replaces `smoke:browser` in
  `npm run quality:check` (NFR-012: local and CI stay equivalent). Cost to the
  owner: local `quality:check` gets slower by roughly the suite's run time;
  the build measures and reports the number.
- `scripts/smoke-browser.mjs`'s six steps retire. Each is a step inside a flow
  test (Ask → FLOW-011, Life Tracker → FLOW-013, Trade → FLOW-009, In-Depth →
  FLOW-001, Scanner → FLOW-006, feedback → FLOW-014). Its pure rules
  (request classification, console filtering, env builders, port picking)
  stay under `scripts/` with their unit tests, run by `npm run test:scripts`;
  the harness in `e2e/flows/` imports them. That is where NFR-020's and
  NFR-021's tested rules already live, so NFR-021's constraint saying so stays
  unchanged. Only the file may be renamed. Whether Part 2's merge gate also
  shields these rules from the pipeline is Part 2's call.
- **Checks / skips lists.** Beside each test file sits `flow-NNN-<slug>.md`, a
  plain list in player words of what the test checks and what it skips
  (owner decision 5). It lives in the repo, not only in the work folder, so it
  survives close deleting this package; a check added to or removed from a
  test changes its list in the same commit (NFR-022).

### 5. The fixes (code, each with a unit test that would have caught it)

Full causes, file:line evidence, fix sketches and the named unit test for
each of the ten: `evidence/bug-diagnosis.md`, bugs 1–10 (numbered as here).

| # | What a player sees today | Fix | Size | Players hit it? |
| --- | --- | --- | --- | --- |
| 1 | A follow-up after a very long answer fails with a validation error | Trim each history message to the server's 10,000-character cap before sending; the screen and saved history keep full text; the cap is defined once in the backend (`constants.ts`) and imported, not copied | ~10 lines in the hook, plus the shared cap | Mock only today (longest real answer 2,556 of 7,557) |
| 2 | Sending a follow-up in a reopened conversation wipes the unsent Draft | Clear the Draft only on a conversation's first answer, in both Ask a Question and In-Depth | 3 files, ~6 lines | Yes |
| 3 | Closing the feedback form leaves keyboard focus on the page, not ☰ Menu | Close the Menu before running a Menu action, so ☰ can take focus | 1 file, ~4 lines | Yes |
| 4 | Choosing Draft in Question History over an answered conversation does nothing | Leave the thread the way ✎ Edit cards does, then load the Draft; same guard in In-Depth (DEC-138 keeps the two flows matched) | 1–2 files, ~4–8 lines | Yes |
| 5 | In In-Depth, scanning several cards then Exit scan keeps only one | Read the zone from a live ref, as Trade Balancer does | 1 file, ~8 lines | Yes |
| 6 | The 11th follow-up in any conversation fails, real AI too | When history would pass the server's 20-message cap, drop the oldest exchanges but keep the opening question and its answer (REQ-246 chooses the rules from the opening question); cap imported, not copied | 3 files, ~15 lines with fix 1 | Yes |
| 7 | Closing Question History leaves focus on the page, not ☰ Menu | Close the tray first, focus ☰, then open the sheet. Unlike Send feedback, nothing moves focus to ☰ before History opens, and ☰ is hidden while the tray is open (bug 3's cause) | 1 file, ~5 lines | Yes |
| 8 | Trade Balancer's printing picker has no "N printings" line | Add the count the spec promises ("N printings"; "only printing" for one) and flip the unit test that pins its absence; it was dropped on purpose on 2026-10-02 to match the mockup (see Material assumptions) | 1 file + its test, ~5 lines | Yes |
| 9 | Feedback sent from Ask a Question carries no question, cards or conversation | Register Ask a Question as a snapshot contributor, as In-Depth already does (REQ-088), with a new field for its attached cards | 3 files, ~20 lines | Yes |
| 10 | On a phone, a tap at the centre of Player 1's − half lands on the counters preview | **Waits on Q-015.** The spec says the counters preview takes its own taps inside that half (REQ-217, Life Tracker spec), so this is specified behavior. If Q-015 keeps it: move the preview so no − half has it at its centre, with the REQ-202 screenshot pair and an `elementFromPoint` check in the FLOW-013 test. Source: item 1 of open docs PR #341, copied in `evidence/browser-smoke-followups-pr341.md` | small code, visible layout change | Only by tapping the preview |

Bugs 1, 2, 4, 5 and 6 sit in flows whose PRD text already promises the
fixed behavior; their PRD changes are limited to correcting wrong numbers
(REQ-027) and one clarifying clause (FLOW-017). Fixes 8 and 9 implement
existing spec. Fix 10 was found by the browser smoke build and parked in
PR #341; it sits in FLOW-013, a flow this package freezes, so the package
brought it in. Reading the code on 2026-10-22 showed the spec already calls
that tap correct, so fix 10 now waits on blocker question Q-015
(recommended: drop it). PR #341's item 2 (a workflow-hook retry trap) is
unrelated and stays parked.

### 6. Order: one gameplan (owner decision 5; map-out sets the slices)

1. The fixes, each with its unit test named in `evidence/bug-diagnosis.md`:
   fixes 1–9, plus fix 10 with its `elementFromPoint` check only if Q-015
   keeps it.
2. The harness, runner, coverage map and drift check; retire the smoke steps.
3. The 18 flow tests from the NFR-022 test-case list, each with its recorded
   must-fail proof (in its coverage-map row) and its plain checks / skips list
   (`flow-NNN-<slug>.md` beside the test).
4. CI jobs and sharding, measured; NFR-012 note filled with real numbers.
5. **The graph run finishes.** Build applies the accepted PRD changes with the
   code (graph contract: apply at build) and opens the code PR on
   `thejudge-auto/health-flow-work`; review checks it. Then close (node 8)
   runs on that branch, before any merge: it writes the receipt, folds the
   ledger in, and deletes `PRD/work/health-flow/` — brief, gate file and
   `evidence/` included. The run ends `COMPLETE` with the code PR open. The
   graph never merges.
6. **What close must put in the receipt**, because the package is gone after
   close: the full NFR-022 test-case list as built (one row per flow), each
   test's checks / skips list, and each test's must-fail record (the break
   and the step that failed), plus the walk notes NFR-022's note promises.
   The checks / skips lists and the must-fail records also live in the repo
   (`e2e/flows/flow-NNN-<slug>.md` and `coverage-map.json`), so the later
   round reads them from the PR branch, not from the deleted package.
7. **Owner watch, on the open code PR, after the run.** The owner checks out
   the PR branch, runs the suite in Playwright UI mode (the build records the
   exact command in the receipt), reads each test's checks / skips list, and
   names what is missing or wrong. Nothing freezes until the PR merges.
8. **Enhancement, on the same PR.** A direct Claude Code session the owner
   starts on `thejudge-auto/health-flow-work` (not a graph run, which has
   ended) adds the misses: each goes into its flow's existing test file with
   its must-fail proof, its checks / skips line and its coverage-map record,
   and the receipt's test-case list is updated to match; the session pushes
   to the same PR. Repeat 7–8 only if the owner asks. The tests freeze when
   the owner merges the code PR.

## Product truth this needs

All in `GATE-QUESTIONS.md`, one block each, with the full diff:

- **NFR-022 (new):** the flow suite, the coverage map, the frozen rule, the
  must-fail proof, the change rules, CI and sharding. Appendix: the 18-row
  test-case list the build starts from; the owner enhances it after watching
  a run (decision 5).
- **NFR-021 (amend):** the browser check's title, description, steps and
  command become NFR-022's suite; its old timings are marked historical;
  harness rules stay, and so does the constraint that its pass/fail rules are
  unit-tested under `scripts/`.
- **NFR-012 (amend):** job count and the flow-shard scaling note.
- **REQ-166 (amend):** the quality-check job list.
- **FLOW-008, FLOW-012 (remove):** delete both stubs and repoint the four
  lines that cite them.
- **REQ-027 (amend):** history limits corrected to the live numbers (10,000
  per message, 20 messages, 1,000,000 total) and the client trims to fit
  (fixes 1 and 6).
- **FLOW-017 (amend):** choosing Draft over an answered conversation opens the
  draft (fix 4).
- **REQ-206 (amend):** Ask a Question's answered view shows a Cards strip, not
  one "N cards" trigger (owner: amend the spec).
- **REQ-058 (amend):** In-Depth tiles keep their direct ✕ Remove beside the
  card menu (owner: amend the spec).
- **FLOW-005, FLOW-006, FLOW-007, FLOW-010, FLOW-013, FLOW-023 (amend):**
  stale flow text brought in line with the feature specs.
- **FLOW-024 (amend):** the card-detail popup's Price chip, which the app
  shows and no spec mentions.
- **Blocker question Q-015:** drop fix 10 (recommended), because REQ-217 and
  the Life Tracker spec say the counters preview takes its own taps inside
  the "−" half; or keep it and change the Life Tracker layout.

## Material assumptions

- The flow-test folder is `e2e/flows/`; the planner may choose another
  top-level path if a tool constraint requires it, keeping one folder.
- The fake-camera fixture fits a small committed file once compressed; if it
  cannot, the build reports the size before committing anything large.
- Sharding target is relative ("no later than the slowest other job") because
  the suite's CI time is unmeasured; the build fills in the numbers
  (`feedback: measure quantitative spec targets`).

Added 2026-10-22 (graph run `graph-20261023-020331`, after quality-check FAIL
1), each from the assumption ladder in `PRD/instructions/preparation-contract.md`:

- **Who adds the owner's misses: a direct Claude Code session the owner starts
  on the code PR's branch.** The graph contract ends the build half `COMPLETE`
  with the code PR open, after close has deleted this package, and no graph
  node runs after that; `thejudge-amend` needs a live package. A plain session
  on the PR branch is the smallest step that fits, and the owner may make the
  edits by hand instead. Not a blocker: it changes no player behavior,
  contract, data or scope, only who types the commits.
- **Close carries the test-case list, the checks / skips lists and the
  must-fail records into the receipt**, and the lists and records also live
  beside the tests (section 6, step 6), so the enhancement round never needs
  the deleted package.
- **Harness pass/fail rules stay under `scripts/`** (section 4): the
  established place for NFR-020's and NFR-021's tested rules; no new test
  command; NFR-021's constraint stays true.
- **Fix 8 reverses a deliberate mockup match.** The `ui-look-translation`
  build removed the "N printings" line on 2026-10-02 to match the mockup and
  pinned its absence with a unit test, without amending REQ-065. REQ-065 still
  promises the count, REQ-070's mockup exception covers guidance copy rather
  than a count of data, and owner decision 10 says fix the app; so the fix
  stands and the old test flips. Keeping the mockup look instead would need a
  REQ-065 amendment block, which this package does not propose.
- **Fix 10 waits on Q-015**: the spec (REQ-217, `life-tracker/README.md`,
  DEC-136) calls today's behavior correct while the approved package calls it
  a bug; that conflict is a genuine blocker (three conditions in Q-015).

## Non-goals

- Part 2 (finder, triage, builder, reviewer, merge gate, branch protection,
  auto-merge). See `PRD/work/health-pipeline/`.
- Machine enforcement of "the pipeline never touches `e2e/flows/`" — Part 2.
- Pixel or screenshot comparison; real AI answers; real camera recognition
  beyond the one fixture card; production hosting.
- The spec gaps left alone by the reconciliation (C2–C7 in
  `evidence/flow-text-reconciliation.md`): failed-follow-up text placement,
  phone search strip count, retry printing choice, tracker default count,
  empty reading pane, feedback draft on close.
- The parked same-art-reprint scan issue (`PRD/ideasForLater/codebase-cleanup-followups/`).
- The retired step 4 inside FLOW-011 (its number is kept on purpose).

## Amendment set — disposition per grep hit

Greps run 2026-10-20 over `PRD/sections`, `PRD/instructions/*.md`,
`AGENT-SKILLS.md`, `OPERATOR.md`, `README.md` (receipts are historical and
never edited).

| Grep | Hit | Disposition |
| --- | --- | --- |
| `FLOW-0(08\|12)` | `user-flows.md:188` FLOW-008 stub | delete (FLOW-008 block) |
| | `user-flows.md:242` FLOW-010 note | reword without the id (FLOW-008 block) |
| | `functional-requirements.md:2344` REQ-096 note | reword without the id (FLOW-008 block) |
| | `user-flows.md:281` FLOW-011 note | reword without the id (FLOW-012 block) |
| | `user-flows.md:285` FLOW-012 stub | delete (FLOW-012 block) |
| | two receipts | historical, keep |
| `smoke:browser` / `browser-smoke` | `non-functional-requirements.md:378,388,389,390` NFR-021 | amend (NFR-021 block) |
| | `non-functional-requirements.md:209` NFR-012 note | amend the whole line, both job-name mentions (NFR-012 block) |
| NFR-021 old-step wording (`most basic action`, `unit-tested under`, `measured 2026-10-18`, `camera recognition`) | `non-functional-requirements.md:376` Description | amend (NFR-021 block) |
| | `non-functional-requirements.md:387` pass/fail rules unit-tested under `scripts/` | keep — the rules stay under `scripts/` (section 4) |
| | `non-functional-requirements.md:403` Notes, old six-step timings | amend: marked historical (NFR-021 block) |
| | `non-functional-requirements.md:405` "what it does not prove" | amend: recognition of the one fixture card is now asserted (NFR-021 block) |
| | `non-functional-requirements.md:355` NFR-020 rules unit-tested under `scripts/` | keep — NFR-020, unchanged |
| `FLOW-0NN` for 005, 006, 007, 010, 013, 017, 023, 024 (2026-10-22) | 122 lines, one row each in `evidence/flow-id-dispositions.md` | 13 are the flow's own entry or a sentence already in a block; 109 are citations, keep |
| | `functional-requirements.md:3930` REQ-166 | amend (REQ-166 block) |
| | `system-map.md:535–537` deploy guardrails | amend (NFR-021 block) |
| | `PRD/instructions/runtime-process-hygiene.md:27` | amend (NFR-021 block) |
| `2000 chars` | `functional-requirements.md:517` REQ-027 | amend (REQ-027 block) |
| | `in-depth/README.md:352`, `:497` | amend (REQ-027 block) |
| | `integrations-and-data.md:88` | amend (REQ-027 block) |
| `(6000)` | `user-flows.md:116` FLOW-005 | amend (REQ-027 block) |
| `MAX_CONVERSATION_HISTORY_CHARS` flag | `in-depth/README.md:501–507` | resolve (REQ-027 block) |
| `"N cards"` / `naming that card` | `functional-requirements.md:1835` REQ-075, `:2354` REQ-097, `:5363` REQ-206; `quick-lookup/README.md:155–161`; `user-flows.md:260`; `system-map.md:543` | amend (REQ-206 block) |
| `direct Remove button` | `in-depth/README.md:194` | amend (REQ-058 block) |

## Related material (citations only)

- `PRD/work/health-pipeline/IDEA.md` — Part 2
- `PRD/instructions/receipts/browser-smoke-suite-2026-10-19.md`
- `PRD/instructions/receipts/ci-built-server-smoke-2026-10-19.md`
- `PRD/ideasForLater/browser-smoke-followups/IDEA.md` (open docs PR #341, not on `main` yet; item 1 copied in `evidence/browser-smoke-followups-pr341.md`)
