# Design brief — health-flow

Refined with the owner in direct mode on 2026-10-20. Part 1 of the
self-healing idea in `IDEA.md`; Part 2 (the finder → triage → builder →
reviewer pipeline and the merge gate) was split out to
`PRD/work/health-pipeline/` and waits on this package.

## What it means for a player

Nothing a player does changes. Ten things that are broken today get fixed
(listed below), and from then on every player flow is walked in a real
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
   fixes (below).
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
- The frontend already imports constants from `apps/backend/src/` (for example
  `apps/backend/src/constants.js`), which is how a shared cap stays single-sourced.

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
- `evidence/bug-diagnosis.md` — root cause, fix sketch and size for each bug

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
  gets `id-token` permission or any secret; `deploy` needs every shard.
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
  FLOW-001, Scanner → FLOW-006, feedback → FLOW-014). Its pure rules move to
  wherever the harness lives, with their unit tests.

### 5. The fixes (code, each with a unit test that would have caught it)

Full causes, file:line evidence and fix sketches: `evidence/bug-diagnosis.md`.

| # | What a player sees today | Fix | Size | Players hit it? |
| --- | --- | --- | --- | --- |
| 1 | A follow-up after a very long answer fails with a validation error | Trim each history message to the server's 10,000-character cap before sending; the screen and saved history keep full text; the cap is imported from the backend validation module, not copied | 1 file, ~10 lines | Mock only today (longest real answer 2,556 of 7,557) |
| 2 | Sending a follow-up in a reopened conversation wipes the unsent Draft | Clear the Draft only on a conversation's first answer, in both Ask a Question and In-Depth | 3 files, ~6 lines | Yes |
| 3 | Closing the feedback form leaves keyboard focus on the page, not ☰ Menu | Close the Menu before running a Menu action, so ☰ can take focus | 1 file, ~4 lines | Yes |
| 4 | Choosing Draft in Question History over an answered conversation does nothing | Leave the thread the way ✎ Edit cards does, then load the Draft; same guard in In-Depth (DEC-138 keeps the two flows matched) | 1–2 files, ~4–8 lines | Yes |
| 5 | In In-Depth, scanning several cards then Exit scan keeps only one | Read the zone from a live ref, as Trade Balancer does | 1 file, ~8 lines | Yes |
| 6 | The 11th follow-up in any conversation fails, real AI too | When history would pass the server's 20-message cap, drop the oldest exchanges but keep the opening question and its answer (REQ-246 chooses the rules from the opening question); cap imported, not copied | next to fix 1 | Yes |
| 7 | Closing Question History leaves focus on the page, not ☰ Menu | Same cause as 3; History opens on a separate path inside the Menu, so it needs its own close-first | ~4 lines | Yes |
| 8 | Trade Balancer's printing picker has no "N printings" heading | Add the heading the spec already promises ("N printings"; "only printing" for one) | 1 file, small | Yes |
| 9 | Feedback sent from Ask a Question carries no question, cards or conversation | Register Ask a Question as a snapshot contributor, as In-Depth already does (REQ-088) | small | Yes |
| 10 | On a phone, tapping the middle of Player 1's − in Life Tracker can land on the counters control | Stop the counters control overlapping the − hit area (REQ-217 near-edge −/+, REQ-205 44 px targets); then the FLOW-013 test taps the centre, not the edge. Parked as item 1 of open docs PR #341 (`PRD/ideasForLater/browser-smoke-followups/IDEA.md`), which carries the proof needed and the REQ-202 screenshot pair | small | Yes |

Bugs 1, 2, 4, 5 and 6 sit in flows whose PRD text already promises the
fixed behavior; their PRD changes are limited to correcting wrong numbers
(REQ-027) and one clarifying clause (FLOW-017). Fixes 8 and 9 implement
existing spec. Fix 10 was found by the browser smoke build and parked in
PR #341; it sits in FLOW-013, a flow this package freezes, so decision 7
brings it in. PR #341's item 2 (a workflow-hook retry trap) is unrelated and
stays parked.

### 6. Order: one gameplan (owner decision 5; map-out sets the slices)

1. The ten fixes, each with its unit test (fix 10 with its `elementFromPoint` test).
2. The harness, runner, coverage map and drift check; retire the smoke steps.
3. The 18 flow tests from the NFR-022 test-case list, each with its recorded
   must-fail proof and its plain "checks / skips" list.
4. CI jobs and sharding, measured; NFR-012 note filled with real numbers.
5. Apply the accepted PRD changes with the code (graph contract: apply at
   build). The graph opens the code PR and stops; it never merges.
6. **Owner watch, on the open code PR.** The owner runs the suite in
   Playwright UI mode on the PR's branch and names what is missing or wrong.
   No mid-build stop is needed: nothing freezes until the PR merges.
7. Enhancement, on the same PR: add the owner's misses to the flows' existing
   files, each with its must-fail proof, and update the test-case list in the
   receipt to match. Repeat 6–7 only if the owner asks. The tests freeze when
   the owner merges the code PR.

## Product truth this needs

All in `GATE-QUESTIONS.md`, one block each, with the full diff:

- **NFR-022 (new):** the flow suite, the coverage map, the frozen rule, the
  must-fail proof, the change rules, CI and sharding. Appendix: the 18-row
  test-case list the build starts from; the owner enhances it after watching
  a run (decision 5).
- **NFR-021 (amend):** the browser check's steps and command become NFR-022's
  suite; harness rules stay.
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

## Material assumptions

- The flow-test folder is `e2e/flows/`; the planner may choose another
  top-level path if a tool constraint requires it, keeping one folder.
- The fake-camera fixture fits a small committed file once compressed; if it
  cannot, the build reports the size before committing anything large.
- Sharding target is relative ("no later than the slowest other job") because
  the suite's CI time is unmeasured; the build fills in the numbers
  (`feedback: measure quantitative spec targets`).

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
| | `non-functional-requirements.md:209` NFR-012 note | amend (NFR-012 block) |
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
- `PRD/ideasForLater/browser-smoke-followups/IDEA.md` (open docs PR #341, not on `main` yet)
