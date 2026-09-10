# Gate questions — rule-excerpt-cap-ten (define gate)

These are proposed edits to durable product truth in `PRD/sections/`. They are
**not** written to `PRD/sections/` yet — build applies the accepted ones. Answer
each block's `Verdict` with `accept`, `edit` (say what to change), or `reject`.

**The one decision running through all fourteen blocks:** when a player asks Ask
AI a rules question, the app attaches the most relevant official Comprehensive
Rules excerpts to the prompt. Today it attaches at most **five**. Every block
below moves that number to **ten**. The five excerpts a question already gets
stay the same five in the same order; five more are added beneath them.

The measurement behind it, already recorded in `PRD/sections/`: on the 18-case
worked-solution gold set the deployed model `gpt-4.1` answered 16 of 18
correctly at five excerpts and **18 of 18 at ten**, at unchanged answer latency
(3.4 → 3.5 seconds).

Two blocks carry a second decision the owner may want to steer separately:
**REQ-032** (how deep the eval harness checks retrieval) and **REQ-190** (which
two cap values the offline answer-quality run compares from now on).

Not changed anywhere: the Commander Spellbook **combo-variant** cap of five
(REQ-094/095) and the **5-card attach limit** (REQ-167). Those are different
numbers in different systems.

---

## REQ-022 — the prompt's supplemental rules section carries ten excerpts, not five

**What this decides:** how many official rule excerpts the app is required to
attach to every AI prompt — five (today) or ten.

**In plain terms:** REQ-022 is the requirement that every prompt TheJudge sends
carries verbatim Wizards Comprehensive Rules text as reference. It has two
halves: a curated always-on set chosen from the submitted game state ("System 2")
and a search that picks rules matching the specific question asked ("System 3").
This block moves the System 3 half from five excerpts to ten. Nothing about the
curated half, the section's position in the prompt, or the rule that a
supplemental rule already shown in the curated set is dropped as a duplicate
(REQ-179) changes.

**What happens if you say no:** the requirement keeps saying five, and the
measured two-case gain on hard questions is not taken.

```diff
@@ REQ-022 Acceptance Criteria @@
-  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 5 rules scored per DEC-046 against the request context
+  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 10 rules scored per DEC-046 against the request context
```

```diff
@@ REQ-022 Notes @@
-  - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fallback under REQ-181; the section's placement, five-excerpt cap, and System 2 deduplication are unchanged
+  - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fallback under REQ-181; the section's placement and System 2 deduplication are unchanged. The cap moved from five excerpts to ten (2026-09-09, `rule-excerpt-cap-ten`) on the measured result that the deployed model `gpt-4.1` scored 16/18 on the worked-solution gold set at five and 18/18 at ten, at unchanged answer latency (REQ-190)
```

- Verdict:
- Reason:

---

## REQ-032 — the retrieval test checks the ten rules production now attaches, not five

**What this decides:** how deep the offline retrieval test looks when it checks
whether the right rule was found and whether a known-irrelevant rule crept in —
the top five results (today) or the top ten.

**In plain terms:** REQ-032 is the automated check that runs on a set of labelled
example questions and asks two things of the rules search: did it retrieve the
rule this question needs, and did it keep out the rules this question must not
get? Both currently look at the top five results, because five is what production
attached. If production attaches ten, both should look at ten — otherwise the
test stops describing the product.

Moving to ten cuts both ways on purpose. The "did it find the right rule" check
gets **easier** — a rule ranked eighth now counts as found, and it should, because
the player's prompt now carries it. The "did it keep the bad rule out" check gets
**harder** — an irrelevant rule ranked eighth now fails, and it should, for the
same reason. The tuning report that shows a human the same ranking follows to ten
as well.

There is a real chance this surfaces a failure on first run: an existing example
question may have a forbidden rule sitting at rank six through ten. That is a
true finding about what the deeper cap attaches, and gets recorded rather than
hidden by relaxing the check back.

**What happens if you say no:** the test keeps measuring the top five while
production attaches ten, so it no longer tells you whether the shipped retrieval
is right, in either direction.

```diff
@@ REQ-032 Acceptance Criteria @@
-  - harness check `system3-expected-recall` passes when every `expectedSupplementalRuleIds` entry appears in System 3 top-5 retrieval results
-  - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-5
+  - harness check `system3-expected-recall` passes when every `expectedSupplementalRuleIds` entry appears in System 3 top-10 retrieval results
+  - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-10
```

```diff
@@ REQ-032 Acceptance Criteria @@
-  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-5 with scores, recall hit/miss); may be a script output or harness report artifact
+  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-10 with scores, recall hit/miss); may be a script output or harness report artifact
```

- Verdict:
- Reason:

---

## REQ-178 — the query-construction requirement stops asserting five excerpts

**What this decides:** whether REQ-178's promise that it changed nothing about
prompt text still names the old cap of five.

**In plain terms:** REQ-178 is the change that made the rules search build its
query from a card's name, type line, and keywords instead of the card's full
rules text. Its criterion states that the assembled prompt is otherwise
untouched, and in doing so restates the excerpt count. That restatement now says
five; it becomes ten. REQ-178's own behaviour is unchanged.

**What happens if you say no:** REQ-178 keeps asserting a cap of five that the
product no longer has, and the two requirements contradict each other.

```diff
@@ REQ-178 Acceptance Criteria @@
-  - the assembled prompt text is unchanged by this requirement: card oracle text still renders in its own card sections exactly as today, and the supplemental section still carries up to 5 excerpts
+  - the assembled prompt text is unchanged by this requirement: card oracle text still renders in its own card sections exactly as today, and the supplemental section still carries up to 10 excerpts
```

- Verdict:
- Reason:

---

## REQ-181 — the semantic-retrieval requirement fills ten slots, not five

**What this decides:** whether the requirement that owns meaning-based rule
search describes a five-excerpt slot or a ten-excerpt one — including on the
fallback path when the meaning-based search fails.

**In plain terms:** REQ-181 is what made the rules search rank by meaning rather
than by matching words: a committed file holds one meaning-vector per rule, the
player's question is turned into a vector at request time, and the closest rules
win. It describes the space it fills as System 3's "existing five-excerpt slot",
and it repeats the number twice more — once for the fallback that runs when the
meaning-based search fails and the app drops back to plain word matching, and
once for the criterion that fixes the cap. All three move to ten, so the fallback
path attaches ten too and a player never gets a shorter answer just because the
embedding step failed.

**What happens if you say no:** the requirement that actually owns the retrieval
mechanism keeps saying five, so the constant and the spec disagree about the
shipped product.

```diff
@@ REQ-181 Description @@
-- Description: System 3 supplemental rule retrieval ranks Comprehensive Rules excerpts by semantic similarity between the player's question and the rule corpus, not by lexical word overlap alone. A committed offline artifact holds one embedding vector per rule; at request time the query is embedded and cosine-ranked against those vectors to fill System 3's existing five-excerpt slot. The query embedder is selected by an explicit provider flag that mirrors the existing `ASK_AI_PROVIDER` boundary.
+- Description: System 3 supplemental rule retrieval ranks Comprehensive Rules excerpts by semantic similarity between the player's question and the rule corpus, not by lexical word overlap alone. A committed offline artifact holds one embedding vector per rule; at request time the query is embedded and cosine-ranked against those vectors to fill System 3's ten-excerpt slot. The query embedder is selected by an explicit provider flag that mirrors the existing `ASK_AI_PROVIDER` boundary.
```

```diff
@@ REQ-181 Acceptance Criteria @@
-  - on any embedding failure — model load, inference error, missing artifact, provider error — System 3 falls back to lexical retrieval, still returns up to 5 excerpts, and emits one diagnostic warning
-  - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)
+  - on any embedding failure — model load, inference error, missing artifact, provider error — System 3 falls back to lexical retrieval, still returns up to 10 excerpts, and emits one diagnostic warning
+  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)
```

- Verdict:
- Reason:

---

## REQ-182 — the shipped ranking caps at ten, and records when to revisit it

**What this decides:** two things — that the requirement owning today's shipped
ranking says ten, and that it records the one condition under which ten should be
reconsidered.

**In plain terms:** REQ-182 is the ranking the product actually ships: one blended
score that mixes meaning-similarity with word-overlap, so a short lookup question
("Lightning Bolt, instant, damage") still finds its exact rule while an ordinary
question benefits from meaning. Its criterion restates the cap, which becomes ten.

The second half is a warning worth writing down. The same measurement that made
ten the right answer for our deployed model showed ten making **smaller** models
worse: `gpt-4.1-mini` dropped from 17 correct to 15 and `gpt-5-nano` from 15 to
13, because extra lower-ranked excerpts distract a smaller model more than they
help it. We deploy `gpt-4.1`, which gains, so this costs nothing today — but if
the deployed model is ever swapped for a smaller one to save money or latency,
the cap has to be re-decided at the same time. That is recorded as a note here so
the next person changing the model finds it.

**What happens if you say no:** the shipped-ranking requirement keeps saying
five, and the smaller-model trap stays undocumented — a future model swap
silently ships a worse product.

```diff
@@ REQ-182 Acceptance Criteria @@
-  - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179), and the prompt's section placement is unchanged
+  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179), and the prompt's section placement is unchanged
```

```diff
@@ REQ-182 Notes (append one note after the existing final note) @@
   - the prior state this replaces: `gameRulesRetrieval.ts` chose `scoreEntrySemantic` or `scoreEntry` for the whole index with no blend, which is why REQ-181's notes recorded that no fusion score had been measured
+  - the cap moved from 5 to 10 excerpts on 2026-09-09 (`rule-excerpt-cap-ten`) on REQ-190's run-3 measurement, which is model-dependent: the deployed `gpt-4.1` improved 16 → 18 fully correct of 18, while the smaller `gpt-4.1-mini` regressed 17 → 15 and `gpt-5-nano` 15 → 13 — extra lower-ranked excerpts distract a smaller model more than they inform it. If the deployed answer model is ever changed to a smaller one, this cap is re-decided in the same package, not inherited
```

- Verdict:
- Reason:

---

## REQ-185 — the gold-set note re-records retrieval at the new production cap

**What this decides:** whether the recorded figure for "how often the deciding
rule was retrieved" is restated against the new cap of ten.

**In plain terms:** REQ-185 is the committed set of 18 hard rules questions whose
correct answers are published by Wizards, used to check whether the app's prompt
actually resolves a hard case. One of its recorded measurements says
`npm run eval:worked-solutions` found the deciding rule for 14 of 18 cases "at
the production cap of five". Once production is ten, that number becomes 16 of
18 — two more cases reach the model. The 2026-09-07 measurement stays where it
is as history; the new default is added beside it.

**What happens if you say no:** the gold set's recorded retrieval figure keeps
describing a cap the product no longer runs, and the next reader takes 14/18 as
today's number.

```diff
@@ REQ-185 Acceptance Criteria @@
-  - measured 2026-09-07: the gold set holds 18 cases (6 pre-existing plus 12 seeded at build), all tier 1 or tier 2, each carrying a `workedSolution`, a `tier`, a `source` block with the citation its tier requires, a non-empty `whyHard`, and at least one expected rule id; `npm run eval:worked-solutions` reports 14/18 retrieved at the production cap of five — the four misses (three tier-2 card-ruling cases and one tier-1 combat-damage case) are expected and recorded, not corrected, since REQ-190 notes tier-2 cases are not known to be retrieval-saturated and a miss here is a concrete signal for tuning, never a build failure (that first measurement asked the bare question and ranked lexically; re-measured 2026-09-07 after the check gained production fidelity — card attached, question embedded by the local provider, 18/18 ranked semantically — it is still 14/18 at cap 5 with the same four misses, matching answer-quality run 3's per-prompt `goldRuleInPrompt`, and `EMBEDDING_PROVIDER=mock` reproduces the lexical 14/18); 31 eval fixtures exist, 10 carry an `expected` block, and 0 carry an answer; the committed rule index `apps/backend/data/gameRulesRuleIndex.json` holds 277 `Example:` lines across 215 of its 2,873 rule entries and the committed rulings index holds 76,605 rulings over 19,542 cards — the two official pools the tiers draw from, both already committed and both already served in production
+  - measured 2026-09-07: the gold set holds 18 cases (6 pre-existing plus 12 seeded at build), all tier 1 or tier 2, each carrying a `workedSolution`, a `tier`, a `source` block with the citation its tier requires, a non-empty `whyHard`, and at least one expected rule id; `npm run eval:worked-solutions` reported 14/18 retrieved at the then-production cap of five — the four misses (three tier-2 card-ruling cases and one tier-1 combat-damage case) are expected and recorded, not corrected, since REQ-190 notes tier-2 cases are not known to be retrieval-saturated and a miss here is a concrete signal for tuning, never a build failure (that first measurement asked the bare question and ranked lexically; re-measured 2026-09-07 after the check gained production fidelity — card attached, question embedded by the local provider, 18/18 ranked semantically — it was still 14/18 at cap 5 with the same four misses, matching answer-quality run 3's per-prompt `goldRuleInPrompt`, and `EMBEDDING_PROVIDER=mock` reproduces the lexical 14/18); the production cap moved to ten on 2026-09-09 (`rule-excerpt-cap-ten`), so the default run now reports 16/18 retrieved, the two added cases being 510.1c and 113.7a and the two remaining misses being tier-2 cases whose attached ruling answers them anyway (re-recorded at build); 31 eval fixtures exist, 10 carry an `expected` block, and 0 carry an answer; the committed rule index `apps/backend/data/gameRulesRuleIndex.json` holds 277 `Example:` lines across 215 of its 2,873 rule entries and the committed rulings index holds 76,605 rulings over 19,542 cards — the two official pools the tiers draw from, both already committed and both already served in production
```

- Verdict:
- Reason:

---

## REQ-188 — the run-3 record names the cap-10 row as today's product

**What this decides:** which row of the recorded model bake-off is labelled "what
the product ships today".

**In plain terms:** REQ-188 is the offline run that asks every model in a lineup
every gold question and scores the answers. Its record of run 3 ends by pointing
at the row that represents production: the deployed model `gpt-4.1` at five
excerpts. That pointer moves to the cap-10 row. Every number in the record stays
exactly as measured — only the "this row is today's product" label moves.

**What happens if you say no:** the run record keeps pointing at the cap-5 row as
production, so anyone comparing a future run against "today's baseline" compares
against the wrong leg.

```diff
@@ REQ-188 Notes @@
-  - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 estimate — the gpt-5 judge's reasoning output was far smaller than assumed): the first two runs passed no query embedding and attached no card, so both ranked lexically under a `local` label and the three tier-2 prompts carried no ruling; the prompt-fidelity criterion above was added and the run repeated. Run 3 (the committed baseline, `gitCommit b3f860f`, semantic for all 18 cases): fully correct of 18 at cap 5 / cap 10 — `gpt-4.1-mini` 17 / 15, `gpt-4.1` 16 / 18, `gpt-5-mini` 17 / 18, `gpt-5-nano` 15 / 13; mean latency `gpt-4.1` 3.4–3.5 s, `gpt-4.1-mini` 4.3–5.5 s, `gpt-5-mini` 13.5–20.7 s, `gpt-5-nano` 22.9–27.7 s; mean blind rank `gpt-4.1` 1.8, `gpt-5-mini` 1.9, `gpt-4.1-mini` 2.7–2.9, `gpt-5-nano` 3.3–3.6. The deployed model is `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`), so its cap-5 row is today's product. Full record: the `ai-answer-quality-baseline` package's slice E doc, promoted to its receipt at cleanup
+  - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 estimate — the gpt-5 judge's reasoning output was far smaller than assumed): the first two runs passed no query embedding and attached no card, so both ranked lexically under a `local` label and the three tier-2 prompts carried no ruling; the prompt-fidelity criterion above was added and the run repeated. Run 3 (the committed baseline, `gitCommit b3f860f`, semantic for all 18 cases): fully correct of 18 at cap 5 / cap 10 — `gpt-4.1-mini` 17 / 15, `gpt-4.1` 16 / 18, `gpt-5-mini` 17 / 18, `gpt-5-nano` 15 / 13; mean latency `gpt-4.1` 3.4–3.5 s, `gpt-4.1-mini` 4.3–5.5 s, `gpt-5-mini` 13.5–20.7 s, `gpt-5-nano` 22.9–27.7 s; mean blind rank `gpt-4.1` 1.8, `gpt-5-mini` 1.9, `gpt-4.1-mini` 2.7–2.9, `gpt-5-nano` 3.3–3.6. The deployed model is `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`), and this run is what moved the deployed cap from five to ten on 2026-09-09 (`rule-excerpt-cap-ten`, REQ-190), so its cap-10 row is today's product and its cap-5 row is the superseded baseline. Full record: the `ai-answer-quality-baseline` package's slice E doc, promoted to its receipt at cleanup
```

- Verdict:
- Reason:

---

## REQ-190 — the deployed cap becomes ten, and the offline run compares ten against fifteen

**What this decides:** two things. First, the actual product change — the deployed
number of rule excerpts moves from five to ten. Second, which two cap values the
offline answer-quality run compares from now on: it compares five against ten
today; the proposal makes it compare ten against fifteen.

**In plain terms:** REQ-190 is the requirement that lets the offline evaluation
answer the same question at more than one excerpt count, so the effect of
attaching more rules can be observed. It is also where the deployed number is
written down, in a criterion that reads "the deployed cap stays 5. Changing it
requires a recorded run showing a larger cap scored better." That recorded run
exists — it is run 3, in this same requirement's own notes — and this package is
the amendment it asked for.

The second half is the judgement call. The run's default comparison is five
versus ten. Once production *is* ten, running five-versus-ten each time
re-measures a question you have already answered. Changing the default to
ten-versus-fifteen keeps the instrument pointed at the open question — does even
more help? — with production always one of the two legs. Nothing is spent until
someone explicitly asks for a run; it is confirmation-gated. If you would rather
keep five-versus-ten as a regression guard, say so here and only that line
changes.

One constraint in this requirement also becomes untrue and is rewritten: it
currently promises that the larger cap "exists only inside an offline evaluation
run and never in a request a player makes". Ten is now what a player gets. The
replacement says what is actually true — answer latency was measured unchanged
for the deployed model, and end-to-end production latency against the
three-second target (NFR-002) is a separate, still-parked sampling package.

**What happens if you say no:** nothing ships. This is the block that carries the
actual cap change; the other thirteen only keep the rest of the corpus consistent
with it.

```diff
@@ REQ-190 Description @@
-- Description: An answer-quality run may answer the same gold case at more than one System 3 supplemental-excerpt cap, for every answer model in the lineup (REQ-188), and score the legs side by side, so the effect of attaching more rule excerpts on the *answer* can be observed. Production retrieval is unchanged: System 3 stays capped at five excerpts (REQ-181, REQ-182, `system-map/game-rules-retrieval.md`).
+- Description: An answer-quality run may answer the same gold case at more than one System 3 supplemental-excerpt cap, for every answer model in the lineup (REQ-188), and score the legs side by side, so the effect of attaching more rule excerpts on the *answer* can be observed. Production retrieval is one of the legs: System 3 is capped at ten excerpts (REQ-181, REQ-182, `system-map/game-rules-retrieval.md`), raised from five on 2026-09-09 by this requirement's own run-3 measurement.
```

```diff
@@ REQ-190 Acceptance Criteria @@
-  - the run accepts a repeatable `--excerpt-cap` option, defaulting to `[5, 10]`; each cap value is one leg per answer model, and every gold case is answered once per model per cap in the same run
-  - `apps/backend/src/prompt/preparation.ts` exports one named constant, `DEFAULT_SUPPLEMENTAL_RULE_CAP` (value `5`), used at all four call sites that used to hard-code the literal `5`; `PreparePromptInputOptions.supplementalRuleCap` is an optional override (default: the constant) threaded to the same `retrieveRulesForQueryWithDebug` / `retrieveSupplementalRulesWithDebug` `max` parameter production already uses
-  - a larger cap reuses the identical production ranking rather than re-ranking: `retrieveRulesForQueryWithDebug` already returns `runnerUp` as ranks 6–15 of the same scored list, so a cap-10 call's top 5 stays identical to the cap-5 call's, and slots 6–10 are drawn from that same `runnerUp` list — proven directly, not assumed, in `preparation.test.ts`
+  - the run accepts a repeatable `--excerpt-cap` option, defaulting to `[10, 15]` — the deployed cap plus the next value up, so the run always compares production against a larger candidate; each cap value is one leg per answer model, and every gold case is answered once per model per cap in the same run
+  - `apps/backend/src/prompt/preparation.ts` exports one named constant, `DEFAULT_SUPPLEMENTAL_RULE_CAP` (value `10`), used at all four production call sites; `PreparePromptInputOptions.supplementalRuleCap` is an optional override (default: the constant) threaded to the same `retrieveRulesForQueryWithDebug` / `retrieveSupplementalRulesWithDebug` `max` parameter production already uses
+  - a larger cap reuses the identical production ranking rather than re-ranking: `retrieveRulesForQueryWithDebug` returns `runnerUp` as the ranks below the cap of the same scored list, so a larger-cap call's leading excerpts stay identical to the smaller-cap call's and the added slots are drawn from that same `runnerUp` list — proven directly, not assumed, in `preparation.test.ts`
```

```diff
@@ REQ-190 Acceptance Criteria @@
-  - the deployed cap stays 5. Changing it requires a recorded run showing a larger cap scored better, and an amendment to REQ-182 and `system-map/game-rules-retrieval.md` — never a change made inside this requirement
+  - the deployed cap is 10, raised from 5 on 2026-09-09 (`rule-excerpt-cap-ten`) on the recorded run-3 measurement in the notes below. Changing it again requires the same evidence — a recorded run showing a different cap scored better for the deployed model — and an amendment to REQ-181, REQ-182, and `system-map/game-rules-retrieval.md` alongside this requirement, never a change made inside this requirement alone
```

```diff
@@ REQ-190 Constraints @@
-  - NFR-002's under-three-second answer target is untouched: the larger cap exists only inside an offline evaluation run and never in a request a player makes
+  - NFR-002's under-three-second answer target is not re-gated by the cap: the deployed model's answer latency was measured unchanged across cap 5 and cap 10 (3.4 → 3.5 s, run 3), and end-to-end production request latency has never been sampled at either cap — that sampling is a separate parked package, not a precondition of this cap
```

```diff
@@ REQ-190 Dependencies @@
-  - REQ-181 (the five-excerpt cap and the retrieval seam)
+  - REQ-181 (the excerpt cap and the retrieval seam)
```

```diff
@@ REQ-190 Notes @@
-  - measured 2026-09-07 (run 3 of the answer-quality baseline, semantic ranking, tier-2 cards attached — REQ-188's measurement note): the gold rule reached the prompt for 14 of 18 cases at cap 5 and 16 of 18 at cap 10; the two cases cap 10 adds are 510.1c (`combat-damage-assignment-order-multiple-blockers`, rank 7) and 113.7a (`sensei-top-leaves-battlefield-ability-on-stack`), and the two never reached at either cap are tier-2 cases whose attached ruling answers them anyway. On the combat-damage case, cap 5 had `gpt-4.1` at Correctness 1 and `gpt-5-mini` at 0 (both reasoning from the pre-2024 lethal-first rule) and cap 10 had every model at 2. Net per model, cap 5 → cap 10 fully correct: `gpt-4.1` 16 → 18, `gpt-5-mini` 17 → 18, `gpt-4.1-mini` 17 → 15, `gpt-5-nano` 15 → 13 — recall gain for the larger models, distraction loss for the smaller ones, at unchanged latency for `gpt-4.1` (3.4 → 3.5 s). This is the recorded run the deployed-cap criterion above asks for; changing the deployed cap remains its own package (an amendment to REQ-182 and `system-map/game-rules-retrieval.md`)
+  - measured 2026-09-07 (run 3 of the answer-quality baseline, semantic ranking, tier-2 cards attached — REQ-188's measurement note): the gold rule reached the prompt for 14 of 18 cases at cap 5 and 16 of 18 at cap 10; the two cases cap 10 adds are 510.1c (`combat-damage-assignment-order-multiple-blockers`, rank 7) and 113.7a (`sensei-top-leaves-battlefield-ability-on-stack`), and the two never reached at either cap are tier-2 cases whose attached ruling answers them anyway. On the combat-damage case, cap 5 had `gpt-4.1` at Correctness 1 and `gpt-5-mini` at 0 (both reasoning from the pre-2024 lethal-first rule) and cap 10 had every model at 2. Net per model, cap 5 → cap 10 fully correct: `gpt-4.1` 16 → 18, `gpt-5-mini` 17 → 18, `gpt-4.1-mini` 17 → 15, `gpt-5-nano` 15 → 13 — recall gain for the larger models, distraction loss for the smaller ones, at unchanged latency for `gpt-4.1` (3.4 → 3.5 s). This is the recorded run the deployed-cap criterion above asked for, and it was acted on: the `rule-excerpt-cap-ten` package raised the deployed cap to 10 on 2026-09-09, amending REQ-022, REQ-032, REQ-178, REQ-181, REQ-182, REQ-185, REQ-188, NFR-018 and the affected system-map and feature-spec text alongside this requirement. The model-dependence is the standing caveat, recorded on REQ-182: ten is right for `gpt-4.1` and wrong for the smaller models measured here
```

- Verdict:
- Reason:

---

## NFR-018 — the validation-set note re-records retrieval at the new production cap

**What this decides:** whether the non-functional record of how well the rules
search does on hard cases is restated against the new cap of ten.

**In plain terms:** NFR-018 is the standing commitment that hard rules cases are
validated against published, citable correct answers rather than a hand-written
answer key. One of its dated notes records that the check found the deciding rule
for 14 of 18 cases "at the System 3 top five". With the cap at ten that becomes 16
of 18. The 2026-09-07 record stays as history; the new figure is added.

**What happens if you say no:** this note keeps quoting a retrieval figure from a
cap the product no longer runs.

```diff
@@ NFR-018 Notes @@
-  - Measured 2026-09-07 (build): the gold set grew from 6 to 18 committed cases (REQ-185) while this amendment landed. `npm run eval:worked-solutions` reports 14/18 retrieved at the System 3 top five, and the retrieval half of this track is therefore no longer fully saturated the way the original six cases were — the four misses (three tier-2 card-ruling cases and one tier-1 case) are recorded as a concrete tuning signal, never corrected to make the number look better, and never a build failure.
+  - Measured 2026-09-07 (build): the gold set grew from 6 to 18 committed cases (REQ-185) while this amendment landed. `npm run eval:worked-solutions` reported 14/18 retrieved at the then-current System 3 top five, and the retrieval half of this track is therefore no longer fully saturated the way the original six cases were — the misses are recorded as a concrete tuning signal, never corrected to make the number look better, and never a build failure. Re-recorded 2026-09-09 (`rule-excerpt-cap-ten`): the System 3 cap moved to ten, so the default run reports 16/18 retrieved and two tier-2 misses remain, each answered by its attached ruling regardless.
```

- Verdict:
- Reason:

---

## system-map.md — the three System 3 entries say ten

**What this decides:** whether the one-page map of how TheJudge works describes
the rules search as attaching five excerpts or ten.

**In plain terms:** `system-map.md` is the index a new reader (or a new agent)
reads to learn what each part of the system does. Three of its entries mention
this cap: the rules-search entry itself, the tuning report that shows a human
what was retrieved, and the offline answer-quality run. All three move to ten.
The answer-quality entry also carries the sentence "production stays at five",
which is the sentence this whole package exists to change.

**What happens if you say no:** the system map describes a product that no longer
exists, and it is the first file anyone reads.

```diff
@@ system-map.md — System 3 supplemental rule retrieval — Summary @@
-- Summary: Selects up to 5 supplemental rule excerpts per request. The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by rule-number prefix.
+- Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-09-09, REQ-190). The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by rule-number prefix.
```

```diff
@@ system-map.md — retrieval relevance report — Summary @@
-- Summary: Digestible before/after report (System 2 topics, System 3 top-5 with scores, recall hit/miss) for tuning review. It models production retrieval the same way the eval harness does — same card-detail resolution, same query construction — and a parity test asserts the two return the same per-scenario verdict, so report output cannot drift from the gate (REQ-177). Before REQ-177 the claim was aspirational and untrue: after REQ-176 moved card-text resolution server-side, the report passed no card-detail index and reported three false scenario failures.
+- Summary: Digestible before/after report (System 2 topics, System 3 top-10 with scores, recall hit/miss) for tuning review. It models production retrieval the same way the eval harness does — same card-detail resolution, same query construction, same excerpt cap — and a parity test asserts the two return the same per-scenario verdict, so report output cannot drift from the gate (REQ-177). Before REQ-177 the claim was aspirational and untrue: after REQ-176 moved card-text resolution server-side, the report passed no card-detail index and reported three false scenario failures.
```

```diff
@@ system-map.md — answer-quality baseline — Summary @@
-- Summary: On-demand, confirmation-gated run that asks each model in a configured lineup every gold case and scores the returned answer against that case's published solution — deterministic assertions, a reference-grounded judge model stronger than every contestant, scoring alone and ranking blind side by side over four 0–2 axes, then a human review pass. Never in `quality:check`, never asserted against a golden, never a build gate. Answers each case once per System 3 excerpt cap so the deployed five-excerpt limit can be compared against a larger one on the same questions; production stays at five. Writes a small committed scores file and gitignored transcripts.
+- Summary: On-demand, confirmation-gated run that asks each model in a configured lineup every gold case and scores the returned answer against that case's published solution — deterministic assertions, a reference-grounded judge model stronger than every contestant, scoring alone and ranking blind side by side over four 0–2 axes, then a human review pass. Never in `quality:check`, never asserted against a golden, never a build gate. Answers each case once per System 3 excerpt cap so the deployed ten-excerpt limit can be compared against a larger one on the same questions; production is ten, and the run's default legs are ten and fifteen. Writes a small committed scores file and gitignored transcripts.
```

- Verdict:
- Reason:

---

## integrations-and-data.md — the prompt-contents list says ten excerpts

**What this decides:** whether the catalogue of everything a prompt carries lists
five supplemental rule excerpts or ten.

**In plain terms:** `integrations-and-data.md` lists, item by item, what goes into
a prompt: the card data, the curated rules, the official rulings, the combo
context, and the supplemental rule excerpts. Only the supplemental-excerpt line
changes, from five to ten. The line immediately below it — up to five Commander
Spellbook combo variants — is a different cap and is deliberately untouched.

**What happens if you say no:** the prompt-contents catalogue understates what is
actually sent.

```diff
@@ integrations-and-data.md — Prompt contents @@
-- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
+- up to 10 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
```

- Verdict:
- Reason:

---

## in-depth/README.md — the In-Depth Question spec says ten excerpts

**What this decides:** whether the In-Depth Question feature spec — the full
game-state flow — describes five supplemental excerpts or ten.

**In plain terms:** In-Depth Question is the flow where a player stages a whole
board and asks about it. Its spec mentions this cap twice: once describing what
the prompt builds, once in the summary list of what the prompt carries. Both move
to ten. A third line in the same file — "Combo variants: at most 5 selected per
prompt" — is the Commander Spellbook cap and stays at five.

**What happens if you say no:** the In-Depth spec and the shipped prompt disagree.

```diff
@@ in-depth/README.md — Built (supplemental rules) @@
-- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
+- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 10 supplemental rules
```

```diff
@@ in-depth/README.md — prompt contents summary @@
-- Supplemental rules: up to 5 excerpts (System 3), deduplicated against System 2.
+- Supplemental rules: up to 10 excerpts (System 3), deduplicated against System 2.
```

- Verdict:
- Reason:

---

## quick-lookup/README.md — the Quick Question spec says top ten

**What this decides:** whether the Quick Question feature spec describes the
rules search as returning the top five or the top ten.

**In plain terms:** Quick Question is the fast flow where a player asks a rules
question with no board staged and at most a few cards attached. Its retrieval
line says System 3 returns "a small capped best-ranked set (top 5)". That becomes
top 10 — the same shared cap, since both flows read one constant. The card-attach
limit of five in the same file is a different number and stays.

**What happens if you say no:** the Quick Question spec understates what its own
prompts carry.

```diff
@@ quick-lookup/README.md — Retrieval @@
-- Retrieval: System 3 returns a small capped best-ranked set (top 5), curated
+- Retrieval: System 3 returns a small capped best-ranked set (top 10), curated
```

- Verdict:
- Reason:

---

## system-map/game-rules-retrieval.md — the rules-retrieval walkthrough says ten

**What this decides:** whether the detailed walkthrough of how rules get into a
prompt describes five slots or ten.

**In plain terms:** this file is the narrative explanation of the two rules
systems — the curated always-on set and the question-driven search — written for
someone who needs to understand the mechanism rather than just its requirement
id. It names the cap four times: what the search selects, what it returns, how
many slots the supplemental block has, and the invariant line at the bottom. All
four move from five to ten.

**What happens if you say no:** the file agents and readers use to understand
rules retrieval teaches the wrong number in four places.

```diff
@@ system-map/game-rules-retrieval.md — System 3 walkthrough @@
-ranks official rule excerpts and selects at most five. Ranking is hybrid: when the
+ranks official rule excerpts and selects at most ten. Ranking is hybrid: when the
```

```diff
@@ system-map/game-rules-retrieval.md — retrieval return @@
-already in the System 2 set, and returns the top five excerpts plus debug data when
+already in the System 2 set, and returns the top ten excerpts plus debug data when
```

```diff
@@ system-map/game-rules-retrieval.md — deduplication rationale @@
-supplemental block uses its five slots for additional relevant context rather than
+supplemental block uses its ten slots for additional relevant context rather than
```

```diff
@@ system-map/game-rules-retrieval.md — invariants @@
-- System 3 is capped at five supplemental excerpts per request.
+- System 3 is capped at ten supplemental excerpts per request (raised from five on 2026-09-09, REQ-190).
```

- Verdict:
- Reason:

---

## Blocker questions

None. Every uncertainty resolved against active product truth in `PRD/sections/`
or existing tested behaviour, per the assumption ladder in
`PRD/instructions/preparation-contract.md`.

The two judgement calls that could have gone the other way are both surfaced as
editable lines inside their own blocks rather than held back as blockers, because
`PRD/sections/` gives an authoritative basis for choosing and a wrong choice is
one line to change:

- **Which two cap values the offline run compares** — proposed ten versus
  fifteen, in the REQ-190 block.
- **How deep the retrieval test checks** — proposed top ten, in the REQ-032
  block.
