# Gate questions — resolution-recipe-eval

**Decide:** five rule changes, four blocker questions (G1, G2, G4, and G5 —
which is answered by the REQ-187 slot), and 16 hard cases (G3-01 to G3-16).
Answer each verdict slot (accept, edit, or reject; a reason is required for edit
or reject), then merge the docs PR to start the build.

This package measures whether a step-by-step "resolution recipe" in the prompt
helps GPT-6 Luna judge hard layer and timing interactions. Nothing changes for
players: the recipe lives only in the test harness as "arm R" (a labelled
prompt variant; today's real prompt is "arm A"). After the code merges, you run
a paid comparison (about $2–4, capped at $15 per run), and a report says ship,
don't ship, or test more.

- `REQ-230` (amended) — adds arm R; lets the diagnostic case set hold In-Depth
  game cases and grow by recorded additions; changes the manifest check.
- `REQ-228` (amended) — the comparison report can split one arm's repeats in
  half (the noise floor) and counts right answers and right-but-too-slow ones.
- `REQ-187` (amended, = G5) — the grader's top score requires no side error.
- `REQ-224` and `REQ-185` (amended, answer them the same way) — a case you
  approve one by one in this file counts as approved without a second review.
- G1 — what arm R tells Luna to show the player.
- G2 — arm R's exact wording.
- G3-01 to G3-16 — each new hard case's reference answer.
- G4 — the rule that decides "R beats A", fixed before money is spent.

Recommendation: accept all. Rejecting `REQ-230` means no arm R and nothing else
here applies. Rejecting `REQ-224`/`REQ-185` keeps the measurement but adds one
step before the paid run (below). Rejecting `REQ-187` keeps today's grader.

Full evidence, the cost dry run, the noise data behind six repeats, the
assumptions, and the line-level amendment set (104 rows): `DESIGN-BRIEF.md` in
this folder.

## REQ-230 — add arm R, In-Depth cases in the diagnostic set, and a manifest check that verifies instead of re-drawing

**What this decides:** whether the test harness gets a new prompt variant, arm
R — today's prompt with its layers paragraph swapped for the resolution recipe —
and whether the hard cases can join the "diagnostic" case set the variants are
allowed to run on.

**In plain terms:** the harness already compares labelled prompt variants
("arms") that exist only in testing: A is the real prompt, B regroups the same
evidence, C and D add the rules a case turns on, P swaps one sentence (REQ-230).
Arm R swaps the whole layers paragraph for the recipe: the full layer list with
the power/toughness sublayers 7a–7d, a timing list (the stack, replacement
effects, state-based actions, triggers in active-player-first order), and an
instruction to place each effect and resolve in order. It works on Quick Lookup
and In-Depth prompts alike, because it swaps text without reading the prompt's
structure. R refuses to run until you approve its wording (G2), like P. Variants
may only run on a committed "diagnostic" list of cases kept apart from an 80-case
"held-out" list saved for judging a real prompt change once. The new hard
cases you accept in G3 (up to 16) join the diagnostic list as a recorded
addition, not by re-drawing it:
re-drawing today would reshuffle both lists, because the corpus changed since
they were drawn (the seeded check fails today even though every listed case is
still sound). So the check changes from "would a re-draw match?" to "is every
listed case still present, approved, unchanged, and are the two lists apart?",
and it reports the re-draw drift without failing. Finally, before any paid run,
an In-Depth case is proven to be asked exactly as the live app would ask it.

**What happens if you say no:** no arm R exists, the hard cases (if authored)
cannot be run under a variant, and the package has nothing to measure; the
other slots fall away.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-230`:

```diff
-- Description: An experiment run (REQ-226) can answer a case under labelled diagnostic variants ("arms") of the production prompt built by the checkout the run executes from, to separate missing evidence from poor presentation. Arms that use a case's deciding-rule labels answer "would complete evidence rescue this answer?", never "how good is the product?", so they run only on a committed diagnostic case set, are reported apart, and are kept away from a committed held-out set used to judge any later fix once.
+- Description: An experiment run (REQ-226) can answer a case under labelled diagnostic variants ("arms") of the production prompt built by the checkout the run executes from, to separate missing evidence from poor presentation, and to try a wording change to the prompt's fixed reference text before it reaches players. Arms that use a case's deciding-rule labels answer "would complete evidence rescue this answer?", never "how good is the product?", so they run only on a committed diagnostic case set, are reported apart, and are kept away from a committed held-out set used to judge any later fix once.
 - Acceptance Criteria:
-  - the arms are: `A` — the production prompt built by the checkout the run executes from, unchanged (the default, and the only arm a routine run uses); `B` — presentation only: the same evidence units as A (every curated topic, supplemental rule excerpt, card oracle text, and card ruling), regrouped, reordered, and given headings, with no unit added, removed, or reworded; `C` — A plus the case's deciding-rule bundle (each `decidingRuleIds` rule, its parent rule, and its lettered subrules, as text from that checkout's committed rule index) added to the supplemental rules section in A's format and de-duplicated against what A already carries; `D` — C's evidence in B's presentation; `P` — A with one named preamble sentence replaced by a correction text held in a committed file
+  - the arms are: `A` — the production prompt built by the checkout the run executes from, unchanged (the default, and the only arm a routine run uses); `B` — presentation only: the same evidence units as A (every curated topic, supplemental rule excerpt, card oracle text, and card ruling), regrouped, reordered, and given headings, with no unit added, removed, or reworded; `C` — A plus the case's deciding-rule bundle (each `decidingRuleIds` rule, its parent rule, and its lettered subrules, as text from that checkout's committed rule index) added to the supplemental rules section in A's format and de-duplicated against what A already carries; `D` — C's evidence in B's presentation; `P` — A with one named preamble sentence replaced by a correction text held in a committed file; `R` — A with the continuous-effects paragraph of the prompt's fixed MTG reference text replaced by an owner-approved resolution recipe held in a committed file: the layer list with the power and toughness sublayers 7a–7d, a timing list (the stack, replacement effects, state-based actions, and triggered abilities in APNAP order), and an instruction to place every effect in its layer or timing step and resolve them in that order
-  - each arm is a pure function, in the evaluation tooling beside the run command (`scripts/lib/diagnostic-arms.mjs`), from the prompt that checkout prepared (its text) and committed data (the rule index, the deciding rule ids for C and D, the approved correction for P) to a prompt string, with a revision id recorded on every record; nothing under `apps/backend/src/prompt/`, routes, or providers changes
+  - each arm is a pure function, in the evaluation tooling beside the run command (`scripts/lib/diagnostic-arms.mjs`), from the prompt that checkout prepared (its text) and committed data (the rule index, the deciding rule ids for C and D, the approved correction for P, the approved recipe for R) to a prompt string, with a revision id recorded on every record; nothing under `apps/backend/src/prompt/`, routes, or providers changes
-  - B's grouping is fixed under a revision id before any paid run uses it (B.1, chosen from the observed production prompts and frozen on 2026-10-07; a later grouping is a new revision, never an edit of B.1), and a live run refuses an arm whose revision is not frozen; P refuses to run until its correction text file (`apps/backend/src/eval/answer-quality/arm-p-correction.json`) carries the owner's approval date
+  - B's grouping is fixed under a revision id before any paid run uses it (B.1, chosen from the observed production prompts and frozen on 2026-10-07; a later grouping is a new revision, never an edit of B.1), and a live run refuses an arm whose revision is not frozen; P refuses to run until its correction text file (`apps/backend/src/eval/answer-quality/arm-p-correction.json`) carries the owner's approval date; R refuses to run until its recipe text file (`apps/backend/src/eval/answer-quality/arm-r-recipe.json`) carries the owner's approval date, which freezes revision R.1 (a later wording is R.2, never an edit of R.1)
+  - P and R are substitution arms: each replaces one named passage of the prepared prompt, which must appear exactly once or the arm refuses, and reads nothing else of the prompt's structure, so each runs on a lookup prompt and an In-Depth (game) prompt alike; B, C and D parse the lookup prompt's sections and refuse an In-Depth prompt. Tests prove, on a lookup prompt and an In-Depth prompt, that R's prompt equals A's with only the target paragraph replaced, and that R refuses when the target is missing, appears twice, or its file carries no approval date
   - tests prove, for every case in the diagnostic manifest: B's evidence units equal A's as a multiset; C adds only bundle rules to A; D's evidence units equal C's; and no arm adds the case's `expected.answer`, `expected.shortAnswer`, or `expected.outcome` to a prompt: an arm builder takes the deciding rule ids and never the case, so a reference answer can appear in an arm's prompt only where the production prompt (arm A) already quotes the same rule or ruling text
   - arms C and D run only on cases in the committed diagnostic manifest (`apps/backend/src/eval/answer-quality/manifests/diagnostic.json`); the run refuses either arm on any other case, naming it, and the records of every arm but A carry `diagnostic: true`
-  - the committed held-out manifest (`apps/backend/src/eval/answer-quality/manifests/held-out.json`) lists approved cases disjoint from the diagnostic manifest, and a test asserts disjointness; arms B and P run on a held-out case only under a frozen revision id, and every such record carries `heldOut: true`
+  - the committed held-out manifest (`apps/backend/src/eval/answer-quality/manifests/held-out.json`) lists approved cases disjoint from the diagnostic manifest, and a test asserts disjointness; arms B, P and R run on a held-out case only under a frozen revision id, and every such record carries `heldOut: true`
-  - both manifests are written by one seeded command (`npm run eval:answer-quality:manifests`; `-- --check` re-runs it and fails if the committed files would change) from the evidence trace (REQ-229), recording its seed and selection rule: diagnostic — the two tester cases, `multiplayer-only-blood-ends-your-nightmares-opponents`, every approved case whose deciding rules are partly selected in search, a seeded sample of 20 cases with none selected, and a seeded sample of 10 fully selected cases as passing controls; held-out — a seeded sample of 80 of the remaining approved cases, stratified by Comprehensive Rules section; a sample size may change only with the reason recorded in the command's output
+  - both manifests are written by one seeded command (`npm run eval:answer-quality:manifests`) from the evidence trace (REQ-229), recording its seed and selection rule: diagnostic — the two tester cases, `multiplayer-only-blood-ends-your-nightmares-opponents`, every approved case whose deciding rules are partly selected in search, a seeded sample of 20 cases with none selected, and a seeded sample of 10 fully selected cases as passing controls, plus every appended group (below); held-out — a seeded sample of 80 of the remaining approved cases, stratified by Comprehensive Rules section; a sample size may change only with the reason recorded in the command's output; the seeded sets are kept as drawn, and a re-draw is a deliberate run of the command that keeps every appended group
+  - `npm run eval:answer-quality:manifests -- --append-diagnostic <ids> --reason <text>` adds named cases to the committed diagnostic manifest as a recorded group — the group's case ids with their question and reference-answer hashes, the date, and the reason — outside the seeded selection; it refuses, naming each, a case that is not approved, is flagged stale (REQ-225), or is listed in the held-out manifest. The first group, `resolution-recipe-hard-set`, holds the hard layer and timing cases the `resolution-recipe-eval` package authored from the define-gate slots the owner accepted or edited, and its record lists their ids; because those cases may be In-Depth (game) cases, the diagnostic manifest can hold game cases
+  - `npm run eval:answer-quality:manifests -- --check` verifies the committed manifests without re-drawing them: it fails, naming each problem, when a listed case is missing, is not approved, is flagged stale, or no longer matches its listed question or reference-answer hash, or when the two manifests share a case; it also prints, without failing, how many cases a fresh seeded draw from the current corpus would change (drift)
+  - before its first paid call, an experiment run that selects any case with a `gameState` proves, for each such case, that the prompt prepared from the case's request equals the prompt prepared from that request after the route's request schema (`askAiRequestSchema`) parses it, and refuses, naming the case, when they differ — so an In-Depth case is asked exactly as the live app would ask it; a unit test proves the refusal
 - Constraints:
   - arms are evaluation tooling and never become runtime prompt text; a later product change that adopts an arm's idea is its own package, and its result is judged with arm A run from the changed revision on the held-out manifest
   - a case's reference answer never enters any arm's prompt; deciding-rule labels shape only arms C and D
   - choosing B's grouping or any later candidate's settings reads diagnostic cases only, never held-out labels
   - manifests carry case ids and hashes only
 - Notes:
   - measured 2026-10-07 at `3e973ced`: 14 approved cases have partial System 3 coverage, 91 none, 287 full (`apps/backend/src/eval/rules-gate/baseline.json`), so the diagnostic set is about 47 cases; the two tester cases are tier 3 and `multiplayer-only-blood-ends-your-nightmares-opponents` is tier 2
   - the preamble sentence P targets is the one the owner's intake brief reports as mixing up continuous effects, state-based actions, and layers; its correction is verified and owner-approved before P runs
   - the `luna-answer-budget` change (REQ-231's package) adopted P's owner-approved correction (2026-10-08) as production prompt text — "Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704)." — as a factual fix. The judging this requirement's constraint asks for (arm A run from the changed revision on the held-out manifest) is a paid, owner-run experiment after merge, never part of the build; until it runs, the change is recorded as a factual correction, not a measured accuracy change (alone it measured only a small-sample lead: Academy Manufactor 3 of 4 right with it, 1 of 5 without). Because the sentence P replaces no longer appears in the production prompt, P now refuses to run (its sentence must appear exactly once) until a new correction is approved
+  - measured 2026-10-10 at `dabad406`: the continuous-effects paragraph R replaces appears exactly once in both a lookup prompt and an In-Depth prompt, so R substitutes on both flows with no parser change; the seeded re-draw no longer matched the committed manifests (the trace pools had moved from 287 / 14 / 91 to 290 / 14 / 88 after the Comprehensive Rules refresh, giving 45 diagnostic cases), while every case both committed manifests list was still approved with matching hashes — the reason `--check` verifies the committed files instead of re-drawing them
+  - arm R and its hard set were proposed by the `resolution-recipe-eval` package (owner request 2026-10-10) to measure whether the recipe helps `gpt-6-luna` on hard layer and timing interactions; the paid comparison is owner-run after merge (`docs/eval/resolution-recipe/RUNBOOK.md`), and adopting the recipe as production text would be its own package, judged as the constraint above requires
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-228 — the comparison report can measure its own noise

**What this decides:** whether the report that compares two prompt variants
can also compare a variant with itself, so we know how much the score moves by
chance alone.

**In plain terms:** Luna doesn't give the same answer every time: on Academy
Manufactor + Esix it was right 3 times out of 4, on Necropotence + Silence once
out of 4. So a lead for arm R only means something if it is bigger than the gap
between two identical runs of arm A. Each hard case is answered six times per
arm; this change lets the report compare A's answers 1–3 with A's answers 4–6
(that gap is the "noise floor"), and compare R's halves with A's halves the same
way. It also adds two counts per side: right answers out of all answers (every
repeat counted, not just each case's majority), and answers that were right but
took longer than the 30-second answer budget (REQ-231) — a player would have
seen the failure screen for those (REQ-014). The report still states numbers and
never declares a winner (REQ-228 today); the decision rule is G4.

**What happens if you say no:** the report compares A with R only as whole
runs; the noise floor has to be worked out by hand from the per-case lists, and
right-but-too-slow answers are not counted.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-228`:

```diff
 - Acceptance Criteria:
-  - `npm run eval:answer-quality:compare -- <run-a> <run-b>` reads two run folders, with optional `--arm`, `--model` and `--cap` selectors (and `--arm-a`, `--arm-b`, `--model-a`, `--model-b` for one side); a bare run id resolves under `output/answer-quality/runs/`, and a side defaults to arm A and to the run's only model; it makes no network call
+  - `npm run eval:answer-quality:compare -- <run-a> <run-b>` reads two run folders, with optional `--arm`, `--model`, `--cap` and `--repeats <from>-<to>` selectors (and `--arm-a`, `--arm-b`, `--model-a`, `--model-b`, `--repeats-a`, `--repeats-b` for one side); `--repeats` keeps only the records whose repeat index is in the range, so one arm's repeats can be split into halves and compared with each other within one run (`<run> <run> --arm A --repeats-a 1-3 --repeats-b 4-6`), which the report labels a noise-floor comparison; a bare run id resolves under `output/answer-quality/runs/`, and a side defaults to arm A, to the run's only model, and to every repeat; it makes no network call
-  - it refuses, printing every reason, and compares nothing, when the judge model or rubric revision differ between the two runs, or when any case was judged against a different reference answer (or carries no reference hash) on the two sides; differences in the commit each run executed from, embedding provider or model, arm, or answer model are the variable under study and are printed with each side
+  - it refuses, printing every reason, and compares nothing, when the judge model or rubric revision differ between the two runs, when any case was judged against a different reference answer (or carries no reference hash) on the two sides, or when both sides select the same records (the same run, arm, model, cap and repeats); differences in the commit each run executed from, embedding provider or model, arm, answer model, or repeat range are the variable under study and are printed with each side
-  - per side it reports: answer latency mean, p50 and p95; the count of answers slower than the production answer timeout of the revision that side's run executed from (the 30,000 ms overall answer budget from REQ-231 on; 15,000 ms per attempt before it, which is also assumed for a run whose identity record predates the field); error and timeout counts; input, output and reasoning tokens; answer cost and judge cost apart, with unpriced models shown as unpriced (REQ-227)
+  - per side it reports: the count of right answers out of graded answers, counting every repeat, beside the per-case majorities; answer latency mean, p50 and p95; the count of answers slower than the production answer timeout of the revision that side's run executed from (the 30,000 ms overall answer budget from REQ-231 on; 15,000 ms per attempt before it, which is also assumed for a run whose identity record predates the field), and of those the count that were right; error and timeout counts; input, output and reasoning tokens; answer cost and judge cost apart, with unpriced models shown as unpriced (REQ-227); the answer-level counts are broken down like every other count (by tier and by request kind among the rest)
-  - unit tests over run folders produced by the real experiment loop with fake clients cover every transition, the unstable rule, the refusals, the per-tier and per-group breakdowns, the stratum, and that the output names no winner
+  - unit tests over run folders produced by the real experiment loop with fake clients cover every transition, the unstable rule, the refusals, the per-tier and per-group breakdowns, the stratum, the repeat selectors and the self-comparison refusal, the answer-level and right-but-slow counts, and that the output names no winner
 - Notes:
   - REQ-189's `compareRecords` already labels two records incomparable per case when the reference answer, judge, rubric, or embedding provider differ; this report builds on that per-case rule and adds the paired transition counts the routine run has no use for
+  - the repeat selectors were added by the `resolution-recipe-eval` package (2026-10-10): its decision rule reads arm A's repeats 1–3 against 4–6 as the noise floor and compares arm R with arm A half against half; the report prints those numbers, and the rule is applied by the person reading it, never by this command
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-187 — the grader's top score requires no side error (G5)

**What this decides:** whether an answer that reaches the right outcome but
also says something wrong a player could act on can still get full marks.

**In plain terms:** the grader (a stronger model, `gpt-6.1-sol`) scores each
answer's Correctness 0, 1 or 2 against your approved reference (REQ-187). Today
2 means "reaches the same outcome as the reference". Level 1 already mentions
"right with a material error", but level 2 doesn't exclude one, so a right
outcome with an invented card or a wrong stack order can be scored 2. You ruled
on 2026-10-08 that such an answer scores 1. This writes that into the grader's
text: 2 means the same outcome with no material error a player could act on — an
invented card or ability, a wrong timing or stack order, or a wrong intermediate
rule step. It matters most here because the recipe makes Luna walk through
steps, and each step is a chance for a side error. The grader text gets a new
revision label; scores from before it can't be compared case by case with
scores after it, but old answers can be re-graded without re-asking Luna
(`--regrade-from`, REQ-226).

**What happens if you say no:** the grader keeps today's text; the comparison
still runs, but a right-outcome answer with a side error may score 2.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-187`:

```diff
 - Acceptance Criteria:
-  - **Correctness (0–2)** — 2: reaches the same outcome as the case's approved reference answer; 1: partially right, or right with a material error or omission; 0: reaches a different outcome. This is the only axis that produces the headline figure
+  - **Correctness (0–2)** — 2: reaches the same outcome as the case's approved reference answer, with no material error a player could act on (an invented card or ability, a wrong timing or stack order, or a wrong intermediate rule step); 1: partially right, or right with a material error or omission; 0: reaches a different outcome. This is the only axis that produces the headline figure
 - Notes:
   - it moves again, to a revision dated the day the build changes the judge's inputs, when the judge starts receiving the attached excerpts' rule ids and text, the deciding rule ids labelled apart, and any game-state lines (REQ-186); the four axis definitions are unchanged, and records graded under `2026-10-06.1` are incomparable per case with later ones
+  - it moves again, to a revision dated the day the build changes the Correctness text, when level 2 starts excluding a material error a player could act on (the owner's strict-grading ruling of 2026-10-08, adopted by the `resolution-recipe-eval` package); records graded under `2026-10-07.1` are incomparable per case with later ones, and an experiment run's stored answers can be graded again under the new revision with `--regrade-from` (REQ-226)
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-224 — a case you approve one by one in a gate file counts as approved

**What this decides:** whether the hard cases you approve case by case in
this file (G3) are written as approved by the build, or go through the usual
review batch again after the merge.

**In plain terms:** a rules test case only counts once you approve it, and
today the only way is the review flow: a batch file is rendered, you fill each
verdict, and an apply command writes "approved" (REQ-224). There is one
exception today: the 18 first cases, approved by your accept of the corpus
requirement. This adds a second: a case you approve in a gate slot that shows
its question, reference answer, outcome and deciding rules — exactly what G3
shows — is written approved by the build that creates it, with the date the docs
PR carrying your answer merged and a note naming the slot. Without it, the build
writes those cases as drafts; after the code merges you would render a batch,
approve them again, apply, add them to the diagnostic list, and merge that as a
small extra PR before the paid run (the paid run refuses uncommitted changes).

**What happens if you say no:** the extra post-merge review-and-PR step above.
The measurement is otherwise unchanged. Answer `REQ-185` the same way.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-224`:

```diff
-  - no agent sets `approved`; only the apply command, run on an owner-filled batch, does — except the 18 first-ship cases, which the format-version-2 migration writes as `approved` because the owner's accept of REQ-185 approves them, each with `review.reviewedOn` set to the migration date and a review note naming that accept as the approval source (REQ-185)
+  - no agent sets `approved`; only the apply command, run on an owner-filled batch, does — except (a) the 18 first-ship cases, which the format-version-2 migration writes as `approved` because the owner's accept of REQ-185 approves them, each with `review.reviewedOn` set to the migration date and a review note naming that accept as the approval source (REQ-185); and (b) a case the owner approves one by one in a `define`-gate verdict slot (`GATE-QUESTIONS.md`) that shows its question, reference answer, outcome and deciding rule ids: the build that authors the case writes it `approved`, with `review.reviewedOn` set to the date the docs PR carrying the answered slot merged, a review note naming the package and slot as the approval source, and its `snapshot` recorded from the committed data at authoring; an `edit` verdict's text is applied before authoring, and a `reject` verdict authors no case
   - REQ-186 (grading only `approved` cases)
+- Notes:
+  - exception (b) was added by the `resolution-recipe-eval` package (2026-10-10), whose hard cases are approved case by case in its G3 slots; without it, the cases would be authored as drafts and need a second review and a separate merge before the paid run that uses them
```

(REQ-224 has no `Notes` section today; the diff adds one after its `Dependencies` list.)

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## REQ-185 — the corpus requirement says the same thing as REQ-224

**What this decides:** the matching wording in the rules-test-corpus
requirement, so the two requirements don't contradict each other.

**In plain terms:** the corpus requirement (REQ-185) restates who can approve a
case in two lines: "the 18 first-ship cases by the owner's accept ..., every
other case through the owner review flow", and "no case is approved by an agent;
only the owner's verdict moves a case to approved". This adds the define-gate
slot from `REQ-224` above to both lines. Answer it the same way as `REQ-224`.

**What happens if you say no:** the corpus requirement keeps its wording; if
`REQ-224` is accepted anyway, the two would disagree, so reject both or accept
both.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-185`:

```diff
-- Description: The answer-quality baseline (NFR-018) and the offline prompt gate (REQ-222) grade the product against one committed corpus of rules test cases, each carrying an approved correct answer. The corpus is tiered by where that answer comes from. Tier 1 is Comprehensive Rules text verbatim — an `Example:` line, or a rule's own text when the question asks exactly what that rule states. Tier 2 is a WotC card ruling verbatim, paired with a hand-authored question. Tier 3 is an answer the owner researched and approved where no official text exists; it is scored and reported apart from tiers 1 and 2 and never pooled with them. The corpus was seeded by the 18 gold cases committed on 2026-09-07 and grew to 393 cases in run 1 of the rules test harness: at least one case for every real mechanic in the committed rule index (REQ-223) plus 120 cases in the hard rules areas. No case scores until the owner approves it: the 18 first-ship cases by the owner's accept of this requirement, every other case through the owner review flow (REQ-224).
+- Description: The answer-quality baseline (NFR-018) and the offline prompt gate (REQ-222) grade the product against one committed corpus of rules test cases, each carrying an approved correct answer. The corpus is tiered by where that answer comes from. Tier 1 is Comprehensive Rules text verbatim — an `Example:` line, or a rule's own text when the question asks exactly what that rule states. Tier 2 is a WotC card ruling verbatim, paired with a hand-authored question. Tier 3 is an answer the owner researched and approved where no official text exists; it is scored and reported apart from tiers 1 and 2 and never pooled with them. The corpus was seeded by the 18 gold cases committed on 2026-09-07 and grew to 393 cases in run 1 of the rules test harness: at least one case for every real mechanic in the committed rule index (REQ-223) plus 120 cases in the hard rules areas. No case scores until the owner approves it: the 18 first-ship cases by the owner's accept of this requirement, a case approved one by one in a `define`-gate verdict slot by that verdict, and every other case through the owner review flow (REQ-224).
-  - no case is approved by an agent; only the owner's verdict (REQ-224) moves a case to `approved` — except the 18 first-ship cases, which the format-version-2 migration writes as `approved` because the owner's accept of this requirement approves them
+  - no case is approved by an agent; only the owner's verdict moves a case to `approved` — through the review flow (REQ-224), or a per-case `define`-gate verdict slot that the build authoring the case records (REQ-224) — except the 18 first-ship cases, which the format-version-2 migration writes as `approved` because the owner's accept of this requirement approves them
```

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

## Blocker questions

### G1 — what arm R tells Luna to show the player

**What this decides:** whether, under arm R, Luna writes out its full working
(every effect, its layer or step, the order) or works the recipe silently and
writes only the conclusion and the key reasons.

**In plain terms:** the recipe tells Luna to list every effect and place it in a
layer or timing step before answering. That working can either appear in the
answer or stay in Luna's head. Showing it makes every answer longer, and longer
answers take longer to write; Luna's slowest recorded answer was already 22.7
seconds against the 30-second budget (REQ-231: a player waits at most 30 s on
the AI before seeing the failure screen), and its ten recorded answers on the
hardest (tier 3) cases had a median of 13.1 s (both read from the 2026-10-09
runs; source in `DESIGN-BRIEF.md`, "Cost dry run"). The choice also changes what the grader reads. Testing both would
double the cost and the cases.

**Recommendation:** conclusion and key reasons only. Arm R's last instruction
sentence then reads "Show the player the conclusion and the key reasons, not the
full list." (as in G2's text).

**What happens if you say no:** arm R's text ends instead with "Show the player
each effect, its layer or timing step, and the order you resolved them in,
then the conclusion."; expect slower answers.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

### G2 — arm R's exact wording

**What this decides:** the exact text that replaces today's layers paragraph
under arm R. It is frozen (revision R.1) on your approval; any later change is a
new revision.

**In plain terms:** today's paragraph is: "Continuous effects use a layer
system (rule 613); state-based actions are not part of it and are checked
separately whenever a player would receive priority (rule 704). When effects
conflict, apply in order: (1) Copy effects, (2) Control-changing effects, (3)
Text-changing effects, (4) Type-changing effects, (5) Color-changing effects, (6)
Ability-adding/removing effects, (7) Power- and toughness-changing effects.
Within a layer, timestamp and dependency rules apply. This assistant does not
adjudicate officially; use layers as shared vocabulary when explaining
interactions." The proposed replacement, checked against the committed rule
text (613.1a–g, 613.4a–d, 613.8, 616.1, 704.3, 117.5, 603.3b):

> Resolve interactions in this order. Continuous effects apply in layers (rule 613): (1) copy effects; (2) control-changing effects; (3) text-changing effects; (4) type-changing effects; (5) color-changing effects; (6) ability-adding and ability-removing effects; (7) power- and toughness-changing effects, in sublayers (7a) characteristic-defining abilities that define power or toughness, (7b) effects that set power or toughness to a value, (7c) effects and counters that modify power or toughness, (7d) effects that switch power and toughness. Within a layer or sublayer, apply effects in timestamp order, unless one effect depends on another: a dependent effect waits until the effects it depends on have applied (rule 613.8). Timing is separate from layers: spells and abilities on the stack resolve one at a time, last in first out, and players receive priority between them; replacement effects change an event as it happens and never use the stack, and when several apply, the affected player or the affected object's controller chooses their order (rule 616.1); each time a player would receive priority, state-based actions are checked first and repeated until none apply (rule 704), and only then are triggered abilities put on the stack, in APNAP order (rule 603.3b). Before answering, list every effect in play, place each one in its layer or timing step, and resolve them in that order. Show the player the conclusion and the key reasons, not the full list. This assistant does not adjudicate officially.

The last-but-one sentence follows G1. The closing sentence is kept from today's
text so that only the recipe differs between A and R. It adds about 900
characters (about 225 tokens) to every prompt.

**Recommendation:** accept.

**What happens if you say no:** with `reject`, arm R stays refused and the paid
run cannot start; with `edit`, your wording replaces this one and is frozen as
R.1.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

### G3 — the hard cases' reference answers

**What this decides:** the approved answer each new hard case is graded
against, one slot per case.

**In plain terms:** the grader scores Luna's answers by agreement with these
references, so each must be right and carry no side error of its own (grading
is strict: a right outcome with a real side error scores 1). Each reference was
checked against the rule text in `apps/backend/data/gameRulesRuleIndex.json` and
the oracle text in the committed card data. Each interaction appears twice: a
Quick Lookup question, and an In-Depth case with the cards placed in zones. The
two existing approved lookup cases (Necropotence + Silence + Borne Upon a Wind,
Academy Manufactor + Esix) are reused as they are and need no slot. Accepting a
slot also approves that case for scoring, if `REQ-224` is accepted. "Outcome" is
a review label only (works / does-not-work / depends); the grader reads the
answer text. Every card in every slot carries its oracle id (the card's
permanent Scryfall id, which the app's card data is keyed by). Each id was
found from the card's name in the app's card-name index
(`apps/frontend/public/data/cardMetadata.json`), or, for Grizzly Bears, which
that index leaves out because it has no rules text, in the scanner's index
(`cardScanMap.json`); the text was then read from the card data the prompt
prints (`apps/backend/data/cardDetailByOracleId.json.br`). The saved run is
`evidence/g3-card-ids.txt` in this folder: 22 cards, each with exactly one id.

**Recommendation:** accept each slot. Every reference reaches the right outcome
under the cited rules and the card text, with no side error of its own; each
slot below repeats this in one line.

**What happens if you say no to a case:** with `reject`, that case is not
authored and the set shrinks; with `edit`, your text is used.

#### G3-01 — Blood Moon + Urborg, Quick Lookup (`layers-blood-moon-urborg-dependency`)

**What this decides:** the reference for whether Urborg still makes Swamps
when it is played after Blood Moon.
**In plain terms:** timestamp order says Urborg applies last; dependency
(rule 613.8: an effect that another effect would switch off waits for it)
reverses that. Urborg's own ruling in the prompt states the result.
**Recommendation:** accept — the reference matches rules 613.8a–b and 305.7 and Urborg's ruling.
**What happens if you say no:** this case is not authored.

- Cards: Blood Moon (`94fac5fe-97d5-4c12-a80c-8efff9d853ae`), Urborg, Tomb of Yawgmoth (`db6174d7-211d-4817-b8e4-8384594c83f9`)
- Question: "My opponent controls Blood Moon. I play Urborg, Tomb of Yawgmoth after it. Can Urborg and my other nonbasic lands tap for black mana?"
- Outcome: `does-not-work`
- Short answer: "No: Urborg's effect depends on Blood Moon's, so Blood Moon applies first and Urborg makes nothing a Swamp."
- Reference answer: "No. Blood Moon and Urborg are both type-changing effects, applied in layer 4 (613.1d). Urborg's effect depends on Blood Moon's, because applying Blood Moon removes Urborg's ability (613.8a), so Blood Moon applies first even though Urborg entered later (613.8b). Blood Moon makes Urborg a Mountain, and a land whose subtype is set to a basic land type loses the abilities from its rules text (305.7), so Urborg makes no land a Swamp. Urborg and your other nonbasic lands are Mountains: they tap for red, not black. Basic Swamps you control still tap for black."
- Deciding rules: 613.1d, 613.8a, 613.8b, 305.7
- Reasoning: dependency overrides timestamp, and the effect that removes Urborg's ability goes first.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-02 — Blood Moon + Urborg, In-Depth (`layers-blood-moon-urborg-dependency-in-depth`)

**What this decides:** the reference for the same interaction asked from a
board.
**In plain terms:** same reasoning as G3-01, with the cards placed on the
battlefield.
**Recommendation:** accept — same checked reasoning as G3-01, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Blood Moon (`94fac5fe-97d5-4c12-a80c-8efff9d853ae`), Urborg, Tomb of Yawgmoth (`db6174d7-211d-4817-b8e4-8384594c83f9`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield: Blood Moon (owner Player 2); Urborg, Tomb of Yawgmoth (owner Player 1, note "played this turn, after Blood Moon was on the battlefield").
- Question: "Player 2's Blood Moon was already out when I played Urborg this turn. Does my Urborg tap for black, and does it turn my other lands into Swamps?"
- Outcome: `does-not-work`
- Short answer: "No to both: Blood Moon applies first by dependency, so Urborg is just a Mountain."
- Reference answer: "No to both. Both cards change land types, which happens in layer 4 (613.1d). Urborg's effect depends on Blood Moon's, since Blood Moon removes Urborg's ability (613.8a), so Blood Moon applies first even though your Urborg arrived later (613.8b). Your Urborg becomes a Mountain and loses the abilities from its rules text (305.7): it taps for red, not black, and it makes no land a Swamp."
- Deciding rules: 613.1d, 613.8a, 613.8b, 305.7

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-03 — Humility, then Opalescence, Quick Lookup (`layers-humility-then-opalescence`)

**What this decides:** the reference for what Humility and a plain creature
become when Opalescence arrives after Humility.
**In plain terms:** Humility's effect keeps working after it strips its own
ability (rule 613.6), and in the "set power and toughness" sublayer the later
card wins. The Humility/Opalescence ruling in the prompt walks this exact order.
**Recommendation:** accept — the reference follows rules 613.6 and 613.7 and the Humility/Opalescence ruling.
**What happens if you say no:** this case is not authored.

- Cards: Humility (`ed7bdb3e-5c51-4547-9266-76a791e0b2b0`), Opalescence (`59489b46-9d02-4f3c-bcd0-884e7605e9a5`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`, {1}{G} Creature — Bear, no rules text)
- Question: "I control Humility and Grizzly Bears. Then I cast Opalescence. What are Humility and Grizzly Bears now?"
- Outcome: `works`
- Short answer: "Humility is a 4/4 enchantment creature with no abilities; Grizzly Bears is a 1/1 with no abilities."
- Reference answer: "Humility is a 4/4 enchantment creature with no abilities, and Grizzly Bears is a 1/1 with no abilities. In layer 4, Opalescence makes Humility a creature (613.1d). In layer 6, Humility's effect removes all abilities from every creature, including Humility itself (613.1f); because that effect has already started to apply, it keeps applying in later layers even though Humility lost its ability (613.6). In layer 7b, both effects set base power and toughness, so they apply in timestamp order (613.4b, 613.7): Humility's 1/1 first, because Humility was on the battlefield first, then Opalescence's effect sets Humility to its mana value, 4/4. Opalescence doesn't apply to Grizzly Bears, so it stays 1/1. Opalescence itself is not a creature, because it affects only other enchantments."
- Deciding rules: 613.1d, 613.1f, 613.4b, 613.6, 613.7
- Reasoning: within 7b the later timestamp wins, and 613.6 keeps Humility's effect alive after it removes its own ability.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-04 — Humility, then Opalescence, In-Depth (`layers-humility-then-opalescence-in-depth`)

**What this decides:** the reference for the same interaction from a board.
**In plain terms:** same reasoning as G3-03.
**Recommendation:** accept — same checked reasoning as G3-03, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Humility (`ed7bdb3e-5c51-4547-9266-76a791e0b2b0`), Opalescence (`59489b46-9d02-4f3c-bcd0-884e7605e9a5`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield (all owner Player 1): Humility, Grizzly Bears, Opalescence (note "resolved this turn; Humility was already on the battlefield").
- Question: "My Opalescence just resolved, and my Humility and Grizzly Bears were already out. What are my Humility and Grizzly Bears now?"
- Outcome: `works`
- Short answer: "Your Humility is a 4/4 with no abilities and your Grizzly Bears is a 1/1 with no abilities."
- Reference answer: "Your Humility is now a 4/4 enchantment creature with no abilities, and your Grizzly Bears is a 1/1 with no abilities. Opalescence makes Humility a creature in layer 4 (613.1d). Humility then removes every creature's abilities in layer 6, its own included (613.1f), and its effect still applies in later layers because it had already started to apply (613.6). In layer 7b both set base power and toughness, in timestamp order (613.4b, 613.7): Humility's earlier 1/1, then Opalescence's later mana-value setting, which makes Humility 4/4. Grizzly Bears is set to 1/1 by Humility only. Opalescence affects only other enchantments, so it is not a creature."
- Deciding rules: 613.1d, 613.1f, 613.4b, 613.6, 613.7

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-05 — base set, then pumped, Quick Lookup (`layers-turn-to-frog-after-giant-growth-counter`)

**What this decides:** the reference for how big a pumped creature with a
counter is after Turn to Frog sets it to 1/1.
**In plain terms:** "set to 1/1" happens in sublayer 7b, and pumps and counters
in 7c, which always comes later, whatever order the spells were cast in. Turn to
Frog's ruling in the prompt says modifiers still apply.
**Recommendation:** accept — 1/1 + 3/3 + 1/1 = 5/5 follows rules 613.4b–c and Turn to Frog's ruling.
**What happens if you say no:** this case is not authored.

- Cards: Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Giant Growth (`5748ebf1-24e3-499d-ab7c-c2cebd462a24`), Turn to Frog (`74c4c1e2-c50d-4c8f-889a-0d5674dc6d67`)
- Question: "My Grizzly Bears has a +1/+1 counter on it, and I cast Giant Growth on it. After Giant Growth resolves, my opponent casts Turn to Frog on it. How big is it once Turn to Frog resolves?"
- Outcome: `works`
- Short answer: "5/5: Turn to Frog sets the base to 1/1, then Giant Growth's +3/+3 and the counter's +1/+1 still apply."
- Reference answer: "It's a 5/5 blue Frog with no abilities for the rest of the turn. Turn to Frog sets its base power and toughness to 1/1, which applies in layer 7b (613.4b). Giant Growth's +3/+3 and the +1/+1 counter modify power and toughness, which applies in layer 7c (613.4c), always after 7b no matter which effect started first. So 1/1 plus 3/3 plus 1/1 makes 5/5."
- Deciding rules: 613.4b, 613.4c
- Reasoning: sublayer order beats cast order.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-06 — base set, then pumped, In-Depth (`layers-turn-to-frog-after-giant-growth-counter-in-depth`)

**What this decides:** the reference for the same interaction from a board,
with Turn to Frog on the stack.
**In plain terms:** same reasoning as G3-05.
**Recommendation:** accept — same checked reasoning as G3-05, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Giant Growth (`5748ebf1-24e3-499d-ab7c-c2cebd462a24`), Turn to Frog (`74c4c1e2-c50d-4c8f-889a-0d5674dc6d67`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield: Grizzly Bears (owner Player 1, note "one +1/+1 counter; Giant Growth resolved on it this turn"). Graveyard: Giant Growth (owner Player 1). Stack: Turn to Frog (caster Player 2, targeting Grizzly Bears).
- Question: "If Player 2's Turn to Frog resolves, what are my Grizzly Bears' power and toughness for the rest of the turn?"
- Outcome: `works`
- Short answer: "5/5: the 1/1 base is set first, then +3/+3 and +1/+1 apply."
- Reference answer: "Your Grizzly Bears will be a 5/5 blue Frog with no abilities. Turn to Frog sets base power and toughness to 1/1 in layer 7b (613.4b); Giant Growth's +3/+3 and the +1/+1 counter are modifications, applied in layer 7c (613.4c) after 7b regardless of timing. 1/1 + 3/3 + 1/1 = 5/5."
- Deciding rules: 613.4b, 613.4c

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-07 — replacement vs trigger, Quick Lookup (`replacement-kalitas-blood-artist-no-dies-trigger`)

**What this decides:** the reference for whether an opponent's death trigger
fires, and whether they can respond, when Kalitas exiles their creature instead.
**In plain terms:** Kalitas replaces the death, so nothing dies, and the Zombie
comes from the same replacement, which never uses the stack. Kalitas's ruling
covers the trigger half; nothing in the prompt states the no-stack half.
**Recommendation:** accept — the reference follows rules 614.1a, 614.6 and 700.4 and Kalitas's text.
**What happens if you say no:** this case is not authored.

- Cards: Kalitas, Traitor of Ghet (`e1cfd1cb-44a5-429f-a5c1-e6d29bad1c71`), Blood Artist (`310f141c-7f37-4729-aed6-dd9c09db448d`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Murder (`938b4e2c-88d9-4637-bc00-e228920c9a78`, {1}{B}{B} instant "Destroy target creature.")
- Question: "I control Kalitas, Traitor of Ghet. My opponent controls Blood Artist and Grizzly Bears, and I cast Murder on their Grizzly Bears. Does Blood Artist trigger, and can my opponent respond before I get my Zombie?"
- Outcome: `does-not-work`
- Short answer: "No and no: the Bears is exiled instead of dying, and the Zombie comes from the same replacement, which doesn't use the stack."
- Reference answer: "No, and no. Kalitas's ability is a replacement effect, marked by the word \"instead\" (614.1a). When Murder resolves, Grizzly Bears is exiled instead of being put into the graveyard, so it never dies (700.4), and Blood Artist, which triggers when a creature dies, doesn't trigger. Your Zombie token is created as part of that same modified event, which happens in place of the death (614.6), so nothing goes on the stack and there is no point between the exile and the Zombie where your opponent can respond. They can still respond to Murder itself while it is on the stack."
- Deciding rules: 614.1a, 614.6, 700.4
- Reasoning: a replaced event never happens, and the replacement's own result is part of the modified event.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-08 — replacement vs trigger, In-Depth (`replacement-kalitas-blood-artist-no-dies-trigger-in-depth`)

**What this decides:** the reference for the same interaction from a board,
with Murder on the stack.
**In plain terms:** same reasoning as G3-07.
**Recommendation:** accept — same checked reasoning as G3-07, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Kalitas, Traitor of Ghet (`e1cfd1cb-44a5-429f-a5c1-e6d29bad1c71`), Blood Artist (`310f141c-7f37-4729-aed6-dd9c09db448d`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Murder (`938b4e2c-88d9-4637-bc00-e228920c9a78`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield: Kalitas, Traitor of Ghet (owner Player 1); Blood Artist (owner Player 2); Grizzly Bears (owner Player 2). Stack: Murder (caster Player 1, targeting Grizzly Bears).
- Question: "My Murder targets Player 2's Grizzly Bears and I control Kalitas. When Murder resolves, does Player 2's Blood Artist trigger, and can Player 2 respond before my Zombie arrives?"
- Outcome: `does-not-work`
- Short answer: "No to both: Kalitas exiles the Bears instead, so nothing dies, and the Zombie is part of that replacement."
- Reference answer: "No to both. Kalitas's ability is a replacement effect (614.1a): as Murder resolves, Player 2's Grizzly Bears is exiled instead of going to the graveyard, so it never dies (700.4) and Blood Artist has nothing to trigger on. The Zombie is created as part of the same modified event (614.6); it doesn't use the stack, so Player 2 gets no chance to respond between the exile and the Zombie. Player 2 can still respond to Murder now, while it is on the stack."
- Deciding rules: 614.1a, 614.6, 700.4

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-09 — Necropotence + Silence + Borne Upon a Wind, In-Depth (`necropotence-silence-borne-upon-a-wind-cleanup-in-depth`)

**What this decides:** the reference for Luna's one production miss, asked
from a board in the cleanup step.
**In plain terms:** same reasoning as the approved lookup case: Silence ends
in the cleanup step, and the Necropotence trigger from discarding gives players
priority in a step where they normally get none. No ruling in the prompt states
it.
**Recommendation:** accept — the reference follows rules 514.1, 514.2 and 514.3a and Necropotence's discard trigger.
**What happens if you say no:** this case is not authored; the lookup case
stays.

- Cards: Necropotence (`94a844d2-0574-45a7-b347-e0e329767c42`), Borne Upon a Wind (`ce19962d-94f9-4b2b-b668-963c0acce308`), Silence (`8aed54cb-d1bb-45ad-adbe-38e55d84ff31`)
- Board: 2 players at 20 life; Player 1's cleanup step, Player 1 active. Battlefield: Necropotence (owner Player 1). Hand: Borne Upon a Wind (owner Player 1). Graveyard: Silence (owner Player 2, note "Player 2 cast it during Player 1's first main phase this turn").
- Question: "It's my cleanup step with nine cards in hand, and Player 2 cast Silence earlier this turn. After I discard down to seven, can I cast Borne Upon a Wind from my hand?"
- Outcome: `works`
- Short answer: "Yes: Silence's this-turn effect ends in the cleanup step, and Necropotence's discard trigger gives you priority."
- Reference answer: "Yes. In your cleanup step you first discard down to seven (514.1). Then all \"this turn\" effects end at the same time (514.2), so Silence no longer stops you from casting spells. Each card you discarded triggered Necropotence, and because a triggered ability is waiting, players receive priority in this cleanup step (514.3a). Borne Upon a Wind is an instant, so you can cast it then. Once the stack is empty and all players pass, another cleanup step follows (514.3a)."
- Deciding rules: 514.1, 514.2, 514.3a

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-10 — Academy Manufactor + Esix, In-Depth (`academy-manufactor-esix-treasure-in-depth`)

**What this decides:** the reference for the regression check (where the old
layers sentence once pushed a model toward layers on a replacement question),
asked from a board.
**In plain terms:** two replacement effects apply to one event and you choose
the order (rule 616.1); the order decides how many tokens you get. Layers play
no part. No ruling in the prompt states it.
**Recommendation:** accept — three tokens or one, by the chosen order, follows rule 616.1 and both cards' text.
**What happens if you say no:** this case is not authored; the lookup case
stays.

- Cards: Academy Manufactor (`f36d1d8b-8303-44a9-ab56-531931641ea2`), Esix, Fractal Bloom (`9d22960b-babc-4cf3-b228-d32e13bc6014`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield (all owner Player 1): Academy Manufactor, Esix, Fractal Bloom (note "Player 1 has not created a token this turn"), Grizzly Bears.
- Question: "It's my main phase and I haven't created any tokens this turn. I'm about to create a Treasure token, and I want Esix to copy my Grizzly Bears. What do I end up with?"
- Outcome: `depends`
- Short answer: "You choose the order: Manufactor first gives three Grizzly Bears tokens; Esix first gives one."
- Reference answer: "It depends on the order you choose. Both are replacement effects (614.1a) on the same token-creation event, and you choose which applies first (616.1, 616.1e); the process then repeats with only the effects that still apply (616.1f). If you apply Academy Manufactor first, the Treasure becomes a Clue, a Food and a Treasure, and Esix may then replace that event, so you create three tokens that are copies of Grizzly Bears. If you apply Esix first, you create one Grizzly Bears token instead of the Treasure, and Academy Manufactor has nothing left to replace, so you get one token. If you don't use Esix, Academy Manufactor gives you a Clue, a Food and a Treasure."
- Deciding rules: 614.1a, 616.1, 616.1e, 616.1f

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-11 — Clone copies a Frogified creature, Quick Lookup (`layers-clone-copies-frogified-serra-angel`)

**What this decides:** the reference for what a Clone becomes when it copies a
creature turned into a Frog by an Aura.
**In plain terms:** a copy takes only what is printed on the card (plus other
copy effects) — layer 1 — so the Frog effect isn't copied. Clone's ruling in the
prompt states the principle. Less famous than the owner-named cases.
**Recommendation:** accept — the reference follows rules 707.2 and 613.1a and Clone's ruling, and names no power or toughness the card data lacks.
**What happens if you say no:** this case is not authored.

- Cards: Clone (`42226b87-0746-4ebf-9fd0-108d508462af`), Frogify (`32249228-e300-4865-b977-5e1f285d02f2`), Serra Angel (`4b7ac066-e5c7-43e6-9e7e-2739b24a905d`, {3}{W}{W} Creature — Angel, "Flying / Vigilance")
- Question: "My opponent's Serra Angel is enchanted with Frogify. I cast Clone and copy the Serra Angel. What does my Clone look like?"
- Outcome: `works`
- Short answer: "A normal Serra Angel with flying and vigilance, not a Frog: a copy takes only copiable values."
- Reference answer: "Your Clone is a Serra Angel: a white Angel with flying and vigilance and Serra Angel's printed power and toughness, not a 1/1 blue Frog. A copy effect takes only the copiable values of the original — what is printed on the card, as modified by other copy effects (707.2) — and copy effects apply in layer 1 (613.1a). Frogify's effect is not a copy effect and applies only to the creature it enchants, so your Clone doesn't get it."
- Deciding rules: 707.2, 613.1a
- Note: the reference avoids naming Serra Angel's 4/4, because the app's card data carries no printed power or toughness.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-12 — Clone copies a Frogified creature, In-Depth (`layers-clone-copies-frogified-serra-angel-in-depth`)

**What this decides:** the reference for the same interaction from a board,
with Clone on the stack.
**In plain terms:** same reasoning as G3-11.
**Recommendation:** accept — same checked reasoning as G3-11, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Clone (`42226b87-0746-4ebf-9fd0-108d508462af`), Frogify (`32249228-e300-4865-b977-5e1f285d02f2`), Serra Angel (`4b7ac066-e5c7-43e6-9e7e-2739b24a905d`)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield: Serra Angel (owner Player 2, note "enchanted by Frogify"); Frogify (owner Player 2, note "attached to Serra Angel"). Stack: Clone (caster Player 1).
- Question: "When my Clone resolves, I'll have it copy Player 2's Serra Angel, which has Frogify on it. Is my Clone a Frog, and does it have flying?"
- Outcome: `works`
- Short answer: "Not a Frog, and yes, it has flying: Clone copies only what's printed."
- Reference answer: "Your Clone isn't a Frog, and it has flying and vigilance: it enters as a Serra Angel. Copying takes only the copiable values — the printed card, as modified by other copy effects (707.2) — applied in layer 1 (613.1a). Frogify is an Aura's effect on Player 2's Serra Angel, not a copy effect, so it doesn't carry over to your Clone."
- Deciding rules: 707.2, 613.1a

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-13 — Mycosynth Lattice after March of the Machines, Quick Lookup (`layers-mycosynth-lattice-march-dependency`)

**What this decides:** the reference for what happens to lands when Mycosynth
Lattice arrives while March of the Machines is already out.
**In plain terms:** going by timestamps, March would apply before the lands are
artifacts and miss them; dependency makes the Lattice apply first, so every land
becomes a 0/0 artifact creature and dies. The rulings in the prompt mention the
combination, not the ordering. Less famous than the owner-named cases.
**Recommendation:** accept — the reference follows rules 613.8a–b and 704.5f and both cards' text.
**What happens if you say no:** this case is not authored.

- Cards: Mycosynth Lattice (`ae1f2ab5-c6a5-4d49-a746-3cb4668bf805`), March of the Machines (`51092634-308e-4779-aa51-182715dbc734`)
- Question: "March of the Machines is already on the battlefield. Then I cast Mycosynth Lattice. What happens to the lands on the battlefield?"
- Outcome: `works`
- Short answer: "They die: the Lattice applies first by dependency, so every noncreature land becomes a 0/0 artifact creature."
- Reference answer: "Every land that isn't already a creature is put into its owner's graveyard. Mycosynth Lattice and March of the Machines are both type-changing effects in layer 4 (613.1d). March's effect depends on the Lattice's, because the Lattice changes what March applies to by making every permanent an artifact (613.8a), so the Lattice applies first even though March was on the battlefield earlier (613.8b). Each land is then a noncreature artifact, so March makes it an artifact creature with power and toughness equal to its mana value, which is 0 for a land. A creature with toughness 0 is put into its owner's graveyard as a state-based action (704.5f)."
- Deciding rules: 613.1d, 613.8a, 613.8b, 704.5f
- Reasoning: dependency overrides timestamp; then a state-based action.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-14 — Mycosynth Lattice after March of the Machines, In-Depth (`layers-mycosynth-lattice-march-dependency-in-depth`)

**What this decides:** the reference for the same interaction from a board,
with the Lattice on the stack.
**In plain terms:** same reasoning as G3-13.
**Recommendation:** accept — same checked reasoning as G3-13, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Mycosynth Lattice (`ae1f2ab5-c6a5-4d49-a746-3cb4668bf805`), March of the Machines (`51092634-308e-4779-aa51-182715dbc734`), Forest (`b34bb2dc-c1af-4d77-b0b3-a0fb342a5fc6`, Basic Land — Forest), Island (`b2c6aa39-2d2a-459c-a555-fb48ba993373`, Basic Land — Island)
- Board: 2 players at 20 life; Player 1's first main phase, Player 1 active. Battlefield: March of the Machines (owner Player 1); Forest (owner Player 1); Island (owner Player 2). Stack: Mycosynth Lattice (caster Player 1).
- Question: "My March of the Machines is out, and my Mycosynth Lattice is on the stack. When the Lattice resolves, what happens to my Forest and Player 2's Island?"
- Outcome: `works`
- Short answer: "Both die: each becomes a 0/0 artifact creature and is put into its owner's graveyard."
- Reference answer: "Both are put into their owners' graveyards. The Lattice and March are both layer-4 type-changing effects (613.1d), and March's effect depends on the Lattice's, because the Lattice makes the lands artifacts and so changes what March applies to (613.8a); the Lattice therefore applies first, even though March arrived earlier (613.8b). The Forest and the Island are then noncreature artifacts, so March makes each an artifact creature with power and toughness equal to its mana value, 0. Each is put into its owner's graveyard as a state-based action for having 0 toughness (704.5f)."
- Deciding rules: 613.1d, 613.8a, 613.8b, 704.5f

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-15 — two Blood Artists at 1 life, Quick Lookup (`triggers-apnap-blood-artists-at-one-life`)

**What this decides:** the reference for who wins when both players at 1 life
have a Blood Artist and a creature dies on the active player's turn.
**In plain terms:** the active player's trigger goes on the stack first, so the
other player's resolves first; the active player drops to 0 and loses to a
state-based action before their own trigger resolves. Tests the recipe's timing
list. No ruling in the prompt states it.
**Recommendation:** accept — the reference follows rules 603.3b, 704.3 and 704.5a and Blood Artist's text.
**What happens if you say no:** this case is not authored.

- Cards: Blood Artist (`310f141c-7f37-4729-aed6-dd9c09db448d`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Murder (`938b4e2c-88d9-4637-bc00-e228920c9a78`)
- Question: "It's my turn. My opponent and I are each at 1 life, and we each control a Blood Artist. I cast Murder on my opponent's Grizzly Bears, and each of us targets the other with our Blood Artist trigger. Who wins?"
- Outcome: `does-not-work`
- Short answer: "Your opponent wins: their trigger goes on the stack last, resolves first, and you lose to state-based actions."
- Reference answer: "Your opponent wins. When Grizzly Bears dies, both Blood Artists trigger. Triggered abilities are put on the stack in APNAP order: you, the active player, put yours on the stack first, then your opponent puts theirs on top (603.3b), so theirs resolves first. You lose 1 life and go to 0. Before anyone receives priority again, the game checks state-based actions (704.3), and a player with 0 or less life loses the game (704.5a), so your trigger never resolves."
- Deciding rules: 603.3b, 704.3, 704.5a
- Reasoning: APNAP stacking puts the non-active player's trigger on top; state-based actions are checked before priority.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

#### G3-16 — two Blood Artists at 1 life, In-Depth (`triggers-apnap-blood-artists-at-one-life-in-depth`)

**What this decides:** the reference for the same interaction from a board,
with Murder on the stack.
**In plain terms:** same reasoning as G3-15.
**Recommendation:** accept — same checked reasoning as G3-15, own wording.
**What happens if you say no:** this case is not authored.

- Cards: Blood Artist (`310f141c-7f37-4729-aed6-dd9c09db448d`), Grizzly Bears (`14c8f55d-d177-4c25-a931-ebeb9e6062a0`), Murder (`938b4e2c-88d9-4637-bc00-e228920c9a78`)
- Board: Player 1 at 1 life, Player 2 at 1 life; Player 1's first main phase, Player 1 active. Battlefield: Blood Artist (owner Player 1); Blood Artist (owner Player 2); Grizzly Bears (owner Player 2). Stack: Murder (caster Player 1, targeting Grizzly Bears).
- Question: "When my Murder resolves and both Blood Artists trigger, each of us targeting the other player, which of us wins?"
- Outcome: `does-not-work`
- Short answer: "Player 2 wins: their trigger resolves first and you lose at 0 life."
- Reference answer: "Player 2 wins. Both Blood Artists trigger when Grizzly Bears dies. As the active player you put your trigger on the stack first, and Player 2 puts theirs on top (603.3b), so Player 2's trigger resolves first and you go from 1 life to 0. State-based actions are checked before anyone gets priority (704.3), and you lose the game at 0 life (704.5a) before your own trigger can resolve."
- Deciding rules: 603.3b, 704.3, 704.5a

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

### G4 — the rule that decides "R beats A", fixed before any money is spent

**What this decides:** what result counts as a win for the recipe, so the
report can say ship, don't ship, or test more without anyone moving the goal
after seeing the numbers.

**In plain terms:** each hard case is answered six times under A and six under
R. Split each arm's six answers into two sets of three. Arm A's first three
against arm A's last three shows how much the score moves by pure chance — the
noise floor. Per flow (Quick Lookup and In-Depth judged separately):

1. R must beat A by more right answers than the noise floor in both halves (R's
   first three against A's first three, and R's last three against A's last
   three);
2. R must lose no case outright: no case right by majority under A and wrong by
   majority under R;
3. any answer slower than 30 seconds counts as wrong, because a player would
   have seen the failure screen instead (REQ-231, REQ-014);
4. on the 44 ordinary cases, R must turn no case from right to wrong that holds
   up when re-asked six times under each arm.

**Recommendation:** accept. Both flows pass → "ship candidate" (a separate
package then changes the real prompt and is judged once on the held-out cases);
R behind A by more than the noise floor in either flow, or failing 2–4 → "don't
ship"; anything else → "test more". The report also shows results split into
cases whose answer is already printed in a card ruling and cases that need
reasoning, so a win that comes only from the first group is visible.

**What happens if you say no:** with `edit`, your rule replaces this one in the
runbook before the build; with `reject`, the paid run waits until a rule is set.

- Verdict: accept
- Reason: Owner accepted every recommendation in this file (answered in session, 2026-10-10).

### G5 — strict grading in the rubric

Answered by the `REQ-187` slot above (one verdict, so the two cannot disagree).
