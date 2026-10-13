# Graph-run brief — rule search stops hiding sub-rules the prompt never shows

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.
Measured 2026-10-07 on PR #276's head (`f98b8feb`); **kick off after PR #276 merges**,
since every number below includes its replacement-effects topic (REQ-220).

## What the player gets

A player who asks about a triggered ability's fine print — "does a 'becomes tapped'
trigger fire when the permanent enters tapped?", "does a prevented-damage trigger
still fire?" — gets an AI that can see the rule that answers it. Today the rule
search is barred from ever showing 41 trigger, target, priority and zone sub-rules
(603.2a–h and friends) on every card-lookup question, because a curated always-on
rules topic lists their parent rule. The topic only prints the parent's one
sentence, so those sub-rules reach the AI by no route at all. After this change the
search treats them like any other rule: they appear when they are relevant, and
nothing that reaches the prompt today is lost.

## Why (measured — do not re-derive)

**The defect.** REQ-179 excludes a System 3 candidate (System 3 = the up-to-ten scored
rule excerpts) when its id **or any parent id** is in the curated System 2 set
(`apps/backend/src/gameRulesRetrieval.ts:701–708` hybrid, `:736–743` lexical:
`excludeRuleIds.has(entry.ruleId) || entry.parentRuleIds.some((parentId) => excludeRuleIds.has(parentId))`).
The premise was that a curated topic carries its parent's sub-rules. It doesn't: an
audit of all 24 topics in `apps/backend/data/gameRulesByTopic.json` found every
excerpt carries **exactly** its listed `ruleNumbers` — 0 listed rules missing their
text, 0 extra rules carried. The always-on topic `abilities-trigger-basics` lists
603.1, 603.2, 603.3 in 926 characters of parent sentences only.

**What it blocks.** 41 sub-rules on every lookup prompt (603.1a–b, 603.2a–h,
603.3a–d, 117.1a–d, 117.3a–d, 115.1a–e, 115.10a–b, 400.7a–m); 127 across all 24 topics
in game mode.

**Is anything genuinely missing from the prompt?** Of the 99 rules-test cases (392
approved) whose deciding rule never reaches the prompt, a case-by-case read found
the knowledge already present in 97 — almost all via the verbatim official ruling the
case was written from. Of the two real gaps, one is this defect:
`triggers-becomes-tapped-not-entering-tapped` — only 603.2e says "An ability that
triggers when a permanent 'becomes tapped' or 'becomes untapped' doesn't trigger if
the permanent enters the battlefield in that state." With exact-only exclusion 603.2e
ranks **#1** there, and 603.2g ranks **#1** in `triggers-damage-prevented-no-trigger`.

**The fix, simulated through the real rules gate and every suite** (exact-only
exclusion, applied in lookup and game mode):

| Measure | Today | Exact-only exclusion |
|---|---|---|
| Rules-test cases with every deciding rule in the prompt (of 392) | 293 | **295** |
| Cases closed | — | `triggers-becomes-tapped-not-entering-tapped`, `triggers-damage-prevented-no-trigger` |
| Recorded rules lost (gate regressions) | — | **0** |
| Cases whose System 3 picks change | — | 58 (76 picks displaced, none a deciding rule) |
| `eval:worked-solutions` (every deciding rule a System 3 pick) | 287 | 289 |
| First-ship assertion (16 of 18) | 16 | 16 (same two misses) |
| Context-eval labelled checks, lexical / semantic | 14 / 14 | 14 / 14 |
| Prompt goldens that change (of 31) | — | 3 |
| Retrieval benchmark | — | cannot move (both scorers pass an empty exclusion set) |
| Prompt size change (whole prompt) | p50 14,306 | p50 0, p95 +79, max +465, mean −30 chars |

Rules entering System 3 across the corpus: 603.2c ×15, 603.2e ×14, 400.7f ×9, 115.1a ×8,
603.2a ×5, 117.1a ×5, 400.7k ×4, 603.2d ×4, 603.2g ×3, 603.2f ×2, and singles of 603.2h,
400.7i, 400.7b, 115.1b, 117.1b, 400.7e, 117.3a. In game mode the harness's
`combat-deathtouch` fixture gains 510.1a/c/d — the combat-damage sub-rules the
always-selected stem 510.1 announces — and `counterspell-stack` / `upkeep-trigger` gain
603.3b; every check still passes.

## Decisions already made — do not re-litigate

- Build **exact-only exclusion** (exclude exactly the rule numbers a selected curated
  topic lists). The alternative — exclude exactly the rules whose text the excerpt
  carries — is identical on today's data; keep it honest with a build test instead.
- **Not in scope: a keyword → defining-rule lookup.** Measured and rejected: in 62 of
  the 63 keyword-gap cases the verbatim source ruling already answers the question, so
  it would raise the gate count without adding knowledge.
- **Not in scope: expanding colon-ending "stem" picks** (514.3 "…subject to the
  following exception:" → 514.3a). Measured: fires on 0.8% of corpus prompts, closes 0
  cases, touches six files; the tester's actual Silence + Necropotence question already
  has 514.3a (#3) and 514.2 (#7) in its prompt today. Recorded as a follow-up.
- **Not in scope: corpus label hygiene** (about 15 cases tag a weak or wrong deciding
  rule, e.g. mechanic cases tagged with the keyword's `a` header sub-rule). Separate work.
- No raise of the System 3 cap; no new curated topic; no live model call.

## Design direction (converged)

- In `gameRulesRetrieval.ts`, both branches: drop the `parentRuleIds.some(...)` clause so
  only exact curated ids are excluded; rewrite the REQ-179 comments.
- Mirror it in the offline instrument `scripts/lib/evidence-trace.mjs:49–54`
  (`skippedForCuratedTopic`), or the evidence trace reports wrongly; update its tests
  (`scripts/lib/evidence-trace.test.mjs:104, 109, 143–148`).
- Flip the prefix-exclusion assertions in `apps/backend/src/gameRulesRetrieval.test.ts:230`
  and `:973`. `preparation.test.ts:144` (616.1 listed exactly) is unaffected.
- Add a build-time guard (e.g. in `scripts/build-game-rules.test.mjs` or a backend data
  test): every topic excerpt carries exactly the full text of its listed rules and no
  other rule's full text — so if a topic ever carries sub-rule text, exclusion is
  revisited rather than silently duplicating.
- Regenerate the 3 changed prompt goldens (`commander-spellbook-lookup-attached-intent`:
  614.10a out / 115.1b in; `commander-spellbook-wrong-zone`: 500.10a out / 117.3a in;
  `upkeep-trigger`: 609.7a out / 603.3b in) and update `upkeep-trigger.fixture.json`'s
  description, which says 603.3b was hand-dropped because of REQ-179.
- Raise the rules-gate baseline with `npm run eval:rules-gate:baseline` **without**
  `--allow-regressions` (adds 603.2e and 603.2g as hits).

## Current-state PRD truth to amend

All in `PRD/sections/` (line numbers measured on PR #276's branch; re-grep after merge):
- `functional-requirements.md` **REQ-179** (`:4218`; description `:4221` "matches by
  rule-number prefix rather than exact id, so a curated parent rule no longer lets its own
  lettered sub-rules reappear"; acceptance `:4226` "excludes a candidate rule when its id or
  any of its parent rule ids is already selected") — the core amendment.
- REQ-022 bullet `:378` ("deduplicated … by rule-number prefix, so a curated parent rule
  also excludes its lettered sub-rules — REQ-179").
- REQ-181 `:4280` and REQ-182 `:4320` ("deduplicated against the curated System 2 selection
  by rule-number prefix (REQ-179)").
- REQ-190 constraint `:4580` (names "the System 2 deduplication (REQ-179)") — check wording.
- REQ-220 note `:5816` ("listing 616.1 bars System 3 from every 616.1 sub-rule") —
  rationale only; that topic lists 616.1a–g explicitly, so behaviour is unchanged.
- `integrations-and-data.md:364` ("deduplicated by rule-number prefix").
- `system-map/game-rules-retrieval.md:42–44`, `:106–108` ("that rule ID and its lettered
  sub-rules are excluded").
Amend REQ-179 in place; no new DEC (the decision log is retired). Enumerate the amendment
set with one line-level grep for "prefix" / "sub-rules" / "REQ-179" over `PRD/sections/`.

## Constraints (don't rediscover)

- Offline only: committed data, frozen query vectors; no network, no live model call.
- The mock/lexical path must keep working (both branches change the same way).
- The corpus has 0 In-Depth (game-mode) cases; game-mode evidence is the 17 harness game
  fixtures — run the context-evaluation harness, not just the rules gate.
- PR #273 (data refresh, new Comprehensive Rules text) is open; if it merges first,
  re-measure the numbers above on the new rule index before committing.
- The `stack-and-priority` always-on topic prints "117.3 …determined by the following
  rules:" with nothing after it; this change lets 117.3a–d compete in System 3 but does
  not add them to the topic (that would cost 884 characters per prompt — a follow-up, not
  this package).

## Evidence + reusable tooling

`PRD/work/probe-keyword-rule-retrieval/` (untracked, launch checkout): `PROBE.md`,
`FINDINGS-missing.md` (63 keyword cases), `FINDINGS-missing-nonkeyword.md` (37 non-keyword
cases), `FINDINGS-fix-simulation.md` (keyword lookup, rejected), `FINDINGS-two-fixes.md`
(this fix and stem expansion), and the scripts `measure-two-fixes.mjs` (re-runnable: `cd`
into a checkout with `node_modules` and `apps/backend/data/models/`, then
`npx tsx <abs path>/measure-two-fixes.mjs` after pointing its ROOT at that checkout).

## What the graph run should produce

A DESIGN-BRIEF for exact-only curated exclusion; a `GATE-QUESTIONS.md` amending REQ-179 in
place plus the dependent lines above; one or two slices — the retrieval change with its
tests, goldens, evidence-trace mirror and topic-excerpt guard, then the baseline raise and
a re-measure of every suite against the table above (295 complete, 0 regressions, 289,
16/18, 14/14, 3 goldens). Keyword lookup, stem expansion and corpus label hygiene are
already decided out of scope.

## How to hand this off

/graph-kickoff "Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179)" PRD/work/probe-keyword-rule-retrieval/GRAPH-BRIEF.md
