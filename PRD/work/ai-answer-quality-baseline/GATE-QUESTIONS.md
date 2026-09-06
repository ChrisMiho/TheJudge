# Gate questions — ai-answer-quality-baseline

**Decide.** Ten blocks below. Six reserve new requirements, four amend product
truth that this change would otherwise leave untrue. Mark each `- Verdict:` with
`accept`, `edit`, or `reject`; `edit` and `reject` need a `- Reason:`.

Nothing here has been written to `PRD/sections/`. Implementation applies your
answers alongside the code.

Design brief: `DESIGN-BRIEF.md`. Every number cited below was measured on
2026-09-06 with the same code path the criterion mandates; the measurements and
their commands are in the brief's `## Measurements made for this brief`.

---

## REQ-185 — the six hard rules cases the instrument grades against

**What this decides:** which questions the answer-quality run asks, and what a
question must carry before it is allowed to join that set.

**In plain terms:** the app already ships six real, hard Magic rules questions
whose *official published answer* is committed alongside them — the
Comprehensive Rules' own worked examples, curated under the rule that the
worked-solutions set is committed test data and never reaches a live player
(NFR-018). Today those six are only used to check that the right rule reached
the prompt. This makes them the gold set the new run grades answers against.
There are also ten hand-authored test scenarios that carry retrieval labels
(which rules should be found — REQ-032), but measured 2026-09-06, **not one of
them carries a correct answer of any kind**. So this recommends adding none of
them yet, and setting the bar for joining later: a case needs a *published,
citable* correct answer, never one an agent wrote. Six cases is a small set and
this says so; the growth path is more published worked examples, not invented
answers.

**What happens if you say no:** there is no gold set, and the run has nothing to
grade against. Rejecting this rejects the package.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-184's final note @@
+
+### REQ-185
+- Title: Answer-quality gold set
+- Priority: medium
+- Description: The answer-quality baseline (NFR-018) grades model answers against a committed gold set of rules questions that each carry a published, citable correct answer. The set is seeded by the six worked-solution cases already committed under `apps/backend/src/eval/worked-solutions/`, whose `workedSolution` field is the Comprehensive Rules' own worked example text verbatim. No case may enter the set with a hand-authored answer key.
+- Acceptance Criteria:
+  - the gold set is exactly the six `apps/backend/src/eval/worked-solutions/*.case.json` cases at first ship: `delayed-trigger-created-too-late` (603.7a), `illegal-target-partial-resolution` (608.2b), `last-known-information-simultaneous-sba` (704.8), `layers-timestamp-order` (613.9), `replacement-effect-single-application` (614.5), `state-based-actions-mid-resolution` (704.4)
+  - a gold case is valid only when it carries a non-empty `question`, a non-empty `workedSolution` (the reference answer), a `source` block naming publisher, rule id, and licensing, and at least one `expectedSupplementalRuleIds` entry; a test asserts all four for every case, so a malformed case fails loudly rather than scoring as a miss
+  - the ten labelled eval fixtures (`cascade-keyword`, `combat-deathtouch`, `counterspell-stack`, `quick-lookup-card`, `quick-lookup-multi-card`, `quick-lookup-multi-keyword-card`, `quick-lookup-no-card`, `quick-lookup-off-domain`, `state-based-actions`, `upkeep-trigger`) are recorded as **needing an answer key** and are not in the gold set; measured 2026-09-06, every one of them carries only retrieval labels (`expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, `forbiddenSupplementalRuleIds`) and no answer of any kind
+  - the set grows only by adding cases whose correct answer is published by an authoritative source and cited in the case's `source` block, under the same licensing resolution NFR-018 already required; an answer written by a contributor or an agent is never ground truth
+  - `apps/backend/src/eval/worked-solutions/README.md` is updated in the same change: its statement that a miss is "not a claim that the model's eventual answer was wrong (that would require a live provider call, which this track does not make)" is no longer true once the answer-quality run exists, and the README must describe both uses of the set
+- Constraints:
+  - the gold cases remain committed evaluation data; they never enter a live prompt, never reach a real player, and add no runtime dependency or external call (NFR-018)
+  - the retrieval check `npm run eval:worked-solutions` keeps working unchanged over the same files; the answer-quality run is a second reader of the same data, not a replacement
+  - no case is added, edited, or removed to make a score look better
+- Dependencies:
+  - NFR-018 (the worked-solutions validation track this extends)
+  - REQ-186 (the judge that grades against these cases)
+  - REQ-032 (the labelled fixtures recorded here as needing an answer key)
+- Notes:
+  - measured 2026-09-06: all six cases carry a `workedSolution` of 187–592 characters and exactly one expected rule id; 31 eval fixtures exist, 10 carry an `expected` block, and 0 carry an answer
+  - the same six cases are already the gold half of REQ-177's 156-pair retrieval benchmark (150 synthetic pairs plus these 6), so the answer instrument and the retrieval benchmark share their ground truth rather than maintaining two sets
+  - six cases is a deliberately small seed. It is honest signal on hard cases rather than broad signal on easy ones, and the entry bar above is what keeps it honest as it grows
```

- Verdict:
- Reason:

---

## REQ-186 — how an answer is judged right or wrong

**What this decides:** what actually decides whether the model's answer was
correct — a second model reading it, a person reading it, mechanical checks, or
all three.

**In plain terms:** you asked for this to be decided here. The recommendation is
**all three, in a fixed order.** First, free mechanical checks that need no
model: did the answer mention the official rule number the published solution
comes from? Second, a second model call — the "judge" — which is handed the
question, the model's answer, **and the published official answer**, and asked
only whether they agree. It is never asked whether it knows the Magic rules,
which is the failure mode that makes model-judging untrustworthy; grounding it
in the published text turns a knowledge test into a comparison. Third, the run
writes everything down and a person reads it, and only that dated human
conclusion becomes durable project history — the same posture the existing combo
answer-quality comparison already uses (REQ-146). The judge model and the rubric
text are stamped into every run, so two runs are only ever compared when the
same judge scored both.

The alternatives: a model judge alone is cheap but drifts silently, so a judge
change would look like a quality change. A human pass alone does not scale past
six cases and produces no comparable number. Mechanical checks alone cannot see
hedging, grounding, or whether a player could act on the answer.

**What happens if you say no:** the run generates answers but nothing scores
them, so two runs cannot be compared and the instrument does not exist.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-185's final note @@
+
+### REQ-186
+- Title: Answer-quality judging is grounded, layered, and human-confirmed
+- Priority: medium
+- Description: Each answer produced by an answer-quality run is scored by three layers in order — deterministic assertions, a reference-grounded model judge, and a human review pass over the written record. The model judge is given the gold case's published worked solution as the reference answer and asked only whether the model's answer agrees with it; it is never asked to rule on Magic rules from its own knowledge.
+- Acceptance Criteria:
+  - layer 1, deterministic and free: for each gold case the run records whether the answer names the gold rule id, whether it is non-empty, and its length; these need no model call and are computed identically on every run
+  - layer 2, the model judge: one call per answer, carrying the question, the assembled prompt's supplemental rule ids, the model's answer, the case's `workedSolution` as the reference answer, and the rubric (REQ-187); it returns a score per axis plus a one-paragraph rationale
+  - the judge is instructed that the reference answer is authoritative and that its task is agreement, not independent adjudication; a judge that cannot decide returns an explicit `undetermined` rather than guessing, and `undetermined` is reported, never silently counted as a pass or a fail
+  - the judge model is selected by its own explicit setting, recorded in the run artifact, and defaults to the configured answer model when unset — mirroring the explicit-selection seam `ASK_AI_PROVIDER` and `EMBEDDING_PROVIDER` already use, so a judge change is visible in the artifact rather than invisible in a score
+  - the rubric text carries a revision identifier, recorded in the run artifact; two runs are comparable only when their judge model and rubric revision match, and the run tooling says so explicitly when they do not
+  - layer 3, the human pass: the run writes the full per-case record (prompt, answer, reference answer, assertions, judge scores, judge rationale) for review, and only the dated human-reviewed conclusion becomes durable project history — matching REQ-146's posture for the combo answer-quality comparison
+  - the judge call is evaluation tooling only: it does not use `AskAiProvider`, does not build an `AskAiRequest`, and does not touch any product code path
+- Constraints:
+  - never auto-gate or fail a build on a judge score (REQ-188)
+  - no new dependency: the judge uses the `openai` package the backend already depends on, and reads credentials from the environment; no key is ever committed
+  - the judge never sees which excerpt-cap leg produced an answer, so the cap comparison (REQ-190) is not biased by the label
+  - a judge failure (provider error, malformed response) is recorded as `undetermined` for that case; the run continues and reports how many cases were undetermined
+- Dependencies:
+  - REQ-185 (the gold cases and their reference answers)
+  - REQ-187 (the rubric the judge scores against)
+  - REQ-188 (the command that runs it and its cost posture)
+  - REQ-146 (the human-reviewed, never-gating precedent this follows)
+- Notes:
+  - the alternatives considered and rejected: a model judge alone drifts, so a judge swap would read as a quality change; a human pass alone does not scale past six cases and yields no comparable number; assertions alone cannot see hedging, grounding, or readability
+  - grounding the judge in the published worked solution is what makes a model judge defensible here. It is only possible because every gold case already carries that text (REQ-185), and it is the reason the gold set may never accept a hand-authored answer key
```

- Verdict:
- Reason:

---

## REQ-187 — what a good answer is scored on

**What this decides:** the handful of things the judge scores each answer on,
and which single number the run reports as its headline.

**In plain terms:** four things, each scored 0, 1, or 2. **Correctness** — does
the answer reach the same outcome as the published official answer. **Grounding**
— does it use the rule excerpts the app actually attached, and does it name the
official rule number. **Calibration** — does it hedge where the official answer
is definite, or state something flatly where the rules are genuinely unsettled.
**Readability** — could a player at a table act on it. Only *correctness*
becomes the headline number ("4 of 6 fully correct"), so a run has one figure
you can compare; the other three are diagnostic, there to explain *why* a score
moved. The intake also suggested an axis for citing WotC card rulings — dropped,
because measured 2026-09-06 all six gold cases come from Comprehensive Rules
worked examples and none involves a card ruling, so that axis would score zero
cases and add noise.

**What happens if you say no:** the judge has no rubric, so REQ-186 cannot run
and the scores are not comparable between runs.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-186's final note @@
+
+### REQ-187
+- Title: Answer-quality scoring axes
+- Priority: medium
+- Description: An answer-quality run scores each answer on four axes, each 0–2, against the gold case's published worked solution. Correctness is the run's single headline figure; the other three axes are diagnostic and explain movement rather than defining it.
+- Acceptance Criteria:
+  - **Correctness (0–2)** — 2: reaches the same outcome as the published worked solution; 1: partially right, or right with a material error or omission; 0: reaches a different outcome. This is the only axis that produces the headline figure
+  - **Grounding (0–2)** — 2: the answer's reasoning uses the supplemental rule excerpts the prompt actually attached and names the gold rule id; 1: uses them without naming the rule, or names it without using it; 0: neither
+  - **Calibration (0–2)** — 2: as definite as the published solution is, and no more; 1: over-hedged or mildly overconfident; 0: refuses a question the reference answers, or states a firm answer the reference does not support
+  - **Readability (0–2)** — 2: a player at a table can act on it as written; 1: correct but needs re-reading; 0: unusable at a table
+  - the headline figure a run reports is the count of gold cases scoring Correctness 2, out of the gold-set size, per excerpt-cap leg — for example `4/6 fully correct at cap 5, 3/6 at cap 10`
+  - the deterministic assertion `namesGoldRuleId` (REQ-186 layer 1) is recorded per case alongside the axes and is not folded into any axis score
+  - no axis for WotC card-ruling citation is defined: measured 2026-09-06, all six gold cases are sourced from Comprehensive Rules worked examples and none turns on a card ruling, so such an axis would score zero cases. It may be added when a gold case that turns on a card ruling enters the set
+  - the four axis names, their 0/1/2 definitions, and the rubric revision identifier live in one committed rubric file and are the exact text sent to the judge; the run artifact records that revision (REQ-186)
+- Constraints:
+  - no axis is ever combined into a single weighted quality score; a weighted composite hides which axis moved and invites tuning the weights instead of the product
+  - no numeric pass threshold is set on any axis (REQ-188); the first run's scores are the recorded baseline
+  - axes are added or changed only by amending this requirement and bumping the rubric revision, so a score change and a rubric change are never confused
+- Dependencies:
+  - REQ-186 (the judge that applies these axes)
+  - REQ-185 (the reference answers they are scored against)
+  - REQ-189 (the artifact that records them)
+- Notes:
+  - the intake's candidate axes were rules correctness, use of supplied context, citation of WotC rulings/CR, hedging vs. overconfidence, and length/readability (`PRD/work/ai-answer-quality-baseline/intake/IDEA.md`). Four survive as the axes above; the WotC-ruling axis is dropped for the measured reason recorded in the criteria
+  - the deliberate choice of a 0–2 scale over a wider one: with six cases, a finer scale invents precision the sample cannot support, and a coarse scale is what a human reviewer can confirm or overturn on the third layer
```

- Verdict:
- Reason:

---

## REQ-188 — an on-demand command that costs pennies and never blocks a build

**What this decides:** how a run is started, what it costs, and the promise that
it can never fail a build.

**In plain terms:** one command you type when you want it —
`npm run eval:answer-quality` — and never anything CI runs. Typing it with no
flag prints the plan and the cost estimate and makes **no** call; it only
contacts the provider with an explicit `--confirm-live-calls` flag, exactly as
the existing combo comparison script already works (REQ-146). Cost, estimated
from the real measured prompt sizes: the six gold prompts are 9,438–12,628
characters, mean 10,754, so a two-leg run (five excerpts versus ten) is roughly
**4 cents** on the small model the app defaults to and roughly **19 cents** on a
full-size one. Those are estimates from character counts, not a measurement —
so this sets **no cost target at all**; the first real run records its own actual
token usage and dollar cost, and that becomes the number every later run is
compared against. It also records everything needed to make two runs comparable:
which model answered, which model judged, which rubric, which excerpt cap, which
retrieval setting, and which commit.

**What happens if you say no:** there is no way to start a run, and no rule
keeping model output out of the build gate.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-187's final note @@
+
+### REQ-188
+- Title: Answer-quality runs are on demand, confirmation-gated, and never a build gate
+- Priority: medium
+- Description: The answer-quality baseline is an explicitly invoked command, never scheduled and never wired into any automated gate. It refuses to contact the provider without an explicit confirmation flag, and records enough run metadata that two runs are comparable or are reported as incomparable.
+- Acceptance Criteria:
+  - the run is invoked as `npm run eval:answer-quality`; with no confirmation flag it prints the plan and the estimated cost, makes no network call, and exits 0
+  - it contacts the provider only with an explicit `--confirm-live-calls` flag, mirroring the gate `scripts/compare-combo-answer-quality.mjs` already ships (REQ-146)
+  - with the confirmation flag but without `ASK_AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`, it fails with an actionable message naming what is missing, not a stack trace from inside the provider factory
+  - the mock-first default is preserved: `ASK_AI_PROVIDER` unset stays `mock`, and a checkout with no key and no network can still run the dry plan (canonical mock-first rule, `integrations-and-data.md` Tech Stack)
+  - it is never added to `npm run quality:check`, `npm test`, `npm run test:eval`, `npm run coverage:check`, or `npm run test:scripts`, and never asserted against a golden; a test asserts the command appears in none of those scripts
+  - provider calls are made sequentially, not concurrently, so a run stays inside the provider's per-minute token limit
+  - every run records, in the artifact (REQ-189): gold-set case ids and count, answer model id, judge model id, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, excerpt cap per leg, git commit, UTC timestamp, per-call prompt characters, per-call input and output token usage, and the run's total token usage and cost
+  - the run tooling reports two runs as **incomparable** when their gold set, answer model, judge model, rubric revision, or `EMBEDDING_PROVIDER` differ, rather than presenting a misleading delta
+  - **no numeric quality target is set by this requirement.** The first live run's scores, token usage, and dollar cost are the recorded baseline that later runs are judged against, in the same way REQ-177 records a retrieval baseline rather than deriving one
+- Constraints:
+  - never auto-score, auto-gate, or fail a build on model answer content (REQ-146, `goals-and-non-goals.md`)
+  - no scheduled or automatic invocation of any kind
+  - no secret is committed; credentials are read from the environment as today
+  - no new dependency: the run uses the already-present `openai` package and existing backend modules
+  - no `AskAiRequest`, Zod schema, route, endpoint, provider-selection, or frontend change
+- Dependencies:
+  - REQ-186 (the judging it invokes)
+  - REQ-189 (the artifact it writes)
+  - REQ-190 (the excerpt-cap legs it runs)
+  - NFR-018 (the non-gating validation track this belongs to)
+- Notes:
+  - measured 2026-09-06, offline, with `EMBEDDING_PROVIDER=local` and the production `preparePromptInput` path: the six gold prompts are 9,438 / 9,980 / 10,577 / 10,712 / 11,186 / 12,628 characters, mean 10,754. Prompt size is a measurement; the token and dollar figures below are an **estimate** derived from it at roughly four characters per token, since no tokenizer is a dependency of this repo
+  - estimated cost of a two-leg (cap 5 and cap 10) run over six cases: about 54,000 input and 11,000 output tokens across 24 sequential calls — roughly $0.04 at a mini-class published price of $0.40/$1.60 per million tokens, roughly $0.19 at a `gpt-4.1`-class published price of $2.00/$8.00 per million. The code default when `OPENAI_MODEL` is unset is `gpt-4.1-mini` (`apps/backend/src/providers/createAskAiProvider.ts`). Re-check published pricing before the first run; the run's own recorded usage supersedes this estimate
```

- Verdict:
- Reason:

---

## REQ-189 — a small committed scorecard, and the transcripts kept out of git

**What this decides:** what a run leaves behind, and which part of it is
committed to the repository.

**In plain terms:** two things, split the way the repo already splits this kind
of output. A **small numbers-only file** is committed next to the existing
retrieval benchmark results, holding the scores and the run's settings and
nothing the model wrote — so a diff between two runs is a few readable lines and
can never break on the model phrasing something differently. The **full
transcripts** — every prompt, every answer, every judge rationale — go to a
folder git already ignores, alongside the prompt-preview and combo-comparison
output that lives there today. Nothing is ever compared byte-for-byte against a
stored answer; the committed file is a record, not a test.

**What happens if you say no:** a run's result lives only in a terminal, so
nothing is comparable across time and the instrument is single-use.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-188's final note @@
+
+### REQ-189
+- Title: Answer-quality run artifact
+- Priority: medium
+- Description: An answer-quality run writes a small committed machine-readable scores file and a gitignored human-readable transcript set. The committed file carries scores and run metadata only — no model prose — so two runs diff cleanly and no run output can become a brittle golden.
+- Acceptance Criteria:
+  - the committed file is `apps/backend/src/eval/answer-quality/results.json`, alongside and shaped after the existing committed retrieval results (`apps/backend/src/eval/benchmark/results.json`, `semantic-results.json`), which commit only counts, scores, a timestamp, and a method label
+  - it carries: the run metadata REQ-188 requires; per leg, the excerpt cap and the headline count of cases scoring Correctness 2; per case, the four axis scores, the `namesGoldRuleId` assertion, an `undetermined` flag, prompt characters, and token usage
+  - it carries **no** model prose: no answer text, no judge rationale, no prompt text
+  - the full transcripts — assembled prompt, model answer, reference worked solution, assertions, axis scores, and judge rationale per case per leg — are written to `output/answer-quality/`, which is gitignored, following the existing `output/prompt-preview/`, `output/retrieval-relevance-report.txt`, and `output/combo-answer-quality/` convention
+  - no committed artifact is asserted against a stored answer, a stored score, or a golden of any kind; a test asserts the results file is readable and complete, never that its values equal a previous run's
+  - a dry run writes nothing
+  - the committed results file is replaced, not appended, by each recorded run; run-to-run history is the file's git history, so a comparison of two runs is a git diff
+- Constraints:
+  - the committed file must stay small enough to review in a pull request diff by eye
+  - it is evaluation data and tooling; it never becomes runtime prompt context and adds no runtime dependency or external call
+  - only the dated human-reviewed conclusion becomes durable project history (REQ-186, REQ-146)
+- Dependencies:
+  - REQ-187 (the axes it records)
+  - REQ-188 (the run metadata it records)
+  - REQ-177 (the committed-benchmark-result convention it follows)
+- Notes:
+  - measured 2026-09-06: `apps/backend/src/eval/benchmark/results.json` and `semantic-results.json` are numeric-only files carrying `n`, `k`, per-condition `recall5` and `mrr`, `scoredAt`, and `method` — the shape this follows. `.gitignore` already excludes `output/prompt-preview/`, `output/retrieval-relevance-report.txt`, and `output/combo-answer-quality/`
+  - the split exists because model prose is the part that changes every run for reasons unrelated to quality; keeping it out of git is what makes the committed record diffable rather than noisy
```

- Verdict:
- Reason:

---

## REQ-190 — testing whether more attached rules helps or distracts

**What this decides:** whether the run can ask the same six questions twice —
once with the five rule excerpts the app attaches today, once with more — and
whether the app's own limit of five changes as a result.

**In plain terms:** when a player asks a rules question, the app attaches up to
five official rule excerpts to the prompt. Nobody knows whether attaching more
would help the answer or just crowd it with near-misses. This makes the number a
**setting of the test run only** — the deployed app stays at five until a run and
a later decision say otherwise. Two measured facts shape this. First, the extra
excerpts cost real prompt space: going from five to ten adds an average of about
2,600 characters per question. Second — and this is the important one — on all
six gold questions the correct rule is **already inside the top five**, and stays
there at six, eight, ten, and fifteen. So a bigger cap cannot add the missing
rule on this set; it can only add wrong ones next to the right one. **The
experiment therefore measures distraction, not recall.** That is a question no
retrieval score can answer, which is exactly why it belongs to this instrument.

The retrieval figures in the driver's context note (`intake/answer-quality-context.md`)
— the right rule in the top 5 for 89.7% of a 156-question benchmark, top 10 for
94.2%, with 9 questions never reaching the top 10 — are cited as evidence for why
the question is live. They are **not adopted** as product truth here.

**What happens if you say no:** the run still scores answers, but the five-versus-more
question stays unanswerable and the driver's recommendation to keep five stands
with no way to ever test it.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-189's final note @@
+
+### REQ-190
+- Title: The System 3 excerpt cap is a parameter of the answer-quality run
+- Priority: medium
+- Description: An answer-quality run may answer the same gold case at more than one System 3 supplemental-excerpt cap and score the legs side by side, so the effect of attaching more rule excerpts on the *answer* can be observed. Production retrieval is unchanged: System 3 stays capped at five excerpts (REQ-181, REQ-182, `system-map/game-rules-retrieval.md`).
+- Acceptance Criteria:
+  - the run accepts an excerpt-cap option, default 5, and may be given more than one value; each value is one leg, and every gold case is answered once per leg in the same run
+  - at cap 5 the assembled prompt is byte-identical to the production prompt for the same request; a test asserts this per gold case
+  - a larger cap reuses the identical production ranking rather than re-ranking: `retrieveRulesForQueryWithDebug` already returns `runnerUp` as ranks 6–15 of the same scored list, so no scoring, query construction, corpus, or embedding behaviour changes for the experiment
+  - the four hard-coded `5` literals in `apps/backend/src/prompt/preparation.ts` are replaced by one named, exported constant that both production and the run read, so the two cannot drift apart (`instructions/technical-design-rules.md`, reuse before creating); this is the only production-code change the excerpt experiment makes, and it is behaviour-preserving
+  - the run artifact records the cap per leg and reports the headline correctness count per leg (REQ-189)
+  - the deployed cap stays 5. Changing it requires a recorded run showing a larger cap scored better, and an amendment to REQ-182 and `system-map/game-rules-retrieval.md` — never a change made inside this requirement
+- Constraints:
+  - no change to System 3 query construction (REQ-178), scoring or blending (REQ-182), the committed corpus or embeddings (REQ-181, REQ-183), or the System 2 deduplication (REQ-179)
+  - NFR-002's under-three-second answer target is untouched: the larger cap exists only inside an offline evaluation run and never in a request a player makes
+  - the judge is not told which leg produced an answer (REQ-186)
+- Dependencies:
+  - REQ-182 (the hybrid ranking whose top-N the legs slice)
+  - REQ-181 (the five-excerpt cap and the retrieval seam)
+  - REQ-188 (the run that executes the legs)
+  - REQ-032 (the retrieval measurement this deliberately does not replace)
+- Notes:
+  - measured 2026-09-06 on the six gold cases, `EMBEDDING_PROVIDER=local`, production `preparePromptInput` with `usedSemantic: true`: the expected rule is inside the top 5 for 6 of 6 cases and stays 6 of 6 at caps 6, 8, 10, and 15. So on this set a larger cap cannot add a missing rule — the experiment measures whether extra, lower-confidence excerpts *distract* the model, not whether they improve recall
+  - measured the same day: the supplemental-rules section grows from 21,385 to 37,141 characters across the six cases between cap 5 and cap 10, a mean of about +2,626 characters (roughly 660 tokens) per prompt — the size cost the experiment is weighing the answer benefit against
+  - the driver's context note (`PRD/work/ai-answer-quality-baseline/intake/answer-quality-context.md`) records benchmark recall by depth on 2026-09-06 as top-5 89.7%, top-6 89.7%, top-7 90.4%, top-8 91.0%, top-10 94.2%, with 9 of 156 never reaching the top 10, and excerpts averaging about 70 tokens. Cited as the evidence that the question is worth asking; not adopted as a measurement of this repository's product truth
```

- Verdict:
- Reason:

---

## NFR-018 — the worked-solutions track now checks the answer, not just the prompt

**What this decides:** whether the existing rule that says "we validate the app
against real published worked solutions" grows to cover the answer the player
reads, or stays limited to checking the prompt.

**In plain terms:** NFR-018 today says the six committed hard cases exist to
validate *prompt and retrieval* quality — did the right rule reach the prompt —
and states plainly that this is a reporting track and never a build gate. Every
piece of that stays true. This adds the second half: the same six cases now also
validate the *answer*, through the new run. The never-a-build-gate promise is
carried forward word for word and extended to answer scores, so a wrong answer
can never fail CI.

**What happens if you say no:** the durable rule keeps saying the worked-solutions
set validates only the prompt, while the code has an answer-quality run reading
the same files — product truth and behaviour disagree.

**Current** (`PRD/sections/non-functional-requirements.md`, NFR-018 — title,
description, third constraint, dependencies, and notes; byte-for-byte):

```markdown
### NFR-018
- Title: Prompt quality is validated against real worked rules solutions
- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by real-world hard rules questions that carry published worked solutions — the kind found in public rules-Q&A and judge resources — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The worked solutions are curated into a committed evaluation set and run through the existing eval harness; they are test data, never runtime retrieval.
- Constraints:
  - The worked-solutions set is committed evaluation data (fixtures) fed through the existing eval harness (REQ-032 / DEC-047); it never becomes runtime prompt context and adds no new runtime dependency or external call.
  - Specific sources and their licensing/attribution are resolved at implementation before any data is committed; only data licensed for this use is committed.
  - This is a quality/validation track that reports where the prompt fails hard cases and guides tuning; it is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B).
- Dependencies:
  - REQ-032, DEC-047 (eval harness and labeled-outcome evaluation)
  - REQ-022, DEC-046 (retrieval the validation set exercises)
- Notes:
  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, remains deferred and is an explicit non-goal of the RAG retrieval gameplan (REQ-177 through REQ-181); see REQ-168's note for where it stands.
  - The RAG gameplan's own measurement work (REQ-177) commits an offline labelled question-to-rule benchmark. That benchmark and this worked-solutions set are complementary: the benchmark measures whether the right rule was retrieved, this set measures whether the assembled prompt resolves a hard case correctly.
```

**Replacement** (complete):

```markdown
### NFR-018
- Title: Prompt and answer quality are validated against real worked rules solutions
- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by real-world hard rules questions that carry published worked solutions — the kind found in public rules-Q&A and judge resources — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The worked solutions are curated into a committed evaluation set and run through the existing eval harness; they are test data, never runtime retrieval. The same committed set is read a second way by the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's published worked solution — so this track now measures both halves: whether the right rule reached the prompt, and whether the answer built from it is correct.
- Constraints:
  - The worked-solutions set is committed evaluation data (fixtures) fed through the existing eval harness (REQ-032 / DEC-047); it never becomes runtime prompt context and adds no new runtime dependency or external call.
  - Specific sources and their licensing/attribution are resolved at implementation before any data is committed; only data licensed for this use is committed.
  - This is a quality/validation track that reports where the prompt fails hard cases and guides tuning; it is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B). This applies unchanged to the answer half: an answer score is never asserted against a golden and never fails a build (REQ-188).
  - The retrieval half stays offline and makes no provider call. The answer half necessarily makes live provider calls, and is therefore explicitly invoked, confirmation-gated, and never scheduled or wired into any automated gate (REQ-188); the mock-first default is preserved, so a checkout with no key and no network still runs the retrieval half and the answer half's dry plan.
  - A case enters the set only with a published, citable correct answer; a hand-authored answer key is never ground truth (REQ-185).
- Dependencies:
  - REQ-032, DEC-047 (eval harness and labeled-outcome evaluation)
  - REQ-022, DEC-046 (retrieval the validation set exercises)
  - REQ-185 (the gold set this track's cases now serve as)
  - REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 (the answer-quality baseline built on that set)
- Notes:
  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, remains deferred and is an explicit non-goal of the RAG retrieval gameplan (REQ-177 through REQ-181); see REQ-168's note for where it stands.
  - The RAG gameplan's own measurement work (REQ-177) commits an offline labelled question-to-rule benchmark. That benchmark and this worked-solutions set are complementary: the benchmark measures whether the right rule was retrieved, this set measures whether the assembled prompt resolves a hard case correctly.
  - Measured 2026-09-06 on the six committed cases, under the deployed hybrid retrieval path (`EMBEDDING_PROVIDER=local`, `usedSemantic: true`): the expected rule is inside the System 3 top five for 6 of 6 cases and stays 6 of 6 at depths 6, 8, 10, and 15. The retrieval half of this track is therefore saturated on this set, which is what makes the answer half the only remaining source of signal from it.
```

- Verdict:
- Reason:

---

## SYSTEM-MAP-EVAL-HARNESS — the system map lists the new instrument

**What this decides:** whether the map of what the app is made of mentions the
answer-quality baseline, or leaves it invisible.

**In plain terms:** `system-map.md` has an entry describing the evaluation
harness as fixtures, golden comparisons, and retrieval-relevance checks — an
enumeration that is a complete list of what the app measures. Once the
answer-quality run exists that list is incomplete. This updates the summary and
adds a fourth sub-entry beside the three that are already there, pointing at
where the new command and its committed scores file live.

**What happens if you say no:** the system map keeps describing the eval harness
as retrieval-only, and the next person reading it does not learn that answer
quality is measured at all.

**Current** (`PRD/sections/system-map.md`, the `## Eval harness` entry and its
three sub-entries; byte-for-byte):

```markdown
## Eval harness

- Status: shipped
- Summary: Context-evaluation harness with fixtures, golden comparisons, and labeled retrieval-relevance checks over prompt assembly and retrieval.
- Lives in: `apps/backend/src/eval/`
- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032
```

**Replacement** (the entry header; the three existing sub-entries are unchanged
and one is appended after `### Retrieval relevance report`):

```markdown
## Eval harness

- Status: shipped
- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, and an on-demand answer-quality baseline that scores the model's final answer against published worked solutions.
- Lives in: `apps/backend/src/eval/`
- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185
```

**Appended after the `### Retrieval relevance report` sub-entry:**

```markdown
### Answer-quality baseline

- Status: planned
- Summary: On-demand, confirmation-gated run that asks the live provider each committed worked-solution gold case and scores the returned answer against that case's published solution — deterministic assertions, a reference-grounded model judge over four 0–2 axes, then a human review pass. Never in `quality:check`, never asserted against a golden, never a build gate. Answers each case once per System 3 excerpt cap so the deployed five-excerpt limit can be compared against a larger one on the same questions; production stays at five. Writes a small committed scores file and gitignored transcripts.
- Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/`, `scripts/eval-answer-quality.mjs`
- Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190
```

- Verdict:
- Reason:

---

## GOALS-ANSWER-QUALITY-NON-GOAL — the non-goal keeps the CI ban, drops the "someday"

**What this decides:** whether the non-goals list still describes a broad
answer-quality baseline as future scope, now that it is being built.

**In plain terms:** the non-goals list says two things in one line: answers are
never gated in the build, and a general answer-quality baseline "stays separate
scope". The first half is the promise this package keeps and strengthens. The
second half was a placeholder for work that did not exist — and now does. This
keeps the CI ban word for word and replaces the placeholder with a pointer to
where that scope now lives.

**What happens if you say no:** the non-goals list says a general answer-quality
baseline is out of scope while one is shipping, which is the kind of stale line
that makes the whole list untrustworthy.

**Current** (`PRD/sections/goals-and-non-goals.md`, the non-goal bullet;
byte-for-byte):

```markdown
- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build, and a general answer-quality baseline across the whole fixture corpus stays separate scope (DEC-161)
```

**Replacement** (complete):

```markdown
- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build (DEC-161), and the answer-quality baseline over the committed worked-solution gold cases is the same shape — explicitly invoked, confirmation-gated, human-reviewed, never scheduled, never asserted against a golden, and never able to fail a build (NFR-018, REQ-185, REQ-188)
```

- Verdict:
- Reason:

---

## REQ-146 — the combo comparison's "separate scope" note now names where that scope is

**What this decides:** whether the existing combo answer-quality comparison's
notes still claim to be the only path that looks at real answers, and whether its
"separate scope" pointer resolves.

**In plain terms:** REQ-146 is the existing script that answers combo questions
twice — with and without combo data — and shows both answers side by side for
you to read. Two of its lines stop being true here: it tells implementers not to
grow it into a broad answer-quality baseline because that is "separate scope"
(which now exists and has a name), and it says it is "the first path in TheJudge
that inspects real provider answers" (true when written, and now one of two).
Nothing about how the combo comparison behaves changes.

**What happens if you say no:** REQ-146 keeps pointing at unnamed future scope
and keeps claiming to be the only path that reads real answers, so someone
building on it duplicates the new instrument.

**Current** (`PRD/sections/functional-requirements.md`, REQ-146 — third
constraint, dependencies, and first note; byte-for-byte):

```markdown
  - do not grow this into a general-purpose LLM evaluation framework; a broad answer-quality baseline across all fixtures remains separate scope
- Dependencies:
  - DEC-161
  - REQ-093
  - REQ-094
  - REQ-095
- Notes:
  - the existing `prompt:preview` tooling extracts assembled prompt text from the mock provider and therefore cannot observe answer quality; this is the first path in TheJudge that inspects real provider answers
```

**Replacement** (complete):

```markdown
  - do not grow this into a general-purpose LLM evaluation framework; the broad answer-quality baseline is its own instrument over the committed worked-solution gold set (NFR-018, REQ-185 through REQ-190) and the two are kept separate — this requirement stays a two-leg combo A/B over curated combo scenarios
- Dependencies:
  - DEC-161
  - REQ-093
  - REQ-094
  - REQ-095
  - REQ-188 (the answer-quality baseline whose non-gating, confirmation-gated posture this shares)
- Notes:
  - the existing `prompt:preview` tooling extracts assembled prompt text from the mock provider and therefore cannot observe answer quality; this was the first path in TheJudge that inspects real provider answers, and the answer-quality baseline (REQ-188) is the second — both are explicitly invoked, confirmation-gated, human-reviewed, and outside every build gate
```

- Verdict:
- Reason:

---

## Blocker questions

None. Every open question in the idea resolved against active product truth, an
existing tested pattern, or a measurement recorded in `DESIGN-BRIEF.md`. Each is
proposed above with a recommendation rather than left for you to weigh cold.
