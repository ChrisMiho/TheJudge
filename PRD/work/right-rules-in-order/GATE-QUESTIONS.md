# Gate questions — right-rules-in-order

**Ask:** Decide. Fill every `- Verdict:` with accept, edit or reject, and give a
`- Reason:` for edit or reject. 39 slots: 13 new requirements (REQ-233 to
REQ-245) and 26 amendments to current truth.

**What this whole change does, in game terms:** when a player asks a rules
question, the rules that decide it reach Luna (the answering model) about twice
as often, in rule-book order, labelled, with lists intact; Quick Lookup also gets
the turn-step summary when the question names a step. The design is in
`DESIGN-BRIEF.md`; every line of current truth this touches is listed in
`evidence/amendment-grep.md`.

**How the slots hang together.** The new requirements carry the behaviour; the
amendments bring existing text into line with them. If you reject a new
requirement, reject or edit the amendments that point at it (each amendment says
which new requirement it serves). Two slots need a deliberate yes:

- **REQ-232** — whether a search model trained partly on your local practice
  suite may ship. If no, the model trains without practice questions (intake:
  348 check-half citations against 449).
- **REQ-234** — the concept map puts card-wording terms into the search, which
  REQ-220's notes record as measured and rejected on the old model.

Diffs are against `PRD/sections/` at `61d32c76`. Hunks are labelled by
requirement section rather than line number; `build` applies them by intent
against current truth. Lines starting `+` are added, `-` removed, a space is
unchanged context.

---

## REQ-233 — search matches Magic words the way the rule book writes them

**What this decides:** whether the word-matching half of rule search gets five
fixes: sentence dots stop sticking to words, words are cut to their stem on both
sides, six everyday verbs stop counting as Magic keywords, a stray number stops
counting as a rule number, and ties fall back to rule-book order. A question
using an obsolete term like "mana burn" is also matched through the rule book's
own glossary.

**In plain terms:** rule search scores each rule two ways — by meaning (an
embedding, a list of numbers that captures what text is about) and by shared
words. Today the word half reads "attacks." and "attacking" as unrelated words,
gives counter, destroy, exile, sacrifice, trigger and replacement the extra
keyword weight meant for real Magic keywords, treats "100 life" as a pointer to
rule 100, and breaks ties with arithmetic that sorts 704.5aa wrongly. These fixes
are part of the measured recipe (intake: check-half citations 223 today, 449 with
the full recipe). The trade: stemming costs three corpus cases a few ranks
(702.3a, 113.7a, 615.12), which the trained model mostly recovers; the build
records them.

**What happens if you say no:** word matching stays as it is; the trained model
is trained and measured on the unfixed word query, and the recipe's numbers no
longer apply as measured.

```diff
@@ functional-requirements.md — new entry after REQ-232 @@
+### REQ-233
+- Title: System 3 word matching reads Magic words the way the rule book writes them
+- Priority: high
+- Description: System 3's word-overlap score — the lexical half of the hybrid blend (REQ-182) — matches question and card words against rule text more faithfully. Sentence dots no longer stick to words; every word is reduced to its stem on both the query side and the rule side, so "attacks" meets "attacking"; six everyday verbs stop counting as Magic keywords; a stray three-digit number is no longer read as a rule number; ties fall back to rule-book order; and a question that uses an obsolete Magic term is matched through the rule book's own glossary entry for it.
+- Acceptance Criteria:
+  - tokenizing, on the query side and in the committed rule index's `searchText` alike: a trailing sentence period is dropped while a rule-id token (`514.3a`) keeps its dots; "can't" and "it's" stay whole tokens; U+2028 and no-break spaces count as spaces
+  - every token with no digit and no dot is Porter-stemmed on both the query side and the rule side by one shared stemmer implementation, used by the rule-index build, the backend and the model-training export (REQ-236); `gameRulesTokenStats.json` is rebuilt from the stemmed rule side
+  - `gameRulesKeywordVocabulary.json` drops `counter`, `destroy`, `exile`, `sacrifice`, `trigger` and `replacement`, leaving 14 words; it still serves only question-text keyword detection (REQ-180)
+  - no "can't" → "cannot" mapping is added
+  - a bare three-digit number counts as a cited rule id only when "rule", "rules", "CR" or "section" directly precedes it; a dotted rule id (`613.9`, `704.5aa`) always counts
+  - candidates with equal scores are ordered by rule-book order — a comparator over the rule id's numbered parts and its letters, so `704.5z` sorts before `704.5aa` — replacing the numeric `parseFloat` comparison
+  - when the question contains a term the committed glossary (REQ-179) marks obsolete, the words of that glossary entry's definition join the word query at the concept weight (REQ-234) and are appended to the text that is embedded; a glossary entry is never delivered as an excerpt
+  - the lexical-only path (the `mock` default and the embedding-failure fallback) uses the same fixed tokens; the retrieval benchmark's lexical recall@5 is re-recorded at build, not gated
+  - the ranks of 702.3a (`defender-ageless-sentinels`), 113.7a (`sensei-top`) and 615.12 (`unpreventable-damage-hydra`) are recorded before and after this change, with the trained model (REQ-236) in place
+- Constraints:
+  - backend retrieval and offline build only; no request, response, schema or frontend change
+  - no new npm dependency: the stemmer is one in-repo module
+- Dependencies:
+  - REQ-179 (the rule index and glossary these tokens are built from)
+  - REQ-180 (the per-card keyword signal and the question-only vocabulary)
+  - REQ-182 (the blend this lexical score feeds)
+  - REQ-177 (the benchmark that records the lexical figure)
+- Notes:
+  - measured at intake (`right-rules-in-order` intake, probe session 4, 2026-10-11, cited, not re-derived): card keywords plus dot stripping together moved check-half citations 223 → 252 on today's model; a "can't" → "cannot" mapping measured zero; stemming cost the three cases above a few ranks before training
```

- Verdict: accept
- Reason:

---

## REQ-234 — card wording becomes rule-book concepts in the search

**What this decides:** whether search reads each card's wording through a fixed,
committed table of about 80 general phrase-to-concept rules — "at the beginning
of … upkeep" becomes "upkeep step triggered ability", "until end of turn" becomes
"cleanup step until end of turn effects end" — and adds those concept words to
the search.

**In plain terms:** today search never reads a card's rules text, only its name,
type line and keywords, because raw card text was measured to drown the question
(REQ-178: full card text dropped benchmark recall from 0.577 to 0.026). The
concept map adds a handful of rule-book words per card instead of the raw text.
It is fixed: ported word for word from the intake's appendix, written from
rule-book vocabulary before any result was seen, never generated by a model, and
a test checks every one of its words exists in the rule book. Note: REQ-220's
notes record that adding "replacement effect" terms from card wording was
measured and rejected on 2026-10-07 on the old model; this reverses that on the
trained model, measured by the intake (check half 432 without the map, 449 with)
and guarded here by the unrelated-cards benchmark.

**What happens if you say no:** the search keeps ignoring card wording; the
intake measured the recipe without the map at 432 check-half citations instead of
449, and Quick Lookup loses one way of knowing a card cares about a turn step.

```diff
@@ functional-requirements.md — new entry after REQ-233 @@
+### REQ-234
+- Title: A fixed concept map turns card wording into rule-book concepts for System 3
+- Priority: high
+- Description: System 3 reads each card's oracle text and type line through a fixed, committed concept map — general phrase-to-concept rules, one per common card templating — and adds the resulting rule-book concept terms to the search: to the word query at twice the weight of the card signal, and to the text that is embedded. The card's raw oracle text still never enters the main query or its embedding (REQ-178).
+- Acceptance Criteria:
+  - the map is one committed module (proposed `apps/backend/src/gameRulesConceptMap.ts`) holding `CONCEPT_MAP` (77 oracle-text entries) and `TYPE_MAP` (5 type-line entries), ported verbatim — every pattern and every term — from the `right-rules-in-order` intake appendix; after this ships, that module is the only copy
+  - input: each card's oracle text lower-cased, curly apostrophes turned into `'`, and the card's own name (each face of a `//` name) replaced by `~`; `TYPE_MAP` runs on the lower-cased type line; every matching entry adds its terms; the request's terms are de-duplicated
+  - word-query weights: question ×3, card signal ×1, concept term ×2; a keyword token is additionally ×6 on top of its source weight, as today
+  - the concept terms are appended to the embedded query text (`buildRetrievalQueryText`) in both modes, through the one shared query builder
+  - a committed test asserts that every distinct word of every concept term appears in the committed rule index's text (163 distinct words across the 82 entries on 2026-10-11, per the intake), and that the module holds 77 + 5 entries
+  - no model call ever produces search terms at request time
+  - concept terms also feed turn-step detection (REQ-238) and In-Depth curated-topic choice (REQ-242)
+- Constraints:
+  - entries stay general — one per common templating, never per test case; no added, reworded or AI-generated terms; any change to the map is a separate, owner-reviewed edit
+  - raw oracle text never enters the main query or its embedding (REQ-178)
+  - backend-only; no request, response, schema or frontend change
+- Dependencies:
+  - REQ-178 (the compact query this adds to)
+  - REQ-233 (the tokens and weights this uses)
+  - REQ-236 (training pairs are built with this query builder)
+  - REQ-220 (whose notes record the earlier, stock-model rejection of card-wording search terms)
+- Notes:
+  - measured at intake (cited, not re-derived): the recipe without the concept map scored 432 check-half citations against 449 with it, and bench@5 129 against 125; the raw-card-text alternative dropped bench@5 118 → 96, confirming REQ-178's concern
+  - REQ-220's 2026-10-07 measurement rejected adding "replacement effect" / "prevention effect" from card wording on the then-shipped stock model; this requirement adds a broader, fixed map on the trained model and is held to bench@5 ≥ 118 (REQ-236)
```

- Verdict: accept
- Reason:

---

## REQ-235 — each card gets its own search for two of the ten slots

**What this decides:** whether, besides the main search, each card's own rules
text is searched on its own, with two of the ten rule-excerpt slots reserved for
the best hits from those per-card searches.

**In plain terms:** a card's text never goes into the main search (REQ-178),
which protects the question from being drowned by unrelated cards. Per-card
search gets the card's own rules in a different way: each card is searched
separately, and only its single best hit can take one of two reserved slots. The
other eight slots work as today. It costs one extra local embedding per card,
about 4.5 ms each on a Mac. With no cards, or in the offline default, all ten
slots come from the main search.

**What happens if you say no:** all ten slots come from the main search; the
intake measured the recipe without per-card search at 441 check-half citations
instead of 449.

```diff
@@ functional-requirements.md — new entry after REQ-234 @@
+### REQ-235
+- Title: Per-card search fills two reserved System 3 slots
+- Priority: medium
+- Description: Besides the main query, System 3 runs one search per card: the card's oracle text, embedded on its own and cosine-ranked against the committed rule vectors. Two of the ten System 3 slots are reserved for the best per-card hits — the top hit of the highest-scoring cards, skipping any rule already selected. Card text never enters the main query, so the other eight slots keep REQ-178's protection against unrelated cards drowning the question.
+- Acceptance Criteria:
+  - for each distinct card in the request — the attached cards in lookup mode, every stack and zone card in game mode, one search per oracle id — the async route handler embeds the card's oracle text as the card-detail artifact holds it and passes the vectors into prompt preparation with the main query vector, so `preparePromptInput` stays synchronous (REQ-181)
+  - the main ranking fills the first eight slots; then cards are taken in order of their best per-card cosine score, and each contributes its top-ranked rule unless that rule is already selected (then the card is skipped), until the two reserved slots are filled; slots left unfilled go back to the main ranking, so the total stays at most ten
+  - per-card hits obey the exact-number curated exclusion (REQ-179)
+  - the number of reserved slots is one named constant, `2`; the System 3 cap stays ten (REQ-190)
+  - with no cards, under `EMBEDDING_PROVIDER=mock`, or when a card's embedding fails, that card contributes nothing and the main ranking fills the slots; an embedding failure emits one diagnostic warning
+  - the enrichment-debug sidecar names which selected rules came from per-card search and for which card
+  - the offline gates — the rules gate (REQ-222), the labelled context-eval checks (REQ-032) and `npm run eval:worked-solutions` — use committed frozen per-card vectors built by the shipped local embedder, each stored with a hash of the card text it was embedded from, so they stay offline and mirror production
+- Constraints:
+  - the per-card text is never merged into the main query or its embedding (REQ-178)
+  - in-process only; no per-request external call; no request, response or frontend change
+- Dependencies:
+  - REQ-178 (the main query this stays apart from)
+  - REQ-181 (the embedder seam and the synchronous preparation contract)
+  - REQ-190 (the cap and the larger-cap legs)
+  - REQ-222 (the offline gate that needs frozen per-card vectors)
+- Notes:
+  - measured at intake (cited): the recipe without per-card search scored 441 check-half citations against 449 and bench@5 127 against 125; one extra embedding costs about 4.5 ms per card on a Mac; the post-deploy live timing records the Lambda figure
```

- Verdict: accept
- Reason:

---

## REQ-236 — a search model trained on Magic questions

**What this decides:** whether rule search uses a version of today's small
embedding model fine-tuned on Magic rules questions, with a committed script
that trains it, scores it honestly, and exports it, and which the owner re-runs
locally whenever the rule book, the corpus or the practice suite changes.

**In plain terms:** today's model (`all-MiniLM-L6-v2`, the small general-purpose
model that turns text into numbers for meaning search) has never seen a Magic
question. Training it on the committed corpus, the rule book's worked examples,
and your local practice suite teaches it which rules decide which situations.
Same size, same speed. Scored by 5-fold cross-validation — every question is
scored by a model that never trained on it — the intake measured 449 check-half
citations against 223 today. Two honest caveats from the intake: the gain
concentrates on often-cited rules (88% of suite citations are rules seen in
training; never-seen rules go only from 51 to 73 found), and it is not
near-duplicate leakage (on questions with no close training twin, 465 → 748).
This slot also decides one gate rule: swapping the model will move individual
corpus results, so the offline rules gate (REQ-222, which fails a pull request
when a deciding rule that used to reach the prompt stops reaching it) is
re-baselined once, here, with every lost hit listed and net hits required to
rise.

**What happens if you say no:** search keeps the stock model; parts A, B and D
can still ship, and the gains are the token fixes' (intake: about 252 check-half
citations) rather than about 449.

```diff
@@ functional-requirements.md — new entry after REQ-235 @@
+### REQ-236
+- Title: System 3 uses a Magic-trained search model, retrained by the owner
+- Priority: high
+- Description: The embedding model System 3 ranks rules with is `all-MiniLM-L6-v2` fine-tuned on Magic rules questions — the committed rules test corpus (REQ-185), the Comprehensive Rules' own worked examples, and the owner's local practice suite (REQ-232) — so it learns which rules decide which situations. It keeps the base model's size, 384 dimensions and speed. A committed pipeline trains it, scores it by cross-validation and exports it; the owner runs it locally, and retrains whenever its inputs change.
+- Acceptance Criteria:
+  - a committed training pipeline under `scripts/` — an export step in Node and a trainer in Python 3.12 run through `uv` with `python -I` — reads the practice suite from a folder given by a flag (default the git-ignored `output/practice-suite/`), the committed corpus and the committed rule index, and writes training pairs, checkpoints and the model only under git-ignored folders
+  - every training pair's query side is built by the shipped production query builder (REQ-178 as amended, REQ-233, REQ-234, and the In-Depth turn step); the rule side is the production embedding text `${sectionTitle}: ${text}` sliced to 2,000 characters (REQ-181); training runs only after the rule-data and search changes have landed
+  - each `Example:` passage in the rule book is paired with its rule (277 pairs over 215 rules at intake), with the example stripped from that rule's text for that pair
+  - each pair carries one hard negative drawn from the current search's top 40, with the deciding rule's whole family removed
+  - recipe: base `sentence-transformers/all-MiniLM-L6-v2`; sentence-transformers, cached MultipleNegativesRankingLoss; batch 32 (mini-batch 16) with no-duplicates batching; learning rate 5e-5; 4 epochs; 10% warmup; max length 512; seed 13
+  - export: ONNX opset 14, then dynamic int8 quantisation, per-channel, reduced range; laid out the way transformers.js loads it (`onnx/model_quantized.onnx` plus tokenizer and config); about 23.0 MB
+  - a cross-validation mode trains 5 fold models — grouped so both versions of a corpus case, and practice questions sharing a card set, stay in one fold — scores every question with a model that never trained on it, and prints counts only; the shipped model trains on 100% of the data
+  - a committed scorer reports, counts only: deciding-rule citations in the top ten and questions with every deciding rule there, for the tuning and check halves of the fixed `pft-split-1` split, the hard 25 (level 3 / Corner Case), the corpus, and bench@5 (the 156-question benchmark with three unrelated cards attached, top-five hits)
+  - fidelity, before any search change: the scorer reproduces production's current top ten — 473 suite citations (tuning plus check), 159 suite every-rule questions, 5 hard-25, 351 corpus citations, 305 corpus every-rule cases
+  - acceptance, measured once at build, locally: cross-validated check half ≥ 430, tuning half ≥ 410, every-rule check ≥ 140, hard 25 ≥ 15; the 100% model scores corpus ≥ 410 citations and ≥ 355 every-rule cases, bench@5 ≥ 118, and puts 514.1, 514.2 and 514.3a in the top ten for `necropotence-silence-borne-upon-a-wind-cleanup` in both versions and in the built prompt
+  - the rules gate (REQ-222) is re-baselined once, in this change, with `npm run eval:rules-gate:baseline -- --allow-regressions`; every lost hit is listed by case and rule in the pull request body and the receipt, and the total recorded hits rise
+  - retraining is an owner-run local step, required when the Comprehensive Rules, the committed corpus or the practice suite changes, and with every Comprehensive Rules-moving data refresh (`integrations-and-data.md`, Game Rules Data Strategy)
+- Constraints:
+  - no practice-suite question, answer, card list, id or per-question result in any committed file — committed text gives counts, levels and rule ids only (REQ-232)
+  - no model weights, checkpoints or training pairs in git; the repository is public
+  - never in `npm test`, `npm run quality:check` or CI; the acceptance above is a one-time local measurement, not a standing gate (REQ-232)
+  - the Python toolchain is dev-only and owner-run; nothing in it becomes a runtime or CI dependency
+  - suite answers are never ground truth (REQ-185): training uses each suite question's cited rules, never its answer as a reference
+- Dependencies:
+  - REQ-185 (the committed corpus)
+  - REQ-232 (the local practice suite, amended to allow this use)
+  - REQ-233, REQ-234, REQ-235 (the shipped query builder training must use)
+  - REQ-237 (where the model is stored and how it is checked)
+  - REQ-181 (the embedding text and provider seam)
+  - REQ-222 (the offline gate re-baselined here)
+- Notes:
+  - measured at intake (probe session 4, 2026-10-11, cited, not re-derived), check half / tuning half citations: today 223 / 250; the full recipe 449 / 433; trained without practice questions 348 / 351; hybrid recall@100 37.8% → about 70%; when a deciding rule still misses the top ten its median rank improves from about 450 to about 86
+  - caveats accepted at intake: 88% of suite citations are rules the model saw in training (found 422 → 713); never-seen rules go 51 → 73; on the 1,139 questions with no training question closer than cosine 0.7, 465 → 748, so the gain is not near-duplicate leakage; the practice questions provide almost all of the suite gain, the corpus cases and rule-book examples almost all of the corpus gain
+  - tested and rejected at intake: BM25 word scoring (ties the recipe on the check half, worse elsewhere), stronger off-the-shelf embedders (at most +13 check-half at 4–14× the size), a local reranker (+18 at 279 MB and about 3 s per question), labelled rule text inside the vectors (−17)
+  - about 7–8 minutes to train the 100% model on an Apple GPU
```

- Verdict: accept
- Reason:

---

## REQ-237 — the trained model is stored privately and checked at every load

**What this decides:** where the trained model lives and how the app makes sure
it is running the right one: in the project's private S3 bucket, named and
hashed in a small committed manifest, fetched and checked at packaging, with
every committed vector file recording which model built it.

**In plain terms:** the repository is public, so the model can't go in git.
Today the stock model downloads from Hugging Face (a public model host) when the
deploy package is built. The trained model instead lives in the S3 bucket the
deploy already uses, which blocks public access. The deploy fetches it, checks
every file's fingerprint (a sha256 hash) against the manifest, and refuses to
build a package that doesn't match. If the rule vectors were ever built by a
different model than the one running, search would silently compare apples to
oranges; this makes that loud instead. Nothing is fetched when a request
arrives or when the server starts. You upload the model once, before merging the
code change; the build hands you the exact command.

**What happens if you say no:** there is no safe place to keep the trained
model, so REQ-236 cannot ship; search stays on the stock model.

```diff
@@ functional-requirements.md — new entry after REQ-236 @@
+### REQ-237
+- Title: The trained search model is stored privately, fetched at packaging, and identity-checked at every load
+- Priority: high
+- Description: The trained model (REQ-236) never enters the public repository. It is stored in the project's private, public-access-blocked S3 bucket; a small committed manifest names it and records a hash for every file; a fetch script fills the local model cache from S3 and verifies the hashes; packaging refuses without a verified model; and every committed vector file records the model that built it, so a mismatch with the running model is caught loudly instead of ranking with the wrong vectors.
+- Acceptance Criteria:
+  - the owner uploads the 100% model folder to `thejudge-lambda-artifacts-<account>` (the bucket `scripts/aws-bootstrap.sh` creates, public access blocked) under `models/<model-id>/`
+  - a committed manifest (proposed `apps/backend/data/embeddingModel.manifest.json`) records `<model-id>`, the base model, and a sha256 and byte size for every file in the folder
+  - a committed fetch script (proposed `scripts/fetch-embedding-model.mjs`) downloads `models/<model-id>/` into the git-ignored `apps/backend/data/models/<model-id>/`, verifies every file against the manifest, and exits non-zero on any missing or mismatched file; it replaces the Hugging Face download in `scripts/warm-embedding-model-cache.mjs` for this model
+  - `LOCAL_MODEL_ID` in `apps/backend/src/providers/localEmbeddingProvider.ts` is the manifest's model id, loaded from the local cache only, never downloaded at runtime
+  - every committed vector file is rebuilt with the trained model and records its model id and the manifest's hash: `apps/backend/data/gameRulesRuleEmbeddings.json`, `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`, `apps/backend/src/prompt/preparation.crossReferenceQueryEmbedding.json`, `apps/backend/src/eval/rules-gate/frozen-query-vectors.json`, and the frozen per-card vectors (REQ-235)
+  - identity check at load: a vector file whose recorded model id differs from the running model's disables the semantic path with one error-level diagnostic naming both ids — REQ-181's lexical fallback, never a mixed ranking; the eval harnesses, the retrieval benchmark and the rules gate refuse to run on a mismatch; `scripts/package-lambda.sh` refuses (exit 1) when the packaged model's id or file hashes do not match the manifest, or the committed rule embeddings name a different model
+  - the deploy role can read `models/*` in the bucket; if it cannot, `scripts/aws-bootstrap.sh` grants `s3:GetObject` on that prefix (the owner runs bootstrap locally with profile `thejudge-admin`; CI cannot provision)
+  - CI quality checks need no AWS access and no model: the unset `EMBEDDING_PROVIDER` stays `mock`, and tests that need vectors read the committed frozen ones
+  - the model is fetched only when the deploy package is built and when the owner trains or rebuilds vectors locally — never at Lambda cold start, never per request
+- Constraints:
+  - no model weights in git
+  - no runtime external call; the model ships inside the deploy package as today
+  - the model sits in NFR-017's non-data reserve at about the same size as today (about 23 MB)
+- Dependencies:
+  - REQ-236 (the model)
+  - REQ-181 (the embedder seam and lexical fallback)
+  - REQ-183 (amended: the model may now live in S3)
+  - REQ-184 (the packaging refusal this repoints)
+  - NFR-017 (the package budget)
+- Notes:
+  - storage design per the `right-rules-in-order` intake (C.5, C.6), cited
```

- Verdict: accept
- Reason:

---

## REQ-238 — step summaries are corrected, and Quick Lookup gets them

**What this decides:** whether the short "what happens in this step" paragraphs
are corrected against the rules, and whether Quick Lookup gets the paragraph
for any turn step the question names (or an attached card's wording points at),
the way In-Depth gets it for the current step.

**In plain terms:** three paragraphs are wrong today. Cleanup doesn't say that
"this turn" and "until end of turn" effects end before any priority, and that
players get priority in cleanup only if something triggers (rules 514.2,
514.3a). Untap says triggered abilities resolve before upkeep; they actually wait
until upkeep to go on the stack (502.4). Declare blockers mentions a
damage-assignment order the rules no longer have. In the Necropotence corner
case, In-Depth's ordered cleanup paragraph is the main reason it answered right
10 of 12 times against Quick Lookup's 6 of 12; in 5 of 6 Quick Lookup misses
Luna found the priority window and still ruled Silence applies.

**What happens if you say no:** the wrong facts stay, and Quick Lookup never
gets step summaries.

```diff
@@ functional-requirements.md — new entry after REQ-237 @@
+### REQ-238
+- Title: Turn-step summaries are correct, and Quick Lookup gets them when a step is named
+- Priority: high
+- Description: The phase-guidance summaries — the short "what happens in this step" paragraphs — are corrected against the Comprehensive Rules, and Quick Lookup now receives the summary for any turn step its question names, or that an attached card's wording points at through the concept map (REQ-234), the same help In-Depth gets for its current step.
+- Acceptance Criteria:
+  - cleanup: says that damage is removed and "until end of turn" and "this turn" effects end (514.2) before any player gets priority, and that players get priority in cleanup only if a state-based action is performed or an ability triggers, after which another cleanup step follows (514.3a)
+  - untap: says no player receives priority, and an ability that triggers during untap is put on the stack the next time a player would receive priority, usually in upkeep (502.4) — replacing "resolved before moving to the upkeep step"
+  - declare blockers: drops "The active player orders damage assignment for multiply-blocked creatures", which the rules no longer contain
+  - every step's text is reviewed against the Comprehensive Rules, and a test pins each step to the rule ids it summarises and asserts those ids exist in the committed rule index
+  - one source of step text serves both modes; In-Depth adds its "You are in the … step." lead line, Quick Lookup describes the step without claiming the game is in it
+  - Quick Lookup: a step is named when the question contains a step name from one fixed committed table of the rule book's step and phase names (untap, upkeep, draw, main, beginning of combat, declare attackers, declare blockers, combat damage, end of combat, end, cleanup), or when an attached card's concept terms (REQ-234) name a step; the prompt carries the summary for each named step, de-duplicated, in turn order, at most three, under a `PHASE GUIDANCE` heading right after `MTG REFERENCE`
+  - In-Depth keeps its current-step summary in its current place, with the corrected text
+  - acceptance: over every committed corpus case built as a Quick Lookup prompt, the summary is present whenever the question names a step; the Necropotence case's Quick Lookup prompt carries the cleanup summary
+- Constraints:
+  - guidance is reference text; no rules-validation behaviour (REQ-024)
+  - no request change: Quick Lookup still sends no game state
+- Dependencies:
+  - REQ-024 (phase guidance, amended)
+  - REQ-074 (Quick Lookup assembly, amended)
+  - REQ-234 (the concept terms that can name a step)
+- Notes:
+  - measured at intake on the saved prompts of the paid runs (cited): In-Depth answered `necropotence-silence-borne-upon-a-wind-cleanup` right 10 of 12 times, Quick Lookup 6 of 12; Quick Lookup's prompt had 703.4p fifth, after the priority rules, 514.3 without 514.3a, and no step guidance; in 5 of 6 Quick Lookup misses Luna found the priority window and still ruled that Silence applies (pooled p ≈ 0.04, a consistent mechanism, not yet proven — the post-merge paid run is the proof)
```

- Verdict: accept
- Reason:

---

## REQ-239 — rule excerpts in rule-book order, grouped and labelled

**What this decides:** whether the extra rule excerpts are printed in rule-book
order, grouped by rule family under a label saying where they sit, each rule
number printed once, with a parent's lead-in sentence above a sub-rule that
can't stand alone.

**In plain terms:** today Luna gets the excerpts in search-score order with no
labels. In the Necropotence case she read 703.4n, 514.3, 514.1, 724.1f, 703.4p —
a jumble — and 514.3a printed as "514.3a. 514.3a …". After this she reads
"Turn Structure › Cleanup Step" followed by 514.1, 514.2, 514.3, 514.3a in
order. Which rules are chosen doesn't change; only how they are laid out. About
370 rule pieces (13%) start with "First", "At this point", refer to "this rule",
or are list items that mean nothing without their parent's lead-in; those get it.

**What happens if you say no:** excerpts stay in score order, unlabelled, with
the doubled numbers.

```diff
@@ functional-requirements.md — new entry after REQ-238 @@
+### REQ-239
+- Title: Rule excerpts arrive in rule-book order, grouped by family and labelled
+- Priority: high
+- Description: The `ADDITIONAL RELEVANT RULE EXCERPTS` section prints its selected rules in rule-book order instead of score order, grouped by rule family under a path label built from the rule book's own titles, each rule's number printed once, and a sub-rule that cannot stand alone printed with its parent's lead-in sentence. Which rules are selected does not change.
+- Acceptance Criteria:
+  - excerpts are sorted by rule-book order (the comparator REQ-233 defines) after selection; selection, the cap and the curated exclusion are unchanged
+  - excerpts sharing a three-digit section (for example every 514.x) form one group, headed by a path label "<part title> › <section title>" taken from the titles the rule index stores (REQ-179) — for example "Turn Structure › Cleanup Step"; a section titled "General" is labelled with its part ("Turn Structure › General"), never "General" alone
+  - each rule prints as its id once, then its text — never `514.3a. 514.3a …`
+  - a sub-rule whose parent is not itself in the prompt is preceded by the parent's lead-in sentence (the parent's last sentence) when the sub-rule is an item of the parent's list (REQ-240), begins with "First", "Second", "Third", "Fourth", "Fifth" or "At this point", or says "this rule"
+  - curated topics in `GAME RULES (reference)` print each rule's id once, in rule-book order within each topic
+  - acceptance: over every committed corpus case's built prompts (REQ-240's set), 100% of excerpts are in rule-book order and 0 rule ids are printed twice
+- Constraints:
+  - prompt layout only; no change to which rules are selected
+  - verbatim rule text only; labels are the rule book's own titles
+- Dependencies:
+  - REQ-179 (the stored part and section titles)
+  - REQ-233 (the rule-order comparator)
+  - REQ-240 (lead-in lists)
+  - REQ-022 (the excerpt section)
+- Notes:
+  - measured at intake (cited): 370 index pieces (13%) need their parent's lead-in to make sense
```

- Verdict: accept
- Reason:

---

## REQ-240 — a rule that promises a list arrives with its list

**What this decides:** whether a delivered rule that ends by introducing a list
("…determined by the following rules:", "…subject to the following exception:")
always brings the list items with it — for search excerpts and the curated
always-on topics alike — and whether three curated topics get the rules they are
missing.

**In plain terms:** today 514.3 arrives saying "subject to the following
exception:" with the exception (514.3a) missing, and the always-on stack topic
prints 117.3 "determined by the following rules:" with nothing after it, in 414
of 415 corpus prompts; the zones topic does the same with 400.7 in 398. After
this, the list comes along. List items don't use any of the ten excerpt slots.
For search excerpts they share a budget of 12,000 characters per prompt (the
largest list in the rule book, the state-based actions, is 5,359). The always-on
topics get their lists permanently, which adds about 3,750 characters to every
prompt. The layer topics gain 613.4d and 613.8b, and the delayed-trigger topic
carries 603.7a–c instead of 603.10.

**What happens if you say no:** lead-ins keep arriving without their lists, and
the three topics stay as they are.

```diff
@@ functional-requirements.md — new entry after REQ-239 @@
+### REQ-240
+- Title: A rule that introduces a list is delivered with its list
+- Priority: high
+- Description: When a delivered rule ends by introducing a list — "…determined by the following rules:", "…subject to the following exception:" — the list's items are delivered with it, in search excerpts and curated topics alike, so the model never reads a lead-in with its list missing. Three curated topics also gain rules they lack.
+- Acceptance Criteria:
+  - a lead-in is a rule whose text ends with a colon, or with "following exception.", "following exceptions." or "following rules."; its list is its directly lettered sub-rules in the committed rule index. Measured at define on the committed index (2026-10-11): 28 lead-ins have such a list; list size median 1,071 characters, 90th percentile 3,587, largest 5,359 (704.5, 24 items)
+  - search excerpts: a delivered lead-in brings every item of its list not already delivered; list items never use any of the ten System 3 slots; all list items added to one prompt share a budget of 12,000 characters; a list that does not fit the remaining budget is never cut — the lead-in is followed by one line naming the omitted range
+  - curated topics: a topic rule that is a lead-in lists its items as topic rule numbers in `gameRulesTopicManifest.json` — `stack-and-priority` gains 117.3a–117.3d, `zones-basics` gains 400.7's twelve lettered sub-rules
+  - `layers-power-toughness` gains 613.4d and `layers-timestamps-dependencies` gains 613.8b; `abilities-delayed-triggers` carries 603.7a, 603.7b and 603.7c in place of 603.10
+  - the curated exclusion follows the manifest (REQ-179), so a topic's list items never repeat as search excerpts, and REQ-179's test that every topic carries exactly the rules it lists still passes
+  - the build-policy test's cap on total curated topic text (26,000 characters today) is raised to the new measured total rounded up to the next 1,000, recorded in these notes
+  - acceptance: over every committed corpus case built as a Quick Lookup prompt, and as an In-Depth prompt when it has a game state, 0 lead-ins appear without their list and the omitted-range line fires 0 times
+- Constraints:
+  - verbatim rule text only
+  - the ten-slot cap is unchanged (REQ-190)
+- Dependencies:
+  - REQ-179 (the exact-number exclusion and topic data test)
+  - REQ-022 (curated topics)
+  - REQ-239 (layout of delivered list items)
+- Notes:
+  - measured at intake (cited): curated 117.3 dangles without its list in 414 of 415 corpus prompts, 400.7 in 398
+  - measured at define from the committed index: 117.3's list is 916 characters, 400.7's 2,833 — about 3,750 characters added to every prompt through the always-on topics
+  - takes up the follow-up REQ-179's notes recorded as out of scope on 2026-10-07 (expanding a rule that ends "the following rules:" into its sub-rules)
```

- Verdict: accept
- Reason:

---

## REQ-241 — rulings sit under their card

**What this decides:** whether each card's published Wizards rulings print
directly under that card, introduced as rulings for that card to apply only when
the situation matches, instead of in a separate section after all the rules.

**In plain terms:** In-Depth today prints the cards, then all the rules, then
every card's rulings together at the end, so Luna reads a card's rulings far
from the card. Rulings are answers to specific situations; framing them as
"apply only when the situation matches" stops them being read as general rules.
Quick Lookup gets the same placement. Every ruling still reaches the prompt.

**What happens if you say no:** rulings stay in their own section after the
rules, framed as general reference.

```diff
@@ functional-requirements.md — new entry after REQ-240 @@
+### REQ-241
+- Title: Wizards rulings sit under their card, framed as situation-specific
+- Priority: medium
+- Description: Each card's published Wizards (WotC) rulings print directly under that card's block, introduced as rulings for that card to apply only when the situation matches, instead of in a separate section after the rules (In-Depth) or after the cards (Quick Lookup).
+- Acceptance Criteria:
+  - In-Depth: each card's rulings follow its block in its zone section; a card shown more than once (copies, or several zones) carries its rulings once, under its first appearance (stack bottom to top, then zones in canonical order)
+  - Quick Lookup: each attached card's rulings follow its block in `CARD (looked up)`
+  - the standalone `OFFICIAL RULINGS (WotC reference)` section is retired; each card's rulings open with one line framing them as that card's rulings, to apply only when the situation matches (exact wording at build)
+  - which rulings are selected, their per-card and section limits, and the WotC-only filter are unchanged; the rules gate's card check (REQ-222) still finds every ruling
+- Constraints:
+  - no request, response or frontend change
+- Dependencies:
+  - REQ-022 (section order, amended)
+  - REQ-074, REQ-167 (Quick Lookup per-card enrichment)
+  - REQ-222 (the card check)
+- Notes:
+  - located at intake (cited): `normalization.ts:9-11`, `promptFormatting.ts:280-285`
```

- Verdict: accept
- Reason:

---

## REQ-242 — In-Depth picks its curated rules topics from the cards and the question

**What this decides:** whether In-Depth chooses its curated rules topics by
what the cards say (through the concept map) and what the player asks, instead
of by which zones hold cards.

**In plain terms:** today any card on the battlefield pulls in six fixed topics
(layers, replacement effects and more) and any spell on the stack pulls in five,
whether or not the question is about them. After this, those eleven topics come
in when a card's wording or the question's words match the topic. Turn-step and
combat-step topics, and the replacement-interaction gate (REQ-220: two or more
cards saying "instead" or "prevent"), stay as they are. Quick Lookup is not
changed. Guard: on the 9 corpus cases that exist in both versions, In-Depth
today delivers 17 of their 30 deciding rules; it must keep at least 17.

**What happens if you say no:** In-Depth keeps choosing those topics by which
zones are populated.

```diff
@@ functional-requirements.md — new entry after REQ-241 @@
+### REQ-242
+- Title: In-Depth chooses curated topics by card wording and question, not by zone presence
+- Priority: medium
+- Description: In In-Depth, the curated topics that today are added because the stack or the battlefield holds cards are instead added when the cards' wording (through the concept map, REQ-234) or the question's words match the topic. The always-on core, the turn-phase and combat-step topics, the delayed-trigger topic and REQ-220's replacement-interaction gate are unchanged. Quick Lookup is unchanged.
+- Acceptance Criteria:
+  - the stack-populated trigger (5 topics) and the battlefield-populated trigger (6 topics) are removed; each of those 11 topics is selected when a concept term from any card or a stemmed question word (REQ-233) matches one of the topic's trigger terms
+  - trigger terms live in one fixed committed table, built only from words of the topic's own title and its listed rules' section titles in the rule book; a test asserts every trigger word appears in the committed rule index
+  - the always-on core, turn-phase and combat-step triggers, the delayed-trigger phase trigger and REQ-220's gate are unchanged
+  - Quick Lookup's selection is unchanged: four always-on topics plus REQ-220
+  - one shared selection function still serves both modes (REQ-220)
+  - acceptance: on the 9 corpus cases that exist in both versions, In-Depth keeps at least 17 of their 30 deciding rules in the prompt
+- Constraints:
+  - card names and keywords never select a topic; card wording does, through the fixed concept map only
+  - no model call selects topics
+- Dependencies:
+  - REQ-022 (System 2 selection, amended)
+  - REQ-220 (the card-wording gate, amended)
+  - REQ-234 (the concept terms)
+- Notes:
+  - measured at intake (cited): across the 9 paired corpus cases, In-Depth delivered 17 of 30 deciding rules against Quick Lookup's 6 of 30, mostly through its zone-triggered layer topics
+  - located at intake: `gameRulesTopicSelection.ts:32-39, 134-136`
```

- Verdict: accept
- Reason:

---

## REQ-243 — one instruction list, a reference block per mode, rules framed as binding

**What this decides:** whether the prompt's instructions and background block
are cleaned up: one shared instruction list for both modes, a background block
per mode so Quick Lookup isn't told about sections it doesn't have, one way of
numbering the stack, the rules framed as binding instead of "shared vocabulary",
and the three near-identical "does not override" lines collapsed into one.

**In plain terms:** Quick Lookup today is told about a phase-guidance section, a
scope note and a stack it never receives. The stack is called `stack[0]` in one
line and "Stack item 1" in another. Its off-domain instruction points the model
at a "phrasing glossary" it never sees, inside a garbled sentence. Every rules
section says the rules are "shared vocabulary" that "do not override" the game
state, three times over. After this, each mode's prompt only describes what it
contains, the stack is "Stack item 1 is the bottom" everywhere, the rules are
stated once as binding, and once that they never override the submitted game
state or a card's own text. The "use only the provided context" line and the
system-channel question stay for a later paid test.

**What happens if you say no:** the instructions and reference block stay as
they are, including the references to absent sections.

```diff
@@ functional-requirements.md — new entry after REQ-242 @@
+### REQ-243
+- Title: One instruction list, a reference block per mode, one stack numbering, and rules framed as binding
+- Priority: medium
+- Description: Both modes build their instructions from one shared list; each mode gets its own reference block that describes only sections that mode contains; the prompt numbers the stack one way; and the rules are framed once as the binding rules of the game, with a single statement that they never override the submitted game state or a card's oracle text.
+- Acceptance Criteria:
+  - one shared instruction list in code serves both modes: explain reasoning, state uncertainty, never invent hidden state, quote rule text verbatim only from the provided rules sections, and the rules-framing line below; mode additions only: Quick Lookup's off-domain line (REQ-168) and In-Depth's follow-up line
+  - the off-domain line keeps REQ-168's meaning — common Magic-adjacent phrasing is in-domain; the "not found in the rules corpus" reply is reserved for input genuinely not about Magic, with a request to check spelling or rephrase — and drops its pointer to a phrasing glossary the prompt does not contain, and its garbled clause
+  - In-Depth's reference block keeps today's content; Quick Lookup's block keeps the turn order, the stack's resolution order and the layer list, and omits the app's turn-phase field, the zone model, the scope note and any mention of a section Quick Lookup lacks
+  - the prompt numbers the stack one way, 1-based to match the stack section's `Stack item N` labels, with item 1 the bottom; the preamble's `stack[0]` wording goes, and the stack-order line appears only in In-Depth; bottom-to-top meaning is unchanged
+  - rules framing: one instruction says the provided Comprehensive Rules excerpts are the binding rules of the game; one instruction says rules and rulings never override the submitted game state (stack order, zones, targets, notes) or a card's oracle text; the per-section disclaimers on `GAME RULES (reference)`, the excerpt section and the rulings are removed, and the reference block's "use layers as shared vocabulary" sentence goes
+  - unchanged, pending a later paid test: the preamble's "use only the provided context" line, and the single user-message channel
+  - acceptance: over every committed corpus case's built prompts (REQ-240's set), 0 references to a section absent from that prompt's mode
+- Constraints:
+  - prompt text only; no request, response or frontend change
+  - bottom-to-top stack semantics preserved (`technical-design-rules.md`)
+- Dependencies:
+  - REQ-022 (the rules section disclaimer, amended)
+  - REQ-074 (Quick Lookup assembly, amended)
+  - REQ-168 (the off-domain line)
+  - REQ-024 (phase guidance)
+- Notes:
+  - located at intake (cited): `mtgReference.ts:7, 18`; stack numbering 0-based at `promptFormatting.ts:15`, 1-based at `:225`; the glossary pointer at `promptAssembly.ts:149`; the disclaimers at `gameRules.ts:15-16`
```

- Verdict: accept
- Reason:

---

## REQ-244 — "see rule X" pointers carry what they point at

**What this decides:** whether a delivered rule that says "see rule X" gets the
first sentence of rule X (or the title of section X) attached, when X itself is
not in the prompt.

**In plain terms:** rules often send the reader elsewhere — "see rule 101.4".
In 73% of the prompts' pointers (intake), the rule pointed at isn't in the
prompt, so Luna can't follow it. Attaching its first sentence, word for word,
lets her. Capped so a pointer-heavy rule can't flood the prompt.

**What happens if you say no:** pointers stay as written, mostly pointing at
text Luna doesn't have.

```diff
@@ functional-requirements.md — new entry after REQ-243 @@
+### REQ-244
+- Title: "See rule X" pointers in delivered rules carry what they point at
+- Priority: low
+- Description: When a delivered rule points elsewhere — "see rule 101.4", "see rules 613.2 and 613.3", "see section 7" — and the target is not itself in the prompt, the pointer carries the target's first sentence (a specific rule) or its title (a section or family), verbatim.
+- Acceptance Criteria:
+  - a pointer to a specific rule absent from the prompt is followed, in brackets, by that rule's first sentence from the committed index; a pointer to a section or family is followed by its title
+  - a pointer whose target is already in the prompt is left as written
+  - at most ten pointers are resolved per prompt, in the order they appear; each attached first sentence is capped at 250 characters; pointers beyond the cap stay as written
+  - the build reports the share of pointers resolved over the committed corpus prompts
+- Constraints:
+  - verbatim rule text and titles only; no paraphrase
+- Dependencies:
+  - REQ-179 (the index the targets come from)
+  - REQ-239 (excerpt layout)
+- Notes:
+  - measured at intake (cited): 73% of "see rule X" pointers point at text that is not in the prompt
```

- Verdict: accept
- Reason:

---

## REQ-245 — card blocks show power, toughness and loyalty, and keep line breaks

**What this decides:** whether the card text Luna reads includes a creature's
power and toughness and a planeswalker's loyalty, and keeps each ability on its
own line.

**In plain terms:** today the card block has no power, toughness or loyalty, so
any "does this damage kill it" question makes Luna guess, and every card's
abilities are run together on one line. These come from data the build already
reads; they stay on the server (the card-detail popup and the app's download
are unchanged), like the keyword list REQ-180 added.

**What happens if you say no:** card blocks stay without power, toughness and
loyalty, with abilities run together.

```diff
@@ functional-requirements.md — new entry after REQ-244 @@
+### REQ-245
+- Title: Card blocks in the prompt carry power, toughness and loyalty, and keep oracle line breaks
+- Priority: medium
+- Description: The backend card-detail artifact carries each card's power, toughness and loyalty, and every card block in the prompt prints them when the card has them; oracle text keeps its line breaks, so each ability reads on its own line.
+- Acceptance Criteria:
+  - the card-detail build writes `power`, `toughness` and `loyalty` from the Scryfall bulk record, omitted when the card has none; a multi-face card's values are its faces' values joined with " // "
+  - the fields are backend-only, like `keywords` (REQ-180): the `GET /api/cards/:oracleId` block and the frontend's up-front card data are unchanged
+  - every card block in both modes prints `power:`, `toughness:` and `loyalty:` lines when present, and no line when absent
+  - oracle text keeps its line breaks in the prompt; other whitespace is normalised as today
+  - NFR-017's package budget test passes; the artifact's size change is recorded
+- Constraints:
+  - no request, response or frontend change; no new runtime fetch
+- Dependencies:
+  - REQ-030 (per-card prompt fields, amended)
+  - REQ-176 (server-side card resolution, amended)
+  - REQ-180 (the backend-only field precedent)
+  - NFR-017 (package budget)
+- Notes:
+  - REQ-180's notes recorded this as card-data work outside the RAG gameplan; this requirement takes it up
+  - located at intake (cited): `cardDetail.ts:11-22`, `normalization.ts:15-16, 40-41`
```

- Verdict: accept
- Reason:

---

## REQ-022 — amended: the rules sections follow the new search, order and framing

**What this decides:** whether the requirement that defines both rules sections
of every prompt is updated to match the new requirements above.

**In plain terms:** REQ-022 today says curated topics are chosen by game state
plus one card-wording gate; that the rules section comes before a separate
rulings section and carries a "shared vocabulary" disclaimer; and that the
excerpt query is the question plus each card's name, type line and keywords.
This amendment says: In-Depth also chooses topics by card wording and question
(REQ-242); rulings sit under their cards (REQ-241); the rules are framed once as
binding (REQ-243); two of the ten excerpt slots come from per-card search
(REQ-235) and lead-in lists ride free of the slots (REQ-240); the query adds
concept terms and, in In-Depth, the turn step (REQ-234, REQ-178); the packaged
model is the trained one (REQ-236, REQ-237).

**What happens if you say no:** REQ-022 contradicts the accepted new
requirements; accept or edit it to match whatever you accepted above.

```diff
@@ REQ-022 Description @@
-- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, selected by game-state signals for the baseline — plus one card-wording gate for replacement-effect interactions (REQ-220) — and by card/question-driven relevance scoring for supplemental rules, without changing the product API or UI.
+- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, selected by game-state signals for the baseline — plus one card-wording gate for replacement-effect interactions (REQ-220) and, in In-Depth, card-wording and question triggers in place of zone presence (REQ-242) — and by card/question-driven relevance scoring for supplemental rules, without changing the product API or UI.
@@ REQ-022 Acceptance Criteria @@
   - committed artifact `apps/backend/data/gameRulesByTopic.json` loads at backend startup
-  - every assembled prompt includes `GAME RULES (reference)` with curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) and REQ-220 (the replacement-effect interaction topic when two or more cards carry replacement or prevention wording) in stable `id` order when the artifact is present
+  - every assembled prompt includes `GAME RULES (reference)` with curated topics selected per DEC-045 (always-on core plus turn-phase and combat-step expansion), REQ-242 (in In-Depth, the formerly zone-gated topics chosen by card wording and question) and REQ-220 (the replacement-effect interaction topic when two or more cards carry replacement or prevention wording) in stable `id` order when the artifact is present; within a topic, rules print in rule-book order, each id once (REQ-239), and a topic rule that introduces a list carries its list (REQ-240)
   - excerpts are verbatim WotC CR prose for rule numbers listed in `apps/backend/data/gameRulesTopicManifest.json`
-  - section appears after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
-  - section includes a disclaimer that rules are shared vocabulary and do not override submitted game state
+  - in In-Depth the section appears after the populated zone sections (each card followed by its own rulings, REQ-241); in both modes it comes directly before `ADDITIONAL RELEVANT RULE EXCERPTS`
+  - the section carries no disclaimer of its own: the instructions frame the rules once as the binding rules of the game, which never override the submitted game state or a card's oracle text (REQ-243)
   - section omitted only when artifact missing or empty, with a warning logged
@@ REQ-022 Acceptance Criteria (supplemental) @@
-  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 10 rules scored per DEC-046 against the request context
+  - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with up to 10 rules scored per DEC-046 against the request context — the main ranking fills at least eight and per-card search up to two (REQ-235) — plus the list items of any delivered lead-in, which use no slot (REQ-240); the rules print in rule-book order, grouped under path labels (REQ-239)
   - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers by exact rule number: a rule a selected topic lists never repeats as a supplemental excerpt, while a listed parent's lettered sub-rules that the topic does not list compete like any other rule — REQ-179)
-  - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
+  - supplemental section appears directly after `GAME RULES (reference)`; there is no separate rulings section (REQ-241)
   - supplemental section omitted when index missing, empty, or no rules score above 0
   - eval fixtures assert labeled supplemental recall per REQ-032
-  - the System 3 retrieval query is built from the player's question plus a compact per-card signal — name, type line, and keyword list — not from raw concatenated card oracle text (REQ-178)
+  - the System 3 retrieval query is built from the player's question plus a compact per-card signal — name, type line, and keyword list — plus the concept terms the fixed concept map draws from each card's wording (REQ-234) and, in In-Depth, the current turn step (REQ-178); never from raw concatenated card oracle text, which only per-card search reads, as its own separate query (REQ-235)
@@ REQ-022 Constraints @@
-  - no per-request external call for System 3 query embedding in the default (`mock`) or shipped-semantic (`local`) modes; the no-per-request-external-call posture is preserved by the bundled local model (REQ-181), not reversed — only `EMBEDDING_PROVIDER=openai` would add one, and it is never the default
-  - System 2 selection uses game-state signals (`turnPhase`, `combatStep`, populated zones) plus exactly one card signal: whether two or more cards' oracle text carries replacement or prevention wording as REQ-220 defines it (the whole word "instead", "prevent", "prevents", or "prevented"), which selects the replacement-effect interaction topic (REQ-220); card names and keywords never select a System 2 topic
-  - System 3 owns all relevance-scored card/question-driven retrieval including oracle-keyword signals; REQ-220's wording gate is a fixed on/off switch, not scoring
+  - no per-request external call for System 3 query embedding in the default (`mock`) or shipped-semantic (`local`) modes; the no-per-request-external-call posture is preserved by the packaged local model — the Magic-trained model, fetched from private storage only when the deploy package is built (REQ-236, REQ-237) — not reversed; only `EMBEDDING_PROVIDER=openai` would add one, and it is never the default
+  - System 2 selection uses game-state signals (`turnPhase`, `combatStep`) plus card wording in two fixed forms: whether two or more cards' oracle text carries replacement or prevention wording as REQ-220 defines it (the whole word "instead", "prevent", "prevents", or "prevented"), which selects the replacement-effect interaction topic (REQ-220); and, in In-Depth only, the concept terms of the cards and the question's words matched against a fixed trigger table for the topics populated zones used to select (REQ-242); card names and keywords never select a System 2 topic
+  - System 3 owns all relevance-scored card/question-driven retrieval including oracle-keyword signals; REQ-220's wording gate and REQ-242's trigger table are fixed matching, not scoring
```

- Verdict: accept
- Reason:

---

## REQ-024 — amended: phase guidance is corrected and reaches Quick Lookup

**What this decides:** whether the phase-guidance requirement says what REQ-238
makes true: Quick Lookup also gets step summaries when a step is named, and the
canonical text is the corrected text.

**In plain terms:** REQ-024 today says every prompt has a `PHASE GUIDANCE` block
between the game context and the zones, with text matching a retired decision.
In-Depth keeps exactly that; Quick Lookup gains it conditionally; the text is the
corrected version, pinned by a test to the rules it summarises.

**What happens if you say no:** REQ-024 contradicts REQ-238 if that is accepted.

```diff
@@ REQ-024 @@
-- Description: Every backend AI prompt must include a `PHASE GUIDANCE` block containing phase-specific and combat-sub-step-specific reasoning instructions, positioned between `GENERAL GAME CONTEXT` and the zone sections.
+- Description: Every In-Depth prompt must include a `PHASE GUIDANCE` block containing phase-specific and combat-sub-step-specific reasoning instructions, positioned between `GENERAL GAME CONTEXT` and the zone sections; a Quick Lookup prompt includes the same summaries for the turn steps its question names (REQ-238).
 - Acceptance Criteria:
-  - every assembled prompt includes a `PHASE GUIDANCE` section between `GENERAL GAME CONTEXT` and the zone sections
+  - every In-Depth prompt includes a `PHASE GUIDANCE` section between `GENERAL GAME CONTEXT` and the zone sections
   - guidance text is specific to the submitted `turnPhase`
   - when `turnPhase` is `combat`, guidance text is specific to the submitted `combatStep` when present; falls back to generic combat framing when absent
   - section is never omitted for a valid phase submission
-  - canonical guidance strings per phase match those specified in DEC-036
+  - canonical guidance strings per phase are the corrected strings in `apps/backend/src/prompt/phaseGuidance.ts`, each pinned by a test to the Comprehensive Rules it summarises (REQ-238); DEC-036's original strings are superseded
+  - a Quick Lookup prompt carries `PHASE GUIDANCE` right after `MTG REFERENCE` when its question names a turn step or an attached card's concept terms do, with one summary per named step, at most three, from the same strings (REQ-238)
```

- Verdict: accept
- Reason:

---

## REQ-030 — amended: card blocks gain power, toughness, loyalty and line breaks

**What this decides:** whether the per-card field list in the prompt adds power,
toughness and loyalty (when the card has them), keeps oracle line breaks, and
places the card's rulings under it.

**In plain terms:** REQ-030 lists the lines every card block must carry. This
adds the three combat/loyalty numbers REQ-245 brings, the line breaks, and the
rulings placement from REQ-241.

**What happens if you say no:** REQ-030's field list contradicts REQ-245 and
REQ-241 if those are accepted.

```diff
@@ REQ-030 Acceptance Criteria @@
-  - every card in every populated zone section includes `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, `targets`, and `contextNotes` lines in the assembled prompt
+  - every card in every populated zone section includes `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, `targets`, and `contextNotes` lines in the assembled prompt, plus `power`, `toughness` and `loyalty` lines when the card has them (REQ-245); `oracleText` keeps the card's line breaks (REQ-245); the card's WotC rulings follow its block at its first appearance (REQ-241)
```

- Verdict: accept
- Reason:

---

## REQ-074 — amended: Quick Lookup's assembly follows the new rules

**What this decides:** whether the Quick Lookup assembly requirement reflects
its own reference block, the step summary when a step is named, rulings under
each card, and the new search signal.

**In plain terms:** REQ-074 today says Quick Lookup always gets the shared
reference block, never gets phase guidance, and scores search on the question
plus each card's name, type line and keywords. After this: its own reference
block (REQ-243), a step summary only when the question names a step (REQ-238),
each card's rulings under the card (REQ-241), and concept terms plus per-card
search (REQ-234, REQ-235).

**What happens if you say no:** REQ-074 contradicts the accepted new
requirements.

```diff
@@ REQ-074 Acceptance Criteria @@
-  - the assembled prompt always includes the static MTG reference block (DEC-025), the always-on core game-rules topics (DEC-045 core set), and question-scored System 3 supplemental rules (DEC-046 / REQ-022)
-  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings (DEC-029), and System 3 scored against the question plus a compact signal for each attached card — name, type line, and keyword list — rather than the card's full oracle text (REQ-178)
-  - the assembled prompt omits zone sections, `PHASE GUIDANCE` (REQ-024), System 2 game-state topic gating (DEC-045), and the merged zone scope sentence (DEC-025), because this path never carries game state
+  - the assembled prompt always includes Quick Lookup's own MTG reference block, which describes only sections this mode contains (DEC-025, REQ-243), the always-on core game-rules topics (DEC-045 core set), and question-scored System 3 supplemental rules (DEC-046 / REQ-022)
+  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings directly under its block (DEC-029, REQ-241), and System 3 scored against the question plus a compact signal for each attached card — name, type line, and keyword list — plus the concept terms of its wording (REQ-234), rather than the card's full oracle text (REQ-178); each attached card's own text is searched separately for the two reserved per-card slots (REQ-235)
+  - the assembled prompt omits zone sections, System 2 game-state topic gating (DEC-045), and the merged zone scope sentence (DEC-025), because this path never carries game state; it includes `PHASE GUIDANCE` only for turn steps the question names or an attached card's concept terms name (REQ-024, REQ-238)
```

- Verdict: accept
- Reason:

---

## REQ-167 — amended: multi-card lookup enrichment reads each card's text separately

**What this decides:** whether the multi-card lookup requirement's statement
"it no longer scores over each card's full oracle text" is updated, since
per-card search now reads each card's text on its own.

**In plain terms:** REQ-167 says System 3 scores the question plus a compact
signal per card, and no longer reads full card text. With REQ-234 and REQ-235,
the main query adds concept terms, and each card's own text gets a separate
search for the two reserved slots — still never merged into the main query.

**What happens if you say no:** REQ-167 contradicts REQ-235 if that is accepted.

```diff
@@ REQ-167 Acceptance Criteria @@
-  - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings (DEC-029) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus a compact signal for every attached card — name, type line, and keyword list. It no longer scores over each card's full oracle text, which was measured to drop supplemental recall@5 from 0.577 to 0.026 on a labelled benchmark (REQ-178).
+  - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings directly under it (DEC-029, REQ-241) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus a compact signal for every attached card — name, type line, and keyword list — plus the concept terms of its wording (REQ-234). The main query never carries each card's full oracle text, which was measured to drop supplemental recall@5 from 0.577 to 0.026 on a labelled benchmark (REQ-178); each card's text is searched on its own, separately, for the two reserved per-card slots (REQ-235).
```

- Verdict: accept
- Reason:

---

## REQ-176 — amended: the server also resolves power, toughness and loyalty

**What this decides:** whether server-side card resolution adds the three new
backend-only fields REQ-245 brings.

**In plain terms:** REQ-176 lists the card fields the server looks up by card id
instead of trusting the app to send them. This adds power, toughness and loyalty
to that list. The app still sends only the card's identity.

**What happens if you say no:** REQ-176's list contradicts REQ-245 if that is
accepted.

```diff
@@ REQ-176 Acceptance Criteria @@
-  - the backend resolves `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes` server-side by `cardId`; an empty/absent oracle still emits `(none) — no oracle text recorded for this card`
+  - the backend resolves `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes` server-side by `cardId`, and the backend-only `power`, `toughness` and `loyalty` when the card has them (REQ-245); an empty/absent oracle still emits `(none) — no oracle text recorded for this card`
```

- Verdict: accept
- Reason:

---

## REQ-178 — amended: the search query may carry concept terms and the turn step

**What this decides:** whether the requirement that keeps raw card text out of
the search query now also allows two additions: concept terms from the fixed
concept map, and in In-Depth the game's current turn step.

**In plain terms:** REQ-178 built today's protection: the search query is the
question plus each card's name, type line and keywords, never full card text or
the turn phase, because full card text drowned the question (recall@5 0.577 →
0.026). This keeps the ban on raw card text and context notes, and lets in only
fixed rule-book words: concept terms (REQ-234) and the current step's name
(intake: the Necropotence In-Depth rank of 514.3a went 17 → 8 on today's model).
Per-card search reads card text, but as its own separate query (REQ-235).

**What happens if you say no:** the query stays question plus name, type line
and keywords; REQ-234 and the turn-step addition can't ship as designed.

```diff
@@ REQ-178 @@
-- Description: The System 3 supplemental-rules search query is built from the player's question plus a compact per-card signal — each submitted or attached card's name, type line, and keyword list — instead of the question plus every card's full oracle text, context notes, zone ids, and turn phase. The assembled prompt is unchanged; only the internal retrieval query changes.
+- Description: The System 3 supplemental-rules search query is built from the player's question plus a compact per-card signal — each submitted or attached card's name, type line, and keyword list — plus fixed rule-book terms: the concept terms the committed concept map draws from each card's wording (REQ-234) and, in In-Depth, the name of the game's current turn step; never every card's full oracle text, context notes, or zone ids. The assembled prompt is unchanged by this requirement; only the internal retrieval query changes.
 - Acceptance Criteria:
-  - the retrieval query carries the player's question and, per card, that card's name, type line, and keyword list; it no longer concatenates full oracle text or context notes into the query
+  - the retrieval query carries the player's question and, per card, that card's name, type line, and keyword list, plus the card's concept terms (REQ-234) and, in In-Depth, the current turn step's rule-book name (for example "cleanup step"), both at the concept weight in the word query and both appended to the embedded text; it never concatenates full oracle text or context notes into the query or its embedding
+  - per-card search (REQ-235) reads each card's oracle text as its own separate query and never merges it into this one
   - the change applies to both game mode and lookup mode, through the one shared retrieval path (no second implementation)
@@ REQ-178 Notes @@
   - located in code: `buildQueryParts` in `apps/backend/src/gameRulesRetrieval.ts` currently appends turn phase, zone ids, and every card's name, type line, oracle text, and context notes
+  - amended by `right-rules-in-order`: the ban on raw card text, context notes and zone ids stands; fixed rule-book terms join the query — concept terms (REQ-234) and the In-Depth turn step. Measured at intake (cited): the turn step moved Necropotence's 514.3a from 17th to 8th in In-Depth on the stock model; raw card text in the embedding dropped bench@5 from 118 to 96, confirming this requirement's concern
```

- Verdict: accept
- Reason:

---

## REQ-179 — amended: the rule-book parser fixes and what the index records

**What this decides:** whether the rule-index requirement adds the parser fixes
and the three new things the index records: the glossary, the rule book's
edition and source hash, and the part titles.

**In plain terms:** the rule data today has real defects. Eight rules have the
next part's title glued onto their text (including 514.3a and 616.2, both
deciding rules in corpus cases); two real rules, 700.15 and 303.7, are dropped
because a curly quote fooled the parser; two empty pieces are kept; and 704.5aa
is merged into 704.5z because the parser only allows one letter. This fixes
them, then rebuilds and checks that only those pieces changed. It also stores
the glossary (used only to translate obsolete terms, REQ-233), the edition, and
the part titles the new excerpt labels need (REQ-239). Its notes record that
the "following rules:" follow-up it set aside on 2026-10-07 is taken up by
REQ-240.

**What happens if you say no:** the defects stay; 514.3a keeps its glued title,
two rules stay missing, and the labels and glossary have no data.

```diff
@@ REQ-179 Description @@
-- Description: The committed Comprehensive Rules index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text; and System 3 excludes from its supplemental excerpts exactly the rule numbers the selected curated topics list — the rules whose text those topics print — so a lettered sub-rule whose parent a curated topic lists, but which the topic does not print, competes for System 3's slots like any other rule.
+- Description: The committed Comprehensive Rules index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text, and parses every rule faithfully — no title glued to a rule, no real rule dropped, no rule id merged into another; it records the rule book's glossary, edition, source hash and part titles; and System 3 excludes from its supplemental excerpts exactly the rule numbers the selected curated topics list — the rules whose text those topics print — so a lettered sub-rule whose parent a curated topic lists, but which the topic does not print, competes for System 3's slots like any other rule.
@@ REQ-179 Acceptance Criteria (added after the heading-only criterion) @@
   - a build test asserts both properties and fails when a future Comprehensive Rules refresh reintroduces either
+  - a part title is never glued to the last rule of the part before it: 123.9, 213.1g, 315.7, 408.3, 514.3a, 616.2, 733.2 and 811.5 end with their own text
+  - a rule whose heading line ends in a curly closing quote is not mistaken for a heading: 700.15 and 303.7 are in the index; empty pieces (702.163, 702.179) are not
+  - a rule id may carry more than one trailing letter: 704.5aa is its own entry, not merged into 704.5z
+  - `searchText` is built with REQ-233's tokens: no trailing sentence periods, "can't" and "it's" whole, U+2028 and no-break spaces read as spaces, Porter stems
+  - the build stores the rule book's glossary beside the index (741 entries, 35 marked obsolete, at intake), used only for obsolete-term query translation (REQ-233) and never delivered as an excerpt; and records with the index the rule book's edition date, a hash of the source text, and each part's title (for the excerpt labels, REQ-239)
+  - rebuilt from the same 2026-09-25 rule book, the index changes `ruleId`, `sectionTitle` or `text` only for the pieces named in the four criteria above; a build check diffs the old and new index and fails on any other such change (`searchText` and `gameRulesTokenStats.json` change everywhere, as REQ-233 intends)
@@ REQ-179 Notes (added) @@
+  - amended by `right-rules-in-order` (2026-10-11): the parser fixes above were found at intake (cited, not re-derived); the follow-up recorded above as out of scope — expanding a rule that ends "the following rules:" into its sub-rules, including 117.3a–d — is taken up by REQ-240, which adds lists to search excerpts and to curated topics through the manifest, so this requirement's exact-number exclusion and its topic data test hold unchanged
```

- Verdict: accept
- Reason:

---

## REQ-180 — amended: every card keyword counts as a keyword

**What this decides:** whether every keyword on a card's Scryfall keyword list
gets the keyword weight in the search, not only the twenty on the hand-made
list.

**In plain terms:** REQ-180 brought each card's real keyword list into search.
But the extra weight that marks a word as a Magic keyword applies only to words
on a hand-made 20-word list, so most card keywords get none: at intake, 975 of
1,514 practice-suite card keywords (64%), including Enchant, Mill, Equip and
First strike. This gives every card keyword the weight, and matches multi-word
keywords like "first strike" as one phrase (intake: +58 suite citations; corpus
cases with every deciding rule 305 → 336, together with dot stripping). Its
notes also record that power, toughness and loyalty, set aside here, are taken
up by REQ-245.

**What happens if you say no:** card keywords keep weight only when they are on
the hand-made list.

```diff
@@ REQ-180 Acceptance Criteria (added after the union criterion) @@
   - System 3's keyword signal for a request is the union of the submitted or attached cards' keywords, resolved server-side by `cardId`, plus any keyword the question itself names; the hand-curated static vocabulary is retained only as the source for question-text keyword detection, no longer as the per-card inference path
+  - every keyword in a card's Scryfall `keywords` gets the keyword weight (×6) in the word query whether or not the hand-curated vocabulary lists it; a multi-word keyword ("First strike") is matched as one phrase
@@ REQ-180 Notes (added) @@
+  - amended by `right-rules-in-order`: measured at intake (cited), 975 of 1,514 practice-suite card keywords (64%) — Enchant, Mill, Equip, First strike among them — got no keyword weight because the weight was applied only to vocabulary words; giving every card keyword the weight measured +58 suite citations, and with dot stripping (REQ-233) moved corpus cases with every deciding rule from 305 to 336
+  - the power, toughness and loyalty fields noted above as out of this gameplan's scope are taken up by REQ-245
```

- Verdict: accept
- Reason:

---

## REQ-181 — amended: the semantic search uses the trained model, and mismatches are loud

**What this decides:** whether the semantic-search requirement names the trained
model as the shipped one, rebuilds the rule vectors whenever the model is
retrained, and makes two mismatches loud instead of silent.

**In plain terms:** REQ-181 says the shipped meaning-search model is the stock
`all-MiniLM-L6-v2` and that rule vectors are rebuilt only when the rule book
changes. With REQ-236 the model is the Magic-trained one, so vectors also
rebuild on retraining. Two silent failures become loud: vectors built by a
different model than the one running (REQ-237), and the OpenAI embedder, whose
1,536-number vectors can't be compared with the 384-number rule vectors — today
that silently falls back to word-only search.

**What happens if you say no:** REQ-181 keeps naming the stock model, and the
OpenAI mismatch stays silent.

```diff
@@ REQ-181 Acceptance Criteria @@
-  - a committed offline artifact in `apps/backend/data/` holds one embedding vector per entry in `gameRulesRuleIndex.json`, built by an offline step alongside `build-game-rules.mjs` and rebuilt only on a Comprehensive Rules refresh
+  - a committed offline artifact in `apps/backend/data/` holds one embedding vector per entry in `gameRulesRuleIndex.json`, built by an offline step alongside `build-game-rules.mjs` and rebuilt on a Comprehensive Rules refresh and whenever the search model is retrained (REQ-236); it records the model id and manifest hash that built it (REQ-237)
@@ REQ-181 Acceptance Criteria @@
-  - `EMBEDDING_PROVIDER=openai` is seam-selectable for live mode only and is never the default
+  - `EMBEDDING_PROVIDER=openai` is seam-selectable for live mode only and is never the default; a query vector whose length differs from the committed rule vectors' (OpenAI's 1,536 against 384) is never silently replaced by lexical-only ranking under a semantic label: it disables the semantic path with one error-level diagnostic naming both dimensions, and the eval harnesses and benchmark fail on it
+  - a committed vector file built by a model other than the running one is caught at load (REQ-237): one error-level diagnostic naming both model ids, the lexical fallback above, never a mixed ranking
@@ REQ-181 Constraints @@
-  - the shipped semantic provider is a small embedding model bundled in the answer process and run in-process (`all-MiniLM-L6-v2`, 384 dimensions, quantised), not a hosted service and not a per-request external call; System 3's no-per-request-external-call posture is preserved by this choice rather than reversed, and only `EMBEDDING_PROVIDER=openai` would add such a call, which is never the default. A dedicated always-on inference host is out of scope
+  - the shipped semantic provider is a small embedding model bundled in the answer process and run in-process — `all-MiniLM-L6-v2` fine-tuned on Magic rules questions (REQ-236), 384 dimensions, quantised, stored privately and packaged at deploy (REQ-237) — not a hosted service and not a per-request external call; System 3's no-per-request-external-call posture is preserved by this choice rather than reversed, and only `EMBEDDING_PROVIDER=openai` would add such a call, which is never the default. A dedicated always-on inference host is out of scope
@@ REQ-181 Notes (added) @@
+  - amended by `right-rules-in-order`: the shipped model became the Magic-trained MiniLM (REQ-236), exported as per-channel, reduced-range int8 to match the stock model's layout (a per-tensor export lost 23 citations at intake, cited); the embedding text `sectionTitle: text` is unchanged — labelled rule text inside the vectors measured −17 check-half citations at intake, so labels go in the prompt (REQ-239), not the vectors
```

- Verdict: accept
- Reason:

---

## REQ-182 — amended: meaning weight 0.65

**What this decides:** whether the blend between meaning search and word search
moves from 0.60 to 0.65 meaning, and whether the requirement's statement that
the word-only path is byte-identical to its 2026-09-05 form is updated now that
REQ-233 changes the word tokens.

**In plain terms:** each rule's final score is 0.6 × its meaning score plus 0.4
× its word score today. With the trained model, the intake tuned this to 0.65
on the tuning half; 0.65 sits inside the 0.50–0.70 band this requirement already
allows. The standing quality floors on the 156-pair benchmark (clean recall@5 at
least 0.8526, polluted at least 0.8333) and the 12 labelled fixture checks stay
gates.

**What happens if you say no:** the weight stays 0.60; the trained model ships
at a weight it was not tuned for.

```diff
@@ REQ-182 Acceptance Criteria @@
-  - under `EMBEDDING_PROVIDER=mock`, and on any embedding failure, scoring is byte-identical to the prior lexical-only path — measured on the committed benchmark (REQ-177) as clean recall@5 0.5833 / MRR 0.4249 and polluted recall@5 0.5256 / MRR 0.3872, the values recorded on 2026-09-05
+  - under `EMBEDDING_PROVIDER=mock`, and on any embedding failure, scoring is the lexical-only path. At this requirement's build it was byte-identical to the prior lexical-only path — measured on the committed benchmark (REQ-177) as clean recall@5 0.5833 / MRR 0.4249 and polluted recall@5 0.5256 / MRR 0.3872, the values recorded on 2026-09-05; REQ-233's token fixes later changed the lexical path, and its re-recorded figures live there
@@ REQ-182 Notes (added) @@
+  - amended by `right-rules-in-order` (2026-10-11): `alpha` moves to 0.65 with the Magic-trained model (REQ-236), chosen on the practice suite's tuning half at intake (cited, not re-derived), inside the accepted `[0.50, 0.70]` band; the benchmark floors and the 12 labelled checks above remain gates for that change. Ties now fall back to rule-book order (REQ-233)
```

- Verdict: accept
- Reason:

---

## REQ-183 — amended: the model may live in private S3, fetched at packaging only

**What this decides:** whether REQ-183's rule that the model is never moved to
S3 is replaced, now that the trained model can't live in the public repository.

**In plain terms:** REQ-183 said: don't move the model to S3 or fetch it at cold
start, because that would add a runtime dependency and doesn't help the tight
data budget. The trained model can't go in git, so it lives in the private
bucket, but it is fetched only when the deploy package is built — never at cold
start, never per request — so the runtime gains no dependency. It still doesn't
help the data budget (the model sits in the separate code reserve), and it
doesn't need to.

**What happens if you say no:** the trained model has no allowed home; REQ-237
can't ship.

```diff
@@ REQ-183 Constraints @@
-  - the local embedding model is not moved to S3 or fetched at cold start; that would add a runtime external integration and relieves the non-data reserve rather than the constrained data budget
+  - the local embedding model is never fetched at cold start or per request. Because the Magic-trained model (REQ-236) cannot be committed to the public repository, it is stored in the project's private S3 bucket and fetched only when the deploy package is built (REQ-237), which adds no runtime external integration; this relieves neither budget — the model stays in the non-data reserve at about the same size
```

- Verdict: accept
- Reason:

---

## REQ-184 — amended: packaging refuses without the verified trained model

**What this decides:** whether the deploy's "refuse to build without the model"
guard points at the trained model, fetched from private storage and checked
against its manifest, instead of the stock model's Hugging Face path.

**In plain terms:** REQ-184 makes a deploy fail rather than ship without the
search model, checking for the stock model's file. This keeps the guard and
points it at the trained model's folder, after the fetch from S3 has verified
every file's fingerprint.

**What happens if you say no:** the guard keeps checking for the stock model,
which would no longer be the one in use.

```diff
@@ REQ-184 Acceptance Criteria @@
-  - the deploy fails, rather than silently degrading, when the packaged model cache is absent: the packaging script already refuses without `apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx`, and that refusal is asserted
+  - the deploy fails, rather than silently degrading, when the packaged model cache is absent or unverified: the packaging script fills `apps/backend/data/models/<model-id>/` from the private S3 bucket (REQ-237), refuses without `apps/backend/data/models/<model-id>/onnx/model_quantized.onnx` whose files all match the committed manifest's hashes, and refuses when the committed rule embeddings name a different model; each refusal is asserted
```

- Verdict: accept
- Reason:

---

## REQ-190 — amended: larger-cap test legs keep the two per-card slots

**What this decides:** how the answer-quality experiment's larger excerpt caps
(15 instead of 10, say) work once two slots are reserved for per-card search.

**In plain terms:** REQ-190 lets a paid experiment try more than ten excerpts by
taking the next-ranked rules from the same list, so a larger cap always contains
the smaller cap's rules. With per-card search, the two reserved slots stay two at
every cap, and the extra slots come from the main list, so that containment
still holds. The deployed cap stays ten.

**What happens if you say no:** REQ-190's larger-cap rule is undefined for the
reserved slots if REQ-235 is accepted.

```diff
@@ REQ-190 Acceptance Criteria @@
   - a larger cap reuses the identical production ranking rather than re-ranking: `retrieveRulesForQueryWithDebug` returns `runnerUp` as the ranks below the cap of the same scored list, so a larger-cap call's leading excerpts stay identical to the smaller-cap call's and the added slots are drawn from that same `runnerUp` list — proven directly, not assumed, in `preparation.test.ts`
+  - with per-card search (REQ-235), the reserved per-card slots stay two at every cap and the added slots come from the main ranking's `runnerUp`, so a larger-cap call's selected set contains the smaller-cap call's set — proven in `preparation.test.ts`
```

- Verdict: accept
- Reason:

---

## REQ-220 — amended: the replacement-interaction gate beside the new topic choice and search

**What this decides:** whether REQ-220's statements that the search never reads
card wording, and that card wording selects only this one topic, are updated.

**In plain terms:** REQ-220 adds the replacement-effect interaction rules when two
or more cards say "instead" or "prevent". It also states that search stays
question plus name, type line and keywords, never card text, and that card
wording picks no other topic. With REQ-234, REQ-235 and REQ-242 accepted, those
two statements change; REQ-220's own gate does not.

**What happens if you say no:** REQ-220 contradicts the accepted new
requirements.

```diff
@@ REQ-220 Acceptance Criteria @@
-  - in lookup mode the topic is added alongside the four always-on core topics, never in place of them; in game mode it is added alongside the game-state-gated topics
+  - in lookup mode the topic is added alongside the four always-on core topics, never in place of them; in game mode it is added alongside the topics the game state and REQ-242's card-wording and question triggers select
   - the topic's rule numbers join the curated exclusion set, so System 3 never repeats them (REQ-179)
-  - System 3's search text, scoring, cap, and embeddings are unchanged: the query stays the question plus each card's name, type line, and keywords, never oracle text (REQ-167, REQ-178, REQ-190)
+  - System 3's search text, scoring, cap, and embeddings were unchanged by this requirement: the query stayed the question plus each card's name, type line, and keywords, never oracle text (REQ-167, REQ-178, REQ-190). The main query later gained fixed concept terms from card wording (REQ-234) and a separate per-card search (REQ-235); it still never carries raw oracle text
@@ REQ-220 Constraints @@
-  - card wording selects this one topic only; card names and keywords never select a System 2 topic
+  - this gate selects this one topic only; elsewhere card wording selects topics only through REQ-242's fixed trigger table, in In-Depth; card names and keywords never select a System 2 topic
```

- Verdict: accept
- Reason:

---

## REQ-232 — amended: the practice suite may train the shipped search model

**What this decides:** whether a search model trained partly on your local
practice suite may ship to production, with the suite itself, every training
pair and every per-question result staying on your machine.

**In plain terms:** REQ-232 keeps the practice suite in one git-ignored folder,
never committed, never a build gate, and says nothing from it enters a player's
prompt. Training on it doesn't put any question into a prompt, but the trained
model's weights — which the suite shaped — run in production, stored only in the
private bucket. The model's acceptance scores (counts only) are measured once at
build, locally; the suite still never runs in tests or CI. The intake measured
that the practice questions give almost all of the suite gain: trained without
them, the model scores 348 check-half citations instead of 449.

**What happens if you say no:** the model trains on the corpus and the rule
book's examples only (REQ-236 is edited to drop the suite), at about 348 instead
of 449.

```diff
@@ REQ-232 Description @@
-- Description: Beside the committed rules test corpus (REQ-185), the owner can keep a local-only practice suite of judge-style rules questions from an outside question site, and run the free retrieval check and the paid answer-quality run over it, split by the suite's level, complexity and tags. Three committed commands import the questions politely and freeze each one as fetched, convert them into local cases in the format version 2 shape, and purge them; the two existing run commands gain a `--suite practice` selection with filters. Every piece of suite data (questions, answers, card rolls, converted cases, run output and per-question results) stays in one gitignored folder on the owner's machine and is never committed. Suite answers are community-written: they are never ground truth, never approved, and never a reference answer for the corpus, and a suite result is reported as agreement with the suite's own answer, apart from the official corpus and never in its headline (REQ-187). The suite is never a build gate, because CI cannot see it.
+- Description: Beside the committed rules test corpus (REQ-185), the owner can keep a local-only practice suite of judge-style rules questions from an outside question site, and run the free retrieval check and the paid answer-quality run over it, split by the suite's level, complexity and tags. Three committed commands import the questions politely and freeze each one as fetched, convert them into local cases in the format version 2 shape, and purge them; the two existing run commands gain a `--suite practice` selection with filters. Every piece of suite data (questions, answers, card rolls, converted cases, run output and per-question results) stays in one gitignored folder on the owner's machine and is never committed. Suite answers are community-written: they are never ground truth, never approved, and never a reference answer for the corpus, and a suite result is reported as agreement with the suite's own answer, apart from the official corpus and never in its headline (REQ-187). The suite is never a build gate, because CI cannot see it. It may train the shipped search model (REQ-236): the model's weights are stored only in the project's private bucket and never committed (REQ-237), and the suite, the training pairs and every per-question result stay in the gitignored folder.
@@ REQ-232 Constraints @@
-  - nothing from the suite enters a player's prompt; no runtime dependency, route, schema, provider or frontend change; no new npm dependency (the import uses Node's built-in `fetch`)
+  - nothing from the suite enters a player's prompt; the one runtime effect is the search model it helps train (REQ-236), whose weights ship from private storage only (REQ-237); no route, schema, provider or frontend change; no new npm dependency (the import uses Node's built-in `fetch`)
+  - the trained model's suite scores are a one-time acceptance measurement taken locally at build, reported as counts, never a standing gate in `npm test`, `npm run quality:check` or CI
```

- Verdict: accept
- Reason:

---

## NFR-017 — amended: the model's source moves to private S3; size unchanged

**What this decides:** whether the deploy-size requirement's notes record that
the model now comes from private storage instead of Hugging Face, at the same
size.

**In plain terms:** NFR-017 keeps the deploy package under AWS's 250 MB limit and
records that the model was deliberately not moved to S3. This adds a note: the
trained model is fetched from the private bucket at packaging, about the same
size (about 23 MB), inside the same reserve; the budget test still passes.

**What happens if you say no:** NFR-017's notes stay silent on where the model
comes from; nothing about the budget changes.

```diff
@@ NFR-017 Notes (added) @@
+  - amended by `right-rules-in-order` (2026-10-11): the bundled model is now the Magic-trained MiniLM (REQ-236), fetched from the project's private S3 bucket when the deploy package is built rather than from Hugging Face (REQ-237); it is never fetched at cold start, so the runtime gains no external dependency. Its size is unchanged (about 23 MB, inside the non-data reserve); `node --test scripts/lambda-package-budget.test.mjs` passes with it and with the rebuilt rule-embeddings artifact, and the measured figures are recorded at build
```

- Verdict: accept
- Reason:

---

## FLOW-011 — amended: the Quick Lookup flow's prompt step

**What this decides:** whether step 7 of the Quick Lookup flow describes the new
prompt: rulings under the card, concept terms and per-card search, and a step
summary when the question names a step.

**In plain terms:** the flow step today says the card's text never enters the
search and game-state sections are always omitted. After this, card text is
searched separately for two slots, the main query adds concept terms, and a step
summary can appear when the question names a step (it comes from the question,
not from game state).

**What happens if you say no:** FLOW-011 step 7 describes the old prompt.

```diff
@@ FLOW-011 Main Flow @@
-  7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs; when a card is attached, per-card enrichment (WotC rulings, full metadata incl. oracle text, and a System 3 query extended with that card's name, type line, and keywords — not its oracle text, REQ-178) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
+  7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (Quick Lookup's MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs, with a step summary when the question names a turn step (REQ-238); when a card is attached, per-card enrichment (full metadata incl. oracle text with its WotC rulings directly under it, REQ-241, and a System 3 query extended with that card's name, type line, keywords and concept terms — not its oracle text, REQ-178, REQ-234 — plus a separate search of the card's own text for the two reserved slots, REQ-235) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
```

- Verdict: accept
- Reason:

---

## FLOW-023 — amended: the multi-card lookup flow's prompt step

**What this decides:** whether step 5 of the multi-card lookup flow describes the
same new prompt as FLOW-011.

**In plain terms:** same change as FLOW-011, for the flow where several cards are
attached.

**What happens if you say no:** FLOW-023 step 5 describes the old prompt.

```diff
@@ FLOW-023 Main Flow @@
-  5. Backend assembles one lookup-mode prompt: per-card full metadata and per-card WotC rulings for every attached card, System 3 supplemental retrieval scored over the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-178) — and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
+  5. Backend assembles one lookup-mode prompt: per-card full metadata with each card's WotC rulings directly under it (REQ-241) for every attached card, System 3 supplemental retrieval scored over the question plus each attached card's name, type line, keywords and concept terms — not its full oracle text (REQ-178, REQ-234) — plus a separate search of each card's own text for the two reserved slots (REQ-235), a step summary when the question names a turn step (REQ-238), and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
```

- Verdict: accept
- Reason:

---

## system-map/game-rules-retrieval.md — amended: how rule search works, rewritten for the new search

**What this decides:** whether the system-map page that explains rule search
end to end is updated to describe the new search: trained model, token fixes,
concept map, per-card slots, weight 0.65, In-Depth turn step, card-wording
topics, rulings under cards, lists with lead-ins, and the model identity check.

**In plain terms:** this page is the plain-English walkthrough of the three rule
sources Luna gets: card rulings (System 1), the curated always-on and situational
rules topics (System 2), and the searched rule excerpts (System 3). Every
paragraph that the accepted requirements change is rewritten; nothing here adds
behaviour beyond them.

**What happens if you say no:** the page describes the old search; accept or
edit it to match what you accepted above.

```diff
@@ header @@
-Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181, REQ-220
+Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181, REQ-220, REQ-233, REQ-234, REQ-235, REQ-236, REQ-237, REQ-240, REQ-241, REQ-242
@@ How it works — System 1 @@
 Game rules retrieval is three related reference systems that feed prompt assembly
 without changing the submitted game state. System 1 is card rulings: submitted stack
 and zone cards are collected by card ID, resolved against the committed rulings index
 derived from Scryfall bulk `rulings`, filtered to `source === "wotc"`, and emitted as
-`OFFICIAL RULINGS` only for matched submitted cards. If no submitted card intersects
-the committed card metadata oracle IDs, the rulings section is omitted.
+rulings printed directly under each matched card's block, at its first appearance, framed
+as that card's rulings to apply only when the situation matches (REQ-241). If no submitted
+card intersects the committed card metadata oracle IDs, no rulings are printed.
@@ How it works — System 2 @@
 System 2 is the curated baseline. It always includes core rules topics, then adds
-conditional buckets from game-state signals: `turnPhase`, `combatStep`, and populated
-zone presence. One topic is gated on card wording instead: when two or more cards —
+conditional buckets from game-state signals: `turnPhase` and `combatStep`. In In-Depth,
+the topics populated zones used to add (spell casting, copying, layers, replacement
+effects and zone-change triggers) are added instead when a card's concept terms (the
+fixed concept map, REQ-234) or the question's words match a fixed trigger table built from
+the rule book's own titles (REQ-242). One topic is gated on card wording in both modes:
+when two or more cards —
 attached in a lookup, or on the stack or in any zone in a game — carry replacement or
 prevention wording ("instead", "prevent"), it adds the replacement-effect interaction
 rules (CR 614.1a, 616.1, 616.1a–g, 616.2; REQ-220).
-Card names and keywords never affect System 2. This replaces the prior "all topics every request" baseline with
+Card names and keywords never affect System 2. A topic rule that introduces a list
+carries its list (117.3a–d, 400.7's twelve sub-rules), and the layer and delayed-trigger
+topics carry 613.4d, 613.8b and 603.7a–c (REQ-240). This replaces the prior "all topics every request" baseline with
 a smaller `GAME RULES (reference)` section that still covers the stable vocabulary the
 model needs for stack, priority, zones, targets, combat, delayed triggers, and related
 common interactions.
@@ How it works — System 3 @@
 System 3 is supplemental retrieval. It builds a query from the user's question plus a
 compact per-card signal — each submitted or attached card's name, type line, and
-keyword list — deliberately not the cards' full oracle text, which floods the query and
-was measured to drop recall@5 from 0.577 to 0.026 on a labelled benchmark. It then
-ranks official rule excerpts and selects at most ten. Ranking is hybrid: when the
+keyword list — plus fixed rule-book terms: the concept terms the committed concept map
+draws from each card's wording (REQ-234), in In-Depth the current turn step's name, and,
+for an obsolete term in the question, its glossary definition (REQ-233); deliberately not
+the cards' full oracle text, which floods the query and was measured to drop recall@5 from
+0.577 to 0.026 on a labelled benchmark. Word matching strips sentence dots, stems every
+word on both sides, and gives every card keyword the keyword weight (REQ-233, REQ-180).
+It then ranks official rule excerpts and selects at most ten: at least eight from this
+main ranking, and up to two reserved for per-card search, in which each card's own oracle
+text is embedded and ranked on its own and the best cards' top hits fill the reserved
+slots (REQ-235). Ranking is hybrid: when the
 embedding-provider seam is active the query is embedded and cosine-ranked against a
 committed per-rule embedding vector, that cosine score and the IDF-weighted lexical
 score are each normalised against the query's own top score, and the two are blended by
-a single tuned weight, with the exact rule-ID and parent rule-ID boost merged into the
+a single tuned weight (0.65 meaning, REQ-182), with the exact rule-ID and parent rule-ID boost merged into the
 blended score so a cited rule number (for example "rule 613.9") is still pulled even
 when semantic similarity misses it. The IDF-weighted lexical scorer alone is retained as
 the mock/offline default, as the source of the exact-rule-ID boost, and as the fallback
 whenever query embedding fails — so those settings are never worse than System 3's
 earlier lexical-only behaviour. The blend exists because semantic-only ranking, measured
 2026-09-05 on the 156-pair benchmark, was better overall (recall@5 0.85 vs 0.58 clean,
 0.83 vs 0.53 with cards) but lost an expected rule on short lookup-mode questions — a
 card name, type line, and one keyword — in three of eight labelled fixtures, scoring 9
-of 12 checks against lexical's 12 of 12 (REQ-182). Ties prefer the highest matching
-signal, then ascending rule ID. Before output is selected, System 3 excludes rule IDs already selected by
+of 12 checks against lexical's 12 of 12 (REQ-182). Ties prefer the highest matching
+signal, then rule-book order (REQ-233). Before output is selected, System 3 excludes rule IDs already selected by
 System 2 — exactly the rule numbers the selected topics list, because a topic prints only
 the rules it lists; a lettered sub-rule of a listed parent that the topic does not list
 competes like any other rule (REQ-179) — and the prompt does not print the same rule in
 both `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS`.
+A delivered excerpt that introduces a list brings its list items, which use no slot
+(REQ-240), and the section prints in rule-book order, grouped under path labels
+(REQ-239).
@@ How it works — provider seam @@
 The query embedder is chosen by the `EMBEDDING_PROVIDER` seam (`mock` | `local` |
 `openai`), which mirrors the `ASK_AI_PROVIDER` boundary. `mock` (the default) does no
 embedding and uses lexical only, so the default runs with no model access. `local`
-(the shipped semantic provider) embeds the query in-process with a bundled
-`all-MiniLM-L6-v2` model in about 2ms — no external call, so System 3 keeps its "no
-per-request external call" posture. `openai` is seam-selectable for live mode only and
-is never the default. The per-rule embeddings are a committed offline artifact built
-alongside `gameRulesRuleIndex.json` and rebuilt only on CR refresh; the vectors are
-searched in-process with cosine, with no vector database (REQ-181).
+(the shipped semantic provider) embeds the query in-process with a bundled
+`all-MiniLM-L6-v2` model fine-tuned on Magic rules questions (REQ-236) in a few
+milliseconds — no external call, so System 3 keeps its "no per-request external call"
+posture. The model is stored in the project's private S3 bucket, named and hashed in a
+committed manifest, and fetched only when the deploy package is built (REQ-237).
+`openai` is seam-selectable for live mode only and is never the default; its vector size
+does not match the committed rule vectors, and that mismatch is reported loudly rather
+than silently falling back. The per-rule embeddings are a committed offline artifact built
+alongside `gameRulesRuleIndex.json`, rebuilt on CR refresh and whenever the model is
+retrained, and record the model that built them; a mismatch with the running model
+disables the semantic path with an error-level diagnostic (REQ-237). The vectors are
+searched in-process with cosine, with no vector database (REQ-181).
@@ How it works — rule index @@
 The rule index the corpus is built from excludes the Comprehensive Rules source
 document's table of contents and heading-only entries, so no searchable entry is a
-duplicate or a bare heading (REQ-179).
+duplicate or a bare heading, parses every rule faithfully (no title glued to a rule, no
+real rule dropped, no two-letter rule id merged), and records the rule book's glossary,
+edition, source hash and part titles (REQ-179).
@@ Data flow @@
 Those curated rule IDs become the exclusion set for System 3. When a semantic embedding
-provider is active, the async route handler embeds the query first and passes the query
-vector into prompt preparation as an option, so `preparePromptInput` stays synchronous.
-Supplemental retrieval builds the query from the question plus the per-card keyword
-signal, ranks the rule index (cosine over the committed rule embeddings when a query
+provider is active, the async route handler embeds the query, and each card's oracle text
+for per-card search, first and passes the vectors into prompt preparation as an option, so
+`preparePromptInput` stays synchronous. Supplemental retrieval builds the query from the
+question plus the per-card keyword signal and concept terms (and, in In-Depth, the turn
+step), ranks the rule index (cosine over the committed rule embeddings when a query
 vector is present, IDF-weighted lexical otherwise or on embedding failure) with the
 exact-rule-ID boost merged in, drops entries whose own rule ID is already in the
 System 2 set (a listed parent rule ID does not drop its sub-rules), and returns the
-top ten excerpts plus debug data when
-mock enrichment diagnostics are enabled. Prompt rendering places the resulting sections
-as curated rules, then supplemental excerpts, then official rulings.
+top ten excerpts — two slots reserved for per-card hits — plus debug data when
+mock enrichment diagnostics are enabled. Prompt rendering prints each card's rulings under
+the card, then the curated rules, then the supplemental excerpts in rule-book order.
@@ Where it lives @@
 - System 1: `apps/backend/src/cardRulings.ts`
 - System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRules.ts`
 - System 3: `apps/backend/src/gameRulesRetrieval.ts`
-- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact (REQ-181), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json.br` (REQ-180)
+- Concept map: one committed module (proposed `apps/backend/src/gameRulesConceptMap.ts`, REQ-234); In-Depth topic trigger table beside `gameRulesTopicSelection.ts` (REQ-242)
+- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact (REQ-181), the rule-book glossary (REQ-179), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json.br` (REQ-180)
+- Search model: the committed manifest (proposed `apps/backend/data/embeddingModel.manifest.json`), the fetch script and the owner-run training pipeline under `scripts/` (REQ-236, REQ-237)
 - Embedding-provider seam: `EMBEDDING_PROVIDER` flag, mirroring the `ASK_AI_PROVIDER` boundary under `apps/backend/src/providers/`
@@ Worked example @@
 A user asks whether a creature with deathtouch changes combat damage assignment during
 the combat damage step, with a populated battlefield and the relevant card metadata in
 the request. System 2 sees `turnPhase: combat`, the combat step, and populated zones;
-it selects the always-on topics plus combat and battlefield-oriented curated topics.
+it selects the always-on topics plus the combat-step topics, and any battlefield-oriented
+topic the cards' wording or the question matches (REQ-242).
 Those topics render in `GAME RULES (reference)`.
 
 System 3 then retrieves more specific rule excerpts. It builds the query from the
-question plus the attached cards' names, type lines, and keywords — not their full
-oracle text — embeds it with the active provider, and cosine-ranks it against the
+question plus the attached cards' names, type lines, keywords and concept terms, and the
+combat damage step's name — not their full oracle text — embeds it with the active
+provider, and cosine-ranks it against the
 committed rule embeddings, so the excerpts that actually address deathtouch and
 combat-damage assignment surface even when they share few literal words with the
 question. Any explicit rule number in the query still pulls in an exact or parent match
-through the merged boost. If a combat damage rule is already listed in the System 2
+through the merged boost. Each card's own text is searched separately, and its best hit
+can take one of two reserved slots. If a combat damage rule is already listed in the System 2
 topic set, that exact rule ID is excluded from System 3 so the supplemental block uses
 its ten slots for additional relevant context rather than duplicating the baseline; the
 rule's lettered sub-rules, which the topic does not print, still compete for those slots.
 
 System 1 independently checks the submitted card IDs against the rulings index. If one
-of those cards has WotC rulings in the committed data, the rulings block appears after
-the rules sections. If none match, the prompt still contains the selected game-rules
-reference material and simply omits `OFFICIAL RULINGS`.
+of those cards has WotC rulings in the committed data, they print directly under that
+card's block. If none match, the prompt still contains the selected game-rules
+reference material and simply prints no rulings.
@@ Invariants / gotchas @@
 - System 1 is card-specific and ruling-specific; it only emits WotC rulings for
-  submitted cards that match the committed rulings/card metadata index.
-- System 2 is driven by `turnPhase`, `combatStep`, and populated-zone presence, plus
-  one card-wording gate: two or more cards whose oracle text says "instead" or
-  "prevent" add the replacement-effect interaction topic (REQ-220). Card names and
-  keywords never select a System 2 topic, and relevance scoring stays System 3's job.
+  submitted cards that match the committed rulings/card metadata index, under each
+  card's block (REQ-241).
+- System 2 is driven by `turnPhase` and `combatStep`, plus card wording in two fixed
+  forms: two or more cards whose oracle text says "instead" or "prevent" add the
+  replacement-effect interaction topic (REQ-220), and, in In-Depth, the cards' concept
+  terms and the question's words select the formerly zone-gated topics through a fixed
+  trigger table (REQ-242). Card names and keywords never select a System 2 topic, and
+  relevance scoring stays System 3's job.
@@ Invariants / gotchas (System 3 cap) @@
-- System 3 is capped at ten supplemental excerpts per request (raised from five on 2026-09-09, REQ-190).
+- System 3 is capped at ten supplemental excerpts per request (raised from five on 2026-09-09, REQ-190), two of them reserved for per-card search (REQ-235); a delivered lead-in's list items use no slot and share a 12,000-character budget per prompt (REQ-240).
@@ Invariants / gotchas (provider) @@
-- The shipped semantic path uses a bundled local model, so System 3 keeps its "no
-  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
-  per-request call, and that is never the default.
+- The shipped semantic path uses a bundled local model — the Magic-trained MiniLM, fetched
+  from private storage only at packaging (REQ-236, REQ-237) — so System 3 keeps its "no
+  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
+  per-request call, and that is never the default.
+- Every committed vector file records the model that built it; a mismatch with the
+  running model, or a query vector of the wrong size, is reported loudly and never
+  silently ranked (REQ-181, REQ-237).
+- The concept map and the In-Depth topic trigger table are fixed, committed tables; no
+  model call produces search terms or selects topics at request time (REQ-234, REQ-242).
```

- Verdict: accept
- Reason:

---

## system-map/prompt-layout-spec.md — amended: the readable prompt map

**What this decides:** whether the readable section-by-section map of the prompt
(REQ-169) is updated to the new layout.

**In plain terms:** this page lists every prompt section in order and which ones
appear on which path. After this: the instructions and reference block differ by
mode; Quick Lookup can have phase guidance; rulings sit under each card, so the
separate rulings section disappears and later rows renumber; excerpts are in
rule-book order with their lists. The dated verification record is re-run at
build from real `npm run prompt:preview` output (REQ-169 requires it to be
checked against the code, not written from memory), so the record below shows
the expected result.

**What happens if you say no:** the map describes the old prompt.

```diff
@@ header @@
-Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181, REQ-182
+Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181, REQ-182, REQ-235, REQ-238, REQ-239, REQ-240, REQ-241, REQ-243
@@ Sections, in assembly order @@
-| 1 | `SYSTEM ROLE PREAMBLE` | Fixed lines that set the assistant's persona, scope, and ground rules (e.g. never invent hidden state) — identical text on every path. |
-| 2 | `INSTRUCTIONS` | A short bulleted list of behavioral rules for the answer; the exact bullets differ by path (see matrix). |
-| 3 | `MTG REFERENCE` | The static, fixed `MTG_PROMPT_REFERENCE` block — core Magic background (turn structure, zones, the layer system) — identical text on every path. |
+| 1 | `SYSTEM ROLE PREAMBLE` | Fixed lines that set the assistant's persona, scope, and ground rules (e.g. never invent hidden state) — the same on every path, except the stack-order line ("Stack item 1 is the bottom"), which only game mode carries (REQ-243). |
+| 2 | `INSTRUCTIONS` | One shared bulleted list of behavioral rules, including the one statement that the rules are binding and never override the submitted game state or card text; lookup adds its off-domain line, a game-mode follow-up adds its follow-up line (REQ-243). |
+| 3 | `MTG REFERENCE` | Core Magic background (turn structure, the layer system), one block per mode: the game-mode block also describes the app's turn-phase field, zones and scope note; the lookup block describes only what a lookup prompt contains (REQ-243). |
 | 4 | `GENERAL GAME CONTEXT` | The submitted game state's shared facts: player count, life totals, turn phase, active player. Game mode only. |
-| 5 | `PHASE GUIDANCE` | A short note on what's relevant to check during the current turn phase / combat step. Game mode only. |
-| 6 | `ZONE: <name>` (one heading per populated zone) | The ordered stack (bottom to top) plus any other zone with cards, each card's full metadata. Game mode only. |
-| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — state-gated by submitted zones/cards in game mode, an always-on set in lookup mode; in both, the replacement-effect interaction topic is added when two or more cards carry replacement or prevention wording (REQ-220). |
-| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by a hybrid blend of normalised cosine against committed per-rule embeddings and normalised keyword-overlap score, with the exact-rule-id boost merged into the blended score and keyword-overlap scoring alone retained as the mock/offline default and the failure fallback, from a query built from the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-167, REQ-178, REQ-181, REQ-182). |
-| 9 | `CARD (looked up)` | Full metadata (name, mana cost, type line, oracle text, etc.) for every card attached to a lookup question — one heading, one block per attached card, up to 5 (REQ-167). Lookup mode only. |
-| 10 | `OFFICIAL RULINGS (WotC reference)` | Published Oracle rulings (System 1) for the submitted cards (game mode) or every attached card (lookup mode, REQ-167). |
-| 11 | `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` | Community-sourced combo candidates matched against the submitted or attached cards, only when the question expresses explicit combo intent (DEC-116, REQ-094 amended by REQ-167). |
-| 12 | `SCOPE` | One sentence naming which zones carry no cards or were not included, so the model doesn't assume unsubmitted state. Game mode only. |
-| 13 | `CONVERSATION HISTORY` | Prior turns of the same conversation, included on a follow-up so the model treats the new question as a refinement rather than a fresh start. |
-| 14 | `QUESTION` | The player's final, normalized question text — always the last section. |
+| 5 | `PHASE GUIDANCE` | A short, rules-checked summary of a turn step: in game mode the current step / combat step; in lookup mode each step the question (or an attached card's concept terms) names, at most three (REQ-024, REQ-238). |
+| 6 | `ZONE: <name>` (one heading per populated zone) | The ordered stack (bottom to top) plus any other zone with cards, each card's full metadata followed by its WotC rulings at its first appearance (REQ-241). Game mode only. |
+| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — an always-on set plus turn-phase and combat-step topics, and in game mode the topics the cards' wording or the question match (REQ-242); in both, the replacement-effect interaction topic is added when two or more cards carry replacement or prevention wording (REQ-220); each topic in rule-book order with its lead-in lists (REQ-239, REQ-240). |
+| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by a hybrid blend of normalised cosine against committed per-rule embeddings and normalised keyword-overlap score, with the exact-rule-id boost merged into the blended score and keyword-overlap scoring alone retained as the mock/offline default and the failure fallback, from a query built from the question plus each attached card's name, type line, keywords and concept terms — not its full oracle text — with two slots reserved for per-card search (REQ-167, REQ-178, REQ-181, REQ-182, REQ-234, REQ-235); printed in rule-book order, grouped under path labels, each id once, with lead-in lists (REQ-239, REQ-240). |
+| 9 | `CARD (looked up)` | Full metadata (name, mana cost, type line, power/toughness/loyalty when present, oracle text, etc.) for every card attached to a lookup question — one heading, one block per attached card, each followed by its WotC rulings (REQ-167, REQ-241, REQ-245). Lookup mode only. |
+| 10 | `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` | Community-sourced combo candidates matched against the submitted or attached cards, only when the question expresses explicit combo intent (DEC-116, REQ-094 amended by REQ-167). |
+| 11 | `SCOPE` | One sentence naming which zones carry no cards or were not included, so the model doesn't assume unsubmitted state. Game mode only. |
+| 12 | `CONVERSATION HISTORY` | Prior turns of the same conversation, included on a follow-up so the model treats the new question as a refinement rather than a fresh start. |
+| 13 | `QUESTION` | The player's final, normalized question text — always the last section. |
@@ Presence matrix @@
-| `INSTRUCTIONS` | present (3 base bullets) | present (5 fixed bullets: base 3 + verbatim-fidelity + REQ-168 guardrail) | present (same 5 fixed bullets) | conditional — a game-mode follow-up adds one more bullet ("treat follow-up questions as refinements…"); a lookup follow-up's bullet set never changes |
-| `MTG REFERENCE` | present | present | present | present |
+| `INSTRUCTIONS` | present (the shared list, REQ-243) | present (the shared list + the REQ-168 off-domain line) | present (same as with cards) | conditional — a game-mode follow-up adds one more bullet ("treat follow-up questions as refinements…"); a lookup follow-up's bullet set never changes |
+| `MTG REFERENCE` | present (game-mode block) | present (lookup block) | present (lookup block) | present (the block for whichever mode the follow-up is in) |
 | `GENERAL GAME CONTEXT` | present | absent | absent | conditional — present only when the follow-up is in game mode |
-| `PHASE GUIDANCE` | present | absent | absent | conditional — present only when the follow-up is in game mode |
-| `ZONE: <name>` | conditional — present when ≥1 zone has cards (always true for a valid game request) | absent | absent | conditional — present only on a game-mode follow-up with populated zones |
-| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the submitted zones/cards; can be empty | conditional — present when the always-on core topic set renders; in practice always true (the core set is fixed and non-empty), plus the replacement-effect interaction topic when two or more attached cards carry replacement or prevention wording (REQ-220) | conditional — the always-on core set only (no cards, so the REQ-220 topic never fires) | conditional — same rule as whichever mode the follow-up is in |
-| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty | conditional — present when System 3 retrieves ≥1 scoring rule (question + each attached card's name/type line/keywords, REQ-167, REQ-178); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode |
-| `CARD (looked up)` | absent | present (REQ-167: one heading, one block per attached card, ≥1 always true on this path) | absent | conditional — present only on a lookup follow-up whose frozen card set is non-empty |
-| `OFFICIAL RULINGS (WotC reference)` | conditional — present when ≥1 submitted card has a matching published ruling | conditional — present when ≥1 attached card has a matching published ruling (gated first on ≥1 card attached, REQ-167) | absent (no cards to have rulings) | conditional — same rule as whichever mode, applied to that mode's frozen card/zone set |
+| `PHASE GUIDANCE` | present | conditional — present when the question names a turn step or an attached card's concept terms do (REQ-238) | conditional — present when the question names a turn step (REQ-238) | conditional — same rule as whichever mode the follow-up is in |
+| `ZONE: <name>` | conditional — present when ≥1 zone has cards (always true for a valid game request); each card's WotC rulings, when it has any, follow its block at its first appearance (REQ-241) | absent | absent | conditional — present only on a game-mode follow-up with populated zones |
+| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the game state, the cards' wording or the question (REQ-242); can be empty | conditional — present when the always-on core topic set renders; in practice always true (the core set is fixed and non-empty), plus the replacement-effect interaction topic when two or more attached cards carry replacement or prevention wording (REQ-220) | conditional — the always-on core set only (no cards, so the REQ-220 topic never fires) | conditional — same rule as whichever mode the follow-up is in |
+| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty; up to two slots from per-card search (REQ-235) | conditional — present when System 3 retrieves ≥1 scoring rule (question + each attached card's name/type line/keywords/concept terms, plus per-card search, REQ-167, REQ-178, REQ-234, REQ-235); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode |
+| `CARD (looked up)` | absent | present (REQ-167: one heading, one block per attached card, ≥1 always true on this path; each card's WotC rulings, when it has any, follow its block, REQ-241) | absent | conditional — present only on a lookup follow-up whose frozen card set is non-empty |
@@ Verification (build re-runs and rewrites this record) @@
-The matrix above was checked against `promptAssembly.ts`'s actual code (not
-authored from memory) and against real `npm run prompt:preview` output for one
-fixture per path, run 2026-08-30:
+The matrix above was checked against `promptAssembly.ts`'s actual code (not
+authored from memory) and against real `npm run prompt:preview` output for one
+fixture per path, run <build date>:
 
 - Game mode — `combat-deathtouch`: confirmed order `SYSTEM ROLE PREAMBLE` →
-  `INSTRUCTIONS` (3 bullets) → `MTG REFERENCE` → `GENERAL GAME CONTEXT` →
+  `INSTRUCTIONS` (the shared list) → `MTG REFERENCE` (game-mode block) → `GENERAL GAME CONTEXT` →
   `PHASE GUIDANCE` → `ZONE: BATTLEFIELD` → `GAME RULES (reference)` →
   `ADDITIONAL RELEVANT RULE EXCERPTS` → `SCOPE` → `QUESTION`.
 - Follow-up (game mode) — `follow-up-chat`: same order as above, plus the
-  4th `INSTRUCTIONS` bullet and a `CONVERSATION HISTORY` section between
+  follow-up `INSTRUCTIONS` bullet and a `CONVERSATION HISTORY` section between
   `SCOPE` and `QUESTION`.
 - Lookup, cards attached — `quick-lookup-multi-card` (the slice A multi-card
   fixture, REQ-167): confirmed order `SYSTEM ROLE PREAMBLE` → `INSTRUCTIONS`
-  (5 bullets) → `MTG REFERENCE` → `GAME RULES (reference)` →
+  (the shared list + the off-domain line) → `MTG REFERENCE` (lookup block) → `GAME RULES (reference)` →
   `ADDITIONAL RELEVANT RULE EXCERPTS` → `CARD (looked up)` (both attached
-  cards under one heading) → `QUESTION`.
+  cards under one heading, each followed by its rulings) → `QUESTION`.
 - Lookup, no card — `quick-lookup-no-card`: same order with `CARD (looked
   up)` structurally absent.
-- `COMMANDER SPELLBOOK COMBO CONTEXT` and `OFFICIAL RULINGS` position (after
-  `ADDITIONAL RELEVANT RULE EXCERPTS` / `CARD`, before the next section) were
-  confirmed directly against the source and against the committed eval golden
-  `commander-spellbook-lookup-multi-card-complete.prompt.golden.txt`, since no
-  representative `prompt:preview` fixture in the committed set carries both a
-  live ruling match and combo intent together.
+- Lookup naming a turn step — a fixture whose question names a step (chosen at
+  build): `PHASE GUIDANCE` right after `MTG REFERENCE`.
+- `COMMANDER SPELLBOOK COMBO CONTEXT` position (after
+  `ADDITIONAL RELEVANT RULE EXCERPTS` / `CARD`, before the next section) and
+  rulings under each card were confirmed directly against the source and against
+  the committed eval golden
+  `commander-spellbook-lookup-multi-card-complete.prompt.golden.txt`.
```

(`build` replaces `<build date>` and every "confirmed" line with what the real
preview output shows; a mismatch with this expected record is a build finding,
not a silent rewrite.)

- Verdict: accept
- Reason:

---

## system-map/prompt-assembly.md — amended: the prompt-building walkthrough

**What this decides:** whether the narrative walkthrough of prompt building
reflects rulings under cards and the rules framed as binding.

**In plain terms:** this page tells the story of how a request becomes a
prompt. Its section order puts a rulings section after the excerpts, and it says
rules and rulings are reference context. After this, rulings print under each
card and the rules are framed once as binding, never overriding the submitted
game state.

**What happens if you say no:** the walkthrough describes the old order.

```diff
@@ How it works @@
 The prompt starts with role and instruction framing, then the static
-`MTG_PROMPT_REFERENCE` block. After that framing, the behavior-level section order is:
+MTG reference block for the prompt's mode (REQ-243). After that framing, the behavior-level section order is:
 `GENERAL GAME CONTEXT` -> `ADDITIONAL GAME STATE` (planned, DEC-043) ->
 `PHASE GUIDANCE` (DEC-036) -> populated zone sections with full card metadata in all
-zones (DEC-042) -> `GAME RULES (reference)` / System 2 ->
-`ADDITIONAL RELEVANT RULE EXCERPTS` / System 3 -> `OFFICIAL RULINGS` / System 1 ->
-`SCOPE` -> `QUESTION`. When conversation history is present, it is inserted before
+zones (DEC-042), each card followed by its System 1 rulings (REQ-241) ->
+`GAME RULES (reference)` / System 2 -> `ADDITIONAL RELEVANT RULE EXCERPTS` / System 3
+(rule-book order, REQ-239) -> `SCOPE` -> `QUESTION`. When conversation history is present, it is inserted before
 `QUESTION` and the instructions tell the model to treat follow-ups as refinements
 against the frozen game state and prior answers.
@@ Worked example @@
 The rendered prompt begins with TheJudge's role/instruction framing and the static MTG
 reference. It then prints `GENERAL GAME CONTEXT`, the planned `ADDITIONAL GAME STATE`
 slot when that field exists, `PHASE GUIDANCE`, `ZONE: STACK (BOTTOM TO TOP)`, and the
-populated non-stack zones. It adds curated rules, supplemental excerpts, and official
-rulings when available, then the `SCOPE` sentence listing zones with no cards or not
+populated non-stack zones, each card followed by its official rulings when it has any.
+It adds curated rules and supplemental excerpts, then the `SCOPE` sentence listing zones with no cards or not
 included. If this is a follow-up turn, `CONVERSATION HISTORY` appears before the final
 `QUESTION`.
@@ Invariants / gotchas @@
-- Rules and rulings blocks are reference context. They do not override submitted stack
-  order, zones, targets, notes, or stated game state.
+- The rules excerpts are framed once, in the instructions, as the binding rules of the
+  game, and rulings as card-specific; neither overrides submitted stack order, zones,
+  targets, notes, stated game state, or a card's oracle text (REQ-243).
```

- Verdict: accept
- Reason:

---

## quick-lookup/README.md — amended: what Quick Lookup's prompt now receives

**What this decides:** whether the Quick Lookup feature spec states what its
prompt now carries: its own reference block, a step summary when a step is
named, rulings under each card, concept terms and per-card search, the trained
model, and lead-in lists.

**In plain terms:** this is Quick Lookup's current-state description. Its
backend section says phase guidance is always absent, rulings sit in their own
section, and search reads only names, type lines and keywords. Those bullets are
rewritten to match the accepted requirements.

**What happens if you say no:** the Quick Lookup spec describes the old prompt.

```diff
@@ Branching prompt assembly @@
-- Built: three things always run regardless of the attached card set. The
-  static `MTG REFERENCE` block (DEC-025), the always-on core game-rules topics
-  (DEC-045 core set), and question-scored System 3 supplemental rules
-  (DEC-046 / REQ-022). (DEC-107, REQ-074)
+- Built: three things always run regardless of the attached card set. Quick
+  Lookup's own `MTG REFERENCE` block, which describes only sections this mode
+  contains (DEC-025, REQ-243), the always-on core game-rules topics
+  (DEC-045 core set), and question-scored System 3 supplemental rules
+  (DEC-046 / REQ-022). (DEC-107, REQ-074)
 - Built: when one or more cards are attached, per-card enrichment layers in for
   every attached card — each card's full metadata including oracle text using
-  the same per-card formatting as populated-zone cards (DEC-042 / REQ-030),
-  each card's WotC rulings under one `CARD (looked up)` / `OFFICIAL RULINGS`
-  heading per section, and System 3 additionally scored against a compact
-  signal for every attached card — its name, type line, and keywords — not its
-  full oracle text, which was measured to collapse supplemental recall
-  (REQ-178). With no cards attached, the rulings section and card section are
-  empty and System 3 scores on the question alone. (DEC-107, REQ-074, REQ-167,
-  REQ-178)
-- Built: game-state-only sections are always omitted — zone sections, `PHASE
-  GUIDANCE` (REQ-024), System 2 game-state topic gating (DEC-045), and the merged
-  zone scope sentence (DEC-025) — because lookup mode never carries game state.
-  These are structurally absent: the lookup assembler does not call the
-  game-context, phase-guidance, or zone-section builders at all. (DEC-107,
-  REQ-074)
+  the same per-card formatting as populated-zone cards (DEC-042 / REQ-030),
+  with power, toughness and loyalty when present (REQ-245), each followed by its
+  WotC rulings under the one `CARD (looked up)` heading (REQ-241), and System 3
+  additionally scored against a compact signal for every attached card — its
+  name, type line, keywords and concept terms (REQ-234) — not its full oracle
+  text, which was measured to collapse supplemental recall (REQ-178); each card's
+  own text is searched separately for two reserved excerpt slots (REQ-235). With
+  no cards attached, the card section is empty and System 3 scores on the
+  question alone. (DEC-107, REQ-074, REQ-167, REQ-178)
+- Built: game-state-only sections are always omitted — zone sections, System 2
+  game-state topic gating (DEC-045), and the merged zone scope sentence
+  (DEC-025) — because lookup mode never carries game state. These are
+  structurally absent: the lookup assembler does not call the game-context or
+  zone-section builders at all. (DEC-107, REQ-074)
+- Built: when the question names a turn step, or an attached card's concept
+  terms do, the prompt carries that step's `PHASE GUIDANCE` summary (at most
+  three steps, in turn order) right after `MTG REFERENCE`, from the same
+  rules-checked text In-Depth uses. It comes from the question and the cards'
+  wording, not from game state. (REQ-024, REQ-238)
@@ Retrieval @@
-- Built: System 3 supplemental rules retrieval (DEC-046) is hybrid-ranked when
-  the embedding-provider seam is active (REQ-182) — the query embedding is
+- Built: System 3 supplemental rules retrieval (DEC-046) is hybrid-ranked when
+  the embedding-provider seam is active (REQ-182) — the query embedding, from the
+  Magic-trained search model (REQ-236), is
   cosine-ranked against the committed per-rule embeddings and blended with the
   IDF keyword score, both normalised per query, with the exact-rule-id boost
   merged into the blended score — over a rule index with the source document's
   table of contents and heading-only entries stripped (REQ-179), excluding
   exactly the curated rule numbers the selected curated topics already carry,
-  and returning a small capped set of the best-ranked rules. IDF-scored
+  and returning a small capped set of the best-ranked rules, two of them reserved
+  for per-card search (REQ-235), printed in rule-book order with their lead-in
+  lists (REQ-239, REQ-240). IDF-scored
   keyword retrieval alone is retained as the mock/offline default and the
   fallback on any embedding failure, so those settings are never worse than the
   prior lexical behaviour. The blend exists for exactly this screen's query
   shape: semantic-only ranking measured better overall but worse on a card
   name, type line, and one keyword with no combat context, where three of eight
   labelled fixtures lost their expected rule from the top five (REQ-181,
   REQ-182). For lookup the query is built from the question tokens always, plus
-  each attached card's name, type line, and keywords — not its oracle text
-  (REQ-167, REQ-178). (DEC-046, REQ-022, REQ-178, REQ-179, REQ-181, REQ-182,
-  DEC-107, REQ-167)
+  each attached card's name, type line, keywords and concept terms — not its
+  oracle text (REQ-167, REQ-178, REQ-234). (DEC-046, REQ-022, REQ-178, REQ-179,
+  REQ-181, REQ-182, DEC-107, REQ-167, REQ-234, REQ-235)
-- Built: the always-on core game-rules topics are a fixed curated set
-  (stack-and-priority, targets, zones, triggered-ability basics), not the
-  state-gated selector the game flow uses — lookup carries no game state to gate
-  on. One topic is added on card wording: when two or more attached cards say
+- Built: the always-on core game-rules topics are a fixed curated set
+  (stack-and-priority, targets, zones, triggered-ability basics), not the
+  selector the game flow uses — lookup carries no game state to gate on.
+  Stack-and-priority carries 117.3's list (117.3a–d) and zones carries 400.7's,
+  so neither lead-in arrives without its list (REQ-240). One topic is added on card wording: when two or more attached cards say
   "instead" or "prevent" (replacement or prevention effects), the prompt also
@@ Measured bounds @@
-- Retrieval: System 3 returns a small capped best-ranked set (top 10), curated
+- Retrieval: System 3 returns a small capped best-ranked set (top 10, two of them
+  reserved for per-card search, REQ-235; lead-in list items outside the ten
+  within a 12,000-character budget, REQ-240), curated
   core-topic rule numbers excluded by exact number; ranking is a hybrid blend of
   normalised cosine over the committed per-rule embeddings and normalised
-  lexical IDF overlap, with the exact-rule-id boost merged into the blended
-  score, and lexical scoring alone retained as the mock/offline default and
-  failure fallback (REQ-181, REQ-182); the query is the question tokens always,
-  plus each attached card's name, type line, and keywords (REQ-167, REQ-178).
-  (DEC-046, REQ-022, REQ-178, REQ-181, REQ-182, REQ-167)
+  lexical IDF overlap (0.65 meaning), with the exact-rule-id boost merged into the blended
+  score, and lexical scoring alone retained as the mock/offline default and
+  failure fallback (REQ-181, REQ-182); the query is the question tokens always,
+  plus each attached card's name, type line, keywords and concept terms (REQ-167,
+  REQ-178, REQ-234). (DEC-046, REQ-022, REQ-178, REQ-181, REQ-182, REQ-167)
-- Always-on core topics: a fixed four-topic core set (stack-and-priority,
-  targets, zones, triggered-ability basics); the static MTG reference block is a
-  bounded ≤2500-char constant. (DEC-045, DEC-025)
+- Always-on core topics: a fixed four-topic core set (stack-and-priority,
+  targets, zones, triggered-ability basics); the lookup MTG reference block is a
+  bounded ≤2500-char constant. (DEC-045, DEC-025, REQ-243)
```

- Verdict: accept
- Reason:

---

## in-depth/README.md — amended: what In-Depth's prompt now receives

**What this decides:** whether the In-Depth feature spec states what its prompt
now carries: rulings under each card, corrected phase guidance, card fields with
power/toughness/loyalty, topics chosen by card wording and question, and the new
search.

**In plain terms:** this is In-Depth's current-state description. Its prompt
section lists a separate rulings section, topics gated on populated zones, and a
search that reads only names, type lines and keywords. Those bullets are
rewritten to match the accepted requirements.

**What happens if you say no:** the In-Depth spec describes the old prompt.

```diff
@@ Prompt assembly (ordered sections) @@
 - Built: assembly builds one large prompt in a fixed section order:
   `GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE` (when `gameStateNotes` present)
-  → `PHASE GUIDANCE` → populated zone sections → `GAME RULES (reference)` →
-  `ADDITIONAL RELEVANT RULE EXCERPTS` → `OFFICIAL RULINGS` → combo context (when
-  eligible) → `CONVERSATION HISTORY` (when present) → `SCOPE` → `QUESTION`. Stack
+  → `PHASE GUIDANCE` → populated zone sections (each card followed by its WotC
+  rulings at its first appearance, REQ-241) → `GAME RULES (reference)` →
+  `ADDITIONAL RELEVANT RULE EXCERPTS` → combo context (when
+  eligible) → `CONVERSATION HISTORY` (when present) → `SCOPE` → `QUESTION`. Stack
   ordering (bottom-to-top) is preserved into the prompt builder. (DEC-025,
-  DEC-042, REQ-006, REQ-022, REQ-024, REQ-030, REQ-031)
-- Built: every prompt includes the static MTG reference block and a merged
-  zone-scope sentence. (DEC-025)
+  DEC-042, REQ-006, REQ-022, REQ-024, REQ-030, REQ-031, REQ-241)
+- Built: every prompt includes the game-mode MTG reference block, a merged
+  zone-scope sentence, and the shared instruction list, which frames the rules
+  once as binding and never overriding the submitted state; the stack is numbered
+  one way, "Stack item 1" at the bottom. (DEC-025, REQ-243)
 - Built: `PHASE GUIDANCE` sits between general context and the zone sections and
   carries phase-specific reasoning; when `turnPhase` is `combat` it is specific to
   the submitted `combatStep`, falling back to generic combat framing when absent.
-  It is never omitted for a valid phase and adds no rules-validation behavior.
-  (DEC-036, DEC-037, REQ-024)
+  It is never omitted for a valid phase and adds no rules-validation behavior. Its
+  text is checked against the rules (cleanup, untap and declare blockers corrected).
+  (DEC-036, DEC-037, REQ-024, REQ-238)
 - Built: every card in every populated zone section emits full metadata —
   `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`,
-  `subtypes`, `targets`, `contextNotes` — not only stack items. Empty oracle text
+  `subtypes`, `targets`, `contextNotes`, and `power`, `toughness`, `loyalty` when
+  the card has them, with oracle line breaks kept — not only stack items. Empty oracle text
   renders `oracleText: (none) — no oracle text recorded for this card`. The stack
   section keeps stack-specific fields (`stackRole`, `caster`, `manaSpent`);
   non-stack sections use `owner` and zone item labels and omit `caster`. `cardId`
-  and `imageUrl` stay out of the prompt text. (DEC-042, REQ-030)
+  and `imageUrl` stay out of the prompt text. (DEC-042, REQ-030, REQ-245)
@@ Retrieval enrichment (machinery consumed) @@
 - Built: `GAME RULES (reference)` loads verbatim WotC Comprehensive Rules
   excerpts from committed artifacts, selected by DEC-045's always-on core plus
-  game-state-gated expansion (System 2, gated on `turnPhase`, `combatStep`, and
-  populated zones), plus the replacement-effect interaction topic when two or
-  more cards on the stack or in any zone say "instead" or "prevent" (REQ-220);
-  card names and keywords never select a topic. It is omitted only when the
-  artifact is missing/empty, with a warning logged. (DEC-030, DEC-045, REQ-022,
-  REQ-220)
+  expansion gated on `turnPhase` and `combatStep` (System 2), plus the topics the
+  cards' wording (through the fixed concept map) or the question match in a fixed
+  trigger table — in place of populated-zone gating (REQ-242) — plus the
+  replacement-effect interaction topic when two or
+  more cards on the stack or in any zone say "instead" or "prevent" (REQ-220);
+  card names and keywords never select a topic. A topic rule that introduces a
+  list carries its list (REQ-240). It is omitted only when the
+  artifact is missing/empty, with a warning logged. (DEC-030, DEC-045, REQ-022,
+  REQ-220, REQ-240, REQ-242)
 - Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 10 supplemental rules
   scored per DEC-046 — hybrid ranking (normalised cosine over the committed
-  per-rule embeddings blended with the normalised IDF-weighted lexical score)
+  per-rule embeddings from the Magic-trained search model, blended 0.65 / 0.35
+  with the normalised IDF-weighted lexical score)
   when the embedding-provider seam is active, with the exact-rule-id boost
   merged into the blended score and lexical scoring alone retained as the
   mock/offline default and the fallback on any embedding failure (REQ-181,
-  REQ-182), from a query built from the question plus each submitted card's
-  name, type line, and keywords rather than its full oracle text (REQ-178),
-  deduplicated against the System 2 selection by exact rule number (REQ-179) —
-  omitted when nothing scores above 0. (DEC-032, DEC-046, REQ-022, REQ-178,
-  REQ-179, REQ-181, REQ-182)
-- Built: `OFFICIAL RULINGS` carries published WotC Oracle rulings for submitted
-  cards. Retrieval relevance (System 2 selection and System 3 recall) is verified
-  by the eval harness against labeled expected outcomes, not structural checks
-  alone. (DEC-029, REQ-032, DEC-047)
+  REQ-182, REQ-236), from a query built from the question plus each submitted card's
+  name, type line, keywords and concept terms and the current turn step, rather
+  than its full oracle text (REQ-178, REQ-234), with two slots reserved for a
+  separate search of each card's own text (REQ-235),
+  deduplicated against the System 2 selection by exact rule number (REQ-179),
+  printed in rule-book order under path labels with lead-in lists (REQ-239,
+  REQ-240) — omitted when nothing scores above 0. (DEC-032, DEC-046, REQ-022,
+  REQ-178, REQ-179, REQ-181, REQ-182, REQ-234, REQ-235, REQ-236, REQ-239, REQ-240)
+- Built: published WotC Oracle rulings for submitted cards print under each
+  card's block, framed as that card's rulings to apply only when the situation
+  matches (REQ-241). Retrieval relevance (System 2 selection and System 3 recall) is verified
+  by the eval harness against labeled expected outcomes, not structural checks
+  alone. (DEC-029, REQ-032, DEC-047, REQ-241)
@@ Measured bounds @@
-- Supplemental rules: up to 10 excerpts (System 3), deduplicated against System 2.
-  (DEC-046, REQ-022)
+- Supplemental rules: up to 10 excerpts (System 3), two reserved for per-card
+  search, deduplicated against System 2; lead-in list items use no slot, within a
+  12,000-character budget per prompt. (DEC-046, REQ-022, REQ-235, REQ-240)
```

- Verdict: accept
- Reason:

---

## integrations-and-data.md — amended: the model artifact, its manifest, and the retraining step

**What this decides:** whether the data-and-integrations page records the
trained model's storage and manifest, the retraining step on every rule-book
refresh, the new card fields, the glossary, and the new prompt-context rules.

**In plain terms:** this page is the inventory of data sources and what the
prompt may contain. It gains: the trained model in private S3 with a committed
manifest, fetched at packaging; a retraining step whenever the rule book, corpus
or practice suite changes; the glossary and edition stored with the rule index;
power, toughness and loyalty as backend-only card fields; and the prompt rules
for rulings under cards, step summaries in Quick Lookup, and binding rules.

**What happens if you say no:** the page describes the stock model and old
prompt rules; the retraining step is written nowhere durable.

```diff
@@ Tech Stack @@
-- Embedding Provider: backend embedding boundary for System 3 hybrid rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` run in-process and blended with the lexical score, `openai` → OpenAI embeddings API, live mode only). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default — the unset value is `mock`, and the deployed backend sets `local` explicitly the same way production sets `ASK_AI_PROVIDER=openai` (REQ-184). `mock` and `local` make no per-request external call (REQ-181, REQ-182).
+- Embedding Provider: backend embedding boundary for System 3 hybrid rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` fine-tuned on Magic rules questions (REQ-236), run in-process and blended with the lexical score, `openai` → OpenAI embeddings API, live mode only, whose vector size mismatch with the committed rule vectors is reported loudly). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default — the unset value is `mock`, and the deployed backend sets `local` explicitly the same way production sets `ASK_AI_PROVIDER=openai` (REQ-184). `mock` and `local` make no per-request external call (REQ-181, REQ-182).
@@ Card Detail Data Strategy @@
 - the backend map additionally carries each card's Scryfall `keywords` array, used only to build the System 3 retrieval query's keyword signal; it is not part of the on-demand card block the frontend fetches and adds nothing to the up-front payload (REQ-180)
+- the backend map additionally carries each card's `power`, `toughness` and `loyalty` when the card has them (a multi-face card's values joined with " // "), printed in the prompt's card blocks; like `keywords`, they are not part of the on-demand card block the frontend fetches and add nothing to the up-front payload (REQ-245)
@@ Game Rules Data Strategy @@
 - the rule index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule content and no rule id appears twice; a build test asserts both and fails when a CR refresh reintroduces either (REQ-179)
-- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by a quantised `all-MiniLM-L6-v2` and stored in a compact number format named by the artifact's own `encoding` field, so the deploy package's data budget keeps real headroom (REQ-183, NFR-017). There is no vector database — the vectors are loaded in-process and cosine-searched, then blended with the lexical score (REQ-181, REQ-182)
+- the rule index parses every rule faithfully — no part title glued to a rule, no real rule dropped as a heading, no two-letter rule id merged — and the build stores beside it the rule book's glossary (used only to translate obsolete terms in a question, never delivered as an excerpt), the rule book's edition date, a hash of its source text, and each part's title (REQ-179, REQ-233, REQ-239)
+- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by the quantised Magic-trained search model (REQ-236), recording the model id and manifest hash that built it (REQ-237), and stored in a compact number format named by the artifact's own `encoding` field, so the deploy package's data budget keeps real headroom (REQ-183, NFR-017). There is no vector database — the vectors are loaded in-process and cosine-searched, then blended with the lexical score (REQ-181, REQ-182)
 - the embeddings artifact is built by an offline step alongside `build-game-rules.mjs`, runs in the same `npm run data:build` / `data:refresh` chain, rebuilds only on CR refresh (skipped when a hash of the current rule index matches the hash the committed artifact was built from, so an unrelated `data:build` run doesn't re-embed for nothing), and degrades gracefully: a missing or malformed artifact, or one whose rule ids don't match the current rule index, disables the semantic path and System 3 falls back to lexical retrieval with one diagnostic warning
-- the raw local embedding model download is gitignored (`apps/backend/data/models/`) and must not be committed; the deploy packaging script warms it once at build time and copies it into the deployment artifact so it ships with no per-request network dependency
+- the search model is never committed (the repository is public): the owner uploads it to the project's private, public-access-blocked S3 bucket under `models/<model-id>/`; a small committed manifest names the model and records a sha256 per file; a fetch script fills the gitignored `apps/backend/data/models/<model-id>/` from S3 and verifies every hash; the deploy packaging script fetches it at build time, refuses on any mismatch, and copies it into the deployment artifact so it ships with no per-request or cold-start network dependency (REQ-184, REQ-237)
+- retraining the search model is a local, owner-run step (REQ-236), required whenever the Comprehensive Rules, the committed rules test corpus or the local practice suite changes, and with every Comprehensive Rules-moving data refresh; after retraining, the owner uploads the new model and its manifest is committed together with every rebuilt vector file (rule embeddings, frozen eval vectors, rules-gate vectors, per-card vectors)
 - query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, unset default `mock`, deployed value `local` set explicitly per REQ-184); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and the unset default runs with no model access; `openai` is seam-selectable for live mode only (REQ-181)
@@ AI Prompt Context Rules — the backend prompt may include @@
-- phase-specific guidance block (`PHASE GUIDANCE`) positioned between `GENERAL GAME CONTEXT` (and `ADDITIONAL GAME STATE` when present) and zone sections; always present for a valid phase submission; combat guidance varies by `combatStep` when present (DEC-036)
+- phase-specific guidance block (`PHASE GUIDANCE`) positioned between `GENERAL GAME CONTEXT` (and `ADDITIONAL GAME STATE` when present) and zone sections; always present for a valid phase submission; combat guidance varies by `combatStep` when present (DEC-036); in Quick Lookup, the same rules-checked summaries for the turn steps the question or an attached card's concept terms name, after the reference block (REQ-238)
 - selected zones
-- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json.br` (REQ-176), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
+- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text (line breaks kept), mana cost/value, type line, colors, supertypes/subtypes, power/toughness/loyalty when present, targets, and context notes, followed by its WotC rulings at its first appearance; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json.br` (REQ-176, REQ-245), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
@@ AI Prompt Context Rules — the backend prompt may include (rules and rulings) @@
-- published WotC Oracle rulings for submitted cards when available from the static backend artifact
-- verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selected per DEC-045 (always-on core plus game-state-gated expansion) plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), from the static backend artifact
-- up to 10 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by exact rule number against the rule numbers the selected System 2 topics list, so a listed parent's unlisted sub-rules still compete (REQ-179)
+- published WotC Oracle rulings for submitted cards when available from the static backend artifact, under each card's block, framed as that card's rulings to apply only when the situation matches (REQ-241)
+- verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selected per DEC-045 (always-on core plus turn-phase and combat-step expansion), in In-Depth the topics the cards' wording or the question match (REQ-242), plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), from the static backend artifact, each lead-in with its list (REQ-240)
+- up to 10 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, keywords and concept terms (and in In-Depth the turn step) rather than its full oracle text (REQ-178, REQ-234), with two slots reserved for a separate search of each card's own text (REQ-235), deduplicated by exact rule number against the rule numbers the selected System 2 topics list, so a listed parent's unlisted sub-rules still compete (REQ-179), and printed in rule-book order under path labels with lead-in lists (REQ-239, REQ-240)
@@ AI Prompt Context Rules — the backend prompt may include (framing) @@
-- static MTG reference block
+- the MTG reference block for the prompt's mode, describing only sections that mode contains (REQ-243)
@@ AI Prompt Context Rules — the backend prompt should treat @@
-- official WotC rulings only as reference context; they do not override the user's submitted stack order, zones, targets, notes, or stated game state
-- general game rules only as reference vocabulary; they do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text
+- the Comprehensive Rules excerpts as the binding rules of the game and WotC rulings as card-specific, applying only when the situation matches; neither overrides the user's submitted game state, stack order, zones, targets, notes, or card oracle text — stated once, in the instructions (REQ-243)
@@ WotC rulings prompt enrichment must @@
 - use per-card and whole-section caps so `MAX_PROMPT_CHAR_BUDGET` remains authoritative
-- appear after populated zone sections and before `SCOPE` and `QUESTION`
+- appear directly under each card's block, once per card at its first appearance, in both modes; there is no separate rulings section (REQ-241)
@@ Game rules prompt enrichment must @@
-- include curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) and REQ-220 (the replacement-effect interaction topic, on card wording) from the committed artifact
-- render selected topics in stable manifest `id` order with verbatim WotC CR prose only
-- appear after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
+- include curated topics selected per DEC-045 (always-on core plus turn-phase and combat-step expansion), REQ-242 (in In-Depth, topics matched by card wording and question) and REQ-220 (the replacement-effect interaction topic, on card wording) from the committed artifact
+- render selected topics in stable manifest `id` order, each topic's rules in rule-book order with their lead-in lists, with verbatim WotC CR prose only (REQ-239, REQ-240)
+- appear after populated zone sections and before the supplemental excerpts, then `SCOPE` and `QUESTION`
```

(Placement note: the "should treat" hunk replaces the two bullets that close the
list headed by the backend's framing rules; both sit together in the current
file, directly after the player-display-names bullet.)

- Verdict: accept
- Reason:

---

## system-map.md — amended: the one-line summaries of System 2 and System 3

**What this decides:** whether the system catalogue's one-line summaries of the
curated topics (System 2) and rule search (System 3) match the new behaviour.

**In plain terms:** the catalogue says System 2 is game-state-gated and System 3
searches on the question plus name, type line and keywords. These summaries are
rewritten, and the catalogue's "backed by" lists add the new requirements.

**What happens if you say no:** the catalogue summaries describe the old
behaviour.

```diff
@@ Curated game rules (System 2) @@
-- Summary: Selects an always-on core plus game-state-gated conditional topics (`turnPhase`, `combatStep`, populated zones) per request, plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), replacing the prior "all topics every request" baseline.
+- Summary: Selects an always-on core plus conditional topics gated on `turnPhase` and `combatStep`, in In-Depth the topics the cards' wording (through the fixed concept map) or the question match in a fixed trigger table (REQ-242), plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), replacing the prior "all topics every request" baseline. A topic rule that introduces a list carries its list (REQ-240).
 - Lives in: `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`
-- Backed by: DEC-030, DEC-045, REQ-022, REQ-220
+- Backed by: DEC-030, DEC-045, REQ-022, REQ-220, REQ-240, REQ-242
@@ Supplemental retrieval (System 3) @@
-- Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-09-09, REQ-190). The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by exact rule number: only the rules the selected topics list are excluded.
-- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact
-- Backed by: DEC-032, DEC-046, REQ-178, REQ-179, REQ-180, REQ-181, REQ-182, REQ-183, REQ-184
+- Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-09-09, REQ-190), two of them reserved for a separate search of each card's own text (REQ-235). The main query is the player's question plus a compact per-card signal (name, type line, keywords) and the fixed concept map's terms for each card's wording, plus the turn step in In-Depth — not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings from the Magic-trained search model blended 0.65 / 0.35 with normalised, stemmed lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by exact rule number: only the rules the selected topics list are excluded. Printed in rule-book order under path labels, with lead-in lists.
+- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, the concept map module, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact, the committed search-model manifest, and the owner-run training pipeline under `scripts/`
+- Backed by: DEC-032, DEC-046, REQ-178, REQ-179, REQ-180, REQ-181, REQ-182, REQ-183, REQ-184, REQ-233, REQ-234, REQ-235, REQ-236, REQ-237, REQ-239, REQ-240
```

- Verdict: accept
- Reason:

## Build-half amendments (answered in session, 2026-10-12)

Raised when the build parked at slice D: the trained model missed 2 of 14 labelled search checks. A free cross-validated measurement (`evidence/fix-experiments.md`) found the two changes below clear all 14 and raise deciding-rule recall everywhere. The owner answered both `accept` in session (see `GRAPH-RUN.md` `## Instruction ledger`). `build` applies them by intent against the branch's current `PRD/sections/` text.

## REQ-190 — amended again: up to fifteen excerpts, cut at 60% of the top score

**What this decides:** whether rule search may show Luna up to fifteen rule excerpts instead of exactly ten, keeping only rules that score close to the best one.

**In plain terms:** today search always shows ten excerpts, padding with weak matches. With this change it shows up to fifteen, thirteen from the main search plus the two per-card slots. A main-search rule is dropped when its meaning-and-words score is below 60% of the top rule's, so weak matches stop padding the list. Rules the question cites by number are never dropped. Measured held-out: deciding rules reaching Luna 445 to 498 alone, 520 with the keyword sets below; rule text per practice question 4,220 to 6,707 characters with both, still under the roughly 7,500 production ships today. This change rests on the search measurement, not on a recorded answer-quality run, which REQ-190 otherwise requires; the paid answer run after merge is that check.

**What happens if you say no:** the cap stays ten and the upkeep labelled check keeps missing (rule 500.6 ranks 11th).

```diff
-- Description: An answer-quality run may answer the same gold case at more than one System 3 supplemental-excerpt cap, for every answer model in the lineup (REQ-188), and score the legs side by side, so the effect of attaching more rule excerpts on the *answer* can be observed. Production retrieval is one of the legs: System 3 is capped at ten excerpts (REQ-181, REQ-182, `system-map/game-rules-retrieval.md`), raised from five on 2026-09-09 by this requirement's own run-3 measurement.
+- Description: An answer-quality run may answer the same gold case at more than one System 3 supplemental-excerpt cap, for every answer model in the lineup (REQ-188), and score the legs side by side, so the effect of attaching more rule excerpts on the *answer* can be observed. Production retrieval is one of the legs: System 3 is capped at fifteen excerpts — thirteen main-ranking slots plus the two per-card slots (REQ-235) — with a relevance cutoff on the semantic path: a main-ranking candidate whose blended score (before rule-id boosts) is below 0.6 × the top main candidate's is dropped, except a rule the question cites by number (REQ-181, REQ-182, `system-map/game-rules-retrieval.md`). Raised from five to ten on 2026-09-09 by this requirement's run-3 measurement, and from ten to up-to-fifteen-with-cutoff on 2026-10-12 by the owner on the right-rules-in-order cross-validated search measurement.
-  - the deployed cap is 10, raised from 5 on 2026-09-09 (`rule-excerpt-cap-ten`) on the recorded run-3 measurement in the notes below. Changing it again requires the same evidence — a recorded run showing a different cap scored better for the deployed model — and an amendment to REQ-181, REQ-182, and `system-map/game-rules-retrieval.md` alongside this requirement, never a change made inside this requirement alone
+  - the deployed cap is 15 with the 0.6 relevance cutoff (2026-10-12, right-rules-in-order, owner decision on the cross-validated search measurement: check-half deciding-rule citations 445 → 520 with REQ-235's keyword sets, all 14 labelled checks passing); before that 10, raised from 5 on 2026-09-09 (`rule-excerpt-cap-ten`) on the run-3 answer measurement. The first paid answer run after this change is its answer-quality check. Changing the cap or the cutoff again requires a recorded measurement and an amendment to REQ-181, REQ-182, and `system-map/game-rules-retrieval.md` alongside this requirement
```

Companion edits, by intent: `DEFAULT_SUPPLEMENTAL_RULE_CAP` becomes 15 and a named cutoff constant 0.6; the run's `--excerpt-cap` default follows the deployed cap; REQ-181 and REQ-182 and `system-map/game-rules-retrieval.md` state the cap and cutoff; the lexical-only fallback keeps the plain top-N with no cutoff.

- Verdict: accept
- Reason: owner, in session 2026-10-12 (yes to both)

## REQ-235 — amended: each card's keyword rule arrives as a full set beside the excerpts

**What this decides:** whether a card's keyword brings its whole rule to Luna — every lettered piece of, for example, the deathtouch rule — on top of the search excerpts.

**In plain terms:** today a deathtouch creature gets whichever deathtouch pieces search happens to rank, and the one that says the damaged creature is destroyed (702.2b) ranked 17th. With this change each card's keywords that name a keyword rule (702.x abilities, 701.x actions) add that rule's lettered pieces as one set, after the search excerpts, skipping pieces already shown. Sets share a 6,000-character budget per prompt; a set that would overflow it is skipped whole. Measured: about 3.2 pieces added per practice question, the budget binding on 13 of 1,181. The rule index ships each keyword rule's title so the match works.

**What happens if you say no:** keyword rules keep arriving in pieces and the deathtouch labelled check keeps missing.

```diff
-  - the number of reserved slots is one named constant, `2`; the System 3 cap stays ten (REQ-190)
+  - the number of reserved slots is one named constant, `2`; the System 3 cap is REQ-190's
+  - keyword sets: for each card per-card search covers, every Scryfall keyword (REQ-180's source) whose name matches a keyword rule's title (701.N or 702.N, title shipped in the rule index) adds all that rule's lettered pieces as one set after the selected excerpts, skipping pieces already selected or excluded by REQ-179; sets share one named per-prompt character budget of 6,000 characters for the added pieces, and a set that would exceed it is skipped whole; keyword-set pieces are not counted against the cap and the enrichment-debug sidecar names them and their card
```

Companion edits, by intent: REQ-179's index records each 701/702 keyword rule's title (data only, never an excerpt); `system-map/game-rules-retrieval.md` and the prompt-layout docs describe the keyword sets.

- Verdict: accept
- Reason: owner, in session 2026-10-12 (yes to both)
