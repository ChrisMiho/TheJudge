# Gate questions — answer-quality-investigation

**What you need to do:** answer each `- Verdict:` slot below with `accept`,
`edit`, or `reject` (an edit or reject needs a `- Reason:`), then merge the docs
PR. Eleven slots: five new requirements (REQ-226 to REQ-230) and six
amendments (REQ-185 to REQ-189, NFR-018).

**What it changes:** only evaluation tooling and how it is described. No player
sees any difference, nothing spends money, and nothing here merges PR #273.
`build` applies the accepted diffs to `PRD/sections/` together with the code.

**Stable IDs:** REQ-220 and REQ-221 stay reserved by the deferred draft docs PR
#266. REQ-222 to REQ-225 are already live (the rules test harness), so new IDs
here start at REQ-226.

---

## REQ-226 — comparison runs get a name, a fixed case list, and their own folder

**What this decides:** whether the answer-quality command gains an "experiment"
mode for deliberate before/after comparisons, separate from the routine
scorecard.

**In plain terms:** today every recorded run of the answer grader merges its
scores into one committed scorecard file, so a "before" run and an "after" run
on the same cases overwrite each other, and there is no way to fix exactly
which cases a run asks or to ask a case three times. This adds a named run that
answers only the cases on a fixed list (each checked by a fingerprint of its
question and approved answer), can repeat each one, writes everything into its
own folder, and records exactly what was measured, including the commit it ran
from. An older revision is measured by running the tooling from that revision's
own worktree with the tooling commits applied on top — which is what comparing
PR #273's before and after needs. A regrade mode re-grades an earlier run's
stored answers under the current judge and rubric, so old answers stay
comparable after the grader changes. The routine run (on demand, confirmation-gated, never a build gate
— REQ-188) is unchanged. The system map's description of the answer-quality
tooling is updated in the same change.

**What happens if you say no:** comparisons keep overwriting the one scorecard,
and the before/after study for PR #273 cannot be run reproducibly.

Proposed diff — new entry after REQ-225 in `PRD/sections/functional-requirements.md`:

```diff
+### REQ-226
+- Title: Answer-quality experiment runs are named, frozen, and kept apart from the routine scorecard
+- Priority: medium
+- Description: Beside the routine answer-quality run (REQ-188), the run command offers an experiment mode for deliberate comparisons — before and after a data refresh, diagnostic prompt arms (REQ-230), or two answer models. An experiment run has its own run id, answers exactly the cases a manifest lists, may answer each case more than once, records everything needed to reproduce it, and writes only to its own run folder, never to the committed scores file. It records the commit it executes from; an older revision is measured by running the tooling from that revision's own worktree with the tooling commits applied on top, never by importing code across checkouts. A regrade run takes its answers from an earlier run's stored transcripts and only grades them under the current judge and rubric, so earlier answers stay comparable after a grader or rubric change and progress can be tracked run over run.
+- Acceptance Criteria:
+  - `npm run eval:answer-quality -- --run-id <id> --manifest <file>` selects experiment mode; `--run-id` and `--manifest` are required together, and experiment mode cannot be combined with `--changed`, `--tag`, `--tier`, `--sample`, or `--all`; `--regrade-from <run-id>` selects regrade mode inside an experiment run (below)
+  - a manifest is a JSON file listing case ids, each with the SHA-256 of the case's `question` and of its `expected.answer`; the run refuses, naming each case, when a listed case is missing, is not `approved`, is flagged stale (REQ-225), or has a question or reference-answer hash that differs from the manifest; it never answers a case the manifest does not list
+  - the run measures the checkout it executes from: it uses that checkout's prompt preparation, data loaders, embedder, `apps/backend/data/` files, and case files, and imports nothing from another checkout; it refuses when that checkout has uncommitted changes, records its full commit SHA, and with `--expect-commit <sha>` refuses when its HEAD differs
+  - `--regrade-from <run-id>` answers nothing: for each record key in the source run folder that the manifest lists, it reads the stored answer transcript and grades it under the current judge model and rubric revision, writing new records only to the new run's own folder; it refuses when the source run folder is missing, when a listed key has no stored answer, or when a stored answer's prompt hash is absent; the identity record names the source run id and the SHA-256 of its `manifest.json`; the source run folder is read, never written
+  - `--repeat <n>` (default 1) answers each case `n` independent times per answer model, excerpt cap, and arm; every record is keyed by case id, model, excerpt cap, arm (REQ-230), and repeat index
+  - the run writes only under `output/answer-quality/runs/<run-id>/` (gitignored): `manifest.json` (the identity record), `calls.jsonl` (the checkpoint, REQ-227), one transcript per record, and a numbers-and-ids-only `summary.json`; it refuses to start when that folder already exists, except to resume (REQ-227)
+  - the identity record holds: run id; the commit executed from; the SHA-256 of each data file read and of each listed case file; the manifest's SHA-256; answer model ids as requested and as the provider reports them; the request options sent (model and input only, REQ-188); the client timeout and retry count; `ASK_AI_PROVIDER`; `EMBEDDING_PROVIDER` and the embedding model id; whether the combo catalog was loaded; excerpt caps; arms and their revision ids; repeat count; judge model; rubric revision; the rate table with the date each rate was checked; the spending cap; for a regrade run, the source run id and manifest hash; and the UTC start time
+  - an experiment run never reads or writes `apps/backend/src/eval/answer-quality/results.json`
+  - unit tests with an injected fake client prove every manifest refusal, the dirty-checkout and wrong-commit refusals, record keying with repeats, that a regrade run makes no answer call and leaves the source run folder unchanged, and that `results.json` is untouched; no test makes a network call
+- Constraints:
+  - REQ-188's confirmation gate, credential loading, sequential calls, mock-first default, and never-in-a-gate rules apply unchanged
+  - no change to `preparePromptInput`, System 3, any route, the provider factory, or any runtime code; no experiment run writes outside its own run folder
+  - a manifest carries ids and hashes only, never question or answer text
+- Dependencies:
+  - REQ-188 (the routine run and its gates)
+  - REQ-189 (the committed scores file experiment runs leave alone)
+  - REQ-225 (the staleness flag that refuses a case)
+  - REQ-227 (checkpoint, resume, and spending cap)
+  - REQ-228 (the comparison report that reads run folders)
+  - REQ-230 (the arms a record may carry)
+- Notes:
+  - measured 2026-10-07: `--output-dir` moves only the transcripts; every recorded run merges into the committed results file at the fixed `RESULTS_RELATIVE_PATH` (`scripts/eval-answer-quality.mjs`), so two comparison runs over shared cases overwrite each other's records
+  - proposed by the `answer-quality-investigation` package to compare PR #273's base `3e973ced` with its head `07cc3ab6`, neither of which contains this tooling — the reason each revision is measured from its own worktree with the tooling commits applied on top
```

Proposed diff — `PRD/sections/system-map.md`, `## Eval harness` → `### Answer-quality baseline`:

```diff
-- Summary: On-demand, confirmation-gated run that asks the selected approved cases of the rules test corpus — by default the cases whose prompt or reference answer changed since they were last graded, or whose last graded record predates those hashes, answered by the deployed model at the deployed ten-excerpt cap — and scores each answer against that case's approved reference answer: deterministic assertions (including rule ids the answer cites that are not in the committed rule index), a reference-grounded judge model stronger than every contestant, a blind side-by-side ranking when two or more models answer, over four 0–2 axes, then a human review pass. The four-model bake-off and other excerpt caps are explicit options. Never in `quality:check`, never asserted against a golden, never a build gate. Writes a small committed scores file merged per case and gitignored transcripts; tier-3 scores are always reported apart from the official tiers.
-- Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/`, `scripts/eval-answer-quality.mjs`
-- Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190
+- Summary: On-demand, confirmation-gated run that asks the selected approved cases of the rules test corpus — by default the cases whose prompt or reference answer changed since they were last graded, or whose last graded record predates those hashes, answered by the deployed model at the deployed ten-excerpt cap — and scores each answer against that case's approved reference answer: deterministic assertions (including rule ids the answer cites that are not in the committed rule index), a reference-grounded judge model stronger than every contestant, a blind side-by-side ranking when two or more models answer, over four 0–2 axes, then a human review pass. The four-model bake-off and other excerpt caps are explicit options. Never in `quality:check`, never asserted against a golden, never a build gate. A routine run writes a small committed scores file merged per case and gitignored transcripts; tier-3 scores are always reported apart from the official tiers. Experiment runs (REQ-226) answer a fixed manifest of cases, optionally repeated and optionally regraded from an earlier run's stored answers, save each record as it completes and stop at an owner-set spending cap (REQ-227), and write only to their own gitignored run folder; a paired comparison report reads two runs (REQ-228); an offline evidence trace shows where each deciding rule ranks and whether it reaches the prompt (REQ-229); labelled diagnostic prompt arms run only on a committed diagnostic case set, apart from a held-out set (REQ-230).
+- Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/` (including `manifests/`), `scripts/eval-answer-quality.mjs`, and the compare and evidence-trace scripts beside it
+- Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190, REQ-226, REQ-227, REQ-228, REQ-229, REQ-230
```

- Verdict: edit
- Reason: Drop the cross-checkout `--subject` import: the run records the commit it executes from, and two revisions are compared by running the tooling from each revision's own worktree with the tooling commits applied on top. Add a regrade mode: a run may take its answers from an earlier run's stored transcripts and only grade them under the current judge and rubric, so earlier answers stay comparable after a grader or rubric change and progress can be tracked run over run.

---

## REQ-227 — a paid run saves as it goes and stops before it overspends

**What this decides:** whether experiment runs save each graded answer the
moment it is done, can pick up where they stopped, and must stop at a dollar
cap you set.

**In plain terms:** today the grader writes its scores only once, at the very
end, and one failed call ends the run before anything is saved — the money is
spent and the grades are lost. Nothing caps the spend, and a model the price
table does not know (GPT-6 Luna, today) is counted as costing $0. This makes
each answer-and-grade save immediately, lets a stopped run resume without
paying twice, requires a dollar cap on every paid experiment run and stops
cleanly before passing it, and treats a model with no known price as
"unpriced" — a paid run refuses to start until it has a price, because the cap
could not be enforced.

**What happens if you say no:** large paid runs stay all-or-nothing and
uncapped, and Luna's spend reads as $0.

Proposed diff — new entry after REQ-226 in `PRD/sections/functional-requirements.md`:

```diff
+### REQ-227
+- Title: Experiment runs checkpoint every record, resume without re-paying, and stop at a spending cap
+- Priority: medium
+- Description: An experiment run (REQ-226) saves each completed answer and grade as soon as it exists, records a failed call instead of ending the run, can be resumed after any interruption without repeating a completed call, and stops before it would spend more than a cap the owner set. A model with no known price is reported as unpriced, never as costing nothing.
+- Acceptance Criteria:
+  - each completed record — answer, deterministic assertions, and lone judge result — is appended to the run folder's `calls.jsonl` as soon as its judge call returns; each blind-ranking result (REQ-186) is appended when it returns
+  - a provider error or timeout on an answer, judge, or ranking call is appended as an `error` record naming the record key and the error class, and the run continues with the next record; no error ends the run before completed records are saved
+  - `--resume <run-id>` reloads the run folder, refuses when any identity-record field (REQ-226) other than the start time differs from the current invocation, and skips every record key already completed; `error` records are re-attempted only with `--retry-errors`
+  - in experiment mode, `--confirm-live-calls` requires `--max-cost-usd <amount>`; before each call the run adds that call's estimated cost (the dry run's estimate method) to the cost already spent and, when the sum would exceed the cap, stops cleanly with every completed record saved, printing and recording the cap, the amount spent, and every manifest record key not completed; a resume continues against the recorded cap unless a new `--max-cost-usd` is given, which is recorded
+  - each call's cost is computed from the usage the provider reports, counting reasoning tokens as output tokens; a model with no entry in the rate table is unpriced: the dry run prints it as `unpriced` (never `$0`), and a live experiment run refuses to start while any answer or judge model is unpriced
+  - the rate table records, per model, the input and output rate and the date the rate was checked; the dry run prints every rate with that date
+  - unit tests with an injected fake client prove: an interrupted run resumes without re-calling a completed key; the cap stops the run before it is exceeded; an unpriced model refuses a live run and prints as unpriced in the dry run; an error record is written and the run continues
+- Constraints:
+  - calls stay sequential (REQ-188); the cap is a stop, never a reason to skip cases silently — the summary lists every record key not completed
+  - no new dependency
+- Dependencies:
+  - REQ-226 (the run folder and identity record)
+  - REQ-188 (the confirmation gate and cost estimate method)
+- Notes:
+  - measured 2026-10-07: `executeEvaluation` (`scripts/eval-answer-quality.mjs`) writes scores only after every case, and an exception from `client.responses.create` or the judge propagates out of the loop, so graded records are lost (transcripts already written survive); `computeCallCostUsd` returns `0` for a model missing from `MODEL_PRICING_USD_PER_MILLION_TOKENS`, which has no `gpt-6-luna` entry
```

- Verdict: accept
- Reason: 

---

## REQ-228 — a before/after report that lists every answer that got worse

**What this decides:** whether a report compares two experiment runs case by
case and names exactly which answers got better, got worse, or stayed the same.

**In plain terms:** one overall percentage can hide a case that broke behind
several that improved. This report counts, for every case both runs answered:
right then right, wrong then right, right then wrong, wrong then wrong, and
could-not-grade — with the totals they come from — and lists every case that
went from right to wrong by name. It splits the counts by tier (official rules
and rulings apart from your owner-approved answers, never pooled), by rules
area, mechanic, difficulty and question kind. Cases whose prompt did not change
at all form their own group, so random variation between two answers is not
mistaken for an effect. It also reports speed (including how many answers would
have timed out in production at its 15-second limit), errors, tokens and cost.
It never names a winner and never fails a build.

**What happens if you say no:** comparisons are read from raw run files by
hand, and a regression can hide inside an average.

Proposed diff — new entry after REQ-227 in `PRD/sections/functional-requirements.md`:

```diff
+### REQ-228
+- Title: Paired answer-quality comparison report
+- Priority: medium
+- Description: A report command compares two experiment runs (REQ-226), or two arms or models within them, case by case, and shows which answers moved from right to wrong, wrong to right, or stayed, with denominators and case ids, so a regression can never hide inside an aggregate. It reports and never decides: no winner, no gate.
+- Acceptance Criteria:
+  - `npm run eval:answer-quality:compare -- <run-a> <run-b>` reads two run folders, with optional `--arm-a`, `--arm-b`, `--model-a`, `--model-b`, and `--cap` selectors; it makes no network call
+  - it prints `incomparable` with every reason, and compares nothing, when the judge model or rubric revision differ between the selected records; a case whose reference-answer hash differs between the two sides is listed as a reference change and left out of the transition counts; differences in subject commit, embedding provider or model, excerpt cap, arm, or answer model are reported as the variable under study
+  - a side is `right` when its Correctness is 2 (REQ-187), `wrong` when 0 or 1, and `undetermined` when the judge returned undetermined or the record is an `error`; with repeats, a case's side is the majority of its repeats, and a case whose repeats disagree is listed as `unstable` with each repeat's score
+  - it reports the counts right→right, wrong→right, right→wrong, wrong→wrong, and undetermined-or-error (on either side), plus cases present in only one run, each with its denominator; it lists every right→wrong case id with both transcript paths, every reference change, and every missing case
+  - every count is broken down by tier (tiers 1 and 2 together, tier 3 apart, never pooled — REQ-187), by Comprehensive Rules section, by mechanic tag, by difficulty, by source pool, and by request kind (lookup or In-Depth)
+  - cases whose prompt hash is identical on both sides are reported as the unchanged-input stratum, labelled as sampling variation rather than an effect of the change under study
+  - arm C and D records (REQ-230) are reported under a "diagnostic control — not a product score" heading and never folded into any other count
+  - per side it reports: answer latency mean, p50 and p95; the count of answers slower than the subject's production per-attempt client timeout (15,000 ms today); error and timeout counts; input, output and reasoning tokens; answer cost and judge cost apart, with unpriced models shown as unpriced (REQ-227)
+  - it writes a numbers-and-ids-only `compare-<run-a>-<run-b>.json` and a Markdown report under `output/answer-quality/` (gitignored)
+  - unit tests over fixture run folders cover every transition, the unstable rule, the incomparable refusal, the reference-change exclusion, and the stratum
+- Constraints:
+  - never states an overall winner, never sets or checks a threshold, never asserted against a golden, never part of any build gate (REQ-188)
+  - reads run folders only; never calls a provider
+- Dependencies:
+  - REQ-226 (the run folders it reads)
+  - REQ-187 (Correctness, and tiers never pooled)
+  - REQ-230 (diagnostic records kept apart)
+  - REQ-227 (unpriced cost reporting)
+- Notes:
+  - REQ-189's `compareRecords` already labels two records incomparable per case when the reference answer, judge, rubric, or embedding provider differ; this report builds on that per-case rule and adds the paired transition counts the routine run has no use for
```

- Verdict: accept
- Reason: 

---

## REQ-229 — an offline trace of where each deciding rule went

**What this decides:** whether a free, offline report traces each test case's
deciding rules from the player's question to the final prompt.

**In plain terms:** when the AI answers a hard case wrong, the first question is
whether the rules that decide it ever reached the AI. Today's offline check
only records whether the rule search picked them; it cannot say whether the
text arrived another way (a built-in rules topic, or a card ruling that quotes
it), nor how far down the search ranked a missed rule, nor whether a rule's
exception (like 514.3a, the exception to the cleanup rule 514.3) was left out.
This report shows, per case and per deciding rule: its rank in the full search,
whether the search picked it, and whether its text is anywhere in the final
prompt — and whether every rule the case turns on is there. It can compare two
versions of the app. No AI call, no cost, never a build failure.

**What happens if you say no:** missing evidence and poor reasoning stay
tangled, and the investigation cannot tell a retrieval problem from a prompt
problem without paying for answers first.

Proposed diff — new entry after REQ-228 in `PRD/sections/functional-requirements.md`:

```diff
+### REQ-229
+- Title: Offline evidence trace for the rules test corpus
+- Priority: medium
+- Description: An offline report follows each rules test case (REQ-185) from the player's question to the final prompt and shows, for every deciding rule, where it ranked in the System 3 search, whether it was selected, and whether its text is available to the model anywhere in the final prompt — separating "selected in search" from "available to answer". It makes no provider call and never fails a build.
+- Acceptance Criteria:
+  - `npm run eval:evidence-trace -- [--manifest <file>] [--case <id> ...] [--subject <path>] [--subject-b <path>]` runs with no provider call, no network call, and no live embedding call; with no manifest or case it traces every non-rejected case
+  - each case's request is built by `buildCaseRequest` and prepared by the subject's unmodified `preparePromptInput` with the committed card-detail, card-rulings, rules, and (when combo enrichment is on, its production default) combo data, ranked with the subject's committed frozen query vector (REQ-222); a case awaiting a re-freeze is ranked with the local embedder and labelled so
+  - for every deciding rule it reports: its rank in the full System 3 ranking (read by preparing the prompt at an excerpt cap equal to the rule index's size through REQ-190's override, which reuses production's ranking); whether it was selected at the production cap (`selectedInSearch`); whether System 3 skipped it because a curated System 2 topic already carries it; and whether its rule text appears anywhere in the final prompt at the production cap — curated topic, supplemental excerpt, or a card ruling quoting it (`availableToAnswer`)
+  - for every deciding rule it also reports its parent rule and its lettered subrules, and whether each reaches the final prompt, so a rule present without its exception is visible
+  - per case it reports the retrieval query text and its hash, attached cards, request kind, prompt length and prompt hash, `goldRuleInPrompt` (one deciding rule among the System 3 selections — REQ-189's existing meaning), and `allDecidingRulesInPrompt` (every deciding rule available to answer)
+  - a summary reports per-rule coverage and complete-procedure coverage, overall and by tier and rules section
+  - with `--subject-b` it also reports, per case, whether the two subjects' prompts are byte-identical and how coverage differs
+  - it writes `output/evidence-trace/<label>/trace.json` and a Markdown summary (gitignored)
+  - at the subject that wrote the rules gate baseline, the trace's `selectedInSearch` matches `apps/backend/src/eval/rules-gate/baseline.json`'s hit and miss for every case the baseline scores — a parity test proves it
+- Constraints:
+  - observes only: no change to `preparePromptInput`, query construction, scoring, the excerpt cap, or any prompt text
+  - never part of `npm run quality:check` or any gate; its unit tests are
+  - deciding-rule labels are read to report coverage, never to shape a prompt
+- Dependencies:
+  - REQ-185 (the corpus and its deciding rule ids)
+  - REQ-190 (the cap override that exposes the full ranking)
+  - REQ-222 (the frozen query vectors and the baseline it reproduces)
+  - REQ-189 (`goldRuleInPrompt` and `allDecidingRulesInPrompt`)
+- Notes:
+  - measured 2026-10-07 from the committed `baseline.json` at `3e973ced`: of 392 approved cases, System 3 selects every deciding rule for 287, some for 14, and none for 91. `academy-manufactor-esix-treasure` misses all of 614.1a, 616.1, 616.1e and 616.1f; `necropotence-silence-borne-upon-a-wind-cleanup` selects 514.1 and misses 514.2 and 514.3a. The baseline records System 3 selections only, which is why this trace adds availability
+  - `retrieveRulesForQueryWithDebug` returns only ten ranks below the cap as `runnerUp`; a full rank needs the larger-cap preparation above
```

- Verdict: accept
- Reason: 

---

## REQ-230 — test-only prompt variants, fenced off from the cases used to judge a fix

**What this decides:** whether the grader may try labelled, test-only versions
of the prompt — tidier presentation, or deliberately complete rules — on a
fixed diagnostic set of cases, with a separate held-out set kept clean for
judging any later fix.

**In plain terms:** to tell "the AI never got the rule" from "the AI got it but
the prompt was confusing", the grader asks the same case under variants of the
real prompt: B keeps exactly the same facts but regroups and orders them; C adds
the full set of rules the case turns on (with each rule's parent and
exceptions); D does both; P swaps in one corrected sentence of the rules
preamble once you approve the wording. C and D peek at the test's answer key
(which rules decide the case), so they are diagnostic only: they run only on a
committed diagnostic list (the two tester cases, the multiplayer case that lost
rule 608.2d, and about 44 others chosen by a recorded rule), are always labelled
"not a product score", and never see the approved answer itself. A second
list of about 80 other approved cases is held out, so a later fix is tuned on
one set and judged once on cases it never saw. Nothing a player gets changes.

**What happens if you say no:** the investigation can measure only the current
prompt, so it cannot separate a retrieval fix from a prompt-organisation fix.

Proposed diff — new entry after REQ-229 in `PRD/sections/functional-requirements.md`:

```diff
+### REQ-230
+- Title: Diagnostic prompt arms and the held-out case split
+- Priority: medium
+- Description: An experiment run (REQ-226) can answer a case under labelled diagnostic variants ("arms") of the subject's production prompt, to separate missing evidence from poor presentation. Arms that use a case's deciding-rule labels answer "would complete evidence rescue this answer?", never "how good is the product?", so they run only on a committed diagnostic case set, are reported apart, and are kept away from a committed held-out set used to judge any later fix once.
+- Acceptance Criteria:
+  - the arms are: `A` — the subject's production prompt, unchanged (the default, and the only arm a routine run uses); `B` — presentation only: the same evidence units as A (every curated topic, supplemental rule excerpt, card oracle text, and card ruling), regrouped, reordered, and given headings, with no unit added, removed, or reworded; `C` — A plus the case's deciding-rule bundle (each `decidingRuleIds` rule, its parent rule, and its lettered subrules, as text from the subject's committed rule index) added to the supplemental rules section in A's format and de-duplicated against what A already carries; `D` — C's evidence in B's presentation; `P` — A with one named preamble sentence replaced by a correction text held in a committed file
+  - each arm is a pure function under `apps/backend/src/eval/answer-quality/` from the subject's prepared prompt (text and enrichment debug) and committed data to a prompt string, with a revision id recorded on every record; nothing under `apps/backend/src/prompt/`, routes, or providers changes
+  - B's grouping is fixed under a revision id before any paid run uses it; P refuses to run until its correction text file carries the owner's approval date
+  - tests prove, for every case in the diagnostic manifest: B's evidence units equal A's as a multiset; C adds only bundle rules to A; D's evidence units equal C's; and no arm's prompt contains the case's `expected.answer`, `expected.shortAnswer`, or `expected.outcome`
+  - arms C and D run only on cases in the committed diagnostic manifest (`apps/backend/src/eval/answer-quality/manifests/diagnostic.json`); the run refuses either arm on any other case, and their records carry `diagnostic: true`
+  - the committed held-out manifest (`apps/backend/src/eval/answer-quality/manifests/held-out.json`) lists approved cases disjoint from the diagnostic manifest, and a test asserts disjointness; arms B and P run on a held-out case only under a frozen revision id, and every such record carries `heldOut: true`
+  - both manifests are written by one seeded command (`npm run eval:answer-quality:manifests`) from the evidence trace (REQ-229), recording its seed and selection rule: diagnostic — the two tester cases, `multiplayer-only-blood-ends-your-nightmares-opponents`, every approved case whose deciding rules are partly selected in search, a seeded sample of 20 cases with none selected, and a seeded sample of 10 fully selected cases as passing controls; held-out — a seeded sample of 80 of the remaining approved cases, stratified by Comprehensive Rules section; a sample size may change only with the reason recorded in the command's output
+- Constraints:
+  - arms are evaluation tooling and never become runtime prompt text; a later product change that adopts an arm's idea is its own package, and its result is judged with arm A of the changed subject on the held-out manifest
+  - a case's reference answer never enters any arm's prompt; deciding-rule labels shape only arms C and D
+  - choosing B's grouping or any later candidate's settings reads diagnostic cases only, never held-out labels
+  - manifests carry case ids and hashes only
+- Dependencies:
+  - REQ-226 (the experiment run that carries an arm)
+  - REQ-229 (the trace the manifests are drawn from)
+  - REQ-185 (the deciding rule ids and the gold-data separation)
+  - REQ-228 (diagnostic records reported apart)
+- Notes:
+  - measured 2026-10-07 at `3e973ced`: 14 approved cases have partial System 3 coverage, 91 none, 287 full (`apps/backend/src/eval/rules-gate/baseline.json`), so the diagnostic set is about 47 cases; the two tester cases are tier 3 and `multiplayer-only-blood-ends-your-nightmares-opponents` is tier 2
+  - the preamble sentence P targets is the one the owner's intake brief reports as mixing up continuous effects, state-based actions, and layers; its correction is verified and owner-approved before P runs
```

- Verdict: accept
- Reason:

---

## REQ-185 — "never in a live prompt" means never in a player's prompt

**What this decides:** whether the rule that test answers never reach the AI is
worded so the test-only variants above are allowed, and nothing more.

**In plain terms:** the rules test corpus — about 390 hard rules questions,
each with an approved answer (REQ-185) — must never leak into what a player's
question sends to the AI. The current wording says the cases "never enter a
live prompt", which could be read as forbidding any paid evaluation prompt from
using them at all. This pins the meaning to a player's prompt, keeps the
approved answers out of every answer prompt (test-only ones included), and
names the one exception: the deciding-rule labels may shape the two diagnostic
variants (C and D in REQ-230), only on the diagnostic case list.

**What happens if you say no:** the wording stays ambiguous, and REQ-230's arms
C and D would read as breaking it.

Proposed diff — `PRD/sections/functional-requirements.md`, REQ-185 `Constraints`:

```diff
-  - the gold cases remain committed evaluation data; they never enter a live prompt, never reach a real player, and add no runtime dependency or external call (NFR-018)
+  - the gold cases remain committed evaluation data; they never enter a player's prompt (any prompt the running app builds), never reach a real player, and add no runtime dependency or external call (NFR-018). A case's reference answer (`expected.answer`, `shortAnswer`, `outcome`) never enters any answer prompt, evaluation prompts included; its deciding rule ids shape an evaluation answer prompt only in the diagnostic arms C and D, on the diagnostic case set (REQ-230)
```

```diff
 - Dependencies:
   (earlier entries unchanged)
   - REQ-225 (the staleness report the `snapshot` hashes feed)
+  - REQ-230 (the diagnostic arms the gold-data constraint names)
```

- Verdict: accept
- Reason:

---

## REQ-186 — the grader is told what the AI actually saw

**What this decides:** what information the grading model receives alongside
each answer.

**In plain terms:** each answer is graded by a separate, stronger AI against
the case's approved answer (REQ-186). One of its four scores, Grounding, asks
whether the answer used the rules the prompt actually gave it — but today the
grader is handed the case's answer-key rule numbers under the label "rule ids
attached to the prompt", which is wrong, and is never shown the rules
themselves. This makes it receive the rule numbers and text of the excerpts the
answer prompt really carried, labelled as attached; the case's deciding rule
numbers, labelled separately; and for an In-Depth case, the game-state lines
the prompt printed. Every model, cap and variant gets graded on the same terms.
Because the grader's inputs change, the rubric version changes, so old and new
grades are never compared case by case.

**What happens if you say no:** Grounding keeps being graded from mislabelled
information, and the investigation's grades are not trustworthy.

Proposed diff — `PRD/sections/functional-requirements.md`, REQ-186:

```diff
-  - layer 2, the lone model judge: one call per answer, carrying the question, the assembled prompt's supplemental rule ids, the model's answer, the case's `expected.answer` as the reference answer, and the rubric (REQ-187); it returns a score per axis plus a one-paragraph rationale (`apps/backend/src/eval/answer-quality/judge.ts`, `judgeAnswerAlone`)
+  - layer 2, the lone model judge: one call per answer, carrying the question; the rule id and text of every supplemental excerpt the answer prompt actually carried (for an arm, REQ-230, that arm's prompt), labelled as attached to the prompt; the case's `decidingRuleIds`, labelled separately as the rules the reference answer turns on; for a case with a `gameState`, the game-state lines the prompt printed; the model's answer; the case's `expected.answer` as the reference answer; and the rubric (REQ-187); it returns a score per axis plus a one-paragraph rationale (`apps/backend/src/eval/answer-quality/judge.ts`, `judgeAnswerAlone`)
+  - the judge's inputs are built the same way for every answer model, excerpt cap, and arm in a run, and the blind ranking (layer 2b) receives the same attached-excerpt, deciding-rule, and game-state inputs
+  - the rubric revision (REQ-187) identifies both the rubric text and the shape of the judge's inputs: a change to what the judge is given bumps it, so records graded with different inputs are incomparable per case (REQ-189)
```

```diff
-  - every provider call is stateless, so a "fresh session" between answerer and judge is guaranteed by construction and is not the concern; the concern is shared weights, which is why the judge is a different and stronger model. The judge prompt carries the question, answer, reference, rule ids, and rubric — not the 10k-character assembled prompt — so a stronger judge costs little per call
+  - every provider call is stateless, so a "fresh session" between answerer and judge is guaranteed by construction and is not the concern; the concern is shared weights, which is why the judge is a different and stronger model. The judge prompt carries the question, answer, reference, the attached excerpts' rule ids and text (about ten excerpts averaging about 70 tokens each), the deciding rule ids, any game-state lines, and the rubric — not the 10k-character assembled prompt — so a stronger judge costs little per call
+  - measured 2026-10-07: the run passed the case's `decidingRuleIds` to the judge (`scripts/eval-answer-quality.mjs`, `ruleIds: caseEntry.expected.decidingRuleIds`) and `judge.ts` labelled them "Rule ids attached to the prompt", contrary to this requirement's layer-2 criterion; the `answer-quality-investigation` package corrected the inputs and bumped the rubric revision
```

```diff
 - Dependencies:
   (earlier entries unchanged)
   - REQ-146 (the human-reviewed, never-gating precedent this follows)
+  - REQ-230 (the arm whose prompt the attached excerpts come from)
```

- Verdict: accept
- Reason: 

---

## REQ-187 — the rubric version records the grader-input change

**What this decides:** whether the scoring rubric's version note records that
the grader's inputs changed, with the four scores themselves unchanged.

**In plain terms:** every answer is scored 0–2 on Correctness, Grounding,
Calibration and Readability, and the rubric carries a version so scores from
different rubrics are never compared (REQ-187). The four score definitions do
not change. The version moves because the grader is now shown different
information (REQ-186 above), and this note records why.

**What happens if you say no:** the version history stops explaining its own
bump; nothing else changes.

Proposed diff — `PRD/sections/functional-requirements.md`, REQ-187 `Notes`:

```diff
   - the rubric revision at first ship was `2026-09-07.1` (`RUBRIC_REVISION`); it moved to `2026-10-06.1` when the Correctness and Calibration wording changed from "the published worked solution" to "the case's approved reference answer" (so tier-3 cases read correctly), which makes records graded under the first revision incomparable per case (REQ-189)
+  - it moves again, to a revision dated the day the build changes the judge's inputs, when the judge starts receiving the attached excerpts' rule ids and text, the deciding rule ids labelled apart, and any game-state lines (REQ-186); the four axis definitions are unchanged, and records graded under `2026-10-06.1` are incomparable per case with later ones
```

- Verdict: accept
- Reason: 

---

## REQ-188 — evaluation answers are asked exactly the way production asks

**What this decides:** three corrections so a graded answer is the answer a
player would really get, plus the hook for experiment runs.

**In plain terms:** the grader exists to grade what players get, so its
questions must match production's. Today they differ in two ways that this
fixes. Production loads the Commander Spellbook combo data by default; the
grader does not. Cost ignores reasoning tokens and counts an unknown
model as $0. This loads the combo data the way production does (and records
it), records reasoning tokens and the reasoning effort the provider reports, and
reports an unknown price as "unpriced". The standing rule stays: no
reasoning-effort setting is sent, so reasoning models such as GPT-6 Luna run at
their default; tuning effort remains a separate follow-up. Evaluation answer calls keep the
SDK's default timeout and retries; whether a model is fast enough for players
is read from the recorded latency and the comparison report's count of answers
slower than 15 seconds (REQ-228). It also names the
experiment mode (REQ-226) as a selection alongside the routine ones.

**What happens if you say no:** grades keep describing a request production
never sends, and model speed and cost comparisons stay misleading.

Proposed diff — `PRD/sections/functional-requirements.md`, REQ-188:

```diff
-  - **case selection**: the run grades only `approved`, non-stale cases (REQ-225), chosen by exactly one of `--changed` (the default: the case's prompt hash for that model and cap differs from its last graded record, the hash of its current `expected.answer` differs from the reference-answer hash that record was judged against (REQ-189), that record carries no prompt hash or no reference-answer hash (every record written before this change, so the first routine run after it selects the 18 first-ship cases), or it has never been graded — so a case whose reference answer was reworked while its prompt stayed identical is graded again), `--tag <tag>`, `--tier <1|2|3>`, `--sample <N>` (a seeded random sample, the seed recorded; `--seed` sets it), or `--all`. The dry run prints the selected case count, the reason each was selected, and the estimated cost before any spend
+  - **case selection**: the run grades only `approved`, non-stale cases (REQ-225), chosen by exactly one of `--changed` (the default: the case's prompt hash for that model and cap differs from its last graded record, the hash of its current `expected.answer` differs from the reference-answer hash that record was judged against (REQ-189), that record carries no prompt hash or no reference-answer hash (every record written before this change, so the first routine run after it selects the 18 first-ship cases), or it has never been graded — so a case whose reference answer was reworked while its prompt stayed identical is graded again), `--tag <tag>`, `--tier <1|2|3>`, `--sample <N>` (a seeded random sample, the seed recorded; `--seed` sets it), `--all`, or experiment mode (`--run-id` with `--manifest`, REQ-226), which answers exactly a manifest's cases and writes only to its own run folder. The dry run prints the selected case count, the reason each was selected, and the estimated cost before any spend
```

```diff
-  - the prompt is the one a player's lookup would get: `preparePromptInput` receives the committed card-detail and card-rulings indexes (the four data files `createConfiguredApp.ts` loads), every card in the case's `cards` attached by oracle id — or, for a case with a `gameState`, placed in its zones on an In-Depth request (REQ-185) — and the question embedded — once per case, from the same retrieval query text the route handler embeds (`buildRetrievalQueryText`), by the provider `EMBEDDING_PROVIDER` names; unset, the run defaults it to `local`, the deployed provider (REQ-184), and an explicit value always wins. Under a real provider the run refuses to continue when the embedder returns no vector or System 3 reports a lexical pass (`assertQueryEmbedded`, `describeRetrieval`), so the `EMBEDDING_PROVIDER` the artifact records is always the provider that actually ranked the excerpts
+  - the prompt is the one a player's lookup would get: `preparePromptInput` receives the committed card-detail and card-rulings indexes and rules data, and — when combo enrichment is on, as it is in production by default (`COMBO_ENRICHMENT_ENABLED` unset) — the Commander Spellbook combo catalog, each loaded as `createConfiguredApp.ts` loads it, with the run artifact recording whether the combo catalog was loaded; every card in the case's `cards` attached by oracle id — or, for a case with a `gameState`, placed in its zones on an In-Depth request (REQ-185) — and the question embedded — once per case, from the same retrieval query text the route handler embeds (`buildRetrievalQueryText`), by the provider `EMBEDDING_PROVIDER` names; unset, the run defaults it to `local`, the deployed provider (REQ-184), and an explicit value always wins. Under a real provider the run refuses to continue when the embedder returns no vector or System 3 reports a lexical pass (`assertQueryEmbedded`, `describeRetrieval`), so the `EMBEDDING_PROVIDER` the artifact records is always the provider that actually ranked the excerpts
```

```diff
-  - every run records, in the artifact (REQ-189): the selected case ids with tier counts, the selection mode, the answer-model lineup, judge model id, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, model and excerpt cap per leg, git commit, UTC timestamp, per-call prompt characters and prompt hash, per-call input and output token usage for the answer call and for each judge call, per-call wall-clock latency, and the run's total token usage and cost with answer and judge shown separately
+  - every run records, in the artifact (REQ-189): the selected case ids with tier counts, the selection mode, the answer-model lineup, judge model id, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, model and excerpt cap per leg, git commit, UTC timestamp, per-call prompt characters and prompt hash, per-call input, output, and reasoning token usage for the answer call and for each judge call, the reasoning effort the provider reports for an answer when it reports one, per-call wall-clock latency, and the run's total token usage and cost with answer and judge shown separately; a model with no rate in the run's rate table is reported as unpriced, never as zero cost (REQ-227)
```

```diff
-  - no reasoning-effort, verbosity, or other per-model request parameter is added to the provider call: `openAiResponsesProvider.ts` sends model and prompt only, so gpt-5-family models run at their default reasoning effort in this run. A reasoning-effort setting is a follow-up package, opened only if a gpt-5-family model wins on correctness and its recorded latency misses NFR-002 — never a change made inside this requirement
+  - no reasoning-effort, verbosity, or other per-model request parameter is added to the provider call: `openAiResponsesProvider.ts` sends model and prompt only, so reasoning models (the gpt-5 family, `gpt-6-luna`) run at their default reasoning effort in this run, and the run records the effort the provider reports. A reasoning-effort setting is a follow-up package, opened only if a reasoning model wins on correctness and its recorded latency misses NFR-002 — never a change made inside this requirement
```

```diff
 - Dependencies:
   - REQ-186 (the judging it invokes)
   - REQ-189 (the artifact it writes)
   - REQ-190 (the excerpt-cap legs it runs)
   - NFR-018 (the non-gating validation track this belongs to)
+  - REQ-226 (experiment mode)
+  - REQ-227 (unpriced models and the spending cap)
```

```diff
 - Notes:
+  - measured 2026-10-07: `loadPromptResources` (`scripts/lib/prompt-fidelity.mjs`) loaded four data files and no combo catalog while production loads the catalog by default (`createConfiguredApp.ts`, `comboEnrichmentEnabled` true when `COMBO_ENRICHMENT_ENABLED` is unset, which `scripts/aws-deploy.sh` leaves unset). Corrected by the `answer-quality-investigation` package
```

- Verdict: edit
- Reason: Keep the combo-catalog parity (the evaluation prompt must be byte-identical to the one production builds), the experiment-mode selection, reasoning-token recording, and unpriced reporting. Drop the production timeout/retry criterion: evaluation answer calls keep the SDK defaults, and runtime suitability is read from the recorded latency and REQ-228's slower-than-15-seconds count instead.

---

## REQ-189 — the scorecard records full rule coverage; experiment runs keep out

**What this decides:** two additions to the committed answer scorecard file,
and a rule that experiment runs never write to it.

**In plain terms:** the committed scorecard keeps each case's latest grade and
run details, numbers only (REQ-189). Its `goldRuleInPrompt` flag says only that
one of the case's deciding rules was picked by the search — not that all of
them reached the AI. This adds `allDecidingRulesInPrompt` (every deciding rule's
text is somewhere in the prompt) beside it, plus reasoning tokens, the reported
reasoning effort, and an "unpriced" marker instead of a $0 cost. Experiment
runs (REQ-226) never touch this file; their results stay in their own folders.

**What happens if you say no:** the scorecard keeps reporting partial rule
coverage as a hit, and experiment results could overwrite routine grades.

Proposed diff — `PRD/sections/functional-requirements.md`, REQ-189:

```diff
-  - it carries: run-level metadata for the latest run (selection mode, the case ids that run graded, the answer-model lineup, judge model id, whether the judge matches an answer model, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, git commit, UTC timestamp, total input/output token usage and total cost with answer and judge shown separately); per leg — a leg is one answer model at one excerpt cap — the model id, the excerpt cap, the recorded-case count, the count scoring Correctness 2, and the headline counts REQ-187 defines; per case per leg, the case's tier, the four axis scores (or an `undetermined` flag in place of them), the `namesGoldRuleId` assertion, the list of cited rule ids not in the committed rule index (REQ-186), `goldRuleInPrompt` (whether one of the case's deciding rule ids was among the System 3 excerpts the prompt carried, read from the production enrichment debug block — the retrieval half of a miss, separated from the answer half), prompt characters, the prompt hash (SHA-256 of the assembled prompt text), the reference-answer hash (SHA-256 of the case's `expected.answer` it was judged against), answer and judge input/output token usage, wall-clock latency in milliseconds, the blind rank when REQ-186's side-by-side pass ran, the judge model, rubric revision and `EMBEDDING_PROVIDER` it was judged under, and the record's own UTC timestamp and git commit
+  - it carries: run-level metadata for the latest run (selection mode, the case ids that run graded, the answer-model lineup, judge model id, whether the judge matches an answer model, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, whether the combo catalog was loaded, the answer client's timeout and retry count, git commit, UTC timestamp, total input/output/reasoning token usage and total cost with answer and judge shown separately); per leg — a leg is one answer model at one excerpt cap — the model id, the excerpt cap, the recorded-case count, the count scoring Correctness 2, and the headline counts REQ-187 defines; per case per leg, the case's tier, the four axis scores (or an `undetermined` flag in place of them), the `namesGoldRuleId` assertion, the list of cited rule ids not in the committed rule index (REQ-186), `goldRuleInPrompt` (whether one of the case's deciding rule ids was among the System 3 excerpts the prompt carried, read from the production enrichment debug block — the retrieval half of a miss, separated from the answer half), `allDecidingRulesInPrompt` (whether every deciding rule's text appears anywhere in the final prompt — curated topic, supplemental excerpt, or card ruling — by REQ-229's check), prompt characters, the prompt hash (SHA-256 of the assembled prompt text), the reference-answer hash (SHA-256 of the case's `expected.answer` it was judged against), answer and judge input/output/reasoning token usage, the reasoning effort the provider reported for the answer (when it reported one), the answer and judge cost or an `unpriced` flag in place of either (REQ-227), wall-clock latency in milliseconds, the blind rank when REQ-186's side-by-side pass ran, the judge model, rubric revision and `EMBEDDING_PROVIDER` it was judged under, and the record's own UTC timestamp and git commit
```

Insert one criterion directly after the unchanged merge criterion (the one that
begins "a recorded run **merges** into the committed results file"):

```diff
   - a recorded run **merges** into the committed results file (`mergeCaseLegScores` in `scripts/lib/answer-quality-run.mjs`, then `writeResultsFile`): each graded case's record for that leg replaces its previous record, every other case's record is kept unchanged, and the run-level metadata describes the latest run. A case removed from the corpus or no longer `approved` is dropped from the file on the next recorded run. A record without a prompt hash or reference-answer hash (every record written before this change) is kept until its case is graded again; it counts as ungraded in the headline (REQ-187) and is selected by `--changed` (REQ-188). Run-to-run history is the file's git history, so a comparison of two runs is a git diff
+  - an experiment run (REQ-226) never reads or writes this file; its records, transcripts, and numbers-only summary live in its own gitignored run folder `output/answer-quality/runs/<run-id>/`, and two experiment runs are compared by the paired report (REQ-228), not by a git diff
```

```diff
 - Dependencies:
   (earlier entries unchanged)
   - REQ-224 (the review apply command that rewrites the coverage file)
+  - REQ-226 (the experiment runs that write elsewhere)
+  - REQ-229 (the availability check behind `allDecidingRulesInPrompt`)
```

- Verdict: accept
- Reason: 

---

## NFR-018 — the validation track names its new comparison tools

**What this decides:** whether the quality-validation commitment that the
rules test corpus belongs to lists the new comparison tools among its parts.

**In plain terms:** NFR-018 is the standing promise that prompt and answer
quality are checked against hard rules questions with approved answers — a
free offline half that can block a pull request, and a paid answer half that
never can. This adds one sentence naming the new pieces — named comparison
runs, the before/after report, the offline evidence trace, and the test-only
prompt variants — all on the never-blocking side, and lists them as
dependencies. Nothing about what blocks a build changes.

**What happens if you say no:** the tools still work, but the validation
track's description omits them.

Proposed diff — `PRD/sections/non-functional-requirements.md`, NFR-018:

```diff
-- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by hard rules questions that carry an approved correct answer — official Comprehensive Rules or WotC ruling text wherever it exists, an owner-approved answer otherwise — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The cases are curated into one committed rules test corpus (REQ-185); they are test data, never runtime retrieval. The corpus is read two ways: an offline prompt gate (REQ-222, REQ-223) that checks whether every attached card and the deciding rule reached the prompt and whether every real mechanic has a case, and the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's approved answer — so this track measures both halves: whether the right material reached the prompt, and whether the answer built from it is correct.
+- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by hard rules questions that carry an approved correct answer — official Comprehensive Rules or WotC ruling text wherever it exists, an owner-approved answer otherwise — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The cases are curated into one committed rules test corpus (REQ-185); they are test data, never runtime retrieval. The corpus is read two ways: an offline prompt gate (REQ-222, REQ-223) that checks whether every attached card and the deciding rule reached the prompt and whether every real mechanic has a case, and the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's approved answer — so this track measures both halves: whether the right material reached the prompt, and whether the answer built from it is correct. For deliberate comparisons — a data refresh, a prompt change, or two models — the answer half also offers named experiment runs with fixed case lists, checkpointing and a spending cap (REQ-226, REQ-227), a paired before/after report (REQ-228), and labelled diagnostic prompt arms confined to a diagnostic case set apart from a held-out set (REQ-230); the prompt half adds an offline evidence trace that shows where each deciding rule ranked and whether its text reached the prompt (REQ-229). None of these is a build gate.
```

```diff
 - Dependencies:
   (earlier entries unchanged)
   - REQ-222, REQ-223, REQ-224, REQ-225 (the offline prompt gate, the coverage gate, the owner review flow, and the staleness report over that corpus)
+  - REQ-226, REQ-227, REQ-228, REQ-229, REQ-230 (experiment runs, checkpoint and spending cap, the paired comparison report, the evidence trace, and the diagnostic arms over that corpus)
```

- Verdict: accept
- Reason: 

---

## Blocker questions

None. The spending cap for each paid phase and the choice of grading model are
owner inputs before the first paid run (`DESIGN-BRIEF.md` §5–§7), not decisions
this proposal needs: the smaller option — no spend — decides no player-facing
behavior.
