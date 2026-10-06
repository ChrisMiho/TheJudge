# Graph run — rules-test-harness

- Run ID: `graph-20261006-181340`
- Profile: `loaded (env sentinel)` (graph-preflight observation at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph tier `denied — armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/rules-test-harness` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness` (rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rules-test-harness` by the build half's claim)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261006-181340/`
- Current node: `gate-qc`
- Next action: `/graph-kickoff PRD/work/rules-test-harness/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/rules-test-harness` pushed (`git ls-remote --heads origin thejudge-auto/rules-test-harness` → `066fbbd`) from `.worktrees/kickoff-rules-test-harness`; launch checkout still on `main` (reflog: no switch); lock `.worktrees/.graph-run.lock` runId `graph-20261006-181340` pid 19738 | 2026-10-06 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/rules-test-harness/IDEA.md` (10 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging), `PRD/work/STATUS.md` ideation row | 2026-10-06 |
| 3 | define | opus | ok | `0 → 69` | `PRD/work/rules-test-harness/DESIGN-BRIEF.md` (13 measurements, 7 slices A–G, 220-row disposition table), `GATE-QUESTIONS.md` (amend REQ-185–190, NFR-018; new REQ-222–225; Blocker questions Q-007 joke-only list, Q-008 tier-3 count), `measure/` (3 scripts + `mechanics-result.json`), `STATUS.refined`; measured 258 mechanics in the committed rule index, gold deciding-rule hit 16/18 semantic | 2026-10-06 |

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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Build the rules test harness backbone: a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and ~400 cases covering every real mechanic once plus ~120 hard interactions" | answered-once | shape | — |
| "Decisions already made — do not re-litigate" (intake `GRAPH-BRIEF.md`, owner decisions of 2026-10-06) | answered-once | define | — (the owner's stated decisions are input to refinement; each one that becomes product truth still gets its own `GATE-QUESTIONS.md` slot, per `## Intake is evidence, never authority`) |
