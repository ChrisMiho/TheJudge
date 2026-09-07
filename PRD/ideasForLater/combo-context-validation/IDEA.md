# Combo-grounded validation of context quality

## Problem

We validate the rules-question pipeline mostly against hand-authored fixtures
and (newly) six official rulebook worked examples, but we still can't answer the
owner's real question: is the **context we generate** actually good enough for the
model to reason correctly? The just-shipped multi-card Quick Question feature
gives us a lever — the Commander Spellbook combo corpus is a large, already
committed, **labeled** set of resolved multi-card interactions (each combo carries
its ingredient cards plus its documented result/steps), so it is ground truth we
already own.

## Outcome

Two parts. **(A) Deterministic, free:** auto-generate test cases from the combo
corpus — attach all of a combo's cards → expect the matcher to classify it
COMPLETE and surface it; drop one card → expect PARTIAL and that it names the
removed card's role as the missing piece; attach unrelated cards → expect no
false combo. This validates the shipped multi-card + partial-combo behavior
(REQ-167 / REQ-094 / REQ-095) against real ground truth at scale, with no model
calls. **(B) Live diagnostic:** run those cases through the real prompt pipeline
against a live provider and compare the model's answer to the combo's known
result/steps — but the goal is **diagnostic, not pass/fail**: when the model gets
a combo wrong, identify which aspects of the generated context (System 3 rules
retrieval, card metadata/rulings) were missing or insufficient and led it there.
Because a combo always gets combo-context, this specifically probes whether the
**broader** context pulls its weight, and yields a gap analysis of what's missing.

## Non-goals

- Not a new runtime feature or user-facing behavior; this is validation/eval
  tooling and investigation. It never enters a live player's prompt.
- Not grading single-card rulings or non-combo edge cases (layers, LKI) — the
  rulebook worked-solutions track (NFR-018) covers a different slice; these are
  complementary.
- Not a card-recommendation or answer-generation feature.

## Owner direction (input, not settled truth)

- Owner explicitly accepts **live provider costs** (no live API spend has been
  incurred so far) and **subagent-parallelized** test-case generation ("lots of
  tokens to use").
- Existing precedent to build on / extend: `scripts/compare-combo-answer-quality.mjs`
  (an opt-in, `--confirm-live-calls`, human-reviewed live combo answer-comparison
  harness — REQ-146 / DEC-161) and the eval harness (`apps/backend/src/eval/`,
  REQ-032 / DEC-047). Combo corpus: `apps/backend/data/commander-spellbook`.

## Open framing questions for refinement

1. Deliverable shape: (1) a durable, repeatable eval harness in the repo, (2) a
   one-time diagnostic investigation producing a context gap-analysis report, or
   (3) both — and does the live diagnostic fit `graph-run` (ship a feature/tool)
   or `thejudge-sweep` (investigate-and-report over a corpus)?
2. The live leg's sampling and budget: how many combos, chosen how, and any
   spend ceiling.
3. How failures get categorized — an automated LLM-judge that tags the missing-
   context category, human review, or a mix — and what a "wrong decision" is
   graded against (the combo's steps/result, which are player-facing prose).

## Relation to prior work

Direct follow-up to `prompt-context-refinement` (multi-card Quick Question +
partial-combo, shipped via PR #152). Extends the validation goal behind NFR-018.
