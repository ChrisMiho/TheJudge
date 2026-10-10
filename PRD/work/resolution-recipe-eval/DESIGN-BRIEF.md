# Design brief — resolution-recipe-eval

**What you need to do:** Decide. Answer the verdict slots in `GATE-QUESTIONS.md`
(five rule changes, then the blocker questions G1–G4 and one slot per hard case).

**What this is:** a measurement, not a product change. Players see nothing new.
We test whether giving GPT-6 Luna (the model that answers players today) a
step-by-step "resolution recipe" in its prompt makes it judge hard layer and
timing interactions better, and what that costs in answer time. The recipe is
the full layer list (with the power/toughness sublayers 7a–7d), a timing list
(stack, replacement effects, state-based actions, triggers), and an instruction
to place every effect in a step and resolve in order.

**How:** the evaluation tool already compares "arms" — labelled prompt variants
that exist only inside the test harness, never in the app. Today's prompt is
arm A. This package adds arm R (the recipe). Luna answers 18 hard questions six
times each under A and under R, in both Quick Lookup and In-Depth (game mode), a
stronger model (`gpt-6.1-sol`) grades every answer against an owner-approved
reference, and a report says ship, don't ship, or test more. Changing the real
prompt would be a separate, later package.

**What it costs:** about $3.55 by the tool's own estimate, likely nearer $2 by
what earlier runs actually spent; every live run is capped at $15 or less. The
build makes no paid call; you run the paid comparison after the code merges.

- Package: `PRD/work/resolution-recipe-eval/` · run `graph-20261010-183425` · node `define`
- Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`
- Facts below were re-verified in this worktree (base `dabad406`, branch head
  `313f1225`) on 2026-10-10 unless marked as taken from the intake. Define
  attempt 2 (branch head `1f6162bc`) re-ran the cost dry runs and resolved every
  G3 card to its oracle id; the saved outputs are in `evidence/` in this folder.

## Scope

In scope:

1. Arm R, an evaluation-only diagnostic arm under REQ-230's existing arm
   mechanism (labelled prompt variants built by `scripts/lib/diagnostic-arms.mjs`).
2. A hard case set of 9 interactions, each in both flows (18 cases: 16 new
   case files plus 2 existing approved lookup cases).
3. The comparison design: Luna on A vs R, judge `gpt-6.1-sol`, 6 repeats, an
   A-vs-A noise floor, accuracy and answer time against REQ-231's 30-second
   answer budget, a cost dry run before any spend, `--max-cost-usd` 15 or less.
4. The tooling the comparison needs (below) and a paid-run runbook under
   `docs/eval/resolution-recipe/`.

Non-goals:

- No change to the production prompt, `apps/backend/src/prompt/`, routes,
  providers, mock mode, or goldens. Arm R never becomes runtime text here.
- No code that tags cards with layers (owner decision 2026-10-10: Luna does the
  mapping; a rules engine is excluded by `PRD/sections/goals-and-non-goals.md`).
- No live OpenAI call in the build. The paid run and its report happen after
  the code PR merges, run by the owner.
- The held-out manifest (the 80 cases saved to judge a later product change
  once) is untouched.
- Arm P stays dead (its target sentence left the prompt in `909f4e0d`; REQ-230's
  note already says it refuses). Named, not fixed.
- No reasoning-effort setting (REQ-188 keeps the provider call to model and
  prompt only).

## Verified facts the design rests on

| Fact | How verified |
| --- | --- |
| Arm registry holds A, B, C, D frozen and P unfrozen; `buildArmPrompt` is the one entry point; P is a plain substitution applied before any parse, refusing unless the target appears exactly once and the file carries `approvedOn`. | Read `scripts/lib/diagnostic-arms.mjs` (registry `:46-52`, `applyCorrection` `:361-368`, `buildArmPrompt` `:379-393`). |
| The layers paragraph (`Continuous effects use a layer system (rule 613); ... use layers as shared vocabulary when explaining interactions.`) is the last paragraph of `MTG_PROMPT_REFERENCE`, printed in both the lookup and the game prompt. | Read `apps/backend/src/prompt/mtgReference.ts`; `promptAssembly.ts:69,152`. |
| An In-Depth (game) prompt carries that paragraph exactly once, and carries the attached cards' rulings. | Built a Blood Moon + Urborg game request offline through `preparePromptInput`: 1 occurrence; Urborg's ruling text present. |
| For that game request the prompt from the raw request equals the prompt from the route-schema-parsed request. The harness never parses (`buildCaseRequest` → `preparePromptInput`, `experiment-run.mjs:588`), and the schema defaults zone-card `targets` to `[]` (`askAiRequest.ts:115`), so equality is not guaranteed for every game case. | Same offline script; read the schema and the harness. |
| The seeded `npm run eval:answer-quality:manifests -- --check` fails today: a fresh draw gives 45 diagnostic cases (trace pools 290 / 14 / 88) where the committed file has 46 (pools 287 / 14 / 91). Every case in both committed manifests is still present with matching question and answer hashes. | Ran `--check`; hashed every listed case file. |
| All 400 case files have `"gameState": null`; 392 are approved; only 2 are tier 3. | Counted the corpus. |
| The loader rejects two cases with the same question text, or the same attached cards plus the same reference answer text. | Read `findDuplicateErrors`, `scripts/lib/gold-cases.mjs`. So each In-Depth twin needs its own wording. |
| REQ-224: "no agent sets `approved`; only the apply command, run on an owner-filled batch, does" (one exception: the 18 first-ship cases). | Read `PRD/sections/functional-requirements.md:5891`. |
| Rubric Correctness level 2 is "Reaches the same outcome as the case's approved reference answer"; level 1 already says "right with a material error or omission". Revision `2026-10-07.1`. | Read `apps/backend/src/eval/answer-quality/rubric.ts:31-40`. |
| The compare report has majority-over-repeats, an `unstable` list, a request-kind breakdown and a slower-than-budget count, but no repeat selector, no answer-level right count, and no right-but-too-slow count. | Read `scripts/lib/answer-compare.mjs`, `scripts/eval-answer-compare.mjs`. |
| The dry-run estimate assumes 600 answer output tokens and 1,500 in / 800 out per judge call (`scripts/eval-answer-quality.mjs:165-167`). | Read the source. |
| The committed card data carries no printed power or toughness (fields: oracle text, type line, mana cost, mana value, colors, types, keywords). | Read `cardDetailByOracleId.json.br`. No reference depends on a printed power or toughness: G3-11 and G3-12 (Clone copying Serra Angel) deliberately say "Serra Angel's printed power and toughness" and never name 4/4, and every other number a reference states comes from card text (Humility's 1/1, Turn to Frog's 1/1, Giant Growth's +3/+3, mana values). |
| Every card named in a G3 slot resolves to exactly one oracle id, and its committed text supports the reference. | Ran `node PRD/work/resolution-recipe-eval/evidence/resolve-g3-cards.mjs` (output: `evidence/g3-card-ids.txt`, 22 names, 0 problems). Name to oracle id through `apps/frontend/public/data/cardMetadata.json` (`name` to `cardId`); text from `apps/backend/data/cardDetailByOracleId.json.br`. Grizzly Bears is the one exception: `cardMetadata.json` skips every card with empty oracle text (`scripts/build-card-metadata.mjs`, `finalizeTransformState`; 673 vanilla creatures), so its id comes from `apps/frontend/public/data/cardScanMap.json` (the scanner's index, `name` to `oracleId`): `14c8f55d-d177-4c25-a931-ebeb9e6062a0`, {1}{G} Creature — Bear, no text. A player adds it by scanning it; the request carries the same oracle id. Each id is listed in every G3 slot that uses the card. |

## Arm R

**What it is.** A pure substitution arm, built like P: it replaces the layers
paragraph of the prompt's fixed reference text with the owner-approved recipe
text, and changes nothing else. Because it substitutes before any parse, it works
on lookup and In-Depth prompts alike; no parser change is needed (the intake's
correction of the owner's brief holds — re-verified above).

- Registry entry `R`, revision `R.1`, title "layer-and-timing resolution recipe",
  `usesDecidingRules: false`.
- Text file `apps/backend/src/eval/answer-quality/arm-r-recipe.json`:
  `{ "replaces": "<the current layers paragraph, verbatim>", "recipe": "<the approved text>", "approvedOn": "YYYY-MM-DD" }`.
  R refuses until `approvedOn` is present; R.1 is frozen by that approval (the
  date the docs PR carrying an accepted G2 merged); any later wording is R.2.
- R refuses unless the target paragraph appears exactly once in the prompt.
  When production's paragraph changes, R refuses (as P does now) until a new
  revision is approved.
- Where it may run: like P — the diagnostic manifest, or the held-out manifest
  only once frozen. The hard cases join the diagnostic manifest.
- P and R share one substitution helper; P's behaviour is unchanged.

**The text** is G2. The proposed wording (refined from the intake's draft) is in
`GATE-QUESTIONS.md` under G2. Changes from the intake draft: "(7a)" is scoped to
power/toughness-defining abilities as rule 613.4a says; the dependency clause
says what dependency does (a dependent effect waits, rule 613.8b); the trigger
step cites 603.3b; and the closing "This assistant does not adjudicate
officially." is kept from production so only the recipe changes between A and R.

## The hard case set

Proposed set: **9 interactions, each in both flows = 18 cases** (all tier 3,
reference source `owner-approved-derived`, no source pool). Full questions,
board states, reference answers and deciding rules are in `GATE-QUESTIONS.md`
G3-01 to G3-16, one verdict slot per new case.

| # | Interaction | Why it is in | Answer already in an attached ruling? |
| --- | --- | --- | --- |
| 1 | Blood Moon + Urborg, Tomb of Yawgmoth (Urborg played second) | owner-named; layer-4 dependency | Yes — Urborg's 2021-03-19 ruling states it |
| 2 | Humility, then Opalescence | owner-named; 613.6 + 7b timestamps | Yes — Humility/Opalescence 2009 ruling walks this exact order |
| 3 | Grizzly Bears with a +1/+1 counter and Giant Growth, then Turn to Frog | owner-named; 7b set vs 7c modify | Yes — Turn to Frog ruling: modifiers apply whenever they started |
| 4 | Kalitas, Traitor of Ghet vs an opponent's Blood Artist | owner-named replacement vs trigger | Partly — Kalitas ruling covers the trigger, not the no-stack part |
| 5 | Necropotence + Silence + Borne Upon a Wind (cleanup) | owner-named; Luna's only production miss (2, 0, 0) | No |
| 6 | Academy Manufactor + Esix | regression check: where a layers nudge already hurt once | No |
| 7 | Clone copying a Frogify-enchanted Serra Angel | less famous; layer 1 copiable values | Yes — Clone ruling states the principle |
| 8 | March of the Machines on the battlefield, then Mycosynth Lattice | less famous; dependency inside layer 4, then state-based actions | Partly — rulings mention the combo, not the ordering |
| 9 | Both players at 1 life, each with Blood Artist, a creature dies on my turn | less famous; APNAP trigger order, then state-based actions | No |

**Weighing the intake's challenge.** It is right, and stronger than it said.
For four of the five owner-named interactions the prompt already prints a WotC
ruling that states the answer (rulings are attached in both flows), so those
cases test whether Luna reads its prompt, not whether the recipe helps it
reason. They stay — the owner named them, and a recipe that made Luna ignore a
printed ruling would be a real regression — but the report groups results by
the last column above. The three added interactions (7–9) and the two existing
hard ones (5, 6) need reasoning the prompt does not hand over. Interaction 9
also tests the recipe's timing list, which the layer-only cases never touch.
More than three additions would add cost without a different kind of test.

Authoring rules for the build: each In-Depth twin uses its own question wording
and its own reference wording (the loader rejects duplicates); its `gameState`
holds only the facts the ruling depends on (worked-solutions README); every
zone card is one of `cards`; each card carries the oracle id its G3 slot lists
(resolved and text-checked by `evidence/resolve-g3-cards.mjs`, see Verified
facts), and the build re-runs that resolution against the data it authors from.

## Comparison design

**Runs** (both from the merged code, Luna `gpt-6-luna`, excerpt cap 10, judge
`gpt-6.1-sol`, sequential calls, owner-launched):

| Run | Cases | Arms | Repeats | Answers | Dry-run estimate | Cap |
| --- | --- | --- | --- | --- | --- | --- |
| `rr-hard` | the 18 hard cases | A, R | 6 | 216 | ≈ $2.52 | `--max-cost-usd 6` |
| `rr-regression` | the 44 other diagnostic cases (all ordinary lookups) | A, R | 1 | 88 | ≈ $1.03 | `--max-cost-usd 3` |
| follow-up (only if needed) | each regression case R turned right→wrong | A, R | 6 | ≤ 12 per case | ≈ $0.14 per case | `--max-cost-usd 2` |

The regression slice exists because the recipe is in every prompt, easy ones
included; it answers "what does R cost on ordinary questions" (accuracy, then
median and p95 answer time).

**Why 6 repeats (from the recorded data, not proportion).** The recorded
2026-10-09 runs (`~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/`)
show Luna's hard answers flip on an identical prompt: of the 3 tier-3 cases Luna
answered more than once on arm A, 2 disagreed with themselves (Academy
Manufactor + Esix 1, 2, 2, 2; Necropotence 0, 2, 0, 0), and 6 of 18 answer
pairs on those cases disagree. One answer per case cannot separate an arm effect
from that noise. Six is the smallest count that splits into two equal halves
whose case majorities rest on more than one answer and cannot tie (halves of
three), which the noise floor below needs: 2 splits into single answers, 4 into
pairs that can tie, 5 unevenly. The earlier 3-repeat runs could not give a
split-half at all. At ≈ $0.0117 per graded answer, six repeats cost ≈ $2.52 for
the hard set, so the count is set by noise, not by budget. Ordinary cases are near-deterministic for Luna (125 of 126 on one pass),
so the regression slice uses 1 repeat and re-checks only what moves.

**Noise floor.** Within `rr-hard`, compare arm A's repeats 1–3 against arm A's
repeats 4–6 on the same prompts. Their difference in right answers, per flow,
is the noise floor N: how far two identical setups drift apart by chance. The
like-for-like comparison is then R's repeats 1–3 against A's 1–3, and R's 4–6
against A's 4–6. (Comparing all six of R against all six of A has a smaller
chance spread than a half-against-half gap, so using halves on both sides keeps
the floor honest.) For reference, GPT-4.1 on arm A changed its result on 7 of 46
diagnostic cases between runs.

**Measures** (per flow — Quick Lookup and In-Depth never pooled — and per arm):
right answers out of answers (every repeat counted), majority per case, unstable
cases, N, `latencyMs` p50/p95/max, answers over 30 s, right-but-over-30 s,
reasoning tokens, answer and judge cost. `latencyMs` is the harness's wall clock
around the provider call; production's own measure (`providerElapsedMs`) exists
only in production logs, and production adds prompt build, embedding and
network on top — the report says so.

**Decision rule** is the owner's (G4), fixed before money is spent. The compare
command only prints numbers (REQ-228 never decides); the results report
(`docs/eval/resolution-recipe/REPORT.md`, written after the paid run) applies
the accepted rule to them and never re-tunes it.

**Grading.** If REQ-187's revision (G5) is accepted, both runs grade under the
new revision, so A and R are judged alike; earlier runs stay comparable only
through `--regrade-from`.

## Cost dry run (anchor)

Two dry runs, re-run 2026-10-10 in this worktree (branch head `1f6162bc`), no
`--confirm-live-calls`, no provider request, nothing spent. Arm B stood in for R
(R does not exist yet; the recipe adds ≈ 900 characters, ≈ 225 input tokens,
about $0.00002 per Luna call). The full printed output of every command below is
saved verbatim in `evidence/cost-anchor-dry-runs.txt` in this folder (evidence
only; the build deletes it with the package).

```bash
# run manifests (offline; gitignored output/)
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-hard-anchor.json --from approved --ids academy-manufactor-esix-treasure,layers-hand-size-timestamp-praetors-counsel,layers-hand-size-timestamp-thought-eater,necropotence-silence-borne-upon-a-wind-cleanup,replacement-saheeli-three-artifacts-sculpting-steel,triggers-devouring-hellion-and-kronch-wrangler
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-diagnostic.json --from diagnostic
# dry run 1: prints "Calls: 72 answer calls, 72 lone judge calls" and "Estimated cost: $0.84"
npm run eval:answer-quality -- --run-id rr-hard-anchor --manifest output/answer-quality/manifests/rr-hard-anchor.json --model gpt-6-luna --excerpt-cap 10 --arm A --arm B --repeat 6 --max-cost-usd 6
# dry run 2: prints "Calls: 92 answer calls, 92 lone judge calls" and "Estimated cost: $1.08"
npm run eval:answer-quality -- --run-id rr-diagnostic-anchor --manifest output/answer-quality/manifests/rr-diagnostic.json --model gpt-6-luna --excerpt-cap 10 --arm A --arm B --max-cost-usd 3
```

Judge model `gpt-6.1-sol` is the tool's default (`DEFAULT_JUDGE_MODEL`,
`scripts/eval-answer-quality.mjs:118`), printed by both dry runs.

- Dry run 1 — 6 existing hard cases (both tester cases, Saheeli, Devouring
  Hellion, both Thought-Eater/Praetor's Counsel layer cases) × A, B × 6 repeats:
  72 answers + 72 judge calls, **$0.84** → $0.0117 per graded answer.
- Dry run 2 — the 46 diagnostic cases × A, B × 1: 92 + 92 calls, **$1.08** →
  $0.0117 per graded answer.
- Projection: `rr-hard` 216 × $0.0117 ≈ **$2.52**; `rr-regression` 88 ×
  $0.0117 ≈ **$1.03**; total ≈ **$3.55** by the estimate.

**How Luna's reasoning tokens are allowed for — no code change.** The estimate
assumes 600 answer output tokens. Luna's recorded output (reasoning included,
billed as output) is mean 323 overall but 1,286 on tier 3, max 2,026. At Luna's
$0.50 per million output tokens even 10,000 tokens cost $0.005, so a recipe that
quintupled Luna's reasoning would add about $0.50 to `rr-hard`. Meanwhile the
estimate's judge assumption ($0.011 per call at `gpt-6.1-sol` $2 / $10) is about
twice the recorded judge cost ($0.0054 mean, $0.0064 tier 3), an over-count of
roughly $1 on `rr-hard` alone.

Where those recorded figures come from: the 2026-10-09 paid runs backed up at
`~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/answer-quality/runs/`,
every `<run>/calls.jsonl` record with `model` `gpt-6-luna` and `status` `ok`
(181 records, all in `phase-4-arm-a`, `phase-4-best-arm` and `phase-4-repeats`;
10 of them tier 3). Output tokens are the record field `outputTokens` (mean
322.9, tier-3 mean 1,286.2, max 2,026); judge cost is `judgeCostUsd` (mean
$0.005394, tier-3 mean $0.006447); answer time is `latencyMs` (max 22,683 ms,
tier-3 median 13,114.5 ms, used in G1). The script that reads them is
`evidence/luna-token-stats.mjs`; its output is step 4 of
`evidence/cost-anchor-dry-runs.txt`. The judge dominates cost, and the estimate already
over-counts it by more than any plausible Luna reasoning growth. The runbook
states this arithmetic; REQ-227's estimate method and cap guard stay unchanged.
This drops the intake's build item 4 (assumption A3 below).

## Build scope (the code PR)

Map-out decides slicing; this is the content.

1. **Arm R** in `scripts/lib/diagnostic-arms.mjs`: registry entry, a shared
   substitution helper for P and R, the `buildArmPrompt` branch, `--arm R` in
   `parseArgs`, R handled like P in `validateArmUse`, R's file loaded in
   `defaultLoadArmSets` (`scripts/eval-answer-quality.mjs`), and
   `arm-r-recipe.json` carrying the G2-approved text and its approval date.
   `scripts/diagnostic-arms-check.mjs` also checks R substitutes exactly once on
   every diagnostic case, game cases included. Tests: R on a lookup prompt and a
   game prompt changes only the target paragraph; refuses when the target is
   missing or appears twice; refuses without `approvedOn`; P unchanged.
2. **The hard cases**: one new case file per accepted or edited G3 slot (16 if
   every slot is accepted; an `edit` verdict's text applied, a `reject` authors
   nothing), snapshot recorded at authoring.
   Approval status per the REQ-224 / REQ-185 verdict:
   - accepted: written `approved`, `reviewedOn` = the docs PR merge date, a
     review note naming the G3 slot;
   - rejected: written `draft`; the runbook gains a pre-run step (owner renders,
     approves and applies the batch, then appends to the manifest, in a small PR
     merged before any paid run, because an experiment refuses a dirty checkout).
   Also rebuild the frozen query vectors (`npm run eval:build-rules-gate-vectors`),
   raise the rules-gate baseline (`npm run eval:rules-gate:baseline`), and
   rewrite `coverage.json` (`npm run eval:rules-coverage`), so the offline gate
   (REQ-222) stays green.
3. **Game-case request fidelity**: a test, and a run-start check in experiment
   mode, that for every selected case with a `gameState` the prompt built from the
   raw case request equals the prompt built from the request parsed by
   `askAiRequestSchema`; the run refuses, naming the case, when they differ. An
   assertion, not a parse inside the harness, so no existing prompt hash moves.
4. **Manifests** (REQ-230 diff): `--append-diagnostic <ids> --reason <text>`
   adds approved cases to the committed diagnostic manifest as a recorded group
   (refusing any held-out or non-approved id); `--check` verifies the committed
   files instead of re-drawing them, and reports drift without failing; a
   re-draw keeps appended groups. The new case ids the build authored are
   appended as group `resolution-recipe-hard-set` (diagnostic becomes 46 plus
   that count, 62 if all 16 slots are accepted; the two existing lookup cases
   are already in it). The REQ-230 text names no count, so it stays true
   whichever slots are rejected; the count lives in the group's record and the
   build note.
5. **Compare report** (REQ-228 diff): `--repeats` / `--repeats-a` /
   `--repeats-b` selectors; refusal of a side compared with itself; per-side
   right answers out of answers (all repeats), and right-but-over-budget count,
   in every breakdown (so per flow).
6. **Rubric revision** (REQ-187 diff, only if accepted): Correctness level 2
   excludes a material error a player could act on; `RUBRIC_REVISION` moves to a
   new date-stamped revision; rubric and artifact tests follow.
7. **Runbook** `docs/eval/resolution-recipe/RUNBOOK.md` (never `PRD/work/`):
   the exact commands below, the cost arithmetic, the decision rule as accepted
   at G4, where the report goes (`docs/eval/resolution-recipe/REPORT.md`, written
   after the paid run), and the "answer in an attached ruling" grouping by case id.
8. **PRD apply**: the accepted diffs to REQ-230, REQ-228, REQ-187, REQ-224 and
   REQ-185, applied by intent against current truth, plus the doc lines the
   disposition table marks "build".

Runbook command shape (exact flags finalised at build):

```bash
npm run eval:answer-quality:manifests -- --check
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-hard.json --from approved --ids <the 18 ids>
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-regression.json --from diagnostic --exclude <the 18 ids>
# dry run first: prints calls and the estimate, spends nothing
npm run eval:answer-quality -- --run-id rr-hard --manifest output/answer-quality/manifests/rr-hard.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 6
# owner go-ahead, then the same command with --confirm-live-calls; after an interruption add --resume rr-hard
npm run eval:answer-quality -- --run-id rr-regression --manifest output/answer-quality/manifests/rr-regression.json --model gpt-6-luna --arm A --arm R --max-cost-usd 3
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm A --repeats-a 1-3 --repeats-b 4-6   # noise floor N
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R --repeats 1-3
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R --repeats 4-6
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R
npm run eval:answer-quality:compare -- rr-regression rr-regression --arm-a A --arm-b R
```

Live runs need the owner's auto-mode allow rule and are launched by the owner.

## PRD truth proposed (details and diffs in `GATE-QUESTIONS.md`)

| Stable ID | Change |
| --- | --- |
| REQ-230 | Adds arm R; substitution arms run on both flows; R's approval refusal; B, P and R on held-out only when frozen; appended diagnostic groups; `--check` verifies instead of re-drawing; game-case fidelity check; notes. |
| REQ-228 | Repeat selectors for a split-half noise floor; self-comparison refusal; answer-level right counts; right-but-over-budget count. |
| REQ-187 | (G5) Correctness 2 excludes a material side error; new rubric revision. |
| REQ-224 | A case the owner approves one by one in a define-gate verdict slot is written `approved` by the build that authors it. |
| REQ-185 | The same exception, in the corpus requirement's two lines that restate it. |

No new REQ, no new DEC (the decision log is retired). REQ-227 is unchanged
(assumption A3). REQ-226 is unchanged: `--repeat`, record keys and the identity
record already carry arms and their revisions.

## Assumptions (conservative ladder)

- **A1 — Arm, not prompt.** Evidence: owner decision 3 and REQ-230's constraint
  that arms never become runtime text.
- **A2 — R reuses P's pattern** (substitution, committed text file, approval
  date, exactly-once refusal). Evidence: established local pattern; verified it
  works on game prompts.
- **A3 — No reasoning allowance in code.** Evidence: the cost arithmetic above;
  smallest reversible scope. If the owner wants one anyway, it is a REQ-227
  amendment in a later package.
- **A4 — Fidelity by assertion, not by parsing in the harness.** Evidence:
  parsing would change no game prompt verified so far but could move existing
  lookup prompt hashes and reselect 392 cases on the next routine run; an
  assertion protects the paid run with zero side effects.
- **A5 — Recorded append, not a re-draw.** Evidence: a re-draw changes both
  manifests (the held-out set is supposed to be used once), and the committed
  sets are still sound (every hash matches). The seeded selection stays as drawn.
- **A6 — New cases carry no source pool.** Evidence: `source.pool` is optional;
  adding a pool value would change REQ-185's schema for a reporting nicety; the
  append group already identifies the set.
- **A7 — Regression slice at 1 repeat, follow-up only on movers.** Evidence:
  Luna 125 of 126 on one pass of ordinary cases.
- **A8 — Keep the four ruling-answered cases.** Evidence: owner named them;
  report groups them apart rather than dropping them.

## Out of scope, named

- Arm P refuses until a new correction is approved (REQ-230 note).
- Card data carries no printed power/toughness; a P/T question leans on Luna's
  memory. Not this package.
- Production `providerElapsedMs` is not sampled; NFR-002's end-to-end sampling is
  a separate parked package.

## Amendment-set grep and dispositions

One line-level grep over the four trees, covering every amended ID and the
phrases that restate what changes (the arm lists, the held-out arm rule, the
manifest `--check`, the "no agent sets approved" rule, Correctness level 2):

```bash
grep -rnE "REQ-(187|224|228|230)\b|A, B, C, D|B, C, D|C, D and P|B and P|-- --check|no agent sets .approved|Nothing else writes .approved|eaches the same outcome" PRD/sections apps scripts docs --exclude-dir=node_modules
```

**104 hits.** Dispositions: **amend** = changed by a GATE-QUESTIONS block;
**build** = a code or doc line the build updates to follow an accepted block;
**keep** = cites or restates something whose meaning the proposal leaves intact.
Totals: 10 amend, 20 build, 74 keep.

| # | Hit | What it says | Disposition |
| --- | --- | --- | --- |
| 1 | `PRD/sections/functional-requirements.md:4402` | REQ-185: no case scores until approved — first-ship by accept, others through REQ-224 | amend (REQ-185 block) |
| 2 | `functional-requirements.md:4409` | REQ-185 format: snapshot re-recorded when the owner approves (REQ-224); readers list | keep — snapshot is recorded at authoring under the new exception |
| 3 | `functional-requirements.md:4419` | deciding rule ids shape a prompt only in arms C and D (REQ-230) | keep — R reads no deciding rules |
| 4 | `functional-requirements.md:4424` | REQ-185: no case approved by an agent; only the owner's verdict (REQ-224) | amend (REQ-185 block) |
| 5 | `functional-requirements.md:4431` | REQ-185 dependency on REQ-224 | keep |
| 6 | `functional-requirements.md:4433` | REQ-185 dependency on REQ-230 | keep |
| 7 | `functional-requirements.md:4450` | REQ-186 judge inputs: an arm's prompt (REQ-230); the rubric (REQ-187) | keep — R's attached excerpts equal A's |
| 8 | `functional-requirements.md:4452` | REQ-186: rubric revision identifies text and judge inputs | keep — a G5 bump follows this rule |
| 9 | `functional-requirements.md:4457` | REQ-186: two runs comparable only when rubric revision matches | keep |
| 10 | `functional-requirements.md:4467` | REQ-186 dependency on REQ-187 | keep |
| 11 | `functional-requirements.md:4471` | REQ-186 dependency on REQ-230 | keep |
| 12 | `functional-requirements.md:4479` | `### REQ-187` heading | amend (REQ-187 block) |
| 13 | `functional-requirements.md:4484` | Correctness 2: reaches the same outcome | amend (REQ-187 block) |
| 14 | `functional-requirements.md:4533` | REQ-188: speed read from the compare report's slower-than-budget count (REQ-228) | keep — that count stays |
| 15 | `functional-requirements.md:4554` | REQ-189: headline counts REQ-187 defines | keep |
| 16 | `functional-requirements.md:4559` | REQ-189: a record from before a change counts as ungraded (REQ-187) | keep |
| 17 | `functional-requirements.md:4560` | REQ-189: experiment runs compared by REQ-228 | keep |
| 18 | `functional-requirements.md:4562` | REQ-189: apply command rewrites coverage (REQ-224) | keep — build rewrites coverage with the coverage command |
| 19 | `functional-requirements.md:4568` | REQ-189 dependency on REQ-187 | keep |
| 20 | `functional-requirements.md:4572` | REQ-189 dependency on REQ-224 | keep |
| 21 | `functional-requirements.md:5868` | REQ-223 coverage command; apply rewrites the file (REQ-224) | keep |
| 22 | `functional-requirements.md:5876` | REQ-223 dependency on REQ-224 | keep |
| 23 | `functional-requirements.md:5881` | `### REQ-224` heading | amend (REQ-224 block) |
| 24 | `functional-requirements.md:5891` | REQ-224: no agent sets approved, one exception | amend (REQ-224 block) |
| 25 | `functional-requirements.md:5909` | REQ-225: stale case re-approved through REQ-224; headline REQ-187 | keep |
| 26 | `functional-requirements.md:5917` | REQ-225 dependency on REQ-187 | keep |
| 27 | `functional-requirements.md:5920` | REQ-225 dependency on REQ-224 | keep |
| 28 | `functional-requirements.md:5927` | REQ-226 description: diagnostic prompt arms (REQ-230) | keep |
| 29 | `functional-requirements.md:5933` | REQ-226: record key includes arm (REQ-230) | keep — R is one more arm value |
| 30 | `functional-requirements.md:5935` | REQ-226 identity record; latency held against budget (REQ-228) | keep |
| 31 | `functional-requirements.md:5947` | REQ-226 dependency on REQ-228 | keep |
| 32 | `functional-requirements.md:5948` | REQ-226 dependency on REQ-230 | keep |
| 33 | `functional-requirements.md:5974` | `### REQ-228` heading | amend (REQ-228 block) |
| 34 | `functional-requirements.md:5981` | REQ-228: right = Correctness 2 (REQ-187); majority and unstable rule | keep — meaning of "right" unchanged; G5 changes what earns a 2 |
| 35 | `functional-requirements.md:5983` | REQ-228: breakdowns by tier and request kind | keep — new counts fall under it |
| 36 | `functional-requirements.md:5985` | REQ-228: diagnostic arms printed as "diagnostic control" | keep — R is diagnostic |
| 37 | `functional-requirements.md:5994` | REQ-228 dependency on REQ-187 | keep |
| 38 | `functional-requirements.md:5995` | REQ-228 dependency on REQ-230 | keep |
| 39 | `functional-requirements.md:6028` | `### REQ-230` heading | amend (REQ-230 block) |
| 40 | `functional-requirements.md:6038` | REQ-230: B and P on held-out only when frozen | amend (REQ-230 block) |
| 41 | `functional-requirements.md:6039` | REQ-230: seeded command; `-- --check` fails if files would change | amend (REQ-230 block) |
| 42 | `functional-requirements.md:6049` | REQ-230 dependency on REQ-228 | keep |
| 43 | `PRD/sections/non-functional-requirements.md:304` | NFR-018: diagnostic arms confined to a diagnostic set apart from held-out (REQ-228, REQ-230) | keep — still true |
| 44 | `non-functional-requirements.md:315` | NFR-018 dependency list incl. REQ-187 | keep |
| 45 | `non-functional-requirements.md:316` | NFR-018 dependency list incl. REQ-224 | keep |
| 46 | `non-functional-requirements.md:317` | NFR-018 dependency list incl. REQ-228, REQ-230 | keep |
| 47 | `PRD/sections/system-map.md:475` | Rules corpus node backed by REQ-224 | keep |
| 48 | `system-map.md:501` | Answer-quality node summary: arms on a diagnostic set apart from held-out | keep — still true |
| 49 | `system-map.md:503` | Answer-quality node backed by REQ-187, 228, 230 | keep |
| 50 | `system-map.md:510` | Offline gate node backed by REQ-224 | keep |
| 51 | `apps/backend/src/eval/worked-solutions/README.md:161` | heading "The owner review flow (REQ-224)" | keep |
| 52 | `worked-solutions/README.md:175` | "Nothing else writes `approved`." | build — name the define-gate exception (if REQ-224 accepted) |
| 53 | `worked-solutions/README.md:230` | heading for REQ-226 to REQ-230 | keep |
| 54 | `worked-solutions/README.md:252` | Paired report usage (REQ-228) | build — add the `--repeats` selectors |
| 55 | `worked-solutions/README.md:262` | Arms and manifests (REQ-230) | build — add arm R, the append, the new `--check` |
| 56 | `apps/backend/src/eval/answer-quality/rubric.ts:1` | header "(REQ-187)" | keep |
| 57 | `rubric.ts:9` | REQ-187 constraint comment | keep |
| 58 | `rubric.ts:13` | axes change only by amending REQ-187 | keep |
| 59 | `rubric.ts:38` | Correctness level 2 text | build — new text (if REQ-187 accepted) |
| 60 | `rubric.ts:73` | revision bumped when an axis changes | build — new revision constant (if accepted) |
| 61 | `rubric.ts:81` | earlier revision incomparable | build — comment names the new revision (if accepted) |
| 62 | `rubric.ts:99` | headline figure (REQ-187) | keep |
| 63 | `scripts/rules-review.mjs:1` | review commands (REQ-224) | keep — render/apply unchanged |
| 64 | `scripts/build-answer-quality-manifests.mjs:2` | manifests for REQ-230 | keep |
| 65 | `build-answer-quality-manifests.mjs:18` | `--check` "exits 1 if they would change" | build — new `--check` meaning and `--append-diagnostic` usage |
| 66 | `scripts/eval-answer-quality.test.mjs:1434` | Slice E (REQ-230) test header | keep |
| 67 | `eval-answer-quality.test.mjs:1440` | "the arms are A, B, C, D, P" | build — the list gains R |
| 68 | `scripts/lib/diagnostic-arms.test.mjs:241` | C, D and P refused outside diagnostic | build — add R |
| 69 | `diagnostic-arms.test.mjs:258` | B and P on held-out only when frozen | build — add R |
| 70 | `scripts/lib/rules-review.mjs:1` | review flow logic (REQ-224) | keep |
| 71 | `apps/backend/src/eval/answer-quality/judge.ts:9` | judge inputs incl. rubric (REQ-187) | keep — judge prompt reads the rubric text, so G5 reaches it without a judge edit |
| 72 | `scripts/build-answer-quality-manifests.test.mjs:153` | test name: byte-for-byte reproduction is `--check` | build — rename to the verification meaning |
| 73 | `scripts/lib/rule-availability.mjs:75` | rules an arm added to excerpts (REQ-230) | keep — R adds none |
| 74 | `scripts/lib/experiment-run.mjs:32` | arm A only arm a routine run uses | keep |
| 75 | `experiment-run.mjs:255` | production timeout recorded (REQ-228) | keep |
| 76 | `experiment-run.mjs:280` | breakdown keys (REQ-228) | keep |
| 77 | `experiment-run.mjs:365` | arm prompt built via deps (REQ-230) | keep |
| 78 | `experiment-run.mjs:724` | non-A arms flagged diagnostic | keep |
| 79 | `apps/backend/src/eval/answer-quality/artifact.test.ts:305` | refuses comparison across rubric revisions | build — follows the new revision constant (if REQ-187 accepted) |
| 80 | `apps/backend/src/eval/answer-quality/artifact.ts:59` | headline count (REQ-187) | keep |
| 81 | `artifact.ts:76` | headline per tier group (REQ-187) | keep |
| 82 | `scripts/eval-answer-compare.mjs:1` | compare CLI header (REQ-228) | build — header usage lines gain `--repeats` selectors |
| 83 | `scripts/diagnostic-arms-check.mjs:2` | offline arm check (REQ-230) | build — add R's exactly-once check |
| 84 | `diagnostic-arms-check.mjs:12` | B's observations (REQ-230) | keep |
| 85 | `scripts/eval-answer-quality.mjs:591` | REQ-187 headline in summary | keep |
| 86 | `eval-answer-quality.mjs:954` | arm sets loader (REQ-230) | build — also loads R's file |
| 87 | `eval-answer-quality.mjs:1011` | only deciding rule ids reach an arm | keep |
| 88 | `eval-answer-quality.mjs:1030` | production timeout (REQ-228) | keep |
| 89 | `eval-answer-quality.mjs:1111` | where arms run: C and D diagnostic, B and P also held-out | build — B, P and R |
| 90 | `scripts/lib/answer-compare.mjs:1` | compare header (REQ-228) | keep |
| 91 | `answer-compare.mjs:6` | right = Correctness 2 (REQ-187) | keep |
| 92 | `answer-compare.mjs:15` | diagnostic arms printed apart | keep |
| 93 | `answer-compare.mjs:176` | per-side latency, errors, tokens, cost | build — adds answer-level right count and right-but-over-budget |
| 94 | `scripts/lib/diagnostic-arms.mjs:1` | header listing arms A–P | build — add R |
| 95 | `diagnostic-arms.mjs:37` | registry comment: B and P on held-out | build — add R |
| 96 | `diagnostic-arms.mjs:298` | bundle is mechanical (REQ-230) | keep |
| 97 | `diagnostic-arms.mjs:400` | `validateArmUse` doc | keep |
| 98 | `diagnostic-arms.mjs:402` | "B and P run elsewhere only on held-out" | build — B, P and R |
| 99 | `apps/backend/src/eval/answer-quality/rubric.test.ts:4` | rubric test header | keep |
| 100 | `rubric.test.ts:20` | revision moved when judge inputs changed | keep — a new test for the G5 revision is added beside it |
| 101 | `scripts/lib/answer-quality-run.mjs:165` | headline (REQ-187) | keep |
| 102 | `docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md:135` | historical finding citing REQ-224 | keep — historical record |
| 103 | `OFFLINE-FINDINGS.md:161` | historical: manifests reproduced under `-- --check` | keep — historical record, true when written |
| 104 | `docs/eval/answer-quality-investigation/RUNBOOK.md:53` | historical runbook row "arms A, B, C, D" | keep — historical record |

Count check: amend = rows 1, 4, 12, 13, 23, 24, 33, 39, 40, 41 (10); build =
rows 52, 54, 55, 59, 60, 61, 65, 67, 68, 69, 72, 79, 82, 83, 86, 89, 93, 94, 95,
98 (20; rows 59–61 and 79 apply only if REQ-187 is accepted, row 52 only if
REQ-224 is accepted); keep = the other 74. A heading row marked amend means the
block's diff edits lines inside that requirement which the grep pattern does not
itself match (Description, notes, other criteria); each such line is shown in
full in its block.
