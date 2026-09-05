# DESIGN BRIEF: hybrid-rule-retrieval

**What this is:** one spec covering all four items in `IDEA.md` — a hybrid
lexical-plus-semantic score for the rule excerpts Ask AI attaches to an answer,
the eval checks that guard it, the Lambda package budget that ships it, and the
cold-start cost of the model that powers it.

**What you need to do:** answer `GATE-QUESTIONS.md`. Every number below was
measured in this checkout today; the commands and their raw output are recorded
in `## Measurement plan` so nothing here is reasoned from proportion.

**What it changes:** when a player asks Ask AI a rules question, the five
Comprehensive Rules excerpts attached to the prompt get chosen by a blend of
"which rule means the same thing as this question" and "which rule shares this
question's rare words", instead of by one or the other. Measured today, that
blend finds the right rule more often than either signal alone and stops losing
the exact rule on short lookup questions.

---

## The player-facing problem

A player in Quick Lookup types a card name, its type line, and one keyword —
nothing else. Ask AI attaches up to five official rule excerpts to that question
before answering.

With today's shipped default (`EMBEDDING_PROVIDER=mock`, keyword ranking only)
the right rule is attached. With the opt-in semantic mode
(`EMBEDDING_PROVIDER=local`, ranking rules by meaning) the right rule is
attached far more often on long questions, but on that short lookup shape it
drops out of the top five entirely — a card name plus one keyword carries too
little text for meaning-matching to work on.

Measured in this checkout today: the semantic mode wins overall (recall@5 0.8526
vs 0.5833 on the committed 156-pair benchmark) and loses three of twelve labelled
fixture checks that the keyword mode passes.

## Scope

1. **Hybrid score.** System 3 rule ranking blends the semantic (cosine) score
   and the lexical (IDF word-overlap) score into one number, instead of choosing
   one scorer wholly. Reserved as **REQ-182**.
2. **Eval gating.** The two semantic-path checks (`system3-expected-recall`,
   `system3-noise-excluded`) stop being report-only and fail `npm run test:eval`,
   plus one new labelled fixture for a multi-keyword card. Amends **REQ-032**.
3. **Lambda data budget.** Relieve the 118.10 MB-of-120 MB squeeze by a measured
   choice among the three named levers. Reserved as **REQ-183**; amends
   **NFR-017**.
4. **Cold-start latency.** Give "cold start with the model loaded" an
   operational definition, measure it, and record it against the existing
   under-3-second answer target. Amends **NFR-002**.

Plus one product decision the four items force into the open: whether
`EMBEDDING_PROVIDER=local` becomes the default, and where. Reserved as
**REQ-184**.

## Non-goals

- No new corpus and no new prompt section. The parked mechanic-definition RAG
  idea stays out (REQ-181's notes scope it out explicitly).
- No change to the request or response contract, no Zod schema change, no
  frontend change, no new endpoint.
- No new runtime dependency, external service, or storage service. This rules
  out the "load the model from S3 at cold start" lever unless the owner grants
  it scope at the gate — see REQ-183 below.
- No `npm run data:refresh` and no Scryfall network refresh.

---

## Measurement plan — commands run in this checkout, 2026-09-05

Every command below was run once on branch `thejudge-auto/hybrid-rule-retrieval`
at commit `6a1324b`. Raw output is quoted, not summarised.

### Baseline A — the eval harness (`npm run test:eval`)

```
npm --workspace apps/backend run test:eval
```

```
Semantic-path relevance report:
fixtureId | score | checks
---|---|---
cascade-keyword | 2/2 | PASS
combat-deathtouch | 2/2 | PASS
counterspell-stack | 1/1 | PASS
quick-lookup-card | 0/1 | FAIL: system3-expected-recall
quick-lookup-multi-card | 0/1 | FAIL: system3-expected-recall
quick-lookup-no-card | 1/1 | PASS
state-based-actions | 1/2 | FAIL: system3-expected-recall
upkeep-trigger | 2/2 | PASS

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

**Measured correction to the request.** The owner's request and REQ-181's notes
both say *two* of eight fixtures lose rule 702.2b. Measured today, **three of
eight fixtures fail** `system3-expected-recall` under the semantic path:
`quick-lookup-card`, `quick-lookup-multi-card`, **and `state-based-actions`**,
which scores 1/2 because it loses one of its three expected rules. Counted as
individual checks, the semantic path scores **9 of 12**, the lexical path
**12 of 12**. Every target below is set against 12/12, not against the
two-fixture figure in the intake.

`EMBEDDING_PROVIDER=local npm --workspace apps/backend run test:eval` produced
byte-identical output: this test reads committed frozen query embeddings, so the
env var does not reach it. That is correct behaviour, recorded so nobody reads
the flag into this gate later.

### Baseline B — the 156-pair benchmark

```
npm run benchmark:rag-retrieval
RAG retrieval benchmark (n=156, recall@5 / MRR, method=lexical-idf)
  clean     recall 0.5833333333333334  mrr 0.4248931623931625
  polluted  recall 0.5256410256410257  mrr 0.3871794871794873

npm run benchmark:rag-retrieval -- --semantic
RAG retrieval benchmark (n=156, recall@5 / MRR, method=semantic-local)
  clean     recall 0.8525641025641025  mrr 0.7061965811965812
  polluted  recall 0.8333333333333334  mrr 0.6929487179487179
```

These reproduce REQ-181's recorded 0.853 clean / 0.833 multi-card exactly.

**A measurement-integrity defect found while reproducing them.** The first
`--semantic` run in this checkout printed the *lexical* numbers under the label
`method=semantic-local` and wrote them to `semantic-results.json` — because
`apps/backend/data/models/` was empty, the local provider's
`allowRemoteModels = false` made the model load throw, and the provider's
documented lexical fallback swallowed it. The benchmark reported a silently
lexical result as a semantic one. `node scripts/warm-embedding-model-cache.mjs`
(8.7 s, one-time) fixed it and the numbers above are from the warmed run. The
eval harness already guards against exactly this with its `usedSemantic`
assertion; the benchmark does not. Folded into the REQ-177 amendment.

### Baseline C — the relevance report

```
npm run retrieval:report
=== Summary: 9/9 scenarios passed ===

EMBEDDING_PROVIDER=local npm run retrieval:report
=== Summary: 9/9 scenarios passed ===
```

Byte-identical. The relevance report has no semantic mode at all — it is a
lexical-only instrument. Recorded so the hybrid work does not assume the report
will show a semantic regression; it cannot.

### Baseline D — the Lambda package budget

```
node --test scripts/lambda-package-budget.test.mjs
✔ the committed data artifacts leave room for a deployable Lambda package
✔ the budget leaves a real reserve and rejects a synthetic over-budget package
ℹ pass 2  ℹ fail 0
```

The test passes but prints no sizes, so the tracked data was measured directly:

```
git ls-files -- apps/backend/data | xargs stat -f%z   (summed)
74.947 MB  apps/backend/data/commanderSpellbookCombos.json.gz
18.613 MB  apps/backend/data/cardRulingsByOracleId.json
12.287 MB  apps/backend/data/cardDetailByOracleId.json
 5.650 MB  apps/backend/data/gameRulesRuleEmbeddings.json
 4.302 MB  apps/backend/data/commanderSpellbookComboIndex.json.gz
 2.040 MB  apps/backend/data/gameRulesRuleIndex.json
 0.227 MB  apps/backend/data/gameRulesTokenStats.json
TOTAL 118.095 MB of 120 MB budget; headroom 1.905 MB
```

This reproduces NFR-017's recorded 118.1 MB / 1.9 MB headroom exactly.

The warmed model cache is **22.59 MB in 4 files** under
`apps/backend/data/models/`, which is gitignored — so it is *not* in the
118.095 MB figure. It sits inside the 130 MB non-data reserve. That matters for
the S3 lever: moving the model to S3 relieves the reserve, not the data budget.

### Baseline E — cold start with the model loaded

`NFR-002` states "normal AI latency target under 3 seconds" for an answer. It
says nothing about cold start, so item 4 needs an operational definition before
it can have a number. Proposed definition, and the measurement against it:

> **Cold-start model readiness** = wall-clock time from process start to the
> first System 3 query embedding being returned, with the model read from the
> packaged on-disk cache and no network call.

Measured in-process on this machine (Darwin arm64, warm on-disk cache, one run):

```
import @huggingface/transformers   120.3 ms
pipeline load (q8, warm cache)      57.4 ms
first query embedding                3.6 ms
--------------------------------------------
cold-start model readiness         181.2 ms
steady-state query embedding         1.05 ms  (mean of 20)
rule-embeddings artifact parse       3.7 ms   (5.65 MB)
rule-index artifact parse            3.6 ms   (2.04 MB, 2873 entries)
```

So the semantic path adds about **185 ms** to a cold process on this hardware,
and about **1 ms** to every subsequent answer — comfortably inside the
three-second answer target, with the caveat that Lambda x86 with a cold
filesystem is slower than this machine and the real figure must come from the
deployed function's own logs.

### Probe F — the hybrid blend, measured not proposed

Two throwaway probes (run from an ignored `.tmp/` scratch directory, deleted
afterwards, no repository file changed) fused the two existing rankings without
touching production code.

**Candidate formula.** For each candidate rule, with the exact-rule-id and
parent-rule-id boost merged in exactly as today:

```
blended = alpha * (cosine_score / max_cosine_score)
        + (1 - alpha) * (lexical_score / max_lexical_score)
```

Both scores are min-max normalised per query against that query's own top score,
which is what makes the two incomparable scales addable. `alpha` is the single
tunable weight.

**On the 156-pair benchmark** (both rankings taken to depth 200, then fused):

| method | clean r@5 | clean MRR | polluted r@5 | polluted MRR |
| --- | --- | --- | --- | --- |
| lexical-only (baseline) | 0.5833 | 0.4249 | 0.5256 | 0.3872 |
| semantic-only (baseline) | 0.8526 | 0.7062 | 0.8333 | 0.6929 |
| linear a=0.50 | 0.8526 | 0.6652 | 0.8205 | 0.6435 |
| **linear a=0.52** | **0.8654** | 0.6726 | **0.8333** | 0.6512 |
| linear a=0.55 | 0.8718 | 0.6896 | 0.8590 | 0.6587 |
| linear a=0.60 | 0.8974 | 0.7139 | 0.8846 | 0.6896 |
| linear a=0.70 | 0.9167 | 0.7356 | 0.9038 | 0.7160 |
| linear a=0.80 | 0.8974 | 0.7405 | 0.8910 | 0.7065 |
| rrf k=10 w 1:2 | 0.8910 | 0.7044 | 0.8910 | 0.6885 |
| rrf k=60 w 1:1 | 0.8013 | 0.6306 | 0.7821 | 0.6316 |

**On the eight labelled fixtures** (frozen query embeddings, both rankings taken
to the 15 candidates the debug object exposes, then fused):

| method | fixture checks passed |
| --- | --- |
| lexical-only (baseline) | 12/12 |
| semantic-only (baseline) | 9/12 |
| **hybrid a=0.50** | **12/12** |
| **hybrid a=0.52** | **12/12** |
| hybrid a=0.55 | 11/12 |
| hybrid a=0.60 | 11/12 |
| hybrid a=0.70 | 11/12 |

**What the two tables say together.** `alpha = 0.52` is the measured point where
both gates hold today: all 12 fixture checks pass, and benchmark recall@5 beats
semantic-only clean (0.8654 vs 0.8526) and matches it polluted (0.8333 vs
0.8333). Higher weights buy more benchmark recall — `alpha = 0.70` reaches
0.9167 clean — at the cost of one fixture check (`state-based-actions` loses one
of its three expected rules).

**Two honest caveats on this probe.** The fixture probe could only fuse the top
15 candidates per ranking, because that is all the enrichment debug object
exposes; the benchmark probe fused 200. A real implementation fuses the full
candidate list, so the fixture figures above are conservative and a higher alpha
may well clear 12/12 in the built version. And mean reciprocal rank — how near
the top the right rule lands, not just whether it is in the five — is lower at
`alpha = 0.52` (0.6726 clean) than semantic-only (0.7062). The acceptance gate
below therefore gates on recall and fixtures and *reports* MRR, and leaves alpha
to be tuned within a measured band at build rather than frozen here.

---

## What each item proposes

### Item 1 — the hybrid blend (REQ-182, new)

Replace the current all-or-nothing switch (`gameRulesRetrieval.ts` picks
`scoreEntrySemantic` **or** `scoreEntry` for the whole index) with one blended
score. Ship it under `EMBEDDING_PROVIDER=local` only; `mock` stays purely
lexical so a checkout with no model access is unchanged.

**Acceptance gates, each with its measured baseline:**

| gate | baseline measured today | threshold |
| --- | --- | --- |
| labelled fixture checks | semantic 9/12, lexical 12/12 | **12/12** |
| benchmark clean recall@5 | semantic-only 0.8526 | **≥ 0.8526** |
| benchmark polluted recall@5 | semantic-only 0.8333 | **≥ 0.8333** |
| benchmark clean/polluted MRR | 0.7062 / 0.6929 | reported, not gated |
| lexical path (`mock`) | clean 0.5833, polluted 0.5256 | **byte-identical** |

`alpha` is tuned within `[0.50, 0.70]` at build against those gates and the
chosen value plus its full sweep is recorded in the requirement.

### Item 2 — eval gating and a new fixture (REQ-032 amendment)

Once item 1's gates hold, `system3-expected-recall` and `system3-noise-excluded`
fail `npm run test:eval` on the semantic path instead of printing. Add one
labelled fixture for a multi-keyword card (a card whose Scryfall keyword list has
two or more entries), with its frozen query embedding committed by
`npm run eval:build-frozen-query-embeddings`. Gating cannot land before the
hybrid gates pass, or `test:eval` goes red on merge — today it would fail 3 of 8
fixtures.

### Item 3 — Lambda data budget (REQ-183, new; NFR-017 amendment)

Three levers, measured:

| lever | measured effect | new headroom | cost |
| --- | --- | --- | --- |
| **int8 vectors** | 5.650 MB → 1.442 MB | 1.905 → 6.113 MB | recall must be re-measured; quantisation is lossy |
| float16 vectors | 5.650 MB → 2.845 MB | 1.905 → 4.711 MB | recall must be re-measured; less lossy, less saved |
| model from S3 at cold start | frees 22.59 MB from the **reserve**, not the data budget | needs the 120/130 partition re-cut to help at all | a new runtime external dependency and S3 read on every cold start |
| shrink combos (`MIN_VARIANT_POPULARITY`) | up to 74.947 MB available | large | drops real combos from player answers; NFR-017 calls it an *emergency* valve |

Measured from the artifact itself: it already stores `float32-base64`
(`encoding: "float32-base64"`, 2873 vectors × 384 dims × 4 bytes = 4.208 MB raw,
5.611 MB base64). int8 is the arithmetic above, not an estimate.

**Recommendation: int8 vectors.** It is the only lever that adds no dependency,
touches no player-visible content, and more than triples the headroom. The S3
lever is a new runtime external integration, which the assumption ladder forbids
without owner scope — it is on the gate as a rejected alternative, not chosen
here. The combo trim removes combos players see.

### Item 4 — cold start (NFR-002 amendment)

Adopt the operational definition in Baseline E, record the 181.2 ms local
measurement, and require the deployed figure to be read from the Lambda
function's own cold-start log line — the local number bounds it, it does not
replace it.

---

## Material assumptions, with evidence

Recorded per `PRD/instructions/preparation-contract.md`'s conservative
assumption ladder, because this node ran with `graph is controlling` and no
approval pause.

1. **The blend is a per-query min-max normalised linear combination, not
   reciprocal rank fusion.** Evidence: measured — RRF's best configuration
   (k=10, weights 1:2) reaches 0.8910/0.8910 but the linear form reaches
   0.9167/0.9038, and only the linear form has a setting that also clears 12/12
   fixtures. Ladder rung 4 (smallest reversible scope): the linear form is one
   scalar added to the existing scorer, not a new ranking stage.
2. **`alpha` is tuned at build inside `[0.50, 0.70]`, not frozen at 0.52 here.**
   Evidence: the fixture probe was depth-limited to 15 candidates, so its
   verdict at higher alpha is conservative; freezing 0.52 now would bank a
   measurement artefact. Ladder rung 2 (tested behaviour): the gates, not the
   constant, are the contract.
3. **`EMBEDDING_PROVIDER` keeps `mock` as its unset default.** Evidence:
   `integrations-and-data.md`'s canonical mock-first rule, and the defect
   measured today — a checkout with a cold model cache silently ranks lexically
   while reporting semantic. Ladder rung 1 (active requirements) and rung 5
   (preserve user-visible behaviour). The deployed-environment default is put to
   the owner as REQ-184 rather than assumed.
4. **The budget lever is the vector number format, not S3.** Evidence: ladder
   rung 6 — no new external integration without authoritative scope — plus the
   measurement that S3 relieves the reserve, not the constrained 120 MB data
   budget, so it does not even solve the stated problem without re-cutting the
   partition.
5. **Cold start needs a definition before it can have a number.** Evidence:
   NFR-002's constraints list names only card-add, Decrypt Stack, and "normal AI
   latency"; grep found no cold-start assertion anywhere in `PRD/sections/`.
   Ladder rung 4: define it narrowly, measure it, record it.
6. **The three-failing-fixture figure supersedes the intake's two.** Evidence:
   the `test:eval` output above, run today. The intake is evidence, not
   authority; where it and the measurement disagree, the measurement wins and
   the requirement text is amended to match.

## REQ / FLOW / NFR references

- **Amended:** REQ-022 (System 3 enrichment behaviour), REQ-032 (retrieval
  relevance measurement), REQ-177 (trustworthy retrieval measurement), REQ-181
  (semantic rule retrieval), NFR-002 (fast interaction loop), NFR-017 (deploy
  package quota), and the four current-state spec files that restate the
  never-worse / hybrid-follow-up wording: `system-map.md`,
  `system-map/game-rules-retrieval.md`, `quick-lookup/README.md`,
  `in-depth/README.md`, `integrations-and-data.md`.
- **Reserved (new, not written live):** REQ-182 (hybrid blend), REQ-183 (Lambda
  data-budget relief), REQ-184 (`EMBEDDING_PROVIDER` default).
- **Unchanged and depended on:** REQ-167, REQ-176, REQ-178, REQ-179, REQ-180,
  REQ-093, REQ-165, DEC-046, DEC-047, FLOW-006, FLOW-011, FLOW-023.

## Citations recorded, not opened

Per the graph contract's *Intake is evidence, never authority* rule, the
following paths cited by `IDEA.md` were recorded and **not** opened:
`PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md`,
`prompt-context-retrieval-tuning-2026-06-18.md`,
`prompt-context-refinement-2026-08-31.md`,
`general-game-rules-prompt-2026-06-05.md`,
`phase-scoped-prompt-context-2026-06-06.md`, `quick-lookup-2026-08-01.md`,
`quick-lookup-spec-2026-08-27.md`. The staged intake copy
`intake/rag-rule-retrieval-2026-09-05.md` was read as intake material; every
claim in it that this brief relies on was re-measured above.
