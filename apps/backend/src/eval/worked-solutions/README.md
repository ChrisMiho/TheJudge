# Worked-solutions gold set (NFR-018, REQ-185)

Eighteen real, hard Magic: the Gathering rules questions, each carrying a
published, citable correct answer. The set is tiered: **tier 1** (fifteen
cases) cites a Comprehensive Rules `Example:` line verbatim; **tier 2**
(three cases) cites a WotC card ruling verbatim, paired with a
hand-authored, human-reviewed question. This one committed set is read two
ways: a retrieval check (does the right rule reach the prompt?) and an
answer-quality run (is the answer built from it actually correct?).

## What this is not

- **Not runtime prompt context.** These cases never enter a live prompt or
  reach a real player. They are test data only.
- **Not a `quality:check` gate, in either use.** The retrieval check runs
  explicitly with `npm run eval:worked-solutions`; the answer-quality run
  with `npm run eval:answer-quality`. Neither is ever invoked by `npm test`,
  `npm run test:eval`, `npm run coverage:check`, or `npm run quality:check` --
  these `*.case.json` files deliberately live outside
  `apps/backend/src/eval/fixtures/`, the directory
  `contextEvaluationHarness.test.ts` globs, so they cannot be picked up by
  that gating suite by accident, and a regression-guard test
  (`scripts/eval-answer-quality.test.mjs`) asserts the answer-quality command
  appears in none of those gate scripts either.
- **No new runtime dependency, no external network call for the retrieval
  check.** It imports only already-existing backend modules and reads only
  the already-committed rules corpus (`apps/backend/data/gameRulesRuleIndex.json`,
  `gameRulesByTopic.json`) -- the same data and the same
  `preparePromptInput` code path production already uses for every real
  lookup request. The answer-quality run necessarily makes live provider
  calls (there is no way to score an answer without generating one), so it
  is confirmation-gated behind `--confirm-live-calls` and never made without
  explicit approval.

## What each check does

Both reads share one loader/validator, `scripts/lib/gold-cases.mjs`, which
enforces a four-field validity test (a non-empty `question`, a non-empty
`workedSolution`, a `tier` of 1 or 2, a `source` block with the citation its
tier requires) so a malformed case fails loudly rather than silently scoring
as a miss.

### The retrieval check (`npm run eval:worked-solutions`)

For each case, the script builds the same `mode: "lookup"` request shape a
real player's question would produce, runs it through
`preparePromptInput` (the production prompt-preparation function, unchanged),
and checks whether the case's `expectedSupplementalRuleIds` -- the official
rule the worked solution comes from -- actually appears in the System 3
supplemental-retrieval top 5 that a live prompt would receive. This reuses
the same labeled-relevance mechanism (REQ-032 / DEC-047) the existing eval
harness already established for `expectedSupplementalRuleIds`, applied to
real hard cases instead of hand-authored ones.

A hit means: if a player asked this exact question, the prompt actually sent
to the model would contain the rule text needed to answer it correctly. A
miss means the retrieval scorer didn't surface it -- a concrete, reproducible
signal for tuning System 3. **A miss here says nothing about whether the
model's eventual answer would be right or wrong** -- that is exactly what
the second check, below, was built to measure; before it existed, this
statement had to be the other way around (a retrieval miss was the only
signal this repository had, since nothing inspected the answer itself).

### The answer-quality run (`npm run eval:answer-quality`)

Asks a configured lineup of live models (`gpt-4.1-mini`, `gpt-4.1`,
`gpt-5-mini`, `gpt-5-nano` by default) every case in this set, once per
model and once per System 3 excerpt cap (5 and 10), through the identical
`preparePromptInput` path. A judge model stronger than every contestant
(default `gpt-5`, under `ANSWER_QUALITY_JUDGE_MODEL`) scores each answer
alone against the case's published `workedSolution` on four 0-2 axes
(Correctness, Grounding, Calibration, Readability), then ranks every answer
to a question blind. It writes a small committed scorecard
(`apps/backend/src/eval/answer-quality/results.json`) and full transcripts
to a gitignored folder (`output/answer-quality/`). See
`apps/backend/src/eval/answer-quality/` for the rubric, judge, and artifact
modules, and `PRD/sections/functional-requirements.md` REQ-186 through
REQ-190 for the full requirements.

## Provenance and licensing (resolved before anything was committed)

**Tier 1** cases are sourced from an official Magic: The Gathering
Comprehensive Rules worked example -- the rule's own "Example:" text, which
the Comprehensive Rules already publishes as the canonical illustration of a
hard interaction. This project already commits and serves this exact
Comprehensive Rules corpus in production
(`apps/backend/data/gameRulesRuleIndex.json`, built by
`scripts/build-game-rules.mjs` from the Wizards-published Comprehensive
Rules document, reproduced under the Wizards of the Coast Fan Content
Policy). Each case therefore reuses licensing this project has already
resolved and committed under -- no new external source or license was
introduced to build this set. See each case's `source` block for the
specific rule id, section, and retrieval date.

**Tier 2** cases are sourced from an official WotC card ruling, verbatim,
from the committed `apps/backend/data/cardRulingsByOracleId.json`, cited by
card name, oracle id, and ruling date; the question is this project's own
natural-language phrasing of a scenario the cited ruling directly answers,
reviewed by a human before commit.

There is no tier 3: community sources (common-mistakes articles, judge
blogs, forums) may choose which questions enter the set and are cited in a
case as why it matters, never as its answer. An answer written by a
contributor or an agent is never ground truth.

The question text in each case is this project's own natural-language
phrasing of the scenario the cited official source describes; the
`workedSolution` field is that source's text, verbatim, as the authoritative
published answer.

## Running it

```bash
npm run eval:worked-solutions                          # retrieval check, offline
npm run eval:answer-quality                             # answer-quality plan, dry
npm run eval:answer-quality -- --confirm-live-calls     # answer-quality, live (costs money)
```

`eval:worked-solutions` prints one line per case (hit/miss against the
expected rule id) plus a summary; add `-- --output <path>` to also write the
report to a file. `eval:answer-quality` with no flag prints the run plan and
an estimated cost and makes no network call.

## Files

- `*.case.json` — one gold case each: `id`, `tier` (1 or 2), `question`,
  `expectedSupplementalRuleIds`, `workedSolution`, `source` (provenance and
  licensing, shaped per tier), `whyHard` (why the case is a genuinely hard
  interaction, not a trivial lookup).
- Loaded and validated by `scripts/lib/gold-cases.mjs` (REQ-185), the single
  reader both checks below use.
- Checked for retrieval by `scripts/eval-worked-solutions.mjs`
  (`npm run eval:worked-solutions`).
- Checked for answer quality by `scripts/eval-answer-quality.mjs`
  (`npm run eval:answer-quality`) and
  `apps/backend/src/eval/answer-quality/` (rubric, assertions, judge,
  artifact).
