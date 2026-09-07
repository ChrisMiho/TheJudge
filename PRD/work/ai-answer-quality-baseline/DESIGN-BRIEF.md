# Design brief — ai-answer-quality-baseline

**What this is:** the instrument that scores whether the answer a player reads
is actually right, so a retrieval, prompt, or model change can be shown to help,
hurt, or do nothing. As the owner finalized it, its first job is a **bake-off**:
four candidate answer models answer the same gold questions through the same
prompt, and a stronger judge model grades them.

**What you need to do:** nothing here. The ten blocks in `GATE-QUESTIONS.md` are
answered — six `edit`, four `accept`, no rejections — and that finalized file is
the decision record. This brief was rewritten on 2026-09-07 to follow it. Nothing
here is written to `PRD/sections/` yet; implementation applies the approved
proposal alongside the code.

**What it changes:** one new on-demand command, one committed scores file, six
new requirements, and four amendments. The eval command answers each gold case
once per model in a **configured answer-model lineup** and once per excerpt cap —
that lineup is an option of the eval run only (finalized REQ-188). No new screen,
endpoint, request field, or build gate. **The production answer model is
untouched:** the provider request shape stays model-and-prompt only, `OPENAI_MODEL`
still selects what the deployed app answers with, and the eval run ignores it so a
stray environment value cannot silently swap a contestant.

## Scope, in product terms

Today the app can prove the right official rules reached the prompt. It cannot
prove the answer built from them is correct. Three instruments measure
retrieval — ten labelled fixtures that gate every pull request, a 156-pair
recall benchmark, and six worked-solution cases — and all three stop at
"did the right rule arrive". None of them reads the answer.

This package defines the fourth instrument: an **answer-quality baseline run**.
It asks a lineup of live models each of a set of hard rules questions whose
official published answer is already committed, scores each answer against that
published answer, and writes a comparable record. Two runs, taken before and
after a change, are diffable; and inside one run, four models answering the same
question are comparable against each other. That is the whole product.

Three things the owner's edits fixed, and this brief now follows:

- **The gold set is tiered and grows past six** (finalized REQ-185). Tier 1 is a
  Comprehensive Rules worked example verbatim; tier 2 is a WotC card ruling
  verbatim paired with a hand-authored, human-reviewed question. Both tiers are
  official; there is no tier 3.
- **The answer model is a lineup, not a setting** (finalized REQ-188): `gpt-4.1-mini`
  (the code default, and the baseline), `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`. Every
  case is answered once per model per cap through the identical prompt path, so the
  product's current prompt and retrieval are held fixed while only the model varies.
- **The judge is stronger than every contestant and never one of them** (finalized
  REQ-186): default `gpt-5` under its own setting, and after scoring each answer
  alone it sees all answers to one question side by side — labels hidden, order
  shuffled — and ranks them.

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
- **No production model change.** The lineup is an option of the eval run only.
  What the deployed app answers with stays whatever `ASK_AI_PROVIDER` /
  `OPENAI_MODEL` select, and this package changes neither (finalized REQ-188).
  If a gpt-5-family model wins the bake-off, switching production to it is a
  later package with its own gate — not something this run does.
- **No reasoning-effort setting.** `openAiResponsesProvider.ts` sends `model` and
  `input` and nothing else, so gpt-5-family contestants run at their default
  reasoning effort. Adding a reasoning-effort or verbosity parameter to the
  provider is a follow-up package, opened only if a gpt-5-family model wins on
  correctness and its recorded latency misses the under-three-second answer
  target (NFR-002) — never a change made inside this one (finalized REQ-188).
- **No production retrieval change.** System 3 stays capped at five excerpts.
  The larger cap is a parameter of the *experiment*, never of the deployed app,
  unless a later run and a later gate say so.
- **No new player-facing surface.** No screen, no overlay, no
  `PRD/sections/screen-layout.md` row, no `FLOW-###`.
- **No community-sourced answers.** Common-mistakes articles, judge blogs, and
  forums may choose *which* question enters the set and are cited as why it
  matters; they are never its answer. Commander Spellbook combos stay out —
  community-curated, and the existing combo A/B (REQ-146) already inspects real
  answers on combo scenarios (finalized REQ-185).
- **No new dependency, no committed secret, no Scryfall or CR refresh.**
- **Not a general-purpose LLM eval framework.** One rubric, one gold set, one
  command.

## Measurements made for this brief

All offline. No live provider call was made in any refinement node. M1, M2, M4,
and M5 were taken 2026-09-06 on `thejudge-auto/ai-answer-quality-baseline`; M6 and
the re-derived M3 were taken 2026-09-07 on `thejudge-auto/ai-answer-quality-baseline-work`
while reconciling this brief with the finalized proposal.

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

**Consequence, as the owner finalized it:** the six worked-solution cases are the
only *already-committed* gold cases, and they seed the set rather than being it.
Finalized REQ-185 defines two official tiers and requires at least those six plus
roughly a dozen more hand-picked hard cases, authored at build from the two
committed official pools — the rule index for tier 1 and the rulings index for
tier 2 (M6). All ten labelled fixtures are still marked *needs an answer key* and
stay out: they carry retrieval labels and no answer of any kind.

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

### M3 — per-run cost for the finalized lineup (an estimate, re-derived 2026-09-07)

**This is an estimate, not a measurement**, and it replaces the single-model
figure this brief carried before the owner's edits. Token counts are derived from
M2's *measured* character counts at the widely used ~4-characters-per-token rule
of thumb; no OpenAI tokenizer is a dependency of this repo and none was run.

**Inputs.** The finalized lineup (REQ-188) is four answer models — `gpt-4.1-mini`,
`gpt-4.1`, `gpt-5-mini`, `gpt-5-nano` — with `gpt-5` as the judge (REQ-186). The
seeded case count is **~18**: the six committed cases plus roughly a dozen
hand-picked tier-1/tier-2 seeds (REQ-185). Two excerpt caps, 5 and 10 (REQ-190).
Prompt size comes from M2 (mean 10,754 chars ≈ **2,690 input tokens** at cap 5) and
M4 (mean +2,626 chars at cap 10 ≈ **3,345 tokens**). Prices are the published list
rates per million input / output tokens: `gpt-4.1-mini` $0.40/$1.60, `gpt-4.1`
$2.00/$8.00, `gpt-5-mini` $0.25/$2.00, `gpt-5-nano` $0.05/$0.40, `gpt-5` $1.25/$10.00.

**Call volume.** 4 models × 18 cases × 2 caps = **144 answer calls**; one lone
judge call per answer = **144**; one blind side-by-side ranking call per case per
cap = **36**. **324 sequential provider calls per full run.**

**Tokens.** Answers: 18 × (2,690 + 3,345) = 108,630 input tokens per model, so
≈ **435k input** across the lineup, and at ≈ 600 output tokens per answer
≈ **86k output**. Judge: the judge prompt carries the question, the reference
answer, the answer under review, the attached rule ids, and the rubric — never the
10k-character assembled prompt — so ≈ 1,500 input tokens per lone call and ≈ 3,400
per ranking call (it holds four answers at once): ≈ **338k judge input**. Judge
output is where gpt-5 costs: it bills reasoning tokens as output, so budget
≈ 800 tokens per lone verdict and ≈ 1,000 per ranking ≈ **151k judge output**.

**Cost.** Answers ≈ **$0.55** (`gpt-4.1` $0.39 of it; `gpt-5-nano` $0.01). Judge
≈ **$1.90** — $0.42 input, ≈ $1.51 output-with-reasoning. **Full run ≈ $2.50,
call it $1–4** depending on how many reasoning tokens gpt-5 spends. A single-model,
six-case run stays at pennies. **This confirms rather than revises the owner's
"a few dollars per full run".**

- The code default when `OPENAI_MODEL` is unset is `gpt-4.1-mini`
  (`apps/backend/src/providers/createAskAiProvider.ts:14`) — the lineup's baseline
  contestant, though the run reads the lineup option and ignores `OPENAI_MODEL`.
- Every call is far below the provider's per-minute token ceiling, and the run
  makes them sequentially, so cadence is not throttled.
- **The ~18-case figure applies M2's six measured prompt sizes to the dozen
  unwritten seeds.** Those cases do not exist yet; tier-2 ruling cases may assemble
  differently. Re-check both the case count and the published prices before the
  first live run — the estimate is stated as an estimate for exactly this reason.

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

That saturation was measured on the six committed CR cases only. Finalized
REQ-190 adds the note that the tier-2 ruling cases REQ-185 introduces are **not**
known to be retrieval-saturated, so as the gold set grows the cap experiment
regains recall signal alongside the distraction signal. Finalized REQ-190 also
generalizes a leg from *cap* to **model × cap**: every cap value is answered by
every model in the lineup, in one run.

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

### M6 — the two committed official pools the tiers draw from

Made 2026-09-07 in this worktree, after the owner's REQ-185 edit introduced the
tiers. Read `apps/backend/data/gameRulesRuleIndex.json` and
`apps/backend/data/cardRulingsByOracleId.json`. No network call, no refresh.

- **Tier 1 pool — `apps/backend/data/gameRulesRuleIndex.json`, committed.** 2,873
  rule entries; **277 `Example:` lines across 215 of them.** This is the flat rule
  index `scripts/build-game-rules.mjs` emits and the deployed backend already
  serves for supplemental retrieval, and it is the same file the six existing gold
  cases already name as their `source.committedDataPath`. Spot-checked `603.7a`:
  the committed entry's text contains, verbatim, the
  `delayed-trigger-created-too-late` case's `workedSolution` string.
- **The raw CR download is *not* the pool.** `apps/backend/data/cr/source.txt` is
  gitignored and must not be committed (`.gitignore`; `integrations-and-data.md`
  Game Rules Data Strategy). It is written by `scripts/refresh-scryfall-data.mjs`
  — a network refresh that requires explicit human approval and that no
  answer-quality run ever issues — and read only by `scripts/build-game-rules.mjs`
  when the data artifacts are rebuilt. It is absent from this worktree, as
  designed. **Tier-1 authoring reads the committed index**, so it needs neither
  that download nor `npm run data:refresh`.
- **Tier 2 pool — `apps/backend/data/cardRulingsByOracleId.json`, committed.**
  76,605 rulings over 19,542 cards, unchanged from the 2026-09-06 measurement.

**Consequence:** the 277 figure in finalized REQ-185's tier-1 criterion is real and
reproduces offline in any checkout; only its *provenance* was wrong. That sentence
inside the diff now names the committed index and says the six committed cases
already cite it. The tiers, the counts, the verdict, the reason, and every other
sentence of that block stand exactly as the owner left them.

## Decisions proposed

Each is a `## <STABLE-ID>` block in `GATE-QUESTIONS.md` with its complete diff.
All ten are answered: **six `edit`, four `accept`, no rejections.** The rows below
describe the *finalized* decision, after the owner's edits were applied inside each
block's diff.

| ID | New / amended | Target | Decision as finalized | Verdict |
| --- | --- | --- | --- | --- |
| REQ-185 | new | `functional-requirements.md` | Gold set is two official tiers — a CR worked example verbatim, or a WotC card ruling verbatim with a human-reviewed question; at least the six committed cases plus ~a dozen hand-picked common-mistake seeds; four-field validity test; no tier 3, no combos; the ten labelled fixtures still need an answer key | edit |
| REQ-186 | new | `functional-requirements.md` | Judge = deterministic assertions + a reference-grounded model judge + a human pass, **plus** a blind side-by-side ranking pass; judge defaults to `gpt-5` under `ANSWER_QUALITY_JUDGE_MODEL`, is never an answer model, and a match is flagged in the artifact | edit |
| REQ-187 | new | `functional-requirements.md` | Four axes scored 0–2; correctness is the only headline number | accept |
| REQ-188 | new | `functional-requirements.md` | On-demand confirmation-gated command over a four-model lineup × two caps; dry run verifies model access; latency recorded per call; lineup-only differences are a model comparison, not incomparable; never a gate; cost recorded, not targeted | edit |
| REQ-189 | new | `functional-requirements.md` | Committed scores file + gitignored transcripts; a leg is model × cap; per case per leg records latency in ms and the blind rank | edit |
| REQ-190 | new | `functional-requirements.md` | Excerpt cap is a run parameter crossed with every model; production stays five; tier-2 cases are not known to be saturated | edit |
| NFR-018 | amended | `non-functional-requirements.md` | Scope grows from prompt validation to answer validation | accept |
| REQ-146 | amended | `functional-requirements.md` | Its "separate scope" note now names where that scope lives | accept |
| SYSTEM-MAP-EVAL-HARNESS | amended | `system-map.md` | New sub-entry: a configured lineup, and a judge stronger than every contestant that scores alone and ranks blind side by side | edit |
| GOALS-ANSWER-QUALITY-NON-GOAL | amended | `goals-and-non-goals.md` | The non-goal stays no-CI-gate; "separate scope" is resolved | accept |

### How an answer is judged — four layers, not one mechanism

Finalized REQ-186 runs **four** things, in a fixed order:

1. **Deterministic assertions**, free and model-free: did the answer name the gold
   rule id, is it non-empty, how long is it.
2. **The lone judge pass.** One call per answer, handed the question, the attached
   rule ids, the answer, the case's published reference answer, and the rubric. It
   scores the four axes and writes a one-paragraph rationale. A judge that cannot
   decide returns `undetermined`, which is reported and never counted as a pass or
   a fail.
3. **The blind side-by-side rank** — the layer the owner's edit added. For each
   gold case at each excerpt cap, once every answer has been scored alone, one
   further judge call sees **all** answers to that question together, model labels
   hidden and order shuffled per case, with the reference answer and the rubric,
   and ranks them by agreement with the reference. The rank is recorded per answer
   (REQ-189). Side-by-side ranking is more reliable than lone scores, and it is
   what makes the model bake-off trustworthy rather than four unrelated scorecards.
4. **The human pass.** The run writes the full per-case record and a person reads
   it; only that dated human conclusion becomes durable project history — the same
   posture the existing combo answer-quality comparison already uses (REQ-146).

Two properties of the judge itself, both from the owner's edit:

- **It is stronger than every contestant and never one of them.** The judge is
  named by its own setting, `ANSWER_QUALITY_JUDGE_MODEL`, and **defaults to
  `gpt-5`** — not to the answer model, and not to `OPENAI_MODEL`. A model grading
  its own answers favours its own phrasing and shares its own blind spots, so the
  artifact **flags any run whose judge model id matches an answer model id**.
- **It is blind to the leg.** In both the lone pass and the ranking pass the judge
  is never told which model or which excerpt cap produced an answer, so neither the
  model comparison nor the cap comparison is biased by a label or by position.

The single most important choice: **the judge is given the published worked
solution as the reference answer.** It is never asked whether it knows the
Magic rules; it is asked whether the answer agrees with this specific published
official example. That is a far more reliable task and it is only possible
because every gold case already carries that text (M1), and it is the reason the
gold set may never accept a hand-authored answer key.

The judge model id and the rubric revision are stamped into every run artifact, so
two runs are only ever compared when the same judge scored both.

### How the gold set is defined and how it grows

Finalized REQ-185 makes the set **tiered, all-official, and larger than six.**

- **Tier 1** — the reference answer is a Comprehensive Rules `Example:` line
  verbatim, cited by rule id. It is read from the committed flat rule index
  `apps/backend/data/gameRulesRuleIndex.json`, which carries 277 such lines across
  215 rule entries (M6) and which the six existing cases already cite as their
  source. Six are used today; that is the concrete growth path.
- **Tier 2** — the reference answer is a WotC card ruling verbatim from the
  committed `apps/backend/data/cardRulingsByOracleId.json` (76,605 rulings over
  19,542 cards), cited by card name, oracle id, and ruling date, paired with a
  hand-authored question a human reviews before commit. A tier-2 case tests whether
  the model honours the ruling the prompt already attaches for that card — the
  failure a player actually sees at the table.
- **There is no tier 3.** Community sources — common-mistakes articles, judge
  blogs, forums — may choose *which* question enters and are cited in the case as
  why it matters, never as its answer. An answer written by a contributor or an
  agent is never ground truth. Commander Spellbook combos are excluded: they are
  community-curated, and REQ-146 already inspects real answers on combo scenarios.
- **The validity test is four fields.** A case is valid only when it carries a
  non-empty `question`, a non-empty `workedSolution`, a `tier` of 1 or 2, and a
  `source` block with the citation its tier requires — plus at least one
  `expectedSupplementalRuleIds` entry. A test asserts all of it, so a malformed case
  fails loudly rather than quietly scoring as a miss.
- **First-ship size:** at least the six committed cases, plus **roughly a dozen**
  hand-picked hard cases drawn from tiers 1 and 2, each chosen from a topic players
  commonly get wrong — so the first baseline is not six data points. Tier-1 and
  tier-2 scores are reported with their tier and never pooled without saying so.

The ten labelled eval fixtures stay out. They carry retrieval labels and zero
answers (M1); writing an answer key for a hand-authored fixture means inventing
ground truth, which is exactly what NFR-018 was created to avoid when it insisted
on *published* worked solutions. They are recorded as **needing an answer key**.

### Live provider calls, said plainly

**Yes, a run needs live provider calls.** There is no way to score an answer
without generating one. The mock-first posture is preserved exactly as
`integrations-and-data.md` requires:

- The default stays mock. `ASK_AI_PROVIDER` unset means no live call is possible.
- The command makes no network call without `--confirm-live-calls`; without it
  it prints the plan and the cost estimate and exits.
- With the flag but without `ASK_AI_PROVIDER=openai` and `OPENAI_API_KEY`, it
  fails with an actionable message naming what is missing, rather than a stack
  trace — the same guard `scripts/compare-combo-answer-quality.mjs` already ships.
  `OPENAI_MODEL` is **not** required and is **not** read: the lineup option names
  the answer models, so a stray environment value cannot silently swap a
  contestant (finalized REQ-188).
- **Before its first paid call the run checks model access** — a models-list
  request, not a completion — for every model in the lineup and for the judge, and
  fails naming any model that is not available. The dry run performs the same check
  when a key is present and skips it when none is. Access to the gpt-5 family has
  not been verified from this repo, which is why the check exists (finalized
  REQ-188).
- **Latency is recorded, never gated.** Wall-clock time per call goes into the
  artifact so the bake-off cannot crown a model the under-three-second answer
  target (NFR-002) could not use in production.
- Calls are made sequentially, so a run stays inside the provider's per-minute
  token limit.
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
| A8 | No WotC-rulings scoring axis **at first ship**. Revised 2026-09-07: finalized REQ-185 adds tier-2 card-ruling cases, so the "zero cases" evidence expires as the set grows. REQ-187 was accepted as written and already says the axis may be added once a case that turns on a card ruling enters the set — so adding it is an amendment to REQ-187 and a rubric-revision bump, not something build decides | All six *committed* gold cases' `source.type` is a Comprehensive Rules worked example (M1); REQ-187's own criterion carries the growth clause | 4 — smallest reversible scope |
| A9 | **Revised 2026-09-07 to follow finalized REQ-186.** The judge model is named by its own setting `ANSWER_QUALITY_JUDGE_MODEL`, recorded per run, and **defaults to `gpt-5`** — never to `OPENAI_MODEL` and never to an answer model; the artifact flags any run where the judge id matches a lineup id | The owner's REQ-186 edit ("the judge must be stronger than every contestant and never one of them"), applied inside that block's diff; the setting still mirrors the `ASK_AI_PROVIDER` / `EMBEDDING_PROVIDER` explicit-selection seam (`integrations-and-data.md`) | 1 — finalized product truth in `GATE-QUESTIONS.md` |
| A10 | REQ-032 is **not** amended | Grepped its full text: it asserts the harness is the gate for *retrieval relevance* and that it replaced `prompt:preview` as the sole *relevance* verification path. It makes no claim to be the only quality instrument, so nothing in it is falsified | 1 — active PRD truth, checked not assumed |
| A11 | Model access is proved by a **models-list request**, not by a throwaway completion, before any paid call — and the dry run makes the same check whenever a key is present | Finalized REQ-188 mandates the check; a list request is the smallest action that answers "can this org call this model" and spends nothing. gpt-5-family access has never been exercised from this repo, so it cannot be assumed | 4/6 — smallest reversible scope, no new integration |
| A12 | The answer-model lineup is a **run option of the eval command**, not an environment variable, and the run ignores `OPENAI_MODEL` entirely | Finalized REQ-188 says so; and `openAiResponsesProvider.ts` sends only `model` and `input`, so every contestant is addressable by model id with no provider change (verified at gate-qc) | 1/2 — finalized truth, existing tested behaviour |
| A13 | The ~18-case count and the published prices behind M3 are **re-checked before the first live run**, not treated as settled | M3's own dozen seeds do not exist yet, so their prompt sizes are unmeasured; finalized REQ-188's note requires the price re-check. Recording actual usage supersedes the estimate | 4 — smallest reversible scope |

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

1. **Offline, no live call — gold-set integrity.** A test asserts every
   `*.case.json` file parses and passes the finalized four-field validity test: a
   non-empty `question`, a non-empty `workedSolution`, a `tier` of 1 or 2, and a
   `source` block carrying publisher, licensing, and the citation its tier requires
   — rule id for tier 1; card name, oracle id, and ruling date for tier 2 — plus at
   least one `expectedSupplementalRuleIds` entry. A malformed case fails loudly
   rather than scoring as a miss. A second assertion checks the set holds at least
   the six named committed cases. Verifies REQ-185.
2. **Offline, no live call — the cap parameter.** A test asserts that with
   `--excerpt-cap 5` the assembled prompt is byte-identical to the production
   prompt for each gold case, and that `--excerpt-cap 10` adds excerpts drawn
   from the same ranking. Baseline to assert against: the M4 figures — six
   prompts of 9,438 / 9,980 / 10,577 / 10,712 / 11,186 / 12,628 characters at
   cap 5, and a mean +2,626 characters at cap 10. Verifies REQ-190.
3. **Offline, no live call — the dry run.** `npm run eval:answer-quality` with
   no confirmation flag prints the plan and the cost estimate, makes no network
   call, and exits 0. It also proves the model-access check's two branches: with
   no key present it skips the check and still exits 0; the check itself is a
   models-list request, never a completion. Proved with a scratch environment and
   no key, the way `scripts/package-lambda.test.mjs` and
   `scripts/compare-combo-answer-quality.test.mjs` already prove their guards.
   Verifies REQ-188.
4. **Offline, no live call — the artifact.** A test round-trips the scores file
   through its writer and asserts every required field is present. Run metadata:
   gold-set case ids, tiers and count, the answer-model lineup, judge model id,
   rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, git commit, UTC
   timestamp, total token usage and cost. **Per leg — a leg is one answer model at
   one excerpt cap** — the model id, the cap, and the headline count of cases
   scoring Correctness 2. Per case per leg — the four axis scores, the
   `namesGoldRuleId` assertion, an `undetermined` flag, prompt characters, token
   usage, **wall-clock latency in milliseconds**, and **the blind rank** from the
   side-by-side pass. A further test asserts the file carries no model prose, and
   that the comparison rule holds: two runs differing only in answer-model lineup
   report as a **model comparison**, while a difference in gold set, judge model,
   rubric revision, or `EMBEDDING_PROVIDER` reports as **incomparable**. Verifies
   REQ-189 and REQ-188's comparability criterion.
5. **One live run, owner-confirmed, at the end of build.** It crosses **every model
   in the lineup with cap 5 and cap 10** — `gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`,
   `gpt-5-nano`, judged by `gpt-5` — and records the first baseline: the headline
   correctness count per model per cap, all four axis scores per case per leg, the
   blind side-by-side rank, actual token usage, actual wall-clock latency, and
   actual dollar cost. **No pass threshold is set for this run** — it is the
   baseline every later run is compared against, and REQ-188 says so explicitly
   rather than inventing a target. Latency is reported, never a pass or a fail.
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
- Committed data the gold tiers draw from (M6):
  `apps/backend/data/gameRulesRuleIndex.json` (tier 1),
  `apps/backend/data/cardRulingsByOracleId.json` (tier 2). The raw CR download
  `apps/backend/data/cr/source.txt` is gitignored, is never committed, and is not
  read by any answer-quality run.
- Code: `apps/backend/src/eval/`, `apps/backend/src/prompt/preparation.ts`,
  `apps/backend/src/gameRulesRetrieval.ts`,
  `apps/backend/src/providers/`, `scripts/build-game-rules.mjs`,
  `scripts/eval-worked-solutions.mjs`,
  `scripts/compare-combo-answer-quality.mjs`,
  `scripts/retrieval-relevance-report.mjs`, `scripts/prompt-preview.mjs`
