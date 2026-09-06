# GATE QUESTIONS: hybrid-rule-retrieval

**Decide.** Fourteen blocks below, each one thing you are choosing. Three are
new requirements (REQ-182, REQ-183, REQ-184); eleven amend live product truth
that this change contradicts. Answer each with `accept`, `edit`, or `reject`;
`edit` and `reject` need a reason.

Every number quoted was measured in this checkout on 2026-09-05. The commands
and their raw output are in `DESIGN-BRIEF.md`, `## Measurement plan`.

Nothing here has been written to `PRD/sections/`. Refinement proposes; the build
applies the approved text together with the code.

---

## REQ-182 — blend the two ways of finding a rule instead of choosing one

**What this decides:** whether Ask AI picks the five official rule excerpts it
attaches to a question by *meaning*, by *rare shared words*, or by a blend of
both.

**In plain terms:** today the app has two ways of finding relevant rules and
uses one or the other, never both. The word-overlap way (the shipped default)
scores a rule by how many of the question's rarer words it also contains. The
meaning way — turned on with the setting `EMBEDDING_PROVIDER=local`, which runs
a small bundled language model that turns text into a list of numbers so two
pieces of text can be compared for similar meaning — is much better on ordinary
questions but falls apart on the short lookup shape: a card name, a type line,
and one keyword is too little text for meaning-matching to grip. Measured today,
the meaning way scores 0.8526 on the 156-question benchmark against the word way's
0.5833, but loses 3 of the 8 labelled test scenarios the word way gets right.
This blends the two into one score, so a short lookup keeps the exact rule and a
long question keeps the meaning gain. (This supersedes REQ-181's note that "no
hybrid lexical-plus-semantic fusion score was ever measured" — one has now been
measured; the shipped default `EMBEDDING_PROVIDER=mock` is untouched either
way.)
**Amended at build, 2026-09-05 (owner decision):** the blend alone, scored over
the full candidate pool this requirement mandates (not a truncated top-15
sample), does not reach 12/12 at any weight in the accepted `[0.50, 0.70]`
range — one scenario about a creature dying from damage keeps losing one of
its three expected rules, because that rule refers to another rule by number
inside its own text rather than restating the cited number itself. The fix
the owner chose: a candidate rule whose own text cites a rule number the
question cites (for example, that "damage" rule's text cites the specific
state-based-action rule the question names) gets a smaller boost, on top of —
never instead of — the existing exact-rule-id and parent-rule-id boosts. With
that cross-reference boost in place, **all 12** scenario checks pass at every
weight from 0.50 through 0.70; the shipped weight (60% meaning / 40% words)
beats meaning-only on the benchmark (0.8974 clean, 0.8910 with a card
attached, both above the accepted floors) — see this requirement's Notes for
the full sweep.

**What happens if you say no:** the semantic mode stays an all-or-nothing switch
that is better on average and worse on short lookups, `EMBEDDING_PROVIDER=local`
can never safely become the default, and the two semantic eval checks stay
report-only forever.

Proposed new requirement — reserved id, not written live. Inserted in
`PRD/sections/functional-requirements.md` after REQ-181:

```markdown
### REQ-182
- Title: Hybrid lexical-plus-semantic scoring for System 3
- Priority: high
- Description: System 3 ranks supplemental rule excerpts by one blended score that combines semantic similarity and lexical word overlap, rather than switching wholly between the two scorers. The blend keeps the semantic gain on ordinary questions while keeping the exact rule on short lookup-mode questions, where a card name, type line, and one keyword carries too little text for cosine ranking alone.
- Acceptance Criteria:
  - under `EMBEDDING_PROVIDER=local`, each candidate rule's score is `alpha * (cosine / max_cosine) + (1 - alpha) * (lexical / max_lexical)`, where both component scores are min-max normalised per query against that query's own highest component score; the exact-rule-id and parent-rule-id boost is merged into the blended score exactly as REQ-181 merges it into the semantic score, and a cross-reference boost (a candidate rule whose own text cites a rule number the question cites) is merged in the same way, on top of — never instead of — the exact-rule-id and parent-rule-id boosts, and matched only against the question's cited ids, never oracle-sourced text (owner decision, 2026-09-05, added at build after the plain formula alone could not clear the 12/12 gate below within the accepted alpha band)
  - `alpha` is a single named constant tuned at implementation within the measured band `[0.50, 0.70]`; the chosen value and the full sweep behind it are recorded in this requirement's notes, never left as an unexplained magic number
  - the cross-reference boost is a single named constant, measured to be smaller than the exact-rule-id boost, and its value and sizing rationale are recorded in this requirement's notes
  - the blend is scored over the full candidate list, not over a truncated top-N of either ranking
  - under `EMBEDDING_PROVIDER=mock`, and on any embedding failure, scoring is byte-identical to the prior lexical-only path — measured on the committed benchmark (REQ-177) as clean recall@5 0.5833 / MRR 0.4249 and polluted recall@5 0.5256 / MRR 0.3872, the values recorded on 2026-09-05
  - all 12 labelled fixture checks pass under the semantic path (`system3-expected-recall` and `system3-noise-excluded` across the eight labelled fixtures), against the 2026-09-05 baselines of 9/12 semantic-only and 12/12 lexical-only
  - measured on the committed benchmark (REQ-177), clean recall@5 is at or above the 2026-09-05 semantic-only baseline of 0.8526 and polluted recall@5 at or above 0.8333
  - clean and polluted MRR are recorded alongside recall in the same run and reported in this requirement's notes; they are not a gate
  - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179), and the prompt's section placement is unchanged
- Constraints:
  - backend and prompt-internal only; no `AskAiRequest` change, no Zod schema change, no frontend change, no new endpoint, no new dependency
  - no change to the committed embeddings artifact's contents or to query construction (REQ-178); this requirement changes only how two existing scores are combined, plus the one additional boost term above
  - NFR-002's under-3-second answer target holds; blending adds arithmetic over the already-scored candidate list and no additional model call
- Dependencies:
  - REQ-181 (the semantic path and the provider seam this blends with)
  - REQ-177 (the committed benchmark this is gated against)
  - REQ-032 (the labelled fixture checks this is gated against)
  - REQ-022 (the System 3 enrichment behaviour this serves)
- Notes:
  - measured 2026-09-05 in a throwaway probe over the shipped rankings, before implementation: on the 156-pair benchmark, linear blends scored clean/polluted recall@5 of 0.8526/0.8205 at alpha 0.50, 0.8654/0.8333 at 0.52, 0.8718/0.8590 at 0.55, 0.8974/0.8846 at 0.60, 0.9167/0.9038 at 0.70; reciprocal rank fusion peaked lower (0.8910/0.8910 at k=10 weighted 1:2) and is not the shipped form. That probe could only fuse the top 15 candidates per ranking (all the enrichment debug object exposed) and scored 12/12 fixture checks at alpha 0.50/0.52 there — a conservative, not-representative measurement.
  - **measured at build, 2026-09-05, over the real full candidate list (no boost yet):** all 12 fixture checks failed to clear at every alpha from 0.50 to 0.70 — `state-based-actions` always lost one of its three expected rules (`701.8b`), scoring 11/12 everywhere in the band. `701.8b`'s text cites rule `704.5g` (which the question cites directly) but the plain blend has no mechanism to reward that: three other rules always outscored it (`704.5h`, `510.3a`, `702.2b`, depending on alpha). The crossover where `701.8b` would win on the plain formula alone solves to alpha ≈ 0.4787 — below the accepted 0.50 floor. Full per-rule scores in `PRD/work/hybrid-rule-retrieval/slice-a-hybrid-blend.md`, `## Blocker`.
  - **owner decision, 2026-09-05:** keep the 12/12 gate and the `[0.50, 0.70]` band; add the cross-reference boost above instead of relaxing either. Sized by measurement: the largest gap between `701.8b`'s blended score and its closest full-pool competitor, across the whole accepted alpha band, was 0.078 (at alpha 0.70). `SCORE_CROSS_REFERENCE = 10` clears that with a wide margin while staying an order of magnitude below the exact-rule-id boost (100) and half the parent-rule-id boost (20) — preserving the intended hierarchy (exact > parent > cross-reference) rather than acting as an equally-absolute override.
  - **measured at build, 2026-09-05, with the cross-reference boost in place** (`npm run test:eval`, `npm run benchmark:rag-retrieval -- --semantic`, full candidate list): all 12 fixture checks pass at every alpha tested — 0.50, 0.55, 0.60, 0.65, 0.70. Benchmark clean/polluted recall@5 and MRR per alpha (unaffected by the boost — none of the 156 benchmark questions cites a rule number, so the boost never fires there): 0.8526/0.6649 clean, 0.8205/0.6392 polluted at 0.50; 0.8782/0.6918, 0.8718/0.6615 at 0.55; 0.8974/0.7139, 0.8910/0.6928 at 0.60; 0.8974/0.7188, 0.9038/0.7042 at 0.65; 0.9167/0.7353, 0.9038/0.7188 at 0.70. `alpha = 0.60` is chosen: the first value in the sweep where both clean and polluted recall clear the accepted floors (0.8526 / 0.8333) with real headroom, while every higher value in the band was also available at no fixture cost.
  - the prior state this replaces: `gameRulesRetrieval.ts` chose `scoreEntrySemantic` or `scoreEntry` for the whole index with no blend, which is why REQ-181's notes recorded that no fusion score had been measured
```

- Verdict: accept
- Reason:

---

## REQ-183 — shrink the rule vectors so the deploy package stops running out of room

**What this decides:** which of three levers relieves the Lambda deployment
package, which currently has 1.9 MB of room left out of 120 MB.

**In plain terms:** everything the backend ships to AWS — code, libraries, and
committed data — has to fit under a 250 MB limit, split today as 130 MB reserved
for code and libraries and 120 MB allowed for data. Measured today the data is
118.095 MB, so 1.9 MB is left; the next data refresh breaks the build. Three
levers were named. Measured: the rule-meaning vectors are stored as full-size
numbers (`float32-base64`, 5.650 MB for 2,873 rules); storing them as
one-byte-per-number instead drops that file to 1.442 MB and takes headroom from
1.9 MB to 6.1 MB. Loading the model from S3 at cold start would free 22.59 MB
but from the *other* side of the split — the code reserve, not the data budget —
so it does not solve the stated problem without re-cutting the split, and it adds
a live S3 read to every cold start. Trimming the 74.9 MB combo file
(`MIN_VARIANT_POPULARITY`, which NFR-017 calls an emergency valve) removes real
card combos players see in answers. This picks the vectors. (NFR-017 is the
requirement that measures the package and fails the pull request when data would
break the deploy.)

**What happens if you say no:** the package stays at 1.9 MB of headroom, and the
next Scryfall or rules refresh fails the budget test with only the emergency
combo trim left to pull.

Proposed new requirement — reserved id, not written live. Inserted in
`PRD/sections/functional-requirements.md` after REQ-182:

```markdown
### REQ-183
- Title: Rule-embedding vectors ship in a compact number format
- Priority: high
- Description: The committed per-rule embeddings artifact stores each vector component in a compact number format instead of full 32-bit floats, so the deploy package's data budget (NFR-017) regains real headroom without dropping any player-visible content and without adding a runtime dependency.
- Acceptance Criteria:
  - the artifact's `encoding` field names the shipped format and the loader reads that field rather than assuming a format, so an older or newer artifact is detected rather than misread
  - the committed artifact is measurably smaller: from the 2026-09-05 measurement of 5.650 MB (`float32-base64`, 2873 vectors x 384 dims), an int8 encoding lands at about 1.442 MB and a float16 encoding at about 2.845 MB
  - tracked `apps/backend/data` total drops from the 2026-09-05 measurement of 118.095 MB, and the new figure and headroom are recorded in NFR-017
  - retrieval quality is re-measured after the format change and does not regress: benchmark clean recall@5 at or above the value REQ-182 records, polluted recall@5 likewise, and all 12 labelled fixture checks still pass
  - the vector-loading path degrades exactly as REQ-181 already requires: a missing, malformed, or unrecognised-encoding artifact disables the semantic path with one diagnostic warning and System 3 falls back to lexical retrieval
  - `node --test scripts/lambda-package-budget.test.mjs` passes with the new artifact and the budget test's recorded figures are updated in the same change
- Constraints:
  - no new dependency, no new external service, and no runtime fetch: the vectors stay committed, loaded in-process, and cosine-searched with no vector database (REQ-181)
  - the combo corpus is not trimmed: `MIN_VARIANT_POPULARITY` stays at 0 and remains the emergency valve NFR-017 describes, not a routine lever, because trimming it removes combos players see in answers (REQ-093)
  - the local embedding model is not moved to S3 or fetched at cold start; that would add a runtime external integration and relieves the non-data reserve rather than the constrained data budget
- Dependencies:
  - NFR-017 (the deploy package budget this relieves)
  - REQ-181 (the embeddings artifact whose format this changes)
  - REQ-182 (the retrieval quality this must not regress)
  - REQ-093 (the full combo corpus this deliberately leaves alone)
- Notes:
  - measured 2026-09-05 from the artifact itself: `encoding: "float32-base64"`, 2873 rule ids, 384 dimensions, 4 bytes per value, 4.208 MB raw and 5.611 MB base64 inside a 5.650 MB file; component values ranged -0.2719 to 0.2584, a narrow range well suited to int8 quantisation
  - the alternatives were measured, not assumed: moving the model to S3 frees the 22.59 MB warmed model cache, which sits inside the 130 MB non-data reserve and is gitignored, so it is absent from the 118.095 MB data figure entirely
```

- Verdict: accept
- Reason:

---

## REQ-184 — where `EMBEDDING_PROVIDER=local` becomes the default

**What this decides:** whether the better rule-finding mode turns on for
everyone, and if so, where it turns on.

**In plain terms:** the meaning-based rule search is opt-in today — you get it
only by setting `EMBEDDING_PROVIDER=local`. Once the blend in REQ-182 lands, the
measured case for turning it on for real players is made. But a plain checkout
of this repo cannot run it: the model file is deliberately not committed, and
measured today a checkout with an unwarmed model cache **silently falls back to
word-matching while reporting itself as semantic**. So the safe shape is a split
default — a developer checkout keeps word-matching (nothing to download, nothing
silently wrong), and the deployed backend, which packages the model at build
time, sets `local` explicitly. This is exactly how the AI provider already works
(`ASK_AI_PROVIDER=mock` locally, `openai` in production — the canonical
mock-first rule in `integrations-and-data.md`). (REQ-181 set `mock` as the unset
default and said `local` becomes the default only once a hybrid blend lands;
this is that decision.)

**What happens if you say no:** players keep the word-matching results they get
today, the blend ships as opt-in only, and the measured recall gain (0.8654 vs
0.5833 on the benchmark) never reaches anyone using the product.

Proposed new requirement — reserved id, not written live. Inserted in
`PRD/sections/functional-requirements.md` after REQ-183:

```markdown
### REQ-184
- Title: Semantic rule retrieval is the deployed default
- Priority: high
- Description: Once the hybrid blend (REQ-182) clears its gates, the deployed backend runs System 3 with the semantic path on. The unset default stays `mock` so a plain checkout with no model access behaves exactly as before; the deploy sets `EMBEDDING_PROVIDER=local` explicitly, the same split the AI provider already uses.
- Acceptance Criteria:
  - `EMBEDDING_PROVIDER` unset still resolves to `mock`; it never auto-switches on `NODE_ENV` or deploy target (REQ-181, unchanged)
  - the deployed Lambda's environment sets `EMBEDDING_PROVIDER=local` explicitly, and the deploy configuration records it where the equivalent `ASK_AI_PROVIDER` setting is recorded
  - the deploy fails, rather than silently degrading, when the packaged model cache is absent: the packaging script already refuses without `apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx`, and that refusal is asserted
  - a local `npm run dev` with no warmed model cache and no network still answers, using lexical retrieval, with the single diagnostic warning REQ-181 requires
  - this requirement does not land before REQ-182's gates pass and REQ-032's semantic checks gate `npm run test:eval`
- Constraints:
  - the canonical mock-first rule is preserved, not broken: the *unset* default remains the offline-safe one, and the live setting is opt-in per environment (`integrations-and-data.md`, Tech Stack)
  - no per-request external call is introduced: `local` embeds in-process from the packaged model (REQ-181)
- Dependencies:
  - REQ-182 (the blend that makes this safe)
  - REQ-181 (the provider seam and its mock-first default)
  - REQ-032 (the eval gating that guards it)
- Notes:
  - measured 2026-09-05: in a checkout whose model cache was empty, `npm run benchmark:rag-retrieval -- --semantic` returned the lexical numbers labelled `method=semantic-local` with no failure — the reason the *unset* default must stay `mock` rather than flipping repo-wide
```

- Verdict: accept
- Reason:

---

## REQ-032 — the semantic rule checks start failing the build instead of just printing

**What this decides:** whether the two automated checks that watch semantic rule
retrieval can fail a pull request, and whether a new test scenario for a
multi-keyword card is added.

**In plain terms:** `npm run test:eval` is the automated gate that catches a
retrieval regression before merge. Two of its checks —
`system3-expected-recall` (the expected rule shows up in the top five) and
`system3-noise-excluded` (a known-irrelevant rule does not) — currently run
against the semantic path in *report mode*: they print a per-fixture pass/fail
table but never fail the run, because as of 2026-09-05 semantic-only ranking was
worse than word-matching on short lookups so it could not be gated. Once the
blend in REQ-182 lands they gate. Measured today they would fail 3 of 8 fixtures
if switched on now, which is why the order matters. The new fixture covers a card
whose Scryfall keyword list has two or more keywords, a shape no labelled fixture
tests today.

**What happens if you say no:** the semantic path stays untested by anything
that can fail, and a regression in it merges silently — the exact failure mode
that made the relevance report and the eval harness disagree for two months
before REQ-177 repaired them.

Amends `PRD/sections/functional-requirements.md`, REQ-032.

Current (byte-for-byte, two `- Acceptance Criteria:` bullets):

```markdown
  - `system3-expected-recall` and `system3-noise-excluded` also run against the semantic retrieval path (REQ-181) using committed frozen query embeddings, so the eval measures semantic retrieval with no live embedding call and no live AI call; they run in report mode there — printed per fixture, not failing the run — until a hybrid lexical-plus-semantic blend lands, at which point they gate (2026-09-05 owner decision: measured semantic-only ranking is worse than lexical on short lookup-mode questions, so it cannot gate yet)
```

```markdown
  - `npm run test:eval` remains the automated regression gate for the lexical retrieval path; the semantic-path checks above are report-only until the hybrid blend lands
```

Proposed replacement:

```markdown
  - `system3-expected-recall` and `system3-noise-excluded` also run against the semantic retrieval path (REQ-181/REQ-182) using committed frozen query embeddings, so the eval measures semantic retrieval with no live embedding call and no live AI call; they gate there — a failing check fails the run — from the moment the hybrid lexical-plus-semantic blend (REQ-182) clears its recall gates. Before that blend, semantic-only ranking measured 9 of 12 labelled checks against lexical's 12 of 12 (2026-09-05), which is why the checks ran in report mode until then
```

```markdown
  - `npm run test:eval` is the automated regression gate for both retrieval paths: the lexical path always, and the semantic path from REQ-182 onward
```

Proposed addition — one new `- Acceptance Criteria:` bullet, after the two above:

```markdown
  - the labelled fixture set includes one lookup-mode fixture for a multi-keyword card (a card whose committed Scryfall keyword list carries two or more keywords), with its expected supplemental rule ids hand-labelled and its frozen query embedding committed by `npm run eval:build-frozen-query-embeddings`
```

Proposed addition — one new `- Notes:` bullet:

```markdown
  - measured 2026-09-05 before the hybrid blend: under the semantic path the labelled fixtures scored `cascade-keyword` 2/2, `combat-deathtouch` 2/2, `counterspell-stack` 1/1, `quick-lookup-card` 0/1, `quick-lookup-multi-card` 0/1, `quick-lookup-no-card` 1/1, `state-based-actions` 1/2, `upkeep-trigger` 2/2 — three fixtures failing, not the two recorded in REQ-181's earlier note
```

- Verdict: accept
- Reason:

---

## REQ-177 — the benchmark must not report a word-matching result as a meaning result

**What this decides:** whether the retrieval benchmark is allowed to silently
report the wrong kind of measurement.

**In plain terms:** `npm run benchmark:rag-retrieval -- --semantic` is the
command that measures how well meaning-based rule search does. Running it in this
checkout today, it printed the *word-matching* numbers under the label
`method=semantic-local` and wrote them to the results file — because the model
file was not present, the model load threw, and the code's normal fall-back-to-
word-matching behaviour swallowed it. Nothing failed. That is exactly the class
of defect REQ-177 exists to prevent: it is the requirement that made the
relevance report and the eval harness stop disagreeing about the same fixture.
The eval harness already guards against this by asserting a `usedSemantic` flag;
the benchmark does not. This adds that guard.

**What happens if you say no:** any future measurement of the semantic or hybrid
path can quietly be a measurement of the lexical path, and a decision — including
the one in REQ-182 — could be made on a number that measured the wrong thing.

Amends `PRD/sections/functional-requirements.md`, REQ-177.

Current (byte-for-byte, one `- Acceptance Criteria:` bullet):

```markdown
  - the benchmark runs offline and deterministically — no live AI provider call and no live embedding call — consistent with REQ-032's no-live-call constraint
```

Proposed replacement:

```markdown
  - the benchmark runs offline and deterministically — no live AI provider call and no live embedding call — consistent with REQ-032's no-live-call constraint; a run asked for the semantic or hybrid path fails loudly when the embedder is unavailable rather than reporting the lexical result under a semantic label, mirroring the eval harness's `usedSemantic` assertion (REQ-181)
```

Proposed addition — one new `- Notes:` bullet:

```markdown
  - measured 2026-09-05: in a checkout with an unwarmed model cache (`apps/backend/data/models/` empty), `npm run benchmark:rag-retrieval -- --semantic` printed clean recall@5 0.5833 — the lexical figure — labelled `method=semantic-local`, and wrote it to `semantic-results.json` with no failure. After `node scripts/warm-embedding-model-cache.mjs` the same command returned the true semantic 0.8526. The guard above exists because of that observed silent substitution
```

- Verdict: accept
- Reason:

---

## REQ-181 — the "hybrid blend is still a follow-up" wording is now out of date

**What this decides:** how the shipped semantic-retrieval requirement describes
its own state, now that the blend it named as a follow-up has been measured.

**In plain terms:** REQ-181 is the requirement that shipped meaning-based rule
search. Two places in it say a hybrid blend is a *tracked follow-up* and that no
fusion score was ever measured. Both are now false: a blend was measured today
and is proposed as REQ-182. It also records "two of eight labelled fixtures lose
rule 702.2b"; measured today it is three of eight — `state-based-actions` also
loses one of its three expected rules, which the earlier note missed. This
corrects both.

**What happens if you say no:** the shipped requirement keeps pointing at a
follow-up that has landed and keeps an undercounted regression figure, so the
next person reading it plans work that is already done against a number that is
wrong.

Amends `PRD/sections/functional-requirements.md`, REQ-181.

Current (byte-for-byte, the last `- Constraints:` bullet):

```markdown
  - lexical retrieval is retained and never removed: it is the retrieval path under `EMBEDDING_PROVIDER=mock` (the default, which must run with no model access — canonical mock-first rule, `integrations-and-data.md` Tech Stack), under an `openai` provider failure, and under any embedding failure, it supplies the exact-rule-id and parent-rule-id boost merged into semantic ranking — so those settings are never worse than System 3's prior lexical-only behaviour. Under `local`, measured 2026-09-05 on the 156-pair benchmark, semantic ranking is better overall (recall@5 0.85 vs 0.58 clean, 0.83 vs 0.53 with cards) and worse on short lookup-mode questions where the query is a card name, type line, and one keyword (two of eight labelled fixtures lose rule 702.2b from the top five); a hybrid lexical-plus-semantic blend is the tracked follow-up before `local` becomes the default
```

Proposed replacement:

```markdown
  - lexical retrieval is retained and never removed: it is the retrieval path under `EMBEDDING_PROVIDER=mock` (the default, which must run with no model access — canonical mock-first rule, `integrations-and-data.md` Tech Stack), under an `openai` provider failure, and under any embedding failure, it supplies the exact-rule-id and parent-rule-id boost merged into ranking — so those settings are never worse than System 3's prior lexical-only behaviour. Under `local`, semantic-only ranking measured 2026-09-05 on the 156-pair benchmark was better overall (recall@5 0.85 vs 0.58 clean, 0.83 vs 0.53 with cards) and worse on short lookup-mode questions where the query is a card name, type line, and one keyword (three of eight labelled fixtures lost an expected rule from the top five, scoring 9 of 12 checks against lexical's 12 of 12). REQ-182 replaces that either/or switch with a blended score that keeps both, and is what makes `local` safe as a deployed default (REQ-184)
```

Current (byte-for-byte, one `- Notes:` bullet):

```markdown
  - no hybrid lexical-plus-semantic fusion score was ever measured; this requirement merges the exact-rule-id boost with semantic ranking rather than claiming a measured fusion result
```

Proposed replacement:

```markdown
  - no hybrid lexical-plus-semantic fusion score was measured for this requirement; it merges the exact-rule-id boost with semantic ranking rather than claiming a measured fusion result. REQ-182 measured one afterwards and ships it
```

- Verdict: accept
- Reason:

---

## REQ-022 — the System 3 enrichment behaviour restates the same stale follow-up

**What this decides:** the same correction as REQ-181, in the requirement that
describes what the prompt's rule sections actually contain.

**In plain terms:** REQ-022 is the requirement for the rule excerpts every Ask AI
prompt carries — the curated `GAME RULES (reference)` block and the up-to-five
`ADDITIONAL RELEVANT RULE EXCERPTS`. One of its acceptance criteria repeats
REQ-181's now-stale "a hybrid blend is the tracked follow-up" sentence and its
two-of-eight figure. This updates it to describe the blend as the shipped
ranking.

**What happens if you say no:** the requirement describing what players actually
get in their prompt keeps describing ranking that no longer matches the code.

Amends `PRD/sections/functional-requirements.md`, REQ-022.

Current (byte-for-byte, the last `- Acceptance Criteria:` bullet):

```markdown
  - System 3 scoring is semantic-primary when the embedding-provider seam is active (REQ-181): the query embedding is cosine-ranked against the committed rule embeddings with the exact-rule-id and parent-rule-id boost merged in. Lexical scoring is retained as the mock/offline default and as the fallback on any embedding failure, so those settings are never worse than the prior lexical-only behaviour; under `local`, measured 2026-09-05 on the 156-pair benchmark, semantic ranking is better overall (recall@5 0.85 vs 0.58 clean, 0.83 vs 0.53 with cards) and worse on short lookup-mode questions where the query is a card name, type line, and one keyword (two of eight labelled fixtures lose rule 702.2b from the top five) — a hybrid lexical-plus-semantic blend is the tracked follow-up before `local` becomes the default
```

Proposed replacement:

```markdown
  - System 3 scoring is a hybrid of meaning and word overlap when the embedding-provider seam is active (REQ-182): the query embedding is cosine-ranked against the committed rule embeddings and blended with the lexical IDF score, both normalised per query, with the exact-rule-id and parent-rule-id boost merged into the blended score. Lexical scoring alone is retained as the mock/offline default and as the fallback on any embedding failure, so those settings are never worse than the prior lexical-only behaviour. The blend exists because semantic-only ranking, measured 2026-09-05, was better overall (recall@5 0.85 vs 0.58 clean, 0.83 vs 0.53 with cards) but lost an expected rule on short lookup-mode questions in three of eight labelled fixtures (REQ-181, REQ-182)
```

Proposed addition — one new `- Dependencies:` entry, after the REQ-181 line:

```markdown
  - REQ-182 (the hybrid blend that is now System 3's shipped ranking)
```

- Verdict: accept
- Reason:

---

## NFR-002 — give "cold start" a definition, and record what it costs

**What this decides:** what "cold start with the model loaded" means as a
measurable number, and where it is recorded.

**In plain terms:** the speed requirement says a normal AI answer should come
back in under three seconds. It says nothing about *cold start* — the first
request after the backend has been idle, when AWS has to unpack and start the
whole function from scratch, and now also load a language model. So there was no
definition to measure item 4 against. This proposes one: the time from the
process starting to the first rule-meaning lookup returning, reading the model
from the packaged files with no network call. Measured on this machine today
that is **181 ms**, plus 4 ms to read the rule vectors — and every answer after
the first costs about 1 ms. Real AWS hardware is slower than this laptop, so the
requirement also says the deployed number must be read from the function's own
logs rather than assumed from the local one.

**What happens if you say no:** item 4 has nothing to measure against, and the
model's cold-start cost stays an unrecorded unknown that only shows up as a slow
first answer for a player.

Amends `PRD/sections/non-functional-requirements.md`, NFR-002.

Current (byte-for-byte, the `- Constraints:` list):

```markdown
- Constraints:
  - card add flow under 5 seconds
  - Decrypt Stack flow under 20 seconds
  - normal AI latency target under 3 seconds
```

Proposed replacement:

```markdown
- Constraints:
  - card add flow under 5 seconds
  - Decrypt Stack flow under 20 seconds
  - normal AI latency target under 3 seconds
  - cold-start model readiness — wall-clock time from backend process start to the first System 3 query embedding returning, with the model read from the packaged on-disk cache and no network call — is measured and recorded, and stays a small enough share of the 3-second answer target that a cold request still meets it
```

Proposed addition — one new `- Notes:` bullet:

```markdown
  - **Cold start with the bundled embedding model (REQ-181), measured 2026-09-05** on a local Darwin arm64 checkout with a warmed on-disk cache, one run: importing `@huggingface/transformers` 120.3 ms, building the quantised feature-extraction pipeline 57.4 ms, first query embedding 3.6 ms — cold-start model readiness 181.2 ms — plus 3.7 ms to parse the 5.65 MB rule-embeddings artifact and 3.6 ms for the 2.04 MB rule index. Steady-state query embedding averaged 1.05 ms over 20 runs. So the semantic path adds roughly 185 ms to a cold process and about 1 ms per answer thereafter. AWS Lambda x86 with a cold filesystem is slower than this machine: the deployed figure is read from the function's own cold-start log line, and this local measurement bounds it rather than replacing it
```

- Verdict: accept
- Reason:

---

## NFR-017 — record which budget lever was pulled and the new headroom

**What this decides:** how the deploy-package guardrail describes its own state
once the vectors shrink.

**In plain terms:** NFR-017 is the test that fails a pull request when committed
data would break the AWS deploy. Its text records the measurement that made this
work necessary — 118.1 MB against a 120 MB budget, 1.9 MB left. When REQ-183
shrinks the rule vectors, that recorded figure changes, and the guardrail's notes
should say which lever was pulled and which were deliberately not, so the next
person facing the squeeze does not re-litigate it.

**What happens if you say no:** the requirement keeps quoting a headroom figure
that is no longer true, and the reasoning behind the choice is lost.

Amends `PRD/sections/non-functional-requirements.md`, NFR-017.

Current (byte-for-byte, the second `- Constraints:` bullet):

```markdown
  - the non-data reserve is sized from a measurement of the real packaged code and production dependencies, not left at a figure the package has outgrown. When a bundled embedding model ships (REQ-181) it lands in production dependencies, inside this reserve, so the reserve is re-measured in that same change and the test's failure message names the model as a contributor. The guardrail is re-based, never loosened to make a red test green — measured on 2026-09-05 (post-REQ-181), committed data is 118.1 MB against a 120 MB data budget (1.9 MB headroom), so the constrained side is the reserve, not the data budget. Before REQ-181's model reserve was re-based, committed data was 111.9 MB against a 230 MB data budget (118 MB headroom) — see the Notes below for the full before/after
```

Proposed replacement:

```markdown
  - the non-data reserve is sized from a measurement of the real packaged code and production dependencies, not left at a figure the package has outgrown. When a bundled embedding model ships (REQ-181) it lands in production dependencies, inside this reserve, so the reserve is re-measured in that same change and the test's failure message names the model as a contributor. The guardrail is re-based, never loosened to make a red test green — measured on 2026-09-05 (post-REQ-181), committed data was 118.1 MB against a 120 MB data budget (1.9 MB headroom), so the constrained side is the reserve, not the data budget. REQ-183 then re-encoded the rule-embedding vectors in a compact number format and the resulting figure is re-recorded here in that same change. Before REQ-181's model reserve was re-based, committed data was 111.9 MB against a 230 MB data budget (118 MB headroom) — see the Notes below for the full before/after
```

Proposed addition — one new `- Notes:` bullet:

```markdown
  - the 1.9 MB squeeze was relieved by re-encoding the rule-embedding vectors (REQ-183), not by trimming the combo corpus and not by moving the model to S3. Measured 2026-09-05: the vectors were `float32-base64` at 5.650 MB of the 118.095 MB tracked total, and an int8 encoding lands at about 1.442 MB, taking headroom from 1.905 MB to about 6.113 MB. The S3 alternative frees the 22.59 MB warmed model cache, which is gitignored and sits inside the 130 MB non-data reserve — so it relieves the unconstrained side of the split, not the data budget, and it adds a runtime external dependency at every cold start. Trimming `MIN_VARIANT_POPULARITY` stays the emergency valve it already is, because it removes combos players see in answers (REQ-093)
```

Proposed addition — one new `- Dependencies:` entry:

```markdown
  - REQ-183 (the compact vector encoding that relieved this budget)
```

Proposed addition — one more new `- Notes:` bullet, recording the 2026-09-05
CI deploy rejection (owner edit, applied by `graph-gate-review`):

```markdown
  - the 130 MB non-data reserve was measured on macOS; on the linux/x64 CI runner, `onnxruntime-node`'s postinstall downloaded the CUDA runtime — which the Lambda CPU runtime never loads — and AWS rejected the resulting package as over 250 MB unzipped even though the budget test had passed. Fixed on `main` in PR #194: `scripts/package-lambda.sh` now sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` for the packaging install and measures the real unzipped package bytes with a per-entry breakdown, failing before upload when over quota. The 130 MB reserve figure itself is still to be re-measured on the CI runner, not a laptop
```

- Verdict: edit
- Reason: add one more Notes bullet recording the 2026-09-05 deploy rejection: the 130 MB non-data reserve was measured on macOS, but on the linux/x64 CI runner onnxruntime-node's postinstall downloaded the CUDA runtime (which the Lambda CPU runtime never loads) and AWS rejected the package as over 250 MB unzipped even though the budget test passed. Fixed on main in PR #194: `scripts/package-lambda.sh` now sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` for the packaging install and measures the real unzipped bytes with a per-entry breakdown, failing before upload when over quota. The reserve figure is to be re-measured on the CI runner, not a laptop.

---

## system-map.md — Supplemental retrieval (System 3)

**What this decides:** how the one-line architecture summary of rule retrieval
describes its ranking.

**In plain terms:** `system-map.md` is the map a new agent or reader opens first
to find out what each part of the backend does. Its System 3 entry says ranking
is "semantic-primary". After the blend it is a hybrid of two signals, and the
entry's `Backed by:` list should name the new requirements so the map still
leads to the right place.

**What happens if you say no:** the first document anyone reads describes
ranking that the code no longer does.

Amends `PRD/sections/system-map.md`, `### Supplemental retrieval (System 3)`.

Current (byte-for-byte):

```markdown
- Summary: Selects up to 5 supplemental rule excerpts per request. The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is semantic-primary — cosine over committed per-rule embeddings — with the exact-rule-id boost merged in and lexical IDF scoring retained as the mock/offline default and the failure fallback; deduplicated against the System 2 selection by rule-number prefix.
- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact
- Backed by: DEC-032, DEC-046, REQ-178, REQ-179, REQ-180, REQ-181
```

Proposed replacement:

```markdown
- Summary: Selects up to 5 supplemental rule excerpts per request. The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by rule-number prefix.
- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact
- Backed by: DEC-032, DEC-046, REQ-178, REQ-179, REQ-180, REQ-181, REQ-182, REQ-183, REQ-184
```

- Verdict: accept
- Reason:

---

## system-map/game-rules-retrieval.md — the retrieval subsystem spec

**What this decides:** how the detailed current-state spec for rule retrieval
describes ranking, in the two places it says a hybrid blend is still a follow-up.

**In plain terms:** this file is the full technical description of how Ask AI
finds rules. Two passages — the narrative and the invariants list — say ranking
is semantic-primary and that a hybrid blend is the tracked follow-up before the
better mode can become the default. Both become wrong once the blend ships.

**What happens if you say no:** the subsystem's own spec contradicts the code it
describes, in the file an implementer reads before touching it.

Amends `PRD/sections/system-map/game-rules-retrieval.md`.

Current (byte-for-byte, in the System 3 narrative):

```markdown
ranks official rule excerpts and selects at most five. Ranking is semantic-primary:
when the embedding-provider seam is active the query is embedded and cosine-ranked
against a committed per-rule embedding vector, with the exact rule-ID and parent
rule-ID boost merged in so a cited rule number (for example "rule 613.9") is still
pulled even when semantic similarity misses it. The IDF-weighted lexical scorer is
retained as the mock/offline default, as the source of the exact-rule-ID boost, and as
the fallback whenever query embedding fails — so those settings are never worse than
System 3's earlier lexical-only behaviour. Under the `local` provider, measured
2026-09-05 on the 156-pair benchmark, semantic ranking is better overall (recall@5 0.85
vs 0.58 clean, 0.83 vs 0.53 with cards) and worse on short lookup-mode questions where
the query is a card name, type line, and one keyword (two of eight labelled fixtures
lose rule 702.2b from the top five); a hybrid lexical-plus-semantic blend is the tracked
follow-up before `local` becomes the default. Ties prefer the highest matching signal, then ascending
rule ID.
```

Proposed replacement:

```markdown
ranks official rule excerpts and selects at most five. Ranking is hybrid: when the
embedding-provider seam is active the query is embedded and cosine-ranked against a
committed per-rule embedding vector, that cosine score and the IDF-weighted lexical
score are each normalised against the query's own top score, and the two are blended by
a single tuned weight, with the exact rule-ID and parent rule-ID boost merged into the
blended score so a cited rule number (for example "rule 613.9") is still pulled even
when semantic similarity misses it. The IDF-weighted lexical scorer alone is retained as
the mock/offline default, as the source of the exact-rule-ID boost, and as the fallback
whenever query embedding fails — so those settings are never worse than System 3's
earlier lexical-only behaviour. The blend exists because semantic-only ranking, measured
2026-09-05 on the 156-pair benchmark, was better overall (recall@5 0.85 vs 0.58 clean,
0.83 vs 0.53 with cards) but lost an expected rule on short lookup-mode questions — a
card name, type line, and one keyword — in three of eight labelled fixtures, scoring 9
of 12 checks against lexical's 12 of 12 (REQ-182). Ties prefer the highest matching
signal, then ascending rule ID.
```

Current (byte-for-byte, in `## Invariants / gotchas`):

```markdown
- System 3 ranking is semantic-primary (cosine over committed rule embeddings) with the
  exact-rule-ID boost merged in and lexical retained as the mock/offline default and the
  failure fallback; those settings are never worse than the prior lexical-only behaviour
  (REQ-181). Under the `local` provider, semantic ranking measures better overall but
  worse on short lookup-mode questions (a card name, type line, and one keyword) — see
  REQ-181's notes; a hybrid lexical-plus-semantic blend is the tracked follow-up before
  `local` becomes the default.
```

Proposed replacement:

```markdown
- System 3 ranking is a hybrid blend (normalised cosine over committed rule embeddings
  plus normalised lexical IDF overlap) with the exact-rule-ID boost merged in and
  lexical alone retained as the mock/offline default and the failure fallback; those
  settings are never worse than the prior lexical-only behaviour (REQ-181, REQ-182).
  Semantic-only ranking measured better overall but worse on short lookup-mode questions
  (a card name, type line, and one keyword), which is what the blend exists to fix — see
  REQ-182's notes for the measured sweep.
```

- Verdict: accept
- Reason:

---

## quick-lookup/README.md — the Quick Lookup current-state spec

**What this decides:** how the spec for the screen where this problem actually
bites describes rule ranking.

**In plain terms:** Quick Lookup is the short-ask screen — a player attaches a
card and types one line. It is exactly the query shape the semantic mode gets
wrong, and this file says so, then says a hybrid blend is the tracked follow-up.
Once the blend ships, this is the spec that should describe it, because this is
the screen it was built for.

**What happens if you say no:** the spec for the affected screen still tells a
reader the fix is pending after it has shipped.

Amends `PRD/sections/quick-lookup/README.md`.

Current (byte-for-byte, the `### Retrieval` first bullet):

```markdown
- Built: System 3 supplemental rules retrieval (DEC-046) is semantic-primary
  when the embedding-provider seam is active (REQ-181) — the query embedding is
  cosine-ranked against the committed per-rule embeddings, with the
  exact-rule-id boost merged in — over a rule index with the source document's
  table of contents and heading-only entries stripped (REQ-179), excluding by
  rule-number prefix the curated rule numbers the always-on core topics already
  carry, and returning a small capped set of the best-ranked rules. IDF-scored
  keyword retrieval is retained as the mock/offline default and the fallback on
  any embedding failure, so those settings are never worse than the prior
  lexical behaviour. Under the `local` provider, semantic ranking measures
  better overall but worse on exactly this lookup-mode query shape — a card
  name, type line, and one keyword, with no combat context — where two of
  eight labelled fixtures lose their expected rule from the top five; a
  hybrid lexical-plus-semantic blend is the tracked follow-up before `local`
  becomes the default (REQ-181's notes). For lookup the query is built from the question tokens always, plus
  each attached card's name, type line, and keywords — not its oracle text
  (REQ-167, REQ-178). (DEC-046, REQ-022, REQ-178, REQ-179, REQ-181, DEC-107,
  REQ-167)
```

Proposed replacement:

```markdown
- Built: System 3 supplemental rules retrieval (DEC-046) is hybrid-ranked when
  the embedding-provider seam is active (REQ-182) — the query embedding is
  cosine-ranked against the committed per-rule embeddings and blended with the
  IDF keyword score, both normalised per query, with the exact-rule-id boost
  merged into the blended score — over a rule index with the source document's
  table of contents and heading-only entries stripped (REQ-179), excluding by
  rule-number prefix the curated rule numbers the always-on core topics already
  carry, and returning a small capped set of the best-ranked rules. IDF-scored
  keyword retrieval alone is retained as the mock/offline default and the
  fallback on any embedding failure, so those settings are never worse than the
  prior lexical behaviour. The blend exists for exactly this screen's query
  shape: semantic-only ranking measured better overall but worse on a card
  name, type line, and one keyword with no combat context, where three of eight
  labelled fixtures lost their expected rule from the top five (REQ-181,
  REQ-182). For lookup the query is built from the question tokens always, plus
  each attached card's name, type line, and keywords — not its oracle text
  (REQ-167, REQ-178). (DEC-046, REQ-022, REQ-178, REQ-179, REQ-181, REQ-182,
  DEC-107, REQ-167)
```

Current (byte-for-byte, the `- Retrieval:` bullet in the built-behaviour list):

```markdown
- Retrieval: System 3 returns a small capped best-ranked set (top 5), curated
  core-topic rule numbers excluded by prefix; ranking is semantic-primary
  (cosine over the committed per-rule embeddings) with the exact-rule-id boost
  merged and lexical IDF scoring retained as the mock/offline default and
  failure fallback (REQ-181); the query is the question tokens always, plus each
  attached card's name, type line, and keywords (REQ-167, REQ-178). (DEC-046,
  REQ-022, REQ-178, REQ-181, REQ-167)
```

Proposed replacement:

```markdown
- Retrieval: System 3 returns a small capped best-ranked set (top 5), curated
  core-topic rule numbers excluded by prefix; ranking is a hybrid blend of
  normalised cosine over the committed per-rule embeddings and normalised
  lexical IDF overlap, with the exact-rule-id boost merged into the blended
  score, and lexical scoring alone retained as the mock/offline default and
  failure fallback (REQ-181, REQ-182); the query is the question tokens always,
  plus each attached card's name, type line, and keywords (REQ-167, REQ-178).
  (DEC-046, REQ-022, REQ-178, REQ-181, REQ-182, REQ-167)
```

Proposed addition — the `Backed by:` id list at the top of the file gains the
new ids, replacing the byte-for-byte current line:

```markdown
  REQ-181, FLOW-006, FLOW-011, FLOW-023, NFR-001
```

with:

```markdown
  REQ-181, REQ-182, REQ-184, FLOW-006, FLOW-011, FLOW-023, NFR-001
```

- Verdict: accept
- Reason:

---

## in-depth/README.md — the In-Depth current-state spec

**What this decides:** how the long-form Ask AI spec describes the same ranking.

**In plain terms:** In-Depth is the full board-state question screen. Its spec
describes the same `ADDITIONAL RELEVANT RULE EXCERPTS` block and calls the
ranking semantic-primary, and its closed-doors list records that the old
word-overlap-only scoring was superseded. Both need the blend added so the two
screen specs do not disagree with each other.

**What happens if you say no:** the two screens that use the identical retrieval
code describe it differently.

Amends `PRD/sections/in-depth/README.md`.

Current (byte-for-byte, the `ADDITIONAL RELEVANT RULE EXCERPTS` bullet):

```markdown
- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
  scored per DEC-046 — semantic-primary ranking (cosine over the committed
  per-rule embeddings) when the embedding-provider seam is active, with the
  exact-rule-id boost merged and IDF-weighted lexical scoring retained as the
  mock/offline default and the fallback on any embedding failure (REQ-181), from
  a query built from the question plus each submitted card's name, type line,
  and keywords rather than its full oracle text (REQ-178), deduplicated against
  the System 2 selection by rule-number prefix (REQ-179) — omitted when nothing
  scores above 0. (DEC-032, DEC-046, REQ-022, REQ-178, REQ-179, REQ-181)
```

Proposed replacement:

```markdown
- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
  scored per DEC-046 — hybrid ranking (normalised cosine over the committed
  per-rule embeddings blended with the normalised IDF-weighted lexical score)
  when the embedding-provider seam is active, with the exact-rule-id boost
  merged into the blended score and lexical scoring alone retained as the
  mock/offline default and the fallback on any embedding failure (REQ-181,
  REQ-182), from a query built from the question plus each submitted card's
  name, type line, and keywords rather than its full oracle text (REQ-178),
  deduplicated against the System 2 selection by rule-number prefix (REQ-179) —
  omitted when nothing scores above 0. (DEC-032, DEC-046, REQ-022, REQ-178,
  REQ-179, REQ-181, REQ-182)
```

Current (byte-for-byte, the closed-door entry):

```markdown
- **DEC-032's flat +1-per-shared-word supplemental scoring — closed door.**
  DEC-046 replaced it with IDF-weighted relevance scoring, question/keyword boosts,
  and an improved tie-break. REQ-181 then made ranking semantic-primary, keeping
  that IDF scorer as the mock/offline default, the exact-rule-id boost, and the
  failure fallback — so the lexical path is demoted, never removed. (DEC-046,
  REQ-181)
```

Proposed replacement:

```markdown
- **DEC-032's flat +1-per-shared-word supplemental scoring — closed door.**
  DEC-046 replaced it with IDF-weighted relevance scoring, question/keyword boosts,
  and an improved tie-break. REQ-181 then made ranking semantic-primary, keeping
  that IDF scorer as the mock/offline default, the exact-rule-id boost, and the
  failure fallback; REQ-182 then blended the two into one score rather than
  choosing between them — so the lexical path is blended in, never removed.
  (DEC-046, REQ-181, REQ-182)
```

- Verdict: accept
- Reason:

---

## integrations-and-data.md — the provider seam and the vector artifact

**What this decides:** how the integrations spec describes the embedding
provider's default and the format the rule vectors ship in.

**In plain terms:** this file is the single authoritative statement of which
provider settings the app uses and what data it ships. Two things change: the
embedding provider gains an explicit deployed setting (REQ-184), and the rule
vectors change number format (REQ-183), which this file currently describes only
as "one 384-dimension vector per entry".

**What happens if you say no:** the authoritative integrations statement
describes a data format the repo no longer ships and omits the deployed provider
setting, which is the file people grep before changing either.

Amends `PRD/sections/integrations-and-data.md`.

Current (byte-for-byte, the Embedding Provider line):

```markdown
- Embedding Provider: backend embedding boundary for System 3 semantic rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` run in-process, `openai` → OpenAI embeddings API, live mode only). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default: `mock` and `local` make no per-request external call (REQ-181).
```

Proposed replacement:

```markdown
- Embedding Provider: backend embedding boundary for System 3 hybrid rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` run in-process and blended with the lexical score, `openai` → OpenAI embeddings API, live mode only). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default — the unset value is `mock`, and the deployed backend sets `local` explicitly the same way production sets `ASK_AI_PROVIDER=openai` (REQ-184). `mock` and `local` make no per-request external call (REQ-181, REQ-182).
```

Current (byte-for-byte, the embeddings artifact bullet):

```markdown
- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by a quantised `all-MiniLM-L6-v2`. There is no vector database — the vectors are loaded in-process and cosine-searched (REQ-181)
```

Proposed replacement:

```markdown
- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by a quantised `all-MiniLM-L6-v2` and stored in a compact number format named by the artifact's own `encoding` field, so the deploy package's data budget keeps real headroom (REQ-183, NFR-017). There is no vector database — the vectors are loaded in-process and cosine-searched, then blended with the lexical score (REQ-181, REQ-182)
```

Current (byte-for-byte, the query-embedding bullet):

```markdown
- query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, default `mock`); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and the mock default runs with no model access; `openai` is seam-selectable for live mode only (REQ-181)
```

Proposed replacement:

```markdown
- query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, unset default `mock`, deployed value `local` set explicitly per REQ-184); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and the unset default runs with no model access; `openai` is seam-selectable for live mode only (REQ-181)
```

Current (byte-for-byte, the prompt-content bullet):

```markdown
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked semantic-first against the committed per-rule embeddings with the exact-rule-id boost merged and lexical IDF scoring retained as the mock/offline default and failure fallback (DEC-046, REQ-181), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
```

Proposed replacement:

```markdown
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
```

- Verdict: accept
- Reason:

---

## system-map/prompt-layout-spec.md — the prompt anatomy spec

**What this decides:** how the document that lists every section of an Ask AI
prompt describes the way the supplemental rule excerpts are picked.

**In plain terms:** `prompt-layout-spec.md` is the readable anatomy of the
prompt — one line per section, in the order the backend assembles them, written
so nobody has to read the raw JSON to find out what a player's question actually
carries. Row 8 is `ADDITIONAL RELEVANT RULE EXCERPTS`, the up-to-five extra
rules Ask AI pulls in. That row says they are "ranked by meaning against
committed per-rule embeddings with a keyword-overlap fallback" — meaning-matching
first, word-matching only if meaning-matching breaks, which is what REQ-181
shipped. REQ-182 replaces that either/or with one blended score: the meaning
score and the word-overlap score are each scaled against the query's own best
score and added with a single tuned weight, and word-matching alone stays only as
the offline default and the failure fallback. The row should say that, and the
file's `Backed by:` list should name the new requirement so a reader lands in the
right place.

**What happens if you say no:** the one-page map of what goes into every prompt
describes a ranking rule the code no longer follows — in the same four-way
disagreement the other spec files are being corrected out of.

Amends `PRD/sections/system-map/prompt-layout-spec.md`.

Current (byte-for-byte, row 8 of the `## Sections, in assembly order` table):

```markdown
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by meaning against committed per-rule embeddings with a keyword-overlap fallback, from a query built from the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-167, REQ-178, REQ-181). |
```

Proposed replacement:

```markdown
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by a hybrid blend of normalised cosine against committed per-rule embeddings and normalised keyword-overlap score, with the exact-rule-id boost merged into the blended score and keyword-overlap scoring alone retained as the mock/offline default and the failure fallback, from a query built from the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-167, REQ-178, REQ-181, REQ-182). |
```

Proposed addition — the `Backed by:` id list at the top of the file gains the
new id, replacing the byte-for-byte current line:

```markdown
Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181
```

with:

```markdown
Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181, REQ-182
```

- Verdict: accept
- Reason:

---

## Blocker questions

None. Every uncertainty this node met was resolved from the conservative
assumption ladder in `PRD/instructions/preparation-contract.md` and recorded in
`DESIGN-BRIEF.md`, `## Material assumptions, with evidence`. Three of those
resolutions were consequential enough to put to you as their own requirement
rather than assume silently — REQ-183 (which budget lever), REQ-184 (whether and
where the semantic mode becomes the default), and REQ-182's choice to gate on
recall while reporting rather than gating mean reciprocal rank.
