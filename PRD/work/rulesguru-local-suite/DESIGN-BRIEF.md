# Design brief — rulesguru-local-suite

## What this is

The AI judge gets tested against far more rules questions, and players never
see any of it. Today it is checked against about 400 committed cases. This adds
a local practice set of about 1,500 judge-style questions from RulesGuru, used
with permission, local only. The owner imports them once onto their own
machine, converts them into test cases there, and runs two existing checks over
them: the free "did the deciding rule reach the prompt" check over everything,
and the paid answer run over a filtered slice. Results split by RulesGuru's
difficulty level (0 to corner case), complexity and tags.

What the owner must do: answer `GATE-QUESTIONS.md` (seven rule changes and two
blocker questions), then merge the docs PR. After the build merges, the owner
runs the import from their main checkout; agents never do.

## Scope

In scope:
- an import command: polite, resumable, freezes each question as fetched;
- a purge command that deletes every piece of suite data;
- a convert command into the format version 2 case shape, with a full card
  name lookup built from committed card data and bare keyword headers mapped to
  their subrules;
- a `--suite rulesguru` selection with level, complexity and tag filters on the
  retrieval check (`npm run eval:worked-solutions`) and the answer-quality run
  (`npm run eval:answer-quality`);
- one gitignored suite folder, ignored before the first import, and the guards
  that keep it out of git and out of every gate;
- the PRD truth in `GATE-QUESTIONS.md`, applied at build.

Non-goals:
- committing anything derived from a specific RulesGuru question: no question,
  answer, card roll, converted case, fixture, per-question result, count,
  receipt, ledger, PR body or PRD text;
- treating a RulesGuru answer as ground truth, approving a suite case, or
  pooling suite results with the official corpus or its headline;
- any build gate over the suite (CI cannot see it);
- anything entering a player's prompt; any runtime, route, schema, provider or
  frontend change;
- the evidence trace (REQ-229), diagnostic arms other than A (REQ-230),
  regrade runs, and the review, coverage and staleness commands over the suite;
- a new npm dependency.

## Settled decisions (the owner's stated intent, from the intake)

1. Local only. Every piece of RulesGuru data and every result derived from a
   specific question lives in one gitignored folder and is never committed.
2. Nothing is said about the permission beyond "used with permission, local
   only".
3. Not ground truth. RulesGuru answers are community-written; under REQ-185
   they are never an approved reference answer. The suite is reported apart
   from the official corpus, never counts toward the official headline
   (REQ-187), and never touches `apps/backend/src/eval/answer-quality/results.json`
   or `coverage.json`.
4. Never a build gate. Nothing in `npm test`, `npm run quality:check` or any CI
   job may depend on the suite.
5. Tooling is committed and tested on synthetic data only.

## Owner decisions pending (blocker questions in `GATE-QUESTIONS.md`)

- **B1 — promoting a finding.** Recommendation: yes, by the owner's hand only:
  a new corpus case in our own words with a WotC answer (tier 1 or 2), entering
  as a draft through the review flow, carrying nothing from RulesGuru. If yes,
  the build adds one line to REQ-185 (exact text in the B1 block). If no, the
  suite only reports. Nothing else in this design depends on the answer.
- **B2 — the folder.** Recommendation: `output/rulesguru/`. The design treats
  the path as one constant (`SUITE_DIR`, in `scripts/lib/rulesguru-suite.mjs`);
  every PRD diff that names `output/rulesguru/` takes the owner's path instead
  if B2 names another one. A folder inside the repo belongs to one checkout, so
  the owner runs the suite from the main checkout; a fresh worktree starts
  empty.

## Design

### The suite folder

```
output/rulesguru/            (B2; one constant)
  raw/<question id>.json     frozen API response for one question, as fetched
  import-state.json          last saved id, skipped ids, batch-size history
  cases/rulesguru-<id>.case.json
  convert-report.txt         counts, plus excluded ids and reasons (local only)
  reports/                   retrieval-check reports
  runs/<run-id>/             answer-run folders (manifest.json, calls.jsonl,
                             transcripts/, summary.json)
```

- `.gitignore` gains `output/rulesguru/` with a comment, in the same commit as
  the import command (the first slice), so the folder is ignored before any
  import can run.
- Every suite command calls one guard first: `git check-ignore -q <SUITE_DIR>`
  must succeed, or the command refuses, naming the `.gitignore` line to add.
- A committed test asserts `git check-ignore` matches
  `output/rulesguru/raw/probe.json` and `git ls-files output/rulesguru` is
  empty.

### Import — `npm run eval:rulesguru:import`

- Requests `GET https://rulesguru.org/api/questions/?json=<settings>` with
  settings: `previousId` (starts at 1; the API rejects 0), `count` (batch
  size), every level, every complexity, legality `all`, no tag filter, and
  `from` naming TheJudge.
- Sequential. The next request starts no sooner than 3 s after the previous
  one finished (server minimum is 2 s). A full import is about 15–20 minutes.
- Adaptive batch size: start at 50; on the API's malformed-batch error, retry
  the same `previousId` at half the size (50, 25, 12, 6, 3, 1). If a
  one-question request still fails, record a skip at that `previousId` and step
  `previousId` forward by one. After five successful batches in a row, double
  the size back toward 50.
- Freeze: each returned question is written to `raw/<id>.json` exactly as
  returned (temporary file, then rename). An id already present is never
  overwritten; a re-import only adds new ids. This matters because the API
  substitutes different cards into a question template on every fetch.
- Resume: `import-state.json` is rewritten after every saved batch. A new run
  starts from the larger of the saved last id and 1.
- Stops cleanly with progress saved on: a network error; a rate-limit answer
  that repeats after one 30-second wait; 10 failed requests in a row; reaching
  the end (an empty batch). Prints counts only.
- `fetch` is a required parameter of the library function; only the command's
  entry point passes Node's global `fetch`. Tests always inject one.

### Purge — `npm run eval:rulesguru:purge -- --yes`

Deletes `SUITE_DIR` recursively and nothing else. Without `--yes` it prints the
file count it would delete. It refuses when the resolved target is not exactly
`SUITE_DIR` (no symlink escape, no parent path).

### Convert — `npm run eval:rulesguru:convert`

Reads `raw/` and committed data only; no network. Deterministic: same inputs,
same case files.

Case shape (format version 2, REQ-185), per question:

| Field | Value |
| --- | --- |
| `id` | `rulesguru-<question id>` |
| `formatVersion` | 2 |
| `tier` | `external` |
| `review` | `{ status: "draft", reviewedOn: null }` |
| `cards` | each included card, resolved by the name lookup below |
| `gameState` | null (asked as a lookup with every card attached) |
| `question` | the question's simple text |
| `expected.answer` | the simple answer |
| `expected.shortAnswer` | first sentence of that answer |
| `expected.outcome` | null (RulesGuru gives no works / does-not-work label) |
| `expected.decidingRuleIds` | the cited rule ids, bare headers expanded |
| `suite` | `name`, `questionId`, `level`, `complexity`, `tags`, `citedRuleIds`, `ruleGroups` (one array of index ids per cited id), `excluded` (null or reason) |
| `source` | `authority: "external-unapproved"`, `publisher`, `license: "used with permission, local only"`, `questionId` |
| `layers` | empty arrays |
| `snapshot` | `computeSnapshot` over committed data (as for any case) |
| `whyHard` | level and complexity, e.g. "external practice question, level 2, simple" |

Full name lookup (`scripts/lib/rulesguru-card-names.mjs`):
- Keys: every oracle id in `apps/backend/data/cardDetailByOracleId.json.br`.
  That file carries no names (measured), so names come from
  `apps/frontend/public/data/cardMetadata.json` (`cardId`, `name`) and, for the
  ids it omits, `apps/frontend/public/data/cardScanMap.json` (`oracleId`,
  `name`, first printing per id).
- Matching: exact; then case-insensitive; then accent-folded (NFD, marks
  stripped); a double-faced `A // B` also answers to `A`.
- Ambiguity: prefer a non-token card (type line without `Token`) over a token;
  if two non-token cards still match, the name is unresolved.
- Measured coverage: 34,973 of 37,854 oracle ids named (34,568 from
  `cardMetadata.json`, which has 34,639 rows, and the rest from
  `cardScanMap.json`); 341 of the 348 non-token creatures with no rules text;
  the unnamed rest are almost all art cards and tokens; 19 names ambiguous
  among non-token cards. How counted: the script
  `PRD/work/rulesguru-local-suite/evidence/name-lookup-counts.mjs` joins the
  three files by oracle id (keys from the card detail file, a name from
  `cardMetadata.json` else the first `cardScanMap.json` printing), then counts
  named ids, non-token creature ids with empty `oracleText`, and names shared
  by two or more non-token ids. Its saved output is
  `PRD/work/rulesguru-local-suite/evidence/name-lookup-counts.out.txt`; rerun
  it with `node PRD/work/rulesguru-local-suite/evidence/name-lookup-counts.mjs`
  from the repo root. It reads committed data only.

Bare keyword headers (`scripts/lib/rulesguru-rules.mjs`):
- A cited id present in `gameRulesRuleIndex.json` maps to itself.
- A cited id absent from the index whose subrules are present (`702.16` →
  `702.16a`, `702.16b`, …; prefix match on `<id>` followed by a letter) maps to
  all of them. The index holds only 4 bare 701/702 headers, so most mechanics
  need this.
- Any other absent id leaves the case excluded (`unknown-rule`).
- Each cited id becomes one rule group; a group "reached the prompt" when any
  id in it did.

Exclusion (case kept, `suite.excluded` set, never selected): `unresolved-card`,
`ambiguous-card`, `no-cited-rule`, `unknown-rule`, `duplicate-question`
(same normalized question text as a lower id). The `Unsupported answers` tag is
not an exclusion; selection drops it by default (`--include-unsupported`
overrides).

### One loader, two modes — `scripts/lib/gold-cases.mjs`

- `loadGoldCases(casesDir, { external = false } = {})`.
- Default mode: unchanged for every corpus case, plus one refusal: a case with
  `tier: "external"` fails with a message saying suite cases belong only in the
  suite folder. A stray copy in `apps/backend/src/eval/worked-solutions/`
  therefore fails the offline gate (REQ-222) in `quality:check`.
- External mode: accepts only `tier: "external"`; `source.authority` must be
  `external-unapproved`; `review.status` must be `draft`; `expected.outcome`
  may be null; requires the `suite` block; runs the duplicate check over
  non-excluded cases only. Tags and difficulty are derived as for any case.
- `gold-cases.d.mts` gains the option.

### Retrieval check — `npm run eval:worked-solutions -- --suite rulesguru [filters]`

- Loads suite cases in external mode, applies the filters, drops excluded and
  stale cases (counted), and runs the existing loop unchanged:
  `buildCaseRequest`, `embedGoldCaseQueries` (local embedder, in process),
  `preparePromptInput`, `describeRetrieval`.
- Scores by rule group: any-group-reached and all-groups-reached.
- Report: totals, then split by level, by complexity, and by CR section
  (three-digit prefix of each cited id), then misses by case id. Title names it
  a local practice-suite report, not committed.
- Writes to `reports/retrieval-<UTC timestamp>.txt` and stdout; `--output` must
  resolve inside `SUITE_DIR`.

### Answer-quality run — `npm run eval:answer-quality -- --suite rulesguru --run-id <id> [filters] [--sample n --seed s]`

- A third mode beside routine and experiment. It reuses `executeExperiment`
  (`scripts/lib/experiment-run.mjs`) with: cases from the suite in external
  mode; a manifest built from the filters (ids plus question and answer
  hashes, `manifestEntryFor`) and written to the run folder; `runsRoot` =
  `SUITE_DIR/runs`; case-file hashing from the suite's `cases/` (today
  `fileHashes` joins `CASES_DIR`, so it takes the folder as a parameter); arm A
  only.
- Suite validation replaces the approved check: present, not excluded, not
  stale, hashes match the manifest.
- Gates unchanged: dry run by default with count and estimate;
  `--confirm-live-calls` requires `--max-cost-usd`; sequential; `--resume`,
  `--retry-errors`, `--repeat` work as in experiment mode; the dirty-checkout
  refusal still applies (the suite folder is ignored, so it never counts as
  dirty).
- Refused with `--suite`: `--manifest`, `--changed`, `--all`, `--tier`,
  `--tag`, `--regrade-from`, `--arm` other than A, `--output-dir` outside
  `SUITE_DIR`.
- Judge, judge inputs, rubric and rubric revision are unchanged, so no rubric
  bump. The summary adds per-level and per-complexity counts of Correctness 2,
  labelled "agrees with RulesGuru". Strata gain `level` and `complexity` so the
  existing compare report (which reads any two folder paths) can split two
  suite runs.
- Cost: the dry run's estimate is the number to read. The owner's per-run cap
  stays at or under $15, so a full ~1,500-case run is expected to need filters
  or `--sample`.

### Filters (shared, `scripts/lib/rulesguru-suite.mjs`)

`--level <0|1|2|3|corner>`, `--complexity <simple|intermediate|complicated>`,
`--suite-tag <tag>`: each repeatable; values within one flag are or-ed, flags
are and-ed. `--include-unsupported`. The answer run adds `--sample`/`--seed`
(seeded, recorded). No filter selects every non-excluded case.

### Never a gate

- `scripts/answer-quality-no-gate.test.mjs`: `NEVER_IN_A_GATE` gains
  `eval:rulesguru`, `rulesguru-import`, `rulesguru-convert`,
  `rulesguru-purge`, and `--suite`; the expected-scripts map gains the three
  new commands.
- No test reads `SUITE_DIR`: every suite test passes a temporary folder. A
  guard test asserts no `*.test.mjs` under `scripts/` names the
  `output/rulesguru` path except the folder-guard test itself, and none passes
  the global `fetch` to the importer.

## Build scope

New files (names are the planner's to finalize):
- `scripts/lib/rulesguru-suite.mjs` — `SUITE_DIR`, the ignore guard, filters,
  selection, path checks.
- `scripts/lib/rulesguru-import.mjs`, `scripts/rulesguru-import.mjs` — import.
- `scripts/rulesguru-purge.mjs` — purge.
- `scripts/lib/rulesguru-card-names.mjs`, `scripts/lib/rulesguru-rules.mjs`,
  `scripts/lib/rulesguru-convert.mjs`, `scripts/rulesguru-convert.mjs` —
  convert.
- Tests beside each.

Changed files:
- `.gitignore` (one line), `package.json` (three scripts).
- `scripts/lib/gold-cases.mjs` and `.d.mts` (external mode).
- `scripts/eval-worked-solutions.mjs` (`--suite`, group scoring, split report).
- `scripts/eval-answer-quality.mjs` (`--suite` mode, flag refusals).
- `scripts/lib/experiment-run.mjs` (case-folder parameter for hashing, suite
  validation hook, `level`/`complexity` strata, summary labels).
- `scripts/answer-quality-no-gate.test.mjs` (guard list).
- `apps/backend/src/eval/worked-solutions/README.md` (a short pointer section).
- `PRD/sections/` per the accepted `GATE-QUESTIONS.md`.

Suggested slices (map-out decides): A folder, ignore line, guards and loader
external mode; B import and purge; C name lookup, header mapping and convert;
D retrieval check suite mode; E answer-run suite mode; F PRD apply and README.
A lands first so the ignore line precedes the import command.

## How each piece is tested on synthetic data

All tests run in `npm run test:scripts`, use temporary folders, and never touch
the network or the real suite folder. Synthetic questions are invented, in the
API's field shape (`id`, `level`, `complexity`, `tags`, `includedCards`,
`questionSimple`, `answerSimple`, `answerSimpleCited`, `citedRules`, `url`).

| Piece | Tests |
| --- | --- |
| Folder guard | refuses when an injected check-ignore says not ignored; the real repo: `git check-ignore` matches a path in `SUITE_DIR`, `git ls-files` lists nothing there |
| Import | injected fetch and clock: first request uses `previousId` 1 and the `from` value; no request starts < 3 s after the last finished; malformed error halves 50→25→12→6→3→1; a failing size-1 request records a skip and advances one id; size grows back after five successes; a frozen file is never overwritten; resume starts after the saved id; network error and 10 consecutive failures stop with state saved; rate-limit waits once then stops |
| Purge | without `--yes` deletes nothing and reports the count; with it deletes only the temp suite folder; refuses a path outside it |
| Name lookup | injected detail/metadata/scan sources: exact, case-insensitive, accent-folded, front-face matches; token loses to non-token; two non-token matches → unresolved; an id absent from card detail is ignored |
| Header mapping | injected rule index: present id maps to itself; bare header maps to its lettered subrules only (not `702.160`); unknown id → excluded |
| Convert | synthetic raw files → case files that pass the external-mode loader; each exclusion reason; determinism (two runs, identical bytes); snapshot computed from injected sources |
| Loader | default mode refuses `tier: "external"`; external mode refuses `approved`, a corpus tier, a missing `suite` block; accepts null outcome; duplicates ignored among excluded cases |
| Retrieval check | pure functions on synthetic cases: filters, group scoring (any/all), level/complexity/section splits, refusal of an `--output` outside the suite folder |
| Answer run | injected fake client: `--suite` dry run makes no call; live run writes only under the temp `runs/<id>/`; `results.json` and `coverage.json` untouched; each refused flag; manifest built from filters; summary labels and per-level counts; resume reuses the checkpoint |
| No gate | guard list includes the new commands; no gate script or workflow names them |

## Proposed product truth

Recorded in `GATE-QUESTIONS.md`, applied at build together with the code:
- `REQ-232` (new; highest id in use is `REQ-231`, and no open package or branch
  reserves 232): the whole suite, plus consequential `system-map.md` edits.
- `REQ-185`, `REQ-186`, `REQ-188`, `REQ-226`, `NFR-018`: scoped amendments so
  no existing rule contradicts `REQ-232`.
- `goals-and-non-goals.md`: the automated-answer-gating non-goal covers the
  suite.
- `REQ-187` is not amended: its headline counts approved cases only, which a
  suite case never is, and `REQ-186`'s amended criterion scopes the external
  reference. The parked recipe package also amends `REQ-187`, so leaving it
  alone avoids a third-party collision.

## Overlap with resolution-recipe-eval (docs PR #283)

That package's `REQ-185` block rewrites two existing lines: the `Description`
(adding a define-gate approval path for cases approved one by one in a gate
slot) and the constraint beginning "no case is approved by an agent". Its
`REQ-224` block adds the same exception. This package's `REQ-185` diff rewrites
neither line; it only inserts a new criterion after the community-sources
criterion, a new constraint after the "corpus commits only WotC text"
constraint, and a dependency line.

How the build applies it, by intent, if the recipe change has landed first:
1. Insert the three `REQ-185` lines at the same anchors (the anchors are lines
   the recipe package does not change). If an anchor moved, place the criterion
   among the acceptance criteria after the community-sources criterion, the
   constraint after the "commits only WotC text" constraint, and the dependency
   at the end of `Dependencies`.
2. Keep the recipe's wording of the two lines it changed. This package's text
   says a suite case is "never approved by any path", which already covers the
   recipe's new define-gate path: a suite case cannot be approved by a review
   batch, by a gate slot, or by the first-ship exception.
3. If B1 is accepted, its promotion line says a promoted case enters "as a
   `draft` through the owner review flow (REQ-224)". If the recipe's gate-slot
   path exists by then, the line stays as written: promotion is by review
   batch only, because a gate slot belongs to a package's build, not to a suite
   finding.
4. The recipe package touches no line this package amends in `REQ-186`,
   `REQ-188`, `REQ-226`, `NFR-018` or `goals-and-non-goals.md`. Its harness flags
   in `scripts/eval-answer-quality.mjs` (arm R) live in experiment mode; a suite
   run refuses every arm but A, so arm R needs no suite handling.

If this package builds first, the recipe build sees the three inserted
`REQ-185` lines as unchanged context and nothing contradicts.

## Assumptions (conservative ladder) and evidence

1. **One loader, an external mode, not a second loader.** REQ-185 requires
   every reader to use the one shared loader; extending it keeps that true.
   Evidence: `scripts/lib/gold-cases.mjs` header and `loadGoldCases`.
2. **`tier: "external"` as the marker.** The loader already refuses any tier
   other than 1–3, so an external case in the corpus folder fails today; the
   new refusal only makes the message say why. Evidence: `validateGoldCase`
   tier check.
3. **The suite answer run reuses experiment machinery, not the routine path.**
   The routine path merges into `results.json`; the experiment path never
   touches it and already has checkpoint, resume and the cap. Smallest change
   that honours settled decision 3. Evidence: `run()` and
   `runExperimentCommand` in `scripts/eval-answer-quality.mjs`;
   `executeExperiment` in `scripts/lib/experiment-run.mjs`.
4. **Judge and rubric unchanged; only the report label differs.** Changing the
   judge's instructions would bump the rubric revision and split comparability
   for the corpus. Evidence: REQ-186, REQ-187, `rubric.ts`.
5. **Name lookup = card detail ids named from `cardMetadata.json` plus
   `cardScanMap.json`.** Measured on this branch (numbers above) by
   `evidence/name-lookup-counts.mjs`, output saved beside it in
   `evidence/name-lookup-counts.out.txt`. The intake's
   suggestion that `cardDetailByOracleId.json.br` carries the missing cards is
   right about the ids but it carries no names.
6. **Header mapping by rule groups.** Keeps "every cited rule reached" honest
   when a header expands to many subrules. Evidence: rule index holds 4 bare
   701/702 headers of the 258 mechanics; `702.16` absent, `702.16a` present.
7. **Import tuning** (3 s spacing, 50 → 1 halving, five-success regrowth, 10
   consecutive failures, one 30 s rate-limit wait) follows the intake's
   measured behaviour, rounded conservative. Owner-tunable later by amendment.
8. **`Unsupported answers` is a default selection filter, not an exclusion**,
   so the owner can still look at those questions with one flag.
9. **`expected.outcome` null for suite cases.** RulesGuru gives no outcome
   label; inventing one would be an agent-written judgement. `outcome` is a
   review aid the judge never sees (REQ-185).
10. **Questions longer than the Quick Lookup typing limit are asked as-is.**
    The eval path builds a lookup request without the route's schema, as it
    does for corpus cases; the probe measured a 476-character maximum.
11. **No agent runs the import or a paid run.** The import touches an outside
    site and a paid run spends money; both are owner-launched, as for every
    live run today.

## Intake corrections and verification (re-checked on this branch, 2026-10-10)

- `cardDetailByOracleId.json.br` has 37,854 entries with fields `oracleText,
  typeLine, manaCost, manaValue, colors, supertypes, subtypes, keywords` and no
  name. The full lookup therefore joins two committed name sources (above).
  Counted by `evidence/name-lookup-counts.mjs` (output in
  `evidence/name-lookup-counts.out.txt`).
- `loadGoldCases(casesDir)` and `loadCases(casesDir)` take a folder, as the
  intake said; but the answer run's experiment path hashes case files from the
  fixed `CASES_DIR`, so it needs a folder parameter.
- `.gitignore` ignores `output/` subfolders one by one; `output/` itself is not
  ignored, so the suite needs its own line.
- The corpus folder holds 400 case files (also printed by
  `evidence/name-lookup-counts.mjs`).
- `PRD/work/probe-rulesguru/` and `PRD/work/probe-rules-test-harness/` are not
  on this branch (they are the owner's untracked probe folders). The intake's
  note that row 4f of the external-sources findings is out of date is left to
  the owner; this package does not edit those folders.

## Risks

- **A suite file gets committed by accident.** Mitigated by the ignore line
  before the import exists, the refuse-unless-ignored guard in every command,
  the `git ls-files` test, and the loader refusing a suite case in the corpus
  folder. A forced `git add -f` is still possible; nothing in the repo can stop
  that.
- **RulesGuru's API changes shape.** The importer saves raw responses, so a
  shape change breaks convert, not the frozen data; convert fails loudly on a
  missing field.
- **Name lookup misses.** Unresolved cards exclude the case and are counted, so
  a miss is visible, never a silent wrong card.

## Amendment set

One line-level grep, run on this branch:

```
grep -rnE 'REQ-185|REQ-186|REQ-188|REQ-226|NFR-018|rules test corpus|outside-source|outside text' PRD/sections apps scripts docs --exclude-dir=node_modules
```

251 hits: 12 amended in `PRD/sections/` through `GATE-QUESTIONS.md`, 9 amended
at build in code comments, tests or docs, and 230 with no change. Excerpts are
the first 60 characters of the hit line.

| # | Hit | Excerpt | Disposition |
| --- | --- | --- | --- |
| 1 | `PRD/sections/system-map.md:473` | - Summary: Context-evaluation harness with fixtures, golden | Amend (REQ-232 block, system-map diff): the eval-harness summary names the local practice suite |
| 2 | `PRD/sections/system-map.md:475` | - Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NF | Amend (REQ-232 block, system-map diff): add REQ-232 to Backed by |
| 3 | `PRD/sections/system-map.md:501` | - Summary: On-demand, confirmation-gated run that asks the s | Amend (REQ-232 block, system-map diff): the answer-quality summary gains the suite run sentence |
| 4 | `PRD/sections/system-map.md:503` | - Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, RE | Amend (REQ-232 block, system-map diff): add REQ-232 to Backed by |
| 5 | `PRD/sections/system-map.md:508` | - Summary: Offline checks over the rules test corpus that ru | No change: the corpus gates read only the committed folder; the suite is never in quality:check (REQ-232) |
| 6 | `PRD/sections/system-map.md:510` | - Backed by: REQ-185, REQ-222, REQ-223, REQ-224, REQ-225, NF | No change: the corpus gates read only the committed folder; the suite is never in quality:check (REQ-232) |
| 7 | `PRD/sections/goals-and-non-goals.md:83` | - automated answer-quality gating in npm run quality:check | Amend (goals-and-non-goals block): the line covers the suite too |
| 8 | `PRD/sections/functional-requirements.md:3562` | - do not grow this into a general-purpose LLM evaluation fra | No change: REQ-146 combo comparison; its statement about the committed corpus stays true |
| 9 | `PRD/sections/functional-requirements.md:3568` | - REQ-188 (the answer-quality baseline whose non-gating, con | No change: REQ-146 combo comparison; its statement about the committed corpus stays true |
| 10 | `PRD/sections/functional-requirements.md:3570` | - the existing prompt:preview tooling extracts assembled p | No change: REQ-146 combo comparison; its statement about the committed corpus stays true |
| 11 | `PRD/sections/functional-requirements.md:4399` | ### REQ-185 | Amend (REQ-185 block): new criterion, constraint and dependency; no existing line rewritten |
| 12 | `PRD/sections/functional-requirements.md:4402` | - Description: The answer-quality baseline (NFR-018) and the | No change here: the parked recipe package (PR #283) rewrites this line; this package adds a separate criterion instead |
| 13 | `PRD/sections/functional-requirements.md:4404` | - the corpus contains the 18 first-ship cases — the six orig | No change: first-ship cases, test layers and the NFR-018 dependency are unaffected |
| 14 | `PRD/sections/functional-requirements.md:4410` | - shortAnswer and outcome are review and reporting aids; | No change: suite cases carry these locally; outcome may be null only in the loader's external mode (REQ-232) |
| 15 | `PRD/sections/functional-requirements.md:4413` | - **six test layers, three on in run 1**: the format carries | No change: first-ship cases, test layers and the NFR-018 dependency are unaffected |
| 16 | `PRD/sections/functional-requirements.md:4415` | - the corpus grows through tiers 1 and 2 first, under the sa | No change: still true (no outside text is committed); blocker B1, if accepted, adds one line after it |
| 17 | `PRD/sections/functional-requirements.md:4419` | - the gold cases remain committed evaluation data; they neve | No change: holds; REQ-232 adds the same never-in-a-prompt rule for the suite |
| 18 | `PRD/sections/functional-requirements.md:4423` | - the corpus commits only WotC text the project already ship | No change: still true; the new REQ-185 constraint follows it |
| 19 | `PRD/sections/functional-requirements.md:4426` | - NFR-018 (the worked-solutions validation track this extend | No change: first-ship cases, test layers and the NFR-018 dependency are unaffected |
| 20 | `PRD/sections/functional-requirements.md:4427` | - REQ-186 (the judge that grades against these cases) | No change: dependency line |
| 21 | `PRD/sections/functional-requirements.md:4444` | ### REQ-186 | Amend (REQ-186 block): description and the approved-only criterion scope the suite exception; dependency added |
| 22 | `PRD/sections/functional-requirements.md:4455` | - layer 2b, the blind ranking (judgeBlindRanking): when th | No change: REQ-186 judging rules apply to suite runs unchanged |
| 23 | `PRD/sections/functional-requirements.md:4461` | - never auto-gate or fail a build on a judge score (REQ-188) | No change: REQ-186 judging rules apply to suite runs unchanged |
| 24 | `PRD/sections/functional-requirements.md:4463` | - the judge never sees which excerpt-cap leg or which answer | No change: REQ-186 judging rules apply to suite runs unchanged |
| 25 | `PRD/sections/functional-requirements.md:4466` | - REQ-185 (the rules test corpus and its reference answers) | No change: REQ-186 judging rules apply to suite runs unchanged |
| 26 | `PRD/sections/functional-requirements.md:4469` | - REQ-188 (the command that runs it and its cost posture) | No change: REQ-186 judging rules apply to suite runs unchanged |
| 27 | `PRD/sections/functional-requirements.md:4474` | - grounding the judge in an approved reference answer is wha | No change: suite answers are never a corpus reference; the REQ-186 amendment scopes the suite exception |
| 28 | `PRD/sections/functional-requirements.md:4482` | - Description: An answer-quality run scores each answer on f | No change by this package: REQ-186 (amended) and REQ-232 scope the external reference; REQ-187 is also amended by the parked recipe package (G5), so its text is left alone |
| 29 | `PRD/sections/functional-requirements.md:4488` | - the headline figure is the count of approved, non-stale ca | No change: the headline counts approved cases only; suite cases are never approved |
| 30 | `PRD/sections/functional-requirements.md:4489` | - the deterministic assertion namesGoldRuleId (REQ-186 lay | No change: REQ-187 axis internals; suite runs use the same rubric |
| 31 | `PRD/sections/functional-requirements.md:4490` | - no axis for WotC card-ruling citation is defined: tier-2 a | No change: axes and their rules are unchanged; suite runs use the same rubric revision |
| 32 | `PRD/sections/functional-requirements.md:4491` | - the four axis names, their 0/1/2 definitions, and the rubr | No change: REQ-187 axis internals; suite runs use the same rubric |
| 33 | `PRD/sections/functional-requirements.md:4494` | - no numeric pass threshold is set on any axis (REQ-188); th | No change: axes and their rules are unchanged; suite runs use the same rubric revision |
| 34 | `PRD/sections/functional-requirements.md:4497` | - REQ-186 (the judge that applies these axes) | No change: REQ-187 axis internals; suite runs use the same rubric |
| 35 | `PRD/sections/functional-requirements.md:4498` | - REQ-185 (the reference answers they are scored against) | No change: axes and their rules are unchanged; suite runs use the same rubric revision |
| 36 | `PRD/sections/functional-requirements.md:4504` | - it moves again, to a revision dated the day the build chan | No change: REQ-187 axis internals; suite runs use the same rubric |
| 37 | `PRD/sections/functional-requirements.md:4505` | ### REQ-188 | Amend (REQ-188 block): case-selection criterion gains the suite run; dependency added |
| 38 | `PRD/sections/functional-requirements.md:4512` | - the answer models are a lineup, given as a repeatable --m | No change: a suite run takes the same lineup options |
| 39 | `PRD/sections/functional-requirements.md:4513` | - **case selection**: the run grades only approved, non-st | Amend (REQ-188 block): this is the case-selection criterion the block rewrites |
| 40 | `PRD/sections/functional-requirements.md:4514` | - the prompt is the one a player's lookup would get: prepar | No change: suite runs build the prompt through the same path |
| 41 | `PRD/sections/functional-requirements.md:4535` | - REQ-186 (the judging it invokes) | No change: dependency line |
| 42 | `PRD/sections/functional-requirements.md:4538` | - NFR-018 (the non-gating validation track this belongs to) | No change: dependency and measurement note |
| 43 | `PRD/sections/functional-requirements.md:4539` | - REQ-226 (experiment mode) | No change: dependency line |
| 44 | `PRD/sections/functional-requirements.md:4543` | - measured 2026-09-07, offline, over the actual 18-case gold | No change: dependency and measurement note |
| 45 | `PRD/sections/functional-requirements.md:4554` | - it carries: run-level metadata for the latest run (selecti | No change: a suite run never writes the committed scores file |
| 46 | `PRD/sections/functional-requirements.md:4559` | - a recorded run **merges** into the committed results file | No change: a suite run never reads or writes results.json (REQ-232) |
| 47 | `PRD/sections/functional-requirements.md:4560` | - an experiment run (REQ-226) never reads or writes this fil | No change: a suite run never writes the committed scores file |
| 48 | `PRD/sections/functional-requirements.md:4566` | - only the dated human-reviewed conclusion becomes durable p | No change: a suite run never writes the committed scores file |
| 49 | `PRD/sections/functional-requirements.md:4569` | - REQ-188 (the run metadata it records) | No change: a suite run never reads or writes results.json (REQ-232) |
| 50 | `PRD/sections/functional-requirements.md:4573` | - REQ-226 (the experiment runs that write elsewhere) | No change: a suite run never writes the committed scores file |
| 51 | `PRD/sections/functional-requirements.md:4583` | - Description: An answer-quality run may answer the same gol | No change: excerpt caps work the same in a suite run |
| 52 | `PRD/sections/functional-requirements.md:4594` | - the judge is not told which cap or which model produced an | No change: REQ-190 cap legs; unchanged in a suite run |
| 53 | `PRD/sections/functional-requirements.md:4598` | - REQ-188 (the run that executes the legs) | No change: excerpt caps work the same in a suite run |
| 54 | `PRD/sections/functional-requirements.md:4602` | - the design brief's earlier measurement (2026-09-06, six co | No change: excerpt caps work the same in a suite run |
| 55 | `PRD/sections/functional-requirements.md:4603` | - measured 2026-09-07 (run 3 of the answer-quality baseline, | No change: excerpt caps work the same in a suite run |
| 56 | `PRD/sections/functional-requirements.md:5811` | - for the approved rules test case academy-manufactor-esix- | No change: REQ-220 tester case is a committed corpus case |
| 57 | `PRD/sections/functional-requirements.md:5823` | - REQ-185 (the approved tester case this fix is measured on) | No change: REQ-220 tester case is a committed corpus case |
| 58 | `PRD/sections/functional-requirements.md:5832` | - Title: Offline prompt gate over the rules test corpus | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 59 | `PRD/sections/functional-requirements.md:5834` | - Description: Every pull request checks, with no provider c | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 60 | `PRD/sections/functional-requirements.md:5840` | - **state-fact check (layer 3)**: for every case with a non- | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 61 | `PRD/sections/functional-requirements.md:5845` | - eval data never enters a live prompt (NFR-018); the frozen | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 62 | `PRD/sections/functional-requirements.md:5849` | - REQ-185 (the corpus it reads) | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 63 | `PRD/sections/functional-requirements.md:5854` | - NFR-018 (the track whose prompt half this makes gating) | No change: the offline gate reads only the committed folder; the loader refuses an external case found there, so a stray copy fails loudly (REQ-232) |
| 64 | `PRD/sections/functional-requirements.md:5860` | - Title: Mechanic coverage gate and coverage report for the | No change: coverage counts only the committed corpus; the suite is never counted (REQ-232) |
| 65 | `PRD/sections/functional-requirements.md:5862` | - Description: Every real mechanic in the committed rule ind | No change: coverage counts only the committed corpus; the suite is never counted (REQ-232) |
| 66 | `PRD/sections/functional-requirements.md:5866` | - a case covers a mechanic when one of its decidingRuleIds | No change: coverage counts only the committed corpus; the suite is never counted (REQ-232) |
| 67 | `PRD/sections/functional-requirements.md:5874` | - REQ-185 (the corpus and its derived tags) | No change: coverage counts only the committed corpus; the suite is never counted (REQ-232) |
| 68 | `PRD/sections/functional-requirements.md:5884` | - Description: Every rules test case (REQ-185) other than th | No change: the review flow never sees suite cases |
| 69 | `PRD/sections/functional-requirements.md:5891` | - no agent sets approved; only the apply command, run on a | No change: also amended by the recipe package; no path can approve a suite case (REQ-232) |
| 70 | `PRD/sections/functional-requirements.md:5897` | - REQ-185 (the case format and review field) | No change: the review flow never sees suite cases |
| 71 | `PRD/sections/functional-requirements.md:5900` | - REQ-186 (grading only approved cases) | No change: about corpus review; the REQ-186 amendment scopes the suite |
| 72 | `PRD/sections/functional-requirements.md:5905` | - Description: Each rules test case (REQ-185) records conten | No change: the staleness report reads the committed corpus; a suite run applies the same snapshot comparison to its own cases |
| 73 | `PRD/sections/functional-requirements.md:5909` | - a stale approved case is not selected by the answer-qual | No change: the staleness report reads the committed corpus; a suite run applies the same snapshot comparison to its own cases |
| 74 | `PRD/sections/functional-requirements.md:5916` | - REQ-185 (the snapshot field) | No change: the staleness report reads the committed corpus; a suite run applies the same snapshot comparison to its own cases |
| 75 | `PRD/sections/functional-requirements.md:5918` | - REQ-188 (the run that skips stale cases) | No change: the staleness report reads the committed corpus; a suite run applies the same snapshot comparison to its own cases |
| 76 | `PRD/sections/functional-requirements.md:5924` | ### REQ-226 | Amend (REQ-226 block): first criterion names the suite run as a separate mode; dependency added |
| 77 | `PRD/sections/functional-requirements.md:5927` | - Description: Beside the routine answer-quality run (REQ-18 | No change to this line; REQ-226's first criterion is amended (REQ-226 block) |
| 78 | `PRD/sections/functional-requirements.md:5935` | - the identity record holds: run id; the commit executed fro | No change: a suite run's identity record hashes its own case files (REQ-232) |
| 79 | `PRD/sections/functional-requirements.md:5939` | - REQ-188's confirmation gate, credential loading, sequentia | No change: REQ-188 and REQ-227 gates apply to suite runs unchanged |
| 80 | `PRD/sections/functional-requirements.md:5943` | - REQ-188 (the routine run and its gates) | No change: REQ-188 and REQ-227 gates apply to suite runs unchanged |
| 81 | `PRD/sections/functional-requirements.md:5956` | - Description: An experiment run (REQ-226) saves each comple | No change: a suite run reuses checkpoint, resume and the spending cap unchanged |
| 82 | `PRD/sections/functional-requirements.md:5958` | - each completed record — answer, deterministic assertions, | No change: a suite run reuses checkpoint, resume and the spending cap unchanged |
| 83 | `PRD/sections/functional-requirements.md:5959` | - a provider error or timeout on an answer is appended as an | No change: a suite run reuses checkpoint, resume and the spending cap unchanged |
| 84 | `PRD/sections/functional-requirements.md:5960` | - --resume <run-id> reloads the run folder, refuses when a | No change: a suite run reuses checkpoint, resume and the spending cap unchanged |
| 85 | `PRD/sections/functional-requirements.md:5966` | - calls stay sequential (REQ-188); the cap is a stop, never | No change: REQ-188 and REQ-227 gates apply to suite runs unchanged |
| 86 | `PRD/sections/functional-requirements.md:5969` | - REQ-226 (the run folder and identity record) | No change: a suite run reuses checkpoint, resume and the spending cap unchanged |
| 87 | `PRD/sections/functional-requirements.md:5970` | - REQ-188 (the confirmation gate and cost estimate method) | No change: REQ-188 and REQ-227 gates apply to suite runs unchanged |
| 88 | `PRD/sections/functional-requirements.md:5977` | - Description: A report command compares two experiment runs | No change: the compare report reads any two run-folder paths |
| 89 | `PRD/sections/functional-requirements.md:5990` | - never states an overall winner, never sets or checks a thr | No change: the compare report reads any two run-folder paths, suite runs included |
| 90 | `PRD/sections/functional-requirements.md:5993` | - REQ-226 (the run folders it reads) | No change: the compare report reads any two run-folder paths |
| 91 | `PRD/sections/functional-requirements.md:6001` | - Title: Offline evidence trace for the rules test corpus | No change: the evidence trace reads the committed corpus only; the suite is out of its scope |
| 92 | `PRD/sections/functional-requirements.md:6003` | - Description: An offline report follows each rules test cas | No change: the evidence trace reads the committed corpus only; the suite is out of its scope |
| 93 | `PRD/sections/functional-requirements.md:6006` | - the trace measures the checkout it runs from, as an experi | No change: evidence trace reads the committed corpus only |
| 94 | `PRD/sections/functional-requirements.md:6020` | - REQ-185 (the corpus and its deciding rule ids) | No change: the evidence trace reads the committed corpus only; the suite is out of its scope |
| 95 | `PRD/sections/functional-requirements.md:6031` | - Description: An experiment run (REQ-226) can answer a case | No change: arms other than A are refused in a suite run |
| 96 | `PRD/sections/functional-requirements.md:6046` | - REQ-226 (the experiment run that carries an arm) | No change: arms other than A are refused in a suite run |
| 97 | `PRD/sections/functional-requirements.md:6048` | - REQ-185 (the deciding rule ids and the gold-data separatio | No change: arms other than A are refused in a suite run |
| 98 | `PRD/sections/functional-requirements.md:6060` | - the deployed answer model is gpt-6-luna: scripts/aws-de | No change: REQ-231 deployed model; unaffected |
| 99 | `PRD/sections/functional-requirements.md:6074` | - REQ-188 (no reasoning-effort value is sent) | No change: REQ-231 deployed model; unaffected |
| 100 | `PRD/sections/non-functional-requirements.md:302` | ### NFR-018 | Amend (NFR-018 block) |
| 101 | `PRD/sections/non-functional-requirements.md:304` | - Description: Today prompt and retrieval quality is regress | Amend (NFR-018 block): description gains one sentence |
| 102 | `PRD/sections/non-functional-requirements.md:308` | - The prompt half is a build-blocking gate: the offline prom | No change to this line; the new NFR-018 constraint after it puts the suite outside both halves' gating |
| 103 | `PRD/sections/non-functional-requirements.md:309` | - The prompt half stays offline and makes no provider call a | No change: offline/online split unchanged |
| 104 | `PRD/sections/non-functional-requirements.md:310` | - A case enters the corpus only with an approved correct ans | No change: suite cases never enter the corpus; the new constraint says so |
| 105 | `PRD/sections/non-functional-requirements.md:314` | - REQ-185 (the rules test corpus this track's cases now serv | No change: dependency lines and measurement note (REQ-232 is added as its own dependency line) |
| 106 | `PRD/sections/non-functional-requirements.md:315` | - REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 (the answer-qu | No change: dependency lines and measurement note (REQ-232 is added as its own dependency line) |
| 107 | `PRD/sections/non-functional-requirements.md:317` | - REQ-226, REQ-227, REQ-228, REQ-229, REQ-230 (experiment ru | No change: dependency line |
| 108 | `PRD/sections/non-functional-requirements.md:321` | - Measured 2026-09-07 (build): the gold set grew from 6 to 1 | No change: dependency lines and measurement note (REQ-232 is added as its own dependency line) |
| 109 | `apps/backend/src/prompt/preparation.test.ts:14` | * The six worked-solution gold cases (REQ-185), mirrored fro | No change: prompt code and its tests are untouched |
| 110 | `apps/backend/src/eval/caseRequest.test.ts:2` | // The rules test corpus has one loader and one request buil | No change: the one request builder serves suite cases too |
| 111 | `apps/backend/src/eval/caseRequest.test.ts:68` | describe(Backend - Eval - rules test case request (REQ-185), | No change: the one request builder serves suite cases too |
| 112 | `apps/backend/src/prompt/preparation.ts:48` | * exactly this value; the answer-quality run (REQ-188) is th | No change: prompt code and its tests are untouched |
| 113 | `apps/backend/src/eval/worked-solutions/restoration-angel-blink-resets-counters.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 114 | `apps/backend/src/eval/worked-solutions/panharmonicon-controller-not-entering-permanent.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 115 | `apps/backend/src/eval/worked-solutions/copy-effect-modification-becomes-copiable.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 116 | `apps/backend/src/eval/worked-solutions/necropotence-silence-borne-upon-a-wind-cleanup.case.json:35` | license: A derivation from Comprehensive Rules text this pro | No change: corpus licence note; still true, nothing external is committed |
| 117 | `apps/backend/src/eval/worked-solutions/layers-timestamp-order.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 118 | `apps/backend/src/eval/worked-solutions/copy-does-not-copy-etb-choices.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 119 | `apps/backend/src/eval/worked-solutions/mana-ability-remains-mana-ability.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 120 | `apps/backend/src/eval/worked-solutions/token-created-by-name-uses-oracle-card.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 121 | `apps/backend/src/eval/worked-solutions/combat-damage-assignment-order-multiple-blockers.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 122 | `apps/backend/src/eval/worked-solutions/state-based-actions-mid-resolution.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 123 | `apps/backend/src/eval/worked-solutions/sensei-top-leaves-battlefield-ability-on-stack.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 124 | `apps/backend/src/eval/worked-solutions/replacement-effect-single-application.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 125 | `apps/backend/src/eval/worked-solutions/damage-does-not-destroy-sba-does.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 126 | `apps/backend/src/eval/worked-solutions/illegal-target-partial-resolution.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 127 | `apps/backend/src/eval/worked-solutions/trample-over-planeswalkers-assignment.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 128 | `apps/backend/src/eval/worked-solutions/regenerate-too-late-after-destroy-resolves.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 129 | `apps/backend/src/eval/rules-gate/stalenessReport.test.ts:3` | // whole corpus shares, by static import of the real .mjs mo | No change: backend tests of the committed corpus |
| 130 | `apps/backend/src/eval/answer-quality/assertions.test.ts:10` | describe(Backend - Eval - Answer quality - assertions (REQ-1 | No change: judge, assertions and rubric are unchanged |
| 131 | `apps/backend/src/eval/rules-gate/rulesGate.test.ts:7` | // (their sibling .d.mts declarations carry the types; REQ-1 | No change: backend tests of the committed corpus |
| 132 | `apps/backend/src/eval/answer-quality/rubric.test.ts:20` | it(moved to a new revision when the judge's inputs changed ( | No change: judge, assertions and rubric are unchanged |
| 133 | `apps/backend/src/eval/answer-quality/judge.test.ts:28` | describe(Backend - Eval - Answer quality - judge (REQ-186), | No change: judge, assertions and rubric are unchanged |
| 134 | `apps/backend/src/eval/answer-quality/judge.test.ts:293` | describe(judge usage (REQ-188: judge cost is recorded), () = | No change: judge code and tests unchanged |
| 135 | `apps/backend/src/eval/answer-quality/judge.test.ts:327` | describe(judge inputs (REQ-186: the judge is told what the p | No change: judge, assertions and rubric are unchanged |
| 136 | `apps/backend/src/eval/answer-quality/judge.ts:1` | // Answer-quality judge (REQ-186 layers 2 and 2b). | No change: judge, assertions and rubric are unchanged |
| 137 | `apps/backend/src/eval/answer-quality/judge.ts:23` | // (REQ-188) trustworthy. A single answer has nothing to be | No change: judge code and tests unchanged |
| 138 | `apps/backend/src/eval/answer-quality/judge.ts:52` | * The judge call's own token use (REQ-188: judge usage is re | No change: judge code and tests unchanged |
| 139 | `apps/backend/src/eval/answer-quality/judge.ts:80` | * (REQ-186) -- never OPENAI_MODEL, never an answer model - | No change: judge, assertions and rubric are unchanged |
| 140 | `apps/backend/src/eval/answer-quality/judge.ts:89` | /** True when the configured judge model id also appears in | No change: judge, assertions and rubric are unchanged |
| 141 | `apps/backend/src/eval/answer-quality/judge.ts:135` | * judge sees the same thing however the answer was produced | No change: judge, assertions and rubric are unchanged |
| 142 | `apps/backend/src/eval/answer-quality/judge.ts:170` | * One call per answer (REQ-186 layer 2). Returns an explicit | No change: judge, assertions and rubric are unchanged |
| 143 | `apps/backend/src/eval/answer-quality/judge.ts:206` | /** The same attached-excerpt, deciding-rule and game-state | No change: judge, assertions and rubric are unchanged |
| 144 | `apps/backend/src/eval/answer-quality/judge.ts:238` | /** The evidence lines shared by the lone judge and the blin | No change: judge, assertions and rubric are unchanged |
| 145 | `apps/backend/src/eval/answer-quality/judge.ts:303` | * The blind side-by-side rank (REQ-186 layer 2b): for one ca | No change: judge, assertions and rubric are unchanged |
| 146 | `apps/backend/src/eval/worked-solutions/trample-must-assign-lethal-first.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 147 | `apps/backend/src/eval/worked-solutions/last-known-information-simultaneous-sba.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 148 | `apps/backend/src/eval/worked-solutions/README.md:1` | # Rules test corpus (NFR-018, REQ-185) | Amend at build: README gains a short pointer that the local suite exists, is never committed, and lives in REQ-232 |
| 149 | `apps/backend/src/eval/worked-solutions/README.md:6` | harness (REQ-185) brought the corpus to 393 cases: the 18 fi | No change: describes the committed corpus |
| 150 | `apps/backend/src/eval/worked-solutions/README.md:19` | approved by the owner's accept of REQ-185; every later case | No change: describes the committed corpus |
| 151 | `apps/backend/src/eval/worked-solutions/README.md:129` | (REQ-185): loadGoldCases validates every file against form | No change: describes the committed corpus |
| 152 | `apps/backend/src/eval/worked-solutions/README.md:228` | modules, and PRD/sections/functional-requirements.md REQ-1 | No change: the pointer is a new short section (row for README.md:1) |
| 153 | `apps/backend/src/eval/worked-solutions/README.md:230` | ### Experiment runs, the paired report, the evidence trace, | No change: the pointer is a new short section (row for README.md:1) |
| 154 | `apps/backend/src/eval/worked-solutions/README.md:236` | - **Experiment run** (REQ-226, REQ-227): npm run eval:answe | No change: the pointer is a new short section (row for README.md:1) |
| 155 | `apps/backend/src/eval/worked-solutions/README.md:291` | - Loaded and validated by scripts/lib/gold-cases.mjs (REQ- | No change: describes the committed corpus |
| 156 | `apps/backend/src/eval/answer-quality/assertions.ts:1` | // Answer-quality deterministic assertions (REQ-186 layer 1) | No change: judge, assertions and rubric are unchanged |
| 157 | `apps/backend/src/eval/answer-quality/assertions.ts:63` | * The free made-up-rule-number check (REQ-186): cited rule i | No change: judge, assertions and rubric are unchanged |
| 158 | `apps/backend/src/eval/worked-solutions/delayed-trigger-created-too-late.case.json:8` | note: approved by the owner's accept of REQ-185 at the defin | No change: records a first-ship approval; the suite adds no approval path |
| 159 | `apps/backend/src/eval/answer-quality/rubric.ts:12` | // artifact (REQ-186, REQ-189). Axes are added or changed on | No change: judge, assertions and rubric are unchanged |
| 160 | `apps/backend/src/eval/answer-quality/rubric.ts:75` | * (REQ-186, REQ-189). | No change: judge, assertions and rubric are unchanged |
| 161 | `apps/backend/src/eval/answer-quality/rubric.ts:78` | // 2026-10-07.1: the judge's inputs changed (REQ-186) -- it | No change: judge, assertions and rubric are unchanged |
| 162 | `apps/backend/src/eval/answer-quality/rubric.ts:83` | /** Renders the rubric as the exact text sent to the judge ( | No change: judge, assertions and rubric are unchanged |
| 163 | `scripts/rules-coverage.mjs:1` | // The rules test corpus coverage command (REQ-223). No prov | No change: coverage command counts the committed corpus only |
| 164 | `scripts/build-answer-quality-manifests.test.mjs:169` | // evidence trace: a later corpus refresh must never turn th | No change: manifest-generator test |
| 165 | `scripts/eval-worked-solutions.test.mjs:55` | test(loadCases reads every *.case.json file, sorted, and rej | No change: new suite tests are added beside it |
| 166 | `scripts/lib/experiment-run.test.mjs:669` | // Slice C: the record fields and the judge's inputs in an e | No change: comment or test stays true; suite mode is added beside it |
| 167 | `scripts/lib/experiment-run.test.mjs:739` | // Slice G alignment with the finalized proposal (REQ-226, R | No change: comment or test stays true; suite mode is added beside it |
| 168 | `scripts/lib/prompt-fidelity.mjs:2` | // preparePromptInput (REQ-185, REQ-188): the worked-solut | No change: prompt-fidelity helpers are reused unchanged |
| 169 | `scripts/lib/prompt-fidelity.mjs:36` | * The request a rules test case is asked as (REQ-185, A15) - | No change: prompt-fidelity helpers are reused unchanged |
| 170 | `scripts/lib/prompt-fidelity.mjs:116` | * prompt a player gets (REQ-188). The caller learns whether | No change: prompt-fidelity helpers are reused unchanged |
| 171 | `scripts/lib/rules-coverage.mjs:1` | // Mechanic coverage for the rules test corpus (REQ-223): wh | No change: coverage command counts the committed corpus only |
| 172 | `scripts/lib/rules-coverage.mjs:15` | // one of its deciding rule ids sits under that mechanic's n | No change: coverage command counts the committed corpus only |
| 173 | `apps/backend/src/eval/worked-solutions/academy-manufactor-esix-treasure.case.json:31` | license: A derivation from Comprehensive Rules text this pro | No change: corpus licence note; still true, nothing external is committed |
| 174 | `scripts/lib/rules-coverage.test.mjs:199` | // A mechanic with no WotC ruling and no CR Example: line | No change: coverage command counts the committed corpus only |
| 175 | `scripts/lib/gold-cases.d.mts:2` | // (REQ-185). Backend vitest tests import the real module at | Amend at build: declaration gains the loader's external-mode option |
| 176 | `scripts/lib/gold-cases.mjs:1` | // Shared rules-test-case loader and validator, format versi | No change: loader header, first-six list, tags and snapshot code unchanged |
| 177 | `scripts/lib/gold-cases.mjs:3` | // Every reader of the rules test corpus -- the retrieval ch | Amend at build: comment names the loader's external mode |
| 178 | `scripts/lib/gold-cases.mjs:66` | * REQ-185 requires the corpus to hold at least these, each t | No change: loader header, first-six list, tags and snapshot code unchanged |
| 179 | `scripts/lib/gold-cases.mjs:346` | * Tags are derived, never hand-written (REQ-185): mechanic: | No change: loader header, first-six list, tags and snapshot code unchanged |
| 180 | `scripts/lib/gold-cases.mjs:418` | // Snapshot hashing and the one stale comparison (REQ-185, R | No change: loader header, first-six list, tags and snapshot code unchanged |
| 181 | `scripts/lib/prompt-fidelity.test.mjs:16` | test(buildCaseRequest attaches every cards entry by oracle i | No change: prompt-fidelity helpers are reused unchanged |
| 182 | `scripts/lib/prompt-fidelity.test.mjs:61` | // loadPromptResources (REQ-188): the evaluation loader matc | No change: prompt-fidelity helpers are reused unchanged |
| 183 | `apps/backend/src/eval/answer-quality/artifact.ts:24` | /** Tier 3 is the owner's own bucket, counted apart from the | No change: the committed scores artifact never records a suite run |
| 184 | `apps/backend/src/eval/answer-quality/artifact.ts:26` | /** How the latest run chose its cases: changed, all, t | No change: the committed scores artifact never records a suite run |
| 185 | `apps/backend/src/eval/answer-quality/artifact.ts:37` | /** Answer-call token use and cost: the answer models' share | No change: the committed scores artifact never records a suite run |
| 186 | `apps/backend/src/eval/answer-quality/artifact.ts:47` | /** Whether the evaluation prompt loader loaded the Commande | No change: the committed scores artifact never records a suite run |
| 187 | `apps/backend/src/eval/answer-quality/artifact.ts:49` | /** The answer client's timeout and retry count: the SDK def | No change: the committed scores artifact never records a suite run |
| 188 | `scripts/eval-answer-quality.mjs:1` | // Answer-quality run (REQ-188, REQ-190; NFR-018). | Amend at build: header comment names the --suite mode |
| 189 | `scripts/eval-answer-quality.mjs:3` | // Asks the live provider the selected approved cases of the | Amend at build: comment says a --suite run grades the local suite's external cases |
| 190 | `scripts/eval-answer-quality.mjs:4` | // (scripts/lib/gold-cases.mjs, REQ-185) and scores each ans | Amend at build: comment says a --suite run grades the local suite's external cases |
| 191 | `scripts/eval-answer-quality.mjs:106` | /** The deployed model alone (scripts/aws-deploy.sh sets O | No change: REQ-188 citations in comments stay true |
| 192 | `scripts/eval-answer-quality.mjs:120` | /** Published list rates, USD per million tokens (re-checked | No change: REQ-188 citations in comments stay true |
| 193 | `scripts/eval-answer-quality.mjs:129` | // Judge candidates (REQ-186: stronger than every contestant | No change: comment or test stays true; suite mode is added beside it |
| 194 | `scripts/eval-answer-quality.mjs:137` | * pricing (REQ-188, REQ-226). The owner re-checks before spe | No change: REQ-188 citations in comments stay true |
| 195 | `scripts/eval-answer-quality.mjs:162` | // Output-token assumptions behind the printed dry-run estim | No change: REQ-188 citations in comments stay true |
| 196 | `scripts/eval-answer-quality.mjs:175` | * the lineup (REQ-188): the answer-model lineup is a run opt | No change: REQ-188 citations in comments stay true |
| 197 | `scripts/eval-answer-quality.mjs:191` | // Experiment-mode flags (REQ-226): none of them exists in a | No change: comment or test stays true; suite mode is added beside it |
| 198 | `scripts/eval-answer-quality.mjs:277` | * Experiment mode (REQ-226) is on exactly when --run-id is | Amend at build: comment says --run-id with --suite is the suite run, not experiment mode |
| 199 | `scripts/eval-answer-quality.mjs:336` | /** Judge model is its own explicit setting (REQ-186), defau | No change: comment or test stays true; suite mode is added beside it |
| 200 | `scripts/eval-answer-quality.mjs:427` | * No timeout and no retry count, so the SDK defaults apply ( | No change: REQ-188 citations in comments stay true |
| 201 | `scripts/eval-answer-quality.mjs:489` | /** A character-count cost estimate (REQ-188's M3 methodolog | No change: REQ-188 citations in comments stay true |
| 202 | `scripts/eval-answer-quality.mjs:494` | // A single answer has nothing to be ranked against: a one-m | No change: comment or test stays true; suite mode is added beside it |
| 203 | `scripts/eval-answer-quality.mjs:573` | /** The rate table an experiment run records in its identity | No change: comment or test stays true; suite mode is added beside it |
| 204 | `scripts/eval-answer-quality.mjs:694` | * The live evaluation loop (REQ-188, REQ-190, REQ-186, REQ-1 | No change: REQ-188 citations in comments stay true |
| 205 | `scripts/eval-answer-quality.mjs:741` | // Model and input only: no timeout, retry or reasoning-effo | No change: REQ-188 citations in comments stay true |
| 206 | `scripts/eval-answer-quality.mjs:754` | // What the answer prompt actually carried, and the deciding | No change: comment or test stays true; suite mode is added beside it |
| 207 | `scripts/eval-answer-quality.mjs:835` | // Worded not in the committed rule index, never made up: th | No change: comment or test stays true; suite mode is added beside it |
| 208 | `scripts/eval-answer-quality.mjs:840` | // Ranking one answer against itself means nothing: a one-mo | No change: comment or test stays true; suite mode is added beside it |
| 209 | `scripts/eval-answer-quality.mjs:846` | // The same attached-excerpt, deciding-rule and game-state i | No change: comment or test stays true; suite mode is added beside it |
| 210 | `scripts/eval-answer-quality.mjs:983` | * The real dependencies of an experiment run (REQ-226): the | No change: comment or test stays true; suite mode is added beside it |
| 211 | `scripts/eval-answer-quality.mjs:1074` | * Experiment mode (REQ-226): validates the manifest against | No change: comment or test stays true; suite mode is added beside it |
| 212 | `scripts/eval-answer-quality.mjs:1250` | * model-access check (REQ-188): the dry run performs it when | No change: REQ-188 citations in comments stay true |
| 213 | `scripts/eval-answer-quality.mjs:1286` | // An experiment run never reads or writes the committed sco | No change: comment or test stays true; suite mode is added beside it |
| 214 | `scripts/answer-quality-no-gate.test.mjs:7` | // REGRESSION GUARD (REQ-188, NFR-018): the paid answer half | Amend at build: NEVER_IN_A_GATE (the list under this comment) gains the eval:rulesguru commands |
| 215 | `scripts/answer-quality-no-gate.test.mjs:74` | // real corpus (REQ-229, NFR-018): a corpus refresh would tu | No change: manifest-generator and trace rule; a new sibling test guards the suite folder |
| 216 | `scripts/eval-worked-solutions.mjs:1` | // Worked-solutions retrieval check (NFR-018). | Amend at build: header comment gains the --suite usage lines |
| 217 | `scripts/eval-worked-solutions.mjs:7` | // (buildCaseRequest in scripts/lib/prompt-fidelity.mjs, REQ | No change: comments about the committed corpus stay true |
| 218 | `scripts/eval-worked-solutions.mjs:57` | * the shared gold-case loader (REQ-185), so this retrieval c | No change: comments about the committed corpus stay true |
| 219 | `scripts/eval-worked-solutions.mjs:80` | WORKED-SOLUTIONS RETRIEVAL CHECK (NFR-018), | No change: the suite report prints its own title |
| 220 | `scripts/eval-answer-quality.test.mjs:422` | test(buildCaseRequest asks a case bare when it names no card | No change: existing tests stay; suite tests are added |
| 221 | `scripts/eval-answer-quality.test.mjs:512` | test(REGRESSION GUARD: eval:answer-quality is never wired in | No change: existing tests stay; suite tests are added |
| 222 | `scripts/eval-answer-quality.test.mjs:538` | // Case selection, per-case merge and the per-tier headline | No change: comment or test stays true; suite mode is added beside it |
| 223 | `scripts/eval-answer-quality.test.mjs:1042` | // Experiment mode (REQ-226): flags, the manifest refusal, a | No change: comment or test stays true; suite mode is added beside it |
| 224 | `scripts/eval-answer-quality.test.mjs:1320` | // Slice C (REQ-186 to REQ-189): grader repair, runtime pari | No change: comment or test stays true; suite mode is added beside it |
| 225 | `scripts/eval-answer-quality.test.mjs:1343` | test(evaluation answer calls are built with the key alone an | No change: existing tests stay; suite tests are added |
| 226 | `scripts/eval-answer-quality.test.mjs:1552` | test(the routine run's blind ranking is handed the lone judg | No change: comment or test stays true; suite mode is added beside it |
| 227 | `scripts/lib/prompt-fidelity.d.mts:3` | // gate (REQ-185, REQ-188). Backend vitest tests import the | No change: prompt-fidelity helpers are reused unchanged |
| 228 | `scripts/lib/prompt-fidelity.d.mts:19` | /** Present when combo enrichment is on (production's defaul | No change: prompt-fidelity helpers are reused unchanged |
| 229 | `scripts/lib/experiment-run.mjs:1` | // Named experiment runs for the answer-quality instrument ( | No change: comment or test stays true; suite mode is added beside it |
| 230 | `scripts/lib/experiment-run.mjs:67` | /** One record is keyed by case, model, excerpt cap, arm and | No change: comment or test stays true; suite mode is added beside it |
| 231 | `scripts/lib/experiment-run.mjs:178` | * A run measures the checkout it executes from (REQ-226). It | No change: comment or test stays true; suite mode is added beside it |
| 232 | `scripts/lib/experiment-run.mjs:356` | // The loop (REQ-226, REQ-227) | No change: comment or test stays true; suite mode is added beside it |
| 233 | `scripts/lib/experiment-run.mjs:364` | * (preparePromptInput, REQ-185); any other arm comes from | No change: experiment runner comments stay true |
| 234 | `scripts/lib/experiment-run.mjs:387` | // The effort the provider reports for a reasoning model; no | No change: experiment runner comments stay true |
| 235 | `scripts/lib/experiment-run.mjs:632` | // Ranking one answer against itself means nothing: a one-mo | No change: comment or test stays true; suite mode is added beside it |
| 236 | `scripts/lib/experiment-run.mjs:833` | * The blind side-by-side rank (REQ-186 layer 2b) for one cas | No change: comment or test stays true; suite mode is added beside it |
| 237 | `scripts/lib/experiment-run.mjs:842` | // The same attached-excerpt, deciding-rule and game-state i | No change: comment or test stays true; suite mode is added beside it |
| 238 | `scripts/lib/experiment-run.mjs:876` | // Built the same way for every model, cap and arm (scripts/ | No change: comment or test stays true; suite mode is added beside it |
| 239 | `scripts/lib/experiment-run.mjs:912` | * A regrade run (REQ-226): makes no answer call. It takes ea | No change: comment or test stays true; suite mode is added beside it |
| 240 | `scripts/lib/gold-cases.test.mjs:361` | // The migration of the 18 first-ship cases (REQ-185, A1) | No change: first-ship migration tests |
| 241 | `scripts/lib/gold-cases.test.mjs:453` | test(each migrated case is approved by the owner's accept of | No change: first-ship migration tests |
| 242 | `scripts/lib/gold-cases.test.mjs:461` | approved by the owner's accept of REQ-185 at the define gate | No change: first-ship migration tests |
| 243 | `scripts/rules-staleness.mjs:1` | // The rules test corpus staleness report (REQ-225). No prov | No change: staleness and review commands read the committed corpus only |
| 244 | `scripts/rules-review.mjs:1` | // The owner review commands for the rules test corpus (REQ- | No change: staleness and review commands read the committed corpus only |
| 245 | `scripts/lib/answer-quality-run.mjs:2` | // on-demand answer-quality run (REQ-186 to REQ-190), kept a | No change: comment or test stays true; suite mode is added beside it |
| 246 | `scripts/lib/answer-quality-run.mjs:93` | * REQ-188: which cases a run grades. Only approved, non-stal | No change: describes routine selection; suite selection lives in its own module |
| 247 | `scripts/lib/judge-inputs.mjs:2` | // (REQ-186). One builder for the routine loop, the experime | No change: comment or test stays true; suite mode is added beside it |
| 248 | `docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md:132` | token-created-by-name-uses-oracle-card 1 rulings approved, | No change: investigation docs, historical |
| 249 | `docs/eval/answer-quality-investigation/RUNBOOK.md:16` | Judge model (**D0**) ______ Must be stronger than both GPT-4 | No change: investigation docs, historical |
| 250 | `docs/eval/answer-quality-investigation/RUNBOOK.md:132` | Credentials load as for any live run (REQ-188). Run the **sa | No change: investigation docs, historical |
| 251 | `docs/eval/answer-quality-investigation/RUNBOOK.md:189` | One run per input, a two-model lineup so the blind side-by-s | No change: investigation docs, historical |

Lines the proposal also edits that the grep does not hit (they cite none of the
patterns): `REQ-186` `Description` and its approved-only criterion,
`REQ-226`'s first criterion, the `NFR-018` dependency insertion point, the
`REQ-185` and `REQ-188` dependency insertion points, and `system-map.md`
line 502 (`Lives in`). Each is shown in full in its `GATE-QUESTIONS.md` block.
