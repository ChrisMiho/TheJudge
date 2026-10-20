# Graph run — browser-smoke-suite

- Run ID: `graph-20261019-190721` (build half, claimed 2026-10-19; the spec-forming half ran as `graph-20261019-174628`, rotated with owner approval from `graph-20261018-233939`, whose run-state writes the retry guard denied)
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf canary: [graph-boundary] rm -rf is denied in every session; graph canary nohup: denied while a graph run holds the lock)`; after the rotation, lock retaken with `graph-preflight --take-lock --run-id graph-20261019-174628 --pid 98719` and the graph canary `nohup true` denied: `nohup is denied while a graph run holds the lock`. Build half: lock taken from the launch root with `node scripts/graph-preflight.mjs --take-lock --slug browser-smoke-suite --run-id graph-20261019-190721 --pid 17325` (lock verified at `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock`); graph canary `nohup true` denied: `nohup is denied while a graph run holds the lock: a detached command outlives the run that started it`
- Autonomous base: origin/main
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite` (the spec-forming half ran in-place in `.worktrees/session-ci-smoke`, since pruned)
- Staging: none (no intake files supplied; the request text is recorded verbatim in `IDEA.md`)
- Current node: `close` (build half, run `graph-20261019-190721`)
- Next action: `/graph-implement PRD/work/browser-smoke-suite/` resumes from the marker in the build worktree

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | in-place shape in `.worktrees/session-ci-smoke` (switched from the parked, fully pushed `thejudge-auto/ci-built-server-smoke` to `thejudge-auto/browser-smoke-suite`, cut from `origin/main` `071e9a18`); branch pushed (`git ls-remote` → `071e9a18`); porcelain empty; lock `.worktrees/.graph-run.lock` runId `graph-20261018-233939` pid 98719; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/browser-smoke-suite/` (IDEA.md with 8 `## Prior run` lines, 3 ideasForLater citations, the #326 overlap as an open question; README.md; STATUS.ideation) and board row committed `286ffd11`, pushed (`git ls-remote` → `286ffd11`); porcelain empty | 2026-10-18 |
| 3 | define | opus | failed | `0 → 185` | tool-call cap exhausted: cap 150 + 30-call park grace passed (hook denial at call 184); the node ended without a report and without committing. Left untracked and complete through their last sections: `DESIGN-BRIEF.md` (511 lines), `GATE-QUESTIONS.md` (NFR-021 new; REQ-166 and NFR-012 amended with #326-first counting; `## Blocker questions` none), `evidence/measurements.md` (200 lines); marker still `STATUS.ideation`, board row not moved. Calls 183–185 were the driver's own post-node checks, charged to `define/1` because the run state was not reset first. The lock and run state were removed by the owner (`! rm …/.graph-run-state.json …/.graph-run.lock`); the lock was retaken with `graph-preflight --take-lock` and the graph canary `nohup true` was denied (repeat-denial rule: already denied during this run, `nohup-wrapper`). No leftover servers from this run (`ps`); NFR-021 unused in `PRD/sections/`; branch diff vs merge-base touches no `PRD/sections`, `apps`, `scripts` or `.github` | 2026-10-18 |
| 4 | define (attempt 2, run `graph-20261019-174628`) | opus | ok | `0 → 46` | commit `c266d575`, pushed (`git ls-remote` → `c266d575`); drafts finished on top of #326's accepted changes (no either-way wording; NFR-012 7→8; REQ-166 list gains `browser-smoke` after `built-server`); every today line checked to match `PRD/sections/` exactly once after the main merge; disposition greps re-run (74 and 101 hits, none new); `GATE-QUESTIONS.md` present (NFR-021 new; REQ-166, NFR-012 amended; blocker questions none); `STATUS.refined`, board row moved owner-action → refined; diff vs merge-base on `PRD/sections apps scripts .github` empty; porcelain empty; no servers, no browser, no denials. The dispatched prompt matched the recorded one, plus three driver lines: the 150-call budget figure, a prefer-whole-file-reads hint, and leave the `ci-built-server-smoke` board row alone | 2026-10-19 |
| 5 | gate-qc | sonnet | ok (PASS) | `0 → 18` | `PRD/work/browser-smoke-suite/QUALITY-CHECK.md`, commit `6c57627e`, pushed (`git ls-remote` → `6c57627e`); no blocking findings; four advisories recorded in README `## Preparation gate`; porcelain empty. Driver then parked: `STATUS.owner-action`, board row refined → owner-action, README Preparation gate written | 2026-10-19 |
| 5a | gate-review | sonnet | ok | `0 → 21` | build half run `graph-20261019-190721`: docs PR #338 merged (package on `origin/main` `8bf88d17`, which also carries code PR #339); no kickoff worktree to remove (spec-forming half ran in place in `.worktrees/session-ci-smoke`, since pruned); claim commit `a8985a74` on `thejudge-auto/browser-smoke-suite-work` cut from `origin/main` `8bf88d17`, pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `c8a7a75b` (= origin tip): 3 accept / 0 edit / 0 reject (NFR-021, REQ-166, NFR-012); `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts .github` empty; worktree porcelain empty, launch checkout unchanged (only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`). Driver moved the node's `## Gate verdicts` section out of the middle of `## Open gate` (it had split off the earlier-park history) and fixed the README file list's marker name | 2026-10-19 |
| 4 | gate-qc (build half re-grade) | sonnet | ok | `0 → 15` | PASS, 0 blocking, 7 advisory (the first grade's four carried, none settled; new: stale pre-#339 narrative superseded, reuse of `scripts/smoke-built-server.mjs` helpers vs accepted NFR-021 no-shared-script text, backend built twice in `quality:check`); every diff's current-text line matches `PRD/sections/` once on `8bf88d17` (REQ-166 `functional-requirements.md:3930`, NFR-012 `non-functional-requirements.md:209`, three system-map lines, the runtime-process-hygiene sentence); NFR-021 unused; `deploy.needs` = static, backend, built-server, coverage-merge, changes; no browser driver in any `package.json`; `QUALITY-CHECK.md` commit `fd508e9b` (= origin tip); `STATUS.refined` only marker; porcelain empty. Driver wrote README `## Preparation gate` PASS with all seven advisories | 2026-10-19 |
| 5 | plan | sonnet | ok | `0 → 22` | commit `ad4c11e4` (= origin tip): `GAMEPLAN.md`, one slice `slice-a-browser-smoke-check.md` (new `scripts/smoke-browser.mjs` + `scripts/smoke-browser.test.mjs`, exact-pinned `playwright` devDependency with Chrome channel and no browser download, `quality:check` join, `browser-smoke` CI job on Node 24 with `deploy.needs`, product truth applied by intent), `slice-a.criteria.json` 13 criteria all `false`, none manual or post-merge; advisories settled (one absolute output path under `.tmp/browser-smoke/`, clear Chrome-launch failure message, droppable camera assertion, no import from or edit to `scripts/smoke-built-server.mjs`); nothing shipped under `PRD/work/`; `STATUS.active` only marker; board row under active; porcelain empty | 2026-10-19 |
| 6 | build | sonnet | ok | `0 → 82` | PR https://github.com/ChrisMiho/TheJudge/pull/340 open, title `[THEJUDGE-AUTO][READY] Browser smoke suite (browser-smoke-suite)`, registration marker in body; head `02a48a14` (= origin tip; feat `c14687b2`, ship-ready `f829c293`, media-abort fix `02a48a14`); new `scripts/smoke-browser.mjs` + `scripts/smoke-browser.test.mjs`, `playwright` 1.63.0 exact-pinned (1.64.x under two weeks old), `quality:check` join, `browser-smoke` job + `deploy.needs`, `eslint.config.mjs` ignores `.tmp/**` (outside the slice file list), `PRD/sections/` NFR-021 / NFR-012 / REQ-166 / system-map and `runtime-process-hygiene.md` applied by intent; `npm run quality:check` exit 0 (browser smoke 12/12 step runs, about 19 s); `gh pr checks 340` static, backend, built-server, browser-smoke (1m15s), frontend-shard 1-3, coverage-merge pass, changes/deploy skipping (main-only); one earlier CI run on `f829c293` failed on a cancelled `scanSuccess.wav` preload, fixed test-first; builder found Player 1's phone Decrease-life button centre covered by the counters control and taps the near-edge instead (app unchanged); `STATUS.ship-ready` only marker; launch-checkout porcelain identical before/after; `classifyBuildWrites` outside = [] on every reported path; no `.playwright-mcp`/`.tmp` writes at the launch root after the pre-build marker; no run process left (leftover `vite` pids belong to other worktrees); 0 hook denials, one `sed -i` permission denial redone with Write; criteria A1–A13 `true` set by the builder — hook evidence log has 0 entries for this run, so the criteria are self-reported and review is the gate | 2026-10-19 |
| 7 | review | opus | failed | `0 → 31` | no-write reviewer (read-only `Plan` agent, fresh context) graded head `9e23ce4c` (code identical to `02a48a14`); verdict changes-needed: A1–A13 each hold on the pass path (`npm run test:scripts` 1106/0, `node --test scripts/smoke-browser.test.mjs` 21/21, local `npm run smoke:browser` 12/12, typecheck/lint/format exit 0, parity 7/7, accepted diffs match `PRD/sections/` line for line, `lsof`/`ps` clean); 0 Critical, 1 Important — I1 `scripts/smoke-browser.mjs:327-331` and `:428-432`: `page.waitForResponse` started un-awaited before the Ask / Decrypt Stack click, so a failed click leaves a rejecting promise with no handler; the reviewer's `node -e` probe died with an uncaught `page.waitForResponse: Timeout exceeded` before catch or `finally` ran (no FAIL line, no screenshot, no server output, servers left running locally) — breaks slice item 7; driver confirmed the lines. 7 Minor (M1 the step-budget `sleep` race timer is never cleared, about 15 s extra per run; M2 output path only in the console log; M3 no parity assertion for `browser-smoke`; M4 answer check uses CSS classes; M5 a missing `playwright` import reports Chrome missing; M6 data files count as loaded on headers; M7 phone tap target on Player 1's minus band, outside the slice). Loop to `build` attempt 2 (1 of 2) for I1, with M1 added by the driver as it is in the same step runner | 2026-10-19 |
| 6 | build (attempt 2) | sonnet | ok | `0 → 26` | commit `99a24150` (= origin tip, PR #340 head): only `scripts/smoke-browser.mjs` and `scripts/smoke-browser.test.mjs` changed (`git diff --name-only 5d8f116c HEAD`); I1: new `clickAndAwaitAskAi` attaches a catch to the response wait before the click, used by `askQuestion` and `inDepthWalk`; new `runWithBudget` catches the step's own promise and clears its budget timer in `finally` (M1); `runStep` exported for the test; three new tests (failed Ask click reported with screenshot and no unhandled rejection — failed before the fix; timer cleared — 8073 ms before; late failure after budget — guard); `npm run test:scripts` 1109/0; `npm run quality:check` exit 0; smoke printed 18628 ms vs 19 s wall clock; `gh pr checks 340` all pass (browser-smoke 1m2s), changes/deploy skipping; criteria file untouched, A1–A13 `true`; launch-checkout porcelain identical; no launch-root `.playwright-mcp`/`.tmp` writes; no run process left | 2026-10-19 |
| 7 | review (attempt 2) | opus | ok | `0 → 26` | no-write reviewer (read-only `Plan` agent, fresh context) graded head `99a24150`; verdict approve, 0 Critical, 0 Important; I1 resolved: `clickAndAwaitAskAi` (`scripts/smoke-browser.mjs:329-337`) and `runWithBudget` (`:345-357`), every other promise in the file read and found handled; live probe with both clicks forced to fail and one step run past its budget printed 6 FAIL lines, saved 6 screenshots, printed both servers' output, released both ports, 0 `unhandledRejection` over 20 s; Chrome-launch-failure probe exits 1 with the clear message and 0 unhandled rejections; A1–A13 each verified (`npm run test:scripts` 1109/0, smoke tests 24/24, local smoke 12/12 in 18.4 s, typecheck/lint/format exit 0, parity 7/7, CI browser-smoke 1m7s, accepted diffs match line for line, `lsof`/`ps` clean); 7 Minor: budget-expired step keeps running until its context closes (harmless); no SIGINT/SIGTERM handler; data files count as loaded on headers; answer check uses CSS classes; a failed `playwright` import reports Chrome missing; no parity assertion for `browser-smoke`; NFR-021 note cites `evidence/measurements.md`, which its own text says is folded into the receipt at close. Worktree and launch-checkout porcelain clean after; no process left | 2026-10-19 |

## Open gate

- Terminal state: PARKED at `owner-action` after `gate-qc` PASS (attempt 1).
- Question: answer `PRD/work/browser-smoke-suite/GATE-QUESTIONS.md` (NFR-021 new; REQ-166 and NFR-012 amended, each on top of #326's accepted changes), then merge the docs PR to build.
- Evidence: `QUALITY-CHECK.md` PASS, commit `6c57627e`; README `## Preparation gate` lists the four advisories; docs PR https://github.com/ChrisMiho/TheJudge/pull/338 (`gh pr create --base main --head thejudge-auto/browser-smoke-suite`).
- Resume: the owner's merge of the docs PR is the build signal; then `/graph-implement PRD/work/browser-smoke-suite/`.

- Resolved 2026-10-19: gate-review applied the owner's answers in `GATE-QUESTIONS.md` (3 accept, 0 edit, 0 reject); marker restored to `STATUS.refined`.

Earlier park (history):

- Resolved 2026-10-19: the owner approved resuming under a rotated run id (`go`). The record below is kept as the park's history. Before the dispatch, the driver merged `origin/main` (`0f916890`, which includes merged docs PR #326) into the run branch and kept both owner-action board rows.
- Terminal state: PARKED at `owner-action` before `define` attempt 2 was dispatched.
- Question: may the run resume under a rotated run id? The hook's `denied-command-retry` rule now denies every write to `.worktrees/.graph-run-state.json` for run `graph-20261018-233939`, so the driver cannot point the run state at `define/2`.
- Evidence: the driver's `Write` of `.worktrees/.graph-run-state.json` (content `{ "runId": "graph-20261018-233939", "node": "define", "attempt": 2 }`) was denied with `This exact call was already denied during this run (tool-call-cap)`. The original denial was the cap-exhausted `define/1` block on a `Write` to the same path (call 185). `denialKey()` in `scripts/lib/boundary-rules.mjs:760` keys a file-tool denial on tool + path only, and `tool-call-cap` is not in `REMEDIABLE_RULES` (`scripts/lib/boundary-rules.mjs:189`), so a cap denial on the run-state path traps the run id for every later attempt.
- State left: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md` untracked in the working directory, complete through their last sections; `STATUS.owner-action`; board row moved to owner-action.
- Resume: rotate the run id (a new `--run-id` for `graph-preflight --take-lock`, recorded in this header) and dispatch `define` attempt 2 with the prompt recorded below. Separately, the hook fix: scope `tool-call-cap` retry denials to their node/attempt, or exempt the run-state path from the retry guard.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `NFR-021` | accept | "owner verdict, 2026-10-19. The extra 20–30 s on the local pre-PR check is acceptable: agents run that check, so the owner will not notice it" |
| `REQ-166` | accept | "owner verdict, 2026-10-19" |
| `NFR-012` | accept | "owner verdict, 2026-10-19" |

### Brief reconciliation

none
- grep: `grep -nEi "quality:check|pre-PR|20.30 s|either|undecided" DESIGN-BRIEF.md` — no edit or reject verdicts; the NFR-021 Reason's local-check cost is already the brief's design (`DESIGN-BRIEF.md:195-196`, "joins `npm run quality:check`", roughly 20–30 s locally), so nothing contradicts it and nothing was rewritten. No intake files, so no README supersession note.

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke

You are node 1 (`preflight`) of graph run `graph-20261018-233939`. Follow the skill at /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke/.claude/skills/graph-preflight/SKILL.md exactly (read it first, and read PRD/instructions/graph-workflow-contract.md as it asks). The session is rooted in a linked worktree, so expect the in-place shape: the new branch is created in this working directory itself. The worktree is currently on `thejudge-auto/ci-built-server-smoke`, a parked run's docs branch that is fully pushed; switching away from it is expected and safe.

Inputs:
- --branch thejudge-auto/browser-smoke-suite
- --slug browser-smoke-suite
- --run-id graph-20261018-233939
- --pid 98719 (the driver session's long-lived pid)
- base: default (origin/main)

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/browser-smoke-suite --slug browser-smoke-suite --run-id graph-20261018-233939 --pid 98719 --dry-run` from the working directory above. Report the shape, base, worktree, planned commands, `profile sentinel:` and `Profile:` lines verbatim.
2. If it exits 1 or 2, stop and relay the message verbatim. Do not resolve anything by hand.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary command the script prints (`CANARY_COMMAND`) as its own Bash tool call and confirm the hook denies it. Then issue the graph canary (`GRAPH_CANARY_COMMAND`, after the lock is taken) as its own Bash call and confirm it is denied. Report both reason texts verbatim. An allowed canary means BLOCKED: report it and stop.
5. Confirm end state with short separate commands in the working directory: `git branch --show-current` (must be thejudge-auto/browser-smoke-suite); `git ls-remote --heads origin thejudge-auto/browser-smoke-suite`; `git status --porcelain` (must be empty); `cat .worktrees/.graph-run.lock`.

Rules: never stash; never force-push; never remove the lock or any `.worktrees/` control file; never retry a denied call verbatim. If you write any file, use the Write/Edit tools, not heredocs or sed -i. Run git as short separate calls. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report with these lines: `outcome: ok|failed`, `shape:`, `base:`, `worktree:` (absolute path or in place), `branch pushed:` (ls-remote sha), `current branch:`, `porcelain:`, `lock:` (the JSON), `canary:` (reason text), `graph canary:` (reason text), `profile:` (the Profile line verbatim).

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke

You are node 2 (`shape`) of graph run `graph-20261018-233939`. Run the `thejudge-kickoff` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke/.claude/skills/thejudge-kickoff/SKILL.md and follow it, in its graph-controlled mode) to capture one new idea package. Work ONLY inside the working directory above. It is on branch `thejudge-auto/browser-smoke-suite`, already pushed.

Slug (use exactly): `browser-smoke-suite` → package folder `PRD/work/browser-smoke-suite/`.

The owner's request, verbatim: `could this approach just be more generalized to say that we have smoke tests for frontend and backend features, that validates basic functionality, and isnt just this? or is the rest of the ui flushed out with tests already?`

Context the driver established in the same conversation (record it in IDEA.md as context, attributed to the driver, not as owner decisions): the owner asked this about docs PR #326 (`ci-built-server-smoke`, a CI check that builds and boots the backend and requires `/api/health` and one card lookup to answer). The driver found that feature behavior is already broadly tested from source (about 156 frontend test files using vitest with jsdom, many walking whole player flows in `apps/frontend/src/App.*.test.tsx`, and about 58 backend test files including supertest route tests), but nothing on a PR runs the shipped artifacts: the production frontend build (`npm --workspace apps/frontend run build`, i.e. `tsc -b && vite build`) runs only inside `scripts/aws-deploy.sh` after merge, and no test runs the app in a real browser. The driver recommended, and the owner approved starting, a separate idea: a browser smoke suite that opens the built site in a headless browser and checks each tool loads and basic actions work. The driver also recommended the owner widen #326 to include the frontend production build; that is the owner's verdict to give on #326 and is not decided here, so record the overlap as an open question.

No intake files were supplied; there is no staging folder and no `intake/` subfolder to create.

Required outputs:
1. `PRD/work/browser-smoke-suite/IDEA.md` capturing the request (quote it verbatim) and what it means in player terms: a pull request that would ship a site where a tool fails to open, shows a blank screen, or cannot do its most basic action in a real browser is caught before it is merged and deployed.
2. Grep `PRD/instructions/receipts/` for prior runs against the same ground (smoke test, browser, Playwright, end-to-end, frontend build, CI, deploy verification) and write one `## Prior run` line per match into IDEA.md (flat list; no chain walk; do not open documents those receipts cite). Also grep `PRD/ideasForLater/` for related entries and record matching paths only as citations.
3. Package `README.md` and exactly one `STATUS.ideation` marker, per the kickoff skill. Do NOT write `## Autonomous metadata` or `## Preparation gate` — the driver owns those.
4. Add the board row in `PRD/work/STATUS.md` per the kickoff skill.
5. Do not edit `PRD/sections/` or any code. Do not decide product behavior; record open questions in IDEA.md for refinement (for example: which tools and actions the suite covers, which browser, real or mock backend, CI time budget, and how it relates to #326).
6. Commit with explicit paths only, as short separate calls run from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

If the request cannot be made into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason instead.

Return a short report: `outcome: ok|NO ACTIONABLE PACKAGE|failed`, files written, prior-run matches, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite`), and `git status --porcelain` of the working directory (must be empty).

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke

You are node 3 (`define`) of graph run `graph-20261018-233939`, attempt 1. Run the `thejudge-refinement` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke/.claude/skills/thejudge-refinement/SKILL.md and follow it in its graph-controlled mode) on the package `PRD/work/browser-smoke-suite/`. Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## The two runs`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/runtime-process-hygiene.md`. Work ONLY inside the working directory above. It is on branch `thejudge-auto/browser-smoke-suite`, already pushed.

The owner's request (verbatim in `IDEA.md`): generalize the built-backend check into smoke tests that validate basic frontend and backend functionality, unless the UI is already covered. The context in `IDEA.md` records what the driver found: feature behavior is broadly tested from source in a simulated page, but nothing on a PR builds the production frontend or runs the app in a real browser.

What to produce:
1. `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md` — the design, written in player terms first: which player-visible failures a real-browser check catches that the existing tests cannot. Ground every technical claim in the repository: the existing CI workflow and jobs in `.github/workflows/quality-check.yml`, the frontend build command and its output, how the built frontend reaches the backend (API base, proxy, CORS), the list of tools a player can open today and the single most basic action of each, what the existing `App.*.test.tsx` and component tests already cover per tool (so the suite does not duplicate them), which data files the built site downloads and whether they are committed, and which features cannot run headless in CI (for example camera access for the scanner) and how the suite treats them. Answer the open questions in `IDEA.md` with evidence, or carry them forward as blocker questions.
2. Verify live, not only from code: from the working directory, run the production frontend build and record its time and output size; serve the built site with the built backend (mock providers) on free ports; open it in a browser through the Playwright MCP tools; open each tool and attempt its most basic action; record what loaded, what failed, console errors, and timings in `PRD/work/browser-smoke-suite/evidence/measurements.md`. Save screenshots under `PRD/work/browser-smoke-suite/.playwright-mcp/` in this working directory. Call `browser_close` when done. Start servers with the Bash tool's own background option, never a trailing `&` or `nohup` (both are denied while the run holds the lock); stop them by pid with `kill <pid>` (never `pkill`/`killall`) and report the ports as free. Do not call any paid API and do not read `.secrets/`. Local is macOS arm64 while CI is x86 Linux on Node 22; record the cost of installing a headless browser on the CI runner and anything that may behave differently there.
3. The relationship to docs PR #326 (`ci-built-server-smoke`, proposing NFR-020 for a built-backend boot check, still open and unanswered): read its proposal from `git show origin/thejudge-auto/ci-built-server-smoke:PRD/work/ci-built-server-smoke/GATE-QUESTIONS.md` and its `DESIGN-BRIEF.md` the same way. Design this package so it works whether or not the owner widens #326 to include the frontend production build, state that dependency plainly in the brief, and do not reuse or redefine NFR-020. New stable IDs must be unused in `PRD/sections/` and must not collide with NFR-020.
4. If the change needs product truth (new or amended `REQ`/`FLOW`/`NFR` entries in `PRD/sections/`), write `PRD/work/browser-smoke-suite/GATE-QUESTIONS.md` in the exact format the contract gives: one `## <STABLE-ID>` block per stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no), then that ID's complete proposed diff, then `- Verdict:` and `- Reason:` left blank. Every proposed new or amended ID gets its own block. Enumerate the amendment set by a line-level grep over `PRD/sections/` for CI, quality gate, smoke, browser, end-to-end and deploy verification wording, and record a disposition row per hit in the brief. Do NOT edit `PRD/sections/`, `.github/`, or any code; refinement proposes only. Never add a `DEC-###` entry (the decision log is retired).
5. Genuine decision blockers (per the three-condition test in `PRD/instructions/preparation-contract.md`, applied per question, fresh) go under a trailing `## Blocker questions` section in `GATE-QUESTIONS.md`, written to the same plain-language standard with blank verdict slots. Do not decide product behavior the owner has not stated.
6. Set the status marker per the refinement skill (exactly one marker) and move the `PRD/work/STATUS.md` board row fully (remove from the old section, add to the new).
7. Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Do not commit build output or `.playwright-mcp/` captures if they are gitignored.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. Do not edit the README `## Autonomous metadata` section or `GRAPH-RUN.md`. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, files written, the proposed stable IDs (one line each, in plain words), any blocker questions, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite`), `git diff --stat origin/main HEAD -- PRD/sections apps scripts .github` (must be empty), `git status --porcelain` of the working directory (must be empty), the ports released, and that `browser_close` was called.

### define (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke

You are node 3 (`define`) of graph run `graph-20261019-174628` (rotated from `graph-20261018-233939`), attempt 2. Attempt 1 ran out of its tool-call budget after writing its outputs but before finishing: `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` and `evidence/measurements.md` exist in the working directory, untracked and uncommitted; the status marker is still `STATUS.ideation` and the `PRD/work/STATUS.md` board row has not moved. Run the `thejudge-refinement` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke/.claude/skills/thejudge-refinement/SKILL.md and follow it in its graph-controlled mode) to finish this package, starting from those drafts. Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## The two runs`, and `PRD/instructions/plain-language-standard.md`. Work ONLY inside the working directory above. It is on branch `thejudge-auto/browser-smoke-suite`.

Your budget is tight, so do NOT repeat the live browser session: the evidence in `evidence/measurements.md` stands. Start no servers and open no browser unless a specific claim in the brief cannot be checked any other way; if you do, follow the server rules in the attempt-1 prompt above (Bash background option, `kill <pid>`, `browser_close`).

What to do:
1. Read the three drafts in full. Check that they are internally consistent and complete against the attempt-1 prompt above (player terms first, repository-grounded claims, per-tool coverage, headless limits, #326 relationship, answers to the `IDEA.md` open questions, disposition table). Fix gaps with the Edit tool; do not rewrite what holds.
2. Check `GATE-QUESTIONS.md` against current `PRD/sections/`: every proposed diff matches current text exactly once; every proposed new or amended stable ID has its own block opening with the three plain-language lines, a complete diff, and blank `- Verdict:` / `- Reason:`; NFR-021 is unused in `PRD/sections/` and does not reuse or redefine NFR-020. The driver has merged `origin/main` into this branch since attempt 1 (it changed `PRD/sections/functional-requirements.md`, `life-tracker/README.md` and `scan/README.md`); confirm the diffs still match `PRD/sections/` as of this branch and say so.
2a. Docs PR #326 is now MERGED, with all three verdicts accept: NFR-020, the REQ-166 list gaining `built-server`, and the NFR-012 job count 6 to 7. Refinement only proposes, so `PRD/sections/` does not contain NFR-020 yet; #326's build applies it. Read #326's accepted proposal at `PRD/work/ci-built-server-smoke/GATE-QUESTIONS.md` on this branch. Replace the drafts' either-way wording (`if #326 landed first`, `if present`, `count one more`) with one definite statement: the proposal goes on top of #326's accepted changes. Apply #326's REQ-166 and NFR-012 text first, then this package's. NFR-012 counts 8 jobs, and REQ-166's list includes `built-server`. Each diff must say plainly that it applies after #326's accepted change has been written into `PRD/sections/`. Give each diff block the exact current text so whichever build runs second can apply it. Also correct one claim if a draft makes it: the production frontend build is not deploy-only. Every PR already runs `vite build` through the REQ-198 test `scripts/frontend-public-static-files.test.mjs` under `npm run test:scripts`, and `npm run typecheck` covers the `tsc -b` half. What nothing on a PR does is open the built site in a browser.
3. Do NOT edit `PRD/sections/`, `.github/`, or any code; refinement proposes only. Never add a `DEC-###` entry.
4. Set the status marker per the refinement skill (exactly one marker) and move the `PRD/work/STATUS.md` board row fully (remove from the old section, add to the new). Update the package `README.md` body to list the package files, without touching its `## Autonomous metadata` section.
5. Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Do not commit build output or `.playwright-mcp/` captures if they are gitignored.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. Do not edit `GRAPH-RUN.md`. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, what you changed in the drafts (one line each), the proposed stable IDs (one line each, in plain words), any blocker questions, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite`), `git diff --stat $(git merge-base origin/main HEAD) HEAD -- PRD/sections apps scripts .github` (must be empty), and `git status --porcelain` of the working directory (must be empty).

### gate-qc

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke

You are node 4 (`gate-qc`) of graph run `graph-20261019-174628`, attempt 1. Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md`, together with `GATE-QUESTIONS.md` and `evidence/measurements.md` in the same folder. Work ONLY inside the working directory above. It is on branch `thejudge-auto/browser-smoke-suite`. Your budget is 60 tool calls; prefer reading whole files over many small greps, and do not start servers or open a browser.

Check in particular:
- Every proposed diff in `GATE-QUESTIONS.md` applies cleanly: each line it shows as current text matches current `PRD/sections/` exactly once, and each line it shows as #326's accepted text matches what `PRD/work/ci-built-server-smoke/GATE-QUESTIONS.md` (merged docs PR #326, all three verdicts accept) adds. Every proposed new or amended stable ID (NFR-021, REQ-166, NFR-012, and any companion edit) has a full diff and its own block or is plainly carried inside one. NFR-021 is unused in `PRD/sections/` and does not reuse or redefine NFR-020.
- Every block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md`, with the substance of any cited `REQ`/`NFR`/`DEC` inlined; verdict and reason slots are blank.
- The brief's technical claims hold against the repository: the CI workflow file and job names under `.github/workflows/`, the frontend and backend build commands and outputs, how the built site reaches the built backend, the list of tools and the basic action chosen for each, which data files the built site downloads and that they are committed, the REQ-198 build test that already runs `vite build` on every PR, and the `deploy` job's `needs` list.
- The design is ordered correctly after #326: it states plainly that its edits go on top of #326's accepted changes and what its build does if #326's text is not yet in `PRD/sections/`.
- The brief is agent-ready: acceptance conditions are measurable; the smoke command, ports, browser install on the CI runner, timeouts, viewport widths and pass/fail rule are stated; headless limits (for example the scanner's camera) are handled; nothing depends on a paid API, `.secrets/`, AWS access, or a gitignored local data dump.

Write `QUALITY-CHECK.md` in the package folder per the skill, with PASS or FAIL and the complete findings. Set the status marker as the skill directs (exactly one marker; on FAIL, `STATUS.refining`, and move the `PRD/work/STATUS.md` board row fully). Do NOT write the README `## Preparation gate` section — the driver owns it. Do not edit `PRD/sections/`, code, `.github/`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, or `GRAPH-RUN.md`.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, the complete findings (blocking and advisory), the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite`), and `git status --porcelain` of the working directory (must be empty).

### gate-review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are the gate-resolution step (`gate-review`) of build-half graph run `graph-20261019-190721`, attempt 1, for the package `PRD/work/browser-smoke-suite/`. Run the `graph-gate-review` skill: read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/graph-gate-review/SKILL.md and follow it, plus `PRD/instructions/graph-workflow-contract.md` as it asks. Work ONLY inside the working directory above. It is the build worktree on the shared branch `thejudge-auto/browser-smoke-suite-work`, cut from `origin/main` (`8bf88d17`, which includes merged code PR #339) and already pushed; the claim commit `a8985a74` is its tip. Your budget is 60 tool calls; verify directly, spawn no subagents, and do not start servers or open a browser.

Every verdict comes from the answered `GATE-QUESTIONS.md` in the package and nowhere else. The owner answered all three slots (NFR-021, REQ-166, NFR-012). Apply them inside `GATE-QUESTIONS.md` only, never to `PRD/sections/`.

Reconcile `DESIGN-BRIEF.md`, and the README pointer to any verbatim `intake/` file, to every `edit` or `reject` verdict, bounded to passages that contradict a verdict; `intake/` stays verbatim. Also check whether any verdict Reason line records a decision the brief still leaves open or contradicts (the NFR-021 Reason says the extra 20–30 s on the local pre-PR check is acceptable, so the browser smoke runs in the local check too) and reconcile that passage. Report the result as a `### Brief reconciliation` list (write `none` with the grep you used if nothing needed changing).

Record the verdicts under `## Gate verdicts` in `GRAPH-RUN.md` per the skill, add the resolution line under the open gate per the skill, restore exactly one marker `STATUS.refined`, set the README status line to match, and move the `PRD/work/STATUS.md` board row fully (remove from the old section, add to the refined section). Leave alone: the README autonomous-metadata and preparation-gate sections, and the node-ledger, dispatch-prompts and instruction-ledger sections of `GRAPH-RUN.md` — the driver owns those. Do not edit `PRD/sections/`, code, `.github/`, or any `thejudge-*` skill.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. End the commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, verdict counts (accept/edit/reject) with one plain line per ID, the `### Brief reconciliation` list, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), `git diff --stat origin/main HEAD -- PRD/sections apps scripts .github` (must be empty), and `git status --porcelain` of the working directory (must be empty).

### gate-qc (build half re-grade)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 4 (`gate-qc`) of build-half graph run `graph-20261019-190721`, attempt 1 (the re-grade after the owner's verdicts). Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md`, together with the finalized `GATE-QUESTIONS.md` (all three verdicts accept: NFR-021, REQ-166, NFR-012), `evidence/measurements.md`, the first grade's `QUALITY-CHECK.md`, and the gate-verdicts section of `GRAPH-RUN.md`. Work ONLY inside the working directory above. It is the build worktree on the shared branch `thejudge-auto/browser-smoke-suite-work`, already pushed. Your budget is 60 tool calls; verify directly, spawn no subagents or forks, do not sleep or poll, and do not start servers or open a browser.

Check in particular:
- The package is one consistent story after the verdicts: nothing in the brief contradicts an accepted diff or a verdict Reason line.
- `main` moved since the first grade: code PR #339 merged and wrote NFR-020, the `built-server` CI job, `scripts/smoke-built-server.mjs`, and the #326 amendments to REQ-166 and NFR-012 into `PRD/sections/`. This package's diffs were drafted on top of #326's accepted text. Re-read every target line on this branch (cut from today's `origin/main`) and confirm each line a diff shows as current text now matches `PRD/sections/` exactly once and applies cleanly; NFR-021 is still unused. Name any line that moved or changed wording.
- The brief's technical claims still hold against the repository as it is now: `.github/workflows/quality-check.yml` job names (including the new `built-server` job) and the `deploy` job `needs` list; the frontend and backend build commands and outputs; how the built site reaches the built backend; the tools and each one's basic action; the data files the built site downloads and that they are committed; whether `playwright` (or any browser driver) is already a dependency; and anything the brief can reuse from the merged `scripts/smoke-built-server.mjs` rather than duplicate.
- The brief is agent-ready: measurable acceptance conditions; smoke command, ports, browser on the CI runner, timeouts, viewport widths, network blocking, and pass/fail rule stated; headless limits handled; nothing depends on a paid API, `.secrets/`, AWS access, or a gitignored local data dump. Carry the first grade's four advisory notes forward and say for each whether the brief now settles it or it stays advisory for map-out.

Overwrite `QUALITY-CHECK.md` in the package folder per the skill, with PASS or FAIL and the complete findings. Set the status marker as the skill directs (exactly one marker; on PASS leave `STATUS.refined`; on FAIL, `STATUS.refining`, and move the `PRD/work/STATUS.md` board row fully). Do NOT write the README preparation-gate section — the driver owns it. Do not edit `PRD/sections/`, code, `.github/`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, or `GRAPH-RUN.md`.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. End the commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, the complete findings (blocking and advisory), the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), and `git status --porcelain` of the working directory (must be empty).

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 5 (`plan`) of build-half graph run `graph-20261019-190721`, attempt 1. Run the `thejudge-map-out` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/thejudge-map-out/SKILL.md and its reference.md, and follow it in its graph-controlled mode) on the package `PRD/work/browser-smoke-suite/`. Work ONLY inside the working directory above. It is the build worktree on the shared branch `thejudge-auto/browser-smoke-suite-work`, already pushed. Your budget is 120 tool calls; verify directly, spawn no subagents or forks, do not sleep or poll, and do not start servers or open a browser.

The README preparation-gate section records `Quality-check: PASS`; verify it there before writing anything. Inputs: `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (NFR-021 new, REQ-166 and NFR-012 amended, all accept), `QUALITY-CHECK.md`, and `evidence/measurements.md`.

Write `GAMEPLAN.md`, the lettered slice docs, and one `slice-<letter>.criteria.json` beside each slice doc per the skill (every criterion `false`, each with an evidence block). Keep the slice count to what the work needs. Settle these in the slices, from the quality-check advisories in the README:
- one absolute output path, computed by the script, for the frontend build, `vite preview`, and the CI artifact;
- a clear failure message when Chrome cannot launch;
- the not-`Camera unavailable` assertion kept separable so it can be dropped if the fake-camera flags do not work in CI;
- the browser smoke is its own script: per accepted NFR-021 it shares no command, script or job with the built-backend check (NFR-020), so it neither imports `scripts/smoke-built-server.mjs` nor a module extracted from it, and that file is not refactored;
- the brief's and gate file's sentences that say #326's text is unwritten, NFR-020 is only reserved, or `built-server` is not yet in the workflow are superseded by merged #339; plan against the live `PRD/sections/` and `.github/workflows/quality-check.yml`.
The slice that changes code also applies the accepted product truth to `PRD/sections/` by intent, together with the code, in the same PR. Criteria evidence must be earnable inside the build node by a command it runs or a file it writes; do not put any post-merge or post-deploy check in criteria. Every check must run locally and in CI with no paid API, no `.secrets/`, no AWS access, and no gitignored local data dump. Nothing the PR ships may live under `PRD/work/` (that folder is deleted at close); local run output goes in an ignored folder such as `.tmp/`.

Set `STATUS.active` (exactly one marker), set the README status line to match, and move the `PRD/work/STATUS.md` board row fully (remove from refined, add to active). Do not edit `PRD/sections/`, code, `.github/`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, or the README autonomous-metadata and preparation-gate sections.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. End the commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, the slices (one plain line each), criteria counts per slice, where every shipped file will live, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), and `git status --porcelain` of the working directory (must be empty).

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 6 (`build`) of build-half graph run `graph-20261019-190721`, attempt 1. Run the `thejudge-implement-all` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/thejudge-implement-all/SKILL.md and its reference.md, and follow it in its graph-controlled mode) on the package `PRD/work/browser-smoke-suite/`. Shared branch: `thejudge-auto/browser-smoke-suite-work` — it is checked out in the working directory above, which is the one build worktree; work in it in place. Create no second worktree and no contributor branch. The GAMEPLAN, slice doc `slice-a-browser-smoke-check.md`, `slice-a.criteria.json`, and README autonomous metadata (`origin/main`) are committed and pushed at the remote tip.

Implement every remaining slice (there is one, slice A). Apply the accepted product truth to `PRD/sections/` and `PRD/instructions/runtime-process-hygiene.md` by intent, together with the code, in this PR: re-derive each edit from the finalized `GATE-QUESTIONS.md` diff and `DESIGN-BRIEF.md` against current truth, never a blind replay. Use test-driven development for the pure rules in the smoke script. Earn each criterion in `slice-a.criteria.json` by running the command or writing the file its evidence block names; never flip a criterion to `true` without that, and report any flip the hook denies. A criterion proves a command ran, not that it passed, so read every command's output and fix failures before moving on.

Run the full local gate before opening the PR: `npm run quality:check` must pass. Local is macOS arm64 on a newer Node with Google Chrome installed; CI is x86 Linux on Node 22 for the gate jobs and Node 24 for the smoke jobs, so avoid anything platform-specific (ports, signals, paths, Chrome location). Drive the browser only through the `playwright` library inside the smoke script; do not use any browser MCP tool. Start any server only through the smoke script or the Bash tool's own background option, never a trailing `&` or `nohup`; stop processes by pid with `kill <pid>`, never `pkill`/`killall`; report every port released and that no Chrome process from the run remains. Do not call any paid API, do not read `.secrets/`, do not touch AWS, do not run a data refresh. When adding the `playwright` dependency, pick an exact version at least two weeks old and record it.

Open the code PR `thejudge-auto/browser-smoke-suite-work` → `main` with `gh pr create --base main --head thejudge-auto/browser-smoke-suite-work`. Register it exactly as the skill's reference.md requires: the `<!-- thejudge-auto:v1:registered:browser-smoke-suite -->` marker in the body and the `[THEJUDGE-AUTO][...] <Feature name> (browser-smoke-suite)` title, moved to `[READY]` when done. The PR body opens with a plain-language summary per `PRD/instructions/plain-language-standard.md` (what a player or the owner gets, first), and ends with:

🤖 Generated with [Claude Code](https://claude.com/claude-code)

End every commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Never merge or close a PR. After pushing, run `gh pr checks <number> --watch` (or poll `gh pr checks`) until every check finishes, and report each check's result, including the new `browser-smoke` job and its run time; if a check fails, diagnose it from its log, fix it, push, and re-check. If the fake-camera assertion is the only thing failing in CI, drop it as the slice doc allows and say so. When the slice is done and checks are green, set `STATUS.ship-ready` per the skill (exactly one marker), move the `PRD/work/STATUS.md` board row fully, and commit and push.

Do not edit `GRAPH-RUN.md`, the README autonomous-metadata or preparation-gate sections, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `scripts/smoke-built-server.mjs`, any `thejudge-*` skill, `.claude/settings*.json`, `.claude/graph-profile.json`, or `CLAUDE.md`. Every file you write must lie inside the working directory above.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. If one path in a `git add` is missing the whole add fails, so check the staged list before committing.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, every path you wrote (absolute), the criteria file state (each id and true/false), the `playwright` version chosen, `npm run quality:check` result with the browser smoke's run time, the PR URL, each `gh pr checks` result, the status marker, final commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), ports released and Chrome processes gone, and `git status --porcelain` of the working directory (must be empty).

### review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 7 (`review`) of build-half graph run `graph-20261019-190721`, attempt 1: a fresh-context, no-write reviewer. You hold no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Read-only git, `gh pr view`/`gh pr diff`/`gh pr checks`, and running tests or the smoke command to confirm behavior are allowed (build output under `.tmp/` is gitignored). If you run `npm run smoke:browser`, confirm afterwards that its ports are free and no headless Chrome from it remains. Your budget is 120 tool calls; verify directly and spawn no subagents.

Subject: code PR https://github.com/ChrisMiho/TheJudge/pull/340 (`thejudge-auto/browser-smoke-suite-work` → `main`), head `02a48a14`. The diff to grade is `git diff origin/main...HEAD` in the working directory. Package artifacts: `PRD/work/browser-smoke-suite/` — `slice-a-browser-smoke-check.md` (the slice doc), `slice-a.criteria.json`, `GAMEPLAN.md`, `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (NFR-021 new, REQ-166 and NFR-012 amended, all accepted by the owner), `QUALITY-CHECK.md`, `evidence/measurements.md`.

Rubric — the slice's own acceptance criteria, quoted:

- A1 `playwright` is an exact-pinned root devDependency and `package-lock.json` records it
- A2 `scripts/smoke-browser.mjs` exists, `npm run smoke:browser` runs it, and it neither imports `scripts/smoke-built-server.mjs` nor any module extracted from it
- A3 `scripts/smoke-built-server.mjs` is unchanged by this slice
- A4 One absolute output path is computed by the script and used for the frontend build, `vite preview`, screenshots and the CI artifact; nothing is written to `apps/frontend/dist/`
- A5 When Chrome cannot launch, the script exits non-zero with a clear message, covered by a unit test
- A6 The not-`Camera unavailable` assertion is a separate droppable function, and a unit test shows the other scanner checks do not depend on it
- A7 `scripts/smoke-browser.test.mjs` passes inside `npm run test:scripts`
- A8 `npm run smoke:browser` passes locally: six steps at both widths, zero console errors, zero failed local requests
- A9 `quality:check` runs `smoke:browser`, and `typecheck`, `lint` and `format:check` pass
- A10 `.github/workflows/quality-check.yml` has the `browser-smoke` job (Node 24, no secrets, no `id-token`, 7-day failure artifact of `.tmp/browser-smoke/`) and `deploy.needs` lists it; `ci-workflow-parity` passes
- A11 The accepted NFR-021, REQ-166, NFR-012, system-map and `runtime-process-hygiene.md` text is in place
- A12 Browser closed, owned servers stopped, ports released after the local run; the output path is recorded
- A13 Nothing the PR ships is under `PRD/work/`

Also check, as stated requirements of the slice and the accepted proposal: the `PRD/sections/` and `runtime-process-hygiene.md` edits carry the intent of each accepted `GATE-QUESTIONS.md` diff against current text (nothing dropped, nothing invented); the script follows the pass rules the slice doc and accepted NFR-021 state (six steps at 390 x 844 and 1280 x 800, fresh context each, 15 s per step, zero console and page errors, no failing local request, outside hosts blocked except the card-image host answered locally, no retries, assertions on visible labels and shapes only); the builder's media-preload exception lets only a media-type cancellation through and still fails every other abort or failure; the builder's Life Tracker near-edge tap still exercises the basic action the brief names; the `eslint.config.mjs` change (ignore `.tmp/**`) hides no shipped file from lint; browser and both servers are stopped on every path; nothing reads `.secrets/`, a paid API, AWS, or a gitignored data dump.

The criteria file was set to `true` by the builder itself; the hook earned no evidence for this run, so treat every `true` as a claim to verify, not as proof. Confirm each criterion against the code and, where it names a command, by running it.

Severity rule: Critical or Important only for a gap that breaks correctness or one of the stated requirements above. A preference, a style note, or an improvement outside the slice's stated requirements is never Critical or Important and never loops back to `build` — rate it Minor.

If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt, and give it no write tools.

Return: `verdict: approve | changes-needed`, one line per criterion A1–A13 (holds / does not hold, with the evidence: command output or file:line), then findings grouped Critical / Important / Minor, each with file:line and the requirement it breaks.

### build (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 6 (`build`) of build-half graph run `graph-20261019-190721`, attempt 2 — a bounded fix after review loop 1 of 2. Follow the `thejudge-implement-all` skill's graph-controlled rules (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/thejudge-implement-all/SKILL.md) for commits, criteria and PR handling, on the package `PRD/work/browser-smoke-suite/`. Work in place on the shared branch `thejudge-auto/browser-smoke-suite-work`, checked out in the working directory above; code PR https://github.com/ChrisMiho/TheJudge/pull/340 is already open. Create no second worktree, branch or PR. Your budget is 400 tool calls; spawn no subagents.

The no-write reviewer returned changes-needed with one Important finding, quoted:

> I1. A failed Ask or Decrypt Stack click kills the script before cleanup (scripts/smoke-browser.mjs:327-331 and :428-432). `page.waitForResponse(...)` is started and left un-awaited while `.click()` runs. If the click fails — the button missing or never enabled — `askQuestion` or `inDepthWalk` throws, the orphaned `answered` promise later rejects with nothing handling it, and Node dies with an uncaught `page.waitForResponse: Timeout exceeded`. No FAIL line for the step, no screenshot, no server output; locally `vite preview` and the backend are left running. Breaks slice item 7.

Fix the behavior, stated as the code must act:
1. When any step fails for any reason — a click that fails, a missing button, a response that never comes, or the 15 s step budget running out — the script prints that step's FAIL line with its console messages, failed requests and both servers' output, saves the step's screenshot under the output folder, then closes the browser and stops both servers, and exits non-zero. No promise the script creates is ever left rejecting without a handler on any path; check every wait in the file, not only the two lines named.
2. The step-budget timer is cleared as soon as its step settles, so a passing run exits right after its last step instead of holding the process open for another 15 s (reviewer Minor M1, `scripts/smoke-browser.mjs:477`).
3. Prove item 1 with a unit test that fails before the fix: drive the step runner (or the extracted helper) with a step whose click rejects, and assert the failure is reported, cleanup ran, and no unhandled rejection fired. Prove item 2 by timing a local `npm run smoke:browser` and reporting the wall-clock time against the printed run time.

Change nothing else in behavior: the six steps, both widths, the pass rules, the media-preload exception and the PRD text stay as they are. Keep every criterion in `slice-a.criteria.json` `true` only if it still holds after your change; re-run `npm run test:scripts`, `npm run smoke:browser`, and the full `npm run quality:check`, and read their output. Stop processes by pid with `kill <pid>`, never `pkill`/`killall`; never a trailing `&` or `nohup`; report ports released and no Chrome left from the run. Do not call any paid API, read `.secrets/`, touch AWS or run a data refresh.

Push to the same branch, then run `gh pr checks 340 --watch` (or poll `gh pr checks 340`) until every check finishes, and report each result; fix and re-push on a failure. Keep the PR title at `[READY]` and the marker in the body. The status marker stays `STATUS.ship-ready`. End every commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never merge or close a PR.

Do not edit `GRAPH-RUN.md`, the README autonomous-metadata or preparation-gate sections, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `scripts/smoke-built-server.mjs`, `PRD/sections/`, any `thejudge-*` skill, `.claude/settings*.json`, `.claude/graph-profile.json`, or `CLAUDE.md`. Every file you write must lie inside the working directory above.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. If one path in a `git add` is missing the whole add fails, so check the staged list before committing.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, every path you wrote (absolute), what changed for I1 and M1 (file:line), the new test names and their before/after result, the criteria file state, `npm run quality:check` result, the smoke's printed time vs wall-clock time, each `gh pr checks 340` result, final commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), ports released and Chrome processes gone, and `git status --porcelain` of the working directory (must be empty).

### review (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 7 (`review`) of build-half graph run `graph-20261019-190721`, attempt 2: a fresh-context, no-write reviewer. You hold no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Read-only git, `gh pr view`/`gh pr diff`/`gh pr checks`, and running tests or the smoke command to confirm behavior are allowed (build output under `.tmp/` is gitignored). If you run `npm run smoke:browser`, confirm afterwards that its ports are free and no headless Chrome from it remains. Your budget is 120 tool calls; verify directly and spawn no subagents.

Subject: code PR https://github.com/ChrisMiho/TheJudge/pull/340 (`thejudge-auto/browser-smoke-suite-work` → `main`), head `99a24150`. The diff to grade is `git diff origin/main...HEAD` in the working directory. Package artifacts: `PRD/work/browser-smoke-suite/` — `slice-a-browser-smoke-check.md` (the slice doc), `slice-a.criteria.json`, `GAMEPLAN.md`, `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (NFR-021 new, REQ-166 and NFR-012 amended, all accepted by the owner), `QUALITY-CHECK.md`, `evidence/measurements.md`.

A previous review returned changes-needed with one Important finding, quoted:

> I1. A failed Ask or Decrypt Stack click kills the script before cleanup (scripts/smoke-browser.mjs, the `page.waitForResponse` started un-awaited before the click in `askQuestion` and `inDepthWalk`). A failed click leaves the response wait rejecting with no handler, so Node dies with an uncaught rejection before the step is reported, the screenshot saved, or the servers stopped. Breaks slice item 7: on failure print the step, console messages, failed requests and both servers' output; save a screenshot; always close the browser and stop both servers, on pass and on fail.

The fix is commit `99a24150` (`git diff 5d8f116c 99a24150`), which also clears the step-budget timer. Confirm I1 is resolved on every failure path the slice names, not only the two call sites, and that no promise the script creates can reject unhandled; a throwaway probe outside the repository is fine. Then grade the whole slice again.

Rubric — the slice's own acceptance criteria, quoted:

- A1 `playwright` is an exact-pinned root devDependency and `package-lock.json` records it
- A2 `scripts/smoke-browser.mjs` exists, `npm run smoke:browser` runs it, and it neither imports `scripts/smoke-built-server.mjs` nor any module extracted from it
- A3 `scripts/smoke-built-server.mjs` is unchanged by this slice
- A4 One absolute output path is computed by the script and used for the frontend build, `vite preview`, screenshots and the CI artifact; nothing is written to `apps/frontend/dist/`
- A5 When Chrome cannot launch, the script exits non-zero with a clear message, covered by a unit test
- A6 The not-`Camera unavailable` assertion is a separate droppable function, and a unit test shows the other scanner checks do not depend on it
- A7 `scripts/smoke-browser.test.mjs` passes inside `npm run test:scripts`
- A8 `npm run smoke:browser` passes locally: six steps at both widths, zero console errors, zero failed local requests
- A9 `quality:check` runs `smoke:browser`, and `typecheck`, `lint` and `format:check` pass
- A10 `.github/workflows/quality-check.yml` has the `browser-smoke` job (Node 24, no secrets, no `id-token`, 7-day failure artifact of `.tmp/browser-smoke/`) and `deploy.needs` lists it; `ci-workflow-parity` passes
- A11 The accepted NFR-021, REQ-166, NFR-012, system-map and `runtime-process-hygiene.md` text is in place
- A12 Browser closed, owned servers stopped, ports released after the local run; the output path is recorded
- A13 Nothing the PR ships is under `PRD/work/`

Also check, as stated requirements of the slice and the accepted proposal: the `PRD/sections/` and `runtime-process-hygiene.md` edits carry the intent of each accepted `GATE-QUESTIONS.md` diff against current text; the script follows the pass rules the slice doc and accepted NFR-021 state (six steps at 390 x 844 and 1280 x 800, fresh context each, 15 s per step, zero console and page errors, no failing local request, outside hosts blocked except the card-image host answered locally, no retries, assertions on visible labels and shapes only); the media-preload exception lets only a media-type cancellation through; browser and both servers are stopped on every path; nothing reads `.secrets/`, a paid API, AWS, or a gitignored data dump.

The criteria file was set to `true` by the builder itself; the hook earned no evidence for this run, so treat every `true` as a claim to verify, not as proof.

Severity rule: Critical or Important only for a gap that breaks correctness or one of the stated requirements above. A preference, a style note, or an improvement outside the slice's stated requirements is never Critical or Important and never loops back to `build` — rate it Minor.

If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt, and give it no write tools.

Return: `verdict: approve | changes-needed`, whether I1 is resolved (with the evidence), one line per criterion A1–A13 (holds / does not hold, with the evidence), then findings grouped Critical / Important / Minor, each with file:line and the requirement it breaks.

### close

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite

You are node 8 (`close`) of build-half graph run `graph-20261019-190721`, attempt 1. Run the `thejudge-cleanup` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite/.claude/skills/thejudge-cleanup/SKILL.md and follow its PR-ready path in graph-controlled mode) on the package `PRD/work/browser-smoke-suite/`, which is `STATUS.ship-ready`. You run on the code branch `thejudge-auto/browser-smoke-suite-work`, checked out in the working directory above, BEFORE the owner merges code PR https://github.com/ChrisMiho/TheJudge/pull/340; the receipt and the package deletion ride in that PR. Your budget is 120 tool calls; spawn no subagents, do not start servers or open a browser.

Durable truth was applied at build (NFR-021 new; NFR-012, REQ-166, the `system-map.md` deploy and cost guardrails entry and the `PRD/instructions/runtime-process-hygiene.md` sentence amended); the reviewer confirmed each matches the accepted `GATE-QUESTIONS.md` text line for line. Confirm it is present and promote only a leftover, never re-write.

Write the receipt under `PRD/instructions/receipts/` named per the skill. Fold `GRAPH-RUN.md`'s `## Node ledger` and `## Instruction ledger` verbatim into its `## Graph run` section, with a `- PR: https://github.com/ChrisMiho/TheJudge/pull/340` line and the summary line `Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/340`. The accepted NFR-021 note cites `evidence/measurements.md` as folded into the receipt at close, so fold its measured figures into the receipt (with the slice's promotion checklist item: the CI time was an estimate until the first run; the first green `browser-smoke` runs took 1m35s, 1m15s, 1m2s and 1m7s on the x86 runner, and the local smoke about 19 s).

Record the review outcome: attempt 1 changes-needed on one Important finding (a failed Ask or Decrypt Stack click crashed the script before cleanup), fixed in `99a24150` with a test that failed before the fix; attempt 2 approve, 0 Critical, 0 Important. Record these Minor follow-ups, one line each:
1. `scripts/smoke-browser.mjs` has no SIGINT/SIGTERM handler; a cancelled CI job or Ctrl-C relies on the OS to kill the child servers.
2. A scanner data file counts as loaded when its response headers arrive, not when its body finishes.
3. The answer check finds the answer by CSS classes (`.msg.judge .conversation-markdown`) rather than a visible label.
4. A failed `import("playwright")` reports Chrome as missing.
5. `scripts/ci-workflow-parity.test.mjs` has no assertion for the `browser-smoke` job or its place in `deploy.needs`, unlike `built-server`.
6. The output folder is recorded only in the run log.
7. A step that runs out of budget keeps running until its context closes (harmless; its late rejection is handled).
8. Player-visible, outside this slice: on a phone, the centre of Player 1's Decrease-life button in Life Tracker is covered by the counters control, so a tap mid-button can miss; the smoke taps the near edge instead and the app was not changed.
Also record that the hook evidence log earned 0 entries for this run, so criteria A1–A13 were set by the builder and the no-write reviewer verified each one independently, and that `playwright` is pinned at 1.63.0 because 1.64.x was under two weeks old.

Then update `PRD/work/STATUS.md` per the skill, and delete `PRD/work/browser-smoke-suite/` with `git rm -r` on that explicit path (the skill refuses the delete if the receipt lacks the `## Graph run` section). Do not edit `PRD/sections/` beyond a confirmed leftover, code, `.github/`, any `thejudge-*` skill, `.claude/settings*.json`, `.claude/graph-profile.json`, or `CLAUDE.md`. Never merge or close the PR.

End every commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>` (or `git rm -r <explicit path>`), then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, the receipt path, the promotion check result, the board change, commit sha, push result (`git ls-remote --heads origin thejudge-auto/browser-smoke-suite-work`), `ls PRD/work/browser-smoke-suite` (must not exist), and `git status --porcelain` of the working directory (must be empty).

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
