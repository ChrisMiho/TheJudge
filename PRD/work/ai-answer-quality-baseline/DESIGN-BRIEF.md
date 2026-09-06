# Design brief — ai-answer-quality-baseline

**What this is:** the instrument that scores whether the answer a player reads
is actually right, so a retrieval or prompt change can be shown to help, hurt,
or do nothing.

**What you need to do:** answer the ten blocks in `GATE-QUESTIONS.md`. Nothing
here is written to `PRD/sections/` yet — implementation applies the approved
proposal alongside the code.

**What it changes:** one new on-demand command, one committed scores file, six
new requirements, and four amendments. No new screen, endpoint, request field,
provider, model, or build gate.

## Scope, in product terms

Today the app can prove the right official rules reached the prompt. It cannot
prove the answer built from them is correct. Three instruments measure
retrieval — ten labelled fixtures that gate every pull request, a 156-pair
recall benchmark, and six worked-solution cases — and all three stop at
"did the right rule arrive". None of them reads the answer.

This package defines the fourth instrument: an **answer-quality baseline run**.
It asks the live model each of six hard rules questions whose official published
answer is already committed, scores each answer against that published answer,
and writes a comparable record. Two runs, taken before and after a change, are
diffable. That is the whole product.

It is measurement tooling, not a feature. There is no player-facing surface, so
no new `FLOW-###` is reserved and `PRD/sections/screen-layout.md` is untouched.

## Non-goals

- **No CI gate on model output.** The run is never in `npm run quality:check`,
  `npm test`, `npm run test:eval`, or `npm run coverage:check`. Model answers
  are non-deterministic; a build must never fail on one.
- **No brittle golden.** The committed artifact is a scores record, never
  asserted byte-for-byte against a stored answer.
- **No product surface change.** No new endpoint, no `AskAiRequest` field, no
  Zod schema change, no frontend change.
- **No provider or model swap.** The answer model stays whatever
  `ASK_AI_PROVIDER` / `OPENAI_MODEL` already select.
- **No production retrieval change.** System 3 stays capped at five excerpts.
  The larger cap is a parameter of the *experiment*, never of the deployed app,
  unless a later run and a later gate say so.
- **No new dependency, no committed secret, no Scryfall refresh.**
- **Not a general-purpose LLM eval framework.** Six gold cases and one rubric.

## Measurements made for this brief

All offline, on branch `thejudge-auto/ai-answer-quality-baseline`, 2026-09-06.
No live provider call was made in this node.

### M1 — how many gold cases exist, and which carry a known-correct answer

Path: read every `apps/backend/src/eval/worked-solutions/*.case.json` and every
`apps/backend/src/eval/fixtures/*.fixture.json`.

- **6** worked-solution cases. **All six** carry a `workedSolution` string — the
  Comprehensive Rules example text verbatim, 187–592 characters — plus a
  `source` block with rule id, publisher, and licensing, and an
  `expectedSupplementalRuleIds` array of exactly one rule id.
  (`delayed-trigger-created-too-late` 603.7a, `illegal-target-partial-resolution`
  608.2b, `last-known-information-simultaneous-sba` 704.8,
  `layers-timestamp-order` 613.9, `replacement-effect-single-application` 614.5,
  `state-based-actions-mid-resolution` 704.4.)
- **31** eval fixtures, of which **10** carry an `expected` block
  (`cascade-keyword`, `combat-deathtouch`, `counterspell-stack`,
  `quick-lookup-card`, `quick-lookup-multi-card`,
  `quick-lookup-multi-keyword-card`, `quick-lookup-no-card`,
  `quick-lookup-off-domain`, `state-based-actions`, `upkeep-trigger`).
- **Zero** fixtures carry a known-correct answer of any kind. Every `expected`
  block holds only `expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, and
  `forbiddenSupplementalRuleIds` — retrieval labels, not answers.

**Consequence:** the six worked-solution cases are the only gold set available
today. All ten labelled fixtures are marked *needs an answer key* in REQ-185.

### M2 — the size of a real assembled prompt

Path: `preparePromptInput` (the production prompt-preparation function,
unmodified) on each worked-solution case as `mode: "lookup"`, with the query
embedded in-process by `localEmbeddingProvider` from the packaged model cache —
the same hybrid path the deployed backend runs under `EMBEDDING_PROVIDER=local`
(REQ-184). The run's own `enrichmentDebug.supplemental.usedSemantic` was `true`
for all six, so this is the semantic path and not a silent lexical fallback.

| Case | Prompt chars |
| --- | --- |
| last-known-information-simultaneous-sba | 9,438 |
| state-based-actions-mid-resolution | 9,980 |
| replacement-effect-single-application | 10,577 |
| delayed-trigger-created-too-late | 10,712 |
| layers-timestamp-order | 11,186 |
| illegal-target-partial-resolution | 12,628 |

**Mean 10,754 characters; range 9,438–12,628.** For comparison, the committed
prompt goldens span 6,977 (`quick-lookup-off-domain`) to 26,514
(`ambiguous-wording`) characters, so the gold cases sit in the lower-middle of
the real corpus — a lookup-mode prompt, not a full staged game context.

### M3 — per-run cost, from M2 and published pricing (an estimate)

**This is an estimate, not a measurement.** Token counts are derived from the
measured character counts at the widely used ~4-characters-per-token rule of
thumb; no OpenAI tokenizer is a dependency of this repo and none was run.

- Mean prompt 10,754 chars ≈ **2,690 input tokens** per answer call at cap 5;
  ≈ **3,345** at cap 10 (see M4).
- A two-leg run (cap 5 and cap 10) over six cases: 12 answer calls
  (≈ 36,200 input tokens) plus 12 judge calls (≈ 18,000 input tokens, each
  carrying the question, the published worked solution, the answer, and the
  rubric). Output ≈ 600 tokens per answer and ≈ 300 per judge verdict, so
  ≈ 10,800 output tokens.
- At a mini-class published price of $0.40 per million input / $1.60 per million
  output: **≈ $0.04 per two-leg run.** At a full `gpt-4.1`-class published price
  of $2.00 / $8.00 per million: **≈ $0.19.**
- The code default when `OPENAI_MODEL` is unset is `gpt-4.1-mini`
  (`apps/backend/src/providers/createAskAiProvider.ts:14`).
- Every call is far below the provider's per-minute token ceiling, and the run
  makes them sequentially, so cadence is not throttled.

**REQ-188 therefore sets no numeric cost target.** The first live run records its
own actual token usage and dollar cost into the artifact, and *that* becomes the
recorded baseline — an explicit baseline-to-be-recorded, not a number reasoned
from proportions.

### M4 — how a run varies the System 3 excerpt cap

Path: the same production call as M2, reading
`enrichmentDebug.supplemental.selected` (ranks 1–5) and `.runnerUp` (ranks 6–15),
then re-formatting the section with `formatSupplementalRulesSection`.

- **The production cap of five is a hard-coded literal `5`,** at four call sites
  in `apps/backend/src/prompt/preparation.ts` (lines 223, 267, 313, 351). It is
  not a named constant and not an option on `PreparePromptInputOptions`. The
  retrieval functions themselves already take `max` (default 5) —
  `retrieveRulesForQuery`, `retrieveRulesForQueryWithDebug`,
  `retrieveSupplementalRules`, `retrieveSupplementalRulesWithDebug` in
  `apps/backend/src/gameRulesRetrieval.ts`.
- **A larger cap needs no change to ranking.** `retrieveRulesForQueryWithDebug`
  already returns `runnerUp = scored.slice(max, max + 10)` as full rule objects,
  so the instrument can assemble a cap-10 prompt from the identical ranking the
  production path produced.
- **Section size, cap 5 → cap 10, over the six cases:** 21,385 → 37,141
  characters total; **mean +2,626 characters per prompt** (~660 tokens).
- **Recall on the gold set is already saturated:** the expected rule is inside
  the top 5 for **6 of 6** cases, and stays 6 of 6 at 6, 8, 10, and 15. This
  independently reproduces what `npm run eval:worked-solutions` reports.

**Consequence — this reframes the experiment.** On the seed gold set a larger
cap cannot *add* a missing rule; it can only add lower-confidence excerpts
alongside the right one. So the cap experiment measures **distraction**, not
recall: does the model answer worse when four or five extra near-miss rules sit
next to the correct one? That is precisely the question no retrieval metric can
answer, and it is why REQ-190 makes the cap a parameter of the instrument rather
than a production change.

### M5 — where a comparable artifact would live

Path: read the two existing committed result files and the `output/` entries in
`.gitignore`.

- `apps/backend/src/eval/benchmark/results.json` and `semantic-results.json` are
  committed, tiny, and purely numeric — `n`, `k`, per-condition `recall5` and
  `mrr`, `scoredAt`, `method`. They diff cleanly and carry no model prose.
- `.gitignore` already excludes `output/prompt-preview/`,
  `output/retrieval-relevance-report.txt`, and `output/combo-answer-quality/` —
  the established home for developer-local, prose-heavy run output.

**Consequence:** REQ-189 splits the artifact the same way. A small committed
scores file next to the benchmark results, and the full transcripts in a
gitignored `output/answer-quality/`.

## Decisions proposed

Each is a `## <STABLE-ID>` block in `GATE-QUESTIONS.md` with its complete diff.

| ID | New / amended | Target | Decision |
| --- | --- | --- | --- |
| REQ-185 | new | `functional-requirements.md` | Gold set = the six worked-solution cases; all ten labelled fixtures need an answer key first |
| REQ-186 | new | `functional-requirements.md` | Judge = deterministic assertions + a reference-grounded model judge + a human pass |
| REQ-187 | new | `functional-requirements.md` | Four axes scored 0–2; correctness is the only headline number |
| REQ-188 | new | `functional-requirements.md` | On-demand confirmation-gated command; never a gate; cost recorded, not targeted |
| REQ-189 | new | `functional-requirements.md` | Committed scores file + gitignored transcripts |
| REQ-190 | new | `functional-requirements.md` | Excerpt cap is a run parameter; production stays five |
| NFR-018 | amended | `non-functional-requirements.md` | Scope grows from prompt validation to answer validation |
| REQ-146 | amended | `functional-requirements.md` | Its "separate scope" note now names where that scope lives |
| SYSTEM-MAP-EVAL-HARNESS | amended | `system-map.md` | New sub-entry for the answer-quality baseline |
| GOALS-ANSWER-QUALITY-NON-GOAL | amended | `goals-and-non-goals.md` | The non-goal stays no-CI-gate; "separate scope" is resolved |

### Why the judge is a combination, not one mechanism

A model judging alone drifts: change the judge and every past run is silently
re-scored. A human alone does not scale past six cases and produces no
comparable number. Assertions alone cannot see hedging, grounding, or
readability. The recommendation runs all three, in that order, and pins the
judge model and rubric revision into every run artifact so two runs are only
compared when they used the same judge.

The single most important choice: **the judge is given the published worked
solution as the reference answer.** It is never asked whether it knows the
Magic rules; it is asked whether the answer agrees with this specific published
official example. That is a far more reliable task and it is only possible
because every gold case already carries that text (M1).

### Why the gold set does not grow here

Ten fixtures carry retrieval labels and zero carry answers (M1). Writing an
answer key for a hand-authored fixture means inventing ground truth — exactly
what NFR-018 was created to avoid when it insisted on *published* worked
solutions. REQ-185 sets the entry bar (a published, citable correct answer) and
marks all ten as needing a key, rather than manufacturing six more cases now.
Six is small; the brief says so plainly and REQ-185 records the growth path.

### Live provider calls, said plainly

**Yes, a run needs live provider calls.** There is no way to score an answer
without generating one. The mock-first posture is preserved exactly as
`integrations-and-data.md` requires:

- The default stays mock. `ASK_AI_PROVIDER` unset means no live call is possible.
- The command makes no network call without `--confirm-live-calls`; without it
  it prints the plan and the cost estimate and exits.
- With the flag but without `ASK_AI_PROVIDER=openai`, `OPENAI_API_KEY`, and
  `OPENAI_MODEL`, it fails with an actionable message rather than a stack trace
  — the same guard `scripts/compare-combo-answer-quality.mjs` already ships.
- No secret is committed. The key is read from the environment, as today.
- No new dependency: `openai` is already a backend dependency, and the judge
  call is eval-only tooling that never touches `AskAiProvider`, `AskAiRequest`,
  or any product code path.

## Material assumptions and their evidence

| # | Assumption | Evidence | Ladder rung |
| --- | --- | --- | --- |
| A1 | Measurement tooling belongs in `PRD/sections/functional-requirements.md` as `REQ-###`, not as a new flow or screen | REQ-146 (the combo answer-quality A/B script) and REQ-177 (the committed retrieval benchmark) are both `REQ-###` tooling entries with no user-visible surface | 3 — established local pattern |
| A2 | An answer-quality run may never enter `quality:check` | `goals-and-non-goals.md` non-goal line 83; NFR-018 constraint 3; REQ-146 acceptance ("never added to `npm run quality:check`") | 1 — active PRD truth |
| A3 | The run is confirmation-gated and its prose output is gitignored | REQ-146's acceptance criteria and `.gitignore` lines 56–64 | 2/3 — tested behaviour and local pattern |
| A4 | The committed record is numeric-only and diffable | `apps/backend/src/eval/benchmark/results.json` shape (M5) | 3 — established local pattern |
| A5 | The instrument runs on the deployed retrieval path (`EMBEDDING_PROVIDER=local`), not the mock default | REQ-184 makes `local` the deployed setting; M2 confirms `usedSemantic: true` under it | 1 — active PRD truth |
| A6 | The cap experiment needs no production ranking change | M4: `runnerUp` already returns ranks 6–15 as full rule objects | 2 — existing tested behaviour |
| A7 | Extracting the literal `5` into one named constant is in scope for build | `technical-design-rules.md` reuse-before-creating: duplicated constants across files are a defect | 3 — established local rule |
| A8 | No WotC-rulings scoring axis | All six gold cases' `source.type` is a Comprehensive Rules worked example (M1); an axis measured on zero cases is noise | 4 — smallest reversible scope |
| A9 | The judge model is named by its own setting and recorded per run, defaulting to `OPENAI_MODEL` | Mirrors the `ASK_AI_PROVIDER` / `EMBEDDING_PROVIDER` explicit-selection seam (`integrations-and-data.md`) | 3/6 — local pattern, no new integration |
| A10 | REQ-032 is **not** amended | Grepped its full text: it asserts the harness is the gate for *retrieval relevance* and that it replaced `prompt:preview` as the sole *relevance* verification path. It makes no claim to be the only quality instrument, so nothing in it is falsified | 1 — active PRD truth, checked not assumed |

## Amendment set — how it was enumerated

Grepped `PRD/sections/`, `PRD/README.md`, root `README.md`, and
`apps/backend/src/eval/` for `worked-solution`, `NFR-018`, `report-only`,
`eval harness`, `answer quality`, `LLM`, `judge`, `gold`, `quality:check`,
`five excerpts`, `top five`, `top-5`. Live assertions this change falsifies, and
where each is answered:

1. `non-functional-requirements.md` NFR-018 — its title, description, and third
   constraint all scope the worked-solutions set to *prompt* validation, and its
   set is described as checking retrieval only. → **NFR-018 block.**
2. `system-map.md` `## Eval harness` — its summary enumerates what the harness
   covers, and answer quality is not in it. → **SYSTEM-MAP-EVAL-HARNESS block.**
3. `goals-and-non-goals.md` line 83 — "a general answer-quality baseline across
   the whole fixture corpus stays separate scope". → **GOALS-ANSWER-QUALITY-NON-GOAL
   block.**
4. `functional-requirements.md` REQ-146 constraint 3 — "a broad answer-quality
   baseline across all fixtures remains separate scope"; and its note "this is
   the first path in TheJudge that inspects real provider answers". → **REQ-146
   block.**
5. `apps/backend/src/eval/worked-solutions/README.md` — "not a claim that the
   model's eventual answer was wrong (that would require a live provider call,
   which this track does not make)". This lives in the code tree, not
   `PRD/sections/`, so refinement does not diff it; **REQ-185's acceptance
   criteria require build to update it** in the same change.

Checked and **not** falsified: REQ-032 (assertion A10), REQ-177, REQ-182,
REQ-184, `system-map/game-rules-retrieval.md`'s five-excerpt cap (REQ-190 leaves
production at five), NFR-002 (no production latency change), NFR-004 (no new
endpoint).

## Measurement plan for build

Every quantitative claim below is either a measurement already made above or an
explicit baseline the first run records. None is a proportion or a guess.

1. **Offline, no live call — gold-set integrity.** A test asserts all six
   `*.case.json` files parse, each carries a non-empty `workedSolution`, a
   `source.ruleId`, and at least one `expectedSupplementalRuleIds` entry.
   Verifies REQ-185.
2. **Offline, no live call — the cap parameter.** A test asserts that with
   `--excerpt-cap 5` the assembled prompt is byte-identical to the production
   prompt for each gold case, and that `--excerpt-cap 10` adds excerpts drawn
   from the same ranking. Baseline to assert against: the M4 figures — six
   prompts of 9,438 / 9,980 / 10,577 / 10,712 / 11,186 / 12,628 characters at
   cap 5, and a mean +2,626 characters at cap 10. Verifies REQ-190.
3. **Offline, no live call — the dry run.** `npm run eval:answer-quality` with
   no confirmation flag prints the plan and the cost estimate, makes no network
   call, and exits 0. Proved with a scratch environment and no key, the way
   `scripts/package-lambda.test.mjs` and `scripts/compare-combo-answer-quality.test.mjs`
   already prove their guards. Verifies REQ-188.
4. **Offline, no live call — the artifact.** A test round-trips the scores file
   through its writer and asserts every required metadata field is present
   (gold-set revision, answer model, judge model, rubric revision,
   `EMBEDDING_PROVIDER`, excerpt cap, git commit, `scoredAt`, per-case per-axis
   scores, token usage, cost). Verifies REQ-189.
5. **One live run, owner-confirmed, at the end of build.** Records the first
   baseline: correctness score per case at cap 5 and cap 10, all four axis
   scores, actual token usage, and actual dollar cost. **No pass threshold is
   set for this run** — it is the baseline every later run is compared against,
   and REQ-188 says so explicitly rather than inventing a target.
6. **Regression guard.** `npm run quality:check` is unchanged and must stay
   green; a test asserts the new command appears in no gate script.

## References

- Requirements: REQ-032, REQ-146, REQ-177, REQ-181, REQ-182, REQ-184
- Non-functional: NFR-002, NFR-004, NFR-017, NFR-018
- Sections: `system-map.md` `## Eval harness`,
  `system-map/game-rules-retrieval.md`, `goals-and-non-goals.md`,
  `integrations-and-data.md`
- Intake (evidence, cited by path, never opened beyond itself):
  `intake/answer-quality-context.md`, `intake/IDEA.md`, `intake/README.md`,
  `intake/MANIFEST.md`
- Code: `apps/backend/src/eval/`, `apps/backend/src/prompt/preparation.ts`,
  `apps/backend/src/gameRulesRetrieval.ts`,
  `apps/backend/src/providers/`, `scripts/eval-worked-solutions.mjs`,
  `scripts/compare-combo-answer-quality.mjs`,
  `scripts/retrieval-relevance-report.mjs`, `scripts/prompt-preview.mjs`
