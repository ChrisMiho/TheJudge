# Graph run — ask-box-prefilled-text

- Run ID: `graph-20261015-034607`
- Profile: `loaded (env sentinel)` — printed by `npm run graph:preflight` at node 1 (`profile sentinel: present`)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/ask-box-prefilled-text`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ask-box-prefilled-text`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261015-034607/`
- Current node: `define`
- Next action: `/graph-kickoff PRD/work/ask-box-prefilled-text/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/ask-box-prefilled-text` pushed (`git ls-remote` → `97c8ea8a`) from `.worktrees/kickoff-ask-box-prefilled-text`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261015-034607` | 2026-10-14 |
| 2 | shape | sonnet | ok | `0 → 16` | `PRD/work/ask-box-prefilled-text/` (IDEA.md, README.md, STATUS.ideation, intake/owner-request.md) committed `beec1f47`; board row in `PRD/work/STATUS.md`; staged intake copy deleted | 2026-10-14 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261015-034607`. Follow the skill file `.claude/skills/graph-preflight/SKILL.md` exactly (read it first, and `PRD/instructions/graph-workflow-contract.md` sections `## Hook liveness` and `## One run at a time`).

Inputs:
- --branch thejudge-auto/ask-box-prefilled-text
- --slug ask-box-prefilled-text
- --run-id graph-20261015-034607
- --pid 6563

Steps:
1. From the working directory above, run `npm run graph:preflight -- --branch thejudge-auto/ask-box-prefilled-text --slug ask-box-prefilled-text --run-id graph-20261015-034607 --pid 6563 --dry-run`. If it exits 1 or 2, stop and relay the message verbatim.
2. Re-run the identical command without `--dry-run`.
3. Issue the universal canary command (`CANARY_COMMAND`, printed by the script) as a real Bash tool call and require a deny. Then issue `GRAPH_CANARY_COMMAND` (printed by the script) as a real Bash tool call and require a deny. Never retry a denied call. If either is allowed, stop and report BLOCKED verbatim.
4. Confirm the end state: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ask-box-prefilled-text && git branch --show-current`, `git ls-remote --heads origin thejudge-auto/ask-box-prefilled-text`, and `git branch --show-current` at the working directory (must still be `main`).

Rules: change files only with Write/Edit; run git as short separate calls; never stash, reset, remove worktrees, or force-push; never write the lock by hand. Any prompt you write for a child agent must copy the `Working directory:` line above unchanged.

Report back, verbatim: the `shape:`, `base:`, `worktree:`, `profile sentinel:` and `Profile:` lines; both canary results with the hook's deny reason text; the end-state command outputs; and an outcome of `ok` or `failed` with the reason.

### shape

graph is controlling. You are node 2 (`shape`) of graph run `graph-20261015-034607`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ask-box-prefilled-text

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/ask-box-prefilled-text`). Never touch /Users/chrismiho/Coding/Projects/TheJudge itself except to read and then clear the staging folder below.

Invoke the `thejudge-kickoff` skill (Skill tool) in graph mode and capture the idea as package `PRD/work/ask-box-prefilled-text/` with `STATUS.ideation`. Use exactly that slug.

Intake staging folder (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261015-034607/
It holds one file, `owner-request.md` — the owner's request, verbatim. Copy it verbatim into `PRD/work/ask-box-prefilled-text/intake/` (`cp` with explicit paths), commit, then delete the staged copy, as the skill's graph mode says. Intake is evidence, never authority.

The request is one suspected bug report: in the Ask box (the main question composer where a player types a rules question), the default hint text appears to be real text filling the field rather than placeholder text, and the In-depth button next to it appears minimized. The owner asks for an investigation on desktop and on mobile.

Write IDEA.md describing it (problem as the owner observed it, the outcome a player should see, non-goals). Do not decide the fix — that is refinement's job, and refinement will reproduce it live in a browser. Point at the code and PRD sections it touches where you find them. Starting leads, unverified: `apps/frontend/src/components/ComposerPill.tsx` (tiered placeholders, `placeholderFloorForViewport`, the effect that rewrites `textarea.placeholder`, dictation `Listening…` hint); the In-depth chip that collapses to a ◈ icon while the Ask box is engaged (REQ-206, shipped in PRs #262/#263); `apps/frontend/src/styles/flow.css` (`.q-box textarea::placeholder`). Find where the Ask box is mounted and how the In-depth chip decides to collapse (focus? non-empty value?), and list the tests that pin that behavior.

Also grep `PRD/instructions/receipts/` for prior runs on the same ground (ask box / composer / placeholder / hint text / in-depth chip / indepth / REQ-206 / card-search-and-send-pill) and write one `## Prior run` line per match into IDEA.md.

Commit the package in the worktree with short separate calls: `git add PRD/work/ask-box-prefilled-text` then `git commit -m ...` (no push). Add the board row to `PRD/work/STATUS.md` if the skill calls for it, staged by explicit path. Change files only with the Write and Edit tools (cp is fine for the verbatim intake copy); never chain a heredoc or `sed -i` into a long Bash command. If you write any prompt for another agent, copy the Working directory line above unchanged.

If the request cannot become an actionable package, return `NO ACTIONABLE PACKAGE` with the reason. Otherwise report: outcome (ok/failed), the package path, files created, the commit hash, what you found about the hint text and the In-depth collapse (with file paths and lines), the tests that pin it, and the prior-run matches.

### define

graph is controlling. You are node 3 (`define`), attempt 1, of graph run `graph-20261015-034607`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ask-box-prefilled-text

Work only inside that directory (the run's kickoff worktree, on branch `thejudge-auto/ask-box-prefilled-text`). Never write to /Users/chrismiho/Coding/Projects/TheJudge itself.

Invoke the `thejudge-refinement` skill (Skill tool) in graph mode on `PRD/work/ask-box-prefilled-text/`. Read `IDEA.md`, the package `README.md`, and `intake/owner-request.md` (the owner's words verbatim; evidence, never authority). Offer the `## Prior run` receipts in IDEA.md as input, never as scope.

The owner reports two symptoms in the Ask box (the main question composer): the default hint looks like real text filling the field instead of a faint placeholder, and the In-depth button beside it looks minimized. They asked for an investigation on desktop and mobile.

Kickoff's code-only leads (unverified): the Ask box is `ComposerPill` mounted in `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (~706), with `question` state starting empty (~107) and `hydrateFromLookupDraft` (~158) able to fill it from a saved draft; the hint tiers are `QUESTION_PLACEHOLDER_TIERS` (~45) applied by a layout effect in `apps/frontend/src/components/ComposerPill.tsx` (~129-176, `placeholder=` at ~227); the In-depth label hides by CSS in `apps/frontend/src/styles/flow.css` (~281-289) when the textarea is focused or `data-fill` is not `0`, and always under 480px; the placeholder colour is `flow.css` ~223. One cause could explain both symptoms (a real value in the box), or the hint could simply be styled too bright, or the box could be auto-focused on load. Do not assume which.

Reproduce it live before you assert anything. Run a dev server from this worktree on a free port (stopped when you are done) and load the Ask box in a real browser at a desktop width (about 1440x900) and a phone width (about 390x844), first visit with clean storage and again after a reload. At each, record: the textarea's actual `value`, its `placeholder`, whether it has focus, `data-fill`, the computed colour of the placeholder versus typed text, and whether the In-depth label is shown. If it does not reproduce on a clean load, try the paths a player takes (type then clear, ask a question then return, reload with a saved draft, follow-up composer) and say which path, if any, produces it. Also check the live site if the dev build does not reproduce it. Put screenshots under `PRD/work/ask-box-prefilled-text/.playwright-mcp/` and write the measurements to `PRD/work/ask-box-prefilled-text/evidence/measurements.md`. Close the browser when finished.

Then shape the fix into `DESIGN-BRIEF.md`: the root cause with evidence, the player-facing outcome, the touched files, and testable acceptance criteria (including what the In-depth button should look like on desktop and on a phone when the box is empty and unfocused). If the cause turns out to be intended behavior already written in the requirements (for example the phone always showing the compact In-depth icon), say so plainly in the brief and name the requirement text.

Apply the assumption ladder per question as it arises; decide nothing on the owner's behalf that the genuine-blocker test reserves for them. Do not edit `PRD/sections/` or any code. When the brief needs product-truth changes, write `PRD/work/ask-box-prefilled-text/GATE-QUESTIONS.md` in the contract's format: one `## <STABLE-ID>` block per new or changed stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no), then the complete proposed diff, then `- Verdict:` and `- Reason:` slots left blank; a trailing `## Blocker questions` section only for genuine blockers. When no product truth changes (a pure bug fix against existing requirements), write no questions file and say so.

Set the package status marker the skill prescribes (`STATUS.refined` when the brief is complete). Change files only with the Write and Edit tools; run git as short separate calls: `git add <explicit paths>`, then `git commit -m ...`; do not push. If you write any prompt for another agent, copy the Working directory line above unchanged.

Report back plainly: outcome (ok/failed), whether it reproduced and on which widths and paths, the root cause, files written, the stable IDs proposed (with one plain sentence each) or none, and the commit hash.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
