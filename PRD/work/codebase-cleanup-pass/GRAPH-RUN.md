# Graph run — codebase-cleanup-pass

- Run ID: `graph-20261018-175940` (build half; spec-forming half `graph-20261018-162925`)
- Profile: `loaded (env sentinel)` at node 1
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent: [graph-boundary] rm -rf is denied in every session; graph canary nohup true: nohup is denied while a graph run holds the lock)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-162925/` (13 files, copied verbatim to `PRD/work/codebase-cleanup-pass/intake/`; the staging folder's removal was denied to node 2 as `rm -rf` and is left for the owner)
- Current node: `build`
- Next action: `/graph-implement PRD/work/codebase-cleanup-pass/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/codebase-cleanup-pass` pushed (`git ls-remote` → `1c1f3dcf` = `origin/main`) from `.worktrees/kickoff-codebase-cleanup-pass`; launch checkout still on `main`, porcelain only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`; lock `.worktrees/.graph-run.lock` runId `graph-20261018-162925` pid 37951; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/codebase-cleanup-pass/` (IDEA.md with 8 `## Prior run` lines, README.md, STATUS.ideation, 13 `intake/` files each `cmp`-identical to staging) and board row committed `f8d615c8`, pushed (= origin tip); worktree porcelain empty; staging folder removal denied (`rm -rf`), not retried | 2026-10-18 |
| 3 | define | opus | ok | `0 → 46` | commit `9179a7df` (= origin tip): `DESIGN-BRIEF.md` (712 lines; slices A–J — test speed and temp cleanup, frontend test setup and helpers, passing type/lint checks on, Lambda package and CI and script helpers, combo prefilter K-01, prompt pipeline once, rule-search scoring with order snapshot, In-Depth dead wiring, scanner hook dead returns, dead CSS plus parse check; 68 ids dispositioned: 47 built in whole or part, 14 later package, 3 folded into pending briefs, 1 `codehealth`, 3 owner-only; 26 follow-ups incl. In-Depth duplicate-Stack scan with no message); no `GATE-QUESTIONS.md` (no product truth, no blocker) → no gate; `STATUS.refined` only marker, board row moved; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty in worktree, launch checkout only the pre-existing untracked probe folder | 2026-10-18 |
| 4 | gate-qc | sonnet | ok | `0 → 36` | PASS, 0 blocking, 5 advisory (A1 `master` trigger vs `PRD/instructions/ci.md:6`; A2 disposition count split 36 + 11; A3 timing wording vs slice E; A4 builder re-reads probe line numbers; A5 slice J PR states Life Tracker table styles are in the dump); ~35 cited source lines matched; collision claims vs `intake/GRAPH-BRIEF-*.md` hold; `QUALITY-CHECK.md` commit `36cbd8ae` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 5 | gate-review | driver | ok | `degraded (no run state)` | build half run `graph-20261018-175940`: docs PR #321 merged (`origin/main` `4fa69419`); kickoff worktree removed clean (`git worktree remove`); claim commit `60c00b58` on `thejudge-auto/codebase-cleanup-pass-work` cut from `origin/main` `4fa69419`, pushed; lock taken from the launch root (`node scripts/graph-preflight.mjs --take-lock`); graph canary `nohup true` denied; no `GATE-QUESTIONS.md` → nothing to apply, driver restored `STATUS.refined` (only marker), README status, board row under refined | 2026-10-18 |
| 6 | gate-qc | sonnet | ok | `0 → 14` | attempt 2 PASS, 0 blocking, 2 advisory (A1 slice K must also fix the moved `useLifeTracker.ts`'s own relative imports — `../../types`, `./counters`, `./persistence`, `./state`, `./types`; A2 some cited lines are still the probes' and marked so); counts re-checked 37 + 12 built of 68; `## Owner decisions` consistent with slices, dispositions, follow-ups 25 and 27; `QUALITY-CHECK.md` commit `2742a2be` (= origin tip); `STATUS.refined` only marker; worktree porcelain empty; launch porcelain unchanged (only the pre-existing untracked probe folder) | 2026-10-18 |
| 7 | plan | sonnet | ok | `0 → 40` | commit `6f3c3c1c` (= origin tip): `GAMEPLAN.md`, `slice-a.md`…`slice-k.md`, 11 `slice-*.criteria.json` (114 criteria, all `false`), `STATUS.active` only marker, README slice table, board row under active; Preparation gate PASS verified before writing; attempt-2 advisory folded into slice K step 4 / K4; deliverables kept outside `PRD/work/` at `docs/design/codebase-cleanup-pass/slice-j/` and `slice-k/`; no post-merge criteria; worktree porcelain empty; launch porcelain unchanged | 2026-10-18 |

## Gate verdicts

- None to apply: refinement proposed no product-truth change, so there is no `GATE-QUESTIONS.md`. The owner's in-session answers (below) were folded into `DESIGN-BRIEF.md` `## Owner decisions` before the docs PR merged; `gate-qc` attempt 2 re-grades that edited brief.

## Open gate

- None (resolved: docs PR #321 merged 2026-10-18; build half running).
- History — spec-forming park: PARKED at `owner-action` after `gate-qc` PASS attempt 1; resume was the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/321.
- Owner answers (2026-10-18, in session, recorded under `DESIGN-BRIEF.md` `## Owner decisions`): (1) drop the CI `master` trigger and fix `ci.md`; (2) remove `exampleoutput.txt` and `purple-gold-handoff/` from the repo, no backup; (3) build the three Life Tracker cleanups as slice K with the REQ-202 screenshot pair; (4) Prettier reformat later as its own PR. Gate-qc advisories A1, A2, A3 and A5 are folded into the brief; A4 was already required.
- Also for the owner: the staging folder `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-162925/` is still on disk (node 2's `rm -rf` was denied); remove it by hand when convenient.

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261018-162925`. Follow the skill at /Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md exactly (read it first, and read PRD/instructions/graph-workflow-contract.md as it asks).

Inputs:
- --branch thejudge-auto/codebase-cleanup-pass
- --slug codebase-cleanup-pass
- --run-id graph-20261018-162925
- --pid 37951 (the driver session's long-lived pid)
- base: default (origin/main)

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/codebase-cleanup-pass --slug codebase-cleanup-pass --run-id graph-20261018-162925 --pid 37951 --dry-run` from the working directory above. Report the shape, base, worktree, planned commands, `profile sentinel:` and `Profile:` lines verbatim.
2. If it exits 1 or 2, stop and relay the message verbatim. Do not resolve anything by hand.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary command the script prints (`CANARY_COMMAND`) as its own Bash tool call and confirm the hook denies it. Then issue the graph canary (`GRAPH_CANARY_COMMAND`, after the lock is taken) as its own Bash call and confirm it is denied. Report both reason texts verbatim. An allowed canary means BLOCKED: report it and stop.
5. Confirm end state with short separate commands: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass && git branch --show-current`; `git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass`; and at the launch root `git branch --show-current` (must still be `main`) and `git status --porcelain` (the only expected entry is the untracked `PRD/work/probe-codebase-health-pass/`, which was there before the run). Also `cat /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock`.

Rules: never commit, stash, or switch the launch checkout; never force-push; never remove the lock or any `.worktrees/` control file; never retry a denied call verbatim. If you write any file, use the Write/Edit tools, not heredocs or sed -i. Run git as short separate calls. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report with these lines: `outcome: ok|failed`, `shape:`, `base:`, `worktree:` (absolute path), `branch pushed:` (ls-remote sha), `launch branch:`, `launch porcelain:`, `lock:` (the JSON), `canary:` (reason text), `graph canary:` (reason text), `profile:` (the Profile line verbatim).

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass

You are node 2 (`shape`) of graph run `graph-20261018-162925`. Run the `thejudge-kickoff` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass/.claude/skills/thejudge-kickoff/SKILL.md and follow it, in its graph-controlled mode) to capture one new idea package. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself. That kickoff worktree is on branch `thejudge-auto/codebase-cleanup-pass`, already pushed.

Slug (use exactly): `codebase-cleanup-pass` → package folder `PRD/work/codebase-cleanup-pass/`.

The owner's request, verbatim: `I am stepping away for a few hours, can you do a deep investigation of the code base, trying to indentify poorly written, organized, or un-optimized code, that could be cleaned up within the repo, this is a cleanup exercise, we do not want to affect functionality, but i would like to take a deep pass at the code's health`

Intake: 13 files, staged verbatim in the absolute folder /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-162925/ . Origin: the 2026-10-18 driver investigation for this request (four read-only probes: `FINDINGS-frontend-code-quality.md`, `FINDINGS-styling-organization.md`, `FINDINGS-backend-code-quality.md`, `FINDINGS-scripts-tooling-tests.md`, rolled up in `HEALTH-REPORT-2026-10-18.md`) plus the owner's 2026-10-17 code health probe, copied from the untracked folder `PRD/work/probe-codebase-health-pass/` in the launch checkout (`HEALTH-REPORT.md`, three `FINDINGS-*.md`, and the four still-pending cluster briefs `GRAPH-BRIEF-{popups,card-search,card-rings,backend-health}.md`, included so refinement knows which files those runs own). Copy every file byte-for-byte into `PRD/work/codebase-cleanup-pass/intake/` with `cp`, confirm each with `cmp`, and commit them. Intake is evidence, never authority (contract `## Intake is evidence, never authority`): never open, read, or fetch any document the intake cites — record only paths as citations.

Required outputs:
1. `PRD/work/codebase-cleanup-pass/IDEA.md` capturing the request (quote it verbatim) and what it means in player terms: nothing a player sees, hears, or waits for changes — same answers, same screens, same messages, same timing — while the code underneath gets easier and safer to change, the test suite gets faster and stops leaking temp files, and dead code and dead styles go away. The one player-visible gain allowed is less wasted server work per In-Depth question (K-01), with identical output. Point at `intake/HEALTH-REPORT-2026-10-18.md` and `intake/HEALTH-REPORT.md` for the detail. Record as open questions for refinement, without deciding them: which findings belong in this package versus later; how to avoid files the four pending cluster briefs own; how the 2026-10-17 `codehealth` queue relates to this package; and the player-visible bugs the probes found that are out of scope here (In-Depth duplicate Stack scan refused with no message, and the other items in each findings file's behavior-changes list) — those must be recorded as follow-ups, not built.
2. Grep `PRD/instructions/receipts/` for prior runs against the same ground (health, cleanup, duplication, codehealth, hygiene, refactor, dead code) and write one `## Prior run` line per match into IDEA.md (flat list; no chain walk; do not open documents those receipts cite).
3. Package `README.md` and exactly one `STATUS.ideation` marker, per the kickoff skill. The README should point at the `intake/` folder. Do NOT write `## Autonomous metadata` or `## Preparation gate` — the driver owns those.
4. Add the board row in `PRD/work/STATUS.md` per the kickoff skill.
5. Do not edit `PRD/sections/` or any code. Do not decide product behavior; record open questions in IDEA.md for refinement.
6. Commit with explicit paths only, as short separate calls run from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash); the `cp` calls for the intake copy are the exception. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

If the request cannot be made into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason instead.

Return a short report: `outcome: ok|NO ACTIONABLE PACKAGE|failed`, files written, prior-run matches, commit sha, push result (`git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass`), and `git status --porcelain` of the working directory (must be empty).

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass

You are node 3 (`define`) of graph run `graph-20261018-162925`, attempt 1. Run the `thejudge-refinement` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass/.claude/skills/thejudge-refinement/SKILL.md and follow it in its graph-controlled mode) on the package `PRD/work/codebase-cleanup-pass/`. Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close`, `## The two runs` and `## Intake is evidence, never authority`, and `PRD/instructions/plain-language-standard.md`. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

The owner's request is quoted verbatim in `IDEA.md`: a behavior-preserving cleanup of poorly written, poorly organized, or un-optimized code. The evidence is in `intake/` — start with `intake/HEALTH-REPORT-2026-10-18.md`, then the four 2026-10-18 `FINDINGS-*.md` files (ids Q-, C-, K-, T-), then `intake/HEALTH-REPORT.md` (its `codehealth` queue) for overlap. Intake is evidence, not authority: before a finding goes into the brief, read the source lines it cites in this worktree and confirm them. Never open documents the intake cites other than source code, tests, configs, and the `PRD/sections/` pages refinement needs anyway; record other paths only. Do not re-run the probes' measurements unless a claim you build on fails to match the code.

What the brief must settle, as refinement's own judgment recorded with reasons (these are the open questions in `IDEA.md`):
1. Scope. Which findings this package builds, grouped into a sequence of slices sized for one unattended build, and a disposition row for every other Q-, C-, K-, T- id (later package, `codehealth` queue, owned by a pending cluster brief, behavior change, or owner-only). Every built change must keep what a player sees, hears, or waits for identical — same answers, prompts, retrieved rules and their order, screens, messages, timing — and each slice names the existing or new test that proves it.
2. Collisions. The four pending briefs in `intake/GRAPH-BRIEF-*.md` own certain files; each finding's `Overlap:` line names them. Decide per finding whether it is excluded, deferred until that brief ships, or confined to a region the brief does not touch.
3. Protected and owner-only paths. `scripts/graph-boundary-hook.mjs`, `.claude/**`, `CLAUDE.md`, and every `thejudge-*` / `codehealth` skill are out of bounds for a build. Items a finding marks owner-only, and edits to files a REQ freezes, are not built here — list them for the owner.
4. Follow-ups. Player-visible bugs and every item in the findings files' behavior-change lists are recorded as follow-ups in the brief, never built here.
5. Product truth. A pure refactor normally needs none. If any change would alter a `PRD/sections/` statement (for example a page that names a file, a script alias, or a value a refactor moves), propose it in `GATE-QUESTIONS.md` per the contract format; otherwise write no questions file. Never edit `PRD/sections/` or code.

Any question that is a genuine product decision goes under `## Blocker questions` in `GATE-QUESTIONS.md` per the preparation contract's three-condition test, evaluated per question when it arises. Do not decide product behavior on the owner's behalf.

Outputs: `DESIGN-BRIEF.md` (and `GATE-QUESTIONS.md` only if product truth is proposed or a genuine blocker exists), `STATUS.refined` as the only marker, the board row moved to refined in `PRD/work/STATUS.md`. Budget: this node has a 150 tool-call cap — read the intake files whole rather than in pieces, and spot-check source lines with targeted reads.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Commit with explicit paths as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt; subagents in this environment cannot write files, so write every artifact yourself.

Return a short report: `outcome: ok|failed`, files written, the slice list in one line each, counts of dispositions by kind, whether `GATE-QUESTIONS.md` exists and its stable ids, commit sha, push result (`git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass`), and `git status --porcelain` (must be empty).

### gate-qc

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass

You are node 4 (`gate-qc`) of graph run `graph-20261018-162925`, attempt 1. Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-codebase-cleanup-pass/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

Context: the request is a behavior-preserving code cleanup (quoted verbatim in `IDEA.md`); the evidence is in `intake/`. Refinement proposed no product-truth change, so there is no `GATE-QUESTIONS.md`. Grade what the skill grades — PRD alignment and agent-readiness — and also check: every slice states how it proves players see no change; no slice edits a protected path (`scripts/graph-boundary-hook.mjs`, `.claude/**`, `CLAUDE.md`, `thejudge-*` or `codehealth` skills) or a file a REQ freezes; no slice silently changes something a `PRD/sections/` page states (if one does, that is a finding, since it would need a proposal); the brief's file-collision claims against `intake/GRAPH-BRIEF-*.md` hold; and a sample of the cited source lines match the code in this worktree. Do not re-run the probes' measurements. Do not decide product behavior; a genuine product decision is a finding, not something to resolve.

Outputs: `QUALITY-CHECK.md` with PASS or FAIL and the complete findings (blocking vs advisory). On FAIL set `STATUS.refining` per the skill; on PASS leave `STATUS.refined`. Do not write `## Preparation gate` in the README — the driver owns it.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Commit with explicit paths as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, blocking findings (each one line), advisory findings (each one line), commit sha, push result (`git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass`), and `git status --porcelain` (must be empty).

### gate-qc (attempt 2, build half)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass

You are node 4 (`gate-qc`) of graph run `graph-20261018-175940` (the build half of this package; the spec-forming half was `graph-20261018-162925`), attempt 2. Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`. Work ONLY inside the working directory above, on branch `thejudge-auto/codebase-cleanup-pass-work` — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

Why a re-grade: attempt 1 passed (see `QUALITY-CHECK.md`), then the owner answered four questions in session and the brief was edited before the docs PR merged — `## Owner decisions` at the top of the brief, a new slice K (Life Tracker cleanups with the REQ-202 screenshot pair), slice D gaining the `ci.md` edit and the removal of `exampleoutput.txt` and `purple-gold-handoff/`, and attempt 1's advisories A1, A2, A3 and A5 folded in. There is no `GATE-QUESTIONS.md`: no product-truth change was proposed. Grade the whole brief as it stands now, with extra care on the edited parts: slice K and its proof that players see no change, slice D's new items, the disposition table and its counts, and that `## Owner decisions` is consistent with the slice text, the disposition table, and the follow-ups list. Keep the attempt-1 checks too: every slice states how it proves players see no change; no slice edits a protected path (`scripts/graph-boundary-hook.mjs`, `.claude/**`, `CLAUDE.md`, `thejudge-*` or `codehealth` skills) or a file a REQ freezes; no slice silently changes something a `PRD/sections/` page states (that would need a proposal and is a finding); collision claims against `intake/GRAPH-BRIEF-*.md` hold; spot-check a sample of cited source lines against the code in this worktree. Do not re-run the probes' measurements. Do not decide product behavior; a genuine product decision is a finding, not something to resolve.

Budget: this node has a 60 tool-call cap. Verify directly: spawn no subagents or forks, do no sleeping or polling, and read the brief whole rather than in pieces.

Outputs: rewrite `QUALITY-CHECK.md` with the attempt-2 verdict (PASS or FAIL) and the complete findings (blocking vs advisory); keep a one-line note that attempt 1 passed. On FAIL set `STATUS.refining` per the skill; on PASS leave `STATUS.refined`. Do not write `## Preparation gate` in the README — the driver owns it. Do not edit `GRAPH-RUN.md` or `PRD/work/STATUS.md`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Commit with explicit paths as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, blocking findings (each one line), advisory findings (each one line), commit sha, push result (`git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass-work`), and `git status --porcelain` (must be empty).

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass

You are node 5 (`plan`) of graph run `graph-20261018-175940`, attempt 1. Run the `thejudge-map-out` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass/.claude/skills/thejudge-map-out/SKILL.md and its `reference.md`, and follow them in graph-controlled mode) on the package `PRD/work/codebase-cleanup-pass/`. Work ONLY inside the working directory above, on branch `thejudge-auto/codebase-cleanup-pass-work` — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

Inputs: `DESIGN-BRIEF.md` (eleven behavior-preserving slices A–K in a fixed order, with `## Owner decisions`, `## Rules every slice follows`, per-slice detail, and `## Verification commands`), `QUALITY-CHECK.md` (attempt 2 PASS), and the README's `## Preparation gate` (PASS — verify it before writing anything; you cannot self-certify one). There is no `GATE-QUESTIONS.md`: no `PRD/sections/` change is proposed, so no slice writes product truth. The brief already did the research; turn its slice detail into slice docs rather than re-investigating, and re-read source only where a slice doc needs an exact file or line.

Fold in the attempt-2 advisory: slice K's doc must say that moving `useLifeTracker.ts` into `hooks/` also updates that file's own relative imports (`../../types`, `./counters`, `./persistence`, `./state`, `./types`), not only the test's.

Placement: `thejudge-cleanup` deletes `PRD/work/codebase-cleanup-pass/` on this same branch before the owner merges. So anything the code PR must still carry after that — the REQ-202 Life Tracker screenshot pairs for slices J and K, and the slice J computed-style dumps if the brief means them to be kept — must live outside `PRD/work/`, for example under `docs/design/codebase-cleanup-pass/`. Throwaway captures used only during verification may sit in `PRD/work/codebase-cleanup-pass/.playwright-mcp/`. State the chosen location in GAMEPLAN.md and in each affected slice doc.

Criteria files: emit one `slice-<letter>.criteria.json` per slice, every criterion `false`, each with an evidence block per the map-out reference. Evidence must be something the build node does inside this worktree before the code PR is opened: no post-merge or post-deploy checks, and no check that needs the owner. A command criterion should name the exact command the slice doc tells the builder to run.

Outputs: `GAMEPLAN.md`, `slice-a.md` … `slice-k.md`, the eleven criteria files, `STATUS.active` as the only marker, and the board row moved to active in `PRD/work/STATUS.md`. Do not edit `GRAPH-RUN.md`, the README's `## Preparation gate` or `## Autonomous metadata`, `PRD/sections/`, or any code.

Budget: this node has a 120 tool-call cap. Verify directly: spawn no subagents or forks, do no sleeping or polling. Write each file in one Write call where you can.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Commit with explicit paths as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, files written, one line per slice (letter, title, criteria count), the deliverable location you chose, commit sha, push result (`git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass-work`), and `git status --porcelain` (must be empty).

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass

You are node 6 (`build`) of graph run `graph-20261018-175940`, attempt 1. Run the `thejudge-implement-all` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-codebase-cleanup-pass/.claude/skills/thejudge-implement-all/SKILL.md and its `reference.md` in full, and follow them in graph-controlled mode) on the package `PRD/work/codebase-cleanup-pass/`. Shared branch: `thejudge-auto/codebase-cleanup-pass-work` — already checked out in the working directory above and pushed; work in place there, with no second worktree and no contributor branch. The code PR is `thejudge-auto/codebase-cleanup-pass-work → main`, a new PR (docs PR #321 is already merged). Never touch /Users/chrismiho/Coding/Projects/TheJudge itself: every write, including package bookkeeping (slice statuses, criteria files, evidence logs, `STATUS.*`, `PRD/work/STATUS.md`), goes to the copy inside the working directory above, and every path you report must be inside it.

What to build: slices A to K in `GAMEPLAN.md` order, each per its slice doc, the design brief, and the gameplan's `## Rules every slice follows` and `## Per-slice routine`. This is a behavior-preserving cleanup: players see no change except faster In-Depth combo matching (slice E). When a finding's proof fails — golden prompt moves, rule order snapshot moves, built CSS or computed style differs, a test count drops — revert that change and record it in the slice's evidence log; never bend a test or a golden file to pass. There are no `PRD/sections/` edits in this package and no `GATE-QUESTIONS.md`. `PRD/instructions/ci.md` gets the one line edit slice D names.

Criteria: tick a criterion in `slice-<letter>.criteria.json` only after its evidence exists in this worktree; the boundary hook denies a flip whose evidence it has not observed. Every check proves a command ran, not that it passed, so read each command's output and act on failures. The node reports `ok` only when every criterion in all eleven files is `true`.

Environment notes: a linked worktree lacks gitignored caches; if a test or build needs one (for example `apps/backend/data/models/`), copy it from /Users/chrismiho/Coding/Projects/TheJudge into this worktree with `cp -R` (reading the launch checkout is fine; writing to it is not). CI runs Node 22, so a test that passes only on the local Node version is not green. For slices J and K browser captures, save every screenshot with an explicit absolute filename inside this worktree (deliverables under `docs/design/codebase-cleanup-pass/`, throwaway captures under `PRD/work/codebase-cleanup-pass/.playwright-mcp/`), call `browser_close` when done, and stop any dev server you started with a plain `kill <pid>`. Never run `npm run data:refresh`, data rebuilds, paid evals, or deploys.

PR: open it after the first push, following the skill's reference for the title and the registration comment (`<!-- thejudge-auto:v1:registered:codebase-cleanup-pass -->`) exactly. The PR body opens with the plain-language block `PRD/instructions/plain-language-standard.md` requires, says players see no change except faster In-Depth combo matching, and links the REQ-202 screenshot pairs for slices J and K. Never merge or close it. When every slice is done, set `STATUS.ship-ready` per the skill and move the board row.

Mechanics: change files with the Write and Edit tools (no heredocs, no `sed -i`, no long chained Bash). Run git as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`, never `--force`, never `git stash`. Never retry a denied call verbatim; report it. This node has a 4000 tool-call cap. Do not dispatch implementation subagents; if you dispatch any subagent at all, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed|blocked`; one line per slice (letter, done or blocked, criteria true/total, anything reverted); the PR URL; the final commit sha and `git ls-remote --heads origin thejudge-auto/codebase-cleanup-pass-work`; `git status --porcelain` of the working directory (must be empty); and a list of every file path you wrote, as absolute paths.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "this is a cleanup exercise, we do not want to affect functionality" | answered-once | shape | — |
