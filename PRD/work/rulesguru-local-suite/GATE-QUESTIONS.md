# Gate questions — rulesguru-local-suite

**Decide:** seven rule changes (one new requirement, five amended, one
non-goal line) and two blocker questions. Answer each verdict slot (accept,
edit, or reject; a reason is required for edit or reject), then merge the docs
PR to start the build.

This package lets you test the AI judge against about 1,500 extra rules
questions from RulesGuru, used with permission, local only. Nothing changes for
players. You import the questions once onto your own machine, convert them into
test cases there, and run the free "did the deciding rule reach the prompt"
check over all of them, or a paid answer run over a filtered slice, split by
difficulty level. None of that data, and no per-question result, is ever
committed.

- `REQ-232` (new) — the import, convert and purge commands, the suite runs, and
  the one gitignored folder everything lives in.
- `REQ-185` (amended) — the rules test corpus says the local suite is not part
  of it and is never committed.
- `REQ-186` (amended) — the judge may grade a suite answer against RulesGuru's
  answer, reported as agreement, never as correct.
- `REQ-188` (amended) — the answer run's case selection names the suite run as
  its one exception.
- `REQ-226` (amended) — the suite run reuses the experiment-run machinery but is
  its own mode.
- `NFR-018` (amended) — the validation track gains the suite, outside every
  gate.
- `goals-and-non-goals` (amended) — the "no automated answer gating" line
  covers the suite.
- B1 — may a gap the suite finds become an official test case?
- B2 — where the local folder lives.

Recommendation: accept all seven; B1 yes, by your hand only; B2
`output/rulesguru/`. Rejecting `REQ-232` means nothing here is built. The five
amendments only keep the other requirements consistent with `REQ-232`; reject
them together with it, or not at all.

Overlap with the parked `resolution-recipe-eval` package (docs PR #283): it
also amends `REQ-185`, on two lines this package does not touch. Both can be
accepted; `DESIGN-BRIEF.md`, "Overlap with resolution-recipe-eval", says how the
build applies this one if that one lands first.

Full design, assumptions, the test plan and the line-level amendment set (251
rows): `DESIGN-BRIEF.md` in this folder.

## REQ-232 — a local RulesGuru practice suite: import, convert and run, never committed

**What this decides:** whether the repo gains the commands that let you import
RulesGuru's rules questions onto your machine, turn them into test cases, and
run the existing retrieval check and answer run over them, with every piece of
that data kept in one folder git never sees.

**In plain terms:** today the AI judge is tested against about 400 committed
cases. The probe of 918 RulesGuru questions found three in four test a rule
none of those cases decides on, so this is new ground, not duplicates. You run
an import command once (about 15–20 minutes; it waits 3 seconds between
requests and can be stopped and resumed). It saves each question exactly as
fetched, because RulesGuru swaps in different cards every time a question is
fetched. A convert command turns each saved question into a test case on your
machine, matching card names to our card data and cited rules to our rule
index. Then `--suite rulesguru` on the free retrieval check reports how often
the cited rule reached the prompt, by difficulty level and rules section; on
the paid answer run it grades a filtered slice, with the same dry-run-first,
confirm-flag and spending-cap rules every paid run has. RulesGuru's answers are
community-written, so a match is reported as "agrees with RulesGuru", never as
correct, and never mixed into the official score. A purge command deletes the
whole folder. Nothing here is a build gate:
CI cannot see the data.

**What happens if you say no:** nothing is built; the AI judge stays tested
against the committed corpus alone.

**Proposed diff** — `PRD/sections/functional-requirements.md`, a new entry
after `### REQ-231`:

```diff
+### REQ-232
+- Title: Local RulesGuru practice suite: import, convert and run, never committed
+- Priority: medium
+- Description: Beside the committed rules test corpus (REQ-185), the owner can keep a local-only practice suite of judge-style rules questions from RulesGuru (rulesguru.org), used with permission, local only, and run the free retrieval check and the paid answer-quality run over it, split by the suite's level, complexity and tags. Three committed commands import the questions politely and freeze each one as fetched, convert them into local cases in the format version 2 shape, and purge them; the two existing run commands gain a `--suite rulesguru` selection with filters. Every piece of suite data (questions, answers, card rolls, converted cases, run output and per-question results) stays in one gitignored folder on the owner's machine and is never committed. Suite answers are community-written: they are never ground truth, never approved, and never a reference answer for the corpus, and a suite result is reported as agreement with RulesGuru, apart from the official corpus and never in its headline (REQ-187). The suite is never a build gate, because CI cannot see it.
+- Acceptance Criteria:
+  - **one gitignored folder**: every file a suite command writes lives under the suite folder `output/rulesguru/` (one constant), ignored by its own `.gitignore` line committed in the same change as the import command, so the folder is ignored before the first import. Every suite command refuses to write, naming the fix, unless `git check-ignore` reports the suite folder ignored; a test asserts that `git check-ignore` matches a path inside the suite folder and that `git ls-files` lists nothing under it
+  - **import**: `npm run eval:rulesguru:import` pages the RulesGuru question API (`GET https://rulesguru.org/api/questions/?json=<settings>`) in id order with `previousId` starting at 1 (the API rejects 0), with every level, every complexity, legality `all`, no tag filter, and a `from` value naming TheJudge. Requests are sequential, and each starts no sooner than 3 seconds after the previous one finished (the server asks for at least 2). A batch starts at 50 questions; a batch the API answers as malformed is retried at half the size, down to 1; a one-question request that still fails steps `previousId` past one id and records the skip; after five successful batches in a row the size doubles back toward 50
+  - **freeze on import**: each question is saved exactly as fetched, one file per question id under the suite folder's `raw/`, written whole (a temporary file renamed into place). An id already frozen is never fetched into place again or overwritten, so a re-import only adds new questions. The API substitutes different cards into a question on every fetch, so the frozen file is the only version any case is built from
+  - **resumable**: after every saved batch the import records its progress (last saved id, skipped ids, batch-size changes) in the suite folder; a stopped or interrupted import resumes from the last saved id. It stops cleanly, progress saved, on a network error, on a second rate-limit answer after one 30-second wait, or after 10 failed requests in a row, and prints counts only (saved, skipped, already frozen)
+  - **purge**: `npm run eval:rulesguru:purge -- --yes` deletes the whole suite folder and nothing else; without `--yes` it prints how many files it would delete and exits; it refuses a path that does not resolve to the suite folder
+  - **convert**: `npm run eval:rulesguru:convert` reads only the frozen raw files and committed repo data (no network) and writes one case per question to the suite folder's `cases/`, plus a counts report; converting again rewrites the same cases from the same inputs. Each case has the format version 2 shape (REQ-185) with: `id` `rulesguru-<question id>`; `tier` `external`; `review.status` `draft`; `cards` resolved by name (below); `gameState` null; `question` the question's simple text; `expected.answer` its simple answer, `expected.shortAnswer` that answer's first sentence, `expected.outcome` null, and `expected.decidingRuleIds` from its cited rules (below); a `suite` block carrying the source name, question id, level, complexity, tags, the cited rule ids as given, one rule group per cited id, and `excluded` (null, or the reason the case is left out of runs); a `source` block naming the authority `external-unapproved`, the publisher, the licence `used with permission, local only`, and the question id; empty `layers`; a `snapshot` computed from committed data exactly as for a corpus case (REQ-225); and a `whyHard` naming the level and complexity
+  - **full name lookup**: a card name resolves to an oracle id through one index built from committed card data: every oracle id in `apps/backend/data/cardDetailByOracleId.json.br`, named from `apps/frontend/public/data/cardMetadata.json` and, for the cards that file leaves out, from `apps/frontend/public/data/cardScanMap.json`. Matching tries the exact name, then case-insensitive, then accent-folded, and a double-faced card also answers to its front-face name. When a name matches more than one card, a non-token card wins over a token; a name still matching two cards is unresolved, never guessed
+  - **bare keyword headers**: a cited rule id the committed rule index holds only as subrules (a bare header such as `702.16`) maps to all of its subrules in the index. Each cited id becomes one rule group, and a group counts as reaching the prompt when any rule id in it does
+  - **kept but excluded**: a question with a card that does not resolve (missing or ambiguous), with no cited rule, with a cited rule id absent from the rule index after header mapping, or with the same question text as an earlier question is still converted, with `suite.excluded` naming the reason; it is counted in the report, listed by question id only in the local report, and never selected by a run. A question tagged `Unsupported answers` is left out of every run by default and included only with `--include-unsupported`
+  - **one loader, two modes**: suite cases are read through the shared loader (`scripts/lib/gold-cases.mjs`) in an external mode (`loadGoldCases(dir, { external: true })`). The default mode, which every corpus reader uses, refuses a case whose `tier` is `external`, so a suite case copied into the committed corpus folder fails the offline prompt gate (REQ-222) loudly. External mode accepts only `tier` `external` cases, accepts `expected.outcome` null, refuses any case whose review status is not `draft` (a suite case is never approved, by any path), and checks duplicates only among cases not excluded
+  - **retrieval check over the suite**: `npm run eval:worked-solutions -- --suite rulesguru` runs the existing free check (no provider call; the local embedder runs in process) over the selected suite cases through the same production prompt path, and reports the cases where any cited rule group reached the prompt and where every group did, each split by level, complexity and Comprehensive Rules section, with the misses listed by case id. The report is printed and written under the suite folder's `reports/`; an `--output` path outside the suite folder is refused
+  - **answer-quality run over the suite**: `npm run eval:answer-quality -- --suite rulesguru --run-id <id>` answers the selected suite cases through the same prompt path, judge, rubric and rubric revision as any run (REQ-186, REQ-187), and reuses the experiment-run machinery: the identity record, the per-record checkpoint, `--resume`, `--retry-errors`, `--repeat`, and the spending cap (REQ-226, REQ-227). With no confirmation flag it prints the selected count and the estimated cost and makes no call; `--confirm-live-calls` requires `--max-cost-usd`; calls are sequential. It builds its manifest (ids and hashes, REQ-226) from its filters and saves it in its run folder, writes only under the suite folder's `runs/<run-id>/`, never reads or writes `apps/backend/src/eval/answer-quality/results.json` or `coverage.json`, and refuses `--manifest`, `--changed`, `--all`, `--tag`, `--tier`, `--regrade-from`, any arm but A (REQ-230), and an `--output-dir` outside the suite folder. Its summary reports each Correctness 2 as agreeing with RulesGuru, split by level and complexity, never as correct
+  - **filters**: both runs select suite cases by `--level <0|1|2|3|corner>`, `--complexity <simple|intermediate|complicated>` and `--suite-tag <tag>`, each repeatable (any listed value matches; different filters combine), plus `--include-unsupported`; the answer-quality run also takes `--sample <n>` with `--seed`. With no filter every case not excluded is selected. A stale suite case (its rule, oracle or ruling text changed since it was converted, by REQ-225's comparison) is skipped and counted, and converting again refreshes it
+  - **never a gate**: no suite command appears in `npm test`, `npm run quality:check`, any script those run, or any CI workflow; the regression guard `scripts/answer-quality-no-gate.test.mjs` lists the three `eval:rulesguru` commands
+  - **tested on synthetic data**: every test uses invented questions in the API's shape, an injected fetch, an injected clock and a temporary folder; no test makes a network call or reads the suite folder
+- Constraints:
+  - nothing derived from a specific RulesGuru question is committed: no question, answer, card roll, converted case, test fixture, per-question result, coverage count, receipt, ledger, PR body or PRD text. Committed text about the suite gives counts and field names only, and says nothing about the permission beyond used with permission, local only
+  - suite answers are never ground truth and never a corpus reference answer (REQ-185); a suite result never enters the official headline (REQ-187), the committed scores or coverage files (REQ-189), or the offline gate's baseline (REQ-222)
+  - nothing from the suite enters a player's prompt; no runtime dependency, route, schema, provider or frontend change; no new npm dependency (the import uses Node's built-in `fetch`)
+  - the import is the only command that contacts RulesGuru; the owner runs it, never an agent, and it never re-imports unless asked; the owner launches any paid suite run, as for every live run (REQ-188)
+- Dependencies:
+  - REQ-185 (the case format, and the corpus the suite stays apart from)
+  - REQ-186, REQ-187 (the judge and rubric a suite run reuses)
+  - REQ-188 (the confirmation gate and never-a-gate rules)
+  - REQ-222 (the offline gate whose loader refuses a suite case)
+  - REQ-225 (the snapshot comparison a suite run applies)
+  - REQ-226, REQ-227 (the run folder, identity record, checkpoint, resume and spending cap a suite run reuses)
+  - NFR-018 (the validation track the suite sits beside)
+- Notes:
+  - measured 2026-10-10 (probe of 918 of about 1,500 questions, ids 2–2249; counts only): 830 cite at least one rule, 820 of them only rules in the committed index; 7 cited ids are bare keyword headers whose subrules the index holds; 686 cite a rule no corpus case decides on (470 distinct rule ids, against the 372 the corpus decides on); 110 share any card with the corpus; level 0/1/2/3/corner 89/330/295/141/63; complexity simple/intermediate/complicated 835/78/5; 43 tagged `Unsupported answers`; a 50-question request took about 30 seconds, so a full import takes roughly 15–20 minutes; some batches came back malformed and halving the batch size got past each one
+  - measured 2026-10-10 against the committed data at `dabad406`, by joining the three files below by oracle id (a name from `cardMetadata.json`, else the first `cardScanMap.json` printing) and counting named ids, non-token creature ids with empty oracle text, and names shared by two or more non-token ids: `cardDetailByOracleId.json.br` holds 37,854 oracle ids and no names; `cardMetadata.json` names 34,639 cards and leaves out cards with no rules text; adding `cardScanMap.json` names 34,973 of the 37,854 ids, including 341 of the 348 non-token creatures with no rules text, and the unnamed rest are almost all art cards and tokens; 19 names match two non-token cards and stay unresolved. The probe's lookup, from `cardMetadata.json` alone, resolved every card for only 676 of 918 questions
```

Consequential edits in the same entry — `PRD/sections/system-map.md`,
`## Eval harness` and `### Answer-quality baseline`:

```diff
-- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, an offline gate over the rules test corpus that checks every attached card and deciding rule reaches the prompt and every real mechanic has a case, and an on-demand answer-quality baseline that scores the model's final answer against each case's approved answer.
+- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, an offline gate over the rules test corpus that checks every attached card and deciding rule reaches the prompt and every real mechanic has a case, and an on-demand answer-quality baseline that scores the model's final answer against each case's approved answer. A local-only practice suite of RulesGuru questions, never committed and never a gate, can be run through the retrieval check and the answer-quality run (REQ-232).
-- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185, REQ-222, REQ-223, REQ-224, REQ-225
+- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185, REQ-222, REQ-223, REQ-224, REQ-225, REQ-232
```

In `### Answer-quality baseline`, the `Summary` line keeps its text and gains
one closing sentence at its end; `Lives in` and `Backed by` gain the suite:

```diff
-- Summary: On-demand, confirmation-gated run that asks the selected approved cases of the rules test corpus — by default the cases whose prompt or reference answer changed since they were last graded, or whose last graded record predates those hashes, answered by the deployed model at the deployed ten-excerpt cap — and scores each answer against that case's approved reference answer: deterministic assertions (including rule ids the answer cites that are not in the committed rule index), a reference-grounded judge model stronger than every contestant, a blind side-by-side ranking when two or more models answer, over four 0–2 axes, then a human review pass. The four-model bake-off and other excerpt caps are explicit options. Never in `quality:check`, never asserted against a golden, never a build gate. A routine run writes a small committed scores file merged per case and gitignored transcripts; tier-3 scores are always reported apart from the official tiers. Experiment runs (REQ-226) answer a fixed manifest of cases, optionally repeated and optionally regraded from an earlier run's stored answers, save each record as it completes and stop at an owner-set spending cap (REQ-227), and write only to their own gitignored run folder; a paired comparison report reads two runs (REQ-228); an offline evidence trace shows where each deciding rule ranks and whether it reaches the prompt (REQ-229); labelled diagnostic prompt arms run only on a committed diagnostic case set, apart from a held-out set (REQ-230).
+- Summary: On-demand, confirmation-gated run that asks the selected approved cases of the rules test corpus — by default the cases whose prompt or reference answer changed since they were last graded, or whose last graded record predates those hashes, answered by the deployed model at the deployed ten-excerpt cap — and scores each answer against that case's approved reference answer: deterministic assertions (including rule ids the answer cites that are not in the committed rule index), a reference-grounded judge model stronger than every contestant, a blind side-by-side ranking when two or more models answer, over four 0–2 axes, then a human review pass. The four-model bake-off and other excerpt caps are explicit options. Never in `quality:check`, never asserted against a golden, never a build gate. A routine run writes a small committed scores file merged per case and gitignored transcripts; tier-3 scores are always reported apart from the official tiers. Experiment runs (REQ-226) answer a fixed manifest of cases, optionally repeated and optionally regraded from an earlier run's stored answers, save each record as it completes and stop at an owner-set spending cap (REQ-227), and write only to their own gitignored run folder; a paired comparison report reads two runs (REQ-228); an offline evidence trace shows where each deciding rule ranks and whether it reaches the prompt (REQ-229); labelled diagnostic prompt arms run only on a committed diagnostic case set, apart from a held-out set (REQ-230). A local practice-suite run (`--suite rulesguru`, REQ-232) answers RulesGuru questions kept only on the owner's machine, writes only to the suite's gitignored folder, and reports agreement with RulesGuru apart from the corpus.
-- Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/` (including `manifests/`), `scripts/eval-answer-quality.mjs`, and the compare and evidence-trace scripts beside it
+- Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/` (including `manifests/`), `scripts/eval-answer-quality.mjs`, the compare and evidence-trace scripts beside it, and the `eval:rulesguru` import, convert and purge scripts
-- Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190, REQ-226, REQ-227, REQ-228, REQ-229, REQ-230
+- Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190, REQ-226, REQ-227, REQ-228, REQ-229, REQ-230, REQ-232
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-185 — the rules test corpus says the local suite is not part of it

**What this decides:** whether the corpus requirement states plainly that the
RulesGuru suite is a separate, local thing that never joins the corpus.

**In plain terms:** the corpus requirement (REQ-185) says the AI judge is
graded against one committed set of cases, each with an answer you approved:
official rules text, a WotC ruling, or a ruling you researched (tier 3). It
already says outside sources may suggest questions but their text is never
committed and never ground truth. This adds one criterion and one constraint:
the suite's cases share the case format but are marked `external`, never
committed, never approved by any path, and never a reference answer; the
corpus's own loader refuses one if it ever lands in the corpus folder. No
existing line is rewritten.

**What happens if you say no:** the corpus requirement says nothing about the
suite, and `REQ-232` alone keeps them apart. If you accept `REQ-232`, accept
this too, so the two read the same way.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-185`
(three insertions; the surrounding lines are unchanged context):

```diff
   - the corpus grows through tiers 1 and 2 first, under the same licensing resolution NFR-018 already required, and through tier 3 only by owner approval. Community sources — "common mistakes" articles, judge blogs, forums, Stack Exchange — may choose which questions enter and may be listed as tier-3 research, never copied as an answer; no outside-source text is committed in run 1. An answer written by a contributor or an agent is never ground truth unless the owner approves it, and then only as tier 3. Commander Spellbook combos are excluded: they are community-curated, not official, and REQ-146 already inspects real answers on combo scenarios
+  - **the local practice suite is not the corpus**: beside the corpus, the owner may keep a local-only practice suite of RulesGuru questions (used with permission, local only; REQ-232). Its cases share format version 2 but carry `tier` `external`; they are never committed, never approved by any path, never a reference answer for the corpus, and never ground truth. They are read only in the shared loader's external mode, and the default mode every corpus reader uses refuses one found in the corpus folder
```

```diff
   - the corpus commits only WotC text the project already ships (the committed rulings and Comprehensive Rules) plus owner-approved tier-3 answers; no Stack Exchange, Cranial Insertion, or other outside text
+  - nothing from the local practice suite (REQ-232) is committed or counted here: no suite question, answer, case or per-question result enters the corpus folder, the coverage file, the scores file, or any report of the corpus
```

```diff
   - REQ-230 (the diagnostic arms the gold-data constraint names)
+  - REQ-232 (the local practice suite kept apart from the corpus)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-186 — the judge may grade a suite answer against RulesGuru's answer, as agreement only

**What this decides:** whether the AI grader may compare an answer to
RulesGuru's answer during a suite run, even though that answer is not one you
approved.

**In plain terms:** today the grader (a stronger AI model) is given only an
answer you approved for that case and asked whether the AI's answer agrees with
it; it is never asked to rule on Magic rules itself (REQ-186). It grades only
approved, up-to-date cases. A suite case has RulesGuru's community answer
instead. This lets a suite run hand the grader RulesGuru's answer, with the
same grader, inputs and scoring rules, and requires the result to be reported
as "agrees with RulesGuru", never as correct and never in the official score
(REQ-187's headline: the count of approved cases the AI fully gets right).

**What happens if you say no:** the grader stays limited to approved cases, so
the paid half of `REQ-232` cannot run; only the free retrieval check over the
suite would work.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-186`:

```diff
-- Description: Each answer produced by an answer-quality run is scored by four layers in order — deterministic assertions, a reference-grounded model judge that scores each answer alone, a blind side-by-side ranking pass across every answer to the same question when two or more answer models ran, and a human review pass over the written record. The model judge is given the case's approved reference answer (official text for tiers 1 and 2, the owner-approved ruling for tier 3) and asked only whether the model's answer agrees with it; it is never asked to rule on Magic rules from its own knowledge. The judge model is stronger than every answer model in the run and is never one of them.
+- Description: Each answer produced by an answer-quality run is scored by four layers in order — deterministic assertions, a reference-grounded model judge that scores each answer alone, a blind side-by-side ranking pass across every answer to the same question when two or more answer models ran, and a human review pass over the written record. The model judge is given the case's approved reference answer (official text for tiers 1 and 2, the owner-approved ruling for tier 3; in a local practice-suite run, REQ-232, the external source's own answer, which is never ground truth) and asked only whether the model's answer agrees with it; it is never asked to rule on Magic rules from its own knowledge. The judge model is stronger than every answer model in the run and is never one of them.
-  - only cases whose review status is `approved` and that are not flagged stale (REQ-225) are answered and judged; a tier-3 case is judged exactly like tiers 1 and 2, with its owner-approved answer as the reference
+  - only cases whose review status is `approved` and that are not flagged stale (REQ-225) are answered and judged; a tier-3 case is judged exactly like tiers 1 and 2, with its owner-approved answer as the reference. The one exception is a local practice-suite run (REQ-232), which judges the suite's unapproved, non-stale external cases against the external source's answer with the same judge inputs and rubric, and reports each result as agreement with that source, never as correctness and never in the headline (REQ-187)
   - REQ-230 (the arm whose prompt the attached excerpts come from)
+  - REQ-232 (the local practice-suite run, judged against an external answer)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-188 — the answer run's case selection names the suite run as its one exception

**What this decides:** whether the paid answer run's selection rule says that a
suite run picks from your local suite instead of the committed corpus.

**In plain terms:** today the answer run grades only approved, up-to-date
corpus cases, picked by one of: changed since last graded (the default), a tag,
a tier, a random sample, all, or an experiment's fixed case list (REQ-188).
This adds the suite run as the one exception: it never reads the committed
corpus, picks the suite's unapproved cases by level, complexity and tag, and
writes only to the suite's own gitignored folder.

**What happens if you say no:** the selection rule contradicts `REQ-232`'s
suite run; accept both or reject both.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-188`:

```diff
-  - **case selection**: the run grades only `approved`, non-stale cases (REQ-225), chosen by exactly one of `--changed` (the default: the case's prompt hash for that model and cap differs from its last graded record, the hash of its current `expected.answer` differs from the reference-answer hash that record was judged against (REQ-189), that record carries no prompt hash or no reference-answer hash (every record written before this change, so the first routine run after it selects the 18 first-ship cases), or it has never been graded — so a case whose reference answer was reworked while its prompt stayed identical is graded again), `--tag <tag>`, `--tier <1|2|3>`, `--sample <N>` (a seeded random sample, the seed recorded; `--seed` sets it), `--all`, or experiment mode (`--run-id` with `--manifest`, REQ-226), which answers exactly a manifest's cases and writes only to its own run folder. The dry run prints the selected case count, the reason each was selected, and the estimated cost before any spend
+  - **case selection**: the run grades only `approved`, non-stale cases (REQ-225), chosen by exactly one of `--changed` (the default: the case's prompt hash for that model and cap differs from its last graded record, the hash of its current `expected.answer` differs from the reference-answer hash that record was judged against (REQ-189), that record carries no prompt hash or no reference-answer hash (every record written before this change, so the first routine run after it selects the 18 first-ship cases), or it has never been graded — so a case whose reference answer was reworked while its prompt stayed identical is graded again), `--tag <tag>`, `--tier <1|2|3>`, `--sample <N>` (a seeded random sample, the seed recorded; `--seed` sets it), `--all`, or experiment mode (`--run-id` with `--manifest`, REQ-226), which answers exactly a manifest's cases and writes only to its own run folder. The one exception is a local practice-suite run (`--suite rulesguru --run-id <id>`, REQ-232): it never reads the committed corpus, selects the local suite's unapproved external cases by level, complexity and tag, and writes only to the suite's own gitignored folder. The dry run prints the selected case count, the reason each was selected, and the estimated cost before any spend
   - REQ-227 (unpriced models and the spending cap)
+  - REQ-232 (the local practice-suite run)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-226 — the suite run reuses the experiment machinery but is its own mode

**What this decides:** whether the experiment-run requirement says that a
suite run is a separate mode that borrows its saving, resuming and spending-cap
machinery.

**In plain terms:** an experiment run (REQ-226) answers exactly the cases a
fixed list names, saves every answer as it arrives, can resume after a stop
without paying twice, stops before a spending cap you set (REQ-227), and writes
only to its own gitignored run folder. Today a run id must come with that fixed
list. A suite run needs the same saving, resuming and cap, but builds its case
list from your level, complexity and tag filters and writes into the suite
folder. This says so, so the two rules do not contradict each other.

**What happens if you say no:** `REQ-226` keeps saying a run id always needs a
fixed case list, which contradicts `REQ-232`'s suite run; accept both or reject
both.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-226`:

```diff
-  - `npm run eval:answer-quality -- --run-id <id> --manifest <file>` selects experiment mode; `--run-id` and `--manifest` are required together, except in a regrade run (`--regrade-from <run-id>`, below), which takes its cases from the run it regrades and takes no manifest; experiment mode cannot be combined with `--changed`, `--tag`, `--tier`, `--sample`, or `--all`; the other experiment flags (`--repeat`, `--expect-commit`, `--resume`, `--retry-errors`, `--max-cost-usd`, `--arm`) are refused without `--run-id`, never silently run as a routine run that merges into the committed file
+  - `npm run eval:answer-quality -- --run-id <id> --manifest <file>` selects experiment mode; `--run-id` and `--manifest` are required together, except in a regrade run (`--regrade-from <run-id>`, below), which takes its cases from the run it regrades and takes no manifest; experiment mode cannot be combined with `--changed`, `--tag`, `--tier`, `--sample`, or `--all`; the other experiment flags (`--repeat`, `--expect-commit`, `--resume`, `--retry-errors`, `--max-cost-usd`, `--arm`) are refused without `--run-id`, never silently run as a routine run that merges into the committed file. A local practice-suite run (`--suite rulesguru --run-id <id>`, REQ-232) is a separate mode, not experiment mode: it builds its manifest from its own filters (`--sample` among them) and reuses this mode's run-folder layout, identity record, checkpoint, resume and spending cap (REQ-227) under the suite's own gitignored folder
   - REQ-230 (the arms a record may carry)
+  - REQ-232 (the local practice-suite run that reuses this machinery)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## NFR-018 — the validation track gains the suite, outside every gate

**What this decides:** whether the "test the AI against real worked rules
answers" track names the local suite as part of it, and says the suite gates
nothing.

**In plain terms:** this track (NFR-018) checks the AI two ways against the
committed corpus: an offline check that fails a pull request when the right
card or rule stops reaching the prompt, and a paid answer run that never blocks
anything. This adds the suite beside the corpus and a constraint that it is
outside both: CI cannot see it, so no build or test reads it, and a suite
result never changes a committed baseline, score or coverage file. The import is
the only part of the track that calls a site other than the AI provider, and
only you run it.

**What happens if you say no:** the track's description leaves the suite out,
and only `REQ-232` says it is never a gate.

**Proposed diff** — `PRD/sections/non-functional-requirements.md`, `### NFR-018`:

```diff
-- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by hard rules questions that carry an approved correct answer — official Comprehensive Rules or WotC ruling text wherever it exists, an owner-approved answer otherwise — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The cases are curated into one committed rules test corpus (REQ-185); they are test data, never runtime retrieval. The corpus is read two ways: an offline prompt gate (REQ-222, REQ-223) that checks whether every attached card and the deciding rule reached the prompt and whether every real mechanic has a case, and the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's approved answer — so this track measures both halves: whether the right material reached the prompt, and whether the answer built from it is correct. For deliberate comparisons — a data refresh, a prompt change, or two models — the answer half also offers named experiment runs with fixed case lists, checkpointing and a spending cap (REQ-226, REQ-227), a paired before/after report (REQ-228), and labelled diagnostic prompt arms confined to a diagnostic case set apart from a held-out set (REQ-230); the prompt half adds an offline evidence trace that shows where each deciding rule ranked and whether its text reached the prompt (REQ-229). None of these is a build gate.
+- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by hard rules questions that carry an approved correct answer — official Comprehensive Rules or WotC ruling text wherever it exists, an owner-approved answer otherwise — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The cases are curated into one committed rules test corpus (REQ-185); they are test data, never runtime retrieval. The corpus is read two ways: an offline prompt gate (REQ-222, REQ-223) that checks whether every attached card and the deciding rule reached the prompt and whether every real mechanic has a case, and the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's approved answer — so this track measures both halves: whether the right material reached the prompt, and whether the answer built from it is correct. For deliberate comparisons — a data refresh, a prompt change, or two models — the answer half also offers named experiment runs with fixed case lists, checkpointing and a spending cap (REQ-226, REQ-227), a paired before/after report (REQ-228), and labelled diagnostic prompt arms confined to a diagnostic case set apart from a held-out set (REQ-230); the prompt half adds an offline evidence trace that shows where each deciding rule ranked and whether its text reached the prompt (REQ-229). None of these is a build gate. Beside the committed corpus, the owner may keep a local-only practice suite of RulesGuru rules questions (used with permission, local only) and run the retrieval check and the answer-quality run over it (REQ-232); it is never committed, never ground truth, reported apart, and never a gate.
```

```diff
   - The prompt half is a build-blocking gate: the offline prompt gate (REQ-222) and the mechanic coverage gate (REQ-223) run in `npm run quality:check` and fail a pull request on a dropped card, a deciding rule that used to reach the prompt and no longer does, a case without a frozen query vector, or a real mechanic with no case. The answer half is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B): an answer score is never asserted against a golden and never fails a build (REQ-188).
+  - The local practice suite (REQ-232) is outside both halves' gating: CI cannot see it, so no command in `npm test`, `npm run quality:check`, or any CI job reads it, and a suite result never changes a committed baseline, score, or coverage file. Its import is the track's only call to an outside site other than the AI provider; the owner runs it, never on a schedule.
```

```diff
   - REQ-226, REQ-227, REQ-228, REQ-229, REQ-230 (experiment runs, checkpoint and spending cap, the paired comparison report, the evidence trace, and the diagnostic arms over that corpus)
+  - REQ-232 (the local practice suite beside the corpus)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## goals-and-non-goals — "no automated answer gating" covers the suite

**What this decides:** whether the non-goals list says the suite never gates a
build either.

**In plain terms:** the non-goals list already says the paid answer run is
never part of `npm run quality:check` and never fails a build, while the
offline prompt checks over the corpus do gate. The suite has an offline check
too, so without this line a reader could think it gates like the corpus check
does. This adds one sentence: the suite gates nothing, because CI cannot see
it.

**What happens if you say no:** the non-goal stays as it is, and `REQ-232` and
`NFR-018` alone say the suite never gates.

**Proposed diff** — `PRD/sections/goals-and-non-goals.md`, the non-goal line
on automated answer-quality gating:

```diff
-- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build (DEC-161), and the answer-quality baseline over the committed rules test corpus is the same shape — explicitly invoked, confirmation-gated, human-reviewed, never scheduled, never asserted against a golden, and never able to fail a build (NFR-018, REQ-185, REQ-188). The offline prompt checks over the same corpus (REQ-222, REQ-223) do gate; they check what reaches the prompt, never the answer
+- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build (DEC-161), and the answer-quality baseline over the committed rules test corpus is the same shape — explicitly invoked, confirmation-gated, human-reviewed, never scheduled, never asserted against a golden, and never able to fail a build (NFR-018, REQ-185, REQ-188). The offline prompt checks over the same corpus (REQ-222, REQ-223) do gate; they check what reaches the prompt, never the answer. A local-only practice suite of RulesGuru questions (REQ-232) gates nothing: CI cannot see it, so neither its retrieval check nor its answer run is ever wired into a build
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## Blocker questions

### B1 — may a gap the suite finds become an official test case?

**What this decides:** when the suite shows the AI getting a rules point wrong,
whether you may add a new committed test case for that rules point.

**In plain terms:** the settled rule is that nothing derived from a specific
RulesGuru question is ever committed. A new official case written in reaction
to a suite miss sits close to that line. The corpus requirement (REQ-185)
already lets outside sources choose which questions enter, as long as their
text never does: the case is written in our own words and answered with
official text (a Comprehensive Rules line, tier 1, or a WotC ruling, tier 2).
Saying yes applies that same rule to suite findings, by your hand only: the new
case carries nothing from RulesGuru (no wording, no question id, no mention in
its source), starts as a draft, and is approved through the usual review flow
(REQ-224). Agents never draft one from a suite finding.

**Recommendation:** yes, by your hand only, on the terms above. If you accept,
the build adds this line to `REQ-185`, after the local-suite criterion
proposed in the `REQ-185` block:

```diff
+  - a gap the local practice suite (REQ-232) exposes may become a corpus case only by the owner's hand: written in the project's own words with a WotC answer (tier 1 or tier 2), entering as a `draft` through the owner review flow (REQ-224), and carrying nothing from the suite — no wording, no question id, and no mention in its `source`; an agent never drafts a corpus case from a suite finding
```

**What happens if you say no:** the suite only reports. No committed case may
be added because of a suite finding, and the line above is not added.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

### B2 — where the local folder lives

**What this decides:** the one folder on your machine that holds every
RulesGuru question, converted case and run result.

**In plain terms:** the folder must be ignored by git before the first import,
and every suite command refuses to write until it is. Inside the repo, the
existing pattern for local-only tool output is a subfolder of `output/` with its
own `.gitignore` line (as `output/answer-quality/` and `output/rules-review/`
already are). One catch: a folder inside the repo belongs to one checkout, so a
fresh worktree starts with an empty suite; you would run the suite from your
main checkout. A folder outside the repo avoids that but leaves the repo's own
safety checks (the ignore test, the "nothing tracked here" test) with nothing
to check.

**Recommendation:** `output/rulesguru/`, with its `.gitignore` line committed
in the same change as the import command, plus a test that `git check-ignore`
covers it and that git tracks nothing under it.

**What happens if you say no:** name the folder in the reason; the build uses
that path as the single suite-folder constant, and keeps the refuse-unless-
ignored check for any path inside the repo.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).
