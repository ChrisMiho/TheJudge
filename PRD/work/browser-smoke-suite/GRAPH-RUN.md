# Graph run — browser-smoke-suite

- Run ID: `graph-20261019-174628` (rotated 2026-10-19 with owner approval from `graph-20261018-233939`, whose run-state writes the retry guard denied)
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf canary: [graph-boundary] rm -rf is denied in every session; graph canary nohup: denied while a graph run holds the lock)`; after the rotation, lock retaken with `graph-preflight --take-lock --run-id graph-20261019-174628 --pid 98719` and the graph canary `nohup true` denied: `nohup is denied while a graph run holds the lock`
- Autonomous base: `origin/thejudge-auto/browser-smoke-suite` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke` (in-place shape: the session is rooted in this linked worktree; rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-browser-smoke-suite` by the build half's claim)
- Staging: none (no intake files supplied; the request text is recorded verbatim in `IDEA.md`)
- Current node: `define` (attempt 2)
- Next action: `define` attempt 2, then `gate-qc`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | in-place shape in `.worktrees/session-ci-smoke` (switched from the parked, fully pushed `thejudge-auto/ci-built-server-smoke` to `thejudge-auto/browser-smoke-suite`, cut from `origin/main` `071e9a18`); branch pushed (`git ls-remote` → `071e9a18`); porcelain empty; lock `.worktrees/.graph-run.lock` runId `graph-20261018-233939` pid 98719; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/browser-smoke-suite/` (IDEA.md with 8 `## Prior run` lines, 3 ideasForLater citations, the #326 overlap as an open question; README.md; STATUS.ideation) and board row committed `286ffd11`, pushed (`git ls-remote` → `286ffd11`); porcelain empty | 2026-10-18 |
| 3 | define | opus | failed | `0 → 185` | tool-call cap exhausted: cap 150 + 30-call park grace passed (hook denial at call 184); the node ended without a report and without committing. Left untracked and complete through their last sections: `DESIGN-BRIEF.md` (511 lines), `GATE-QUESTIONS.md` (NFR-021 new; REQ-166 and NFR-012 amended with #326-first counting; `## Blocker questions` none), `evidence/measurements.md` (200 lines); marker still `STATUS.ideation`, board row not moved. Calls 183–185 were the driver's own post-node checks, charged to `define/1` because the run state was not reset first. The lock and run state were removed by the owner (`! rm …/.graph-run-state.json …/.graph-run.lock`); the lock was retaken with `graph-preflight --take-lock` and the graph canary `nohup true` was denied (repeat-denial rule: already denied during this run, `nohup-wrapper`). No leftover servers from this run (`ps`); NFR-021 unused in `PRD/sections/`; branch diff vs merge-base touches no `PRD/sections`, `apps`, `scripts` or `.github` | 2026-10-18 |

## Open gate

- Resolved 2026-10-19: the owner approved resuming under a rotated run id (`go`). The record below is kept as the park's history. Before the dispatch, the driver merged `origin/main` (`0f916890`, which includes merged docs PR #326) into the run branch and kept both owner-action board rows.
- Terminal state: PARKED at `owner-action` before `define` attempt 2 was dispatched.
- Question: may the run resume under a rotated run id? The hook's `denied-command-retry` rule now denies every write to `.worktrees/.graph-run-state.json` for run `graph-20261018-233939`, so the driver cannot point the run state at `define/2`.
- Evidence: the driver's `Write` of `.worktrees/.graph-run-state.json` (content `{ "runId": "graph-20261018-233939", "node": "define", "attempt": 2 }`) was denied with `This exact call was already denied during this run (tool-call-cap)`. The original denial was the cap-exhausted `define/1` block on a `Write` to the same path (call 185). `denialKey()` in `scripts/lib/boundary-rules.mjs:760` keys a file-tool denial on tool + path only, and `tool-call-cap` is not in `REMEDIABLE_RULES` (`scripts/lib/boundary-rules.mjs:189`), so a cap denial on the run-state path traps the run id for every later attempt.
- State left: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md` untracked in the working directory, complete through their last sections; `STATUS.owner-action`; board row moved to owner-action.
- Resume: rotate the run id (a new `--run-id` for `graph-preflight --take-lock`, recorded in this header) and dispatch `define` attempt 2 with the prompt recorded below. Separately, the hook fix: scope `tool-call-cap` retry denials to their node/attempt, or exempt the run-state path from the retry guard.

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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
