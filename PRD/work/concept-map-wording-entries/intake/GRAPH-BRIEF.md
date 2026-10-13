# Graph-run brief — six card-wording entries for rule search

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

**Run this after** PR #293 (right-rules-in-order) has merged **and** after the
follow-ups build already queued from
`PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md` has shipped (owner's order,
2026-10-12). That way this build's model retrain learns from the final search
setup. Handoff:

```
/graph-kickoff "Six more card-wording entries in the concept map so rule search reaches triggered-ability, cost, casting, layer and toughness rules, with a model retrain" PRD/work/probe-concept-map-wording/GRAPH-BRIEF.md
```

## What the player gets

A player asks about a card that says "whenever", "rather than pay its mana
cost", "gain control of", "gets −2/−2", "sacrifice this creature:" or "choose
two —". Luna now gets the rules that decide that kind of question: triggered-
ability handling (603), alternative costs (118.9), layers (613), the toughness
and lethal-damage state-based actions (704.5f/g), activated-ability costs (602),
and casting (601). Today those rules often miss the prompt because the card's
wording doesn't look like rule-book wording.

## Why (measured — do not re-derive)

The concept map (`apps/backend/src/gameRulesConceptMap.ts`) turns card wording
into rule-book words before search (REQ-234). PR #293 added one entry (type-
setting wording) and it sent the missing layer rules to Luna. These six were
measured the same way on PR #293's model `rule-search-d2c2e500a4c6`: 5-fold
cross-validation over the local practice suite, where every question is scored
by a fold model that never trained on it, adding one entry at a time. Counts
only.

Baseline: check half 522 citations, tuning half 511, every-rule check 175,
hard 25: 21, corpus 442 citations / 377 every-rule cases, bench@5 130.

| # | Entry | check | tuning | every-rule check | hard 25 | corpus | bench@5 | card matches |
|---|---|---|---|---|---|---|---|---|
| 1 | Triggered abilities | 527 (+5) | 513 (+2) | 176 (+1) | 22 (+1) | 443 (+1) / 377 | 130 | 15,360 |
| 2 | Alternative cost | 525 (+3) | 511 | 176 (+1) | 21 | 442 / 377 | 130 | 148 |
| 3 | Layer wording | 523 (+1) | 516 (+5) | 175 | 22 (+1) | 443 (+1) / 377 | 130 | 968 |
| 4 | −N/−N | 523 (+1) | 513 (+2) | 175 | 21 | 442 / 377 | 130 | 491 |
| 5 | Sacrifice as cost | 523 (+1) | 512 (+1) | 175 | 21 | 442 / 377 | 130 | 1,017 |
| 6 | Casting choices | 523 (+1) | 512 (+1) | 176 (+1) | 21 | 442 / 377 | 130 | 1,023 |

Each passed the 14 labelled checks and the built-prompt checks on its own.

**The six as a set clear the bar** (measured 2026-10-12 on the same folds,
baseline reproduced exactly first):

| Set | check | tuning | every-rule check / tuning | hard 25 | corpus | bench@5 | rule chars per suite question |
|---|---|---|---|---|---|---|---|
| Baseline | 522 | 511 | 175 / 166 | 21 | 442 / 377 | 130 | 7,478 |
| **The six** | **536 (+14)** | **522 (+11)** | **177 / 171** | **22** | **444 / 377** | **130** | 7,524 |
| Five (without triggered) | 528 (+6) | 520 (+9) | 176 / 171 | 22 | 443 / 377 | 130 | 7,475 |

With the six on (query vectors re-frozen, then restored):
- the 14 labelled checks pass;
- the built-prompt checks pass (10 of 10);
- every term word is in the committed rule index (84 entries, 165 distinct
  words);
- 9 saved example prompts change (`ambiguous-wording`, `player-counters`,
  `quick-lookup-multi-keyword-card` and six `commander-spellbook-*`), and the
  example checklist report does not, so every example check still passes;
- three pinned tests in `gameRulesConceptMap.test.ts` need their numbers
  updated: entry count 78 → 84, distinct words 163 → 165, and the Ephemeral
  Hydra upkeep example now also gets `handling triggered abilities`.

For reference, the all-seven set (these six plus mana value) dropped bench@5
to 129. It took triggered abilities and mana value together; either one
without the other holds 130. Mana value is out, so the six are clear.

## Decisions already made — do not re-litigate

- The owner approved these six entries by name on 2026-10-12, after reading
  the proposals on PR #293. That is the REQ-234 owner review for each.
- Mana value (rule 202) is **out**: 6 gained, 4 lost. It stays in the probe
  (`HANDOFF.md`).
- One build, one retrain, after the follow-ups build.
- The five Minor review findings from PR #293 ride in this build (listed under
  Constraints).
- The terms rule stands (REQ-234): every term is either words existing entries
  already use or a section title copied word for word from the rule index.

## Design direction (converged)

Add six entries to `CONCEPT_MAP`, exactly as measured:

```
1  /(?<!\([^)]*)(?:\bwhenever\b|\bwhen\b|\bat the beginning of\b)/
     → "handling triggered abilities"            (603 section title)
2  /rather than pay(?:ing)? [^.]*?mana cost/
     → "alternative cost casting"                (existing entry's words)
3  /(?<!\([^)]*)(?:\bbecomes? (?:an? )?(?:(?!(?:blocked|target|the target|tapped|untapped|day|night|equal)\b)[\w-]+ )*?(?:creature|artifact|land|enchantment|planeswalker)\b|gains? control|exchange control|\blose all abilities|\bloses all abilities|in addition to (?:its|their) other)/
     → "interaction of continuous effects"       (613 section title)
4  /(?<!\([^)]*)\bgets? -(?:\d+|x)\/-(?:[1-9]\d*|x)\b/
     → "toughness state-based action"            (existing entries' words)
5  /(?:^|\n)[^"\n:]*\bsacrifice (?:~|this (?:creature|artifact|enchantment|permanent|land))[^"\n:]*:/
     → "activated ability cost"                  (existing entries' words)
6  /as an additional cost to cast|(?:^|\n)choose (?:one|two|three|one or more|one or both|any number)\b|rather than pay(?:ing)? [^.]*?mana cost/
     → "casting spells"                          (601 section title)
```

Steps, in order:

1. **Re-check the six as a set** on the then-current model's folds, against
   that model's baseline, with the measurement harness
   (`concept-map-candidates.patch` in this folder; rebase by hand if the map
   has moved). They cleared the bar on PR #293's model; this confirms the
   follow-ups build didn't change that. Bar: check half up, no other figure
   down, 14/14 labelled, built-prompt checks pass.
2. **If the set now misses the bar**, measure each entry alone to find the
   cause, and **park for the owner** with the numbers. Do not drop or narrow an
   entry without the owner. If triggered abilities is the cause, the narrowing
   lead is in `HANDOFF.md`: "dies / leaves the battlefield" triggers → 603.10,
   and two or more trigger sources → 603.3b.
3. **Layer entry tweak:** about 12 of entry 3's 968 matches are "becomes
   attached to a creature" on Equipment and Auras. Add `attached` to its
   skipped words, re-measure that one entry, and keep the tweak only if no
   figure drops.
4. Add match / non-match tests per entry, like the type-setting entry's 7 / 7.
5. **Retrain** per REQ-236, after the map change lands: export training pairs
   with the shipped query builder, retrain the five fold models and the 100%
   model with the unchanged recipe, rebuild every vector file that names the
   model id, and re-baseline the rules gate **once**.
6. Re-record the saved example prompts that change. Entry 1 alone changed 9
   lexical prompt goldens (`apps/backend/src/eval/fixtures/*.prompt.golden.txt`):
   excerpts reorder, e.g. 113.3c and 603.7c in, 513.2 out.

## Current-state PRD truth to amend

- `PRD/sections/functional-requirements.md`, REQ-234: the entry count (78 → 84) and a dated owner-review note naming the six.
- Same file, REQ-236: the new model id and its measured numbers, including rule
  characters per prompt (practice suite and corpus) — this also closes m-3.
- No new REQ is expected; refinement decides.

## Constraints (don't rediscover)

- **PR #293 Minor findings to fix here:**
  - m-1: a few type-setting matches fire on counting or "except" wording and on
    Un-cards (4–5 of 372 card matches). Tighten that entry, re-measure it.
  - m-2: the concept-map file header still says every entry was ported
    verbatim; entry 78 (type-setting) is new, and these six will be too.
  - m-3: REQ-236's measured line lacks rule characters per prompt (last build:
    practice suite 7,478, corpus 4,412).
  - m-4: PR #293's body quoted cross-validated or stale corpus sizes. Report
    this build's sizes from the built-prompt check (last: 4,467 excerpts, 8,530
    curated).
  - m-5: re-run the leak check on the retrained model.
- **The model is private.** Weights live in private S3, never in git. Before
  this build's PR merges, the owner uploads the new model per
  `docs/aws/model-upload.md`; the deploy refuses without it. Nothing in the
  build uploads, deploys or spends.
- **Practice-suite privacy:** no question, answer, card list, id or per-question
  result in any committed file, PR body or comment. Counts only. Never write the
  suite's source name. Run `node scripts/privacy-scan.mjs`.
- REQ-236 "re-baselined once": one rules-gate re-baseline per build, after the
  retrain.
- PR #293's fold models are deleted by `npm run graph:prune` after its merge.
  This build retrains its own; it does not need them.
- Mana value and the no-safe-entry families are the probe's, not this build's.

## Evidence + reusable tooling

- `concept-map-proposals.md` (this folder): the full per-entry write-up with
  samples and unintended-match checks, as posted on PR #293
  (https://github.com/ChrisMiho/TheJudge/pull/293#issuecomment-6119263756).
- `concept-map-candidates.patch` (this folder): measurement harness.
  `CONCEPT_CANDIDATES=NAME,NAME` turns candidates on; never commit it.
  The six, in table order: `TRIGGER_HANDLING_R`, `ALT_COST`, `LAYER_TITLE_D`,
  `MINUS_TOUGHNESS_R`, `SAC_SELF_COST`, `CASTING_TITLE_R`.
- Scoring: `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv`
  (`--final` for the 100% model).

## What the graph run should produce

A DESIGN-BRIEF that adds the six measured entries, the REQ-234 and REQ-236 amendments above, and slices for: set
measurement and the layer tweak; entries plus tests plus the m-1/m-2 fixes;
retrain, vector rebuild and the single re-baseline; golden re-recording and the
m-3/m-4/m-5 numbers. The owner's approval of the six is already given; do not
re-ask it unless step 2 parks.
