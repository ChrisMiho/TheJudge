# Rules test corpus (NFR-018, REQ-185)

The committed rules test cases the app's AI is checked against. Each case is one
real, hard Magic: the Gathering rules question carrying an approved correct
answer, stored as one `*.case.json` file in this folder. Run 1 of the rules test
harness (REQ-185) brought the corpus to 393 cases: the 18 first-ship cases
(migrated to format version 2) plus 375 drafts, namely 255 mechanic cases (one
for every real mechanic in the committed rule index except two excluded ones),
and 120 hard-area cases (60 from unused Comprehensive Rules `Example:` lines,
58 from WotC rulings that name a second card, and the owner's 2 tester cases as
tier-3 drafts) over twelve rules areas: copies (707), layers (613), continuous
effects (611), replacement and prevention effects (614-616), triggered abilities
(603), resolution (608), combat (508-510), state-based actions (704),
double-faced cards (712), multiplayer (801), Two-Headed Giant (810) and
Commander (903). At least a third of the 120 (63 of them) are `does-not-work`
cases, so the corpus cannot teach that everything works.

A case scores only once the owner has approved it. The 18 first-ship cases are
approved by the owner's accept of REQ-185; every later case is a `draft` and
reaches `approved` only through the owner review flow below.

## Source pools

A case may name the authored block it came from in `source.pool`, which the
coverage report counts by: `mechanic` (one case per real mechanic), `cr-example`
(a hard-area case from an unused `Example:` line), `two-card-ruling` (a
hard-area case from a WotC ruling that names a second card, both cards
attached) and `tester` (one of the owner's two tier-3 tester cases). The 18
first-ship cases have no pool.

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

## The offline prompt gate (REQ-222)

Part of `npm run quality:check`, with no provider call and no live embedding
call. For every non-rejected case, draft or not, the backend tests under
`apps/backend/src/eval/rules-gate/` build the request with `buildCaseRequest`,
run it through the unmodified `preparePromptInput`, and check that every attached
card's oracle text and rulings reach the prompt, that each deciding rule that
used to reach it still does (a ratchet over `baseline.json`), and that a case's
`gameState` is valid and its facts are printed. System 3 ranks with committed
frozen query vectors (`frozen-query-vectors.json`), each stored with a hash of
its query text; a case whose query text changed is "awaiting a re-freeze" and is
skipped, never failed. Rebuild the vectors with
`npm run eval:build-rules-gate-vectors` and raise the baseline with
`npm run eval:rules-gate:baseline`.

## The owner review flow (REQ-224)

```bash
npm run eval:rules-review:render                        # drafts and stale approved cases -> output/rules-review/batch-001.md ...
npm run eval:rules-review:render -- --batch-size 40 --include-needs-edit
npm run eval:rules-review:apply -- output/rules-review/batch-001.md
```

Render groups pending cases by mechanic, then rules section, into gitignored
Markdown batches. Fill `>>> Verdict:` with `approve`, `reject` or `edit` (an edit
needs a one-line `>>> Note:`). Apply writes `review.status`, `review.reviewedOn`
and the note into each case file, re-records `snapshot` on an approve, refuses a
case whose question, answer or committed rule, oracle or ruling text changed
since the render, and rewrites `coverage.json`. An `edit` lands in `needs-edit`
and never touches the reference answer. Nothing else writes `approved`.

## Coverage and staleness (REQ-223, REQ-225)

```bash
npm run eval:rules-coverage     # prints mechanic x {approved, draft, none} and the counts, rewrites coverage.json
npm run eval:rules-staleness    # lists stale cases and cases awaiting a vector re-freeze; never fails
```

The mechanic list is read from the committed rule index; the owner's excluded
list is `excluded-mechanics.json` (701.45 Assemble and 702.158 Space Sculptor).
`apps/backend/src/eval/answer-quality/coverage.json` holds counts and rule
numbers only. The coverage gate, `scripts/rules-coverage-gate.test.mjs`, runs in
`quality:check` and fails on an uncovered mechanic, an excluded rule number the
index lacks, or an out-of-date `coverage.json`.

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

Asks the deployed model (`gpt-4.1`, at excerpt cap 10) the selected approved,
non-stale cases (by default the ones whose prompt or reference answer changed
since they were last graded; `--tag`, `--tier`, `--sample N`, `--all` and
`--bake-off` are explicit options), through the identical `preparePromptInput`
path with the inputs a player's lookup gets, then has a judge model score each
answer alone against the case's `expected.answer` on four 0-2 axes (Correctness,
Grounding, Calibration, Readability), and rank answers blind when two or more
models answered. It merges per case into a small committed scorecard
(`apps/backend/src/eval/answer-quality/results.json`), records the judge's token
use, reports the headline per tier (tier 3 apart), and writes full transcripts to
a gitignored folder (`output/answer-quality/`). See
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
- `excluded-mechanics.json` — the owner's excluded (joke-only) mechanics, each with a reason.
- Loaded and validated by `scripts/lib/gold-cases.mjs` (REQ-185), the single
  reader every check uses; requests are built by `scripts/lib/prompt-fidelity.mjs`.
- Checked for retrieval by `scripts/eval-worked-solutions.mjs`.
- Checked for answer quality by `scripts/eval-answer-quality.mjs` and
  `apps/backend/src/eval/answer-quality/` (rubric, assertions, judge, artifact).
