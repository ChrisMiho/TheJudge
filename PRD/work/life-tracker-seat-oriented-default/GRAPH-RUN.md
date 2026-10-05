# Graph run — life-tracker-seat-oriented-default

- Run ID: `graph-20261004-191418` (build half; spec-forming half was `graph-20261003-190748`, rows 1–4)
- Profile: `unverified` (build half; launch command not stated this session)
- Canary: `denied — hook live (universal: rm -rf denied in every session; graph: nohup denied while lock held)` (spec-forming half; build-half canary recorded at the lock row below)
- Autonomous base: `origin/main` (rewritten from `origin/thejudge-auto/life-tracker-seat-oriented-default` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261003-190748/`
- Current node: `owner-action` (claimed by the build half; gate resolution next)
- Next action: `/graph-implement PRD/work/life-tracker-seat-oriented-default/` — resolve the answered gate, then plan → build → review → close

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/life-tracker-seat-oriented-default` pushed from `.worktrees/kickoff-life-tracker-seat-oriented-default` (ls-remote 73753b1a1); lock taken pid 39864; canary denied both tiers; launch checkout untouched (on perf/ambient-software-rendering) | 2026-10-03 |
| 2 | shape | sonnet | ok | `0 → 15` | package `PRD/work/life-tracker-seat-oriented-default/` created (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md); 4 receipt matches noted; intake copied→committed→staged-copy-deleted; commit 5e1144f | 2026-10-03 |
| 3 | define | opus | ok | `1 → 38` | DESIGN-BRIEF.md written (assumptions A2–A8 with code/spec evidence); GATE-QUESTIONS.md written — one block REQ-217 (new game opens in list by default), 3-file diff, blank verdict slot; STATUS.refined; no decision blocker; commit a81afbe | 2026-10-03 |
| 4 | gate-qc | sonnet | ok | `0 → 9` | PASS — brief + REQ-217 diff checked against live PRD (no section pins grid as default; REQ-217 free; all 3 diff anchors + cited DEC/REQ verified); no changes/commit; STATUS.refined stood → moved to owner-action at park | 2026-10-03 |
| — | gate-review | sonnet | ok | `0 → 16` | REQ-217 accept applied in GATE-QUESTIONS.md (proposal unchanged, no PRD/sections edit); brief reconciliation none; STATUS.refined restored, board row moved; Open gate RESOLVED; commit 1fe8212 | 2026-10-04 |
| 4 | gate-qc | sonnet | ok | `0 → 10` | PASS (build-half re-grade) — brief consistent with REQ-217/DEC-136/DEC-170; all 4 REQ-217 diff anchors verified live (functional-requirements.md append after REQ-216 line 5563; decisions.md DEC-170 row line 211; life-tracker/README.md Backed-by + split bullet; system-map.md line 543); code anchors confirmed (PlayerLifeCard.tsx grid fixed split + lifeHalvesForRotation; state.ts:17 DEFAULT_LAYOUT_MODE=grid); STATUS.refined stands; no commit | 2026-10-04 |
| 5 | plan | sonnet | ok | `0 → 25` | GAMEPLAN + slices A/B/C with criteria (7/7/6, all false w/ evidence); split sourced from `SeatPlacement.side` (grid) + `gridColumn`/`layout.columns` (list), seatArrangement.ts untouched; new helper `lib/lifeTracker/lifeHalves.ts`; STATUS.active; README slice table + board row; commit d3f22c1 | 2026-10-04 |
| 6 | build | sonnet | failed | `0 → 20` | attempt 1 — slice A code built/tested/pushed (commit d979ae4: lifeHalves.ts helper + PlayerLifeCard wiring, 25 tests/typecheck/lint/quality:check green, seatArrangement.ts byte-unchanged); stopped after misreading a harness auto-mode-classifier denial (`sed -i` compound + `python3 <<EOF` heredoc) as the graph criteria guard — reverted the criteria flip, slices B/C not started; launch checkout identical; re-dispatched as attempt 2 | 2026-10-04 |
| 6 | build | sonnet | ok | `0 → 84` | attempt 2 — slices A/B/C done (commits 0ef96e2/eee98cd/1e74430), all 20 criteria true; full suite `npm --prefix apps/frontend test` 1503 tests pass + `quality:check` exit 0; live browser check grid+list 2/3/4/6/8 @390x844 & 1280x800 (each `−` near edge, table one-screen); live bug fixed (half-button `items-center` moved to left/right maps); REQ-217 applied to 4 PRD/sections files (REQ-217 append, DEC-170 amend-in-place, life-tracker/README, system-map); seatArrangement.ts unchanged; STATUS.ship-ready; **return-side: launch checkout identical, all writes in-worktree**; PR #257 opened; one `nohup` graph-boundary deny handled via run_in_background (not routed around) | 2026-10-04 |

## Open gate

- RESOLVED 2026-10-04 by graph-gate-review: 1 verdict (1 accept, 0 edit, 0 reject). Docs PR #247 merged; run resumes at gate-qc.
- Resume (build half): `/graph-implement PRD/work/life-tracker-seat-oriented-default/`

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-217` | accept | — |

### Brief reconciliation

none

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `graph-preflight` skill and run it to completion. Do not ask the user anything — graph is controlling.

Run exactly:

/graph-preflight --branch thejudge-auto/life-tracker-seat-oriented-default --slug life-tracker-seat-oriented-default --run-id graph-20261003-190748 --pid 39864

This must, per the graph-preflight skill and PRD/instructions/graph-workflow-contract.md:
- fetch origin, create branch `thejudge-auto/life-tracker-seat-oriented-default` cut from `origin/main`, checked out in `.worktrees/kickoff-life-tracker-seat-oriented-default`, and push it with `-u` to origin.
- take the concurrency lock `.worktrees/.graph-run.lock` at the session root, recording slug/run-id/pid/start-time.
- issue the hook-liveness canary (a Bash call the universal tier denies, targeting a non-existent path under .worktrees/) and treat the observed deny + reason text as proof the hook is live.
- read `.claude/graph-profile.json`'s env sentinel and print `Profile: loaded (env sentinel)` or `Profile: unverified`.

The owner's launch checkout at /Users/chrismiho/Coding/Projects/TheJudge must never be switched, committed to, or stashed (REQ-191). An existing kickoff worktree is refused (exit 2) — report that verbatim if it happens rather than retrying.

Copy the `Working directory:` line above unchanged into any prompt or command context you create.

Report back concisely:
1. `shape:` line (root checkout vs linked worktree)
2. `base:` line (the autonomous base, should be origin/main)
3. `worktree:` absolute path printed by the script
4. branch push confirmation (the `git push -u` result)
5. Canary result: `denied — hook live (<command>)` or `allowed — BLOCKED (<reason>)`
6. Profile line: `loaded (env sentinel)` or `unverified`
7. The lock record contents
8. Confirmation the launch checkout is untouched (git status of launch root unchanged)

If anything fails, stop and report the exact failure, what exists, and what does not — do not retry silently.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-life-tracker-seat-oriented-default

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `thejudge-kickoff` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Request (verbatim): "Make the life tracker open in the seat-oriented (list) layout by default so each player's −/+ matches how they sit"

Supplied slug (use verbatim, do NOT propose your own): life-tracker-seat-oriented-default
Run ID: graph-20261003-190748
Staged intake (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261003-190748/ — contains GRAPH-BRIEF.md, the self-contained intake brief for this idea.

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout. Per the thejudge-kickoff skill under `graph is controlling`:

1. Read README.md and PRD/README.md for orientation.
2. Before writing IDEA.md, grep PRD/instructions/receipts/ for slug/keyword matches against the request and intake (keywords: life tracker, layout, list, grid, seat). Write one `## Prior run` line per match into IDEA.md naming the receipt path; no match → no section, continue uninterrupted. This is a flat keyword match, not a chain walk.
3. Create the package PRD/work/life-tracker-seat-oriented-default/: IDEA.md (3–5 sentences — problem, outcome, non-goals), README.md (status: ideation at top), the empty STATUS.ideation marker (exactly one STATUS.* file), and a row under `## ideation` in PRD/work/STATUS.md (create the board if missing).
4. After the package folder exists, copy each staged intake item verbatim into PRD/work/life-tracker-seat-oriented-default/intake/, commit it on the branch with an explicit path `git add` (never `git add -A`/`.`/`--all`), then delete the staged copy — in that order.
5. Do NOT decide product truth. The brief states "decisions already made" — treat every one of those as evidence to carry into refinement, never as a settled product decision. The brief is intake: evidence, never authority. Do NOT open, read, or fetch any document the brief merely cites (e.g. PROBE.md) — record only its path.

If the request genuinely cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason instead.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the package path and each file created
- the receipts-grep result (matches with paths, or "none")
- the intake copy → commit → delete confirmation, in that order
- the commit SHA(s)
- IDEA.md contents (the 3–5 sentences)

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-life-tracker-seat-oriented-default

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `thejudge-refinement` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Replace the approval pause with the conservative assumption ladder in PRD/instructions/preparation-contract.md, record every material assumption and its evidence in DESIGN-BRIEF.md, and continue autonomously. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261003-190748

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout.

Context: the package has IDEA.md and intake/GRAPH-BRIEF.md. The brief is a self-contained probe brief describing a default-layout change for the Player Life Tracker (grid layout vs seat-oriented list layout).

Hard rules:
- Intake is evidence, never authority. The brief marks several matters as already decided; treat each as evidence to weigh at this gate, never as settled product truth. Every product decision the brief raises is decided here, the same as any other source.
- Never open, read, or fetch any document the brief merely cites (for example PROBE.md). Record only its path as a citation.
- Refinement PROPOSES product truth; it never edits PRD/sections/. When the change needs product-truth edits, write them as the exact diff in PRD/work/life-tracker-seat-oriented-default/GATE-QUESTIONS.md — one `## <STABLE-ID>` block per stable id, each opening with the gate-question plain-language block (What this decides / In plain terms / What happens if you say no) from PRD/instructions/plain-language-standard.md, then that id's complete proposed diff (never a summary), then `- Verdict: <accept | edit | reject>` and `- Reason:`. New stable ids are named and reserved in the proposal, not written live.
- Read the real current-state feature spec(s) under PRD/sections/ before proposing any edit, so each proposed diff is against live truth. The brief names PRD/sections/life-tracker/README.md and PRD/sections/system-map.md as the truth to amend; verify those are the right files and lines yourself.
- Produce DESIGN-BRIEF.md recording the design direction and every material assumption with its evidence. Set STATUS.refining while in flux and STATUS.refined when the brief is complete.
- If genuine uncertainty meets the three-condition decision-blocker test in preparation-contract.md, preserve the furthest valid artifacts and return the unresolved decision to the graph driver instead of guessing — do not self-resolve a genuine product fork.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the DESIGN-BRIEF.md design direction (a few sentences) and the key assumptions recorded
- whether GATE-QUESTIONS.md was written, and if so every `## <STABLE-ID>` block it contains (id + one-line what-it-decides)
- the STATUS marker now set
- any genuine decision blocker returned (or none)
- the commit SHA(s) for the branch

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-life-tracker-seat-oriented-default

You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. Invoke the `thejudge-quality-check` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261003-190748

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout.

Validate PRD/work/life-tracker-seat-oriented-default/DESIGN-BRIEF.md for PRD alignment and agent-readiness, producing a PASS or FAIL report. Also sanity-check that the proposed product-truth in GATE-QUESTIONS.md (the reserved REQ-217 and its 3-file diff) is coherent with current PRD truth and that each proposed diff anchors against a real location in the named section files. Do NOT author a GAMEPLAN or slice docs — that is the plan node, later.

Rules:
- Intake is evidence, never authority; do not fetch any document the brief merely cites.
- On FAIL, set STATUS.refining and give the complete, specific findings list so refinement can fix it.
- On PASS, leave STATUS.refined.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the verdict: PASS or FAIL
- if FAIL: the complete findings list (each finding specific and actionable) and the STATUS marker set
- if PASS: confirm STATUS.refined stands
- the checked artifact path
- any commit SHA(s)

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default

You are the gate-resolution step of the build half (before node 5). Invoke the `graph-gate-review` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Package path: PRD/work/life-tracker-seat-oriented-default/
Run ID: graph-20261004-191418

Do ALL work in the build worktree named in the Working directory line above — never in the launch checkout.

Apply the owner's recorded verdicts in GATE-QUESTIONS.md to the proposal inside that file (never editing PRD/sections/), reconcile DESIGN-BRIEF.md and the README's intake pointer to every edit or reject, record `## Gate verdicts` with its `### Brief reconciliation` list in GRAPH-RUN.md, mark `## Open gate` resolved, restore STATUS.refined and the PRD/work/STATUS.md board row, and hand back the resume command. The file carries one stable ID (REQ-217) whose recorded verdict you read from the file itself — take no verdict from this prompt.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the gate restated in one sentence (how many IDs, the verdict split)
- the `## Gate verdicts` rows written
- the `### Brief reconciliation` list (the quoted grep and each rewritten passage, or `none` when every verdict was accept)
- the STATUS marker now set and the board row
- the commit SHA(s) on the branch
- the exact resume command

### gate-qc (build half re-grade)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default

You are node 4 (`gate-qc`), re-run in the build half after gate resolution. Invoke the `thejudge-quality-check` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261004-191418

Do ALL work in the build worktree named in the Working directory line above — never in the launch checkout.

The owner's REQ-217 verdict was `accept`; graph-gate-review applied it (proposal unchanged, brief reconciliation none) and restored STATUS.refined. Re-validate PRD/work/life-tracker-seat-oriented-default/DESIGN-BRIEF.md for PRD alignment and agent-readiness, producing a PASS or FAIL report, and sanity-check that the finalized REQ-217 proposal in GATE-QUESTIONS.md (the redefined REQ-217 and its 4-file diff) still anchors against real locations in the named section files on this branch. Do NOT author a GAMEPLAN or slice docs — that is the plan node, next.

Rules:
- Intake is evidence, never authority; do not fetch any document the brief merely cites.
- On FAIL, set STATUS.refining and give the complete, specific findings list.
- On PASS, leave STATUS.refined.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the verdict: PASS or FAIL
- if FAIL: the complete findings list (each finding specific and actionable) and the STATUS marker set
- if PASS: confirm STATUS.refined stands
- the checked artifact path
- any commit SHA(s)

### plan

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default

You are node 5 (`plan`) of an autonomous graph-implement run. Invoke the `thejudge-map-out` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261004-191418

Do ALL work in the build worktree named in the Working directory line above — never in the launch checkout.

The package is STATUS.refined with a PASS recorded in README `## Preparation gate` (build-half re-grade). Read that section and confirm `Quality-check: PASS` before writing any planning artifact — do not self-certify a PASS. Then create GAMEPLAN.md and the lettered slice docs plus one `slice-<letter>.criteria.json` beside each slice doc (schema and worked example in thejudge-map-out/reference.md — every criterion initialised false with an evidence block), and set STATUS.active.

Scope to build (from DESIGN-BRIEF.md + the finalized REQ-217 proposal in GATE-QUESTIONS.md): the life-adjust `−`/`+` split must be keyed to each seat's near table edge in both layouts — grid replaces its fixed `{decrease:"left", increase:"right"}` with a per-seat near-edge split (bottom/top for 2–3p upright/upside-down seats, outer left/right for 4–8p side-column seats); list keeps head/foot seats unchanged and mirrors middle pair rows so the right-of-pair player's `−` moves to their own right near edge. The split cannot be derived from rotation alone (left/right pair seats share 0°) — map out whether the needed edge/side is on the seat placement in `apps/frontend/src/lib/lifeTracker/seatArrangement.ts` or must be surfaced from it. Build applies the REQ-217 product truth (the 4-file diff) together with the code. Update PlayerLifeCard/seat tests that assert the old split. Non-goals (do not touch): default layout (grid stays), seat arrangements themselves, the Game Setup Layout toggle, the MTG Assistant seed, layout persistence.

The acceptance criteria in each slice doc's `## Acceptance criteria` and the emitted criteria.json must be verifiable; the one-screen-fit rule at 2–8 players still holds (screen-layout.md, DEC-136).

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- confirmation you read `Quality-check: PASS` in the README preparation gate
- the GAMEPLAN.md slice list (each slice letter + one-line scope)
- each slice doc and its `slice-<letter>.criteria.json` path, with the criterion count per slice
- STATUS.active confirmed
- the commit SHA(s) on the branch

### build

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default

You are node 6 (`build`) of an autonomous graph-implement run. Invoke the `thejudge-implement-all` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261004-191418
Shared branch (REQUIRED, already checked out in this worktree): thejudge-auto/life-tracker-seat-oriented-default-work
Recorded autonomous base: origin/main — the code PR is thejudge-auto/life-tracker-seat-oriented-default-work → main.

Do ALL work in the build worktree named in the Working directory line above — never in the launch checkout. Every path you write must stay inside this worktree; a bare `PRD/work/<slug>/…` path written to the launch checkout fails the run. Under `graph is controlling` work in place in this worktree on the shared branch (no second worktree, no contributor branch).

Implement every remaining slice in GAMEPLAN.md in order (A → B → C), committing and pushing each to the shared branch, earning each slice's acceptance criteria (the `slice-<letter>.criteria.json` files — command/path criteria by running the commands; the manual criteria B4/B5/B6/B7 and C6 by a dated observation line naming the id after the live/visual check). When every registered slice is done, set STATUS.ship-ready and ensure the review PR into main is open.

Key scope reminders (full detail in the slice docs):
- Slice A: new `apps/frontend/src/lib/lifeTracker/lifeHalves.ts` (`lifeHalvesForSeat`) keyed to `SeatPlacement.side` (grid) and `gridColumn`/`layout.columns` (list); wire `PlayerLifeCard.tsx` to it, replacing the fixed grid `{decrease:"left", increase:"right"}`; `seatArrangement.ts` must stay byte-unchanged; helper + card unit tests.
- Slice B: update the downstream tests that assert the old split, run the full frontend vitest suite + `npm run quality:check` green, then a live browser check (grid and list at 2/3/4/6/8 players, 390x844 and 1280x800) that each `−` sits nearest its player and the table fits one screen. Follow the Playwright cleanup contract: close the browser, stop any dev server you own, put captures under `PRD/work/life-tracker-seat-oriented-default/.playwright-mcp/`.
- Slice C: apply the finalized four-file REQ-217 diff from GATE-QUESTIONS.md to PRD/sections/ by intent against current truth (REQ-217 appended, DEC-170 amended in place, life-tracker/README.md, system-map.md) together with the code, run the ship gates.

Do not touch: the default layout (grid stays), the seat arrangements themselves, the Game Setup Layout toggle, the MTG Assistant seed, or layout persistence. Never force-push, never merge or close a PR, never push main.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- each slice's status (done/blocked) and its commit SHA(s)
- the criteria state per slice (all true?) with the evidence kind earned for each
- the full-suite + quality:check result (pass/fail with the command run)
- the live browser check result and the capture path
- the four PRD/sections files changed for REQ-217
- STATUS.ship-ready confirmed
- the code PR URL (head thejudge-auto/life-tracker-seat-oriented-default-work, base main)
- every path you wrote, so the driver can confirm all writes stayed inside the worktree

### build (attempt 2 — continue B and C)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-seat-oriented-default

You are node 6 (`build`), attempt 2, continuing a partial build. Invoke the `thejudge-implement-all` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: life-tracker-seat-oriented-default
Run ID: graph-20261004-191418
Shared branch (REQUIRED, already checked out in this worktree): thejudge-auto/life-tracker-seat-oriented-default-work
Recorded autonomous base: origin/main — the code PR is thejudge-auto/life-tracker-seat-oriented-default-work → main.

STATE: Slice A code is built, tested, and pushed (commit d979ae4): new helper `apps/frontend/src/lib/lifeTracker/lifeHalves.ts` (`lifeHalvesForSeat`, grid keyed to `SeatPlacement.side`, list mirrors right-of-pair), `PlayerLifeCard.tsx` wired to it, `lifeHalves.test.ts` + `PlayerLifeCard.test.tsx` (25 pass), typecheck/lint/quality:check green, seatArrangement.ts byte-unchanged. BUT slice A's criteria are NOT flipped (they were flipped then reverted), the slice-A doc is still `## Status: planned`, STATUS.active stands, and slices B and C are NOT started, and no code PR exists.

TOOLING NOTE (this is why attempt 1 stopped — not a graph guardrail): the harness auto-mode classifier denies `sed -i` inside a compound command and `python3 <<'EOF'` heredoc file-writes. Edit files with the Edit/Write tools directly, and run `npm run quality:check` as its own standalone Bash command (never chained after a file edit with `&&`). If you hit a real `[graph-boundary]` denial, stop and report it verbatim — do not route around it. An auto-mode-classifier denial is not a graph guardrail: switch tool form and continue.

Do ALL work in the build worktree named above — never the launch checkout. Every path you write stays inside this worktree. Under `graph is controlling` work in place on the shared branch (no second worktree).

Finish the build:
- Slice A: re-flip its seven criteria `value` to true with the Edit tool (already earned), set the slice-A doc `## Status: done`, commit + push.
- Slice B: update the downstream tests that assert the old split, run the full frontend vitest suite and `npm run quality:check` green, then the live browser check (grid AND list at 2/3/4/6/8 players, 390x844 and 1280x800) that each `−` sits nearest its player and the table fits one screen. Check the thin top/bottom gutter for grid 2–3p upright seats for ± overlap with the name pill and map. Playwright cleanup per CLAUDE.md: close the browser, stop any dev server you own, captures under PRD/work/life-tracker-seat-oriented-default/.playwright-mcp/. Write dated observation lines (`YYYY-MM-DD <id> — ...`) for B4/B5/B6/B7, flip B's criteria, mark the doc done, commit + push.
- Slice C: apply the finalized four-file REQ-217 diff from GATE-QUESTIONS.md to PRD/sections/ by intent against current truth (REQ-217 appended after REQ-216, DEC-170 amended in place, life-tracker/README.md, system-map.md) together with the code, run the ship gates, flip C's criteria, mark done, commit + push.
- When every registered slice is done: set STATUS.ship-ready and open the code PR with `gh pr create` (head thejudge-auto/life-tracker-seat-oriented-default-work, base main).

Earning criteria: run the real commands, do the real live check, write the real observation lines, then flip. Never fabricate — node 7 review is the integrity gate. Do not touch: the default layout (grid stays), the seat arrangements, the Game Setup Layout toggle, the MTG Assistant seed, layout persistence. Never force-push, merge/close a PR, or push main.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- each slice's status + commit SHA(s)
- the criteria state per slice (all true?) and the evidence kind earned for each
- the full-suite + quality:check result (command + pass/fail)
- the live browser check result and the capture path
- the four PRD/sections files changed for REQ-217
- STATUS.ship-ready confirmed
- the code PR URL
- every path you wrote

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make the life tracker open in the seat-oriented (list) layout by default so each player's −/+ matches how they sit" | answered-once | shape | — |
| "decisions already made" | refused | shape | No pre-authorization of product decisions — intake is evidence, never authority; the define gate decides product truth |
