# Rules test corpus (NFR-018, REQ-185)

The committed rules test cases the app's AI is checked against. Each case is one
real, hard Magic: the Gathering rules question carrying an approved correct
answer, stored as one `*.case.json` file in this folder. Eighteen cases exist
today, all migrated to format version 2. They were the first-ship gold set; the
corpus grows from here (see `PRD/sections/functional-requirements.md`, REQ-185).

A case scores only once the owner has approved it. The 18 first-ship cases are
approved by the owner's accept of REQ-185; every later case reaches `approved`
only through the owner review flow.

## What this is not

- **Not runtime prompt context.** These cases never enter a live prompt or
  reach a real player. They are test data only.
- **Not a place for live model calls in any gate.** The retrieval check runs
  explicitly with `npm run eval:worked-solutions`; the answer-quality run with
  `npm run eval:answer-quality`. Neither is invoked by `npm test`,
  `npm run test:eval`, `npm run coverage:check`, or `npm run quality:check`.
  These `*.case.json` files deliberately live outside
  `apps/backend/src/eval/fixtures/`, the directory
  `contextEvaluationHarness.test.ts` globs, so they cannot be picked up by that
  suite by accident, and a regression-guard test
  (`scripts/eval-answer-quality.test.mjs`) asserts the answer-quality command
  appears in none of those gate scripts.
- **No new runtime dependency, no external network call for the retrieval
  check.** It imports only already-existing backend modules and reads only the
  already-committed data. The answer-quality run necessarily makes live provider
  calls (there is no way to score an answer without generating one), so it is
  confirmation-gated behind `--confirm-live-calls` and never made without
  explicit approval.

## Case format version 2

One file per case, named `<id>.case.json`. Fields:

- `id`, `formatVersion` (`2`), `tier` (`1`, `2` or `3`).
- `review` — `status` (`draft`, `approved`, `needs-edit` or `rejected`),
  `reviewedOn` (a date, required once a case is not a draft) and an optional
  `note`.
- `cards` — every card the question names, as `{ oracleId, name }`. A case that
  names no real card (a worked example about a hypothetical creature) has an
  empty list. Every run asks the case the way a player asks it, with all of
  these cards attached.
- `gameState` — `null`, or an In-Depth game context in the same shape as the
  In-Depth request's `gameContext` (players, turn phase, zones whose cards carry
  `owner`, `caster`, `targets` and `contextNotes`), holding only the facts the
  ruling depends on. Stack order is the order of the stack zone, bottom first. A
  controller that differs from the owner goes in the card's `contextNotes`.
  `owner` is set only on a card outside the stack and `caster` only on a stack
  item, the only places the prompt prints them. Every zone card's `cardId` is the
  oracle id of one of `cards`, and every card in `cards` sits in a zone.
- `question` — the player's question, top level.
- `expected` — `outcome` (`works`, `does-not-work` or `depends`), a one-line
  `shortAnswer` for the reviewer, the reference `answer`, and at least one
  `decidingRuleIds` entry. The judge is given `answer` only; `outcome` and
  `shortAnswer` are review and reporting aids.
- `source` — the `authority` (`wotc-comprehensive-rules` for tier 1,
  `wotc-card-ruling` for tier 2, `owner-approved-derived` for tier 3), publisher,
  licence, and the citation the tier requires: a rule id for tier 1; card name,
  oracle id and ruling date for tier 2; a `citation` naming a rule id per
  reasoning step plus a `research` list (discovery links, never the answer) for
  tier 3.
- `layers` — `requiredFacts`, `irrelevantFacts` and `variants`, defined for the
  later clarification and messy-wording tests and left empty for now.
- `snapshot` — `ruleIndexHash` (a SHA-256 of the whole rule-index file the case
  was authored against; the committed index carries no Comprehensive Rules date)
  and `dependsOnHashes` (`rules`, `oracle`, `rulings`: hashes of the deciding
  rules' text, every attached card's oracle text, and every attached card's
  rulings). It is recorded when the case is authored and re-recorded each time
  the owner approves the case.
- `whyHard` — why the case is a genuinely hard interaction, not a trivial lookup.

Tags and difficulty are derived by the loader and never written in a case file:
`mechanic:` tags from the 701/702 rule ids in `decidingRuleIds` (a mechanic case
always lists its mechanic's own rule), `cr:` tags from every deciding rules
section, and difficulty from the number of attached cards and distinct sections
plus flags for layers, replacement effects and multiplayer. The loader also
rejects duplicates: the same id, the same question text, or the same set of
attached cards with the same answer source. A rewording of an existing case is a
future `layers.variants` entry, not a new case.

### The three tiers

- **Tier 1** — the answer is Comprehensive Rules text verbatim: an `Example:`
  line, or a rule's own text when the question asks exactly what that rule
  states. It is read from the committed rule index
  (`apps/backend/data/gameRulesRuleIndex.json`, built by
  `scripts/build-game-rules.mjs`) and cited by rule id. The project already
  commits and serves this corpus in production under the Wizards of the Coast Fan
  Content Policy, so no new licence is introduced.
- **Tier 2** — the answer is a WotC card ruling verbatim, from the committed
  `apps/backend/data/cardRulingsByOracleId.json.br`, cited by card name, oracle id
  and ruling date. The question is this project's own phrasing of a scenario the
  ruling directly answers. A tier-2 case tests whether the model honours the
  ruling the prompt already attaches for that card.
- **Tier 3** — where no official text answers the question, the answer is a
  ruling the owner researched and approved. An agent may only draft one, citing a
  rule id for every step of its reasoning. It is scored and reported on its own,
  never pooled with tiers 1 and 2.

Community sources may choose which questions enter the corpus and may be listed
as tier-3 research, never copied as an answer. An answer written by a contributor
or an agent is never ground truth unless the owner approves it, and then only as
tier 3.

## The shared loader and the request builder

Every reader reads cases through one module, `scripts/lib/gold-cases.mjs`
(REQ-185): `loadGoldCases` validates every file against format version 2 and
returns each case with its derived tags, throwing — naming every problem — rather
than letting a malformed case score as a miss. `compareSnapshot` is the one stale
comparison: it reports which of `rules`, `oracle` or `rulings` no longer match the
committed data. The live runner, the review render and the staleness report all
call it. `readCaseFiles` reads the raw files, which is what a writer must use.

`buildCaseRequest` in `scripts/lib/prompt-fidelity.mjs` is the one request
builder: a case without a `gameState` is a `mode: "lookup"` request with every
`cards` entry attached by oracle id; a case with a `gameState` is an In-Depth
`mode: "game"` request with that `gameState` as its `gameContext`. Backend tests
import both `.mjs` modules statically through the sibling declarations
`scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts`
(`apps/backend/src/eval/caseRequest.test.ts` is the first), never a second copy.

## What each check does

### The retrieval check (`npm run eval:worked-solutions`)

For each non-rejected case, the script builds the request a real player's
question would produce, runs it through `preparePromptInput` (the production
prompt-preparation function, unchanged), and checks whether the case's
`expected.decidingRuleIds` actually appear in the System 3 supplemental retrieval
a live prompt would receive. This reuses the labelled-relevance mechanism
(REQ-032 / DEC-047) the existing eval harness established, applied to real hard
cases. The request carries every attached card, the committed card-detail and
rulings indexes are supplied, and the question is embedded by
`EMBEDDING_PROVIDER` (default `local`, what production runs). Each line says
whether semantic or lexical ranking produced it, and the check refuses to report
a run whose embedder silently fell back. `EMBEDDING_PROVIDER=mock` gives a
deliberately lexical pass for comparison.

A hit means: if a player asked this exact question, the prompt actually sent to
the model would contain the rule text needed to answer it. A miss means the
retrieval scorer didn't surface it. **A miss here says nothing about whether the
model's eventual answer would be right or wrong** — that is what the second check
measures.

### The answer-quality run (`npm run eval:answer-quality`)

Asks a configured lineup of live models every case, once per model and once per
System 3 excerpt cap, through the identical `preparePromptInput` path with the
inputs a player's lookup gets, then has a judge model score each answer alone
against the case's `expected.answer` on four 0-2 axes (Correctness, Grounding,
Calibration, Readability) and rank answers blind. It writes a small committed
scorecard (`apps/backend/src/eval/answer-quality/results.json`) and full
transcripts to a gitignored folder (`output/answer-quality/`). See
`apps/backend/src/eval/answer-quality/` for the rubric, judge and artifact
modules, and `PRD/sections/functional-requirements.md` REQ-186 through REQ-190.

## Running it

```bash
npm run eval:worked-solutions                          # retrieval check, offline
npm run eval:answer-quality                             # answer-quality plan, dry
npm run eval:answer-quality -- --confirm-live-calls     # answer-quality, live (costs money)
```

`eval:worked-solutions` prints one line per case (hit/miss against the deciding
rule ids) plus a summary; add `-- --output <path>` to also write the report to a
file. `eval:answer-quality` with no flag prints the run plan and an estimated
cost; it makes no provider call when no key is configured.

## Files

- `*.case.json` — one case each, in the format above.
- Loaded and validated by `scripts/lib/gold-cases.mjs` (REQ-185), the single
  reader every check uses; requests are built by `scripts/lib/prompt-fidelity.mjs`.
- Checked for retrieval by `scripts/eval-worked-solutions.mjs`.
- Checked for answer quality by `scripts/eval-answer-quality.mjs` and
  `apps/backend/src/eval/answer-quality/` (rubric, assertions, judge, artifact).
