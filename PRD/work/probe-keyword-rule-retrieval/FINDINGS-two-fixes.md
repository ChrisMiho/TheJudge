# Probe D — simulating the two fixes over the corpus and every suite (2026-10-07)

Evidence for a kickoff. Not product truth. Run offline on PR #276 head `f98b8feb`
(`.worktrees/implement-niche-interaction-rule-tests`), read and run only. Written by the
probe driver from Probe D's returned report; spot-checked against
`measure-two-fixes.out.txt` (gate lines 53–84, verbatim tester lines 368–380).

## Short version

- **Fix 1 (curated exclusion precision, F1a exact-only):** trigger, target, priority and
  zone sub-rules come back into the rule search (603.2e "a 'becomes tapped' trigger
  doesn't fire when a permanent enters tapped"). Closes 2 gap cases
  (`triggers-becomes-tapped-not-entering-tapped` 603.2e, `triggers-damage-prevented-no-trigger`
  603.2g); 293 → 295 complete; **0 regressions**; 58 cases' System 3 picks change, 76
  picks pushed out, none a deciding rule; `eval:worked-solutions` 287 → 289; first-ship
  16/18 unchanged; harness labelled checks 14/14 both; 3 of 31 prompt goldens change;
  benchmark cannot move (both scorers pass an empty exclusion set). Cost: p50 0, p95
  +79, max +465, mean −30 characters. F1b (exclude the text the excerpt carries) is
  identical on today's data: every topic excerpt carries exactly its listed rules.
- **Fix 2 (stem expansion, F2a fill):** when System 3 picks a rule ending "…the following
  exception:", print its lettered sub-rules beside it. Fires on 3 of 392 corpus prompts
  (0.8%) and 2.6–2.9% of realistic lexical queries (always 727.1, +127 characters).
  Closes **0** cases: it puts 514.3a into the *corpus* Necropotence prompt, but that case
  also needs 514.2 (#29). **The tester's verbatim question already has 514.3a (#3) and
  514.2 (#7) in its prompt today**, hybrid and lexical, both card orders. Touches six
  files for that. Worst case if ever picked: 704.5 → +5,223 (never picked in any sample).
- **Together:** 295 complete, 0 regressions, p95 +99, max +2,175, 3 goldens change.

**Driver's reading:** Fix 1 is a real defect with a clean fix. Fix 2 does not change
what the tester's actual prompt knows; the Silence answer failure happened with the
deciding rules present.

## Method (abridged — full detail in `measure-two-fixes.mjs` and its output)

- F1 patched without code edits: index entries copied with a `parentRuleIds` whose
  `.some` is overridden (only the REQ-179 exclusion test calls it,
  `gameRulesRetrieval.ts:705`, `:740`); the real `evaluateRulesGate` and
  `preparePromptInput` run on it; a delegating control was byte-identical to base on all
  392 prompts and gate results.
- F1b: every topic in `gameRulesByTopic.json` audited — listed rules all carried in full,
  no excerpt carries another rule's full text.
- F2: built from real System 3 picks, laid out with production
  `formatSupplementalRulesSection`, swapped into the real prompt (swap point checked to
  occur once); real `checkCards` / `checkStateFacts` run; ratchet re-applied and checked
  equal to the real gate for base and F1.
- Harness reproduced as its test builds it; base parity 31/31 goldens and the checklist
  golden byte for byte. Benchmark: production `scoreBenchmark` (lexical); hybrid not
  re-run (would embed 312 queries) — unchanged by construction.
- Necropotence verbatim question embedded with the local MiniLM model
  (`allowRemoteModels=false`).
- Coverage gap: the corpus has 0 In-Depth (game-mode) cases; game-mode evidence is the 17
  harness game fixtures.

## Tables

### What the curated topics carry

| Check | Result |
|---|---|
| Listed rule numbers whose full text the excerpt does not carry | 0 |
| Rules carried beyond a topic's `ruleNumbers` | 0 (F1b = F1a) |
| Sub-rules blocked by prefix on every lookup prompt (always-on topics) | 41 (603.1a–b, 603.2a–h, 603.3a–d, 117.1a–d, 117.3a–d, 115.1a–e, 115.10a–b, 400.7a–m) |
| Sub-rules blocked by prefix across all 24 topics (game mode) | 127 |
| Topics carrying a colon stem without its sub-rules | `stack-and-priority` (always-on): 117.3 without 117.3a–d (884 chars); `combat-damage-assignment`: 510.1 without 510.1a–e (2,125); `abilities-delayed-triggers`: 603.10 without 603.10a–g (1,235) |

### Rules gate per variant

| | base | F1 | F2a | F2b | F1+F2a |
|---|---|---|---|---|---|
| Complete cases (of 392) | 293 | **295** | 293 | 293 | **295** |
| becomes-tapped (603.2e) closed | — | yes | no | no | yes |
| damage-prevented (603.2g) closed | — | yes | no | no | yes |
| Necropotence corpus wording | 514.3a out | out | 514.3a in, 514.2 out | in, 514.2 out | in, 514.2 out |
| Regressions | 0 | 0 | 0 | 0 | 0 |
| `eval:worked-solutions` (base 287) | 287 | 289 | 287 | 287 | 289 |
| First-ship 16 of 18 | 16 | 16 | 16 | 16 | 16 |

### System 3 selection changes

| | Cases changed | Picks pushed out | Deciding rules pushed out |
|---|---|---|---|
| F1 | 58 | 76 | 0 |
| F2a | 0 | 0 | 0 |
| F2b | 2 | 2 (306.1, 605.1) | 0 |

Rules entering System 3 under F1: 603.2c ×15, 603.2e ×14, 400.7f ×9, 115.1a ×8, 603.2a ×5,
117.1a ×5, 400.7k ×4, 603.2d ×4, 603.2g ×3, 603.2f ×2, one each of 603.2h, 400.7i, 400.7b,
115.1b, 117.1b, 400.7e, 117.3a. Weakest entrants: 115.1a (targets), 117.1a (priority).

### Prompt cost (whole prompt vs base, 392 cases)

| | min | p50 | p95 | p99 | max | mean | Prompts changed |
|---|---|---|---|---|---|---|---|
| F1 | −2,560 | 0 | 79 | 407 | 465 | −30 | 58 |
| F2a | 0 | 0 | 0 | 0 | 2,175 | 7 | 3 |
| F1+F2a | −2,560 | 0 | 99 | 448 | 2,175 | −22 | 60 |

Today's whole prompt: p50 14,306, p95 19,388.

### Other suites

| | F1 | F2a | F1+F2a |
|---|---|---|---|
| Harness labelled checks lexical / semantic (base 14/14) | 14 / 14 | 14 / 14 | 14 / 14 |
| Prompt goldens that change (of 31) | 3 | 0 | 3 |
| Checklist-report golden | unchanged | unchanged | unchanged |
| Retrieval benchmark | identical / unchanged by construction | unchanged | identical |

Goldens F1 changes: `commander-spellbook-lookup-attached-intent` (614.10a out, 115.1b in),
`commander-spellbook-wrong-zone` (500.10a out, 117.3a in), `upkeep-trigger` (609.7a out,
603.3b in — its fixture description says 603.3b was hand-dropped because of REQ-179).
Game mode, semantic: `combat-deathtouch` gains 510.1a/c/d (the sub-rules the always-selected
stem 510.1 announces); `counterspell-stack` and `upkeep-trigger` gain 603.3b. All checks pass.
Benchmark lexical today: clean R@5 0.5833, MRR 0.4249 (matches the record); polluted R@5
0.5769 (record 0.5256 from 2026-09-05 — card-data drift, same for every variant).

### Necropotence: does 514.3a reach the prompt?

| Wording | Ranking | Today | F1 | F2a |
|---|---|---|---|---|
| Corpus (frozen vector) | hybrid: 514.3 #2, 514.3a #13, 514.2 #29 | out | out | in |
| Corpus | lexical: 514.3a #89 | out | out | out |
| Tester verbatim, either card order | hybrid: 514.3 #1, 514.3a #3, 514.2 #7 | **in** | in | in |
| Tester verbatim, either card order | lexical: 514.3a #4, 514.2 #7 | **in** | in | in |

## Recommendation (Probe D)

- **Fix 1: build F1a**, plus a build test asserting every topic excerpt carries exactly its
  listed rules (if a topic ever carries sub-rule text, exclusion must follow the text —
  F1b). Follow-up, not measured: always-on `stack-and-priority` prints "117.3 …determined by
  the following rules:" with no rules after it on every lookup prompt; adding 117.3a–d
  costs 884 characters per prompt.
- **Fix 2: F2a (fill) with a size guard** skipping the four list-style stems over ~3,000
  characters (704.5, 113.6, 116.2, 703.4) — if built. It fixes the corpus wording only.

## Code seams

Fix 1: `apps/backend/src/gameRulesRetrieval.ts:701–708` (hybrid) and `:736–743` (lexical) —
drop `|| entry.parentRuleIds.some((parentId) => excludeRuleIds.has(parentId))` and rewrite
the REQ-179 comments; `scripts/lib/evidence-trace.mjs:49–54` (`skippedForCuratedTopic`)
mirrors the prefix rule (tests `scripts/lib/evidence-trace.test.mjs:104, 109, 143–148`);
`apps/backend/src/gameRulesRetrieval.test.ts:230`, `:973` assert prefix exclusion and must
flip; regenerate 3 prompt goldens and update `upkeep-trigger.fixture.json`'s description;
`npm run eval:rules-gate:baseline` without `--allow-regressions` (adds 603.2e, 603.2g);
optional topic-excerpt test in `scripts/build-game-rules.test.mjs`.

Fix 2 (if built): `apps/backend/src/prompt/preparation.ts` (lookup `:247–269`, `:291–301`;
game `:337–357`, `:375–383`); `promptFormatting.ts:291–302`; `promptAssembly.ts:44`, `:115`;
`enrichmentDebug.ts`; `eval/rules-gate/rulesGate.ts:195–198`; `scripts/lib/prompt-fidelity.mjs:92`.

## PRD text describing today's behaviour

Fix 1: REQ-179 (`functional-requirements.md:4218`; description `:4221`, acceptance `:4226`);
REQ-022 bullet `:378`; REQ-181 `:4280`; REQ-182 `:4320`; REQ-220 note `:5816` (rationale
only — that topic lists 616.1a–g, nothing changes); REQ-190 constraint `:4580`;
`integrations-and-data.md:364`; `system-map/game-rules-retrieval.md:42–44`, `:106–108`.
Fix 2: REQ-022 `:377`, REQ-181 `:4280`, REQ-182 `:4320`, `integrations-and-data.md:364`
("up to 10"); REQ-229 (`:5988`, bullet `:5997`) already reports "514.3 present and its
exception 514.3a absent".
(Line numbers are on PR #276's branch.)
