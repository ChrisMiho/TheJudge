# Graph run — rulesguru-local-suite

- Run ID: `graph-20261010-193032` (spec-forming half); build half `graph-20261010-205704` (lock pid 90418)
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Build canary: `denied — graph tier armed (nohup true)` (build half, lock taken at the launch root)
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261010-193032/`
- Current node: `review`
- Next action: `/graph-implement PRD/work/rulesguru-local-suite/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/rulesguru-local-suite` pushed from `.worktrees/kickoff-rulesguru-local-suite` at `dabad406` (`git ls-remote --heads origin thejudge-auto/rulesguru-local-suite`); lock `.worktrees/.graph-run.lock` pid 81708; launch checkout untouched (still on `main`) | 2026-10-10 |
| 2 | shape | sonnet | ok | `0 → 12` | `PRD/work/rulesguru-local-suite/` (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md and intake/FINDINGS-fit.md byte-identical to the staged copies, `cmp` clean); commit `4cde331b`; 5 prior-run receipts in IDEA.md | 2026-10-10 |
| 3 | define | opus | ok | `0 → 77` | `PRD/work/rulesguru-local-suite/DESIGN-BRIEF.md`, `PRD/work/rulesguru-local-suite/GATE-QUESTIONS.md` (7 stable-ID slots: REQ-232 new, REQ-185, REQ-186, REQ-188, REQ-226, NFR-018, goals-and-non-goals; blockers B1, B2), `STATUS.refined`; commit `09a2779b`; 251-hit line-level grep with dispositions (12 amend / 9 build / 230 keep); REQ-185 diff inserts only, anchored on lines PR #283 does not change; no network request; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 4 | gate-qc | sonnet | failed | `0 → 27` | FAIL attempt 1 — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `6e5cd0d0`, `STATUS.refining`; 3 findings (abbreviated removed line at GATE-QUESTIONS.md:129; permission wording at :67; name-lookup counts lack a command); everything else passed (18/19 diff lines exact, REQ-232 unused, grep 251/251, no RulesGuru text, #283 overlap clean); loop 1 of 3 back to define | 2026-10-10 |
| 5 | define | opus | ok | `0 → 40` | attempt 2 (gate-qc loop 1): commit `62296b1e`; (1) system-map:501 removed line quoted in full, readability note dropped; (2) purge sentence reworded, package grep for permission wording clean (intake left verbatim); (3) `evidence/name-lookup-counts.mjs` + `evidence/name-lookup-counts.out.txt` cited; 19/19 diff lines exact; grep 251/251; 9 verdict slots blank; `STATUS.refined`; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 6 | gate-qc | sonnet | ok | `0 → 18` | PASS attempt 2, findings none — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `60955b1d`; findings 1–3 resolved; 19/19 diff lines exact; grep 251/251; 9 slots blank; no RulesGuru text; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty; README `## Preparation gate` PASS written by the driver; parked `owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/284 | 2026-10-10 |
| 7 | gate-review | sonnet | ok | `0 → 16` | build half run `graph-20261010-205704`: claim commit `5ca804dc` on `thejudge-auto/rulesguru-local-suite-work` cut from `origin/main` `c6dec2ce` (docs PR #284 merge; kickoff worktree removed clean); `graph-gate-review` commit `714b5354`: 9 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; worktree porcelain empty | 2026-10-10 |
| 8 | gate-qc | sonnet | failed | `0 → 28` | FAIL build-half re-grade at `c6dec2ce` (code PR #285 merged after this spec was written) — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `8476a3ef`, `STATUS.refining`, board row under refining; findings bookkeeping only: amendment-set grep 269 hits not 251 with shifted keys, 18 new no-change hits need rows, 3 rows with stale reasons, stale recipe-overlap prose (non-blocking); passed: 19/19 diff lines exact at `c6dec2ce`, added lines read correctly beside #285 wording, build-scope names present, 9/9 verdicts consistent, nothing outside the package changed, no suite content; README `## Preparation gate` FAIL written by the driver; loop 1 of 3 back to define | 2026-10-10 |
| 9 | define | opus | ok | `0 → 55` | build-half refresh (gate-qc loop 1): commit `02a2cc5b`; amendment set rebuilt at `c6dec2ce`: 269 hits = 12 amend / 9 build / 248 no-change, 18 new no-change rows, rows 5/63/89 reasons updated, no hit needed an amendment; evidence `evidence/amendment-grep.cmd.txt`, `evidence/amendment-grep.hits.txt` (269 lines), `evidence/amendment-grep.mjs`; recipe-overlap prose updated to #285 merged at `81739f35`; corpus count bullet 400 → 416 at `c6dec2ce`; `STATUS.refined` only marker, board row under refined; `git diff --stat 714b5354 HEAD -- GATE-QUESTIONS.md intake` empty; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 10 | gate-qc | sonnet | ok | `0 → 19` | PASS build-half re-grade attempt 2, findings none — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `9face57d`; findings 1–4 resolved; amendment grep 269 hits re-run, keys equal `evidence/amendment-grep.hits.txt`; 19/19 diff lines exact at `c6dec2ce`; build-scope names present; 9/9 accept consistent; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; `STATUS.refined`; README `## Preparation gate` PASS written by the driver | 2026-10-10 |
| 11 | plan | sonnet | ok | `0 → 31` | commit `0d2538dd` — `GAMEPLAN.md` + 6 slices with criteria files (A folder/ignore/guards/loader 10; B import and purge 10; C lookup/headers/convert 10; D retrieval check 8; E answer run 11, manual E9; F PRD apply/README/promotion 11, manual F8), all criteria `false`; Preparation gate PASS verified first; `STATUS.active` only marker; board row under active; ignore line and REQ-232 in slice A before import code; no deliverable inside `PRD/work/` (driver grep of GAMEPLAN and slices); `--confirm-live-calls` appears only as refusal tests (E criteria); `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; worktree porcelain empty | 2026-10-10 |
| 12 | build | sonnet | ok | `0 → 155` | code PR https://github.com/ChrisMiho/TheJudge/pull/286 (open, `thejudge-auto/rulesguru-local-suite-work → main`, title `[THEJUDGE-AUTO][READY]`, body carries `thejudge-auto:v1:registered:rulesguru-local-suite`); slice commits A `c78364d9`, B `0b4b1b13`, C `4ae9290a`, D `3a14f0af`, E `61a88876`, F `d85b0fb5`; 60/60 criteria `true` (self-reported: the hook reads criteria from the launch checkout, so no evidence was logged — review re-verifies); `STATUS.ship-ready` only marker; builder reports `npm run quality:check` exit 0; return-side checks: launch `git status --porcelain` identical before/after (`diff` clean), `classifyBuildWrites` over `git diff --name-only origin/main...HEAD` (55 files) → ok, 0 outside; `git diff --stat origin/main -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers apps/frontend` empty; `git ls-files output/rulesguru` empty; builder-reported deviations: import request keys and response envelope written from its own reading (driver note: `intake/FINDINGS-fit.md` and the brief's import section document the API — review checks against them), excluded external cases exempt from the deciding-rule requirement, compare report gained suite level and complexity tables, a few inline python/node edit scripts and one `sed -i` (mechanics, not denied) | 2026-10-10 |
| 13 | review | opus | failed | `0 → 55` | CHANGES REQUESTED at head `ea93c45b`, 1 Important / 0 Critical / 4 Minor; no-write `Plan`-type subagent re-ran `npm run test:scripts` (843 pass), `npm run typecheck`, `npm --workspace apps/backend run test -- src/eval` (135 pass), `npm run quality:check` (exit 0), `git check-ignore -v output/rulesguru/x.json` (`.gitignore:79`), `git ls-files output/rulesguru` (empty); 56/56 accepted added lines present; 60 of 62 criteria verified, B1 and B9 not. Important: `scripts/lib/rulesguru-import.mjs:34-44` `buildSettings` sends plural `levels` (numbers) and `complexities` (lowercase), not the recorded API vocabulary. Driver verified against ground truth — the probe's own crawl script that fetched 918 questions (`/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/2a9717f9-2099-4bce-8a8f-72461dd3bcdf/scratchpad/crawl_rulesguru.py`, settings block lines 5-12, stop rule line 55): singular `level` with the five level strings, singular `complexity` with the three capitalized names, `legality` all, `tags` empty, `tagsConjunc` NOT; and the API wraps back to id 1 past the last question instead of returning an empty batch, which the importer counts as failed requests (`rulesguru-import.mjs:182`), so a complete import would end too-many-failures and never mark complete. Minor (to the receipt): (2) compare report labels suite records under the tiers 1-2 heading (`scripts/lib/answer-compare.mjs:249,348`); (3) excluded suite cases skip the deciding-rule requirement — consistent, no change; (4) loader same-cards-same-answer duplicate check can reject the whole suite (`scripts/lib/gold-cases.mjs:455-462`); (5) rate-limit pattern misses a curly apostrophe. Loop 1 of 2 back to build | 2026-10-10 |
| 14 | build | sonnet | ok | `0 → 23` | attempt 2 (review loop 1): commit `826c5187` — `buildSettings` now sends singular `level` / `complexity` with the probe's values, `legality` all, `tags` empty, `tagsConjunc` NOT (driver read `scripts/lib/rulesguru-import.mjs` and confirmed it matches the probe script); a batch whose highest id is not above the cursor ends the import `end` and complete; mixed batch saves new ids then ends on the wrap; `classifyResponse` accepts a `data` list; 3 tests added; driver re-ran `node --test scripts/lib/rulesguru-import.test.mjs` (16 pass, 0 fail); builder reports `npm run test:scripts` 845 pass and `npm run quality:check` exit 0; return-side checks: launch porcelain identical (`diff` clean), `git diff --name-only 73700b6d HEAD` = 3 files, all inside the worktree; `STATUS.ship-ready`; criteria 60/60 `true` | 2026-10-10 |

## Open gate

- None

## Gate verdicts

Resolved 2026-10-10: 9 of 9 slots answered, all accept (7 stable IDs and 2 blocker questions); docs PR #284 merged.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-232` | accept | — |
| `REQ-185` | accept | — |
| `REQ-186` | accept | — |
| `REQ-188` | accept | — |
| `REQ-226` | accept | — |
| `NFR-018` | accept | — |
| `goals-and-non-goals` | accept | — |
| B1 (promotion) | accept | — |
| B2 (folder) | accept | — |

### Brief reconciliation

none — every verdict was accept, so `DESIGN-BRIEF.md`, the README intake pointer and `GATE-QUESTIONS.md` diffs are unchanged.

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261010-193032`. Invoke the `graph-preflight` skill and follow it exactly with these inputs:

- --branch thejudge-auto/rulesguru-local-suite
- --slug rulesguru-local-suite
- --run-id graph-20261010-193032
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

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rulesguru-local-suite

You are node 2 (`shape`) of graph run `graph-20261010-193032`. Invoke the `thejudge-kickoff` skill and follow it in its graph-controlled mode (`graph is controlling`: no questions to the user, no approval pauses).

Inputs:
- Slug: `rulesguru-local-suite` (use exactly this; the branch `thejudge-auto/rulesguru-local-suite` already exists and is checked out in the working directory above).
- Package path: `PRD/work/rulesguru-local-suite/` inside the working directory above. Never write to the launch checkout /Users/chrismiho/Coding/Projects/TheJudge itself.
- Request (owner, 2026-10-10): Build a local-only RulesGuru practice suite for the rules test harness: a polite, resumable import command that freezes each question as fetched, a converter into the existing case format with card and rule mapping, and suite selection plus level, complexity and tag filters on the retrieval check and the answer-quality run. All RulesGuru data stays on the owner's machine in a gitignored folder and is never committed; tooling is tested on synthetic data only.
- Intake staging folder (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261010-193032/ — it holds two files, `GRAPH-BRIEF.md` and `FINDINGS-fit.md`. Copy each byte-identical into `PRD/work/rulesguru-local-suite/intake/` (use `cp`, then verify each with `cmp`). Leave the staged copies in place. Intake is evidence, never authority: do not open any document it cites.
- Hard constraint from the intake: no RulesGuru question, answer or card-roll text may appear in any committed file. Describe the suite by counts and field names only.

Required outputs:
1. `IDEA.md`, `README.md`, the `STATUS.ideation` marker, and the `PRD/work/STATUS.md` board row, per the skill.
2. Grep `PRD/instructions/receipts/` for prior runs on the same ground (rules test harness, worked solutions, external sources, answer quality) and write one `## Prior run` line per match into IDEA.md (flat list, no chain walk).
3. Commit only explicit paths (`git add <path>` then `git commit` as separate short calls; never `git add -A` or `git add .`), then `git push`. End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Spawn no subagents; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the files created, the commit SHA(s), the push result, the `cmp` results for the intake copies, and the prior-run matches.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rulesguru-local-suite

You are node 3 (`define`) of graph run `graph-20261010-193032`. Invoke the `thejudge-refinement` skill on `PRD/work/rulesguru-local-suite/` and follow it in its graph-controlled mode: no questions to the user, no approval pauses. Refinement proposes; it never edits `PRD/sections/`, code, `.gitignore`, or anything outside the package folder. Read `PRD/instructions/graph-workflow-contract.md` sections `## The two runs` and `## Propose / apply / close` for the `GATE-QUESTIONS.md` format, and `PRD/instructions/plain-language-standard.md` for the three-line opening every gate question carries.

The package intake (`intake/GRAPH-BRIEF.md`, `intake/FINDINGS-fit.md`) is evidence, not authority. Its code facts were read at `main` `dabad406` on 2026-10-10; re-verify any fact your design rests on against the code in the working directory before relying on it. The intake lists five settled decisions (local only; nothing said about the permission beyond used with permission, local only; not ground truth and reported apart; never a build gate; tooling tested on synthetic data) and two open items (promoting a finding into the official corpus; where the local folder lives). Treat the five as the owner's stated intent and the two as owner decisions.

Hard constraints:
- No RulesGuru question, answer or card-roll text in any file you write. Describe the suite by counts and field names only.
- Make no network request to rulesguru.org or any other external site. The intake's measurements stand; nothing here needs a fresh crawl.

Outputs:
1. `DESIGN-BRIEF.md`: the import command (polite rate, adaptive batch size, resumable, freezes each question as fetched, a purge command), the converter into the format version 2 case shape with a full name-to-oracle-id lookup built from committed card data and bare keyword headers mapped to their subrules, and suite selection with level, complexity and tag filters on the retrieval check and the answer-quality run, with every output in a gitignored folder that is ignored before the first import. Include the build scope and how each piece is tested on synthetic data.
2. `GATE-QUESTIONS.md`: one `## <STABLE-ID>` block per stable ID the proposal amends or reserves (the intake names REQ-185, REQ-188 and NFR-018, plus goals-and-non-goals and probably one new REQ for the import, convert and run commands; reserve any new ID by checking the highest in use), each with the complete proposed diff and a blank `- Verdict:` / `- Reason:` slot. Find every line that cites or restates what you amend with one line-level grep over `PRD/sections`, `apps`, `scripts` and `docs`, and give every hit a disposition row in the brief, including hits inside files you would otherwise leave alone.
3. The two open items go under `## Blocker questions`, each written to the plain-language standard with your recommendation and its own blank `- Verdict:` / `- Reason:` slot. Decide nothing on the owner's behalf.
4. Overlap with a parked package. Docs PR #283 (`resolution-recipe-eval`, branch `origin/thejudge-auto/resolution-recipe-eval`) also proposes amending REQ-185 (and REQ-224, REQ-188-adjacent harness flags in `scripts/eval-answer-quality.mjs`). Read its REQ-185 and REQ-224 blocks with `git show origin/thejudge-auto/resolution-recipe-eval:PRD/work/resolution-recipe-eval/GATE-QUESTIONS.md`. The owner plans to build that package first. Write this package's REQ-185 diff against today's live text, and state in the brief how the build applies it by intent if the recipe package's REQ-185 change has landed first, so the two never contradict.
5. Set `STATUS.refined` when done, per the skill, and update the board row.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 150 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the files written, the commit SHA(s), the push result, the stable-ID slots and blocker-question slots (one line each), the grep hit count with its dispositions, and how the REQ-185 overlap is handled.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rulesguru-local-suite

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261010-193032`. Invoke the `thejudge-quality-check` skill on `PRD/work/rulesguru-local-suite/` and follow it in its graph-controlled mode: no questions to the user, no approval pauses. Grade `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` against PRD alignment and agent-readiness and return PASS or FAIL with a complete findings list.

Check directly, at least:
1. Every stable-ID block in `GATE-QUESTIONS.md` (REQ-232, REQ-185, REQ-186, REQ-188, REQ-226, NFR-018, goals-and-non-goals): its removed and context lines match the live `PRD/sections/` text word for word, it carries the three-line plain-language opening, and its `- Verdict:` / `- Reason:` slot is blank. REQ-232 is genuinely unused: no `REQ-232` anywhere in `PRD/sections` today.
2. The brief's line-level grep: re-run the exact command the brief names and confirm every hit has a disposition row and the count matches.
3. The blocker questions B1 and B2 each recommend without deciding and leave the slot blank.
4. The package files contain no RulesGuru question, answer or card-roll text: the suite is described by counts and field names only. Make no network request to rulesguru.org or any other external site.
5. The design keeps the five intake decisions: local only in a gitignored folder ignored before the first import; nothing about the permission beyond used with permission, local only; not ground truth and reported apart from the official headline; never a build gate (no dependency from `npm test`, `npm run quality:check` or CI); tooling tested on synthetic data.
6. The REQ-185 overlap with docs PR #283: read `git show origin/thejudge-auto/resolution-recipe-eval:PRD/work/resolution-recipe-eval/GATE-QUESTIONS.md` and confirm this package's REQ-185 diff touches no line that package rewrites, and that the brief says how the build applies it by intent if that change lands first.
7. Numbers in the brief (name-lookup coverage, grep count) trace to a command or file named in the brief.

Write the report to `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`. On FAIL set the status the skill names. Do not edit the brief or the questions file yourself. The driver writes the README `## Preparation gate` section, so leave it alone.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: PASS or FAIL, the complete findings list, the commit SHA, and the push result.

### define (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rulesguru-local-suite

You are node 3 (`define`), attempt 2 (gate-qc loop 1 of 3), of graph run `graph-20261010-193032`. Invoke the `thejudge-refinement` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses) and fix the gate-qc attempt-1 findings in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. Read `QUALITY-CHECK.md` in full first. Refinement proposes only: no edit to `PRD/sections/`, code, `.gitignore`, or anything outside the package folder. Keep every verdict slot blank. No RulesGuru question, answer or card-roll text in any file, and no network request to any external site.

The findings, as gate-qc wrote them:

> 1. GATE-QUESTIONS.md line 129: the removed system-map Answer-quality `Summary` line is abbreviated with an ellipsis and an unchanged marker, so it is not word for word against `PRD/sections/system-map.md:501`. Quote the full live line as the `-` line and the same line plus the new sentence as the `+` line, then drop the shown-on-its-own-line-for-readability note at lines 137-138.
>
> 2. GATE-QUESTIONS.md line 67 says the purge command deletes the folder if the permission is ever withdrawn. Intake decision 2 allows nothing about the permission beyond 'used with permission, local only'. Reword it to: A purge command deletes the whole folder. Check the brief and every other package file for the same kind of wording and apply the same rule.
>
> 3. The brief's name-lookup numbers (assumption 5 and the Measured coverage paragraph) name files but no command or script, so a reader cannot repeat them. Gate-qc re-measured and all of them hold (37,854 detail ids; 34,639 names in cardMetadata; 34,973 with cardScanMap; 341 of 348 non-token creatures with no rules text named; 19 duplicate non-token names; 400 corpus case files). Keep a small script under `PRD/work/rulesguru-local-suite/evidence/` that prints them, run it, save its output beside it, and cite both.

After fixing, re-check that every removed and context line in every stable-ID diff matches live `PRD/sections/` text word for word, and that the grep disposition table still covers every hit of the brief's grep command. Set `STATUS.refined` again (replacing `STATUS.refining`; exactly one marker), set the README `status:` line, and move the `PRD/work/STATUS.md` board row back under refined. Leave the README `## Preparation gate` section alone; the driver owns it.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 150 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: each finding and how it was fixed (file and section), the evidence script and output paths, the commit SHA, and the push result.

### gate-qc (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rulesguru-local-suite

You are node 4 (`gate-qc`), attempt 2, of graph run `graph-20261010-193032`. Invoke the `thejudge-quality-check` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses) and re-grade `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` after define attempt 2 (commit `62296b1e`). Return PASS or FAIL with a complete findings list.

Check directly:
1. Each attempt-1 finding (1 to 3 in `QUALITY-CHECK.md`) is resolved. For finding 3, run `node PRD/work/rulesguru-local-suite/evidence/name-lookup-counts.mjs` and confirm its output matches `evidence/name-lookup-counts.out.txt` and the numbers the brief cites.
2. Every stable-ID diff's removed and context lines match live `PRD/sections/` text word for word, and each block keeps its three-line opening and a blank verdict slot. REQ-232 is still unused in `PRD/sections`.
3. The brief's grep command still yields the hit count the brief states, each hit with a disposition row.
4. B1 and B2 recommend without deciding and stay blank.
5. No RulesGuru question, answer or card-roll text anywhere in the package, and nothing about the permission beyond 'used with permission, local only' outside the verbatim intake. Make no network request to any external site.
6. Nothing outside the package changed: `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` is empty.
7. Any new problem the edits introduced.

Write the report to `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md` (replace the attempt-1 report, and keep a one-line note that attempt 1 failed on findings 1 to 3). On FAIL set the status the skill names. Do not edit the brief or the questions file. The driver writes the README `## Preparation gate` section, so leave it alone.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: PASS or FAIL, the complete findings list, the commit SHA, and the push result.

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are the gate-resolution step of the build half (run `graph-20261010-205704`) for `PRD/work/rulesguru-local-suite/`, on branch `thejudge-auto/rulesguru-local-suite-work` (claim commit `5ca804dc`, cut from `origin/main` `c6dec2ce`). The owner answered `GATE-QUESTIONS.md` (all 9 slots `accept`, answered in session 2026-10-10) and merged docs PR #284 into `main`. Invoke the `graph-gate-review` skill and follow it exactly:

1. Read every verdict slot; confirm none is blank.
2. Apply the verdicts inside `GATE-QUESTIONS.md` (finalizing the proposal in the work folder). Never edit `PRD/sections/`, code, or `intake/`.
3. Reconcile `DESIGN-BRIEF.md` and the README's intake pointer to every `edit` or `reject` verdict, and report the `### Brief reconciliation` list (none is expected, since every verdict is accept; say so explicitly).
4. Write `## Gate verdicts` in `GRAPH-RUN.md`, resolve `## Open gate` to `- None`, restore `STATUS.refined` as the only marker (replacing `STATUS.owner-action`), set the README `status:` line, and move the `PRD/work/STATUS.md` board row under refined. Leave the README `## Preparation gate` and `## Autonomous metadata` sections and the ledger header lines alone; the driver owns them.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, and add nothing about how use of it was agreed beyond the words used with permission, local only.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the verdict tally, the brief reconciliation list, the marker and board state, the commit SHA(s), and the push result.

### gate-qc (build-half re-grade)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 4 (`gate-qc`), build-half re-grade, of run `graph-20261010-205704` on branch `thejudge-auto/rulesguru-local-suite-work`. Invoke the `thejudge-quality-check` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses). The owner accepted all 9 slots and `graph-gate-review` finalized them (commit `714b5354`, brief reconciliation none). Re-grade `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md` against the current `origin/main` truth and return PASS or FAIL with a complete findings list.

This base (`c6dec2ce`) now includes code PR #285 (resolution-recipe-eval), merged after this spec was written; it amended REQ-185, REQ-187, REQ-224, REQ-228 and REQ-230 in `PRD/sections/functional-requirements.md` and touched `scripts/eval-answer-quality.mjs`, the manifests builder and the compare report. Check directly:
1. Every stable-ID diff's removed and context lines still match live `PRD/sections/` text word for word at this base, and every added line still reads correctly next to the #285 wording around it (in particular REQ-185 and REQ-226/NFR-018 lines that list the experiment and compare requirements).
2. The brief's line-level grep still yields the hit count the brief states at this base, each hit with a disposition row; report any new hit #285 introduced and whether it needs a disposition.
3. The brief's build scope still fits the code at this base: any file, flag, or function it names in `scripts/eval-answer-quality.mjs`, `scripts/build-answer-quality-manifests.mjs`, `scripts/lib/` or `apps/backend/src/eval/` still exists under that name.
4. Every verdict slot is answered and consistent with the brief.
5. Nothing outside the package changed on this branch: `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` is empty.

Write the report to `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md` (replace it, keeping a one-line history of the spec-forming attempts). On FAIL set the status the skill names. Do not edit the brief or the questions file. The driver writes the README `## Preparation gate` section, so leave it alone.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, make no network request to it, and add nothing about how use of it was agreed beyond the words used with permission, local only.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: PASS or FAIL, the complete findings list, the commit SHA, and the push result.

### define (build-half refresh, gate-qc loop 1)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 3 (`define`) of run `graph-20261010-205704`, re-entered after the build-half `gate-qc` FAIL (loop 1 of 3), on branch `thejudge-auto/rulesguru-local-suite-work`. Invoke the `thejudge-refinement` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses) and fix exactly the findings below in `DESIGN-BRIEF.md`. The base is now `c6dec2ce`, which includes code PR #285 (resolution-recipe-eval).

The gate-qc findings, from `QUALITY-CHECK.md` (commit `8476a3ef`):

> 1. The brief's line-level grep returns 269 hits at `c6dec2ce`, not 251; its file:line keys shifted because #285 added lines above them. Refresh the headline count and the rows.
> 2. 18 new hits need rows, none needing an amendment: 16 license lines in new committed #285 case files, 1 REQ-187 line naming the rubric moving again with `--regrade-from` (REQ-226), 1 comment at `rubric.ts:86`.
> 3. Three existing rows changed text and need updated reasons, all staying no-change: the REQ-185 Description line (row 12 says the recipe package rewrites it; #285 has now done so); the REQ-185 agent-approval constraint (now with the per-case define-gate path; a suite case is never approved by any path, which still covers it); the REQ-230 arm list (gains arm R; a suite run refuses every arm but A).
> 4. Non-blocking: the brief's section on overlap with resolution-recipe-eval and its REQ-187 collision note still call the recipe change parked; it has merged. The conclusions hold.

Do:
1. Re-run the brief's own line-level grep at this base and rebuild `## Amendment set`: the new count with its amend / build / no-change split, refreshed file:line keys, a disposition row per hit, the 18 new rows, and the three updated reasons. Save the exact grep command and its raw hit list under `PRD/work/rulesguru-local-suite/evidence/` and cite it.
2. Update the recipe-overlap prose in the brief to say #285 merged at `81739f35`, keeping its conclusions.
3. Leave `GATE-QUESTIONS.md` untouched: its diffs, verdicts, reasons and prose are the owner's accepted record. Leave `intake/`, `PRD/sections/`, code, and the README `## Preparation gate` and `## Autonomous metadata` sections untouched.
4. If refreshing the grep turns up a hit that would need an amendment rather than no-change, do not add one: end the node and report it, because a new product-truth change needs the owner.
5. Restore `STATUS.refined` as the only marker (replacing `STATUS.refining`), set the README `status:` line, and move the `PRD/work/STATUS.md` board row under refined.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, make no network request to it, and add nothing about how use of it was agreed beyond the words used with permission, local only.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 150 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the new hit count and split, the evidence file paths, whether any hit needed an amendment, the marker and board state, the commit SHA, and the push result.

### gate-qc (build-half re-grade, attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 4 (`gate-qc`), attempt 2 of the build-half re-grade, run `graph-20261010-205704`, on branch `thejudge-auto/rulesguru-local-suite-work`. Invoke the `thejudge-quality-check` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses). Attempt 1 failed on bookkeeping findings 1 to 4 in `QUALITY-CHECK.md` (commit `8476a3ef`); `define` refreshed the brief at commit `02a2cc5b` (amendment set 269 hits, 12 amend / 9 build / 248 no-change; evidence under `evidence/amendment-grep.*`; recipe-overlap prose updated). `GATE-QUESTIONS.md` is unchanged since `graph-gate-review` (`714b5354`).

Check directly at base `c6dec2ce`:
1. Findings 1 to 4 are resolved: re-run the command in `evidence/amendment-grep.cmd.txt`, confirm the count, and confirm every hit has exactly one disposition row with a correct key and reason (spot-check the 18 new rows and rows 5, 63, 89).
2. Every stable-ID diff's removed and context lines still match live `PRD/sections/` text word for word, and added lines read correctly beside the #285 wording.
3. The build-scope names in the brief still exist; every verdict slot is answered and consistent with the brief.
4. Nothing outside the package changed: `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` is empty.

Write the report to `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md` (replace it, keeping a one-line history of earlier attempts). On FAIL set the status the skill names. Do not edit the brief or the questions file. The driver writes the README `## Preparation gate` section, so leave it alone.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, make no network request to it, and add nothing about how use of it was agreed beyond the words used with permission, local only.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; verify directly; no sleeping or polling. Stay well under 60 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: PASS or FAIL, the complete findings list, the commit SHA, and the push result.

### plan

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 5 (`plan`) of run `graph-20261010-205704` on branch `thejudge-auto/rulesguru-local-suite-work`. Invoke the `thejudge-map-out` skill on `PRD/work/rulesguru-local-suite/` in its graph-controlled mode (no questions to the user, no approval pauses). First verify `Quality-check: PASS` in the README `## Preparation gate` section; you cannot self-certify one.

Write `GAMEPLAN.md`, the lettered `slice-*.md` docs, and one `slice-<letter>.criteria.json` beside each (every criterion `false`, each with an evidence block), set `STATUS.active` as the only marker, update the README slice table and status line, and move the `PRD/work/STATUS.md` row under active. Slice from `DESIGN-BRIEF.md` (its Build scope and synthetic-data test table) and the finalized `GATE-QUESTIONS.md` (all 9 slots accepted; B1 by hand, B2 `output/rulesguru/`). The build applies the accepted `PRD/sections/` truth by intent, together with the code, so name in each slice which accepted block it applies. The ignore line for the suite folder lands in the first slice, before any import code.

Placement and safety rules:
- Anything that must outlive the package goes in committed code, tests, `apps/backend/src/eval/worked-solutions/README.md`, or under `docs/`, never under `PRD/work/`, because close deletes the package folder.
- The build never runs the real import, convert or suite run against the live source, and makes no network request to it and no live OpenAI call: no `--confirm-live-calls`, no real fetch, in any slice's verification. Tests use injected fetch, clock and client with invented questions in temporary folders, as the brief's test table says. Dry runs are fine.
- Every slice's criteria must be checkable with no suite data present. The owner runs the first real import by hand after the merge.
- Nothing under `apps/backend/src/prompt/`, routes or providers changes.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, and add nothing about how use of it was agreed beyond the words used with permission, local only. Synthetic test questions must be invented, not copied.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; no sleeping or polling. Stay well under 120 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: the slice list (letter, title, criteria count, manual criteria), where every deliverable lands, the marker and board state, the commit SHA, and the push result.

### build

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 6 (`build`) of run `graph-20261010-205704` for `PRD/work/rulesguru-local-suite/`. Shared branch: `thejudge-auto/rulesguru-local-suite-work` — the worktree above is already checked out on it, cut from `origin/main` `c6dec2ce` and pushed; confirm with `git branch --show-current` before anything else. Invoke the `thejudge-implement-all` skill in its graph-controlled mode (no questions to the user, no approval pauses; any stop ends the node `failed` with evidence) and complete slices A to F in the GAMEPLAN order (A first; B and C after A; D after C; E after D; F last).

Setup: this worktree is fresh and has no `node_modules`. Run `npm ci` at the worktree root before the first test. A linked worktree also lacks gitignored caches such as `apps/backend/data/models/`; if a step genuinely needs one, copy it from `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/` into this worktree (reading the launch checkout is fine; writing to it is not).

Scope:
- Work only inside the worktree above. The package lives at its `PRD/work/rulesguru-local-suite/`; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` or anywhere else in the launch checkout. Report every path you wrote as an absolute path.
- Apply each accepted `PRD/sections/` block exactly once, by intent against current truth, in the slice the GAMEPLAN names, committed with that slice's code. `GATE-QUESTIONS.md` (all 9 slots accepted) and `DESIGN-BRIEF.md` are the source.
- Never run the real import, convert or suite run against the live source; make no network request to it and no live OpenAI call; never pass `--confirm-live-calls` except inside a test with an injected fake client. Tests use injected fetch, clock and client, invented questions, and temporary folders. Never read `.secrets/`.
- Nothing under `apps/backend/src/prompt/`, routes, or providers changes.
- If a product question arises that the brief and the accepted slots do not answer, apply the assumption ladder in `PRD/instructions/preparation-contract.md` to that one question; if it does not resolve, end the node `failed` with the question as evidence. Do not decide product behavior.
- Open the code PR with `gh pr create --base main --head thejudge-auto/rulesguru-local-suite-work` after the first slice push, titled `[THEJUDGE-AUTO][IN PROGRESS] RulesGuru local practice suite (rulesguru-local-suite)`. Its body starts with the line `<!-- thejudge-auto:v1:registered:rulesguru-local-suite -->`, then the plain-language block from `PRD/instructions/plain-language-standard.md` (what a player sees: nothing; this adds owner-only tooling for a private, local practice suite), and ends with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. When every slice is done, set the title prefix to `[THEJUDGE-AUTO][READY]`. Never merge or close it.

Privacy: this package concerns a local-only practice suite. Write no question or answer text from that source into any file, commit, PR body, or comment, and add nothing about how use of it was agreed beyond the words used with permission, local only. Synthetic test questions must be invented, not copied.

Criteria:
- Known gap: the boundary hook reads criteria from the launch checkout, which has no slice criteria files, so it logs no evidence and does not guard your flips. Your criteria are self-reported. For each criterion, issue its evidence command in a form its `evidence.command` regex matches, read the real output, and only then set it `true`. A failing command is not evidence. Record the exact command and a one-line result per criterion in the slice doc's notes, so review can re-run it.
- Manual criteria E9 and F8: do the check yourself (E9: confirm from your own command history that no live call or real fetch ran in verification; F8: read the full branch diff and confirm it carries no suite question or answer text), then write a dated observation line in the slice doc of the form `2026-10-10 E9 — <what you checked and found>`.
- Report `ok` only when every criterion in every `slice-*.criteria.json` is `true`, `npm run quality:check` is green on the final commit, and the package is `STATUS.ship-ready` with the board row under ship-ready.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call; never `git add -A` or `git add .`). Never force-push. End every commit message with the line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Spawn no subagents or forks; no sleeping or polling; run no dev server or browser. A script that rewrites a tracked result file must not leave it dirty unless the slice intends the change. Prettier governs only JSON and YAML here: never run prettier on `.ts` or `.mjs`; run `npm run format` for JSON a script wrote. Stay well under 4000 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: per slice — status, commit SHA, criteria true/total; every path written (absolute); the PR URL; the final `npm run quality:check` result; anything left unresolved.

### review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 7 (`review`) of run `graph-20261010-205704`: a fresh-context, no-write reviewer of code PR #286 (`thejudge-auto/rulesguru-local-suite-work → main`). You hold no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Read-only git, file reads, and the local test commands below are allowed.

What it is: owner-only tooling for a private practice suite kept on the owner's machine. It adds a gitignored suite folder `output/rulesguru/` with guards, an importer and purge command, a converter from imported questions to external-tier case files, and a suite mode for the retrieval check and the answer-quality run, plus the accepted `PRD/sections/` edits (new REQ-232; REQ-185, REQ-186, REQ-188, REQ-226, NFR-018, goals-and-non-goals, system-map). Nothing a player sees changes.

Inputs: the diff `git diff origin/main...HEAD`; the package `PRD/work/rulesguru-local-suite/` (`DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` with all 9 slots accepted, `GAMEPLAN.md`, the six `slice-*.md` docs and their `slice-*.criteria.json`, and `intake/FINDINGS-fit.md`).

Rubric — the slices' own acceptance criteria, and nothing else:

Slice A:
- A1: .gitignore contains the output/rulesguru/ line and git check-ignore matches a path inside it
- A2: A committed test asserts check-ignore matches a path in SUITE_DIR and git ls-files lists nothing there
- A3: The ignore guard refuses when check-ignore reports not ignored, naming the .gitignore line
- A4: The path check refuses any target that is not SUITE_DIR or inside it, including symlink escape and parent path
- A5: Default-mode loadGoldCases refuses tier external with the suite-folder message and all corpus cases load unchanged
- A6: External-mode loader accepts a valid null-outcome suite case and refuses approved, corpus tier and missing suite block; excluded duplicates ignored
- A7: Filter and selection helpers are unit-tested on synthetic cases (or within a flag, and across flags, unsupported dropped, excluded and stale counted, seeded sample)
- A8: The no-gate guard lists the new command names and the suite-name guard test passes
- A9: The REQ-232 entry exists in functional-requirements.md with folder, loader, never-a-gate and synthetic-data criteria and no suite question text
- A10: npm run test:scripts and npm run typecheck pass

Slice B:
- B1: First request uses previousId 1 and a from value naming TheJudge (injected fetch)
- B2: With an injected clock no request starts less than 3 s after the previous one finished
- B3: Malformed error halves 50 to 1; failing size-1 records a skip and advances one id; size regrows after five successes
- B4: A frozen file is never overwritten; resume starts after the saved id; state rewritten after each batch
- B5: Network error, 10 consecutive failures and repeated rate-limit after one 30 s wait each stop with state saved; empty batch ends cleanly; counts only
- B6: Purge without --yes deletes nothing and prints the count; with --yes deletes only a temp suite folder; refuses a path outside it
- B7: Every import and purge test uses a temp folder with injected fetch and clock; none names output/rulesguru or passes the global fetch
- B8: package.json has eval:rulesguru:import and eval:rulesguru:purge, the entry runs the ignore guard first, and no live request was made during the build
- B9: The REQ-232 entry gains the import, freeze, resumable and purge criteria
- B10: npm run test:scripts passes

Slice C:
- C1: Name lookup resolves exact, case-insensitive, accent-folded and front-face names from injected sources and ignores ids absent from card detail
- C2: A token loses to a non-token; two non-token matches are unresolved
- C3: A present rule id maps to itself; a bare header maps to lettered subrules only; an unknown id excludes the case
- C4: Synthetic raw files convert to case files that pass the external-mode loader with the brief's field values
- C5: Each exclusion reason is produced by a test and the case file is still written with suite.excluded set
- C6: Two converts of the same inputs give identical bytes and the snapshot comes from injected sources
- C7: Convert fails loudly on a missing field, makes no network call, and tests use temp folders with invented questions only
- C8: package.json has eval:rulesguru:convert and the entry runs the ignore guard first
- C9: The REQ-232 entry gains the convert, name lookup, header and excluded criteria
- C10: npm run test:scripts passes

Slice D:
- D1: Group scoring gives any-reached and all-reached correctly on synthetic cases, including a bare-header group reached by any member
- D2: Level, complexity and CR-section splits are correct and misses list case ids only
- D3: Filters combine (or within a flag, and across flags) in the retrieval path; excluded and stale cases dropped and counted
- D4: An --output outside SUITE_DIR is refused; a path inside a temp suite folder is accepted
- D5: Without --suite the existing corpus run behaves as before; existing tests are green
- D6: The report title says local practice-suite report and the run makes no provider call
- D7: The REQ-232 entry gains the retrieval-check and filters criteria
- D8: npm run test:scripts passes

Slice E:
- E1: A --suite dry run prints the selected count and estimate and makes no client call
- E2: A fake-client live path writes only under the temp runs/<id>/ and leaves results.json and coverage.json byte-identical
- E3: Each refused flag (manifest, changed, all, tier, tag, regrade-from, arm other than A, output-dir outside suite) is refused with a message
- E4: The manifest is built from the filters and saved in the run folder; --sample with --seed is repeatable and the seed recorded
- E5: Suite validation passes a present non-excluded non-stale case and refuses excluded, stale or hash-mismatched ones
- E6: Summary labels Correctness 2 as agreement with RulesGuru split by level and complexity; strata carry level and complexity; compare reads two suite run folders
- E7: --resume reuses the checkpoint and --confirm-live-calls without --max-cost-usd is refused
- E8: Experiment and routine modes are unchanged; existing tests green
- E9: No live call was made in verification; no --confirm-live-calls outside fake-client tests
- E10: The REQ-232 entry gains the answer-quality-run criterion
- E11: npm run test:scripts passes

Slice F:
- F1: REQ-185 holds the local-suite criterion, the constraint, the dependency and the B1 promotion line; the recipe change's two rewritten lines are untouched
- F2: REQ-186, REQ-188 and REQ-226 carry their accepted scoped edits and a REQ-232 dependency line
- F3: NFR-018 carries the description sentence, the gating constraint and the dependency line
- F4: goals-and-non-goals.md and both system-map.md entries carry the accepted edits
- F5: The REQ-232 entry is complete against the accepted block with output/rulesguru/ as the one path
- F6: The nine code, test or doc amendments are applied and the amendment grep shows no line contradicting REQ-232
- F7: The worked-solutions README has the suite pointer section with counts and field names only
- F8: A read-through of the diff finds no suite question, answer, card roll or result text and no permission wording beyond used with permission, local only
- F9: git diff --stat main for apps/backend/src/prompt is empty and no route, provider or frontend file changed
- F10: npm run quality:check passes
- F11: git ls-files output/rulesguru is empty and git status shows no path under output/rulesguru/

Distrust the `true` flags. The boundary hook logged no evidence for this build (it reads criteria from the launch checkout), so every flag is the builder's own claim. Re-verify independently: run `npm run test:scripts`, `npm run typecheck`, `npm --workspace apps/backend run test -- src/eval`, `git check-ignore -v output/rulesguru/x.json`, `git ls-files output/rulesguru`, and `npm run quality:check`. Never run the import, convert, or a suite run against the live source, make no network request to it, and never pass `--confirm-live-calls`.

Look hardest at these, which the builder flagged as its own judgement:
1. The importer's request settings keys and response handling (`buildSettings`, `classifyResponse` in `scripts/lib/rulesguru-import.mjs`) and the converter's field reads (`readRawQuestion` in `scripts/lib/rulesguru-convert.mjs`). The builder said the API shape is not recorded in the repo, but `intake/FINDINGS-fit.md` and the brief's import section document the endpoint, the settings and the response fields. Compare the code against both. A mismatch that would make the owner's first real import or convert fail is a correctness finding.
2. External mode exempting excluded suite cases from the deciding-rule requirement: is it consistent with the accepted REQ-232 and REQ-185 blocks?
3. The compare report gaining suite level and complexity tables, and tier `external` records counted in the compare report's tiers 1-2 group: is that correct against REQ-228 and the accepted blocks?
4. Privacy: the diff carries no suite question, answer, card roll or result text, and no permission wording beyond used with permission, local only.

Severity rule: Critical or Important is reserved for a gap that breaks correctness or a stated criterion above. A preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important and never sends the run back to build; report those as Minor. The builder's use of inline scripts or one `sed -i` for edits is a process note, not a finding.

Leave the worktree as you found it: if a command rewrites a tracked file, say which, and report `git status --porcelain` at the end. Spawn no subagents; no sleeping or polling. Stay well under 120 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: verdict APPROVE or CHANGES REQUESTED; per criterion id, verified or not with the command or file you used; findings as Critical, Important or Minor, each with file and line and the criterion it breaks; the final `git status --porcelain`.

### build (attempt 2, review loop 1)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 6 (`build`), attempt 2, of run `graph-20261010-205704` for `PRD/work/rulesguru-local-suite/`, sent back by review (loop 1 of 2). Shared branch: `thejudge-auto/rulesguru-local-suite-work`, head `ea93c45b`; confirm with `git branch --show-current` first. Code PR #286 is open; keep it open. Under the `thejudge-implement-all` skill in its graph-controlled mode, fix exactly the review findings below in slice B, then re-verify. Do not touch other slices except where a fix requires it.

The review finding, with the driver's ground truth. The probe that successfully fetched 918 questions sent these request settings and stopped on this rule:

> Settings: `level` (singular) = the JSON strings '0', '1', '2', '3', 'Corner Case'; `complexity` (singular) = the JSON strings 'Simple', 'Intermediate', 'Complicated'; `legality` = 'all'; `tags` = empty list; `tagsConjunc` = 'NOT'; plus `previousId`, `count`, `from`.
> End of data: past the last question the API wraps back to id 1 rather than returning an empty batch. The probe stopped when a batch held no new id or its highest id was not above the cursor.

Fix:
1. `buildSettings` in `scripts/lib/rulesguru-import.mjs` sends exactly those keys and values (keep `from` as `FROM_NAME`, which names TheJudge; add no other wording to it). Update the test at `scripts/lib/rulesguru-import.test.mjs:75` to assert the exact keys and values.
2. Treat the wrap as the end. A batch whose highest id is not above the cursor ends the import with stop reason `end` and the state marked complete, instead of counting a failed request; questions at or below the cursor are never overwritten (already frozen). A mixed batch (new ids above the cursor, then wrapped low ids) saves the new ones and advances the cursor to the highest new id. Keep the empty-batch end as well. Add tests for the wrapped batch and the mixed batch with the injected fetch.
3. In `classifyResponse`, also accept a response object carrying the list under `data`, as the probe did, and add a test.
4. Update slice B's doc notes with the command and one-line result for B1, B3, B4, B5 and B9, and keep their criteria `true` only after re-running `node --test scripts/lib/rulesguru-import.test.mjs` and `npm run test:scripts` and reading the output. REQ-232's text needs no change: it already says the import runs to the end of the questions.

Rules unchanged from attempt 1: work only inside the worktree above, never in `/Users/chrismiho/Coding/Projects/TheJudge/` outside it; never run the real import or any network request to the source; no live OpenAI call; tests use injected fetch and clock with invented questions in temporary folders; nothing under `apps/backend/src/prompt/`, routes, providers or frontend changes. Privacy: write no question or answer text from that source anywhere, and no permission wording beyond used with permission, local only. Do not read files outside this worktree's repo tree.

Finish with `npm run quality:check` green on the final commit and the package still `STATUS.ship-ready`. Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`, no inline edit scripts, no long chained Bash. Commit explicit paths only (`git add <path>`, then `git commit`, then `git push`, each a short separate call). Never force-push. End every commit message with the lines: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01VLj4GodNz818wYDBXFXcJc. Spawn no subagents or forks; no sleeping or polling. Stay well under 4000 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: what changed per fix, the tests added, the commit SHA(s), every path written (absolute), the `npm run quality:check` result, and the criteria state.

### review (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rulesguru-local-suite

You are node 7 (`review`), attempt 2, of run `graph-20261010-205704`: a fresh-context, no-write reviewer of code PR #286 (`thejudge-auto/rulesguru-local-suite-work → main`). You hold no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Read-only git, file reads, and local test commands are allowed. Never run the import, convert or a suite run against the live source, make no network request to it, and never pass `--confirm-live-calls`.

What it is: owner-only tooling for a private practice suite kept on the owner's machine (gitignored `output/rulesguru/`, import, purge, convert, a suite mode for the retrieval check and the answer run, and the accepted `PRD/sections/` edits). Nothing a player sees changes.

Review attempt 1 (head `ea93c45b`) verified 60 of 62 criteria and requested one change, recorded in node-ledger row 13 of `PRD/work/rulesguru-local-suite/GRAPH-RUN.md`: the importer's request settings did not match the API, and the end of the data (the API wraps back to id 1) would have ended a complete import as failed. Build attempt 2 changed only three files (`git diff --name-only ea93c45b HEAD`, excluding the ledger): `scripts/lib/rulesguru-import.mjs`, its test, and `slice-b-import-purge.md`.

The ground truth for the API is the request a probe actually sent when it fetched 918 questions:

> Settings: `level` (singular) = the JSON strings '0', '1', '2', '3', 'Corner Case'; `complexity` (singular) = the JSON strings 'Simple', 'Intermediate', 'Complicated'; `legality` = 'all'; `tags` = empty list; `tagsConjunc` = 'NOT'; plus `previousId`, `count`, `from`.
> End of data: past the last question the API wraps back to id 1 rather than returning an empty batch. The probe stopped when a batch held no new id or its highest id was not above the cursor.

Grade against the slice B acceptance criteria, quoted:

- B1: First request uses previousId 1 and a from value naming TheJudge (injected fetch)
- B2: With an injected clock no request starts less than 3 s after the previous one finished
- B3: Malformed error halves 50 to 1; failing size-1 records a skip and advances one id; size regrows after five successes
- B4: A frozen file is never overwritten; resume starts after the saved id; state rewritten after each batch
- B5: Network error, 10 consecutive failures and repeated rate-limit after one 30 s wait each stop with state saved; empty batch ends cleanly; counts only
- B6: Purge without --yes deletes nothing and prints the count; with --yes deletes only a temp suite folder; refuses a path outside it
- B7: Every import and purge test uses a temp folder with injected fetch and clock; none names output/rulesguru or passes the global fetch
- B8: package.json has eval:rulesguru:import and eval:rulesguru:purge, the entry runs the ignore guard first, and no live request was made during the build
- B9: The REQ-232 entry gains the import, freeze, resumable and purge criteria
- B10: npm run test:scripts passes

Check directly:
1. `buildSettings` sends exactly the ground-truth keys and values, and the request settings REQ-232 describes (every level, every complexity, legality all, no tag filter, `from` naming TheJudge) are met by them.
2. The wrap handling: a batch whose highest id is not above the cursor ends the import as complete without overwriting any frozen file; a mixed batch saves only new ids and advances the cursor; the empty-batch end still works; no path loops forever or skips a real new id. Read the loop, not only the tests.
3. Nothing outside those three files changed since `ea93c45b` apart from the ledger, so the other 52 criteria verified in attempt 1 still stand; confirm with `git diff --stat ea93c45b HEAD`.
4. Re-run `node --test scripts/lib/rulesguru-import.test.mjs`, `npm run test:scripts`, and `npm run quality:check`.
5. Privacy: the new code and tests carry no suite question, answer, card roll or result text, and no permission wording beyond used with permission, local only.

Severity rule: Critical or Important is reserved for a gap that breaks correctness or a stated criterion. A preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important and never sends the run back to build; report those as Minor. Minor findings already recorded in row 13 need not be repeated.

Leave the worktree as you found it and report `git status --porcelain` at the end. Spawn no subagents; no sleeping or polling. Stay well under 120 tool calls. Copy the Working directory line above unchanged into any prompt you write.

Report back: verdict APPROVE or CHANGES REQUESTED; B1 to B10 verified or not with the command or file used; findings as Critical, Important or Minor with file and line; the final `git status --porcelain`.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "can you manage this for me, and pause when you need my input" (2026-10-10, ordering the recipe test and the RulesGuru suite) | answered-once | shape | — |
| "every piece of RulesGuru data stays on the owner's machine and is never committed" (intake decision 1) | answered-once | define | — |
| "Accept all recommended" (owner's answer to all 9 GATE-QUESTIONS.md slots, given in session 2026-10-10; filled by the driver at the owner's request) | answered-once | define | — |
