# Graph run — card-search-and-send-pill

- Run ID: `graph-20261014-031636` (spec-forming half); build half `graph-20261014-034941`
- Profile: `loaded (env sentinel)` — printed by `npm run graph:preflight` at node 1
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill`
- Branch: `thejudge-auto/card-search-and-send-pill-work`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261014-031636/`
- Current node: `review`
- Next action: `/graph-implement PRD/work/card-search-and-send-pill/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/card-search-and-send-pill` pushed (`git ls-remote` → `181b829f`) from `.worktrees/kickoff-card-search-and-send-pill`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261014-031636` | 2026-10-13 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/card-search-and-send-pill/` (IDEA.md, README.md, STATUS.ideation, intake/ ×3) committed `e8af34af`; board row in `PRD/work/STATUS.md` | 2026-10-13 |
| 3 | define | opus | ok | `0 → 113` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (REQ-002, REQ-212, REQ-206 amendments; no blocker), `evidence/measurements.md`, `STATUS.refined` committed `0e7cb914`; no `PRD/sections/` or code diff vs `181b829f` | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS, findings none; `## Preparation gate` in `README.md` committed `7a75d962`; run stops here and parks at `owner-action` | 2026-10-13 |
| 5 | gate-review | sonnet | ok | `0 → 14` | build half run `graph-20261014-034941`: kickoff worktree removed clean (`git worktree remove`); claim commit `6cfd3493` on `thejudge-auto/card-search-and-send-pill-work` cut from `origin/main` `f84e22b1` (docs PR #304 merge), pushed; lock taken from the launch root; universal canary `rm -rf .worktrees/.graph-canary-nonexistent` and graph canary `nohup true` both denied; `graph-gate-review` commit `607591e5`: 3 accept / 0 edit / 0 reject, `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree and launch-checkout porcelain empty | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 9` | build-half re-grade PASS, findings none (two cosmetic non-blocking notes recorded); all five `GATE-QUESTIONS.md` anchors match `PRD/sections/functional-requirements.md` on `573ef8df`; node wrote nothing (porcelain empty, HEAD unchanged); driver rewrote `README.md` `## Preparation gate` | 2026-10-13 |
| 5 | plan | sonnet | ok | `0 → 11` | commit `0a7b1fe0`: `GAMEPLAN.md`, `slice-a-card-search-punctuation.md` + `slice-a.criteria.json` (8 criteria, all false), `slice-b-no-mic-send-pill.md` + `slice-b.criteria.json` (7, all false); `STATUS.active` only marker; board row under active; every file the slices name exists on the branch; no deliverable planned inside `PRD/work/`; process note: node edited with Bash heredocs instead of Write/Edit (self-reported; diff limited to the package and `PRD/work/STATUS.md`) | 2026-10-13 |
| 6 | build | sonnet | ok | `0 → 90` | PR https://github.com/ChrisMiho/TheJudge/pull/305 (`thejudge-auto/card-search-and-send-pill-work → main`, OPEN, READY title, registration marker in body); head `d2b12df3` = `origin/thejudge-auto/card-search-and-send-pill-work` (slice A `2f8d5270`); 22 files vs `9aac0d23` (12 frontend, 3 `PRD/sections/`, package + board); `slice-a.criteria.json` 8/8 and `slice-b.criteria.json` 7/7 true — self-reported (hook evidence log does not see worktree criteria files), evidence quoted in slice status notes; node reports `npm run quality:check` exit 0 and 1595 frontend tests passing; launch-checkout `git status --porcelain` identical before/after (empty); `classifyBuildWrites` over every reported path → `outcome ok, outside []`; worktree porcelain empty; `STATUS.ship-ready` only marker | 2026-10-13 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-002` | accept | — |
| `REQ-212` | accept | — |
| `REQ-206` | accept | — |

### Brief reconciliation

none — all three verdicts are accept, so no `edit` or `reject` needs carrying into `DESIGN-BRIEF.md`, and the README intake pointer needs no supersession note.

## Open gate

- Status: RESOLVED 2026-10-13 — 3 verdicts applied (3 accept, 0 edit, 0 reject); proposal in `GATE-QUESTIONS.md` stands as written.
- Question: answer `GATE-QUESTIONS.md` (`PRD/work/card-search-and-send-pill/GATE-QUESTIONS.md`), then merge to build — three verdict slots: REQ-002 (card search ignores punctuation and accents), REQ-212 (no-mic send pill is one round arrow), REQ-206 (budget ring starts at the top of that round arrow).
- Evidence: gate-qc PASS (`7a75d962`); docs PR: https://github.com/ChrisMiho/TheJudge/pull/304 (`thejudge-auto/card-search-and-send-pill → main`). Terminal state: PARKED.
- Resume: the owner merges the docs PR; `graph-implement` (or `/graph-implement PRD/work/card-search-and-send-pill/`) builds it.

## Dispatch prompts

### preflight

graph is controlling. You are node 1 (`preflight`) of graph run `graph-20261014-031636`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-preflight` skill (Skill tool) and follow it exactly with these inputs:
- --branch thejudge-auto/card-search-and-send-pill
- --slug card-search-and-send-pill
- --run-id graph-20261014-031636
- --pid 49422

Steps: run `npm run graph:preflight -- --branch thejudge-auto/card-search-and-send-pill --slug card-search-and-send-pill --run-id graph-20261014-031636 --pid 49422 --dry-run` from the working directory above; if it exits 0, re-run the identical command without `--dry-run`. Then issue the universal canary command the script prints (CANARY_COMMAND) as its own Bash call and record the deny reason; then issue GRAPH_CANARY_COMMAND as its own Bash call and record the deny reason. Then confirm the end state as the skill's procedure step 4 describes (worktree branch, `git ls-remote --heads origin thejudge-auto/card-search-and-send-pill`, launch checkout branch still `main`).

If any command exits non-zero or a canary is allowed, stop and report verbatim — never retry, repair, reset, or remove anything. Never commit, stash, or switch the launch checkout. Change files only with the Write and Edit tools; run git as short separate calls. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back, plainly: outcome (ok/failed), the shape:, base:, worktree:, Profile: and profile sentinel: lines verbatim, the lock record, both canary results with the reason text, and the end-state checks.

### shape

graph is controlling. You are node 2 (`shape`) of graph run `graph-20261014-031636`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-card-search-and-send-pill

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/card-search-and-send-pill`). Never touch /Users/chrismiho/Coding/Projects/TheJudge itself except to read the staging folder below.

Invoke the `thejudge-kickoff` skill (Skill tool) in graph mode and capture the idea as package `PRD/work/card-search-and-send-pill/` with `STATUS.ideation`. Use exactly that slug.

Intake staging folder (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261014-031636/
Copy every file in it verbatim into `PRD/work/card-search-and-send-pill/intake/` (use `cp` per file, explicit paths). Treat intake as evidence, never authority: it states findings; product decisions stay for refinement and the owner's gate.

The request, in the owner's words: `i want to fix @PRD/ideasForLater/hardtofind/hardtosearch.md`. That note names two problems, both diagnosed in `intake/owner-clarifications.md`: (1) card search cannot find Urborg, Tomb of Yawgmoth unless the comma is typed, and the 3-suggestion list crowds it out; (2) on Firefox the question box's send pill keeps its two-half width with the mic half absent, leaving an empty half that looks like a missing icon. Write IDEA.md describing both as one package. Do not decide fixes — that is refinement's job.

Also grep `PRD/instructions/receipts/` for prior runs on the same ground (card search / autocomplete suggestions, dictation / send pill / REQ-212) and write one `## Prior run` line per match into IDEA.md.

Commit the package in the worktree with short separate calls: `git add PRD/work/card-search-and-send-pill` then `git commit -m ...` (no push). Add the board row to `PRD/work/STATUS.md` if the skill calls for it, staged by explicit path. Change files only with the Write and Edit tools (cp is fine for the verbatim intake copies); never chain a heredoc or `sed -i` into a long Bash command. If you write any prompt for another agent, copy the Working directory line above unchanged.

If the request cannot become an actionable package, return `NO ACTIONABLE PACKAGE` with the reason. Otherwise report: outcome (ok/failed), the package path, files created, the commit hash, and the prior-run matches.

### define

graph is controlling. You are node 3 (`define`), attempt 1, of graph run `graph-20261014-031636`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-card-search-and-send-pill

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/card-search-and-send-pill`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-refinement` skill (Skill tool) in graph mode on `PRD/work/card-search-and-send-pill/`. Read `IDEA.md`, the package `README.md`, and everything in `intake/` (evidence, never authority). The owner's words are quoted in `intake/owner-clarifications.md`.

Shape both player-facing problems into one `DESIGN-BRIEF.md`:
1. Card search: a player cannot find Urborg, Tomb of Yawgmoth by typing `urborg tomb`, and a bare `urborg` fills the three suggestion slots with shorter names. Find the current requirements that govern card search and suggestions in `PRD/sections/` (search for the suggestion cap, typo tolerance, and the minimum query length REQ-167 cites) and every surface that uses `apps/frontend/src/lib/search.ts` or a sibling search (for example `apps/frontend/src/lib/trade/oracleSearch.ts`), so the brief covers every card search a player meets, or says which it leaves out and why.
2. Send pill on browsers without speech recognition: REQ-212 already says that where the browser lacks speech recognition the pill is the arrow alone and nothing else changes; the intake shows the render keeps the two-half width (`.send-wrap` fixed width in `apps/frontend/src/styles/flow.css`, the ring path `SEND_RING_PATH` in `apps/frontend/src/components/ComposerPill.tsx`). Check every question box REQ-212 lists (Ask a Question, its follow-up, In-depth details' question and its follow-up).

Measure before you assert: run the real search function against `apps/frontend/public/data/cardMetadata.json` for any query you cite, and observe the send pill in a browser rather than inferring layout from code (a Chromium page with `window.SpeechRecognition` and `window.webkitSpeechRecognition` set to undefined before load reproduces the Firefox path; a dev server can run from this worktree on a free port, stopped when you are done). Put screenshots under `PRD/work/card-search-and-send-pill/.playwright-mcp/` and close the browser when finished.

Apply the assumption ladder per question as it arises; decide nothing on the owner's behalf that the genuine-blocker test reserves for them. Do not edit `PRD/sections/` or any code. When the brief needs product-truth changes, write `PRD/work/card-search-and-send-pill/GATE-QUESTIONS.md` in the contract's format: one `## <STABLE-ID>` block per new or changed stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no), then the complete proposed diff, then `- Verdict:` and `- Reason:` slots left blank; a trailing `## Blocker questions` section only for genuine blockers.

Set the package status marker the skill prescribes (`STATUS.refined` when the brief is complete). Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: outcome (ok/failed), files written, the stable IDs proposed (with one plain sentence each), the measurements you took, and the commit hash.

### gate-qc

graph is controlling. You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261014-031636`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-card-search-and-send-pill

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/card-search-and-send-pill`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-quality-check` skill (Skill tool) in graph mode on `PRD/work/card-search-and-send-pill/DESIGN-BRIEF.md`. Grade the brief together with `GATE-QUESTIONS.md` (the proposed amendments to REQ-002, REQ-212 and REQ-206, still unanswered by the owner — an unanswered verdict slot is expected at this stage, not a finding), `evidence/measurements.md`, `IDEA.md` and `intake/`, against current `PRD/sections/` truth and agent-readiness. Produce the PASS/FAIL report the skill prescribes, with the complete findings list on FAIL. Do not write a GAMEPLAN or slice docs, and do not edit `PRD/sections/` or code.

Write the report and any status marker change the skill prescribes inside the package. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: PASS or FAIL, the complete findings list, files written, and the commit hash.

### gate-review

graph is controlling. You are the gate-resolution step (before node 5) of the build half of graph run `graph-20261014-034941`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill

Work only inside that directory (the build worktree, on branch `thejudge-auto/card-search-and-send-pill-work`, cut from `origin/main`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `graph-gate-review` skill (Skill tool) on `PRD/work/card-search-and-send-pill/`. The owner answered `GATE-QUESTIONS.md` in docs PR #304 and merged it: REQ-002, REQ-212 and REQ-206 are each marked accept. Apply those verdicts inside `GATE-QUESTIONS.md` as the skill prescribes (finalize the proposal in the work folder; never edit `PRD/sections/` or code), record the verdicts, and reconcile `DESIGN-BRIEF.md` and the README's intake pointer to every edit or reject — with three accepts, the reconciliation is expected to be empty; say so explicitly. Restore `STATUS.refined` as the only marker and move the `PRD/work/STATUS.md` board row to match (remove from the old section, add to the new one). In `GRAPH-RUN.md`, write only what the skill prescribes there (`## Gate verdicts` with its `### Brief reconciliation` list, and `## Open gate` marked resolved); leave the header, `## Node ledger`, `## Dispatch prompts` and `## Instruction ledger` to the driver.

Verify directly; spawn no subagents or forks, and do no sleeping or polling. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: the verdict per ID, the `### Brief reconciliation` list (or none), files written, and the commit hash.

### gate-qc (build half, attempt 1)

graph is controlling. You are node 4 (`gate-qc`), attempt 1, of the build half of graph run `graph-20261014-034941`, re-grading after gate resolution.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill

Work only inside that directory (the build worktree, on branch `thejudge-auto/card-search-and-send-pill-work`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-quality-check` skill (Skill tool) in graph mode on `PRD/work/card-search-and-send-pill/DESIGN-BRIEF.md`. Grade the brief together with the finalized `GATE-QUESTIONS.md` (the owner accepted all three amendments: REQ-002, REQ-212, REQ-206), `evidence/measurements.md`, `IDEA.md` and `intake/`, against current `PRD/sections/` truth on this branch and agent-readiness. Check that every diff anchor in `GATE-QUESTIONS.md` still matches current `PRD/sections/` text (the branch is cut from today's `origin/main`). Produce the PASS/FAIL report the skill prescribes, with the complete findings list on FAIL. Do not write a GAMEPLAN or slice docs, and do not edit `PRD/sections/`, code, or the README's `## Preparation gate` section (the driver owns it).

Verify directly; spawn no subagents or forks, and do no sleeping or polling; stay well under 60 tool calls. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: PASS or FAIL, the complete findings list, files written (if any), and the commit hash (if any).

### plan

graph is controlling. You are node 5 (`plan`), attempt 1, of the build half of graph run `graph-20261014-034941`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill

Work only inside that directory (the build worktree, on branch `thejudge-auto/card-search-and-send-pill-work`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-map-out` skill (Skill tool) in graph mode on `PRD/work/card-search-and-send-pill/`. The README's `## Preparation gate` records `Quality-check: PASS` (driver-written, 2026-10-13 re-grade); verify it there before writing anything. Slice the approved `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md` (REQ-002, REQ-212, REQ-206 accepted) into `GAMEPLAN.md`, lettered `slice-<letter>.md` docs, and one `slice-<letter>.criteria.json` beside each slice with every criterion `false` and an evidence block, as the skill and its reference prescribe. Each slice that changes product behavior must say that `build` applies its share of the accepted `PRD/sections/` amendments by intent, together with the code, in the same PR. Set `STATUS.active` as the only marker and move the `PRD/work/STATUS.md` board row to match (remove from the old section, add to the new one).

Placement rule: `node 8` deletes `PRD/work/card-search-and-send-pill/` before the merge, so no deliverable (code, test, doc, screenshot meant to ship) may be planned to land inside `PRD/work/`. Disposable verification captures may go under `PRD/work/card-search-and-send-pill/.playwright-mcp/`.

Verify directly; spawn no subagents or forks, and do no sleeping or polling; stay well under 120 tool calls. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: the slices (letter, one plain sentence each, files they touch), the criteria count per slice, files written, and the commit hash.

### build

graph is controlling. You are node 6 (`build`), attempt 1, of the build half of graph run `graph-20261014-034941`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill

Shared branch: `thejudge-auto/card-search-and-send-pill-work` (already checked out in that worktree; autonomous base `origin/main`). Work in place in that worktree: create no second worktree and no contributor branch. Never write to /Users/chrismiho/Coding/Projects/TheJudge itself or anywhere outside the worktree; every absolute path you write must start with the Working directory above, and the package folder is `PRD/work/card-search-and-send-pill/` inside it.

Invoke the `thejudge-implement-all` skill (Skill tool) in graph mode on `PRD/work/card-search-and-send-pill/` and complete slices A and B in order, per `GAMEPLAN.md` and each slice doc. Apply product truth at build: each slice writes its share of the accepted `PRD/sections/` amendments by intent (re-derived from the finalized `GATE-QUESTIONS.md` diff and `DESIGN-BRIEF.md` against current truth, never a blind replay), together with the code, in the same PR. Open the code PR `thejudge-auto/card-search-and-send-pill-work` into `main` as the skill prescribes, with the `thejudge-auto:v1:registered:card-search-and-send-pill` registration marker in the body and a `[THEJUDGE-AUTO]` title in the reference format; set the title to READY when both slices are done. Never merge or close a PR. When both slices are complete, set `STATUS.ship-ready` as the only marker and move the `PRD/work/STATUS.md` board row to match (remove from the old section, add to the new one).

Setup: the worktree has no `node_modules`; run `npm ci` at the worktree root first. Browser checks (Playwright MCP): start your own dev server on a free port from inside the worktree, write captures only under `PRD/work/card-search-and-send-pill/.playwright-mcp/`, call `browser_close` when done, and stop the server you started with plain `kill <pid>`. To test the no-speech path in Chromium, set both SpeechRecognition globals to undefined with an init script before page load (see `evidence/measurements.md`).

Criteria: the hook-side evidence log does not see this worktree's criteria files, so a criterion flipped to true here is self-reported. For every criterion, run the real check and keep its actual output (command and result line, or the capture path and the measured value); quote that evidence in the slice doc's status notes. Set a criterion true only after its check passed, never on a check that merely ran. Run `npm run quality:check` before the final push.

Verify directly; spawn no subagents or forks, and do no sleeping or polling loops. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>` (never `-A`, `--all` or `.`), then `git commit -m ...`, then `git push -u origin thejudge-auto/card-search-and-send-pill-work`. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: per slice, what a player now sees, the files changed, each criterion with its evidence, the PR URL, the final commit hash, and the complete list of every file path you wrote or created (absolute paths).

### review

graph is controlling. You are node 7 (`review`), attempt 1, of the build half of graph run `graph-20261014-034941`: a fresh-context, no-write reviewer.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-card-search-and-send-pill

You hold no write tools and must create, modify or delete nothing: no file writes through Bash either, no git commits, no pushes, no PR comments. Reading, searching, `git diff`/`git log`/`git show`, and running tests are allowed.

What to review: the code PR https://github.com/ChrisMiho/TheJudge/pull/305, which is `git diff 9aac0d23 d2b12df3` in that worktree (branch `thejudge-auto/card-search-and-send-pill-work`). Read the slice docs `PRD/work/card-search-and-send-pill/slice-a-card-search-punctuation.md` and `slice-b-no-mic-send-pill.md`, `GAMEPLAN.md`, `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (REQ-002, REQ-212, REQ-206 accepted by the owner), and `evidence/measurements.md`.

Rubric: each slice's own acceptance criteria, quoted here.

Slice A:
- A1 `search.test.ts` covers `urborg tomb` and `urborg t` returning Urborg, Tomb of Yawgmoth first; `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul`, `fire ice` finding their card; `sol ring`, `lightning bolt`, `urborg`, `urborg, tomb`, `lim-dûl` unchanged; `_____` still finding the blank-named card; `,,,` reaching no search
- A2 `oracleSearch.test.ts` covers the same queries on the Trade Balancer search with its list of eight, and imports `normalize` rather than copying it
- A3 `ZoneCollectionStep.test.tsx` shows 'No matching card found' at threshold with no match
- A4 Corpus re-run: first-two-words recall at or above 7,052 of 7,288 and whole-name 7,324 of 7,324 (method in `evidence/measurements.md` section 1)
- A5 Frontend test suite passes
- A6 REQ-002 in `PRD/sections/functional-requirements.md` carries the accepted amendment and `system-map.md` names the rule and `oracleSearch.ts`
- A7 Browser: In-depth details Cards step shows Urborg, Tomb of Yawgmoth for `urborg tomb` and 'No matching card found' for a nonsense name; Ask a Question and Trade Balancer also find it
- A8 Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/card-search-and-send-pill/.playwright-mcp/`

Slice B:
- B1 `ComposerPill.test.tsx` without the speech API: one 44px round send control, wrapper 44px, no microphone control; with the API: unchanged
- B2 Component tests for each of the four boxes without the speech API (FollowUpComposer, EnrichmentStep, quick-lookup, conversation workspace) show no empty half
- B3 Ring path without speech is a circle starting at the top, clockwise; with speech the stadium path is unchanged
- B4 Frontend test suite passes
- B5 REQ-212 and REQ-206 in `PRD/sections/functional-requirements.md` and the `quick-lookup/README.md` ring line carry the accepted amendments
- B6 Browser with both speech objects removed before load: in all four boxes the send control and its wrapper are each 44px wide, ring circles the arrow; with speech the pill is 88x44 mic left, arrow right; screenshots recorded
- B7 Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/card-search-and-send-pill/.playwright-mcp/`

Distrust the `true` marks in `slice-a.criteria.json` and `slice-b.criteria.json`: they are self-reported by the builder. Re-verify independently: run `npm --workspace apps/frontend run test` yourself; read the `normalize` change and check each accepted REQ-002 rule (lower-case, accents folded, hyphen and slash to space, other non letter/digit/space/underscore characters dropped, spaces collapsed, underscore kept, thresholds counted after normalization, ranking and list lengths unchanged); confirm `oracleSearch.ts` shares the rule rather than copying it; read the ComposerPill and CSS change against REQ-212/REQ-206 for both the no-speech and speech paths; and compare each `PRD/sections/` edit against the accepted `GATE-QUESTIONS.md` diff by intent. The PNG captures under `.playwright-mcp/` are gitignored and present on disk; you may view them.

Severity rule: flag only gaps against these stated criteria or correctness defects that affect them. A preference, a style note, or an improvement outside the slice's stated requirements is never Critical or Important and never loops the run back to `build`; list such items as Minor at most.

Verify directly; spawn no subagents or forks, and do no sleeping or polling; stay well under 120 tool calls. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: a verdict (APPROVE, or CHANGES REQUIRED), then each finding with severity (Critical, Important, Minor), the criterion it breaks, file and line, and the evidence; then what you independently re-ran and its result.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "i want to fix @PRD/ideasForLater/hardtofind/hardtosearch.md" | answered-once | shape | — |
| "the button that is broken is the voice button in the question box, it just doesnt show" | answered-once | shape | — |
| "so the issue is that the button looks like its there, but the text/icon on the box isnt there, is there anyway we can confirm this on our end?" | answered-once | shape | — |
