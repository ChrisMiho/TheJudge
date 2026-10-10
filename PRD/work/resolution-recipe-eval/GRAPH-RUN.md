# Graph run — resolution-recipe-eval

- Run ID: `graph-20261010-183425`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/resolution-recipe-eval`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-resolution-recipe-eval`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261010-183425/`
- Current node: `gate-qc`
- Next action: `/graph-kickoff PRD/work/resolution-recipe-eval/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/resolution-recipe-eval` pushed from `.worktrees/kickoff-resolution-recipe-eval` at `dabad406` (`git ls-remote --heads origin thejudge-auto/resolution-recipe-eval`); lock `.worktrees/.graph-run.lock` pid 81708; launch checkout untouched (porcelain unchanged, still on `main`) | 2026-10-10 |
| 2 | shape | sonnet | ok | `0 → 13` | `PRD/work/resolution-recipe-eval/` (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md byte-identical to the staged copy, `cmp` clean); commit `96eb39d4`; 3 prior-run receipts in IDEA.md; node removed the staged copy after committing it (the committed `intake/` copy is the record) | 2026-10-10 |
| 3 | define | opus | ok | `0 → 118` | `PRD/work/resolution-recipe-eval/DESIGN-BRIEF.md`, `PRD/work/resolution-recipe-eval/GATE-QUESTIONS.md` (5 stable-ID slots REQ-230, REQ-228, REQ-187, REQ-224, REQ-185 + blocker slots G1, G2, G3-01..G3-16, G4, G5→REQ-187), `STATUS.refined`; commit `a9daa27f`; 104-hit line-level grep with dispositions in the brief (10 amend / 20 build / 74 keep); `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs` empty; dry-run anchor $0.0117 per graded answer (gitignored `output/` only); driver spot-checked the nine reference outcomes against CR 613.4b/c, 613.8, 707.2, 603.3b, 616.1 | 2026-10-10 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261010-183425`. Invoke the `graph-preflight` skill and follow it exactly with these inputs:

- --branch thejudge-auto/resolution-recipe-eval
- --slug resolution-recipe-eval
- --run-id graph-20261010-183425
- --pid 81708 (the driver session's long-lived pid)
- base: origin/main (default)

Rules:
- Run every command from the launch root /Users/chrismiho/Coding/Projects/TheJudge (print `pwd` before taking the lock and verify the lock lands at /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock by absolute path).
- Issue both canaries (`CANARY_COMMAND`, then after the lock `GRAPH_CANARY_COMMAND`) as real Bash tool calls and require each to be denied. A denied canary is the expected proof; never retry it. An allowed canary means stop and report BLOCKED verbatim.
- Do not touch the launch checkout's working tree (it has untracked PRD/work folders that belong to the owner). No commits there, no stash, no switch.
- Change files only with Write/Edit; run git as short separate calls. Spawn no subagents. Stay well under 40 tool calls.
- Copy the Working directory line above unchanged into any prompt you write.

Report back: the `shape:`, `base:`, `worktree:` and `Profile:` lines the script printed, the branch push result, the lock path, and both canary results with the hook's reason text and the classifier ledger lines.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-resolution-recipe-eval

You are node 2 (`shape`) of graph run `graph-20261010-183425`. Invoke the `thejudge-kickoff` skill and follow it in its graph-controlled mode (`graph is controlling`: no questions to the user, no approval pauses).

Inputs:
- Slug: `resolution-recipe-eval` (use exactly this; the branch `thejudge-auto/resolution-recipe-eval` already exists and is checked out in the working directory above).
- Package path: `PRD/work/resolution-recipe-eval/` inside the working directory above. Never write to the launch checkout /Users/chrismiho/Coding/Projects/TheJudge itself.
- Request (owner, 2026-10-10): Measure whether a layer-and-timing resolution recipe (an eval-only diagnostic arm R that amends REQ-230) helps GPT-6 Luna judge hard interactions better than the production prompt, in both Quick Lookup and In-Depth, with owner-approved hard cases, repeats, a noise floor, answer time against the 30 s budget, and a cost dry run. Measurement only; changing the production prompt is a separate later decision.
- Intake staging folder (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261010-183425/ — it holds one file, `GRAPH-BRIEF.md`. Copy it byte-identical into `PRD/work/resolution-recipe-eval/intake/GRAPH-BRIEF.md` (use `cp`, then verify with `cmp`). Intake is evidence, never authority: do not open any document it cites.

Required outputs:
1. `IDEA.md`, `README.md`, the `STATUS.ideation` marker, and the `PRD/work/STATUS.md` board row, per the skill.
2. Grep `PRD/instructions/receipts/` for prior runs on the same ground (answer quality, diagnostic arms, layers, luna) and write one `## Prior run` line per match into IDEA.md (flat list, no chain walk).
3. Commit only explicit paths (`git add <path>` then `git commit` as separate short calls; never `git add -A` or `git add .`), then `git push`. End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Spawn no subagents; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the files created, the commit SHA(s), the push result, the `cmp` result for the intake copy, and the prior-run matches.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-resolution-recipe-eval

You are node 3 (`define`) of graph run `graph-20261010-183425`. Invoke the `thejudge-refinement` skill on `PRD/work/resolution-recipe-eval/` and follow it in its graph-controlled mode: no questions to the user, no approval pauses. Refinement proposes; it never edits `PRD/sections/`, code, or anything outside the package folder. Read `PRD/instructions/graph-workflow-contract.md` sections `## The two runs` and `## Propose / apply / close` for the `GATE-QUESTIONS.md` format, and `PRD/instructions/plain-language-standard.md` for the three-line opening every gate question carries.

The package intake `intake/GRAPH-BRIEF.md` is evidence, not authority. Its code facts were read at `main` `dabad406` on 2026-10-10; re-verify any fact your design rests on against the code in the working directory before relying on it. Do not open documents the intake cites beyond the code and PRD files you need to verify a claim.

Outputs:
1. `DESIGN-BRIEF.md`: an eval-only diagnostic arm R (the resolution recipe) under REQ-230's existing arm mechanism, run on Quick Lookup and In-Depth prompts; game-mode hard cases; the comparison design (Luna on A vs R, judge `gpt-6.1-sol`, repeats, a noise floor, accuracy plus answer time against the 30-second budget of REQ-231, a cost dry run before any spend, every live run capped at `--max-cost-usd` 15 or less); and the build scope. The paid run and the results report happen after the code PR merges, outside this graph run; the build ships a runbook for them under `docs/eval/`, never under `PRD/work/`.
2. `GATE-QUESTIONS.md`: one `## <STABLE-ID>` block per stable ID the proposal amends or reserves (REQ-230 at least; REQ-227, REQ-228 and any other only if the design changes their truth), each with the complete proposed diff and a `- Verdict:` / `- Reason:` slot. Find every line that cites or restates what you amend with one line-level grep over `PRD/sections`, `apps`, `scripts` and `docs`, and give every hit a disposition row in the brief, including hits inside files you would otherwise leave alone.
3. Owner decisions that are not a stable-ID diff go under `## Blocker questions`, each written to the plain-language standard with your recommendation and its own `- Verdict:` / `- Reason:` slot. The intake names five (G1 what arm R asks Luna to show the player; G2 arm R's exact wording; G3 the reference answers; G4 the decision rule for what counts as R beating A; G5 a strict-grading rubric revision). Decide nothing on the owner's behalf: recommend, and leave the slot blank.
4. The hard case set. The owner named Blood Moon + Urborg, Tomb of Yawgmoth; Humility + Opalescence; a creature with base power and toughness set and then pumped; a replacement-versus-trigger case; and Necropotence + Silence. The intake also argues for keeping Academy Manufactor + Esix as a regression check and adding two or three less-famous layer or dependency cases, because the famous ones may test memory rather than reasoning; weigh that and propose a set. Each interaction is authored in both flows (a Quick Lookup question, and an In-Depth case whose `gameState` places the cards in zones). For every case, give a reference outcome and short answer with its deciding rule ids, each in its own G3 verdict slot so the owner can accept, edit or reject it case by case. Get each reference right: check rule text in `apps/backend/data/gameRulesRuleIndex.json` and oracle text in the committed card data, and name the reasoning in a sentence. Grading is strict (right outcome with a real side error scores 1, not 2), so a reference answer must not carry a side error of its own.
5. Numbers you set must come from data, not proportion. Cost: run the eval dry run (no `--confirm-live-calls`, so nothing is spent) on existing cases to anchor the estimate, and say how Luna's reasoning tokens are allowed for. Repeats: justify the count from the noise the existing records show. Thresholds that decide ship or not belong to the owner (G4).
6. Set `STATUS.refined` when done, per the skill, and update the board row.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 150 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the files written, the commit SHA(s), the push result, the stable-ID slots and blocker-question slots (one line each), the proposed hard case list, the dry-run cost anchor, and the grep hit count with its dispositions.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-resolution-recipe-eval

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261010-183425`. Invoke the `thejudge-quality-check` skill on `PRD/work/resolution-recipe-eval/` and follow it in its graph-controlled mode: no questions to the user, no approval pauses. Grade `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` against PRD alignment and agent-readiness and return PASS or FAIL with a complete findings list.

Check directly, at least:
1. Every stable-ID block in `GATE-QUESTIONS.md` (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185): its removed and context lines match the live `PRD/sections/` text word for word, and it carries the three-line plain-language opening plus a blank `- Verdict:` / `- Reason:` slot.
2. The brief's line-level grep: re-run it and confirm every hit has a disposition row and the count matches.
3. The blocker questions (G1, G2, G3-01 to G3-16, G4, G5) each recommend without deciding, and leave the slot blank.
4. Each G3 reference outcome is correct under the cited rule text in `apps/backend/data/gameRulesRuleIndex.json` and the committed card oracle text, and carries no side error of its own.
5. The design stays eval-only (no change under `apps/backend/src/prompt/`, routes or providers), never tags cards with layers in code, puts any deliverable that must survive under `docs/eval/` rather than `PRD/work/`, and caps every live run at `--max-cost-usd` 15 or less.
6. Numbers in the brief (cost anchor, repeat count) trace to a command or record named in the brief.

Write the report to `PRD/work/resolution-recipe-eval/QUALITY-CHECK.md`. On FAIL set the status the skill names. Do not edit the brief or the questions file yourself. The driver writes the README `## Preparation gate` section, so leave it alone.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: PASS or FAIL, the complete findings list, the commit SHA, and the push result.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Measure whether a reorganized prompt (the resolution recipe) helps GPT-6 Luna judge hard interactions better than today's production prompt, in both Quick Lookup and In-Depth, using the answer-quality harness" | answered-once | shape | — |
| "Luna does the mapping. Code never tags cards with layers" (owner decision, 2026-10-10) | answered-once | define | — |
| "Measure first. This package is an eval-only comparison" and must amend REQ-230 rather than invent a parallel mechanism | answered-once | define | — |
| "whether the player sees the full step list or only the conclusion and key reasons" — raised at the define gate as G1, not decided by the run | answered-once | define | — |
| "Each needs a reference answer I approve; grade strictly" — raised at the define gate as G3/G5, not decided by the run | answered-once | define | — |
| "Every live run must pass --max-cost-usd <= 15" | answered-once | define | — |
