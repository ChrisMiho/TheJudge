# Graph run — rule-excerpt-cap-ten

- Run ID: `graph-20260910-024919`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] rm -rf is denied in every session."; graph tier: nohup true → "[graph-boundary] nohup is denied while a graph run holds the lock: a detached command outlives the run that started it.")`
- Autonomous base: `origin/main` (rewritten by the build half's claim on 2026-09-10; was `origin/thejudge-auto/rule-excerpt-cap-ten` in the spec-forming half, whose docs PR #230 merged at `c28820b`)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` (rewritten by the build half's claim; the spec-forming half's `.worktrees/kickoff-rule-excerpt-cap-ten` was clean and removed at the claim)
- Build branch: `thejudge-auto/rule-excerpt-cap-ten-work` (cut from `origin/main` at `c28820b`)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260910-024919/`
- Build-half canary (2026-09-10, lock retaken via `graph-preflight --take-lock`): `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] This exact call was already denied during this run (`recursive-force-remove`)…"; graph tier: nohup true → "[graph-boundary] This exact call was already denied during this run (`nohup-wrapper`)…")` — both denies came from the hook while the lock was held, which is the proof; the wording differs from the run-start canary because the run id is shared with the spec-forming half and the hook's denial ledger remembers it
- Current node: `close`
- Next action: driver continues `gate-review → gate-qc → plan → build → review → close`; `land` is the owner's merge of the code PR

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | `npm run graph:preflight -- --branch thejudge-auto/rule-excerpt-cap-ten --slug rule-excerpt-cap-ten --run-id graph-20260910-024919 --pid 66381` exit 0; shape root; branch `thejudge-auto/rule-excerpt-cap-ten` pushed from `.worktrees/kickoff-rule-excerpt-cap-ten` (remote at 7460cf8); lock `{slug rule-excerpt-cap-ten, runId graph-20260910-024919, pid 66381}`; both canaries denied (universal `rm -rf`, graph-tier `nohup`); profile loaded (env sentinel); launch checkout stayed on `main` | 2026-09-10 |
| 2 | shape | sonnet | ok | `0 → 26` | commit `46fa1cf` on run branch (pushed) — `PRD/work/rule-excerpt-cap-ten/{IDEA.md,README.md,STATUS.ideation,intake/GRAPH-BRIEF.md}` + `PRD/work/STATUS.md` ideation row; README carries `## Autonomous metadata`; intake copied verbatim (diff identical) and staging deleted; 9 `## Prior run` matches recorded in IDEA.md; worktree `git status --porcelain` empty | 2026-09-10 |
| 3 | define | opus | ok | `0 → 55` | commit `06b6699` on run branch (pushed) — DESIGN-BRIEF.md + GATE-QUESTIONS.md (14 stable-ID slots: REQ-022/032/178/181/182/185/188/190, NFR-018, system-map.md, integrations-and-data.md, in-depth/README.md, quick-lookup/README.md, system-map/game-rules-retrieval.md; no new REQ or DEC); amendment set enumerated by wide grep (266 hits: 32 amended, 234 "not this cap" with a row each in the brief appendix); 33 before-text lines verified byte-identical by script; no blocker questions; STATUS.ideation→refined; board row moved; `git diff --stat origin/main -- PRD/sections` empty | 2026-09-10 |
| 4 | gate-qc | sonnet | failed | `0 → 32` | FAIL commits `82356d7` + `156940f` — STATUS.refined→refining, board row moved. One finding: the brief's amendment-set appendix mislabels 8 of 266 "not this cap" rows as the REQ-094/095 combo-variant cap when the line is a layout/attach-limit/deploy/section-order cap (`screen-layout.md:132`, `functional-requirements.md:2211/3107/3379/3881/4442`, `decisions/deployment.md:31`, `in-depth/README.md:302`); the "not this cap" conclusion holds for all 8, the stated reason is wrong. Everything else clean: 266-hit grep reproduced, 0 missing/0 extra rows, 32 amend rows = 32 diff hunks, all 32 before-lines byte-identical (`ALL OK`), 14 slots well-formed, no new DEC, PRD/sections unedited. Loop 1 → define | 2026-09-10 |
| 3 | define | opus | ok | `0 → 25` | attempt 2 (loop 1 fix). Commit `0056266` on run branch (pushed) — appendix disposition reasons re-read line by line against the cited `PRD/sections/` text: 59 reasons corrected (the 8 flagged + 51 more the same pass found), every one still "not this cap"; only column 3 of non-amend rows moved, all 32 amend rows byte-identical, GATE-QUESTIONS.md zero diff, `git diff --stat origin/main -- PRD/sections` empty; STATUS.refining→refined, README header refined, board row moved back | 2026-09-10 |
| 4 | gate-qc | sonnet | ok | `0 → 22` | attempt 2 PASS, no findings, no commit. Reviewer re-ran the wide grep (266 hits = appendix count) plus named-spelling and extra sweeps (`supplementalRuleCap`, bare `\b5\b`, `6–15`, `maxExcerpts`) — no System 3 cap line without a slot; 32 before-text lines script-extracted and byte-compared, 0 mismatches; "not this cap" reasons spot-checked against cited text (combo-variant, REQ-167 attach, retired DEC-032, recall@5 metric rows) all correct; 14 slots parsed well-formed; `git diff cf55225 0056266 -- GATE-QUESTIONS.md` empty; `git diff --stat origin/main -- PRD/sections` empty; no new DEC/REQ. STATUS stays refined. Run stops here: driver commit `28da373` (README gate PASS + `## Open gate`, STATUS.refined→owner-action, board row refined→owner-action), docs PR https://github.com/ChrisMiho/TheJudge/pull/230 opened `thejudge-auto/rule-excerpt-cap-ten` → `main` | 2026-09-10 |
| — | claim | driver | ok | `driver-bookkeeping` | build half claimed after docs PR #230 merged at `c28820b`: kickoff worktree clean and removed (`git worktree remove`), `git worktree add .worktrees/implement-rule-excerpt-cap-ten -b thejudge-auto/rule-excerpt-cap-ten-work origin/main`, lock retaken (`graph-preflight --take-lock`, pid 66381), both canaries denied; claim commit `dc5b129` (README base → `origin/main`, ledger header) pushed; marker left at `owner-action` | 2026-09-10 |
| — | gate-review | sonnet | ok | `0 → 24` | commit `2426986` on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed) — 14/14 verdicts `accept` (0 edit, 0 reject) applied inside `GATE-QUESTIONS.md` (no diff changed); brief reconciliation `none`; `## Gate verdicts` + `## Open gate` resolved line written; STATUS.owner-action→refined, README `status: refined`, board row owner-action→refined; `git status --porcelain` empty; `git diff --stat origin/main -- PRD/sections` empty | 2026-09-10 |
| 4 | gate-qc | sonnet | ok | `0 → 25` | attempt 3 (build-half re-grade) PASS, no findings, no commit. 266-hit grep reproduced on the build branch (32 amend rows = 14 slots, 234 not-this-cap rows, 0 undisposed); 32 before-text lines byte-identical to `PRD/sections/` (`grep -rFc`, 0 mismatches); 14 blocks well-formed with `- Verdict: accept`; no new DEC; `git diff --stat origin/main -- PRD/sections` empty; brief build-ready (constant flip + tests + `--excerpt-cap` default, no live call). STATUS stays refined; driver rewrote README `## Preparation gate` | 2026-09-10 |
| 5 | plan | sonnet | ok | `0 → 49` | commit `d2e4114` on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed) — `GAMEPLAN.md`, `slice-a-deploy-ten-excerpt-cap.md` + `slice-a.criteria.json` (4 criteria, all `false`), `slice-b-eval-instrument-and-recall-harness.md` + `slice-b.criteria.json` (5 criteria, all `false`; B depends on A), README slice table + implementation map + `status: active`, STATUS.refined→active, board row refined→active; README `## Preparation gate` line verified PASS by the node before writing; `git status --porcelain` empty | 2026-09-10 |
| 6 | build | sonnet | ok | `0 → 182` | commits `965b1da` (slice A) + `4b1267e` (slice B) on `thejudge-auto/rule-excerpt-cap-ten-work` (pushed, remote tip `4b1267e`); code PR https://github.com/ChrisMiho/TheJudge/pull/231 opened `thejudge-auto/rule-excerpt-cap-ten-work` → `main` (OPEN, not draft). `DEFAULT_SUPPLEMENTAL_RULE_CAP` 5→10 + `preparation.test.ts`; `DEFAULT_EXCERPT_CAPS` → `[10, 15]`; recall-harness wording top-5→top-10 (`contextEvaluationHarness.ts`, `retrieval-relevance-report.mjs`, `relevanceReport.test.ts`, fixtures README); 9 golden prompt fixtures regenerated (additive); all 14 `GATE-QUESTIONS.md` blocks applied to 7 `PRD/sections/` files. `npm run quality:check` PASS (575/575 script tests); `npm run test:eval` PASS, 9/9 fixtures 100% at cap 10 — the brief's forbidden-rule-at-rank-6–10 risk did not materialize, no fixture edited, no check relaxed. Criteria 9/9 `true` (self-reported evidence; known hook-evidence gap, review is the integrity gate). STATUS.active→ship-ready, board row active→ship-ready. Return-side: launch checkout `git status --porcelain` empty before and after, on `main`; every changed path under `.worktrees/implement-rule-excerpt-cap-ten/` (32 files, `git diff --stat origin/main`) | 2026-09-10 |
| 7 | review | opus | ok | `0 → 25` | APPROVED, no commit (no-write reviewer). 9/9 criteria met with commands: A1 constant `10` at `preparation.ts:52` read at 4 call sites; A2 ranking proof runs default-10 vs explicit 15 on the real rule index (`fifteenIds.slice(0,10) === tenIds`, tail = `runnerUp`), and `gameRulesRetrieval.ts:832` computes `runnerUp` relative to the cap; A3/B3 all 14 blocks (30 hunks) applied verbatim, negative grep over before-text leaves only intentional survivors (REQ-094/095 combo cap, `recall@5` metric names, dated history), no `PRD/sections/` line outside the blocks changed; B1 `[10, 15]`; B2 six sites top-5→top-10, zero residual; B4 reviewer re-ran `npm run test:eval` (9/9 fixtures, same scores as the evidence log), fixtures diff = 9 goldens + README only; A4/B5 reviewer re-ran `npm run quality:check` exit 0 (frontend 1337, backend 504, scripts 575/575). Goldens additive: pure insertions, first five byte-identical (99+/2−, the 2 deletions are README wording). Critical none; Important none; Minor: retired `decisions.md:73` (DEC-032) still says five (outside the 14 blocks); rule 205.3m is one large appended excerpt (consequence of the accepted decision) | 2026-09-10 |

## Open gate

- Terminal state: `PARKED` at `owner-action` (gate-qc PASS, 2026-09-10)
- Question: answer the 14 verdict slots in `PRD/work/rule-excerpt-cap-ten/GATE-QUESTIONS.md` (accept / edit / reject each), then merge the docs PR — that merge is the build signal
- Evidence: gate-qc attempt 2 PASS (node ledger row 4, second entry); `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` at commit `0056266`; `PRD/sections/` unedited on this branch
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/230 (`thejudge-auto/rule-excerpt-cap-ten` → `main`, opened by the run, never merged by it)
- Kickoff worktree stays through the park: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten`
- Resume: after the PR merges, `/graph-implement PRD/work/rule-excerpt-cap-ten/` (the build half claims the spec from `origin/main`)
- Resolved: 2026-09-10 — 14/14 verdicts, all `accept` (0 edit, 0 reject); applied by `graph-gate-review`, see `## Gate verdicts` below. Status restored to `refined`; run re-enters at `gate-qc`.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-022` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-032` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-178` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-181` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-182` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-185` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-188` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `REQ-190` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `NFR-018` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `system-map.md` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `integrations-and-data.md` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `in-depth/README.md` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `quick-lookup/README.md` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |
| `system-map/game-rules-retrieval.md` | accept | owner accepted all 14 slots on 2026-09-10 after a walkthrough in session |

Blocker questions: none recorded in `GATE-QUESTIONS.md` (`## Blocker questions` reads "None").

### Brief reconciliation

- none — every verdict is `accept`; each proposed diff in `GATE-QUESTIONS.md` stands as refinement wrote it, `DESIGN-BRIEF.md` is untouched, and the README's `intake/` pointer needs no supersession note.

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. Invoke the `graph-preflight` skill and follow it exactly. Read `PRD/instructions/graph-workflow-contract.md` first, as the skill requires.

Inputs:
- `--branch thejudge-auto/rule-excerpt-cap-ten`
- `--slug rule-excerpt-cap-ten`
- `--run-id graph-20260910-024919`
- `--pid 66381` (the driver session's own long-lived pid)
- base: default (`origin/main`)

Procedure (from the skill): run the dry run first with `npm run graph:preflight -- --branch thejudge-auto/rule-excerpt-cap-ten --slug rule-excerpt-cap-ten --run-id graph-20260910-024919 --pid 66381 --dry-run`; report the `shape:`, `base:`, `worktree:`, planned commands, and both profile lines verbatim. If it exits 1 or 2, stop and relay the message verbatim — never hand-resolve. Otherwise re-run the identical command without `--dry-run`. Then issue `CANARY_COMMAND` as a real Bash tool call and require a deny; after the lock is taken, issue `GRAPH_CANARY_COMMAND` as a real Bash tool call and require a deny. An allowed canary is BLOCKED — report it verbatim and stop; never fall back to the profile. Confirm the end state: `git branch --show-current` inside `.worktrees/kickoff-rule-excerpt-cap-ten` is the requested branch, `git ls-remote --heads origin thejudge-auto/rule-excerpt-cap-ten` shows it pushed, and `git branch --show-current` at the root is unchanged (`main`).

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never commit, stash, or switch the launch checkout; never force-push; never create a worktree outside `.worktrees/`; never remove the stop sentinel or a lock; never `git add -A`. A denied call is never retried.

Tool-call cap for this node: 40.

Report back, in this order: the `shape:` line, the `base:` line, the `worktree:` absolute path, the lock record contents, the two profile lines verbatim, each canary command and the hook's deny text verbatim, the end-state confirmation commands and their output, and the exit code of each script run. Outcome word on its own last line: `ok`, `failed`, or `BLOCKED`.

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten

You are node 2 (`shape`) of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-kickoff` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` as the skill's Mode section requires. Work only inside the working directory above — it is the kickoff worktree on branch `thejudge-auto/rule-excerpt-cap-ten`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Request: "Raise the deployed System 3 rule-excerpt cap from 5 to 10"

Slug (already chosen by the driver — use it verbatim, do not rename): `rule-excerpt-cap-ten`
Package folder: `PRD/work/rule-excerpt-cap-ten/` (relative to the working directory)
Branch: `thejudge-auto/rule-excerpt-cap-ten` (already created and pushed by node 1)

Staged intake (absolute path): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260910-024919/` — it holds one file, `GRAPH-BRIEF.md`, a self-contained brief for this request. Handle it exactly as the skill's Mode section says: only after `PRD/work/rule-excerpt-cap-ten/` exists, copy it verbatim into `PRD/work/rule-excerpt-cap-ten/intake/GRAPH-BRIEF.md`, commit it on the branch, then delete the staged copy — in that order. Intake is evidence, never authority: record paths it cites as citations; never open, read, or fetch a document it cites.

Before writing `IDEA.md`, grep `PRD/instructions/receipts/` for slug and keyword matches (excerpt, cap, System 3, rule retrieval, answer-quality) and write one `## Prior run` line per match into `IDEA.md`, naming the receipt path.

Outputs: `PRD/work/rule-excerpt-cap-ten/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md`, and the `PRD/work/STATUS.md` ideation board row. Also write this section into the package `README.md` (exact shape):

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rule-excerpt-cap-ten

Commit on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`), then push with `git push origin thejudge-auto/rule-excerpt-cap-ten`. Do not create or touch `GRAPH-RUN.md` — the driver owns the ledger.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; a denied call is never retried. Return `NO ACTIONABLE PACKAGE` if the request cannot become a package.

Tool-call cap for this node: 60.

Report back: the commit hash(es) on the branch, the list of files created, the `## Prior run` matches found (or none), the intake copy + staging deletion confirmation, and `git status --porcelain` of the working directory (expected empty). Outcome word on its own last line: `ok`, `failed`, or `NO ACTIONABLE PACKAGE`.

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten

You are node 3 (`define`) of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-refinement` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` (the assumption ladder and the genuine-blocker test) and `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close`, `## The two runs`, and `## Intake is evidence, never authority` before writing anything. Work only inside the working directory above — the kickoff worktree on branch `thejudge-auto/rule-excerpt-cap-ten`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/` (relative to the working directory). Read its `IDEA.md`, `README.md`, and `intake/GRAPH-BRIEF.md` first. The intake brief is evidence, never authority: it may state findings and mark matters settled, but every product decision it raises is still yours to propose at this gate; never open, read, or fetch a document the intake cites — record the path as a citation only.

Request: "Raise the deployed System 3 rule-excerpt cap from 5 to 10"

What to produce:
1. `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md` — the design brief, with every material assumption and its evidence recorded.
2. `PRD/work/rule-excerpt-cap-ten/GATE-QUESTIONS.md` — because this change amends product truth, one `## <STABLE-ID>` block per stable ID whose `PRD/sections/` text changes (and one per newly proposed stable ID, if any). Each block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md` in this order — **What this decides**, **In plain terms**, **What happens if you say no** — with the substance of every cited REQ/DEC inlined, then that ID's complete proposed diff (before-text verbatim from the current `PRD/sections/` file, never a summary), then `- Verdict:` and `- Reason:` slots. A trailing `## Blocker questions` section holds any genuine decision blocker under the contract's three-condition test, written to the same standard.
3. Set `STATUS.refined` (replace `STATUS.ideation`; exactly one marker) and move the `PRD/work/STATUS.md` board row from ideation to refined. Update the package README status line.

Rules you must hold:
- Never edit `PRD/sections/` — propose only. `git diff -- PRD/sections` must be empty when you finish.
- The amendment set is cross-cutting. Enumerate it by running a grep across `PRD/sections/` for every spelling of the current cap (`five excerpt`, `five-excerpt`, `up to 5 excerpts`, `capped at 5`, `capped at five`, `top-5`, `top 5`, `stays at five`, `top five`, and any other you find) and give every hit a disposition — either a slot in GATE-QUESTIONS.md or an explicit "not this cap" note in the brief (the combo-variant cap of five, REQ-094/095, is a different number and must be left alone). A gate-qc reviewer will re-run the grep; a missed line fails the gate.
- Before-text in every diff must be byte-identical to the current file content — copy it from the file, do not retype it.
- The decision log is retired: never propose a new `DEC-`; amend REQ text in place. A new REQ is allowed only if the brief argues it is cleaner than amending; if you propose one, it gets its own slot.
- Commit on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push origin thejudge-auto/rule-excerpt-cap-ten`. Do not touch `GRAPH-RUN.md` — the driver owns the ledger.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 150.

Report back: the commit hash(es), the list of stable IDs given slots in GATE-QUESTIONS.md, the grep you used to enumerate the amendment set and the count of hits with their dispositions, any blocker questions, the material assumptions you recorded, and `git status --porcelain` plus `git diff --stat origin/main -- PRD/sections` of the working directory (the latter expected empty). Outcome word on its own last line: `ok` or `failed`.

### gate-qc

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten

You are node 4 (`gate-qc`) of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` as the skill's Mode section requires. Work only inside the working directory above — the kickoff worktree on branch `thejudge-auto/rule-excerpt-cap-ten`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/`. Checked artifact: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`, with `GATE-QUESTIONS.md` as the proposed product-truth diff it depends on.

Grade the brief for PRD alignment and agent-readiness and return an explicit PASS or FAIL with every finding. In addition to the skill's normal checks, verify all of the following, each with a command you ran and its output:
- `GATE-QUESTIONS.md` is well-formed: one `## <STABLE-ID>` block per stable ID whose `PRD/sections/` text changes, each opening with the three plain-language lines (**What this decides**, **In plain terms**, **What happens if you say no**) with cited REQ/DEC substance inlined, then a complete diff, then `- Verdict:` and `- Reason:` slots.
- Every before-text in every diff is byte-identical to the current `PRD/sections/` file content.
- The amendment set is complete: independently re-run a grep across `PRD/sections/` for every spelling of the current cap (`five excerpt`, `five-excerpt`, `up to 5 excerpts`, `capped at 5`, `capped at five`, `top-5`, `top 5`, `stays at five`, `top five`, and any other spelling you find) and confirm every hit that describes the System 3 rule-excerpt cap has a slot, while hits that describe a different cap (for example the REQ-094/095 combo-variant cap of five) are explicitly noted as out of scope in the brief. Report the hit list with a disposition per hit.
- `PRD/sections/` is unedited: `git diff --stat origin/main -- PRD/sections` is empty.
- No new `DEC-` is proposed.

On FAIL: set `STATUS.refining` (replace `STATUS.refined`; exactly one marker), move the `PRD/work/STATUS.md` board row to refining, and list every issue. On PASS: leave `STATUS.refined` in place. Do not create map-out artifacts, do not self-certify, do not fix the brief yourself. Commit any status-marker change on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push origin thejudge-auto/rule-excerpt-cap-ten`. Do not touch `GRAPH-RUN.md` or the package README's `## Preparation gate` section — the driver owns both.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`, `DESIGN-BRIEF.md`, or `GATE-QUESTIONS.md`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 60.

Report back: the verdict (PASS or FAIL) on its own line, the complete findings list (or `none`), the amendment-set grep and its per-hit dispositions, the before-text verification result, any commit hash, and `git status --porcelain` of the working directory. Outcome word on its own last line: `ok` (verdict delivered) or `failed` (could not deliver a verdict).

### define (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten

You are node 3 (`define`), attempt 2, of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. This is gate-qc loop 1 of 3: the quality check FAILed the package on one finding and you are fixing exactly that. Invoke the `thejudge-refinement` skill in its `graph is controlling` mode. Read `PRD/instructions/preparation-contract.md` first. Work only inside the working directory above — the kickoff worktree on branch `thejudge-auto/rule-excerpt-cap-ten`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/`. Read `DESIGN-BRIEF.md` (especially its amendment-set appendix table) and `GATE-QUESTIONS.md`. Both were graded clean on every axis except the one below. Do not rewrite them; make the bounded fix.

The gate-qc finding, verbatim in substance: the brief's amendment-set appendix mislabels 8 of its 266 disposition rows. Each says "not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number," but the cited line is not about combo variants:
- `screen-layout.md:132` — card-image layout/size cap
- `functional-requirements.md:2211` — the text itself says "per REQ-167" (the 5-card attach limit), not REQ-094/095
- `functional-requirements.md:3107` — shared-component sizing/layout cap
- `functional-requirements.md:3379` — image-height sizing rule, layout cap
- `functional-requirements.md:3881` — "tightened the add cap ... to a fixed 5" is the REQ-167 attach limit
- `functional-requirements.md:4442` — cap-agnostic answer-quality transcript wording, no cap number stated
- `decisions/deployment.md:31` — Lambda zip-upload size ceiling, a deploy/infra limit
- `in-depth/README.md:302` — names prompt-section order, no count at all
The "not this cap" conclusion holds for all 8; only the stated reason is wrong. The reviewer also confirmed: 266 grep hits reproduced, 0 rows missing and 0 extra, 32 amend rows equal the 32 diff hunks, all 32 before-lines byte-identical, 14 slots well-formed, no new DEC, `PRD/sections/` unedited.

What to do:
1. Open each of the 8 cited lines in `PRD/sections/` and rewrite that row's reason to say what the line actually describes. Then re-read every other "not this cap" row whose reason names REQ-094/095 (the reviewer counted 15 such rows and found 7 correct) and any other row whose reason you cannot confirm from the line text, and correct any further mislabel you find. The disposition table must be something an implementing agent can trust at face value.
2. Do not change any `amend` row, any diff in `GATE-QUESTIONS.md`, or any `PRD/sections/` file. `git diff --stat origin/main -- PRD/sections` must stay empty.
3. Set `STATUS.refined` (replace `STATUS.refining`; exactly one marker), flip the package README `status:` header back to `refined`, and move the `PRD/work/STATUS.md` board row from refining back to refined with a one-line note that the appendix reasons were corrected.
4. Commit on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push origin thejudge-auto/rule-excerpt-cap-ten`. Do not touch `GRAPH-RUN.md` — the driver owns the ledger.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 150.

Report back: the commit hash, the list of rows whose reason changed (file:line → new reason), confirmation that no `amend` row, no diff, and no `PRD/sections/` file changed, and `git status --porcelain` plus `git diff --stat origin/main -- PRD/sections` of the working directory. Outcome word on its own last line: `ok` or `failed`.

### gate-qc (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten

You are node 4 (`gate-qc`), attempt 2, of graph run `graph-20260910-024919`, the spec-forming half driven by `graph-kickoff`. Attempt 1 FAILed on one finding (the brief's amendment-set appendix mislabelled 8 "not this cap" reasons); define attempt 2 (commit `0056266`) corrected 59 reasons without touching any amend row, any diff, or `PRD/sections/`. Grade the package fresh — do not assume the fix is complete. Invoke the `thejudge-quality-check` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` as the skill's Mode section requires. Work only inside the working directory above — the kickoff worktree on branch `thejudge-auto/rule-excerpt-cap-ten`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/`. Checked artifact: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`, with `GATE-QUESTIONS.md` as the proposed product-truth diff it depends on.

Grade the brief for PRD alignment and agent-readiness and return an explicit PASS or FAIL with every finding. In addition to the skill's normal checks, verify all of the following, each with a command you ran and its output:
- `GATE-QUESTIONS.md` is well-formed: one `## <STABLE-ID>` block per stable ID whose `PRD/sections/` text changes, each opening with the three plain-language lines (**What this decides**, **In plain terms**, **What happens if you say no**) with cited REQ/DEC substance inlined, then a complete diff, then `- Verdict:` and `- Reason:` slots.
- Every before-text in every diff is byte-identical to the current `PRD/sections/` file content.
- The amendment set is complete: independently re-run a grep across `PRD/sections/` for every spelling of the current cap (`five excerpt`, `five-excerpt`, `up to 5 excerpts`, `capped at 5`, `capped at five`, `top-5`, `top 5`, `stays at five`, `top five`, and any other spelling you find) and confirm every hit that describes the System 3 rule-excerpt cap has a slot, while hits that describe a different cap (for example the REQ-094/095 combo-variant cap of five) are explicitly noted as out of scope in the brief. Report the hit list with a disposition per hit, and spot-check the appendix's "not this cap" reasons against the cited line text — the axis attempt 1 failed on.
- `PRD/sections/` is unedited: `git diff --stat origin/main -- PRD/sections` is empty.
- No new `DEC-` is proposed.

On FAIL: set `STATUS.refining` (replace `STATUS.refined`; exactly one marker), move the `PRD/work/STATUS.md` board row to refining, and list every issue. On PASS: leave `STATUS.refined` in place. Do not create map-out artifacts, do not self-certify, do not fix the brief yourself. Commit any status-marker change on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push origin thejudge-auto/rule-excerpt-cap-ten`. Do not touch `GRAPH-RUN.md` or the package README's `## Preparation gate` section — the driver owns both.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`, `DESIGN-BRIEF.md`, or `GATE-QUESTIONS.md`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 60.

Report back: the verdict (PASS or FAIL) on its own line, the complete findings list (or `none`), the amendment-set grep and its per-hit dispositions, the before-text verification result, any commit hash, and `git status --porcelain` of the working directory. Outcome word on its own last line: `ok` (verdict delivered) or `failed` (could not deliver a verdict).

### gate-review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are the gate-resolution step of graph run `graph-20260910-024919`, the build half driven by `graph-implement`. Invoke the `graph-gate-review` skill and follow it exactly. Read `PRD/instructions/graph-workflow-contract.md` first, as the skill requires. Work only inside the working directory above — the build worktree on branch `thejudge-auto/rule-excerpt-cap-ten-work`, cut from `origin/main` after the docs PR (#230) merged; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/` (relative to the working directory). Read its `GRAPH-RUN.md` `## Open gate`, `GATE-QUESTIONS.md` (14 stable-ID slots), `README.md`, and the `STATUS.*` marker.

What to do, per the skill:
1. Confirm the open gate is the answered `define` proposal and every one of the 14 `Verdict:` slots is filled with `accept`, `edit`, or `reject` (an `edit`/`reject` needs a `Reason:`). Refuse and stop, naming the IDs, if any slot is blank or malformed.
2. Apply each verdict inside that ID's proposed diff in `GATE-QUESTIONS.md` only — never in `PRD/sections/`. An `accept` changes nothing.
3. Reconcile `DESIGN-BRIEF.md` and the README's intake pointer to every `edit` or `reject`, enumerated by a grep you quote; when every verdict is `accept`, the reconciliation list reads `none` and the brief is untouched.
4. Write `## Gate verdicts` (one row per ID, plus `### Brief reconciliation`) into `GRAPH-RUN.md`, mark `## Open gate` resolved with the date and verdict count, and restore the lifecycle position: README `status:` → `refined`, marker `STATUS.owner-action` → `STATUS.refined` (exactly one marker), and move the `PRD/work/STATUS.md` board row from `## owner-action` to `## refined` (remove from the old section, add to the new).
5. Commit on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push -u origin thejudge-auto/rule-excerpt-cap-ten-work`. Do not edit the ledger's header lines or `## Node ledger` — the driver owns those; you write only `## Gate verdicts` and `## Open gate`.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`, anything under `intake/`, any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never dispatch a subagent or run a `thejudge-*` skill; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; a denied call is never retried.

Tool-call cap for this node: 60.

Report back: the verdict split (accept/edit/reject counts), the `### Brief reconciliation` list verbatim (or `none`), the restored status (marker, README line, board row), the commit hash, and `git status --porcelain` plus `git diff --stat origin/main -- PRD/sections` of the working directory (the latter expected empty). Outcome word on its own last line: `ok` or `failed`.

### gate-qc (attempt 3 — build half re-grade)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are node 4 (`gate-qc`), attempt 3, of graph run `graph-20260910-024919`, now in the build half driven by `graph-implement`. The spec-forming half passed this package at attempt 2, the owner answered all 14 `GATE-QUESTIONS.md` verdict slots `accept` and merged the docs PR (#230), and `graph-gate-review` resolved the gate (commit `2426986`) with no edit or reject, so the brief and the proposal are unchanged since the PASS. This re-grade exists because the contract requires one after every gate resolution; grade the package fresh anyway — do not assume the earlier PASS holds. Invoke the `thejudge-quality-check` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` as the skill's Mode section requires. Work only inside the working directory above — the build worktree on branch `thejudge-auto/rule-excerpt-cap-ten-work`, cut from `origin/main`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/`. Checked artifact: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`, with `GATE-QUESTIONS.md` as the finalized product-truth diff it depends on (`## Gate verdicts` in `GRAPH-RUN.md` records 14 accepts).

Grade the brief for PRD alignment and agent-readiness and return an explicit PASS or FAIL with every finding. In addition to the skill's normal checks, verify all of the following, each with a command you ran and its output:
- `GATE-QUESTIONS.md` is well-formed: one `## <STABLE-ID>` block per stable ID whose `PRD/sections/` text changes, each with the three plain-language lines, a complete diff, and a filled `- Verdict: accept` slot.
- Every before-text in every diff is byte-identical to the current `PRD/sections/` file content on this branch (`origin/main` merged the docs PR, which carried no `PRD/sections/` edits, but confirm rather than assume).
- The amendment set is complete: independently re-run a grep across `PRD/sections/` for every spelling of the current cap (`five excerpt`, `five-excerpt`, `up to 5 excerpts`, `capped at 5`, `capped at five`, `top-5`, `top 5`, `stays at five`, `top five`, and any other spelling you find) and confirm every hit that describes the System 3 rule-excerpt cap has a slot, while hits that describe a different cap (for example the REQ-094/095 combo-variant cap of five) are noted as out of scope in the brief's appendix. Report the hit count and any hit without a disposition.
- `PRD/sections/` is unedited: `git diff --stat origin/main -- PRD/sections` is empty.
- No new `DEC-` is proposed.
- The brief is build-ready: its `## Scope` names the code change (`DEFAULT_SUPPLEMENTAL_RULE_CAP` in `apps/backend/src/prompt/preparation.ts`, its tests, and the answer-quality run's `--excerpt-cap` default), and nothing in it requires a live provider call to build.

On FAIL: set `STATUS.refining` (replace `STATUS.refined`; exactly one marker), move the `PRD/work/STATUS.md` board row to refining, and list every issue. On PASS: leave `STATUS.refined` in place. Do not create map-out artifacts, do not self-certify, do not fix the brief yourself. Commit any status-marker change on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push -u origin thejudge-auto/rule-excerpt-cap-ten-work`. Do not touch `GRAPH-RUN.md` or the package README's `## Preparation gate` section — the driver owns both.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit `PRD/sections/`, `DESIGN-BRIEF.md`, or `GATE-QUESTIONS.md`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 60.

Report back: the verdict (PASS or FAIL) on its own line, the complete findings list (or `none`), the amendment-set grep hit count and any undisposed hit, the before-text verification result, any commit hash, and `git status --porcelain` of the working directory. Outcome word on its own last line: `ok` (verdict delivered) or `failed` (could not deliver a verdict).

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are node 5 (`plan`) of graph run `graph-20260910-024919`, the build half driven by `graph-implement`. Invoke the `thejudge-map-out` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/preparation-contract.md` as the skill's Mode section requires, and the skill's own `reference.md` for the slice template, the Ship gates block, and the `slice-<letter>.criteria.json` schema. Work only inside the working directory above — the build worktree on branch `thejudge-auto/rule-excerpt-cap-ten-work`, cut from `origin/main`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/`. Its README `## Preparation gate` records `Quality-check: PASS` (attempt 3, 2026-09-10) — verify that line yourself before writing anything; you cannot self-certify it. Read `DESIGN-BRIEF.md` (the design record) and `GATE-QUESTIONS.md` (the finalized product-truth proposal: 14 stable-ID blocks, all `accept`, 32 lines across 7 `PRD/sections/` files).

What the build must deliver, so slice it accordingly:
1. Code: `DEFAULT_SUPPLEMENTAL_RULE_CAP` in `apps/backend/src/prompt/preparation.ts` moves `5` → `10`, with `preparation.test.ts` cap assertions moved with it (including the proof that a larger cap's leading excerpts equal the smaller cap's and the added slots come from `runnerUp`); the System 3 recall harness checks (`system3-expected-recall`, `system3-noise-excluded`) move to top 10 per the brief's decision; the answer-quality run's `--excerpt-cap` default becomes `[10, 15]`. The brief records an implementation risk: a forbidden rule may already sit at ranks 6–10 in an existing eval fixture and fail `npm run test:eval` — that is a signal to record, never to suppress by relaxing the check; write the slice so the builder reports it rather than hides it.
2. Product truth: apply the finalized `GATE-QUESTIONS.md` diffs to `PRD/sections/` by intent against current truth (never a blind replay), in the same slice as the code, so the PR carries both. Every before-text line was verified byte-identical, so an unchanged file should apply cleanly; a mismatch is reported, not forced.
3. Verification: the repo's test and quality commands (`npm run quality:check` or its parts, `npm run test:eval` where the recall harness lives) as acceptance criteria with `evidence` blocks the hook can match. No live provider call is part of any slice; the eval run stays confirmation-gated and is not executed.

Keep it small: one slice is expected, two at most (code + truth together; the recall-harness/eval-default change may be its own slice if that reads cleaner). No browser-observable risk — no Playwright criteria needed.

Outputs: `GAMEPLAN.md`, `slice-<letter>-*.md` with a `slice-<letter>.criteria.json` beside each (every criterion `false`, each with an `evidence` block), README slice table + implementation map + `status: active`, marker `STATUS.refined` → `STATUS.active` (exactly one), board row `## refined` → `## active` in `PRD/work/STATUS.md` (remove from old, add to new). The final slice carries the PRD promotion checklist and the Ship gates block.

Commit on the branch with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push -u origin thejudge-auto/rule-excerpt-cap-ten-work`. Do not touch `GRAPH-RUN.md` or the README's `## Preparation gate` / `## Autonomous metadata` sections — the driver owns them.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never write product code or edit `PRD/sections/`; never edit `DESIGN-BRIEF.md` or `GATE-QUESTIONS.md`; never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls; a denied call is never retried.

Tool-call cap for this node: 120.

Report back: the commit hash, the slice table (letter, title, dependencies), the criteria count per slice, and `git status --porcelain` of the working directory (expected empty). Outcome word on its own last line: `ok` or `failed`.

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are node 6 (`build`) of graph run `graph-20260910-024919`, the build half driven by `graph-implement`. Invoke the `thejudge-implement-all` skill in its `graph is controlling` mode and follow it exactly. Read `PRD/instructions/graph-workflow-contract.md` (especially `## Propose / apply / close` and `## Acceptance criteria are earned, not written`), the skill's `reference.md`, and `PRD/instructions/workflow-reference.md` as the skill requires.

Package: `PRD/work/rule-excerpt-cap-ten/` (relative to the working directory). Shared branch: `thejudge-auto/rule-excerpt-cap-ten-work` — it is the branch the working directory above is already checked out on (`git branch --show-current` must equal it; block and report if it differs). Recorded autonomous base (README `## Autonomous metadata`): `origin/main`. Work in place in this worktree — no second worktree, no contributor branch. Never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`; every path you write must lie inside `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten/`, and the driver asserts that on your return (REQ-193) — a bare `PRD/work/rule-excerpt-cap-ten/…` path outside this worktree fails the node.

Read `README.md`, `GAMEPLAN.md`, `slice-a-deploy-ten-excerpt-cap.md`, `slice-b-eval-instrument-and-recall-harness.md`, both `slice-<letter>.criteria.json` files, `DESIGN-BRIEF.md`, and `GATE-QUESTIONS.md` (14 finalized blocks, all `accept`). Implement slice A then slice B (B depends on A), sequentially, no implementation subagents.

Apply product truth by intent: each slice writes the real `PRD/sections/` edits its GAMEPLAN assigns, re-derived from the finalized `GATE-QUESTIONS.md` diff and the brief against the current file text — never a blind replay. Every before-text line was verified byte-identical on this branch, so the edits should apply cleanly; if one does not match, report the mismatch and stop rather than forcing it. Apply each block exactly once across the run. Commit the truth together with the code that realizes it, one milestone commit per slice (`feat(rule-excerpt-cap-ten): complete slice <letter>`).

The brief's recorded risk: moving the recall harness to top-10 may surface a forbidden rule already ranking 6–10 in an existing eval fixture, failing `npm run test:eval`. That is a genuine signal — record it in the slice notes and the PR body with the fixture and rule named; never suppress it by relaxing the check. If it blocks a slice, leave that slice `blocked` and end `failed` with the evidence.

Criteria: set a criterion `true` in its `.criteria.json` only after the evidence its block names has actually run in this node; report `ok` only when every criterion in both files is `true` (read the emitted files, not a summary). Run `npm run quality:check` and the slice verification before each milestone commit. Never `git add -A`, `--all`, or `.` — explicit paths only. Push with `git push -u origin thejudge-auto/rule-excerpt-cap-ten-work`, never force.

PR: after the first push, open the code PR with `gh pr create --base main --head thejudge-auto/rule-excerpt-cap-ten-work` if none exists for this branch (`gh pr list --head thejudge-auto/rule-excerpt-cap-ten-work` first). The PR body follows `PRD/instructions/plain-language-standard.md`: open with what a player gets (Ask AI attaches up to ten official rule excerpts instead of five), inline the substance of every REQ you cite, name the eval-fixture outcome, and end with the two attribution lines: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` and `https://claude.ai/code/session_01Tr2kzbTDLtToCCdbaHrxL8`. Never merge or close it.

When every slice is `done`: README `status: ship-ready`, marker `STATUS.active` → `STATUS.ship-ready` (exactly one), board row `## active` → `## ship-ready` in `PRD/work/STATUS.md` (remove from old, add to new), then the completion-gate READY loop from `reference.md`. Do not touch `GRAPH-RUN.md` or the README's `## Preparation gate` / `## Autonomous metadata` sections — the driver owns them. Do not run cleanup.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup` or background `&`; no live provider calls (the answer-quality run stays confirmation-gated and is not executed); no `npm run data:refresh`; a denied call is never retried.

Tool-call cap for this node: 1200.

Report back: every commit hash on the branch in order, the PR URL, the complete list of paths you wrote (absolute, or relative to the launch root), each criterion id with the evidence command or path that earned it and its final value, the `npm run quality:check` and `npm run test:eval` results (pass/fail with the failing test names if any), the eval-fixture risk outcome, the final marker and board row, and `git status --porcelain` of the working directory (expected empty). Outcome word on its own last line: `ok` or `failed`.

### review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are node 7 (`review`) of graph run `graph-20260910-024919`, the build half driven by `graph-implement`: a fresh-context, no-write reviewer. You hold no `Write`, `Edit`, or `NotebookEdit`; use Bash only for read-only commands (`git diff`, `git log`, `grep`, `cat`, and test runs). Never modify, commit, push, or stash anything. You have not seen the build node's transcript and must not look for it — grade the work, not its justification. Work only from the working directory above (the build worktree on `thejudge-auto/rule-excerpt-cap-ten-work`); never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

What to review: the diff `git diff origin/main` (32 files, 2 build commits `965b1da` and `4b1267e`, PR https://github.com/ChrisMiho/TheJudge/pull/231). Package artifacts: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (14 finalized blocks, all `accept`), `GAMEPLAN.md`, `slice-a-deploy-ten-excerpt-cap.md`, `slice-b-eval-instrument-and-recall-harness.md`, and both `slice-<letter>.criteria.json`.

The rubric is the slices' own acceptance criteria, quoted here — nothing else:

Slice A
- A1. `DEFAULT_SUPPLEMENTAL_RULE_CAP` is `10` in `preparation.ts`.
- A2. `preparation.test.ts`'s cap assertions reflect `10` as the production default, and still prove directly (not by assumption) that a larger cap's leading excerpts equal the smaller cap's and the added slots are drawn from `runnerUp`.
- A3. The 12 non-eval-instrument `GATE-QUESTIONS.md` blocks (REQ-022, REQ-178, REQ-181, REQ-182, REQ-185, REQ-188, NFR-018, `system-map.md`, `integrations-and-data.md`, `in-depth/README.md`, `quick-lookup/README.md`, `system-map/game-rules-retrieval.md`) are applied to `PRD/sections/`, each before-text byte-verified against current truth before editing.
- A4. `npm run quality:check` passes (typecheck, lint, format:check, coverage:check including the updated `preparation.test.ts`, test:scripts).

Slice B
- B1. `DEFAULT_EXCERPT_CAPS` is `[10, 15]` in `eval-answer-quality.mjs`.
- B2. `contextEvaluationHarness.ts`'s System 3 recall-check text says top-10, not top-5, in the `EvaluationFixtureExpected` doc comments, the two check functions' `details` strings, and the relevance-report header/doc comment.
- B3. The REQ-032 and REQ-190 `GATE-QUESTIONS.md` blocks are applied to `PRD/sections/functional-requirements.md`, before-text byte-verified against current truth before editing.
- B4. `npm run test:eval` was run from `apps/backend`, and its exact pass/fail result — including any forbidden-rule-at-rank-6–10 finding — is recorded verbatim in this slice's evidence log, not suppressed by relaxing the check or the fixture.
- B5. `npm run quality:check` (or its `test:scripts` leg) passes.

How to grade each criterion — with a command you ran and its output as evidence:
- A1/B1/B2: read the files.
- A2: read the test; confirm the larger-cap-vs-smaller-cap proof still exists and asserts on real retrieval output rather than a stub of the cap.
- A3/B3: for every one of the 14 blocks, diff the applied `PRD/sections/` text against the block's after-text (`+` lines) — the apply is by intent, so wording may differ where current truth required it, but the substance of every `+` line must be present and no `-` line may survive. Confirm no `PRD/sections/` line outside the 14 blocks changed except where a block's own hunk required it, and that the combo-variant cap of five (REQ-094/095) is untouched.
- A4/B5: re-run `npm run quality:check` yourself (it is read-only apart from coverage output) and report the result.
- B4: re-run `npm run test:eval` from `apps/backend` yourself and compare with what the slice B evidence log records; confirm no fixture's `forbiddenRules`/expected lists were edited to make it pass (`git diff origin/main -- apps/backend/src/eval/fixtures/` should show only regenerated `*.prompt.golden.txt` and the README).
- Also confirm the 9 regenerated golden prompt files are additive (excerpts 6–10 appended, the first five unchanged in content and order) on at least two fixtures, since that is the product promise the brief makes.

Severity rule: a Critical or Important finding is one that makes a stated criterion false or breaks correctness. A preference, a style note, a wording nit, or an improvement outside these criteria is never Critical or Important and never loops the run back to `build` — record it as Minor. Manufactured findings spend a loop the run cannot get back.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own (you should need none).

Boundaries: no writes of any kind; never merge, close, or comment on the PR; no live provider calls; no `nohup` or background `&`; a denied call is never retried.

Tool-call cap for this node: 120.

Report back: one line per criterion (`A1 … B5`) with met / not met and the evidence command, then findings grouped Critical / Important / Minor (or `none` per group), the `npm run quality:check` and `npm run test:eval` results as you observed them, and a final verdict line: `APPROVED` (no Critical or Important) or `RETURN TO BUILD` (with the findings that require it). Outcome word on its own last line: `ok` (verdict delivered) or `failed` (could not deliver a verdict).

### close

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten

You are node 8 (`close`) of graph run `graph-20260910-024919`, the build half driven by `graph-implement`. Invoke the `thejudge-cleanup` skill in its `graph is controlling` mode and follow it exactly — the open-PR path, run on the code branch before the owner merges (REQ-194). Read `PRD/instructions/graph-workflow-contract.md` (`## The ledger outlives the run`), `PRD/instructions/plain-language-standard.md` (the receipt's opening block), `PRD/instructions/doc-lifecycle.md`, and `PRD/instructions/workflow-reference.md` as the skill requires. Work only inside the working directory above — the build worktree on branch `thejudge-auto/rule-excerpt-cap-ten-work`; never touch the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge`.

Package: `PRD/work/rule-excerpt-cap-ten/` — `STATUS.ship-ready`, README `status: ship-ready`, both slices `done`, 9/9 criteria `true`. Implementation PR: https://github.com/ChrisMiho/TheJudge/pull/231 (`thejudge-auto/rule-excerpt-cap-ten-work` → `main`, OPEN, not merged) — confirm with `gh pr view 231 --json state,baseRefName,headRefName`; an already-merged PR means the order was violated and ends the node `failed`. Review (node 7) approved with no Critical or Important findings.

What to do, per the skill:
1. Status gate and the open-PR path's four pre-merge checks.
2. Confirm durable truth is present: `build` applied all 14 `GATE-QUESTIONS.md` blocks to 7 `PRD/sections/` files by intent (review verified every hunk). Promote nothing that is already there; write nothing twice. The decision log is retired — no `DEC-`. Review's Minor note: the retired row `PRD/sections/decisions.md:73` (DEC-032) still says five excerpts; it was outside the 14 gate blocks, so leave it as it stands and name it in the receipt as a known leftover for the owner — do not edit product truth the gate did not approve.
3. Write the receipt `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` before any delete: the plain-language opening block (**What happened** in product terms — Ask AI now attaches up to ten official rule excerpts instead of five; **What it means for you**), date, slug, status `shipped`, a `- PR:` line naming https://github.com/ChrisMiho/TheJudge/pull/231, actions taken, every file created/updated/deleted, verification results (build's and review's `quality:check` and `test:eval` results; the eval-fixture risk that did not materialize), `## Graph run` with `- Run ID: \`graph-20260910-024919\` | Profile: \`loaded (env sentinel)\` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/231`, then `### Node ledger` and `### Instruction ledger` copied **verbatim** from `GRAPH-RUN.md` (headings dropped to `###`, tables unchanged including header and separator rows), and `## Intake` with one line: `intake/GRAPH-BRIEF.md` — staged by `graph-kickoff` from the launch request (its stated origin is in the file's own header; quote it).
4. Flip the `PRD/sections/system-map.md` entry for this work to `shipped` only if the map carries a planned/partial marker for it (it may not — the 14 blocks already rewrote the three System 3 entries to ten; do not add a new marker).
5. Strip `rule-excerpt-cap-ten` from every section of `PRD/work/STATUS.md`, then delete the package with `git rm -r PRD/work/rule-excerpt-cap-ten/` — the only permitted delete form. Remove no worktree and no branch; never delete a remote branch.
6. `npm run quality:check` green before the delete commit. Commit with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) and push with `git push -u origin thejudge-auto/rule-excerpt-cap-ten-work`, never force. Never merge or close the PR.

Copy the line `Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rule-excerpt-cap-ten` unchanged, on its own line, into every prompt you write for any subagent of your own.

Boundaries: never edit any `thejudge-*` skill, `CLAUDE.md`, or `.claude/settings*.json`; never force-push; never push `main`; never merge or close a PR; no `nohup`, background `&`, or any `rm -r` spelling; no live provider calls; the force override is unavailable under the predicate; a denied call is never retried.

Tool-call cap for this node: 120.

Report back: the four pre-merge check results, the receipt path, confirmation that `## Graph run` carries both ledger tables verbatim and `## Intake` is present, the system-map decision, the commit hash(es), the PR URL, and `git status --porcelain` of the working directory (expected empty) plus `ls PRD/work/rule-excerpt-cap-ten` (expected absent). Outcome word on its own last line: `ok` or `failed`.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "lets increase the cap to 10" | answered-once | shape | — |
| "Raise the deployed System 3 rule-excerpt cap from 5 to 10" | answered-once | shape | — |
