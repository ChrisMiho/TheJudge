# Graph run — rules-test-harness

- Run ID: `graph-20261006-181340`
- Profile: `loaded (env sentinel)` (graph-preflight observation at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph tier `denied — armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/rules-test-harness` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness` (rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rules-test-harness` by the build half's claim)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261006-181340/`
- Current node: `define`
- Next action: `/graph-kickoff PRD/work/rules-test-harness/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/rules-test-harness` pushed (`git ls-remote --heads origin thejudge-auto/rules-test-harness` → `066fbbd`) from `.worktrees/kickoff-rules-test-harness`; launch checkout still on `main` (reflog: no switch); lock `.worktrees/.graph-run.lock` runId `graph-20261006-181340` pid 19738 | 2026-10-06 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/rules-test-harness/IDEA.md` (10 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging), `PRD/work/STATUS.md` ideation row | 2026-10-06 |
| 3 | define | opus | ok | `0 → 69` | `PRD/work/rules-test-harness/DESIGN-BRIEF.md` (13 measurements, 7 slices A–G, 220-row disposition table), `GATE-QUESTIONS.md` (amend REQ-185–190, NFR-018; new REQ-222–225; Blocker questions Q-007 joke-only list, Q-008 tier-3 count), `measure/` (3 scripts + `mechanics-result.json`), `STATUS.refined`; measured 258 mechanics in the committed rule index, gold deciding-rule hit 16/18 semantic | 2026-10-06 |
| 4 | gate-qc | sonnet | failed | `0 → 42` | FAIL attempt 1 of 3: 8 findings (4 Important: slice E red on its own + stale-compare owner, run-1 size arithmetic/untraced counts, tier-1 `cards` migration, Q-007/Q-008 plain-language default; 4 Minor: disposition rows, REQ-187/189 leftover wording, state-fact test + system-map status, Infinity count); proposed diffs verified exact, IDs unused, 9 measurements reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 5 | define | opus | ok | `0 → 79` | attempt 2: 8 gate-qc findings fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (slice E ships gate as tested code, wired in F; slice A owns stale compare; run 1 = 18 + 255 + 120 = 393; 15 tier-1 cards migration measured 16/18 unchanged; Q-007/Q-008 rewritten, Q-007 now keeps the three Attraction mechanics; 220 hits = 220 rows; REQ-187/189 wording; state-fact test + system-map `partial`; Infinity 4 cards); new `measure/migration-cards.mjs` (M15), `measure/depth-pool.mjs` (M16); `STATUS.refined` | 2026-10-06 |
| 6 | gate-qc | sonnet | failed | `0 → 39` | FAIL attempt 2 (2nd FAIL of 3 allowed loops): all 8 attempt-1 findings confirmed resolved; 8 new findings (1 Important: stale approved case has no re-approval path — apply writes only `review.*`, render skips approved; 7 Minor: stack-zone `owner:` line, `gameState` request slice owner, forward REQ-222–225 refs, `coverage.json` drift after review, up-to-13 tier-3 source, Q-007 intake count, hard-area list 8 vs 12); diffs exact, 220 hits = 220 rows, M15/M16 reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 7 | define | opus | ok | `0 → 50` | attempt 3: 8 attempt-2 findings fixed in `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `IDEA.md` (review command renders stale approved cases and apply re-records `snapshot`, slice D; stack `owner`/`caster` loader rule; slice A builds the In-Depth request; apply-order rule A21 moves REQ-185→G, REQ-188→F, REQ-189→E, REQ-222→E, REQ-224→E; apply rewrites `coverage.json`; tier-3 ceiling 15 − 2 = 13 sourced; Q-007 intake count 253/252; one twelve-area hard list); M16 re-run with twelve areas (2,651 hard-area two-card rulings, 1,232 negative-phrased); `STATUS.refined` | 2026-10-06 |
| 8 | gate-qc | sonnet | failed | `0 → 56` | FAIL attempt 3 (3rd FAIL; final loop to define): all 8 attempt-2 findings confirmed resolved, no attempt-1 regression; 2 Minor findings (18 migrated cases ship `approved` vs no-agent-approves rule in REQ-185/REQ-224/A19; awaiting-re-freeze state has no owning slice or test); 3 advisories; diffs exact, 220 hits = 220 rows, M1/M7/M8/M15/M16 reproduced; `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261006-181340`. Follow the `graph-preflight` skill at `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` exactly (read it first, and read `PRD/instructions/graph-workflow-contract.md`). Copy the `Working directory:` line above, unchanged, into any prompt you write.

Inputs:
- --branch thejudge-auto/rules-test-harness
- --slug rules-test-harness
- --run-id graph-20261006-181340
- --pid 19738

Procedure (from the skill): run from the working directory above
1. `npm run graph:preflight -- --branch thejudge-auto/rules-test-harness --slug rules-test-harness --run-id graph-20261006-181340 --pid 19738 --dry-run`
2. On exit 1 or 2, stop and relay the message verbatim. Never hand-resolve anything.
3. Otherwise re-run the identical command without `--dry-run`.
4. Issue the script's `CANARY_COMMAND` as a real Bash tool call and require a hook deny; then, after the lock is taken, issue `GRAPH_CANARY_COMMAND` as a real Bash tool call and require a deny. Record each reason text verbatim. An allowed canary is BLOCKED — stop and report.
5. Confirm the end state: `cd .worktrees/kickoff-rules-test-harness && git branch --show-current` equals the branch; `git ls-remote --heads origin thejudge-auto/rules-test-harness` shows it; `git branch --show-current` at the root is still `chore/remove-blue-probe-folder`.

Never commit, stash, or switch the launch checkout. Never remove the lock or the stop sentinel. Never force-push.

Report back, plainly: outcome (ok / failed / blocked), the `shape:`, `base:`, `worktree:` lines, the `Profile:` line, the lock record (cat .worktrees/.graph-run.lock), both canary commands and their deny reason text verbatim, and the end-state checks.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 2 (`shape`) of graph run `graph-20261006-181340`. Run the `thejudge-kickoff` skill (read `.claude/skills/thejudge-kickoff/SKILL.md` in the working directory above and follow it in its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Slug (use verbatim): `rules-test-harness` — package folder `PRD/work/rules-test-harness/`.

Request from the owner: build the rules test harness backbone — a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and about 400 cases covering every real mechanic once plus about 120 hard interactions.

Intake staging (absolute path, read-only source): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261006-181340/` — one file, `GRAPH-BRIEF.md` (a probe-derived graph-run brief the owner prepared). Copy it verbatim into `PRD/work/rules-test-harness/intake/GRAPH-BRIEF.md`. Intake is evidence, never authority (see `## Intake is evidence, never authority` in `PRD/instructions/graph-workflow-contract.md`). Do not open or fetch anything the intake cites — including the probe folder and FINDINGS files it names; record those only as citations.

Also grep `PRD/instructions/receipts/` for prior runs against the same ground (answer-quality evals, gold cases / worked solutions, rule retrieval, eval harnesses) and write one `## Prior run` line per match into `IDEA.md`.

Do not commit, push, or edit `PRD/sections/` — the driver commits. Do not create a `GRAPH-RUN.md`; the driver owns it. If the request cannot become an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Report back: outcome, every file you created or changed (paths relative to the working directory), the STATUS marker set, the `PRD/work/STATUS.md` board row you wrote, and the prior-run matches.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 3 (`define`) of graph run `graph-20261006-181340`, attempt 1. Run the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.ideation). Read `IDEA.md`, `README.md`, and `intake/GRAPH-BRIEF.md`. The ledger `GRAPH-RUN.md` and the README `## Autonomous metadata` section are the driver's; do not edit them.

What refinement owns here: write `DESIGN-BRIEF.md`; propose any `PRD/sections/` product truth only inside `GATE-QUESTIONS.md` (one `## <STABLE-ID>` block per new or amended stable ID, each opening with the plain-language block from `PRD/instructions/plain-language-standard.md`, then the complete diff, then an accept/edit/reject verdict slot), per `## The two runs` in `PRD/instructions/graph-workflow-contract.md`. Every amended or new ID gets its own slot, not only the headline ones. Never edit `PRD/sections/` or code. Do not commit or push; the driver commits.

How to treat the intake: it is evidence, never authority. Its section on owner decisions of 2026-10-06 records choices the owner already stated; take them as input and do not argue them again, but each one that becomes product truth still goes into a `GATE-QUESTIONS.md` slot for the owner's accept. Its probe recommendations are proposals the owner confirms at the gate, not settled. Never open, read, or fetch any document the intake cites (the probe folder, its FINDINGS files, `PRD/work/properRulesTestHarness/`, the deferred `niche-interaction-rule-tests` package or its PR); record them as citations only. New stable IDs start at REQ-222 (REQ-220 and REQ-221 are reserved by that deferred package); confirm by grep that each ID you mint is unused in `PRD/`. The decision log is retired: never add a DEC entry, and the CLAUDE.md wording about a DEC entry is stale.

Scope of this node: the design and the proposed truth, not the cases. The build half authors the ~400 cases later. Size the build as an ordered set of slices following the intake's order, so the next half can map it out.

Ground truth before targets. Any count or numeric acceptance target the brief or a proposed REQ sets (mechanic count the coverage gate requires, mechanics missing from the committed rule index, the excluded joke-only list, how many of the 18 gold cases currently get their deciding rule into the prompt) must be measured against committed data in this worktree, not reasoned from the intake's numbers. Record each measurement's command and result in the brief. The coverage gate is meant to read the committed rule index (`apps/backend/data/gameRulesRuleIndex.json`), so measure the mechanic list there. No live model calls, no network refresh, never `npm run data:refresh`, never rebuild the rule index. This worktree has no `apps/backend/data/models/`; if a measurement needs the local embedder, copy that folder from `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/` into the same path here (it is gitignored; do not commit it), and never record a measurement taken on a lexical fallback. Any scratch measurement script you keep goes in the package folder.

Cross-cutting consistency by grep, not memory. For every existing stable ID the proposal amends or relies on (at least REQ-177, REQ-185 through REQ-190, NFR-018), run one quoted grep across `PRD/`, `apps/backend/src/eval/`, and `scripts/` at line level, and put a disposition table in the brief: one row per hit, saying whether the proposal amends it, leaves it true, or it needs no change. This includes hits in `PRD/sections/system-map.md`, `goals-and-non-goals.md`, `in-depth/README.md`, `non-functional-requirements.md`, and `apps/backend/src/eval/worked-solutions/README.md`. Past runs failed gate-qc three times on amendment sets enumerated at file level.

Apply the assumption ladder and the genuine-blocker test from `PRD/instructions/preparation-contract.md` per question as each arises. Open choices that are product decisions (for example whether 702.186 Infinity counts as joke-only, or how many tier-3 owner-researched cases run 1 carries) go to the owner through `GATE-QUESTIONS.md` or its `## Blocker questions` section; do not resolve them silently.

Your tool-call cap is 150 for this node, and any subagent you dispatch spends from the same budget. Spend it on measurement and the grep, not on rereading.

When done, set `STATUS.refined` (single marker, `git mv`), update the README frontmatter, and move the `PRD/work/STATUS.md` board row fully from ideation to refined (remove from the old section, add to the new).

Report back: outcome, files created or changed, the STATUS marker set, whether `GATE-QUESTIONS.md` exists and which stable IDs it carries, each measurement and its result, and a few plain sentences on what the harness would do for the owner.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 4 (`gate-qc`) of graph run `graph-20261006-181340`, attempt 1. Run the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refined). Grade `DESIGN-BRIEF.md` together with the proposed product truth in `GATE-QUESTIONS.md` (amended REQ-185 through REQ-190 and NFR-018; new REQ-222 through REQ-225; blocker questions Q-007 and Q-008) against current `PRD/sections/` truth and agent-readiness. Intake under `intake/` is evidence only. The ledger `GRAPH-RUN.md` and the README `## Preparation gate` and `## Autonomous metadata` sections are the driver's; do not edit them.

Check cross-cutting consistency by grep, not memory: re-run the brief's line-level grep for each amended or relied-on ID (REQ-177, REQ-185 through REQ-190, NFR-018) across `PRD/`, `apps/backend/src/eval/`, and `scripts/`, and confirm every hit has a disposition row and that each amendment the rows promise appears in a `GATE-QUESTIONS.md` diff. Confirm each diff's removed lines match the live file text exactly. Confirm REQ-222 through REQ-225, Q-007 and Q-008 are unused anywhere in `PRD/` outside this package. Spot-check at least three of the brief's measurements by re-running the recorded command (the scripts are in `measure/`; no live model calls, no network refresh, never rebuild the rule index). Check the build slices are ordered so each one can be built and tested on its own, and that every numeric acceptance target in a slice or proposed REQ traces to a recorded measurement.

Blocker questions Q-007 and Q-008 are owner decisions; grade whether each is stated to the plain-language standard with a recommendation and a clear default, not what the answer should be.

Do not edit `PRD/sections/`, code, the brief, or `GATE-QUESTIONS.md`. Do not commit or push; the driver commits. Your tool-call cap is 60 for this node, and any subagent you dispatch spends from the same budget.

Report back: PASS or FAIL, the complete findings list with severity (none if PASS), the STATUS marker you set, and any file you wrote.

### define (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 3 (`define`) of graph run `graph-20261006-181340`, attempt 2, after a `gate-qc` FAIL (loop 1 of 3). Run the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refining). Your prior output is committed: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `measure/`. Resolve exactly the eight gate-qc findings recorded in the README `## Preparation gate` section, and nothing else. Read that section first; it is the authoritative list. In short:

  1. (Important) Slice E must build and test green on its own; settle in the brief how the coverage gate ships before slice F's cases exist (no hidden choice left to map-out), and name which slice owns the stale comparison that slice C's approved-and-non-stale filter needs.
  2. (Important) Make the run-1 size arithmetic add up and trace every count to a recorded measurement: the hard-area block, the total, the source of any extra fill-ins when Q-008 recommends 0, the two-card ruling pool (add a `## Measurements` row with its command), the unused `Example:` line count (measure it), and the basis for REQ-185's at-least-a-third `does-not-work` criterion (measure what the pool can supply, or state it as an authoring target outside the acceptance criterion, consistently in brief and diff).
  3. (Important) State what `cards` each of the 15 tier-1 gold cases migrates with, such that slice A's unchanged 16/18 with the same two misses still holds, and reconcile REQ-185's every-named-card-attached rule with that (for example `token-created-by-name-uses-oracle-card` and Tarmogoyf). Measure, do not reason, whether any change moves the baseline.
  4. (Important) Rewrite Q-007 and Q-008 to the plain-language standard in `PRD/instructions/plain-language-standard.md`: lead with the decision, gloss every term (Un-set, acorn, Unfinity, eternal formats), replace the undefined re-park jargon with what the owner experiences (nothing is built until they answer), and give a clear default. Reconcile Q-007's recommendation on the three Attraction mechanics (701.51, 701.52, 702.159) with its own caution.
  5. (Minor) Disposition table: add the missing `PRD/work/STATUS.md:21` row and correct the `STATUS.md:52` row's cited IDs. Re-run the grep after your edits so the stated hit count matches the rows.
  6. (Minor) REQ-187 Correctness bullet (published worked solution), REQ-187 no-axis bullet, REQ-189 no-prose guard naming `workedSolution`: amend each in its diff or record in the brief that it is intentionally kept and why.
  7. (Minor) Add a test for the state-fact check to slice B's done-when and specify the `gameState` to In-Depth request mapping, checked against the request type in code (zones, stack, controllers). Fix the system-map entry's status so it does not claim shipped features that arrive in later slices.
  8. (Minor) Reconcile the Infinity card count with `measure/text-search.mjs` output (4 cards naming it, 2 with rulings) in brief M4 and Q-007.

For each finding, grep the whole package (brief, `GATE-QUESTIONS.md` diffs, README links, measurement script comments) at line level for every occurrence of the affected wording or number and fix each hit, so no stale copy survives in another file. Any new removed line in a `GATE-QUESTIONS.md` diff must match the live `PRD/sections/` text exactly. Keep the plain-language block and verdict slot shape in every `GATE-QUESTIONS.md` block. Measurements follow the same rules as attempt 1: committed data only, no live model calls, no network refresh, never `npm run data:refresh`, never rebuild the rule index, never record a lexical-fallback measurement (the copied `apps/backend/data/models/` is already in place).

Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, or the README `## Preparation gate` and `## Autonomous metadata` sections. Do not commit or push; the driver commits. Apply the assumption ladder and genuine-blocker test from `PRD/instructions/preparation-contract.md` per question as each arises; product decisions go to the owner through `GATE-QUESTIONS.md`, never resolved silently. Your tool-call cap is 150 for this node, shared with any subagent you dispatch.

When done, set `STATUS.refined` (single marker, `git mv`), README frontmatter, and move the `PRD/work/STATUS.md` board row fully from refining to refined (remove from the old section, add to the new).

Report back: outcome, each finding and what you changed for it (file and line), new measurements with commands and results, files changed, and the STATUS marker set.

### gate-qc (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 4 (`gate-qc`) of graph run `graph-20261006-181340`, attempt 2, re-grading after define attempt 2 addressed the attempt-1 findings recorded in the README `## Preparation gate` section. Grade the whole package fresh, not only those findings, and confirm each of the eight is actually resolved. Run the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refined). Grade `DESIGN-BRIEF.md` together with the proposed product truth in `GATE-QUESTIONS.md` (amended REQ-185 through REQ-190 and NFR-018; new REQ-222 through REQ-225; blocker questions Q-007 and Q-008) against current `PRD/sections/` truth and agent-readiness. Intake under `intake/` is evidence only. The ledger `GRAPH-RUN.md` and the README `## Preparation gate` and `## Autonomous metadata` sections are the driver's; do not edit them.

Check cross-cutting consistency by grep, not memory: re-run the brief's line-level grep for each amended or relied-on ID (REQ-177, REQ-185 through REQ-190, NFR-018) across `PRD/`, `apps/backend/src/eval/`, and `scripts/`, and confirm every hit has a disposition row and that each amendment the rows promise appears in a `GATE-QUESTIONS.md` diff. Confirm each diff's removed lines match the live file text exactly. Confirm REQ-222 through REQ-225, Q-007 and Q-008 are unused anywhere in `PRD/` outside this package. Re-run the two new measurements (M15 `measure/migration-cards.mjs`, M16 `measure/depth-pool.mjs`) and spot-check at least one earlier one; no live model calls, no network refresh, never rebuild the rule index. Check the build slices are ordered so each one can be built and tested green on its own, and that every numeric acceptance target in a slice or proposed REQ traces to a recorded measurement, and that the run-1 counts agree everywhere they appear in the package.

Blocker questions Q-007 and Q-008 are owner decisions; grade whether each is stated to the plain-language standard with a recommendation and a clear default, not what the answer should be.

Do not edit `PRD/sections/`, code, the brief, or `GATE-QUESTIONS.md`. Do not commit or push; the driver commits. Your tool-call cap is 60 for this node, and any subagent you dispatch spends from the same budget.

Report back: PASS or FAIL, the complete findings list with severity (none if PASS), the STATUS marker you set, and any file you wrote.

### define (attempt 3)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 3 (`define`) of graph run `graph-20261006-181340`, attempt 3, after a second `gate-qc` FAIL (loop 2 of 3; one loop remains after this, so be thorough). Run the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refining). Your prior output is committed: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `measure/`. Resolve exactly the eight attempt-2 gate-qc findings recorded in the README `## Preparation gate` section, and nothing else. Read that section first; it is the authoritative list. In short:

  1. (Important) Give a stale approved case a working path back: say which command re-records its `snapshot` hashes, how a stale approved case is rendered for review, which slice (D or E) owns it, and amend REQ-224's apply criterion (today it writes only `review.*`), REQ-225's re-approval wording, and slice D's done-when so all three agree.
  2. (Minor) State-fact check for the stack zone: read `promptFormatting.ts` around line 255, then either check `owner` for non-stack zones only or forbid an owner on stack items, consistently in A15 and the REQ-222 state-fact criterion.
  3. (Minor) Name the slice that turns a case's `gameState` into an In-Depth request (`buildCaseRequest`), and make its done-when test it.
  4. (Minor) Slices that cite REQ-222 through REQ-225 before those entries are applied: reorder where the IDs are applied, or state explicitly in the brief why a forward reference is acceptable, consistent with the brief's own each-slice-applies-only-truth-true-once-it-lands rule.
  5. (Minor) Say whether the review apply command rewrites `coverage.json` or the coverage command must follow it, so the owner's own review never fails the next pull request; reflect it in REQ-223, REQ-224 and slice D.
  6. (Minor) State the source of the up-to-13 extra tier-3 figure (the intake's tier-3 ceiling of 15 minus the 2 testers) in the brief and Q-008, and reword Q-008 so it does not imply only 13 slots exist when 58 two-card slots can be swapped.
  7. (Minor) Correct Q-007's description and count of the intake's exclusion list (the intake excluded four mechanics, did not list Assemble, and left 702.186 undecided: 253 with its real list, 252 with Assemble added), and define what the intake is the first time Q-007 and the brief name it to the owner.
  8. (Minor) Use one hard-area list everywhere: align the REQ-185 criterion's eight areas with M16 and A16's twelve (or narrow M16/A16 to the eight), and make the represented-areas claim match.

For each finding, grep the whole package (brief, `GATE-QUESTIONS.md` diffs, README links, measurement script comments) at line level for every occurrence of the affected wording or number and fix each hit, so no stale copy survives in another file. After your edits, re-run your own consistency checks: every removed line in a `GATE-QUESTIONS.md` diff matches the live `PRD/sections/` text exactly, the M10 disposition grep still gives one row per hit, and the run-1 counts agree everywhere. Keep the plain-language block and verdict slot shape in every `GATE-QUESTIONS.md` block. Measurements follow the same rules as before: committed data only, no live model calls, no network refresh, never `npm run data:refresh`, never rebuild the rule index, never record a lexical-fallback measurement.

Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, or the README `## Preparation gate` and `## Autonomous metadata` sections. Do not commit or push; the driver commits. Apply the assumption ladder and genuine-blocker test from `PRD/instructions/preparation-contract.md` per question as each arises; product decisions go to the owner through `GATE-QUESTIONS.md`, never resolved silently. Your tool-call cap is 150 for this node, shared with any subagent you dispatch.

When done, set `STATUS.refined` (single marker, `git mv`), README frontmatter, and move the `PRD/work/STATUS.md` board row fully from refining to refined (remove from the old section, add to the new).

Report back: outcome, each finding and what you changed for it (file and line), any new measurement with command and result, files changed, and the STATUS marker set.

### gate-qc (attempt 3)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 4 (`gate-qc`) of graph run `graph-20261006-181340`, attempt 3, re-grading after define attempt 3 addressed the attempt-2 findings recorded in the README `## Preparation gate` section. Grade the whole package fresh, not only those findings, and confirm each of the eight is actually resolved, and that the attempt-1 fixes did not regress. Run the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refined). Grade `DESIGN-BRIEF.md` together with the proposed product truth in `GATE-QUESTIONS.md` (amended REQ-185 through REQ-190 and NFR-018; new REQ-222 through REQ-225; blocker questions Q-007 and Q-008) against current `PRD/sections/` truth and agent-readiness. Intake under `intake/` is evidence only. The ledger `GRAPH-RUN.md` and the README `## Preparation gate` and `## Autonomous metadata` sections are the driver's; do not edit them.

Check cross-cutting consistency by grep, not memory: re-run the brief's line-level grep for each amended or relied-on ID (REQ-177, REQ-185 through REQ-190, NFR-018) across `PRD/`, `apps/backend/src/eval/`, and `scripts/`, and confirm every hit has a disposition row and that each amendment the rows promise appears in a `GATE-QUESTIONS.md` diff. Confirm each diff's removed lines match the live file text exactly. Confirm REQ-222 through REQ-225, Q-007 and Q-008 are unused anywhere in `PRD/` outside this package. Re-run M16 (`measure/depth-pool.mjs`, changed in attempt 3) and M15 (`measure/migration-cards.mjs`) and spot-check at least one earlier one; no live model calls, no network refresh, never rebuild the rule index. Check the build slices are ordered so each one can be built and tested green on its own, and that every numeric acceptance target in a slice or proposed REQ traces to a recorded measurement, that the run-1 counts agree everywhere they appear in the package, and that each proposed slot is applied in a slice where its stated behavior is true in code (the brief's apply-order rule A21).

Blocker questions Q-007 and Q-008 are owner decisions; grade whether each is stated to the plain-language standard with a recommendation and a clear default, not what the answer should be.

Do not edit `PRD/sections/`, code, the brief, or `GATE-QUESTIONS.md`. Do not commit or push; the driver commits. Your tool-call cap is 60 for this node, and any subagent you dispatch spends from the same budget.

Report back: PASS or FAIL, the complete findings list with severity (none if PASS), the STATUS marker you set, and any file you wrote.

### define (attempt 4)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 3 (`define`) of graph run `graph-20261006-181340`, attempt 4, after a third `gate-qc` FAIL (loop 3 of 3 — the last one; a fourth FAIL parks the package for the owner). Run the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory above and follow its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write, including any subagent you dispatch. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Package: `PRD/work/rules-test-harness/` (STATUS.refining). Your prior output is committed. Read the README `## Preparation gate` section first; it is the authoritative list. Resolve its two findings and its first two advisory notes, and nothing else:

  1. (Minor finding) The 18 migrated cases ship as `approved`, which contradicts REQ-185's new constraint (`GATE-QUESTIONS.md:89`), REQ-224's criterion (`GATE-QUESTIONS.md:527`), and A19, which all say no agent sets `approved`. Add one consistent carve-out everywhere the absolute appears (for example: except the 18 first-ship cases, approved by the owner's accept of REQ-185), so the rule and the slice A migration agree.
  2. (Minor finding) The awaiting-re-freeze state (REQ-222's frozen-vector criterion, applied in slice E: a case whose query text no longer matches its frozen vector is reported as needing a re-freeze, skipped by the ratchet, and listed by the staleness report; the gate summary prints its count) has no owning slice or test. Name the slice that stores what is needed to detect the mismatch, detects it and skips ratchet scoring, and the slice whose staleness command reads that state; add a fixture test to the owning done-when(s), consistent with apply-order rule A21.
  3. (Advisory) Slice A's field migration (`workedSolution` to `expected.answer`, `expectedSupplementalRuleIds` to `expected.decidingRuleIds`) must name `scripts/eval-answer-quality.mjs` (it reads both fields; confirm the line numbers yourself) in slice A's delivers and done-when, and any other reader of those fields you find by grep across `scripts/` and `apps/backend/src/eval/`.
  4. (Advisory) State whether a stale approved case's last graded record counts in REQ-187's headline. Derive it from REQ-225's existing rule that a stale case leaves live scoring until re-approved; if that does not settle it, put it in `## Blocker questions` with a recommendation rather than choosing silently.

For each item, grep the whole package (brief, `GATE-QUESTIONS.md` diffs, README links, measurement script comments) at line level for every occurrence of the affected wording and fix each hit, so no stale copy survives in another file. After your edits, re-run your own consistency checks: every removed line in a `GATE-QUESTIONS.md` diff matches the live `PRD/sections/` text exactly, the M10 disposition grep still gives one row per hit, and the run-1 counts agree everywhere. Keep the plain-language block and verdict slot shape in every `GATE-QUESTIONS.md` block. Measurements, if any, follow the same rules as before: committed data only, no live model calls, no network refresh, never `npm run data:refresh`, never rebuild the rule index, never record a lexical-fallback measurement.

Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, or the README `## Preparation gate` and `## Autonomous metadata` sections. Do not commit or push; the driver commits. Apply the assumption ladder and genuine-blocker test from `PRD/instructions/preparation-contract.md` per question as each arises; product decisions go to the owner through `GATE-QUESTIONS.md`, never resolved silently. Your tool-call cap is 150 for this node, shared with any subagent you dispatch.

When done, set `STATUS.refined` (single marker, `git mv`), README frontmatter, and move the `PRD/work/STATUS.md` board row fully from refining to refined (remove from the old section, add to the new).

Report back: outcome, each item and what you changed for it (file and line), files changed, and the STATUS marker set.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Build the rules test harness backbone: a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and ~400 cases covering every real mechanic once plus ~120 hard interactions" | answered-once | shape | — |
| "Decisions already made — do not re-litigate" (intake `GRAPH-BRIEF.md`, owner decisions of 2026-10-06) | answered-once | define | — (the owner's stated decisions are input to refinement; each one that becomes product truth still gets its own `GATE-QUESTIONS.md` slot, per `## Intake is evidence, never authority`) |
