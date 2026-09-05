# Findings — combo-context-validation

**Investigation, not a build.** Ran 2026-08-30/31. Deliverable is this report; no
product truth or durable feature was changed. Harness and raw data live in
`PRD/work/combo-context-validation/harness/`.

## Bottom line

The context TheJudge generates is good enough for the model to resolve real
multi-card combos — broadly, not just in the easy case. Across a **500-case
suite spanning five scenario families, the model was correct 488/500 (97.6%)**,
and every one of the 12 misses was a reasoning or completeness slip, **not a
missing-context gap** (zero were tagged as a retrieval or ruling failure).

Two levers are worth building, and the evidence now names them precisely:

1. **Rule retrieval should move to embeddings (RAG).** Measured on a 156-question
   benchmark, semantic retrieval beats the current lexical retrieval on clean
   questions (recall@5 **0.89 vs 0.58**) and, critically, survives the multi-card
   query that **destroys** lexical retrieval (**0.60 vs 0.03**). Your instinct was
   right — and it helps the everyday rules-question path, not just combos.

2. **The model over-asserts combos.** The only hard errors in 500 cases were the
   model inventing an infinite combo from cards that don't combo together. The
   "how do these combo?" framing primes a false positive. This is a
   prompt/answer-shaping fix, not a data gap.

## What we ran

Player's-eye view: the Quick Question "attach cards, ask how they combo" flow,
against the live model, assembled exactly as production does it. Cards hydrated
from the local lookup (`cardMetadata.json`) so every request carried real oracle
text. Answers on `gpt-4.1`; grading by a `gpt-4.1-mini` judge on a per-scenario
rubric, with hand-audits of the pilot, every hard failure, and sampled passes.

Three legs:
- **Pilot (20 complete combos)** + a combo-section ablation. (Prior section below.)
- **500-case scenario suite** across five families.
- **RAG retrieval benchmark** — lexical vs semantic, clean vs multi-card query.

## 500-case suite — results by scenario family

| Family | What it tests | n | Correct |
|---|---|---|---|
| complete | all concrete cards attached, 2–4 cards | 250 | 248 (99%) |
| large | all concrete cards, exactly 5 (max attach) | 50 | 50 (100%) |
| template | concrete cards + a generic piece needed | 50 | 48 (96%) |
| partial | one required card dropped | 100 | 94 (94%) |
| unrelated | cards from different combos (negative) | 50 | 48 (96%) |
| **total** | | **500** | **488 (97.6%)** |

The 12 non-correct: 10 PARTIAL (payoff right, mechanism vague, or — for partials —
incompleteness flagged but the missing role named loosely), 2 WRONG (both
over-assertions, below). **None** were tagged as a missing rule or ruling.

## Findings

### 1. Context is sufficient across every scenario shape; failures are reasoning, not gaps

97.6% correct, and the shape of the misses matters more than the rate: no failure
came from a rule that wasn't retrieved or a ruling that was absent. The combo
section (fires for every combo) plus attached card text carry the answer; where
the model slips, it's its own reasoning. Partials are handled well — it names the
missing mana engine, sometimes the exact dropped card (dropped Urza → "with
supporting untap or recursion effects (Ex: Urza, Lord High Artificer)…").

### 2. The model over-asserts combos on unrelated cards (the new failure the diverse suite flushed out)

Both hard errors in 500 cases were the model fabricating an infinite combo from
cards that don't combo together:

- **Kiki-Jiki, Mirror Breaker + Voltaic Construct** — claimed an infinite loop,
  but Voltaic Construct untaps *artifact* creatures and Kiki-Jiki isn't an
  artifact. The loop can't start without a third card. The model asserted it
  anyway.
- **Abdel Adrian + Emiel the Blessed** — presented them as an infinite combo
  "when you also have a mana rock," i.e. invented a third-card combo and framed
  the two attached cards as combining.

The "how do these cards combo?" question, plus the partial-combo context
surfacing every combo each card belongs to (REQ-095, working as designed),
primes the model to stitch a combo that isn't there. 2/50 on deliberately
unrelated cards — low, but it's the highest-severity failure mode and the one a
player would most notice ("the app told me I had a combo and I didn't").

### 3. Rule retrieval — RAG is measurably better, and multi-card queries break the current retrieval

Benchmark: 156 labeled (question → correct-rule) pairs (150 synthetic grounded in
real Comprehensive Rules text + 6 gold worked-solutions). recall@5 / MRR:

| Method | Query | Recall@5 | MRR |
|---|---|---|---|
| Lexical (current) | clean | 0.58 | 0.41 |
| **Semantic (RAG)** | clean | **0.89** | **0.73** |
| Lexical (current) | multi-card (question + card text) | **0.03** | 0.02 |
| **Semantic (RAG)** | multi-card | **0.60** | **0.45** |

- Semantic retrieval is far better even on clean rules questions — current lexical
  misses the right rule ~42% of the time in top-5.
- The multi-card query (question + attached cards' oracle text — exactly a combo
  lookup) craters lexical from 0.58 to **0.03** (right rule found in 4 of 156).
  This is the mechanism behind the pilot's off-target retrieval, now measured.
  Semantic degrades too (0.89 → 0.60) but survives.
- **Two complementary levers:** switch to semantic retrieval, AND fix query
  construction (don't dump raw card oracle text into the retrieval query). Semantic
  alone recovers combos to 0.60; a cleaner query pushes back toward 0.89. Query
  construction is part of building RAG well, so it comes along with the work.

### 4. From the pilot: the combo section is load-bearing; rulings coverage is genuine absence

- Ablation (combo section removed) dropped the pilot from 20/20 to 12/20 — the
  injected combo steps carry ~40% of combos, concentrated in the mid-popularity
  band. All four popularity-0 (novel) combos held without it, on card text +
  retrieval alone: strong evidence the broader context carries genuinely new
  interactions.
- Card rulings are absent for ~42% of cards (13/20 pilot combos had ≥1). Cause:
  the Scryfall rulings corpus (19,542 of 33,399 cards) simply has no entry for
  cards that never needed an official clarification. Not a lookup bug, not a
  Commander Spellbook issue — genuine absence. One minor lever: the Scryfall
  rulings snapshot is dated June 5, so brand-new cards may be missing to staleness.

## Caveats

- **Auto-judge.** Grading is a model (`gpt-4.1-mini`). Every hard failure and a
  sample of passes were hand-checked and matched the judge; a subtle mechanism
  error inside a "CORRECT" could still slip. A human review of a random CORRECT
  sample would tighten the 97.6%.
- **RAG benchmark is synthetic** — questions are model-generated (grounded in real
  rules), scored by recall@5 with rule-stem matching, single-embedding cosine. The
  6 human gold cases agree directionally. Validate on real user questions before
  shipping a retrieval change.
- **Unrelated negatives are best-effort** — cards drawn from different combos, not
  verified against every possible combo, so a coincidental real combo could be
  mis-scored. Both WRONG cases were hand-confirmed as genuine over-assertions.

## Recommendations (ranked)

1. **Prototype semantic (RAG) rule retrieval and fix the multi-card query.** The
   measured win is large and it improves the everyday rules-question path, which
   this whole line of work most affects. Build the query fix as part of it. Gate
   the switch on a benchmark of real user questions.
2. **Fix combo over-assertion.** Shape the prompt (and/or answer contract) so the
   model must verify each combo piece is present before asserting a working combo,
   and is comfortable saying "these don't combo together." Cheapest high-value fix
   for player trust.
3. **Improve partial-combo answer crispness.** 6/100 partials flagged
   incompleteness but named the missing role vaguely. A rubric nudge to name the
   missing piece's role explicitly would lift these.
4. **Optional: refresh the Scryfall rulings snapshot** (3 months old) for
   brand-new cards. Low value — most absences are genuine.

## Spend & artifacts

- **Live spend ~$11.2 total**, well under the $25 budget: pilot ~$0.88, 500-suite
  $10.31, RAG embed $0.004, benchmark gen $0.03, scoring embeddings ~$0.01.
- **Harness** (throwaway, resumable): `select-cases.mjs` / `select-suite.mjs`
  (five scenario families), `assemble.mjs` (`--no-combo` ablation, `--cases`),
  `run-live.mjs` (`--confirm-live-calls`, `--suffix`, cached), `report.mjs`, and
  `rag/` (`embed-rules.mjs`, `build-benchmark.mjs`, `score-gold.mjs`,
  `score-retrieval.mjs`).
- **Raw data:** `results-suite.json`, `results.json`/`results-ablation.json`
  (pilot), `rag/benchmark.json`, `rag/retrieval-scores.json` — every prompt,
  answer, verdict, and retrieval score.

---

## Appendix — pilot (20 combos) + ablation

Attach every card of a combo and ask "how do these combo?", and the model resolved
20/20, including four popularity-0 combos it can't have memorized (one built on
brand-new Captain America, Team Leader). Removing the combo section dropped it to
12/20 (8 → PARTIAL), concentrated in mid-popularity; the four novel combos held.
This established that (a) the context works, (b) the combo section is load-bearing
in the middle, and (c) System 3 retrieval was frequently off-target — the thread
that the RAG benchmark above ran down and measured.
