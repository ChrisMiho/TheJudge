# Graph-run brief — Does a layer-and-timing "resolution recipe" help Luna judge hard interactions?

Self-contained intake for `graph-kickoff`. Slug: `resolution-recipe-eval`. Owner request dated
2026-10-10. Evidence below was verified against code at `main` `dabad406` on 2026-10-10.

## What the player gets

Nothing changes for players in this package. It is a **measurement only**: an eval-only prompt
variant ("arm R") is compared against today's production prompt ("arm A") on GPT-6 Luna, on a
small set of hard layer and timing questions, in both Quick Lookup and In-Depth (game mode).
The output is a short report that says ship / don't ship / test more. Changing the production
prompt is a separate kickoff the owner decides on after reading it.

The question the report answers: when the prompt hands Luna the full layer list and a timing
list, plus a step-by-step instruction to use them, does Luna get more hard interactions right,
and what does it cost in answer time against the 30-second answer budget (REQ-231)?

## Decisions already made (owner, 2026-10-10) — do not re-litigate

1. **The recipe.** Every arm-R prompt carries two ordered lists and one instruction:
   - the rule 613 layer list, including the layer-7 sublayers 7a–7d;
   - a timing list: stack and priority, triggered abilities, replacement effects,
     state-based actions;
   - an instruction to list every effect in play, place each in a layer or timing step, resolve
     in that order, then answer.
2. **Luna does the mapping, not code.** Code never tags cards with layers. That would be a rules
   engine, which `PRD/sections/goals-and-non-goals.md` rules out (canonical rule, line 86:
   "It never implements legality validation, deterministic rules simulation, board-state logic,
   or format enforcement in the core product"). A static tag would also be wrong whenever
   dependency (613.8) reorders effects.
3. **Measure first.** This package is eval-only: a new diagnostic arm under REQ-230's existing
   mechanism. It **amends REQ-230**; it never invents a parallel arm mechanism. Nothing under
   `apps/backend/src/prompt/`, routes or providers changes (REQ-230 AC).
4. **Comparison shape.** Luna on arm A vs arm R, same cases. The judge is `gpt-6.1-sol`. The hard
   cases are repeated to beat noise. The report covers accuracy and answer time against the 30 s
   budget. A cost dry run comes before anything is spent; every live run passes
   `--max-cost-usd` 15 or less. The owner gives the paid-run go-ahead; the build makes no live
   call.
5. **Strict grading** (owner, 2026-10-08): a right outcome with a real side error a player could
   act on (an invented card, wrong stack timing, a wrong intermediate rule) scores 1, not 2.
6. **Both flows.** Quick Lookup and In-Depth are both measured.

## Open for the define gate (owner decides; give a recommendation)

- **G1 — What arm R asks Luna to show.** Should the player-facing answer show the full step
  list (every effect, its layer/step, the order), or only the conclusion and the key reasons
  (Luna works the recipe but writes a short answer)? Recommendation: **conclusion and key
  reasons only**. A full step list makes every answer longer and slower, and the 30 s budget
  already binds on the hardest cases (Luna's slowest measured answer was 22.7 s). Arm R's
  instruction text must state the choice, because it changes answer length, answer time and
  what the judge reads. Testing both would double the cost and the case count; the
  recommendation is one arm.
- **G2 — Arm R's exact wording.** The owner approves the text before it is frozen, as with arm P.
  A starting draft is under "Draft arm R text" below.
- **G3 — Reference answers.** Every new hard case needs a reference outcome the owner approves.
  The proposal lists each case's expected short answer for an accept/edit/reject verdict.
- **G4 — The decision rule, fixed before any money is spent.** What result counts as "R beats A"?
  Recommendation: per flow, R is ahead by more than the A-vs-A noise floor (A's own repeats
  split in two halves and compared), R loses no case by majority over repeats, and any answer
  over 30 s counts as wrong (the player would see the failure path, REQ-014).
- **G5 — Strict grading in the rubric.** Today the rubric's level 2 says only "Reaches the same
  outcome" (`apps/backend/src/eval/answer-quality/rubric.ts:31-40`, revision `2026-10-07.1`), and
  the judge prompt (`judge.ts:137-152`) adds no side-error instruction. Recommendation: a new
  rubric revision whose level 2 excludes a material side error. This applies to every later run,
  so it is the owner's call.

## Evidence (verified 2026-10-10 — do not re-derive)

### Why harder cases are needed

From `PRD/work/probe-answer-quality/REPORT.md` (tracked on `main`) and its `PAID-RUN.md`:

- On GPT-4.1, regrouping the prompt did not help: arm B 40 of 46 vs production 42 of 46, inside
  a noise floor of about 5 flips in 46.
- Both existing layer cases were already right on production, 3 of 3 each.
- The old layers sentence pushed GPT-4.1 toward layers on a replacement-effect question
  (Academy Manufactor + Esix): the corrected sentence (arm P) scored 3 of 4 vs production 1 of
  5. That sample was too small to call. That correction has since shipped (`909f4e0d`).
- Luna scored 125 of 126 on production. Its only miss was Necropotence + Silence + Borne Upon a
  Wind: 2, 0, 0 over three answers, taking 22.7, 11.1 and 8.2 s. With every deciding rule
  attached, GPT-4.1 was still 0 of 26 there, so the problem is reasoning, not missing rules.
- Luna's answer times: median 3.8 s, p95 9.5 s, slowest 22.7 s, none over 30 s. Of 10 tier-3
  answers, 8 took over 10 s and 4 over 15 s.

So the existing gate leaves almost no headroom, and the recipe's main risk is answer time on the
cases that are already slow.

### What the harness does today

- **Arms.** `scripts/lib/diagnostic-arms.mjs`. The registry (`:46-52`) holds A, B, C, D frozen
  and P unfrozen. `buildArmPrompt` (`:379-393`) is the single entry point. The runner takes
  `--arm` (repeatable, `scripts/eval-answer-quality.mjs:238-241`) and applies arms in
  `buildPromptFor` (`scripts/lib/experiment-run.mjs:374-377`).
- **In-Depth refusal is only in the parser.** `parseLookupPrompt` refuses game prompts
  (`:127-128`), and B, C and D need it. **Arm P does not parse:** it returns `applyCorrection`,
  a plain substitution that requires the target text to appear exactly once (`:361-368`, `:381`),
  before any parse. So an arm that swaps the layers paragraph by substitution already works on
  an In-Depth prompt, and **no parser extension is needed for arm R.** This corrects the
  owner's brief, which assumed the parser had to be extended.
- **The layers paragraph is shared.** `MTG_PROMPT_REFERENCE` (`apps/backend/src/prompt/mtgReference.ts:20`)
  is printed in the game prompt (`promptAssembly.ts:68-69`) and the lookup prompt
  (`promptAssembly.ts:151-152`). Its current text, the arm-R substitution target:
  > Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704). When effects conflict, apply in order: (1) Copy effects, (2) Control-changing effects, (3) Text-changing effects, (4) Type-changing effects, (5) Color-changing effects, (6) Ability-adding/removing effects, (7) Power- and toughness-changing effects. Within a layer, timestamp and dependency rules apply. This assistant does not adjudicate officially; use layers as shared vocabulary when explaining interactions.
- **Arm P is dead today.** `arm-p-correction.json` still targets the old sentence, which
  `909f4e0d` removed, so P refuses (REQ-230's note says so). Out of scope here; name it.
- **Game-mode cases are supported, but none exist.** A case with a `gameState` becomes
  `mode: "game"` with that state as its `gameContext` (`scripts/lib/prompt-fidelity.mjs:53-63`).
  The game-state type is in `gold-cases.d.mts`, structural checks in `gold-cases.mjs:100-152`,
  and the judge's state lines in `judge-inputs.mjs:7-46`. The compare report already splits by
  `requestKind` lookup/game (`experiment-run.mjs:276-287`). All 400 case files have
  `"gameState": null`.
- **Unverified mirror gap.** The harness skips the route's zod parse (`askAiRequestSchema`, with
  `.default()`s at `askAiRequest.ts:98-176`). A game case must therefore be proven to build the
  same prompt production would, by parsing it through the route schema or asserting the request
  inputs, before money is spent (lesson from an earlier run: calling the production prompt
  builder is not the production request).
- **Manifests gate the arms.** `validateArmUse` (`:405-436`): A runs anywhere; B and P run on the
  diagnostic manifest, or on held-out only when frozen; a live run needs every arm frozen.
  `diagnostic.json` has 46 cases, `held-out.json` 80, neither has a game case, and both are
  ids-plus-hashes written by the seeded `eval:answer-quality:manifests`. The committed sets no
  longer match a fresh seeded draw, so its `--check` fails today (REPORT.md:159-160). New cases
  in neither manifest are refused for any non-A arm.
- **Repeats and resume exist.** `--repeat n` (`eval-answer-quality.mjs:226`, `:317-322`); the
  record key is case|model|cap|arm|repeat; `--resume` skips recorded keys (`:586-599`).
- **Answer time.** Each record has `latencyMs`, the client wall-clock around
  `responses.create` (`:739-757`), with no client timeout. The harness does not record
  production's `providerElapsedMs`, which exists only in production logs (`routes/askAi.ts:166`).
  `latencyMs` is the same measure Phase 4 used for the 22.7 s figure.
- **Compare report** (`scripts/lib/answer-compare.mjs`): per-side latency mean/p50/p95 and the
  count slower than the production timeout (`:176-200`, read from config, now 30000), right/wrong
  transitions by tier, an `unstable` list where repeats disagree (`:76-108`), majority over
  repeats, and `--arm-a A --arm-b R`. It has **no noise-floor statistic**, and its
  unchanged-input stratum is empty when the prompt hashes differ, which they always do for A
  vs R. `summary.json` counts pool all arms together (`experiment-run.mjs:315-321`).
- **Cost dry run under-counts Luna.** `estimateCost` (`:490-533`) assumes a fixed 600 output
  tokens (`:165`). Luna's reasoning tokens are billed as output and run far higher on hard cases
  (1,872 on the 22.7 s Necropotence answer). The cap guard uses the same estimate
  (`experiment-run.mjs:570-575`). Prices: Luna $0.10 / $0.50 per million tokens; judge
  `gpt-6.1-sol` $2 / $10.
- **Case corpus** (`apps/backend/src/eval/worked-solutions/*.case.json`, format version 2): id,
  tier, review status, cards, gameState, question, expected {outcome, shortAnswer, answer,
  decidingRuleIds}, source, layers, snapshot, whyHard.

### Coverage of the hard interactions the owner named

| Interaction | Lookup case today | In-Depth case today |
| --- | --- | --- |
| Blood Moon + Urborg, Tomb of Yawgmoth | none | none |
| Humility + Opalescence | none | none |
| Base P/T set, then pumped (7b vs 7c, e.g. Turn to Frog after Giant Growth) | none | none |
| Replacement vs trigger | `replacement-saheeli-three-artifacts-sculpting-steel`, `triggers-devouring-hellion-and-kronch-wrangler` | none |
| Necropotence + Silence (+ Borne Upon a Wind) | `necropotence-silence-borne-upon-a-wind-cleanup` (tier 3) | none |
| Academy Manufactor + Esix (replacement ordering; where the old layers sentence misled) | `academy-manufactor-esix-treasure` (tier 3) | none |

**Challenge for refinement: the famous cases may test memory, not reasoning.** Blood Moon +
Urborg and Humility + Opalescence are among the most-discussed layer interactions on the
internet, and Luna likely knows the answers by name. A recipe win or loss on them says little.
Refinement should add two or three less-famous layer or dependency cases that need the same
reasoning, for example a Clone copying a Turn-to-Frogged creature (layer 1 sees only copiable
values), or Mycosynth Lattice + March of the Machines (dependency inside layer 4, then lands as
0/0 creatures die to state-based actions). Academy Manufactor + Esix stays in the set as the
**regression check**: it is where a layers nudge already hurt once.

**Rule text for the ladders** (from `apps/backend/data/gameRulesRuleIndex.json`): layers
613.1a–g (1 copy, 2 control, 3 text, 4 type, 5 color, 6 abilities, 7 P/T); sublayers 613.4a
(7a characteristic-defining P/T), 613.4b (7b set base P/T), 613.4c (7c effects **and counters**
that modify P/T), 613.4d (7d switch); 613.7 timestamp; 613.8 dependency overrides timestamp;
117.5 / 704.3 state-based actions before each priority; 603.3b triggers go on the stack in APNAP
order after them; 614 / 616.1 replacement effects modify the event as it happens, with the
affected player or controller choosing order.

## Draft arm R text (for G2 — refinement refines it, the owner approves it)

Substitutes the whole paragraph at `mtgReference.ts:20`. The final sentence depends on G1;
shown here with the recommended conclusion-only choice.

> Resolve interactions in this order. Continuous effects apply in layers (rule 613): (1) copy effects; (2) control-changing; (3) text-changing; (4) type-changing; (5) color-changing; (6) ability-adding and ability-removing; (7) power and toughness, in sublayers (7a) characteristic-defining abilities, (7b) effects that set power or toughness, (7c) effects and counters that modify it, (7d) effects that switch it. Within a layer, apply effects in timestamp order unless one depends on another (rule 613.8). Timing is separate from layers: spells and abilities resolve from the stack one at a time, last in first out, and players get priority between them; replacement effects change an event as it happens and never use the stack, and when several apply the affected player or controller chooses their order (rule 616.1); each time a player would get priority, state-based actions are checked first and repeated until none apply (rule 704), and only then do triggered abilities go on the stack, in APNAP order (rule 603.3). Before answering, list every effect in play, place each one in its layer or timing step, and resolve them in that order. Show the player the conclusion and the key reasons, not the full list.

## Comparison design (for refinement to make exact)

- **Arms.** A (production, untouched) vs R. R is a REQ-230 arm in `diagnostic-arms.mjs`, a pure
  substitution like P, revision `R.1`, frozen only after the owner approves its text (G2).
- **Cases.** The hard set: each interaction above authored in **both flows**. A lookup case asks
  in words; an In-Depth case puts the cards in zones with a `gameState` and asks the same thing.
  That is roughly 8 interactions × 2 flows ≈ 16 cases, all tier 3, all owner-approved before any
  paid call. They join the **diagnostic** manifest. Held-out stays untouched, saved to judge a
  later production change once (REQ-230's purpose).
- **Repeats.** About 5 per arm per hard case, so a majority exists and A's own repeats give the
  noise floor (G4).
- **Regression slice.** The recipe goes into every prompt, easy ones included, so the report must
  also say what it costs on ordinary questions. Run A vs R once over the 46 diagnostic lookup
  cases: accuracy, then median and p95 answer time.
- **Measures.** Per flow and per arm: right count (strict rubric), majority-over-repeats per case,
  unstable cases, the noise floor, `latencyMs` p50/p95/max, the count over 30 s (scored wrong),
  and reasoning tokens. `latencyMs` stands in for production's `providerElapsedMs`. The report
  says so, and says that production adds prompt build, embedding and network on top.
- **Rough cost.** About 160 hard-set answers plus 92 regression answers, each with a
  `gpt-6.1-sol` judge call. Expect a few dollars, far under the $15 cap. The dry run, with a
  Luna reasoning allowance fixed, gives the real number before the owner's go-ahead.

## Build scope (what the code PR carries)

1. Arm R in `scripts/lib/diagnostic-arms.mjs`: registry entry, `buildArmPrompt` branch, an
   owner-approved text file, and a refusal until it is approved (P's pattern). Tests that it
   works on a lookup prompt **and** a game prompt, changes only the target paragraph, and
   refuses when the target text is missing or appears twice.
2. The hard cases as worked-solution files in both flows, added to the diagnostic manifest by a
   method that keeps `validateArmUse` honest. Refinement decides whether that is a manifest
   regeneration or a recorded append. The seeded `--check` already fails, so name how it's
   reconciled.
3. Game-mode request fidelity: a game case's request passes through `askAiRequestSchema` (or the
   harness asserts it equals what the route would build), with a test, before any live run.
4. Dry-run cost honesty for reasoning models: an output-token allowance for Luna that reflects
   reasoning (for example from the recorded Phase 4 reasoning-token p95), used by both the
   estimate and the cap guard.
5. Compare report additions: per-arm and per-flow right counts that are not pooled, an A-vs-A
   split-half noise floor, the over-30 s count scored as wrong, and reasoning tokens.
6. The rubric revision, if G5 is accepted.
7. A paid-run runbook under `docs/eval/resolution-recipe/` (never `PRD/work/`, which cleanup
   deletes): exact dry-run and live commands with `--max-cost-usd` 15 or less, `--repeat`,
   `--resume`, and where the report goes. The paid run and the report happen after the code PR
   merges, outside the graph run.

## PRD truth to amend

- **REQ-230** (`PRD/sections/functional-requirements.md:6028-6053`): add arm R to the arm list,
  the frozen-revision rule and the approval refusal; note that arms run on In-Depth prompts when
  they are substitutions; note that the diagnostic manifest now holds game-mode cases. No
  parallel requirement.
- **REQ-228** if the compare report gains the noise floor and the per-flow counts.
- **REQ-227** if the cost estimate changes for reasoning models.
- Rubric revision (G5) wherever the rubric's levels are stated in PRD truth.
- `PRD/sections/system-map.md:501-503` and NFR-018 (`non-functional-requirements.md:304`, `:317`)
  cite REQ-230. Refinement greps for every line-level hit and gives each a disposition row.
- No new DEC. The decision log is retired.

## Constraints

- No live OpenAI call in the build. Paid runs happen after the merge, owner go-ahead first.
- Production prompt, routes, providers, mock mode and goldens are unchanged.
- File edits in every node use Write/Edit, and git runs as short separate calls. The session
  permission layer denies heredoc and `sed -i` chains.
- Deliverables that must survive go under `docs/eval/`, never `PRD/work/`.
