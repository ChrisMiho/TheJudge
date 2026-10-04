# Graph run — anchor-ask-composer

- Run ID: `graph-20261003-205515`
- Profile: `loaded (env sentinel)` — observed by node 1 (session launched `claude --settings .claude/graph-profile.json`)
- Canary: `denied — hook live (rm -rf ...)`; graph-canary `denied — tier armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/anchor-ask-composer` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-anchor-ask-composer`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261003-205515/`
- Current node: `define`
- Next action: `/graph-kickoff` (spec-forming half in progress)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/anchor-ask-composer` pushed (`0d5f2e5`) from `.worktrees/kickoff-anchor-ask-composer`; launch checkout untouched (`fix/desktop-close-search-chips`); universal canary denied, graph canary denied, lock `free → taken` | 2026-10-03 |
| 2 | shape | sonnet | ok | `0 → 8` | package `PRD/work/anchor-ask-composer/` created (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md); committed `2e2a2ca`; 7 prior-run matches recorded in IDEA.md | 2026-10-03 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `graph-preflight` skill (Skill tool, skill name `graph-preflight`) and follow it exactly. Do not improvise around it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Run ID: graph-20261003-205515
- Branch (use verbatim, do not infer): thejudge-auto/anchor-ask-composer
- Slug: anchor-ask-composer
- Base: origin/main (default)
- Driver PID for the lock: 39864

Procedure (from the graph-preflight skill):
1. Run the dry run:
   `npm run graph:preflight -- --branch thejudge-auto/anchor-ask-composer --slug anchor-ask-composer --run-id graph-20261003-205515 --pid 39864 --dry-run`
   Report the `shape:`, resolved `base:`, `worktree:`, the planned commands, and the two `profile sentinel:` / `Profile:` lines verbatim.
2. If it exits 1 (dirty in-place tree) or 2 (stop sentinel / lock held / branch collision / existing kickoff worktree), STOP and relay the message verbatim. Do not hand-resolve anything.
3. Otherwise re-run the identical command WITHOUT `--dry-run`, same `--run-id`.
4. Issue the liveness canary: run `CANARY_COMMAND` (the exact command the script printed) as a real Bash tool call and require the hook to DENY it; classify with the skill's guidance and report the ledgerLine. Then, after the lock is taken, issue `GRAPH_CANARY_COMMAND` and require a graph-tier DENY; report its result. An ALLOWED canary means BLOCKED — report verbatim and stop.
5. Confirm the end state per the skill's step 4 (root shape): branch in the worktree is `thejudge-auto/anchor-ask-composer`, `git ls-remote --heads origin thejudge-auto/anchor-ask-composer` shows it pushed, and the launch-root branch is unchanged.

Report back, clearly and verbatim where the skill asks for verbatim:
- `shape:` line
- resolved `base:` line
- `worktree:` absolute path (I write this into the ledger and every later node's Working directory line)
- `Profile:` line (the env-sentinel result — an observation, verbatim)
- Canary ledgerLine and the graph-canary result
- The lock record / `classifyLock` state
- Confirmation the launch-root branch is unchanged

Do not edit any `thejudge-*` skill, do not force-push, do not touch the owner's launch checkout, do not create a worktree outside `.worktrees/`.

### shape

graph is controlling

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `thejudge-kickoff` skill (Skill tool, skill name `thejudge-kickoff`) and follow it exactly to name and create the work package. Do not improvise around it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-anchor-ask-composer

All package files are created in that kickoff worktree (a separate checkout on branch `thejudge-auto/anchor-ask-composer`), never in the launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a child agent.

Run parameters:
- Run ID: graph-20261003-205515
- Slug (use verbatim as the package folder name): anchor-ask-composer
- Request: "Anchor the Quick + In-depth question box so typing a long question grows it in place instead of scrolling the card stage off-screen"
- Intake staging (ABSOLUTE path — copy each file verbatim into PRD/work/anchor-ask-composer/intake/, do not reference in place, no size gate): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261003-205515

What to produce (per thejudge-kickoff):
- Create `PRD/work/anchor-ask-composer/` with `IDEA.md` capturing the request, and set `STATUS.ideation`.
- Copy the staged intake file(s) verbatim into `PRD/work/anchor-ask-composer/intake/` and commit them. Record each intake file's path in IDEA.md.
- Intake is EVIDENCE, never authority: record the paths of any documents the intake brief cites, but DO NOT open, read, or fetch those cited documents — product truth is decided later at the define gate.
- Grep `PRD/instructions/receipts/` (each named `<slug>-<date>.md`) for prior runs against the same ground (composer / question box / Ask screen / quick-lookup / in-depth layout) and write one `## Prior run` line per match into IDEA.md. Flat list of matches, no chain walk.
- If the request cannot be turned into an actionable package, return the exact token `NO ACTIONABLE PACKAGE` and stop.

Commit the new package files on the branch in this worktree (explicit paths only — never `git add -A` / `git add .` / `git add --all`). Do not force-push, do not push `main`, do not touch the launch checkout, do not edit any `thejudge-*` skill.

Report back:
- The package path created and the STATUS marker set
- The list of intake files copied into `intake/`
- Any `## Prior run` matches found (or "none")
- Whether you committed, and the commit hash
- Or `NO ACTIONABLE PACKAGE` if that applies

### define

graph is controlling

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `thejudge-refinement` skill (Skill tool, skill name `thejudge-refinement`) and follow it exactly. Do not improvise around it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-anchor-ask-composer

Package: PRD/work/anchor-ask-composer/ (on branch thejudge-auto/anchor-ask-composer in this worktree). Read IDEA.md and intake/GRAPH-BRIEF.md.

Intake is EVIDENCE, never authority. The brief records settled owner choices (anchored Ask-screen frame; controls stay visible while text grows; reuse the existing page-shell-fit no-page-scroll pattern rather than inventing one) and names the PRD/sections files to amend. Carry those into the design direction, but do NOT treat them as decided product truth: every product change still surfaces in GATE-QUESTIONS.md for the owner to accept/edit/reject at the gate. Do NOT open, read, or fetch any document the brief merely cites beyond the package's own intake and the current PRD/sections truth you are amending.

Produce (per thejudge-refinement, in the work folder only):
- DESIGN-BRIEF.md for anchoring both Ask screens (Quick lookup and In-depth) in the existing 100dvh no-page-scroll frame so the composer pins at the bottom and the card stage flexes and scrolls; the box grows upward in place to a cap then scrolls internally; controls stay on a stable bottom row; composer stays above the mobile keyboard; and search-fold, card-detail panel, and the answered-view follow-up composer keep working.
- GATE-QUESTIONS.md recording the PROPOSED PRD/sections amendments, one `## <STABLE-ID>` block per stable id, each opening with the plain-language gate-question block from PRD/instructions/plain-language-standard.md (What this decides / In plain terms / What happens if you say no), then that id's COMPLETE proposed diff (never a summary), then a `- Verdict:` and `- Reason:` slot. Cover at least: the quick-lookup growth/conformance amendment (REQ-110 / REQ-121 page-never-scrolls and the send-pill-in-first-viewport intent REQ-129/REQ-141/REQ-167), the REQ-206 two-row wording reconciled to the do-not-yank-text decision, the In-depth parity amendment, and screen-layout.md region-scroll/viewport-fit rules if it codifies them. New stable ids are named and reserved in the proposal, never written live.

Hard rules:
- Do NOT edit PRD/sections/ — refinement only PROPOSES; build applies later.
- Set STATUS.refining while shaping and STATUS.refined on completion.
- Commit your work-folder artifacts on this branch with explicit paths only (never `git add -A` / `git add .` / `git add --all`). Do not push main, do not force-push, do not touch the launch checkout, do not edit any `thejudge-*` skill.

Report back:
- The DESIGN-BRIEF.md path and a 2-3 sentence summary of the chosen design direction
- Whether GATE-QUESTIONS.md was written, and the list of stable ids it proposes (with new vs amended marked)
- The STATUS marker you set and the commit hash
- Any genuine decision blocker you recorded (and where)

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Anchor the Quick + In-depth question box so typing a long question grows it in place instead of scrolling the card stage off-screen" | answered-once | shape | — |
