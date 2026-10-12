# Graph-run brief — follow-ups keep their rules, and the eval learns to push back

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.
Probe: `PRD/work/probe-prompt-format-tuning/` (2026-10-10).

## What the player gets

When a player answers Luna's ruling with "that's wrong, check again" (or any
follow-up), Luna re-checks against **the same rules she used the first time**.
Today those rules vanish on the follow-up. She then re-checks without them, and
in about one follow-up in six she tells the player a rule she just quoted
"wasn't provided". With the fix she stands by a right ruling, quotes the rule
she relied on, and corrects a wrong one at least as often as today.

The owner's definition of "100%" is this behavior: if Luna isn't right the first
time, being told she's wrong makes her re-evaluate and land on the right answer.
Right answers must hold, not cave. The second half of this build makes that
measurable on demand.

## Why (measured — do not re-derive)

**The defect.** On a follow-up, rule retrieval (System 3, the 10 supplemental
rule excerpts) is scored against the follow-up text alone:
`buildRetrievalQueryText` in `apps/backend/src/prompt/preparation.ts:105` uses
`request.question` (the follow-up) plus the card signal for Quick Lookup, and
`buildQueryText(context)` for In-Depth. The keyword half of retrieval also sees
only the follow-up. So a follow-up such as "I don't think that's right. Can you
check it again?" retrieves mostly unrelated rules.

**The test.** 62 committed corpus cases (18 hard layer/timing + 44 ordinary),
3 repeats each = 186 two-turn conversations per arm. Turn 1 was production;
turn 2 was a production follow-up (`conversationHistory` per REQ-027) with the
scripted text above. Judge gpt-6.1-sol, rubric `2026-10-10.1`, "right" =
Correctness 2. Only turn 2's rule-excerpt block differed between arms (verified
by rebuilding production's own block byte-identically).

| | Today | Arm Q (retrieve on first question + follow-up) | **Arm C (reuse turn 1's excerpts)** |
| --- | --- | --- | --- |
| Right ruling held | 176 | 170 | 172 |
| Right ruling flipped (outcome / side detail) | 5 (1 / 4) | 11 (0 / 11) | 5 (2 / 3) |
| Wrong ruling fixed | 4 | 3 | **7** |
| Still wrong | 1 | 2 | 2 |
| Turn-2 excerpts shared with turn 1 | 1.5 of 10 | 8.4 of 10 | 10 of 10 |
| Judge grounding, turn 1 → turn 2 (0–2) | 0.66 → **0.26** | 0.67 → 0.68 | 0.64 → 0.69 |
| Follow-ups saying a cited rule "wasn't provided" | **29 of 186** | 0 | 0 |
| Turn-2 time, median / max | 6.1 s / 27.6 s | 6.1 s / 30.1 s | 5.6 s / 23.4 s |
| Cost per arm (answers + judge) | $2.42 | $2.48 | $2.44 |

- Arm C wins: it ends the "wasn't provided" problem and restores grounding, it
  fixed the most wrong rulings (all of the Necropotence + Silence +
  Borne Upon a Wind cleanup conversations), it doesn't raise the flip rate
  (5 = 5), and it's the fastest.
- Arm Q doubled side-detail flips. It hands Luna one or two new rules on the
  re-check, and she uses them to add a wrong caveat.
- The flip and fix counts are small and partly judge noise. In the baseline, 2 or
  3 of the 4 side flips were judge errors on unchanged answers. The robust
  results are grounding and "wasn't provided".
- Turn 1 accuracy matched across arms: 181, 181 and 177 of 186.

**Pushback behavior today is already sound.** Of 181 right first answers, Luna
held 176 and caved on the outcome once. So this build fixes the evidence she
re-checks with; it doesn't fix any willingness to cave.

## Decisions already made — do not re-litigate

- **Carry forward, don't re-retrieve.** A follow-up's supplemental rule excerpts
  are the conversation's first-turn excerpts, in the same order. Retrieving on
  "first question + follow-up" was tested and lost (arm Q above).
- **Luna's reasoning effort stays at the default (medium).** Measured on the
  hard set, 108 answers each: low 88, medium 101, high 94. High put 7 answers
  over 30 s. Not part of this build.
- **No prompt-format change rides along.** Four "deliberate more" variants all
  lost to today's prompt on the hard set: the layer/timing recipe (96/108),
  describe-tasks-then-rule (96/108), high effort (94/108), and adding the
  battlefield/stack curated topics to Quick Lookup (46 vs 48 of 54 on the corpus
  hard Quick Lookup cases).
- **The pushback eval is scored as held / flipped (outcome vs side) / fixed /
  still wrong.** "Flipped on outcome" is the number that must stay near zero.
- **The practice suite stays out of this build.** All evidence above is committed corpus
  cases. No practice-suite data, ids or results go into any committed file.

## Design direction (converged)

1. **Follow-up retrieval carries forward.** For any request with
   `conversationHistory`, System 3 supplemental excerpts are the ones the
   conversation's opening question retrieved (opening question + the frozen
   cards/game context), not the follow-up text. Both halves of retrieval move
   together. The trap: changing only the embedded query text keeps just 4.3 of
   10 rules, because the keyword half still scores the follow-up.
   - **Recommended mechanism:** the backend stays stateless and no API change is
     needed (REQ-074 forbids an `AskAiRequest` change). Re-run retrieval on the
     first user message in `conversationHistory` with the frozen context. Turn 1
     used the same inputs, so it yields the same excerpts. Refinement confirms
     retrieval is deterministic for identical inputs (local MiniLM embedder +
     keyword scorer); if not, decide between a cache and an API field.
   - Applies to Quick Lookup and In-Depth follow-ups alike. Turn-1 prompts are
     byte-unchanged.
   - Curated topics (System 2), card rulings and card details already come from
     the frozen context. Leave them as they are.
2. **Answer-quality eval gains a follow-up mode.** `scripts/eval-answer-quality.mjs`
   today never sends `conversationHistory` ("model and input only", REQ-188).
   Add an opt-in two-turn mode: turn 1 production, turn 2 a production follow-up
   with a fixed pushback text. Judge both turns alone against the reference, and
   report held / flipped (outcome, side) / fixed / still wrong, turn-2 grounding,
   turn-2 latency against the 30 s budget, and the count of answers disowning a
   cited rule. It keeps the existing confirmation gate, cost cap, honesty checks
   (local embedder, reported model) and manifest/repeat machinery. The probe
   scripts below are a working reference.

## Current-state PRD truth to amend

Name only; refinement writes them.

- `PRD/sections/functional-requirements.md`:
  - **REQ-178** (System 3 query is built from the question plus a compact card
    signal): add that on a follow-up the query is the conversation's opening
    question, not the follow-up.
  - **REQ-074** (Quick Lookup prompt assembly): the `CONVERSATION HISTORY` bullet
    gains the carried-forward excerpts rule.
  - The In-Depth equivalent (REQ-022 general game-rules enrichment, and the
    game-mode query builder it governs).
  - **REQ-027** (follow-up contract): no payload change; note the retrieval
    behavior.
  - **REQ-188 / REQ-230**: the answer-quality eval's follow-up mode, or a new
    REQ in that family.
- `PRD/sections/quick-lookup/README.md` and `PRD/sections/in-depth/README.md`, if
  they describe follow-up prompt contents.
- The decision log is retired: amend in place, no new DEC.

## Constraints (don't rediscover)

- **Mock provider:** follow-ups still print the exact assembled prompt (REQ-027).
  The carried-forward excerpts must appear in it.
- **30 s answer budget:** unchanged. Arm C's turn 2 was faster than today.
- **Paid runs refuse a checkout with untracked files.** Run from a clean
  worktree (`git worktree add --detach .worktrees/<name> origin/main`, then
  `npm ci` and `node scripts/warm-embedding-model-cache.mjs`).
- **Honesty on every eval run:** each record's `embeddingProvider` is `local` and
  `reportedModel` is the requested model, with no silent lexical fallback.
- **Known limit, not in scope:** a follow-up that raises a new topic gets no new
  rules under carry-forward. Merging fresh follow-up results below the carried
  rules is untested; arm Q suggests extra rules on a re-check can add wrong
  caveats. Park it as an open question and don't build it here.
- **Judge noise:** 2–3 of 4 baseline side flips were judge errors. Any decision
  rule for the new eval mode should weigh outcome flips, not side flips alone.

## Evidence + reusable tooling

All in `PRD/work/probe-prompt-format-tuning/` (untracked; a pointer, not
needed for the decisions above):

- `runs/pushback/`, `runs/pushback-q/`, `runs/pushback-c/`: records
  (`records.jsonl`, corpus only) and the two-turn probe scripts
  (`pushback-probe.mjs`, `pushback-fix-probe.mjs --arm q|c`, `analyze.mjs`,
  `compare.mjs`).
- `PROBE.md`: the full ledger, including the effort, recipe, task-breakdown and
  lookup-topic tests that ruled out the alternatives.
- `FINDINGS-suite-passes.md`: where Luna disagrees on the local practice suite
  (counts only). This is the input for the next probe, not for this build.

## What the graph run should produce

A DESIGN-BRIEF plus amendments to REQ-178 / REQ-074 / the In-Depth enrichment
REQ / REQ-027, and an eval REQ, all decided above. Two slices are likely:

1. Follow-up retrieval carry-forward, both modes, with unit tests:
   - a follow-up's selected rule ids equal its opening question's;
   - the keyword half included;
   - the mock prompt shows them;
   - turn-1 prompts unchanged.
2. The eval's follow-up mode.

Acceptance check after merge (owner launches, paid, ≤ $15): the new eval mode on
the same 62 corpus cases × 3. It should reproduce arm C:
- grounding on turn 2 at or above turn 1;
- 0 follow-ups disowning a cited rule;
- outcome flips no higher than today's;
- no turn-2 answer over 30 s.
