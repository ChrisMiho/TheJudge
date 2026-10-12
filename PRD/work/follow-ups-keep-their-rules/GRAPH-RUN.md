# Graph run — follow-ups-keep-their-rules

- Run ID: `graph-20261012-152231` (build half; spec-forming half was `graph-20261012-195753`)
- Profile: `unverified`
- Canary: `denied — hook live (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261012-195753/`
- Current node: `build` parked (owner-action); next node `review`
- Next action: `/graph-implement PRD/work/follow-ups-keep-their-rules/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/follow-ups-keep-their-rules` cut from `origin/main` `0461969f` into `.worktrees/kickoff-follow-ups-keep-their-rules` and pushed (`git ls-remote` shows `0461969f`); lock `.worktrees/.graph-run.lock` holds run `graph-20261012-195753`; universal canary `rm -rf .worktrees/.graph-canary-nonexistent` denied, graph canary `nohup true` denied while the lock was held; `Profile: unverified`; launch checkout porcelain unchanged (4 untracked folders) | 2026-10-12 |
| 2 | shape | sonnet | ok | `0 → 19` | commit `d9f2bb2d` pushed: `PRD/work/follow-ups-keep-their-rules/` with `IDEA.md` (8 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` and `intake/DRIVER-NOTE-changes-since-the-brief.md` (driver `cmp`: byte-identical to staging), board row under `## ideation`; staged copy left (removal under `.worktrees/` is denied) | 2026-10-12 |
| 3 | define | opus | ok | `0 → 101` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (11 slots, all verdicts blank: new REQ-246, REQ-247; amended REQ-022, REQ-024, REQ-027, REQ-074, REQ-178, REQ-226, REQ-228, REQ-238, REQ-242; no blocker), `evidence/amendment-grep.md` (268 hits = 13 amend / 13 build / 242 no change), `evidence/offline-measurement.md` (62-case diagnostic manifest at `0461969f`: carried excerpts 62/62, In-Depth curated topics 9/9, lookup step guidance 53/53; today 6 of 9 In-Depth follow-ups change topics); `STATUS.refined` only marker, board row under `## refined`; driver `git diff --stat HEAD -- PRD/sections apps scripts` empty. Deviation: node wrote the first README/board/grep drafts with short python scripts and renamed markers with `mv` (no denial) | 2026-10-12 |
| 4 | gate-qc | sonnet | ok | `0 → 19` | PASS, attempt 1 of 3: every old and context line of the 11 diffs matches `PRD/sections/functional-requirements.md` at its stated line (scripted exact match, 0 misses); 13 amend rows map to slots; three plain-language lines and blank verdicts in each slot; REQ-246/REQ-247 free on main; numeric targets trace to `evidence/offline-measurement.md`; code references true; no practice-suite data. One non-blocking nit (evidence line cited `askAiRequest.ts:227`, true line 228) fixed by the driver. `README.md` `## Preparation gate` written PASS | 2026-10-12 |
| 5 | gate-review | sonnet | ok | `0 → 18` | build half run `graph-20261012-152231`: claim commit `1a3ea9a9` on `thejudge-auto/follow-ups-keep-their-rules-work` cut from `origin/main` `67678d05` (docs PR #296 merge; kickoff worktree removed clean); lock taken from the launch root, graph canary `nohup true` denied; `graph-gate-review` commit `997fc929`: 11 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree porcelain empty | 2026-10-12 |
| 6 | gate-qc | sonnet | ok | `0 → 14` | PASS, build-half attempt 1 of 3, re-graded after gate resolution at `origin/main` `67678d05`: all 24 old/context diff lines match `PRD/sections/functional-requirements.md` verbatim at their stated lines; REQ-246/REQ-247 free (REQ-245 last, line 6455); brief code references true (`useAskAiSubmitOrchestration.ts`, `askAiRequest.ts:231-246`, `routes/askAi.ts:106-110`, `gameRulesTopicSelection.ts:142`, `preparation.ts`); brief consistent with 11 accepts, REQ-246 follow-up item out of build scope; `STATUS.refined` only marker; porcelain empty. Non-blocking: `DESIGN-BRIEF.md` line 6 still says the eleven slots are to be decided. `README.md` `## Preparation gate` stands PASS, findings none | 2026-10-12 |
| 7 | plan | sonnet | ok | `0 → 25` | `GAMEPLAN.md`; `slice-a-eval-pushback-mode.md` + `slice-a.criteria.json` (14 criteria, all `false`, each with evidence; REQ-247, REQ-226, REQ-228; tooling only); `slice-b-follow-ups-keep-rules.md` + `slice-b.criteria.json` (13 criteria, all `false`; REQ-246 + seven amendments + 13 derived-doc rows; ship gates); REQ-246 follow-up item listed out of scope; paid before/after runs listed as owner steps; `STATUS.active` only marker; README `## Slices`; board row moved refined → active | 2026-10-12 |
| 8 | build | sonnet | parked | `0 → 147` | Work done: slice A commit `61ea4899`, slice B commit `3626876e`, pushed (`origin` tip `3626876e`); criteria 14/14 and 13/13 `true`; PR https://github.com/ChrisMiho/TheJudge/pull/297 open; node set `STATUS.ship-ready`. Return-side check: launch checkout `git status --porcelain` identical before and after (4 untracked folders). Write scope: `classifyBuildWrites` outcome `park` — `node 6 wrote outside its scope: /tmp/<grep-count temp file, deleted>`. Also self-reported: bare `git stash` then `git stash pop` once (contract `## Boundaries`: never drop, pop or reorder a stash); `git stash list` top entry afterwards is the older `green-mobile-branch-declutter-work` WIP, so the pop took back only its own push. Hook denials this run: none — `git stash pop` is denied only in `.claude/graph-profile.json` (not loaded, `Profile: unverified`), and `scripts/lib/boundary-rules.mjs` has no stash rule. Other self-reported deviations: edits via Python/`sed` instead of Write/Edit; gitignored `node_modules` symlinks in the worktree; read-only use of the launch checkout's model cache for B10 (stock MiniLM; trained model absent) | 2026-10-12 |

## Open gate

- Gate: `build` (node 6) parked on its return-side write-scope check, 2026-10-12.
- Question: accept the build's two out-of-bounds actions as harmless and continue to review? (1) one temp file written under `/tmp` and deleted at once; (2) one bare `git stash` + `git stash pop` of its own changes. Driver recommendation: accept both. The repository and the launch checkout are unchanged and the stash stack's prior entries are intact. Record the guardrail gap as follow-up: the boundary hook has no stash rule, so the contract's claim that the hook enforces the whole boundary list does not hold for stash pop/drop.
- Evidence: node ledger row 8; `git stash list` (top entry `0fc368ea`, the older `green-mobile-branch-declutter-work` WIP); PR https://github.com/ChrisMiho/TheJudge/pull/297.
- Resume: write `RESOLVED <date>: <verdict>` at the top of this section (or tell the driver in session), then `/graph-implement PRD/work/follow-ups-keep-their-rules/`. On resume the driver restores `STATUS.ship-ready` and enters at `review` (node 7), not `close` — review has not run.
- Earlier gate: `define`, RESOLVED 2026-10-12 — 11 of 11 verdicts accept (docs PR https://github.com/ChrisMiho/TheJudge/pull/296); see `## Gate verdicts`.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-246` | accept | "Accepted as proposed." Records a follow-up item that is not part of this build: once REQ-247's pushback mode exists, test a variant for new-topic follow-ups where the follow-up's own search fills only excerpt slots the opening question left free, never displacing an opening-question excerpt (first case: the Necropotence "what about end step cleanup?" turn). |
| `REQ-247` | accept | — |
| `REQ-178` | accept | — |
| `REQ-022` | accept | — |
| `REQ-074` | accept | — |
| `REQ-027` | accept | — |
| `REQ-024` | accept | — |
| `REQ-238` | accept | — |
| `REQ-242` | accept | — |
| `REQ-226` | accept | — |
| `REQ-228` | accept | — |

Tally: 11 accept, 0 edit, 0 reject. `## Blocker questions` in `GATE-QUESTIONS.md` reads "None".

### Brief reconciliation

none

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261012-195753`. Run the `graph-preflight` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` and follow its `## Procedure` exactly) with:

- `--branch thejudge-auto/follow-ups-keep-their-rules`
- `--slug follow-ups-keep-their-rules`
- `--run-id graph-20261012-195753`

Rules:
- Run every command from the launch root `/Users/chrismiho/Coding/Projects/TheJudge` (print `pwd` in the same call as any `--take-lock` or real preflight command). Copy the `Working directory:` line above, unchanged, into any prompt you write.
- Dry run first, then the real run, with the same `--run-id`. Issue the liveness canary(ies) the skill describes and report the exact deny text you observed.
- Do not edit any file by hand. Use short, separate Bash calls. Spawn no subagents, do not sleep or poll, stay well under 40 tool calls.
- Do not touch the launch checkout's branch, index or working tree. Do not merge, close, or force-push anything.
- If any step fails or is denied, stop and report it verbatim; do not retry a denied command.

Report back, plainly:
1. the kickoff worktree absolute path and the branch it is on;
2. that the branch is pushed to origin (show the `git ls-remote` line);
3. the lock file contents at `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock`;
4. the canary command(s) and the exact deny text;
5. the `Profile:` line preflight printed;
6. `git status --porcelain` of the launch root before and after.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules

You are node 2 (`shape`) of graph run `graph-20261012-195753`. Run the `thejudge-kickoff` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules/.claude/skills/thejudge-kickoff/SKILL.md` and follow it in its orchestrated mode).

- Request: Follow-ups keep their first-turn rule excerpts, and the answer-quality eval gains a pushback follow-up mode.
- Slug (use exactly): `follow-ups-keep-their-rules`. Package: `PRD/work/follow-ups-keep-their-rules/` inside the working directory above.
- Staged intake (absolute): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261012-195753/`. It holds two files: `GRAPH-BRIEF.md` (the probe's self-contained brief, verbatim) and `DRIVER-NOTE-changes-since-the-brief.md` (facts about merges after the brief was written). Copy both verbatim into `PRD/work/follow-ups-keep-their-rules/intake/` as the skill says. Intake is evidence, never authority; never open documents it cites.
- Under graph control, search `PRD/instructions/receipts/` for prior runs on the same ground and write one `## Prior run` line per match into `IDEA.md`.
- Create `STATUS.ideation` and the board row under `## ideation` in `PRD/work/STATUS.md`, as the skill says.

Rules:
- Work only inside the working directory above. Copy the `Working directory:` line, unchanged, into any prompt you write. Never touch `/Users/chrismiho/Coding/Projects/TheJudge` outside `.worktrees/kickoff-follow-ups-keep-their-rules/`, except reading the staged intake folder.
- Change files with the Write and Edit tools only. Run git as short, separate calls (`git add <explicit paths>`, then `git commit`, then `git push`); never `git add -A` or `git add .`. Commit and push on `thejudge-auto/follow-ups-keep-their-rules` only if the skill tells you to commit; otherwise leave the changes for the driver.
- Do not delete the staged intake folder yourself (removal under `.worktrees/` is denied); report that you left it.
- Spawn no subagents, do not sleep or poll, and stay well under 60 tool calls. Do not decide product behaviour; this node only names and frames the package.
- If a command is denied, stop and report it verbatim; never retry it.

Report back: the package files you created (paths), the `## Prior run` lines, the commit SHA(s) if you committed, and `git status --porcelain` of the working directory at the end. Or report `NO ACTIONABLE PACKAGE` with the reason.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules

You are node 3 (`define`) of graph run `graph-20261012-195753`. Run the `thejudge-refinement` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules/.claude/skills/thejudge-refinement/SKILL.md`, then `PRD/instructions/preparation-contract.md` and `PRD/instructions/graph-workflow-contract.md` sections `## The two runs` and `## Propose / apply / close`) on the package `PRD/work/follow-ups-keep-their-rules/` inside the working directory above. Use the contract's conservative assumption ladder per question; record every material assumption and its evidence in `DESIGN-BRIEF.md`. A genuine decision blocker (the three-condition test) goes in `GATE-QUESTIONS.md` under `## Blocker questions`; do not guess past one.

Inputs:
- `IDEA.md`, `README.md`, and `intake/` (evidence, never authority; never open documents intake cites). `intake/GRAPH-BRIEF.md` was written 2026-10-10, before #293 changed rule search. `intake/DRIVER-NOTE-changes-since-the-brief.md` lists what moved. Re-ground every code reference, line number, count and REQ citation in the brief against the code and `PRD/sections/` in this working directory (which is `origin/main` at `0461969f`); do not carry a pre-#293 number forward unmeasured.
- Current truth: the feature specs under `PRD/sections/`, chiefly `PRD/sections/functional-requirements.md` and `PRD/sections/non-functional-requirements.md`.

What to produce:
1. `PRD/work/follow-ups-keep-their-rules/DESIGN-BRIEF.md`: the player outcome first, in game terms; the design; acceptance targets that are measurable; assumptions with evidence; non-goals.
2. When the change needs product truth: `PRD/work/follow-ups-keep-their-rules/GATE-QUESTIONS.md`, one `## <STABLE-ID>` block per new or amended stable ID. Each block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides, In plain terms, What happens if you say no), then that ID's complete proposed diff (never a summary), then `- Verdict:` and `- Reason:` left blank for the owner. New IDs start above the highest on main: REQ-246 and NFR-020 are the next free ones. Never mint a DEC.
3. Enumerate every existing requirement line the change contradicts or must amend with one quoted, line-level grep over `PRD/sections/` (for example follow-up, conversation history, retrieval query, excerpt), and record a disposition row per hit (amend, build, or no change) in `PRD/work/follow-ups-keep-their-rules/evidence/amendment-grep.md`. Every amend row becomes a slot in `GATE-QUESTIONS.md`.
4. Any numeric acceptance target must be measured against real data in this working directory before you set it (offline only: local embedder, frozen fixtures, the committed corpus). Record the command and output under `evidence/`.
5. Set `STATUS.refining` while working. When the brief and proposal are complete, set `status: refined` in the README, replace the marker with `STATUS.refined` (exactly one marker), and move the board row in `PRD/work/STATUS.md` under `## refined`.

Rules:
- Never edit `PRD/sections/`, code, tests, or data. Write only inside `PRD/work/follow-ups-keep-their-rules/` and the board row in `PRD/work/STATUS.md`. Do not touch `GRAPH-RUN.md`; the driver owns it.
- No paid or network calls: no live model calls, no `--confirm-live-calls`, no `npm run data:refresh`, no S3. Offline measurement only. Never write a practice-suite question, answer, id, card list or per-question result into any file; counts only, and never the suite's source name.
- Change files with the Write and Edit tools only. Do not commit or push; the driver commits between nodes. Never run `git add -A` or `git add .`.
- If a linked-worktree cache is missing (for example `apps/backend/data/models/` for the local embedder, or `node_modules`), say so in the brief and measure what you can without it; do not copy anything from outside this working directory.
- Copy the `Working directory:` line, unchanged, into any prompt you write. Spawn no subagents or forks, do not sleep or poll, and stay well under 150 tool calls.
- If a command is denied, stop and report it verbatim; never retry it.

Report back: the files you wrote, every proposed stable ID (new and amended) with one plain line each, any blocker question, the measured numbers behind each acceptance target, the final STATUS marker, and `git status --porcelain` of the working directory.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules

You are node 4 (`gate-qc`) of graph run `graph-20261012-195753`, attempt 1. Run the `thejudge-quality-check` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-follow-ups-keep-their-rules/.claude/skills/thejudge-quality-check/SKILL.md` and `PRD/instructions/preparation-contract.md`) on `PRD/work/follow-ups-keep-their-rules/` in the working directory above, in orchestrated mode.

Grade `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` against the skill's checklist and the current truth in `PRD/sections/`. In particular check:
- every old and context line in each `GATE-QUESTIONS.md` diff matches the current `PRD/sections/` text at the stated place, verbatim;
- every amend row in `evidence/amendment-grep.md` has a slot in `GATE-QUESTIONS.md`, and no slot is missing for a requirement the brief changes;
- each slot opens with the three plain-language lines (What this decides, In plain terms, What happens if you say no) and leaves `- Verdict:` and `- Reason:` blank;
- new IDs are REQ-246 and REQ-247 and collide with nothing on main; no DEC is minted;
- every numeric acceptance target cites a measurement under `evidence/`, and the brief's code references (file and line) are true in this working directory;
- no practice-suite question, answer, id, card list or per-question result appears in any package file.

Emit an explicit PASS or FAIL. On FAIL, list every issue completely, each with file, line and the fix needed; do not fix anything yourself beyond what the skill allows in orchestrated mode, and set the status markers as the skill says. On PASS, leave the package at `STATUS.refined`.

Rules:
- Verify directly by reading files and running short greps. Spawn no subagents or forks, do not sleep or poll, and stay well under 60 tool calls.
- Write nothing except what the skill requires on FAIL (status marker, README status line, board row). Use the Write and Edit tools for any file change. Do not commit or push. Do not touch `GRAPH-RUN.md`.
- No paid or network calls. Do not run the package's measurement scripts; read their recorded output.
- Copy the `Working directory:` line, unchanged, into any prompt you write. If a command is denied, stop and report it verbatim; never retry it.

Report back: PASS or FAIL, the complete issue list on FAIL, and `git status --porcelain` of the working directory.

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules

You are the gate-resolution step of graph run `graph-20261012-152231` (build half), attempt 1, on branch `thejudge-auto/follow-ups-keep-their-rules-work`. Run the `graph-gate-review` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules/.claude/skills/graph-gate-review/SKILL.md` in full) on `PRD/work/follow-ups-keep-their-rules/` in the working directory above.

The owner's answered `GATE-QUESTIONS.md` merged to main in PR #296: 11 slots, all `accept`. Apply the verdicts inside `GATE-QUESTIONS.md` as the skill says (finalize the proposal in the work folder; never edit `PRD/sections/`). Reconcile `DESIGN-BRIEF.md` and the README intake pointer to every `edit` or `reject` — with all-accept there may be none, but check, and report a `### Brief reconciliation` list (write `none` if empty). The REQ-246 reason records a follow-up item that is explicitly not part of this build; keep it recorded, do not fold it into scope. Write the `## Gate verdicts` section into `GRAPH-RUN.md`, resolve `## Open gate` there, and restore `STATUS.refined` (exactly one marker) with the board row in `PRD/work/STATUS.md` under refined (move the row fully: remove from the old section, add to the new).

Rules:
- Use the Write and Edit tools for every file change. Run git as short separate calls (`git add <path>`, then `git commit`, then `git push -u origin thejudge-auto/follow-ups-keep-their-rules-work`). Stage explicit paths only.
- Spawn no subagents or forks, do not sleep or poll, and stay under 60 tool calls. No paid or network calls other than the push.
- Do not touch `PRD/sections/`, code, or any `thejudge-*` skill.
- Copy the `Working directory:` line, unchanged, into any prompt you write. If a command is denied, stop and report it verbatim; never retry it.

Report back: the verdict tally, the `### Brief reconciliation` list, the commit sha, the final STATUS marker, and `git status --porcelain` of the working directory.

### gate-qc (build half)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules

You are node 4 (`gate-qc`) of graph run `graph-20261012-152231` (build half), attempt 1, re-entered after gate resolution, on branch `thejudge-auto/follow-ups-keep-their-rules-work`. Run the `thejudge-quality-check` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules/.claude/skills/thejudge-quality-check/SKILL.md` and `PRD/instructions/preparation-contract.md`) on `PRD/work/follow-ups-keep-their-rules/` in the working directory above, in orchestrated mode.

The owner accepted all 11 slots with no edit or reject, and gate review reconciled nothing. Re-grade the finalized package against current truth on this branch (cut from `origin/main` at `67678d05`): `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md`. In particular check:
- every old and context line in each `GATE-QUESTIONS.md` diff still matches the current `PRD/sections/` text verbatim (main may have moved since the spec-forming half graded it at `0461969f`);
- REQ-246 and REQ-247 still collide with nothing in `PRD/sections/`;
- the brief's code references (file and line) are still true in this working directory;
- the brief is consistent with every verdict in `## Gate verdicts` of `GRAPH-RUN.md`, and the REQ-246 follow-up item recorded there is not in the brief's build scope.

Emit an explicit PASS or FAIL. On FAIL, list every issue completely, each with file, line and the fix needed; set the status markers as the skill says and fix nothing else. On PASS, leave the package at `STATUS.refined`.

Rules:
- Verify directly by reading files and running short greps. Spawn no subagents or forks, do not sleep or poll, and stay well under 60 tool calls.
- Write nothing except what the skill requires on FAIL (status marker, README status line, board row). Use the Write and Edit tools for any file change. Do not commit or push. Do not touch `GRAPH-RUN.md`.
- No paid or network calls. Do not run the package's measurement scripts; read their recorded output.
- Copy the `Working directory:` line, unchanged, into any prompt you write. If a command is denied, stop and report it verbatim; never retry it.

Report back: PASS or FAIL, the complete issue list on FAIL, and `git status --porcelain` of the working directory.

### plan

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules

You are node 5 (`plan`) of graph run `graph-20261012-152231`, attempt 1, on branch `thejudge-auto/follow-ups-keep-their-rules-work`. Run the `thejudge-map-out` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules/.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` in full) on `PRD/work/follow-ups-keep-their-rules/` in the working directory above, in orchestrated mode.

Inputs: `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (11 accepted slots), `evidence/`, and `## Gate verdicts` in `GRAPH-RUN.md`. The README `## Preparation gate` records `Quality-check: PASS`; verify it there before writing anything. The REQ-246 follow-up item recorded in `## Gate verdicts` is out of this build's scope; do not slice it.

Write `GAMEPLAN.md`, the lettered `slice-<letter>.md` docs, and one `slice-<letter>.criteria.json` beside each slice doc (every criterion `false`, each with an evidence block, per the map-out reference). Each slice that changes behavior names the `PRD/sections/` truth it applies by intent from the accepted slots, together with its code. The build node runs `thejudge-implement-all` in this same worktree on this same branch, so plan no second worktree and no contributor branch. No slice may require a paid or live model call to pass its criteria; offline tests and dry runs only. Set `STATUS.active` (exactly one marker), update the README status line, and move the board row in `PRD/work/STATUS.md` fully from refined to active.

Rules:
- Use the Write and Edit tools for every file change. Do not commit or push; the driver commits between nodes. Do not touch `GRAPH-RUN.md`, `PRD/sections/`, code, or any `thejudge-*` skill.
- Spawn no subagents or forks, do not sleep or poll, and stay under 120 tool calls. No paid or network calls.
- Copy the `Working directory:` line, unchanged, into any prompt you write. If a command is denied, stop and report it verbatim; never retry it.

Report back: the slice list with one plain line each, the files you wrote, the final STATUS marker, and `git status --porcelain` of the working directory.

### build

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules

You are node 6 (`build`) of graph run `graph-20261012-152231`, attempt 1. Run the `thejudge-implement-all` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-follow-ups-keep-their-rules/.claude/skills/thejudge-implement-all/SKILL.md` and every file it points to, in full) on `PRD/work/follow-ups-keep-their-rules/` in orchestrated mode. Shared branch: `thejudge-auto/follow-ups-keep-their-rules-work`, already checked out in the working directory above; work there in place. Create no second worktree and no contributor branch. The README `## Autonomous metadata` names `origin/main` as the base.

Implement slice A, then slice B, as their slice docs and `GAMEPLAN.md` state. Apply the accepted `PRD/sections/` truth by intent from the finalized `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` against current truth, together with the code, in the slice that names it. A lands as its own commit before B. Use test-driven development. Earn every criterion in `slice-a.criteria.json` and `slice-b.criteria.json` by running its evidence; set a criterion `true` only after its evidence ran and passed. For a `manual` criterion, write a dated observation line naming its id saying what you saw, including when an asset is absent. If B10 (embedder repeatability) fails, stop and report: that decision is the owner's. When both slices are done and verified, open the code PR `thejudge-auto/follow-ups-keep-their-rules-work` into `main` with `gh pr create --base main` (the body opens with the plain-language summary the standard requires and names the post-merge paid before/after runs as owner steps), and set `STATUS.ship-ready` as the skill says.

Rules:
- Every write stays inside the working directory above; write nothing in `/Users/chrismiho/Coding/Projects/TheJudge` outside `.worktrees/implement-follow-ups-keep-their-rules/`. Report every path you wrote.
- Use the Write and Edit tools for every file change. Run git as short separate calls (`git add <explicit paths>`, then `git commit`, then `git push -u origin thejudge-auto/follow-ups-keep-their-rules-work`). Never `git add -A` or `git add .`. Never merge or close a PR.
- No paid or live model calls, and no `--confirm-live-calls`. No `npm run data:refresh`. Never read `.secrets/`. Do not touch `GRAPH-RUN.md` or any `thejudge-*` skill.
- No practice-suite question, answer, id, card list or per-question result in any committed file.
- Spawn no subagents or forks. Do not sleep or poll; run long test commands in the foreground.
- Copy the `Working directory:` line, unchanged, into any prompt you write. If a command is denied, stop and report it verbatim; never retry it.

Report back: per slice, the commits and what each criterion's evidence showed; every path you wrote; the PR URL; the final STATUS marker; and `git status --porcelain` of the working directory.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "merged it, start the follow-ups build" (owner, in session 2026-10-12; mechanics: launch the queued follow-ups kickoff from `PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md`) | answered-once | preflight | — |
| "fill in the answers with your recommendation" (owner, in session 2026-10-12, after the PR #296 summary; covers exactly the 11 slots of this `GATE-QUESTIONS.md`; the driver filled 11 accept verdicts, REQ-246 accepted as proposed with a recorded follow-up item for new-topic follow-ups) | answered-once | gate-qc | — |
