# Graph run — exact-curated-rule-exclusion

- Run ID: `graph-20261008-053030` (build half `graph-20261008-061643`: lock retaken pid 19738, canary `rm -rf .worktrees/.graph-canary-nonexistent` not re-run; graph canary `denied — graph tier armed (nohup true)`)
- Profile: `loaded (env sentinel)` — printed by preflight; the session process is `claude --settings .claude/graph-profile.json` (pid 19738, observed via `ps`, not stated by the user)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main` (rewritten by the build half's claim; spec-forming half: `origin/thejudge-auto/exact-curated-rule-exclusion`)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-exact-curated-rule-exclusion` (rewritten by the build half's claim; spec-forming half: `.worktrees/kickoff-exact-curated-rule-exclusion`, removed clean)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261008-053030/`
- Current node: `build`
- Next action: `/graph-implement PRD/work/exact-curated-rule-exclusion/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 9` | `npm run graph:preflight -- --branch thejudge-auto/exact-curated-rule-exclusion --slug exact-curated-rule-exclusion --run-id graph-20261008-053030 --pid 19738` exit 0; branch `thejudge-auto/exact-curated-rule-exclusion` pushed from `.worktrees/kickoff-exact-curated-rule-exclusion` (`git ls-remote` → 5a65c91d); lock `.worktrees/.graph-run.lock` runId graph-20261008-053030 pid 19738; launch checkout still on `main` | 2026-10-08 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/exact-curated-rule-exclusion/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging); `PRD/work/STATUS.md` ideation row; 6 `## Prior run` lines in IDEA.md; launch checkout `git status --porcelain` unchanged | 2026-10-08 |
| 3 | define | opus | ok | `0 → 42` | `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md` (270 lines, 46-row line-level amendment set: 19 amend / 27 no change); `GATE-QUESTIONS.md` present → product truth proposed, gates (5 slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220; blank verdicts; Blocker questions: none); `STATUS.ideation` → `STATUS.refined`; board row moved ideation → refined; `git diff HEAD -- PRD/sections apps scripts` empty; launch checkout unchanged | 2026-10-08 |
| 4 | gate-qc | sonnet | failed | `0 → 45` | FAIL attempt 1 of 3 — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: 3 must-fix (F1 803-not-926 excerpt size; F2 127 per-topic sum vs 125 distinct; F3 closing-case criterion names no ranking path / evidence-trace provider) + 4 minor; amendment set, verbatim removed lines and block format passed. Driver recorded FAIL in README `## Preparation gate`, `STATUS.refined` → `STATUS.refining`, board row → refining; loops to define | 2026-10-08 |
| 5 | define | opus | ok | `0 → 28` | attempt 2: `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` edited in place — F1 803 chars (measured offline, brief `## Measured at define`); F2 125 distinct / 127 per-topic sum; F3 closing cases bound to hybrid frozen-vector path, lexical recorded at build (new D11); M1–M4 addressed (M3 adds amendment row 47 → 47 rows: 20 amend / 27 no change); verdict slots blank; `STATUS.refining` → `STATUS.refined`, board row → refined; no `PRD/sections/` or code diff; launch checkout unchanged | 2026-10-08 |
| 6 | gate-qc | sonnet | ok | `0 → 33` | PASS attempt 2 — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: F1–F3 and M1–M4 resolved; 0 must-fix; N1/N2 non-blocking for map-out. Observation: the checker traced numbers to the intake-cited probe outputs (`PRD/work/probe-keyword-rule-retrieval/measure-two-fixes.out.txt`, `FINDINGS-missing.md`, launch checkout, read-only) — the contract says intake-cited documents are never opened; no file was written and the proposal is unaffected. Driver recorded PASS in README `## Preparation gate`; `STATUS.refined` → `STATUS.owner-action`; board row → owner-action | 2026-10-08 |
| — | gate-review | sonnet | ok | `0 → 13` | build-half run `graph-20261008-061643`: 5/5 verdicts `accept` (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220); `GATE-QUESTIONS.md` unchanged; `### Brief reconciliation` none; `## Gate verdicts` written; `## Open gate` RESOLVED; `STATUS.owner-action` → `STATUS.refined`; board row → refined; launch checkout `git status --porcelain` unchanged | 2026-10-08 |
| 4 | gate-qc | sonnet | ok | `0 → 17` | PASS (build-half re-grade, run `graph-20261008-061643`) — `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md`: 0 must-fix; 28/28 removed lines verbatim at the brief's line numbers; 47-row amendment set complete; code sites + numbers re-confirmed (803 chars, 125 distinct / 127 sum); PR #273 still open so intake numbers stand; N1/N2 non-blocking for map-out. Driver recorded PASS in README `## Preparation gate`; `STATUS.refined` kept; launch checkout unchanged | 2026-10-08 |
| 5 | plan | sonnet | ok | `0 → 24` | `GAMEPLAN.md` + 3 slices: `slice-a-exact-exclusion-code.md` (exact exclusion in both `scoreIndex` branches, evidence trace, tests, new `apps/backend/src/gameRulesTopicData.test.ts`), `slice-b-goldens-baseline-measure.md` (3 goldens, baseline without `--allow-regressions`, re-measure; 603.2e/603.2g hybrid gate), `slice-c-prd-truth-and-close.md` (apply 5 accepted slots by intent); `slice-{a,b,c}.criteria.json` 7/9/8 criteria all false; `STATUS.refined` → `STATUS.active`; board row → active; no deliverable under `PRD/work/` except bookkeeping `slice-b.evidence.md` (copied into REQ-179 Notes by C); launch checkout unchanged. Driver: copied ignored `apps/backend/data/models/` into the worktree (local embedder) | 2026-10-08 |

## Open gate

- RESOLVED 2026-10-08 (graph-gate-review, build half `graph-20261008-061643`): 5 of 5 verdicts `accept`, 0 edit, 0 reject; docs PR #277 merged.
- Gate: `define` product-truth proposal (gate-qc PASS, run stopped by design).
- Question: answer the five verdict slots (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220) in `PRD/work/exact-curated-rule-exclusion/GATE-QUESTIONS.md` — accept / edit / reject, with a reason for edit or reject — then merge to build.
- Evidence: `QUALITY-CHECK.md` (PASS, attempt 2); docs PR https://github.com/ChrisMiho/TheJudge/pull/277 (`gh pr create --base main --head thejudge-auto/exact-curated-rule-exclusion`).
- Terminal state: was PARKED (owner-action); resolved, `STATUS.owner-action` restored to `STATUS.refined`.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-179` | accept | — |
| `REQ-022` | accept | — |
| `REQ-181` | accept | — |
| `REQ-182` | accept | — |
| `REQ-220` | accept | — |

Blocker questions: none (the file's `## Blocker questions` reads "None").

### Brief reconciliation

none — every verdict is `accept`; no `edit` or `reject` to carry. Confirmed by reading: `grep -n 'Verdict' GATE-QUESTIONS.md` shows five `- Verdict: accept` lines and every `- Reason:` slot is empty. `DESIGN-BRIEF.md`, the README intake pointer, and `intake/` are untouched.

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261008-053030`. Run the `graph-preflight` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` and follow its Procedure exactly). Copy the `Working directory:` line above, unchanged, into any prompt you write.

Inputs:
- --branch thejudge-auto/exact-curated-rule-exclusion
- --slug exact-curated-rule-exclusion
- --run-id graph-20261008-053030
- --pid 19738 (the driver session's long-lived pid)
- base: default (origin/main)

Steps:
1. From the launch root above (never from inside a worktree), run:
   `npm run graph:preflight -- --branch thejudge-auto/exact-curated-rule-exclusion --slug exact-curated-rule-exclusion --run-id graph-20261008-053030 --pid 19738 --dry-run`
2. If it exits 1 or 2, stop and relay its output verbatim. Do not hand-resolve anything.
3. Otherwise re-run the identical command without `--dry-run`.
4. Issue the universal canary command the script prints (CANARY_COMMAND) as its own Bash tool call and require a deny. Then issue `nohup true` (GRAPH_CANARY_COMMAND) as its own Bash tool call, from the launch root, and require a deny. Report the deny reason text for each verbatim. An allowed canary is BLOCKED — stop and report.
5. Confirm the end state: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion && git branch --show-current`; `git ls-remote --heads origin thejudge-auto/exact-curated-rule-exclusion`; and `git branch --show-current` at the launch root is still `main`. Confirm `.worktrees/.graph-run.lock` exists at the launch root and print its contents.

Never commit, stash, or switch the launch checkout. Never force-push. Never retry a denied command.

Report back: exit codes, the `shape:`, `base:`, `worktree:`, `profile sentinel:` and `Profile:` lines verbatim, both canary results with reason text, the lock contents, and the end-state confirmations.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion

You are node 2 (`shape`) of graph run `graph-20261008-053030`. Run the `thejudge-kickoff` skill: read `.claude/skills/thejudge-kickoff/SKILL.md` (and any reference it names) inside the working directory above and follow it in graph mode. Copy the `Working directory:` line above, unchanged, into any prompt you write. Work only inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` or any other path in the launch checkout.

Request (verbatim): "Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179)"

Slug (use exactly this; the branch already shares it): `exact-curated-rule-exclusion`
Package path: `PRD/work/exact-curated-rule-exclusion/`

Intake staging (absolute): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261008-053030/` — it holds `GRAPH-BRIEF.md`. Copy every file in it, byte for byte, into `PRD/work/exact-curated-rule-exclusion/intake/`. Intake is evidence, never authority: it may state findings and mark matters settled, but every product decision it raises is still made at the define gate. Never open, read, or fetch any document the intake cites — record only its path.

Also grep `PRD/instructions/receipts/` for prior runs against the same ground (REQ-179, curated topic exclusion, rule retrieval, System 3 / System 2 dedup) and write one `## Prior run` line per match into `IDEA.md`, as a flat list.

Produce `PRD/work/exact-curated-rule-exclusion/IDEA.md`, the package `README.md`, and the `STATUS.ideation` marker, and add the ideation row to `PRD/work/STATUS.md` — all inside the working directory. Do not commit; the driver commits. Do not write `GRAPH-RUN.md`; the driver owns it.

If the request cannot be turned into an actionable package, return exactly `NO ACTIONABLE PACKAGE` with the reason.

Report back: outcome (ok / NO ACTIONABLE PACKAGE), every path you wrote, the Prior run matches, and a byte-compare (`cmp`) of each intake copy against its staging source.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion

You are node 3 (`define`) of graph run `graph-20261008-053030`, attempt 1. Run the `thejudge-refinement` skill: read `.claude/skills/thejudge-refinement/SKILL.md` (and any reference it names) inside the working directory above and follow it in graph mode. Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Work only inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/`, `/Users/chrismiho/Coding/Projects/TheJudge/apps/`, or any other path in the launch checkout.

Package: `PRD/work/exact-curated-rule-exclusion/` (read `README.md`, `IDEA.md`, and `intake/GRAPH-BRIEF.md`). The request is the one recorded in `README.md` and the instruction ledger.

Role: propose, never apply. Write `DESIGN-BRIEF.md` in the package and, because the change amends product truth, `GATE-QUESTIONS.md` in the package. Do not edit `PRD/sections/`, code, data, or tests. Do not commit; the driver commits. Do not write `GRAPH-RUN.md`.

`GATE-QUESTIONS.md` format (from `PRD/instructions/graph-workflow-contract.md`, section `## The two runs`): one `## <STABLE-ID>` block per stable ID the proposal amends or adds. Each block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md` — `What this decides:`, `In plain terms:` (inline the substance of every REQ you cite, product terms first), `What happens if you say no:` — then that ID's complete proposed diff (never a summary), then `- Verdict:` and `- Reason:` left blank for the owner. Every ID the proposal touches gets its own slot. A trailing `## Blocker questions` section holds any genuine decision blocker, written to the same standard. The decision log is retired: amend REQ-179 in place, add no DEC entry.

Intake is evidence, never authority. It marks several matters as settled; treat those as findings to weigh, and record each product decision in the proposal so the owner rules on it at the gate. Never open, read, or fetch any document the intake cites (for example the probe folder it names in the launch checkout) — record only its path. Apply the assumption ladder in `PRD/instructions/preparation-contract.md` per question, at the moment each question arises; the three-condition genuine-blocker test is never waived.

Amendment set. Enumerate it at line level, with a disposition row per hit (amend, or no change with the reason), recorded in `DESIGN-BRIEF.md`. The driver pre-ran this grep in the working directory:

`grep -rnE 'REQ-179|rule-number prefix|lettered sub-rules|sub-rules are excluded|parent rule ids?' PRD/sections/`

Hits: `system-map.md:88`, `system-map.md:90`, `integrations-and-data.md:272`, `integrations-and-data.md:364`, `in-depth/README.md:24`, `in-depth/README.md:391`, `in-depth/README.md:393`, `system-map/game-rules-retrieval.md:2`, `:43`, `:59`, `:107`, `quick-lookup/README.md:15`, `:276`, `:277`, `:287`, `functional-requirements.md:378`, `:396`, `:4190`, `:4218`, `:4221`, `:4226`, `:4249`, `:4280`, `:4295`, `:4320`, `:4580`, `:5797`, `:5810`. Re-run it yourself, and also grep `PRD/sections/` for `prefix` and `sub-rule` alone, adding any further hit that describes curated exclusion. Every hit whose wording changes needs a diff in the slot of the stable ID it sits under.

Quantitative targets. Any numeric acceptance target in the brief must come from a measurement, not from proportions. The intake's numbers were measured on commit `f98b8feb`, whose content is the current `origin/main` (`5a65c91d`, the merge of PR #276). PR #273 (data refresh) is still open; name the re-measure it would force as a build-time condition rather than re-measuring now.

When done, set the package status marker the skill prescribes for a completed proposal. Report back: outcome, every path written, the stable IDs with a slot in `GATE-QUESTIONS.md`, the amendment-set disposition counts, and any blocker question raised.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion

You are node 4 (`gate-qc`) of graph run `graph-20261008-053030`, attempt 1. Run the `thejudge-quality-check` skill: read `.claude/skills/thejudge-quality-check/SKILL.md` (and any reference it names) inside the working directory above and follow it in graph mode. Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Work only inside that working directory; never write to any path in the launch checkout `/Users/chrismiho/Coding/Projects/TheJudge/` outside `.worktrees/kickoff-exact-curated-rule-exclusion/`.

Package: `PRD/work/exact-curated-rule-exclusion/`. Checked artifact: `DESIGN-BRIEF.md`, graded together with the proposal in `GATE-QUESTIONS.md` (five amend-in-place slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220). The proposal is not yet applied to `PRD/sections/` by design — build applies it — so grade the brief against current `PRD/sections/` truth as amended by that proposal, and grade the proposal's diffs for accuracy against current `PRD/sections/` text.

Check in particular:
- Amendment-set completeness at line level: re-run `grep -rnE 'REQ-179|rule-number prefix|lettered sub-rules|sub-rules are excluded|parent rule ids?' PRD/sections/` and case-insensitive greps for `prefix`, `sub-rule`, and `parent rule` over `PRD/sections/`; every hit describing curated exclusion must have a disposition row in the brief, and every amend row a matching diff in `GATE-QUESTIONS.md`.
- Every removed line in each diff matches `PRD/sections/` verbatim.
- Each `GATE-QUESTIONS.md` block opens with the three plain-language lines and leaves `- Verdict:` / `- Reason:` blank.
- Numeric acceptance targets trace to a recorded measurement.

Write the PASS/FAIL report the skill prescribes, inside the package. Do not edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or the package `README.md` `## Preparation gate` section — the driver writes that section. Do not commit. Do not write `GRAPH-RUN.md`.

Report back: PASS or FAIL, the report path, and the complete findings list.

### define (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion

You are node 3 (`define`) of graph run `graph-20261008-053030`, attempt 2, re-entered after a `gate-qc` FAIL (attempt 1 of 3). Run the `thejudge-refinement` skill: read `.claude/skills/thejudge-refinement/SKILL.md` (and any reference it names) inside the working directory above and follow it in graph mode. Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Work only inside that working directory; never write to any path in the launch checkout `/Users/chrismiho/Coding/Projects/TheJudge/` outside `.worktrees/kickoff-exact-curated-rule-exclusion/`.

Package: `PRD/work/exact-curated-rule-exclusion/`. Your attempt-1 output is `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. The quality-check findings are in `QUALITY-CHECK.md` and in the README `## Preparation gate` section: three must-fix items (F1, F2, F3) and four minor items (M1–M4). Resolve every must-fix item and address the minor ones, editing `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` in place. Keep everything attempt 1 got right (the amendment set, verbatim removed lines, block format, measurement traces) unchanged except where a finding requires.

For F3, the choice between binding the closing-case criterion to the measured ranking path and measuring the lexical ranks now is yours under the assumption ladder in `PRD/instructions/preparation-contract.md`, applied to that one question. If you measure, do it offline against committed data inside the working directory (no network, no live model call) and record the command and output in the brief. Any number you write must trace to a recorded measurement or to the committed data.

Rules unchanged from attempt 1: propose, never apply — no edits to `PRD/sections/`, code, data, or tests; amend in place, no DEC entry; intake is evidence, never authority, and documents it cites are never opened; every `- Verdict:` / `- Reason:` slot stays blank. Do not edit the README `## Preparation gate` section or `QUALITY-CHECK.md`. Do not commit. Do not write `GRAPH-RUN.md`.

When done, set the package status marker the skill prescribes for a completed proposal and move the board row in `PRD/work/STATUS.md` to match (remove from the old section, add to the new). Report back: outcome, each finding and how it was resolved, every path written, and any blocker question raised.

### gate-qc (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-exact-curated-rule-exclusion

You are node 4 (`gate-qc`) of graph run `graph-20261008-053030`, attempt 2, re-checking after `define` attempt 2 answered the attempt-1 FAIL. Run the `thejudge-quality-check` skill: read `.claude/skills/thejudge-quality-check/SKILL.md` (and any reference it names) inside the working directory above and follow it in graph mode. Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Work only inside that working directory; never write to any path in the launch checkout `/Users/chrismiho/Coding/Projects/TheJudge/` outside `.worktrees/kickoff-exact-curated-rule-exclusion/`.

Package: `PRD/work/exact-curated-rule-exclusion/`. Checked artifact: `DESIGN-BRIEF.md`, graded together with the proposal in `GATE-QUESTIONS.md` (five amend-in-place slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220). The proposal is not yet applied to `PRD/sections/` by design — build applies it — so grade the brief against current `PRD/sections/` truth as amended by that proposal, and grade the proposal's diffs for accuracy against current `PRD/sections/` text. The attempt-1 findings are in the README `## Preparation gate` section; confirm each is resolved, and grade the whole package fresh rather than only the deltas.

Check in particular:
- Amendment-set completeness at line level: re-run `grep -rnE 'REQ-179|rule-number prefix|lettered sub-rules|sub-rules are excluded|parent rule ids?' PRD/sections/` and case-insensitive greps for `prefix`, `sub-rule`, and `parent rule` over `PRD/sections/`; every hit describing curated exclusion must have a disposition row in the brief, and every amend row a matching diff in `GATE-QUESTIONS.md`.
- Every removed line in each diff matches `PRD/sections/` verbatim.
- Each `GATE-QUESTIONS.md` block opens with the three plain-language lines and leaves `- Verdict:` / `- Reason:` blank.
- Numeric acceptance targets trace to a recorded measurement or to committed data.

Replace `QUALITY-CHECK.md` with this attempt's PASS/FAIL report. Do not edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or the package `README.md` — the driver writes the `## Preparation gate` section and any status change. Do not commit. Do not write `GRAPH-RUN.md`.

Report back: PASS or FAIL, the report path, and the complete findings list.

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-exact-curated-rule-exclusion

You are the gate-resolution step of the build half of graph run `graph-20261008-061643` (spec-forming run `graph-20261008-053030`). Run the `graph-gate-review` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-gate-review/SKILL.md` and follow its Procedure exactly against the package `PRD/work/exact-curated-rule-exclusion/` inside the working directory above. Copy the `Working directory:` line above, unchanged, into any prompt you write.

Context:
- Branch: `thejudge-auto/exact-curated-rule-exclusion-work` (checked out in the working directory; cut from origin/main after docs PR #277 merged).
- The owner answered all five verdict slots in `GATE-QUESTIONS.md` (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220) and merged the docs PR; every verdict reads `accept`.
- Apply the verdicts inside `GATE-QUESTIONS.md` only. Never edit `PRD/sections/`, code, or the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge` (it stays on main, untouched).
- Reconcile `DESIGN-BRIEF.md` and the README intake pointer to every `edit` or `reject` verdict (there are none, so the reconciliation list should read none — confirm by reading, do not assume). `intake/` stays verbatim.
- Write `## Gate verdicts` into `GRAPH-RUN.md`, mark `## Open gate` resolved, and restore `STATUS.owner-action` to `STATUS.refined` (exactly one marker) and the `PRD/work/STATUS.md` board row to refined. Leave the ledger header lines (Run ID, Current node, Next action) to the driver.
- Do not commit or push; the driver commits between nodes.
- Verify directly. Spawn no subagents or forks. No sleeping or polling. Stay well under the 60 tool-call budget.

Report back: each verdict as applied, a `### Brief reconciliation` list (or none), every path you wrote (absolute), the marker before and after, and `git status --porcelain` from the working directory.

### gate-qc (build half)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-exact-curated-rule-exclusion

You are node 4 (`gate-qc`) of graph run `graph-20261008-061643`, the build half re-entering at the quality check after gate resolution. Run the `thejudge-quality-check` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-quality-check/SKILL.md` and follow it against `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md` inside the working directory above. Copy the `Working directory:` line above, unchanged, into any prompt you write.

Context:
- The owner accepted all five proposed IDs unchanged (see `## Gate verdicts` in `GRAPH-RUN.md`); `GATE-QUESTIONS.md` is the finalized proposal and the brief needed no reconciliation. The prior PASS (attempt 2, run `graph-20261008-053030`) is in `QUALITY-CHECK.md`; re-grade the package as it stands now against current `PRD/sections/` and code on this branch, which was cut from origin/main after docs PR #277 and code PR #276 merged. Confirm the brief and proposal still match current truth (line numbers and quoted removed lines in the proposed diffs, the cited code paths) rather than trusting the earlier report.
- Data refresh PR #273 is still open and unmerged, so the measured numbers in the brief stand against current data.
- Intake is evidence only: never open a document `intake/` cites (for example files under `PRD/work/probe-keyword-rule-retrieval/`); record only its path.
- Write the result to `PRD/work/exact-curated-rule-exclusion/QUALITY-CHECK.md` (replace it, keeping a one-line note of prior attempts). On FAIL set `STATUS.refining` per the skill; on PASS leave `STATUS.refined`. The driver owns the README `## Preparation gate` section and the ledger; do not edit them. Never edit `PRD/sections/`, code, or anything outside the working directory; the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge` stays untouched.
- Do not commit or push. Do not run benchmarks or anything that rewrites tracked result files.
- Verify directly. Spawn no subagents or forks. No sleeping or polling. Stay well under the 60 tool-call budget.

Report back: PASS or FAIL, the complete findings list (must-fix and minor), every path you wrote (absolute), and `git status --porcelain` from the working directory.

### plan

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-exact-curated-rule-exclusion

You are node 5 (`plan`) of graph run `graph-20261008-061643`. Run the `thejudge-map-out` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md`, and follow them against the package `PRD/work/exact-curated-rule-exclusion/` inside the working directory above. Copy the `Working directory:` line above, unchanged, into any prompt you write.

Context:
- Branch: `thejudge-auto/exact-curated-rule-exclusion-work`. The README `## Preparation gate` records `Quality-check: PASS` (build-half re-grade); verify it there before writing anything.
- The finalized proposal is `GATE-QUESTIONS.md` (all five IDs accepted unchanged); `DESIGN-BRIEF.md` is the intent. Build (node 6) applies the `PRD/sections/` truth by intent together with the code, so the slices must include that apply step.
- Fold the gate-qc notes N1 (data test matching method; plain substring works today) and N2 (confirm the data test location and the evidence-trace test file path) into the slice docs by checking the code now.
- Emit one `slice-<letter>.criteria.json` beside each slice doc, every criterion `false`, with evidence blocks per the map-out reference. Prefer command evidence that `thejudge-implement-all` will naturally issue (the repo npm scripts) over `manual`.
- Every deliverable must land outside `PRD/work/` — node 8 deletes the package folder on this branch before the merge. Only GAMEPLAN, slice docs, criteria files and bookkeeping go in the package.
- Set `STATUS.active` per the skill and update the `PRD/work/STATUS.md` board row. The driver owns the ledger and the README `## Preparation gate` / `## Autonomous metadata`; leave them.
- Never edit `PRD/sections/`, code, or anything outside the working directory; the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge` stays untouched. Do not commit or push.
- Verify directly. Spawn no subagents or forks. No sleeping or polling. Stay well under the 120 tool-call budget.

Report back: the slice list (letter, title, one line each), every path you wrote (absolute), the marker before and after, and `git status --porcelain` from the working directory.

### build

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-exact-curated-rule-exclusion

You are node 6 (`build`) of graph run `graph-20261008-061643`. Run the `thejudge-implement-all` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-implement-all/SKILL.md` (and any reference it names) and follow it against `PRD/work/exact-curated-rule-exclusion/` inside the working directory above, implementing slices A, B, C in order. Copy the `Working directory:` line above, unchanged, into any prompt you write.

Context:
- Shared branch: `thejudge-auto/exact-curated-rule-exclusion-work`, already checked out in the working directory (cut from origin/main, pushed). Work in place: no second worktree, no contributor branch. Open the code PR `thejudge-auto/exact-curated-rule-exclusion-work` into `main` with `gh pr create --base main --head thejudge-auto/exact-curated-rule-exclusion-work`; its body opens with the plain-language block from `PRD/instructions/plain-language-standard.md`. Never merge or close a PR, never force-push, never push main.
- Apply the accepted `PRD/sections/` truth by intent (finalized `GATE-QUESTIONS.md` + `DESIGN-BRIEF.md`, re-derived against current truth) together with the code, as slice C says. Do not add new stable IDs.
- Setup: the worktree has no `node_modules`; run `npm ci` in the working directory first. `apps/backend/data/models/` (the local embedder) is already present; confirm hybrid runs did not fall back to lexical.
- Data refresh PR #273 is still open; slice B's check against `f98b8feb` should find no data change. Never run `npm run data:refresh` or any Scryfall or paid OpenAI call (no live answer-quality runs).
- `npm run benchmark:rag-retrieval` rewrites `scoredAt` in tracked `apps/backend/src/eval/benchmark/results.json` and `semantic-results.json`; if the only change is the timestamp, restore those two files with `git checkout --` before committing.
- Prettier governs only JSON/YAML here; never run prettier on `.ts`/`.mjs`. Use `npm run format` only for a script-written JSON that fails `format:check`.
- Criteria: flip each `slice-*.criteria.json` value to `true` with the Edit tool only after its evidence command was issued and passed. Never use `sed -i` or a heredoc on package files. If the hook denies a flip, do not route around it: record which ids and the denial text and report them.
- A denied command is never retried verbatim. If the harness denies something, switch to Edit/Write or a standalone command, or stop and report.
- Every file you write stays inside the working directory; the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge` stays untouched. Stage explicit paths only (never `git add -A`, `--all`, or `.`). Commit and push per slice as the skill directs, with the commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the PR body ending with the Claude Code attribution line.
- Subagent fan-out is off for this run: do the work yourself, spawn no subagents or forks. No sleeping or polling.

Report back: per slice — outcome, commits, test and eval commands with their pass/fail results and the measured values; the criteria still `false` (if any) with the reason; the PR URL; every path you wrote (absolute); and `git status --porcelain` from the working directory.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179)" | answered-once | shape | — |
