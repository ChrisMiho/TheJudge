# Graph-run brief — local RulesGuru practice suite

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.
Probe: `PRD/work/probe-rulesguru/` (2026-10-10).

## What the player gets

Fewer wrong rulings on the questions our tests never asked. Today the AI
judge is checked against 400 committed cases. This adds a second, much
larger practice set of about 1,500 judge-style rules questions, rated from
easy (level 0) to corner case. The owner runs it on their own machine to
find where the AI judge misses a rule or gets a ruling wrong. Players never
see it, and it never enters a player's prompt.

The data comes from RulesGuru (rulesguru.org), used with permission, on one
condition: **every piece of RulesGuru data stays on the owner's machine and is
never committed.** Only the tooling that imports, converts and runs it goes in
the repo.

## Why (measured — do not re-derive)

Sample: 918 of roughly 1,500 questions (ids 2–2249), measured 2026-10-10
against `main` at `dabad406`.

| Measure | Result |
| --- | --- |
| Questions citing at least one Comprehensive Rules (CR) rule | 830 of 918 (90%) |
| …where every cited rule is in our committed rule index | 820 |
| Questions citing a rule none of our 400 cases decides on | 686 (75%) |
| Distinct rule ids they cite that our cases never decide on | 470 (our corpus decides on 372 in total) |
| Questions citing a CR section our cases never touch | 270 |
| Questions sharing any card with our cases | 110 (12%) |
| Questions with a card that has a WotC ruling in our data | 881 (96%) |
| Level 0 / 1 / 2 / 3 / Corner Case | 89 / 330 / 295 / 141 / 63 |
| Tagged "Unsupported answers" by RulesGuru | 43 |

What that settles:
- **It adds breadth, not duplicates.** Three questions in four test a rule our
  corpus never decides on.
- **The free check is the main value.** Each question's cited rules map onto
  our `decidingRuleIds`, so the offline check "did the deciding rule reach the
  prompt" (`npm run eval:worked-solutions`, no provider call, no cost) can run
  over the whole set.
- **It brings a difficulty axis.** Level and complexity let results be split by
  difficulty, which the committed corpus cannot do.

## Decisions already made — do not re-litigate

1. **Local only.** RulesGuru questions, answers, card rolls, converted cases,
   run outputs and per-question results live in a gitignored folder on the
   owner's machine. Nothing derived from a specific question is committed:
   not test fixtures, not coverage counts, not receipts, ledgers, PR bodies or
   PRD text.
2. **Say nothing about the permission beyond "used with permission, local
   only."** No details of how or from whom it was obtained go in any committed
   file.
3. **Not ground truth.** RulesGuru answers are community-written. Under REQ-185
   they are never an approved reference answer. The suite is reported apart
   from the official corpus, never counts toward the official headline
   (REQ-187), and never touches `apps/backend/src/eval/answer-quality/results.json`
   or `coverage.json`.
4. **Never a build gate.** CI cannot see the data, so nothing in
   `npm test`, `npm run quality:check` or any CI job may depend on it.
5. **Tooling is committed and tested on synthetic data.** Tests use invented
   questions in the API's shape, never real RulesGuru content.

## Design direction (converged)

**Import (one committed command, e.g. `npm run eval:rulesguru:import`).**
- Pages through `GET https://rulesguru.org/api/questions/?json=<settings>`
  in id order with `previousId` (starts at 1; `0` is rejected), every level,
  every complexity, legality `all`, no tag filter, and a `from` value naming
  TheJudge.
- At most one request every 3 s (the server asks for at least 2 s). A
  50-question request takes about 30 s, so a full import takes roughly 15–20
  minutes.
- Some batches fail with "Incorrectly formatted json."; halving the batch size
  got past it every time in the probe (50 → 25 → 12 → 6). Adaptive batch size,
  stepping past a single bad id, resumable from the last saved id.
- **Freeze on import.** The API re-rolls the cards in a question on every fetch
  (questions are templates). The raw response is saved as fetched, and a
  re-import never silently replaces a frozen question.
- A purge command deletes the whole local folder, in case permission is ever
  withdrawn.

**Convert to local cases.**
- Each question becomes a case in the existing format version 2 shape
  (`scripts/lib/gold-cases.mjs`), marked as an external, unapproved source so
  the official loader would reject it from the committed folder.
- Cards resolve by name to oracle ids through a full name index built from
  committed card data. Do **not** use `apps/frontend/public/data/cardMetadata.json`:
  it leaves out cards with no rules text (vanilla creatures), which caused
  242 false misses in the probe. `cardDetailByOracleId.json.br` carries them.
- `decidingRuleIds` come from the question's `citedRules`. Seven cited ids in
  the sample are bare keyword headers (`702.16`, `701.7`, …) that our index
  holds only as subrules; map a bare header to its subrules.
- Questions tagged "Unsupported answers" are skipped by default. A question
  with an unresolved card or no cited rule is kept in the import but reported
  and excluded from runs.
- Level, complexity and tags are carried so runs can filter and report by
  them.

**Run.**
- `loadGoldCases(casesDir)` and `loadCases(casesDir)` already take a folder.
  The retrieval check and the answer-quality run gain a way to point at the
  local suite (e.g. `--suite rulesguru`), with filters by level, complexity
  and tag.
- The retrieval check over the local suite is free and runs over everything.
  Report: cases whose cited rule reached the prompt, split by level and by CR
  section, with the misses listed (locally).
- A paid answer-quality run over the local suite keeps every existing guard:
  dry run by default, `--confirm-live-calls`, `--max-cost-usd`, sequential.
  The judge compares against RulesGuru's answer and the result is labelled
  "agreement with RulesGuru", never "correct".
- All outputs go to the gitignored folder.

## Open for refinement (recommendation given)

- **Promoting a finding into the official corpus.** When the local suite
  exposes a real miss, may the owner add a new committed case for it?
  Recommend yes, by owner hand only: the new case uses our own question
  wording and a WotC answer (CR text or a `wotc` ruling), exactly as REQ-185
  already allows community sources to choose which questions enter. No
  RulesGuru text carries over.
- **Where the local folder lives.** Recommend under `output/` (the existing
  developer-local pattern, e.g. `output/rulesguru/`), with its own
  `.gitignore` line added **before** the first import, plus a test asserting
  `git check-ignore` covers it.

## Current-state PRD truth to amend

Name only; refinement proposes the text and implementation applies it.
- `PRD/sections/functional-requirements.md` REQ-185: a local-only external
  suite exists beside the committed corpus. Not ground truth, never committed,
  reported apart. Likely a new REQ for the import, convert and run commands.
- `PRD/sections/non-functional-requirements.md` NFR-018: the validation track
  gains the local suite, which is non-gating and has no runtime dependency.
- `PRD/sections/functional-requirements.md` REQ-188: run selection gains the
  local suite and its filters.
- `PRD/sections/goals-and-non-goals.md`: the existing "never a build gate"
  line covers the local suite too.
- `apps/backend/src/eval/worked-solutions/README.md`: a short pointer that the
  local suite exists and is never committed.
- `PRD/work/probe-rules-test-harness/FINDINGS-external-sources.md` row 4f is
  out of date. It said RulesGuru was a skip on license grounds; the license
  asks for permission first rather than banning use, and the owner now has
  permission.

## Constraints (don't rediscover)

- **No RulesGuru text anywhere committed**, including every graph artifact
  (DESIGN-BRIEF, GATE-QUESTIONS, slice docs, ledgers, receipts, PR bodies).
  Agents describe the suite by counts and field names only.
- Be gentle with a free community site: one request every 3 s at most, no
  parallel fetching, no re-import unless asked.
- Live provider calls: the owner launches paid runs with `!`. Per-run cap
  stays at or under $15. Estimate with the dry run first, because the current
  judge's per-case cost is not measured here.
- The 400-case corpus, its review flow (REQ-224), staleness report (REQ-225)
  and offline gate (REQ-222) are unchanged.
- Unrelated parked work, do not conflate: `resolution-recipe-eval`
  (docs PR #283 awaiting verdicts).

## Evidence + reusable tooling

`PRD/work/probe-rulesguru/FINDINGS-fit.md` (all numbers above, API behaviour,
field list). The probe's crawler and fit script were session scratch and are
not kept; the decisions above stand without them.

## What the graph run should produce

A DESIGN-BRIEF and REQ amendments for a local-only RulesGuru practice suite:
an import command (polite, resumable, freezes each question), a converter into
the case format with card and rule mapping, and suite selection plus level,
complexity and tag filters on the retrieval check and the answer-quality run.
All tested on synthetic data, with outputs and data gitignored. The five
decisions above are settled. Refinement settles only the two open items.
