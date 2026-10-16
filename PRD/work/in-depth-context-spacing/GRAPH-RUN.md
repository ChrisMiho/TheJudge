# Graph run — in-depth-context-spacing

- Run ID: `graph-20261016-023551` (build half; spec-forming half `graph-20261016-020939`)
- Profile: `loaded (env sentinel)` — printed by `npm run graph:preflight` at node 1
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-in-depth-context-spacing`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261016-020939/`
- Current node: `build`
- Next action: `/graph-implement PRD/work/in-depth-context-spacing/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 14` | branch `thejudge-auto/in-depth-context-spacing` pushed (`git ls-remote` → `12b0e6bc`) from `.worktrees/kickoff-in-depth-context-spacing`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261016-020939` (counter includes 6 driver scouting calls made before run-state moved off `preflight/1`) | 2026-10-15 |
| 2 | shape | sonnet | ok | `0 → 19` | `PRD/work/in-depth-context-spacing/` (IDEA.md, README.md, STATUS.ideation, intake/owner-request.md) committed `86d02fd9`; board row in `PRD/work/STATUS.md`; staged intake copy deleted | 2026-10-15 |
| 3 | define | opus | ok | `0 → 85` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (one slot: REQ-023 amendment), `evidence/measurements.md`, `STATUS.refined`, board row moved — commit `f2ab5714`; live screenshots under `PRD/work/in-depth-context-spacing/.playwright-mcp/` (git-ignored); dev server stopped (listeners on :5173/:5273 belong to older worktrees) | 2026-10-15 |
| 4 | gate-qc | sonnet | ok | `0 → 13` | PASS — `QUALITY-CHECK.md` committed `8fe2dc95`; README `## Preparation gate` recorded by the driver | 2026-10-15 |
| 5 | gate-review | sonnet | ok | `0 → 13` | build half run `graph-20261016-023551`: kickoff worktree removed clean (`git worktree remove`; its git-ignored gate screenshots copied into this worktree's `.playwright-mcp/`); claim commit `86f3de9f` on `thejudge-auto/in-depth-context-spacing-work` cut from `origin/main` `95144615` (docs PR #311 merge), pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `b9d5f105`: 1 accept / 0 edit / 0 reject (REQ-023), `### Brief reconciliation` none (grep zero hits); `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree and launch-checkout porcelain empty | 2026-10-15 |
| 6 | gate-qc | sonnet | ok | `0 → 13` | build-half re-grade PASS, findings none — `QUALITY-CHECK.md` committed `c2ceff0a`: brief and finalized REQ-023 diff state one rule; hunks anchor at `functional-requirements.md:429`/`:438` and `in-depth/README.md:278` (edited line 282) at HEAD `78be7c49`; `apps/frontend/src/` anchors verified (`index.css` 204/218/3093/2940/5364, `AskAiWaitingPanel.tsx` 44/74, render sites `EnrichmentStep.tsx` 718/880, `QuickLookupApp.tsx` 702); 10 criteria testable; `STATUS.refined` kept; driver rewrote README `## Preparation gate`; worktree and launch porcelain empty | 2026-10-15 |
| 7 | plan | sonnet | ok | `0 → 19` | `thejudge-map-out` commit `e7c3caf1`: `GAMEPLAN.md`, slice A (`slice-a-one-row-bubble.md`, one row in both flows, final slice with REQ-023 apply and ship gates, 11 criteria — A1/A2/A3/A6/A11 manual) and `slice-a.criteria.json` all `false`; `STATUS.active` only marker; board row under active; `git diff --stat origin/main HEAD -- PRD/sections apps` empty; captures planned only under git-ignored `.playwright-mcp/`; worktree and launch porcelain empty | 2026-10-15 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-023` | accept | "yes, these one row look great, and i love how the text stacks on itself in case its long, without affecting the other components, i was afraid the text would be too small but i think this looks alright" |

### Brief reconciliation

- grep: `grep -nE 'stays stacked|Edit this slot|if the owner (says|rejects|edits)|verdict (is|pending)' DESIGN-BRIEF.md README.md` — zero hits
- none (one accept; no edit or reject, so `DESIGN-BRIEF.md`, the README intake pointer and `GATE-QUESTIONS.md` are unchanged)

## Open gate

- RESOLVED 2026-10-15: 1 verdict (1 accept, 0 edit, 0 reject) applied; status restored to `refined`; run resumes at `gate-qc`.
- Owner action (historical): answer `PRD/work/in-depth-context-spacing/GATE-QUESTIONS.md` (one slot, REQ-023: waiting bubble's icon, phrase and timer on one row), then merge the docs PR to build. Screenshots to compare: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-in-depth-context-spacing/PRD/work/in-depth-context-spacing/.playwright-mcp/` (local, git-ignored).
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/311
- Resume: `/graph-implement PRD/work/in-depth-context-spacing/` after the merge.
- Terminal state: `PARKED` (owner-action) — lock released.

## Dispatch prompts

### preflight

graph is controlling. You are node 1 (`preflight`) of graph run `graph-20261016-020939`, attempt 1. Tool-call cap 40 — stay well under it; spawn no subagents, no sleeping or polling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-preflight` skill (Skill tool) and follow it exactly, with these inputs:
- --branch thejudge-auto/in-depth-context-spacing
- --slug in-depth-context-spacing
- --run-id graph-20261016-020939
- --pid 6563

Steps: dry run first (`npm run graph:preflight -- --branch thejudge-auto/in-depth-context-spacing --slug in-depth-context-spacing --run-id graph-20261016-020939 --pid 6563 --dry-run`), then the identical command without --dry-run. Run every command from the launch root above (check `pwd` first); never `cd` into the worktree in the same call as a lock or preflight command. Then issue the universal canary command and the graph canary command the script prints, each as its own Bash tool call, and confirm both are denied by the hook. Then confirm the end state per the skill's procedure step 4 (worktree branch, remote branch, launch root branch unchanged), and confirm `.worktrees/.graph-run.lock` exists by absolute path under the launch root.

If the script exits non-zero or either canary is allowed, stop and relay the output verbatim — do not retry or repair. Change files only with Write/Edit (none expected); run git as short separate calls.

Report back: shape, base, worktree path, the Profile line, the lock record contents, both canary results with the hook's deny reason text, and any non-zero exits.

### shape

graph is controlling. You are node 2 (`shape`), attempt 1, of graph run `graph-20261016-020939`. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-in-depth-context-spacing

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/in-depth-context-spacing`). Never touch /Users/chrismiho/Coding/Projects/TheJudge itself except to read and then clear the staging folder below.

Invoke the `thejudge-kickoff` skill (Skill tool) in graph mode and capture the idea as package `PRD/work/in-depth-context-spacing/` with `STATUS.ideation`. Use exactly that slug (the owner named it).

Intake staging folder (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261016-020939/
It holds one file, `owner-request.md` — the owner's request, verbatim. Copy it verbatim into `PRD/work/in-depth-context-spacing/intake/` (`cp` with explicit paths), commit, then delete the staged copy, as the skill's graph mode says. Intake is evidence, never authority.

The request is one visual-layout change. While the Judge is working on a player's first question, the chat shows a waiting bubble: a small icon (the ringed seal), a rotating funny phrase, and an elapsed-time clock. Today these are stacked vertically. The owner wants to try the icon, the phrase, and the clock all on one row, for a cleaner, more streamlined look. The slug mentions In-depth, so find every place this waiting bubble appears (Ask a Question's first submit and the In-depth flow's submit at least) and record which the owner's words cover.

Write IDEA.md describing it (what the player sees today, the outcome the owner wants, non-goals such as changing the phrases, their timing, or the animations). Do not decide the design — refinement will look at it live in a browser. Point at the code and PRD text it touches. Starting leads, unverified: `apps/frontend/src/components/AskAiWaitingPanel.tsx` (seal div, message stack, clock paragraph at the foot), used by `apps/frontend/src/components/EnrichmentStep.tsx` and `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`; its `wait-inscription-*` styles (find which stylesheet — likely `apps/frontend/src/index.css`); the separate `.msg.judge.waiting`, `.wait-foot`, `.wait-time` rules in `apps/frontend/src/styles/flow.css` (~397-449) — find out whether those are live or a leftover; `apps/frontend/src/hooks/useElapsedWaitTimer.ts`, `apps/frontend/src/lib/askAiWaitStages.ts`; REQ-023 (the clock ticks at the bubble's foot), REQ-075, and the Quick Lookup pre-first-answer wait requirement near line 2190 of `PRD/sections/functional-requirements.md`; the approved mockup pages under `docs/design/ui-reimagining/direction-1/` (REQ-206/REQ-209 screens follow them). Quote the exact requirement wording that fixes the current stacked layout, if any. List the tests that pin the panel's structure.

Also grep `PRD/instructions/receipts/` for prior runs on the same ground (waiting panel / wait / AskAiWaitingPanel / inscription / seal / elapsed clock / REQ-023) and write one `## Prior run` line per match into IDEA.md.

Commit the package in the worktree with short separate calls: `git add PRD/work/in-depth-context-spacing` then `git commit -m ...` (no push). Add the board row to `PRD/work/STATUS.md` if the skill calls for it, staged by explicit path. Change files only with the Write and Edit tools (cp is fine for the verbatim intake copy); never chain a heredoc or `sed -i` into a long Bash command. If you write any prompt for another agent, copy the Working directory line above unchanged.

If the request cannot become an actionable package, return `NO ACTIONABLE PACKAGE` with the reason. Otherwise report: outcome (ok/failed), the package path, files created, the commit hash, where the waiting bubble appears, the requirement text that governs its layout (quoted), the tests that pin it, and the prior-run matches.

### define

graph is controlling. You are node 3 (`define`), attempt 1, of graph run `graph-20261016-020939`. Tool-call cap 150 — verify directly, spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-in-depth-context-spacing

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/in-depth-context-spacing`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-refinement` skill (Skill tool) in graph mode on `PRD/work/in-depth-context-spacing/`. Read `IDEA.md`, the package `README.md`, and `intake/owner-request.md` (the owner's words verbatim; evidence, never authority). Offer the `## Prior run` receipts in IDEA.md as input, never as scope.

The owner's ask, as the scope boundary: while the Judge works on a player's first question, the waiting bubble shows the ringed seal (icon), the rotating funny phrase, and the elapsed clock stacked on top of one another. The owner wants to see those three on one row, for a cleaner, more streamlined look. Keep the change to that layout. Do not change the phrases, their thresholds or timing, the animations, the colours, or the accessible live region. Anything adjacent you find (for example the unused `.msg.judge.waiting` / `.wait-foot` / `.wait-time` rules in `apps/frontend/src/styles/flow.css`) goes under a separate Follow-ups list in the brief, not into scope.

Shape's findings (verify, do not trust): one component, `apps/frontend/src/components/AskAiWaitingPanel.tsx`, renders the bubble at three sites — In-depth first submit (`EnrichmentStep.tsx` ~718), In-depth fallback (~880), and Ask a Question first submit (`QuickLookupApp.tsx` ~702, REQ-092 reuses the panel as-is). Live styles are `.wait-inscription-*` in `apps/frontend/src/index.css` (~204, ~218, ~3093; one-column grid, clock right-aligned in 1.5rem monospace). REQ-023's last acceptance criterion (`PRD/sections/functional-requirements.md` ~418) says the panel is drawn under the colour's seal and the elapsed clock ticks at the bubble's foot, which describes the stacked layout; `PRD/sections/in-depth/README.md` ~278-283 repeats it. Whether the owner means Ask a Question too is an open question shape raised: the owner's words describe the chat window when the first message is sent, and both flows share one component. Apply the assumption ladder to it when it arises; if it fails the genuine-blocker test, resolve it in the brief with the reasoning written down.

Look at it live before you assert anything. Run a dev server from this worktree on a free port (stopped when you are done) and bring up the waiting bubble in a real browser at a desktop width (about 1440x900) and a phone width (about 390x844, iPhone-SE class 375x667 too). Hold the wait open long enough to see the longest phrases (stub or delay the answer request in the browser if needed; never call a paid model). Record the bubble's measured height and the position of seal, phrase and clock today. Then, without editing source files, inject a one-row style into the live page (seal left, phrase in the middle, clock right) and screenshot it at the same widths, so the owner can see how it looks; note how the longest phrase behaves on a phone (wraps, truncates, or forces the clock down) and pick the behaviour that keeps it on one row and readable. Put screenshots under `PRD/work/in-depth-context-spacing/.playwright-mcp/` and write the measurements to `PRD/work/in-depth-context-spacing/evidence/measurements.md`. Close the browser when finished.

Then shape the change into `DESIGN-BRIEF.md`: what the player sees today and after, the touched files, and testable acceptance criteria (one row at each width, the longest-phrase behaviour on a phone, motion and reduced-motion unchanged, live region unchanged). Apply the assumption ladder per question as it arises; decide nothing on the owner's behalf that the genuine-blocker test reserves for them. Do not edit `PRD/sections/` or any code. Because REQ-023's wording fixes the stacked layout, write `PRD/work/in-depth-context-spacing/GATE-QUESTIONS.md` in the contract's format: one `## <STABLE-ID>` block per changed stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no) written in the owner's own terms (icon, phrase, timer, one row), then the complete proposed diff, then `- Verdict:` and `- Reason:` slots left blank; a trailing `## Blocker questions` section only for genuine blockers. Name the screenshot paths in each block so the owner can see the look before answering.

Set the package status marker the skill prescribes (`STATUS.refined` when the brief is complete). Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: outcome (ok/failed), what the bubble looks like today and in the one-row preview at each width, how long phrases behave on a phone, files written, the stable IDs proposed (with one plain sentence each) or none, and the commit hash.

### gate-qc

graph is controlling. You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261016-020939`. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, no dev server or browser, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-in-depth-context-spacing

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/in-depth-context-spacing`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-quality-check` skill (Skill tool) in graph mode on `PRD/work/in-depth-context-spacing/DESIGN-BRIEF.md`. Grade it against PRD alignment and agent-readiness as the skill defines. Also read `GATE-QUESTIONS.md` (one slot, an amendment to REQ-023 putting the waiting bubble's seal, phrase and clock on one row) and `evidence/measurements.md`; check that the proposed diff's starting lines match `PRD/sections/functional-requirements.md` and `PRD/sections/in-depth/README.md` as they stand, that the brief's scope matches the owner's request in `intake/owner-request.md` (one row for icon, phrase and timer; nothing else), and that each acceptance criterion is testable. The proposal is not yet answered by the owner; grade the brief as a proposal pending that verdict, not as applied truth.

Write the report the skill prescribes into the package. On FAIL, set the marker the skill prescribes and list every finding with its file and line. Do not edit `PRD/sections/`, code, `DESIGN-BRIEF.md`, or `GATE-QUESTIONS.md`. Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back: verdict (PASS or FAIL), the findings in full, files written, and the commit hash.

### gate-review

graph is controlling. You resolve the `define` gate of graph run `graph-20261016-023551` (build half; spec-forming half `graph-20261016-020939`), attempt 1. No tool-call cap applies to this step, but stay small — about 20 calls; spawn no subagents or forks, no sleeping or polling, no dev server or browser.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-in-depth-context-spacing

Work only inside that directory (the build worktree, on branch `thejudge-auto/in-depth-context-spacing-work`, cut from `origin/main`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `graph-gate-review` skill (Skill tool) on `PRD/work/in-depth-context-spacing/` and follow it exactly. `GATE-QUESTIONS.md` carries one slot, REQ-023 (the waiting bubble puts the seal, the phrase and the clock on one row), answered by the owner with verdict accept and a reason. Apply the verdict inside `GATE-QUESTIONS.md` only (an accept changes nothing there), and reconcile `DESIGN-BRIEF.md` and the README intake pointer to every edit or reject — with one accept and no edits or rejects, the reconciliation is expected to be none; still quote the grep you ran in the `### Brief reconciliation` list. Write `## Gate verdicts` (with `### Brief reconciliation`) into `GRAPH-RUN.md`, mark `## Open gate` resolved with the date and the verdict count, and restore the lifecycle position: the README `status:` field and the single `STATUS.*` marker to `refined`, and the `PRD/work/STATUS.md` board row moved fully (removed from its old group, added under refined). Never edit `PRD/sections/`, code, or anything under `intake/`.

Change files only with the Write and Edit tools; never chain a heredoc or `sed -i` into a long Bash command. Run git as short separate calls from the working directory: `git add <explicit paths>` (a `git rm` for the old marker), then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: the verdict counts, the brief reconciliation (or none) with the grep, the restored status, every file changed, the commit hash, and the output of `git status --porcelain` in the working directory after the commit.

### gate-qc (build-half re-grade)

graph is controlling. You are node 4 (`gate-qc`), the build-half re-grade, attempt 1 of graph run `graph-20261016-023551` (build half; spec-forming half `graph-20261016-020939`). Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, no dev server or browser, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-in-depth-context-spacing

Work only inside that directory (the build worktree, on branch `thejudge-auto/in-depth-context-spacing-work`, cut from `origin/main` `95144615`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-quality-check` skill (Skill tool) in graph mode on `PRD/work/in-depth-context-spacing/DESIGN-BRIEF.md`. The owner has answered the gate: `GATE-QUESTIONS.md` carries one slot, REQ-023 (the waiting bubble puts the seal, the phrase and the clock on one row), verdict accept, recorded under `## Gate verdicts` in `GRAPH-RUN.md`; the proposal is now finalized and unchanged. Re-grade the brief as a finalized package: PRD alignment and agent-readiness as the skill defines; the brief and the finalized REQ-023 diff state one rule; every hunk in `GATE-QUESTIONS.md` still anchors on `PRD/sections/functional-requirements.md` and `PRD/sections/in-depth/README.md` as they stand at this worktree's HEAD (the diff was written against `b9c922db`; name the current start lines); the files and line numbers the brief cites in `apps/frontend/` still match; every acceptance criterion is testable, including the one that depended on the owner's verdict; and scope still matches `intake/owner-request.md` (one row for icon, phrase and timer; nothing else).

Rewrite `QUALITY-CHECK.md` as the skill prescribes. On PASS keep `STATUS.refined`; on FAIL set the marker the skill prescribes and list every finding with its file and line. Do not edit `PRD/sections/`, code, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, or the README (the driver writes the README `## Preparation gate`). Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back: verdict (PASS or FAIL), the findings in full (or none) and any minor notes, the current start lines of each hunk, files written, the commit hash, and `git status --porcelain` in the working directory after the commit.

### plan

graph is controlling. You are node 5 (`plan`), attempt 1, of graph run `graph-20261016-023551` (build half). Tool-call cap 120 — verify directly, spawn no subagents or forks, no sleeping or polling, no dev server or browser, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-in-depth-context-spacing

Work only inside that directory (the build worktree, on branch `thejudge-auto/in-depth-context-spacing-work`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-map-out` skill (Skill tool) in graph mode on `PRD/work/in-depth-context-spacing/`. Verify `Quality-check: PASS` in the package README's `## Preparation gate` before writing anything; you cannot self-certify one. Inputs: `DESIGN-BRIEF.md` (10 acceptance criteria), the finalized `GATE-QUESTIONS.md` (REQ-023 accepted: the waiting bubble puts the seal, the phrase and the clock on one row, with a long phrase wrapping in the middle), `QUALITY-CHECK.md` (four minor notes, including the full `QuickLookupApp.tsx` path and the current hunk start lines), and `evidence/measurements.md`.

Write `GAMEPLAN.md` and the lettered slice docs the skill prescribes, plus one `slice-<letter>.criteria.json` beside each slice doc with every criterion `false` and an evidence block per the schema in the skill's reference. This is a small CSS-and-layout change; prefer the fewest slices that keep each one reviewable. The final slice applies the finalized REQ-023 diff to `PRD/sections/` by intent against current truth, together with the code, and carries the ship gates. Any live browser checks the slices plan must save captures under the git-ignored `PRD/work/in-depth-context-spacing/.playwright-mcp/`; plan no tracked deliverable inside `PRD/work/` (cleanup deletes the folder). Set `STATUS.active` as the only marker and move the `PRD/work/STATUS.md` board row fully (removed from refined, added under active). Do not edit `PRD/sections/` or code.

Change files only with the Write and Edit tools; never chain a heredoc or `sed -i` into a long Bash command. Run git as short separate calls: `git add <explicit paths>` (`git rm` for the old marker), then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back: outcome (ok/failed), the slices with one plain sentence each, the criteria count per slice, files written, the commit hash, and `git status --porcelain` in the working directory after the commit.

### build

graph is controlling. You are node 6 (`build`), attempt 1, of graph run `graph-20261016-023551` (build half). Tool-call cap 4000. Spawn no subagents or forks; no sleeping or polling loops.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-in-depth-context-spacing

Shared branch: `thejudge-auto/in-depth-context-spacing-work` (checked out in the working directory above; autonomous base `origin/main`). Work in that worktree in place — no second worktree, no contributor branch. Never write to /Users/chrismiho/Coding/Projects/TheJudge itself or anywhere outside the working directory; every path you write must lie inside it.

Invoke the `thejudge-implement-all` skill (Skill tool) in graph mode on `PRD/work/in-depth-context-spacing/` and complete every slice in `GAMEPLAN.md` (one: slice A, `slice-a-one-row-bubble.md`, 11 criteria in `slice-a.criteria.json`). The change: the waiting bubble puts the seal, the phrase and the timer on one row in both In-depth and Ask a Question, CSS-only plus comment rewording and one new test, and slice A applies the finalized REQ-023 diff in `GATE-QUESTIONS.md` to `PRD/sections/functional-requirements.md` and `PRD/sections/in-depth/README.md` by intent against current text, together with the code. Read the four builder notes in `GAMEPLAN.md`. One path correction the driver found: the slice's Verification block names `apps/frontend/src/askAiWaitStages.ts`; the real file is `apps/frontend/src/lib/askAiWaitStages.ts`.

Use test-driven development: write the new `index.css` assertion in `AskAiWaitingPanel.test.tsx` first and watch it fail before the CSS change. Run the frontend tests under Node 22 as well as the local Node, because CI runs Node 22 and a local Node 26 has hidden failures before (from `apps/frontend`: `npx -y -p node@22 node ../../node_modules/vitest/vitest.mjs run`). Run `npm run quality:check` before the final push.

Live checks (A1, A2, A3, A6): run a dev server from this worktree on a free port that you own, bring up the waiting bubble in a real browser at 1440x900, 390x844 and 375x667 in both Ask a Question and In-depth first submit, and hold the wait open by delaying or stubbing the answer request in the browser — never call a paid model. Measure positions and heights and record them in the PR body. Save screenshots only under `PRD/work/in-depth-context-spacing/.playwright-mcp/` (git-ignored); the before screenshots the owner approved are already there for comparison. Close the browser and stop the server when done (A11). A manual criterion is earned by a dated observation line naming its id; never flip a criterion to `true` before its evidence was observed.

Open the code PR `thejudge-auto/in-depth-context-spacing-work → main` with `gh pr create`, registered as the skill's reference requires (the `thejudge-auto:v1:registered:in-depth-context-spacing` marker in the body and the `[THEJUDGE-AUTO]` title form). Never merge or close a PR. Set `STATUS.ship-ready` as the only marker when the slice is done, and update the board row.

Change files only with the Write and Edit tools; never chain a heredoc or `sed -i` into a long Bash command. Run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`, then `git push` (never force, never `git add -A` or `git add .`). If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back: outcome (ok/failed), the PR URL, every commit hash and whether `origin` matches local, each criterion's final value, test and `quality:check` results (local Node and Node 22), the live measurements, any deviation from the slice doc, and the complete list of every path you wrote or created (tracked and untracked, including git-ignored captures, logs and installs), each as an absolute path.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| owner launch request (verbatim in `intake/owner-request.md`): put the waiting bubble's icon, phrase and timer on one row | answered-once | shape | — |
