# Design brief — exact curated rule exclusion

**What this is:** the define-node proposal for graph run `graph-20261008-053030`.
The owner decides five verdict slots in `GATE-QUESTIONS.md`; this brief holds the
evidence, the decisions behind them, and the line-level amendment set.

## What the player gets

A player asks a triggered ability's fine print: "does a 'becomes tapped' trigger
fire when the permanent enters tapped?" Today the AI never sees the rule that
answers it. That rule is 603.2e. The always-on curated topic "triggered-ability
basics" lists rule 603.2, but prints only 603.2's one sentence. The rule search
(System 3, the up-to-ten scored rule excerpts) is barred from every 603.2
sub-rule because the curated topic lists the parent. So 603.2e reaches the AI by
no route at all.

After this change the rule search skips only the exact rule numbers a curated
topic lists. Sub-rules the topic does not print compete like any other rule. On
the measured corpus, 603.2e ranks first for that question, and nothing that
reaches the prompt today is lost.

## Terms

- **System 2 (curated baseline):** fixed rules topics picked by game state (and
  one card-wording switch, REQ-220), printed under `GAME RULES (reference)`.
- **System 3 (rule search):** up to ten scored rule excerpts printed under
  `ADDITIONAL RELEVANT RULE EXCERPTS`.
- **Curated exclusion:** System 3 drops any candidate rule the selected System 2
  topics already carry, so no rule prints twice (REQ-179).
- **Prefix exclusion (today):** a candidate is dropped when its id *or any parent
  rule id* is a listed curated rule number. A listed 603.2 drops 603.2a–h.
- **Exact exclusion (proposed):** a candidate is dropped only when its own id is
  a listed curated rule number.

## Scope

In scope:

1. System 3 curated exclusion becomes exact-id only, on the hybrid path and the
   lexical path (mock/offline default and embedding-failure fallback), in lookup
   and game mode.
2. The offline evidence trace (REQ-229) mirrors the same rule, so its
   "skipped for curated topic" report stays true.
3. A data test that every curated topic's excerpt carries exactly the full text
   of its listed rules and no other rule's full text — the condition that makes
   exact exclusion safe.
4. Reviewed regeneration of the prompt goldens that change, and the rules-gate
   baseline raise without `--allow-regressions`.
5. Applying the approved `PRD/sections/` truth at build (the slots in
   `GATE-QUESTIONS.md`).

Non-goals (decided here; the owner rules on them in the REQ-179 slot):

- No keyword → defining-rule lookup.
- No expansion of colon-ending stem rules (a rule ending "…the following
  rules:") into their sub-rules.
- No rules-corpus label hygiene.
- No raise of the System 3 cap (stays ten, REQ-190).
- No new curated topic, and no change to any existing topic's contents —
  including `stack-and-priority`, whose 117.3 ends "determined by the following
  rules:" with nothing after it (recorded follow-up).
- No live model call; offline only. No change to the exact-rule-id /
  parent-rule-id ranking boost (REQ-181, REQ-182) — that boost raises a cited
  rule, it never excludes one.

## Decisions and material assumptions

Each was resolved by the assumption ladder in
`PRD/instructions/preparation-contract.md` at the moment it arose. None meets the
three-condition genuine-blocker test.

| # | Decision | Ladder rung and evidence |
| --- | --- | --- |
| D1 | Exclude exactly the rule numbers a selected topic **lists**, not "the rules whose text the excerpt carries". | Rung 4 (smallest reversible scope): the listed numbers are already the exclusion set's input (REQ-220 acceptance: "the topic's rule numbers join the curated exclusion set"; `system-map/game-rules-retrieval.md` Data flow: "Those curated rule IDs become the exclusion set"). Intake reports the two rules select the same set on today's data; the D3 data test keeps them equal. Owner rules on it in the REQ-179 slot. |
| D2 | Apply to both scoring paths and both modes through the one shared retrieval path. | Rung 1: REQ-178 "one shared retrieval path (no second implementation)"; REQ-181 "lexical … never worse than the prior lexical-only behaviour". |
| D3 | Add a data test that each topic carries exactly its listed rules. | Rung 1: REQ-022 "excerpts are verbatim WotC CR prose for rule numbers listed in `gameRulesTopicManifest.json`" is the invariant exact exclusion depends on; today nothing tests it. Rung 3: REQ-179 already guards its hygiene properties with a build test. |
| D4 | The evidence trace mirrors the exclusion. | Rung 1: REQ-229 reports "whether System 3 skipped it because a curated System 2 topic already carries it"; leaving the prefix rule in the trace would report sub-rules as skipped that production now ranks. REQ-229's wording needs no change — exact exclusion makes it literally true. |
| D5 | Raise the rules-gate baseline without `--allow-regressions`. | Rung 3: REQ-220 and REQ-222 established this pattern ("raised in the same change … without `--allow-regressions`"). |
| D6 | Changed goldens are regenerated as reviewed, intentional consequences. | Rung 1: REQ-179 "any golden prompt change is an intentional, reviewed consequence … never a silent update"; `technical-design-rules.md` "update eval goldens only for intentional behavior changes". |
| D7 | Keep REQ-179's title and amend it in place; add no new stable id and no DEC. | Rung 1: `requirement-format.md` "Decisions (retired)"; dispatch instruction. |
| D8 | Amend REQ-220's rationale note, which states "listing 616.1 bars System 3 from every 616.1 sub-rule". | Rung 1: current-state truth must not describe a mechanism that no longer exists. Behaviour is unchanged for that topic: it lists 616.1a–g explicitly (REQ-220 acceptance). |
| D9 | Leave dated acceptance records of shipped requirements unchanged (REQ-220's "287 of 392 … none of the 31 fixtures' goldens changes", REQ-222's "6 have a topic-carried deciding rule", REQ-180's "values recorded after REQ-179"). | Rung 5: each is a measurement dated to its own build, not a live claim; amending them would rewrite history. |
| D10 | Lexical first-ship count is recorded at build, not targeted. | Quantitative-target rule: the intake measured the hybrid 16/18 only; no lexical after-value was measured, so none is set. |

## Product truth proposed

All in `GATE-QUESTIONS.md`, one slot per stable id. Amend in place; no new ids.

| Stable id | Change |
| --- | --- |
| REQ-179 | Core amendment: exact-id exclusion, the topic-carries-exactly data test, the evidence-trace mirror, the two closing cases, the baseline raise, the measured targets, the out-of-scope record. Also carries the dependent current-state lines in `system-map.md`, `system-map/game-rules-retrieval.md`, `integrations-and-data.md`, `in-depth/README.md`, `quick-lookup/README.md` — each cites REQ-179 for this mechanism. |
| REQ-022 | Its System 3 dedup bullet and its REQ-179 dependency label stop saying "prefix". |
| REQ-181 | Its "deduplicated … by rule-number prefix (REQ-179)" criterion says "exact rule number". |
| REQ-182 | Same wording change as REQ-181. |
| REQ-220 | Its REQ-179 dependency label and its rationale note stop describing prefix exclusion. |

## Amendment set (line level)

Greps run in this worktree over `PRD/sections/` at `d9b0090a`:

1. Driver grep: `grep -rnE 'REQ-179|rule-number prefix|lettered sub-rules|sub-rules are excluded|parent rule ids?' PRD/sections/` — 28 hits, matching the driver's list.
2. Case-insensitive variant adding `parent rule[- ]ids?` and `by prefix`: added `system-map/game-rules-retrieval.md:32`, `:75`, `quick-lookup/README.md:345`, `functional-requirements.md:5997`, `:6021`.
3. `grep -rniE 'prefix'`: added only non-retrieval hits (`functional-requirements.md:2165`, `:3276`, `:3288`, `:3295`, `:4116`, `:4660`, `quick-lookup/README.md:333`) plus `:4238`, `:4279` (embedding-text shaping).
4. `grep -rniE 'sub-rule'`: added `functional-requirements.md:5816`, `system-map/game-rules-retrieval.md:44`.
5. `grep -rniE 'parent[- ]rule'`: added the ranking-boost lines `functional-requirements.md:383`, `:4277`, `:4291`, `:4312`, `:4333`.
6. `grep -rniE 'dedup|curated exclusion|exclusion set|curated topic'`: added `functional-requirements.md:5996` (REQ-229), `system-map/game-rules-retrieval.md:69`, `:124`, `in-depth/README.md:486`; the rest are unrelated (card dedupe, combo dedupe, retired DEC index rows, topic selection).

| # | File:line | Under | Says today | Disposition |
| --- | --- | --- | --- | --- |
| 1 | `system-map.md:88` | System 3 entry (REQ-179) | "Deduplicated against the System 2 selection by rule-number prefix." | **amend** (REQ-179 slot) |
| 2 | `system-map.md:90` | System 3 entry | Backed-by list incl. REQ-179 | no change — pointer only |
| 3 | `integrations-and-data.md:272` | REQ-179 hygiene | TOC / heading-only exclusion | no change — hygiene half, unaffected |
| 4 | `integrations-and-data.md:364` | REQ-179 | "deduplicated by rule-number prefix against selected System 2 baseline rule numbers" | **amend** (REQ-179 slot) |
| 5 | `system-map/game-rules-retrieval.md:2` | page header | Backed-by list | no change — pointer only |
| 6 | `system-map/game-rules-retrieval.md:32` | ranking | "exact rule-ID and parent rule-ID boost" | no change — ranking boost, not exclusion |
| 7 | `system-map/game-rules-retrieval.md:43` | REQ-179 | "by rule-number prefix, so a curated parent rule also excludes its lettered" | **amend** (REQ-179 slot) |
| 8 | `system-map/game-rules-retrieval.md:44` | REQ-179 | "sub-rules — and the prompt does not print the same rule in both" | **amend** (same sentence as #7) |
| 9 | `system-map/game-rules-retrieval.md:59` | REQ-179 hygiene | "duplicate or a bare heading (REQ-179)" | no change — hygiene half |
| 10 | `system-map/game-rules-retrieval.md:69` | Data flow | "Those curated rule IDs become the exclusion set for System 3" | no change — true under exact exclusion |
| 11 | `system-map/game-rules-retrieval.md:75` | Data flow (REQ-179) | "drops entries whose rule IDs or parent rule IDs are already in the System 2 set" | **amend** (REQ-179 slot) |
| 12 | `system-map/game-rules-retrieval.md:107` | Worked example (REQ-179) | "that rule ID and its lettered sub-rules are excluded from System 3" | **amend** (REQ-179 slot) |
| 13 | `system-map/game-rules-retrieval.md:124` | Invariants | "System 3 is deduplicated against the System 2 selection, so the same rule ID never appears once as curated baseline and again as supplemental retrieval" | **amend** — true, but add that exact dedup rests on the topic-carries-exactly invariant the new data test holds (REQ-179 slot) |
| 14 | `in-depth/README.md:24` | Backed-by | list incl. REQ-179 | no change — pointer only |
| 15 | `in-depth/README.md:391` | Prompt assembly (REQ-179) | "deduplicated against the System 2 selection by rule-number prefix (REQ-179) —" | **amend** (REQ-179 slot) |
| 16 | `in-depth/README.md:393` | Prompt assembly | citation list incl. REQ-179 | no change — pointer only |
| 17 | `in-depth/README.md:486` | Measured bounds | "Supplemental rules: up to 10 excerpts (System 3), deduplicated against System 2." | no change — true under exact exclusion |
| 18 | `quick-lookup/README.md:15` | Backed-by | list incl. REQ-179 | no change — pointer only |
| 19 | `quick-lookup/README.md:276` | Retrieval (REQ-179) | "…stripped (REQ-179), excluding by" | **amend** (REQ-179 slot) |
| 20 | `quick-lookup/README.md:277` | Retrieval (REQ-179) | "rule-number prefix the curated rule numbers the selected curated topics already" | **amend** (same sentence as #19) |
| 21 | `quick-lookup/README.md:287` | Retrieval | citation list incl. REQ-179 | no change — pointer only |
| 22 | `quick-lookup/README.md:345` | Measured bounds | "curated core-topic rule numbers excluded by prefix" | **amend** (REQ-179 slot) |
| 23 | `functional-requirements.md:378` | REQ-022 | "by rule-number prefix, so a curated parent rule also excludes its lettered sub-rules — REQ-179" | **amend** (REQ-022 slot) |
| 24 | `functional-requirements.md:383` | REQ-022 | "exact-rule-id and parent-rule-id boost merged into the blended score" | no change — ranking boost |
| 25 | `functional-requirements.md:396` | REQ-022 Dependencies | "REQ-179 (rule-index hygiene and prefix-based curated exclusion)" | **amend** (REQ-022 slot) |
| 26 | `functional-requirements.md:4190` | REQ-177 Notes | RAG gameplan step list | no change — historical plan reference |
| 27 | `functional-requirements.md:4218` | REQ-179 heading | `### REQ-179` | no change — id and title kept (D7) |
| 28 | `functional-requirements.md:4221` | REQ-179 Description | "matches by rule-number prefix rather than exact id, so a curated parent rule no longer lets its own lettered sub-rules reappear" | **amend** (REQ-179 slot) |
| 29 | `functional-requirements.md:4226` | REQ-179 Acceptance | "excludes a candidate rule when its id or any of its parent rule ids is already selected" | **amend** (REQ-179 slot) |
| 30 | `functional-requirements.md:4238` | REQ-179 Notes | embedding-text chunking belongs to REQ-181 | no change — about what is embedded, not excluded |
| 31 | `functional-requirements.md:4249` | REQ-180 Acceptance | "do not regress below the values recorded after REQ-179" | no change — dated benchmark reference; benchmark cannot move (D9) |
| 32 | `functional-requirements.md:4277` | REQ-181 | exact-rule-id and parent-rule-id boost | no change — ranking boost |
| 33 | `functional-requirements.md:4279` | REQ-181 | embedding text measured vs sub-rule folding | no change — embedding text |
| 34 | `functional-requirements.md:4280` | REQ-181 Acceptance | "still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)" | **amend** (REQ-181 slot) |
| 35 | `functional-requirements.md:4291` | REQ-181 Constraints | lexical supplies the parent-rule-id boost | no change — ranking boost |
| 36 | `functional-requirements.md:4295` | REQ-181 Dependencies | "REQ-179 (the cleaned corpus this embeds)" | no change — hygiene half |
| 37 | `functional-requirements.md:4312` | REQ-182 Acceptance | parent-rule-id boost in the blend | no change — ranking boost |
| 38 | `functional-requirements.md:4320` | REQ-182 Acceptance | "still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)" | **amend** (REQ-182 slot) |
| 39 | `functional-requirements.md:4333` | REQ-182 Notes | cross-reference boost decision | no change — ranking boost |
| 40 | `functional-requirements.md:4580` | REQ-190 Constraints | "or the System 2 deduplication (REQ-179)" | no change — names the mechanism generically; still accurate |
| 41 | `functional-requirements.md:5797` | REQ-220 Acceptance | "the topic's rule numbers join the curated exclusion set, so System 3 never repeats them (REQ-179)" | no change — true under exact exclusion; the topic lists every rule it prints |
| 42 | `functional-requirements.md:5810` | REQ-220 Dependencies | "REQ-179 (prefix-based curated exclusion)" | **amend** (REQ-220 slot) |
| 43 | `functional-requirements.md:5816` | REQ-220 Notes | "listing 616.1 bars System 3 from every 616.1 sub-rule" | **amend** (REQ-220 slot, D8) |
| 44 | `functional-requirements.md:5996` | REQ-229 Acceptance | "whether System 3 skipped it because a curated System 2 topic already carries it" | no change — exact exclusion makes it literally true (D4) |
| 45 | `functional-requirements.md:5997` | REQ-229 Acceptance | reports each deciding rule's parent and lettered subrules | no change — trace reporting, not exclusion |
| 46 | `functional-requirements.md:6021` | REQ-230 Acceptance | experiment arm C's deciding-rule bundle | no change — experiment arm, not exclusion |

Disposition counts: **46 rows — 19 amend, 27 no change.** The 19 amend rows land
as 17 replacement diffs (rows 7–8 and 19–20 are one sentence each):

- REQ-179 slot, 11: its own Description and acceptance bullet (rows 28, 29),
  plus nine dependent lines — `system-map/game-rules-retrieval.md` ×4 (rows
  7–8, 11, 12, 13), `system-map.md` ×1 (row 1), `integrations-and-data.md` ×1
  (row 4), `in-depth/README.md` ×1 (row 15), `quick-lookup/README.md` ×2 (rows
  19–20, 22). The slot also adds new acceptance, constraint, dependency and
  note bullets to REQ-179.
- REQ-022 slot, 2 (rows 23, 25). REQ-181 slot, 1 (row 34). REQ-182 slot, 1
  (row 38). REQ-220 slot, 2 (rows 42, 43).

Every removed line in `GATE-QUESTIONS.md` was checked verbatim against
`PRD/sections/` (27 of 27 lines found).

## Acceptance targets and where each number comes from

Structural gates (no number to drift):

- 603.2e is a System 3 excerpt in the prompt for
  `triggers-becomes-tapped-not-entering-tapped`; 603.2g for
  `triggers-damage-prevented-no-trigger`.
- The rules gate passes with zero regressions; the baseline is raised without
  `--allow-regressions`.
- The topic-carries-exactly data test passes on the committed data.
- `npm run quality:check` green.

Measured targets — taken from the intake's measurement on commit `f98b8feb`
(2026-10-07, offline, committed frozen query vectors, local embedder for hybrid;
exact-only exclusion simulated through the real rules gate and every suite).
`f98b8feb`'s content is current `origin/main` (`5a65c91d`, the merge of PR #276),
so they apply to the build base unchanged. These are adopted from intake and go
to the owner at the gate in the REQ-179 slot; refinement did not re-measure.

| Measure | Before | Target |
| --- | --- | --- |
| Rules test cases with every deciding rule in the prompt, System 3 or curated topic (of 392) | 293 | 295 |
| `npm run eval:worked-solutions` (every deciding rule a System 3 pick) | 287 | 289 |
| First-ship cases, hybrid (of 18) | 16 | 16 (same two misses) |
| Context-eval labelled System 3 checks, semantic / lexical | 14 / 14 | 14 / 14 |
| Prompt goldens that change (of 31) | — | exactly 3: `commander-spellbook-lookup-attached-intent` (614.10a out / 115.1b in), `commander-spellbook-wrong-zone` (500.10a out / 117.3a in), `upkeep-trigger` (609.7a out / 603.3b in) |
| Retrieval benchmark recall@5 | 0.5833 / 0.5769 lexical, 0.8974 / 0.8910 hybrid (REQ-220 record) | unchanged — both scorers pass an empty exclusion set |
| Whole-prompt size | median 14,306 | recorded, not gated: median 0, p95 +79, max +465, mean −30 characters |

Before-values 287, 16/18 and 14/14 match the current PRD record (REQ-220 build
notes, 2026-10-07). 293 is not in the PRD; it is intake-measured.

**Build-time condition — PR #273.** PR #273 (data refresh, new Comprehensive
Rules text) is open. If it merges into `main` before this build, the build
re-measures every number above, the 41 / 127 blocked-sub-rule counts, the two
closing cases and the changed-golden list on the refreshed rule index before
committing, and records those values in REQ-179's note in place of the
`f98b8feb` values. The structural gates above stay the gate either way. If the
re-measure shows a recorded rule lost, the build stops and reports rather than
passing `--allow-regressions`.

## Build outline (for map-out)

Code locations are as the intake cites them; refinement did not open them. Map-out
confirms.

**Slice A — exact exclusion, its tests, and the truth.**

- `apps/backend/src/gameRulesRetrieval.ts`: both exclusion branches (hybrid,
  lexical) drop the parent-id clause; rewrite the REQ-179 comments.
- `apps/backend/src/gameRulesRetrieval.test.ts`: flip the prefix-exclusion
  assertions to exact-exclusion assertions (a listed parent's unlisted sub-rule is
  rankable; a listed id is still excluded), on both paths.
- `scripts/lib/evidence-trace.mjs` (`skippedForCuratedTopic`) and its test: same
  exact rule.
- New data test (in `scripts/build-game-rules.test.mjs` or a backend data test):
  every topic carries exactly the full text of its listed rules and no other
  rule's full text from `gameRulesRuleIndex.json`.
- Regenerate exactly the three named prompt goldens; update
  `upkeep-trigger.fixture.json`'s description, which says 603.3b was dropped
  because of REQ-179.
- Apply the accepted `GATE-QUESTIONS.md` diffs to `PRD/sections/`.

**Slice B — baseline raise and re-measure.**

- `npm run eval:rules-gate:baseline` without `--allow-regressions`.
- Re-run every suite in the target table and record the values in REQ-179's
  note (and the receipt); confirm the two closing cases.

Verification commands: `npm run quality:check`, `npm run test:scripts`,
`npm --workspace apps/backend run test`, `npm run eval:worked-solutions`
(and with `EMBEDDING_PROVIDER=mock`), `npm run eval:rules-gate:baseline`,
`npm run benchmark:rag-retrieval` (and `-- --semantic`), the context-evaluation
harness under both providers, `npm run eval:evidence-trace -- --case
triggers-becomes-tapped-not-entering-tapped --case
triggers-damage-prevented-no-trigger`.

## Risks

- **A topic silently gains sub-rule text.** Then exact exclusion would print that
  rule twice. The data test fails first; that is its job.
- **Displaced System 3 picks.** 76 picks move in 58 cases (intake). None was a
  deciding rule, and the rules gate's zero-regression check holds that at build.
- **Numbers drift on a data refresh.** Covered by the PR #273 condition.

## Evidence cited (not opened)

- `PRD/work/exact-curated-rule-exclusion/intake/GRAPH-BRIEF.md` — the intake (read; evidence only).
- `PRD/work/probe-keyword-rule-retrieval/` in the launch checkout (untracked) — the
  probe the intake's numbers come from: `PROBE.md`, `FINDINGS-missing.md`,
  `FINDINGS-missing-nonkeyword.md`, `FINDINGS-fix-simulation.md`,
  `FINDINGS-two-fixes.md`, `measure-two-fixes.mjs`. Path recorded only.
- Code and test paths named in the build outline — cited by the intake, not opened.
- Prior runs on this ground: listed in `IDEA.md` `## Prior run`.

## Blockers

None. Every question resolved on the ladder; see `GATE-QUESTIONS.md`
`## Blocker questions`.
