# Worked-solutions evaluation set (NFR-018)

Six real, hard Magic: the Gathering rules questions, each carrying a
published worked solution, curated to check the backend's prompt/retrieval
quality against how hard cases actually resolve -- not only against
hand-authored fixtures.

## What this is not

- **Not runtime prompt context.** These cases never enter a live prompt or
  reach a real player. They are test data only.
- **Not a `quality:check` gate.** Run it explicitly with
  `npm run eval:worked-solutions`. It is never invoked by `npm test`,
  `npm run test:eval`, `npm run coverage:check`, or `npm run quality:check` --
  these `*.case.json` files deliberately live outside
  `apps/backend/src/eval/fixtures/`, the directory
  `contextEvaluationHarness.test.ts` globs, so they cannot be picked up by
  that gating suite by accident.
- **No new runtime dependency, no external network call.** The check script
  imports only already-existing backend modules and reads only the
  already-committed rules corpus (`apps/backend/data/gameRulesRuleIndex.json`,
  `gameRulesByTopic.json`) -- the same data and the same
  `preparePromptInput` code path production already uses for every real
  lookup request.

## What it checks

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
signal for tuning System 3, not a claim that the model's eventual answer was
wrong (that would require a live provider call, which this track does not
make).

## Provenance and licensing (resolved before anything was committed)

Every case is sourced from an official Magic: The Gathering Comprehensive
Rules worked example -- the rule's own "Example:" text, which the Comprehensive
Rules already publishes as the canonical illustration of a hard interaction.
This project already commits and serves this exact Comprehensive Rules corpus
in production (`apps/backend/data/gameRulesRuleIndex.json`, built by
`scripts/build-game-rules.mjs` from the Wizards-published Comprehensive Rules
document, reproduced under the Wizards of the Coast Fan Content Policy).
Each case therefore reuses licensing this project has already resolved and
committed under -- no new external source or license was introduced to build
this set. See each case's `source` block for the specific rule id, section,
and retrieval date.

The question text in each case is this project's own natural-language
phrasing of the scenario the cited official example describes; the
`workedSolution` field is that example's text, verbatim, as the authoritative
published answer.

## Running it

```bash
npm run eval:worked-solutions
```

Prints one line per case (hit/miss against the expected rule id) plus a
summary. Add `-- --output <path>` to also write the report to a file.

## Files

- `*.case.json` — one worked-solution case each: `id`, `question`,
  `expectedSupplementalRuleIds`, `workedSolution`, `source` (provenance and
  licensing), `whyHard` (why the case is a genuinely hard interaction, not a
  trivial lookup).
- Checked by `scripts/eval-worked-solutions.mjs` (`npm run eval:worked-solutions`).
