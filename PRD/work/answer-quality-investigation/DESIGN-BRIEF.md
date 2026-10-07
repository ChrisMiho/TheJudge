# Design brief — answer-quality investigation

**What this is:** the plan for finding out why the judge gives players shaky
answers on hard interactions — Academy Manufactor with Esix, and Necropotence
with Silence and Borne Upon a Wind — before anyone picks a fix. It builds the
measuring tools a fair before/after comparison needs, runs the free offline half
of the investigation, and writes the runbook for the paid half.

**What you need to do:** answer the eleven verdict slots in `GATE-QUESTIONS.md`
and merge the docs PR. Before the first paid run, two choices are yours: the
spending cap for each paid phase, and which model grades the answers (it must
be stronger than both GPT-4.1 and GPT-6 Luna). Nothing here spends money, merges
PR #273, or changes what players see.

**What it changes:** nothing a player sees. It adds evaluation tooling — named
experiment runs, save-as-you-go with a hard spending cap, a before/after
comparison report, an offline trace of where each deciding rule goes, and
labelled test-only prompt variants — and it repairs what the grading model is
told. The product fix is a later package, chosen from the results.

## 1. The problem in player terms

A player attaches Academy Manufactor and Esix and asks what happens when a
Treasure would be created. The answer depends on four rules about replacement
effects (rules 614.1a, 616.1, 616.1e and 616.1f). The app's own offline check
records that none of those four reaches the AI's prompt today. A player asking
about Necropotence, Silence and Borne Upon a Wind gets a prompt that carries the
cleanup-step rule 514.1 but not 514.2, or the exception 514.3a that decides the
case (measured from `apps/backend/src/eval/rules-gate/baseline.json` on
2026-10-07 — see §3).

Three different things could be wrong, and each needs a different fix:

- **missing evidence** — the right rules never reach the AI (a retrieval fix);
- **poor presentation** — the rules arrive, but the prompt is organised so the
  AI misuses them (a prompt-organisation fix);
- **the model itself** — GPT-4.1 reasons badly about these even with good
  evidence (a model change, for example to GPT-6 Luna).

Meanwhile PR #273, the 2026-10-07 data refresh, changes the rules text, rulings
and test fixtures, and its green CI says nothing about whether answers got
better or worse. This package makes all of that measurable before a fix is
chosen.

## 2. Scope

### In scope

1. **Comparison tooling** (code in this package's build, offline-tested with
   fake clients; proposed truth REQ-226 to REQ-230 plus amendments):
   - named **experiment runs** with a fixed case list, repeats, a full identity
     record that includes the commit run from, their own result folder, and a
     regrade mode that re-grades an earlier run's stored answers under the
     current judge and rubric (REQ-226);
   - **save-as-you-go and resume**, and a **hard spending cap** that stops the
     run before it overspends (REQ-227);
   - a **paired comparison report** — right→right, wrong→right, right→wrong,
     wrong→wrong — by tier, rules area and difficulty (REQ-228);
   - an **offline evidence trace** — for each deciding rule, where it ranked,
     whether it was picked, and whether its text is anywhere in the final
     prompt (REQ-229);
   - **diagnostic prompt arms** that separate presentation from evidence,
     confined to a committed diagnostic case set and kept away from a held-out
     set (REQ-230);
   - **grader repair and runtime parity** — the judge is told what the prompt
     actually carried; evaluation prompts include production's combo data
     (answer calls keep the SDK's default timeout and retries); unknown prices are "unpriced", never $0
     (amendments to REQ-185 to REQ-189 and NFR-018).
2. **The offline half of the investigation**, run in this package's build at
   no cost (Phase 0 below), with its findings committed outside the work folder.
3. **The runbook for the paid half** (Phases 1 to 5), with call counts and the
   dry run's dollar estimates, committed beside the findings.

### Out of scope (non-goals)

- Rebuilding the rules test harness. The 393-case corpus, the offline prompt
  gate (REQ-222), the coverage gate (REQ-223), the review flow (REQ-224) and the
  staleness report (REQ-225) are reused as they are.
- Any paid model call during this package's build. Live phases run afterwards,
  under a cap the owner sets per phase.
- Merging or deploying PR #273, or any production change. The investigation
  produces a merge recommendation; the owner merges.
- Naming a retrieval architecture, a prompt rewrite, or a model winner. Those
  are outcomes of the paid phases and belong to a follow-up package.
- Clarification questions back to the player, ingesting new data sources (for
  example release notes), a deterministic rules engine, or a multi-agent answer
  system.
- Authoring question-wording variants (REQ-185's `layers.variants`). The
  held-out set uses related, already-approved cases instead (assumption A16).
- A reasoning-effort setting for reasoning models. REQ-188 already makes that a
  separate follow-up; this package only records the effort the provider reports.

## 3. Starting point — what exists today

Verified in this worktree (branch `thejudge-auto/answer-quality-investigation`,
cut from `3e973ced`) on 2026-10-07:

| Fact | Evidence |
| --- | --- |
| Corpus: 392 approved cases (tier 1: 80, tier 2: 310, tier 3: 2), 1 rejected; 0 approved cases carry a `gameState`, so every case is asked as a lookup | `apps/backend/src/eval/worked-solutions/*.case.json`, counted with `node` |
| System 3 (the rule-excerpt search) selects every deciding rule for 287 approved cases, some for 14, none for 91 | `apps/backend/src/eval/rules-gate/baseline.json`, `hit`/`miss` per case |
| `academy-manufactor-esix-treasure` (tier 3): all four of 614.1a, 616.1, 616.1e, 616.1f missed. `necropotence-silence-borne-upon-a-wind-cleanup` (tier 3): 514.1 hit, 514.2 and 514.3a missed. `multiplayer-only-blood-ends-your-nightmares-opponents` (tier 2): 608.2d and 701.21a both hit at the base | same file |
| The baseline records System 3 selections only, not whether a rule arrives another way (a curated rules topic or a card ruling) | REQ-222 rule-check criterion |
| A recorded run always merges into one committed file at a fixed path; `--output-dir` moves only the transcripts | `scripts/eval-answer-quality.mjs`, `RESULTS_RELATIVE_PATH` and `resultsPath` in `executeEvaluation` |
| Scores are written once, after every case; an error from an answer or judge call ends the loop before anything is saved (transcripts already written survive) | `executeEvaluation`, no `try` around `client.responses.create` or `judgeAnswerAlone` |
| An unrecognised model's cost is $0 | `computeCallCostUsd` returns `0` when `MODEL_PRICING_USD_PER_MILLION_TOKENS` lacks the model; the table has no `gpt-6-luna` |
| The judge is sent the case's deciding rule ids under the label "Rule ids attached to the prompt" — REQ-186 says it receives the prompt's supplemental rule ids | `eval-answer-quality.mjs` passes `ruleIds: caseEntry.expected.decidingRuleIds`; `judge.ts` line 112 labels them |
| The evaluation prompt loader omits the Commander Spellbook combo catalog, which production loads by default | `loadPromptResources` in `scripts/lib/prompt-fidelity.mjs`; `createConfiguredApp.ts` loads it when `comboEnrichmentEnabled`, which defaults to true (`config/index.test.ts`); `scripts/aws-deploy.sh` does not set it |
| Evaluation answer calls use the SDK's default timeout and retries; production uses 15,000 ms and 2 retries | `defaultBuildClient` in `scripts/eval-answer-quality.mjs` (`new OpenAI({ apiKey })`); `createAskAiProvider.ts` |
| Production sends only `model` and `input`; deploy pins `gpt-4.1`, `EMBEDDING_PROVIDER=local` | `openAiResponsesProvider.ts`; `scripts/aws-deploy.sh` line 96 |
| The full System 3 ranking is reachable without a code change: a larger excerpt cap reuses the identical ranking (REQ-190), while `runnerUp` alone carries only ten ranks below the cap | `preparation.ts` `supplementalRuleCap`; `gameRulesRetrieval.ts` line 832 |

From the owner's intake brief (evidence, not verified here — `intake/GRAPH-BRIEF.md`):
PR #273's head is `07cc3ab6`; it keeps the same 392 approved cases with
byte-identical questions and reference answers, adds seven drafts, re-snapshots
ten approved cases whose sources changed, and accepts one lost rule hit (608.2d
for the multiplayer case). The 144 historical score records over 18 cases use an
old rubric and carry no prompt or reference hashes, so they are not a baseline.
Offline, the Manufactor and Necropotence prompts carry every attached card's
oracle text and rulings, at 16,710 and 12,565 characters. The static rules
preamble contains a sentence that mixes up continuous effects, state-based
actions and layers. These claims are re-measured by Phase 0, not adopted.

## 4. Design — the tooling

### 4.1 Measuring an older revision

Today's tooling must measure two older revisions (`3e973ced` and `07cc3ab6`),
neither of which contains it. Per the owner's verdict on REQ-226, a run does not
import code across checkouts: it measures the checkout it executes from and
records that commit. The two revisions are compared by running the tooling from
each revision's own worktree, with the tooling commits applied on top. The run
refuses when its checkout has uncommitted changes or sits on a different commit
than `--expect-commit` (REQ-226).

The worktrees are created by the owner (or an authorised session) with
`git worktree add --detach .worktrees/aq-base 3e973ced` and
`git worktree add --detach .worktrees/aq-head 07cc3ab6`, the tooling commits
applied on top of each, plus `npm ci` and the embedding-model cache warm-up in
each. They never touch the owner's main checkout or other worktrees.

### 4.2 Experiment runs (REQ-226)

`npm run eval:answer-quality -- --run-id <id> --manifest <file>` turns on
experiment mode. The manifest names case ids with the SHA-256 of each case's
`question` and `expected.answer`; a missing, unapproved, stale, or hash-mismatched
case refuses the run by name. `--repeat <n>` answers each case `n` independent
times. Each record is keyed by case, model, excerpt cap, arm and repeat index.

Everything goes to `output/answer-quality/runs/<run-id>/` (already gitignored):
`manifest.json` (the identity record), `calls.jsonl` (the checkpoint),
transcripts, and a numbers-only `summary.json`. The identity record holds the
commit run from, a SHA-256 for each data file and case file, the rules-index
hash, models as requested and as reported, request options, client timeout and
retries, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER` and embedding model, whether
the combo catalog loaded, caps, arms and their revisions, repeats, judge model,
rubric revision, the rate table with each rate's check date, the spending cap,
the source run for a regrade run, and the start time. An experiment run never
reads or writes the committed `results.json`.

A **regrade run** (`--regrade-from <run-id>`, owner's verdict on REQ-226) makes
no answer call. It reads the stored answer transcripts of an earlier run, grades
them under the current judge model and rubric revision, and writes only to its
own run folder, so earlier answers stay comparable after a grader or rubric
change and progress can be tracked run over run.

### 4.3 Save as you go, resume, spending cap (REQ-227)

Each record is appended to `calls.jsonl` as soon as its judge call returns. A
provider error or timeout becomes an `error` record and the run moves on.
`--resume <run-id>` refuses if any identity field changed and skips completed
keys; `--retry-errors` re-attempts error records.

In experiment mode `--confirm-live-calls` requires `--max-cost-usd`. Before each
call the run adds that call's estimate (the dry-run method) to what it has
already spent and stops cleanly if the cap would be passed. Cost comes from the
usage the provider reports, reasoning tokens counted as output. A model with no
rate is **unpriced**: the dry run prints it that way, and a live experiment run
refuses to start, because the cap could not be enforced.

### 4.4 Paired comparison report (REQ-228)

`npm run eval:answer-quality:compare -- <run-a> <run-b>` (with optional arm and
model selectors) compares two runs case by case, offline. It refuses, printing
the reasons, when the judge model, rubric revision, or a case's reference-answer
hash differ. "Right" is Correctness 2 (REQ-187); "wrong" is 0 or 1. With repeats,
a case's side is the majority result and a case whose repeats disagree is listed
as **unstable**.

It prints the five transition counts plus missing cases with denominators, lists
every right→wrong case id with its transcript paths, and breaks counts down by
tier (1–2 together, 3 apart, never pooled), rules section, mechanic, difficulty,
source pool and request kind. Cases whose prompt hash is identical on both sides
form the **unchanged-input stratum**; their differences are reported as
sampling noise, which is how a single sampling difference is kept from being
called an effect. Per side it reports latency (mean, p50, p95), answers slower
than the production per-attempt timeout of the revision that side's run executed
from (15,000 ms today), errors and timeouts, tokens including reasoning tokens, and answer and judge cost apart. It
never names a winner.

### 4.5 Offline evidence trace (REQ-229)

`npm run eval:evidence-trace` follows each case from question to prompt, with no
network call. For each deciding rule it reports the rank in the full System 3
ranking (by preparing at an excerpt cap equal to the rule-index size, which
reuses production's ranking per REQ-190), whether it was **selected in search**
at the production cap, whether System 3 skipped it because a curated rules topic
already carries it, and whether its text is **available to answer** anywhere in
the final prompt (a curated topic, an excerpt, or a card ruling quoting it). It
also checks each deciding rule's parent and lettered subrules — the "514.3 is
there but its exception 514.3a is not" pattern. Case level: per-rule coverage,
complete-procedure coverage (every deciding rule available), and today's
`goldRuleInPrompt` side by side. Ranking uses the committed frozen query vectors
of the checkout it runs from (REQ-222), so it reproduces the gate; a case
awaiting a re-freeze is embedded by the local embedder and labelled.

Like an experiment run (§4.1), the trace measures the checkout it runs from,
imports nothing from another checkout, refuses when that checkout has
uncommitted changes, and records its commit in `trace.json`. Two revisions are
compared offline: each revision's trace is produced from its own worktree (tooling
commits applied on top), then `npm run eval:evidence-trace:compare --
<trace-folder-a> <trace-folder-b>` reads the two trace output folders and reports
both commits, per-case prompt-hash equality, how coverage differs, and any case
in only one trace (REQ-229).

### 4.6 Diagnostic arms and the held-out split (REQ-230)

Arms are evaluation-only prompt variants, each a pure function from the prompt
prepared by the checkout the run executes from, and its committed data, to a
prompt string, with a revision
id on every record. Nothing under `apps/backend/src/prompt/`, routes or
providers changes.

| Arm | Change | Question it answers |
| --- | --- | --- |
| A | the production prompt of the checkout the run executes from, untouched | What does this revision do now? |
| B | the same evidence units, regrouped, reordered and headed — none added, removed or reworded | Does presentation alone help? |
| C | A plus the case's deciding-rule bundle (each deciding rule, its parent and its lettered subrules, as rule-index text in A's format, de-duplicated) | Does complete evidence rescue the answer? |
| D | C's evidence in B's presentation | Do evidence and presentation interact? |
| P | A with one preamble sentence replaced by an owner-approved correction | Does the preamble correction help on its own? |

B's exact grouping is an empirical choice made in build from Phase 0's recorded
observations (duplicates, ordering, rule-and-exception separation), then frozen
under a revision id before any paid run. A test proves B's evidence units equal
A's for every diagnostic case, C adds only bundle rules, and D equals C's units.
P runs only once the owner approves its correction text (committed in a file);
until then it is built but refused.

Arms C and D use the case's deciding-rule labels, so they answer "would
complete evidence rescue this?", never "how good is the product?". They run only
on cases in the committed diagnostic manifest, their records are marked
`diagnostic: true`, and the compare report prints them under a "diagnostic
control — not a product score" heading. No arm ever sees the reference answer.

**Manifests.** A seeded, recorded command writes two committed files
(`apps/backend/src/eval/answer-quality/manifests/`, ids and hashes only):

- **diagnostic** — the two tester cases, the multiplayer case with the lost
  608.2d hit, every approved case with partial System 3 coverage (14 at the
  base), a seeded sample of 20 of the 91 cases with none, and a seeded sample of
  10 fully covered cases as passing controls (about 47 cases);
- **held-out** — a seeded, rules-section-stratified sample of 80 of the
  remaining approved cases, disjoint from the diagnostic set (a test asserts
  disjointness). In this package only arm A ever runs on it. A later candidate
  fix is tuned on the diagnostic set and judged once on the held-out set.

The sample sizes are proposed defaults from the measured pool sizes; build may
adjust them only from Phase 0's counts, recording the reason (assumption A15).

### 4.7 Grader repair (REQ-186, REQ-187)

The lone judge call gets what REQ-186 already says it should, plus what the
Grounding axis needs to be judged at all: the rule ids **and text** of the
excerpts the answer prompt actually carried, labelled as attached; the case's
deciding rule ids, labelled separately as the rules the reference answer turns
on; and, for a case with a game state, the state lines the prompt printed. The
same inputs are built the same way for every model, cap and arm. Because the
judge's inputs change, the rubric revision moves to a new identifier, so old and
new grades are never compared per case (REQ-189's existing rule). Both base and
head are then graded under the new revision.

### 4.8 Runtime parity and accounting (REQ-188, REQ-189)

- The evaluation loader also loads the combo catalog when combo enrichment is
  on — production's default — and records whether it did.
- Evaluation answer calls keep the SDK's default timeout and retries (owner's
  verdict on REQ-188); runtime suitability is read from the recorded latency and
  the compare report's count of answers slower than 15 seconds (REQ-228).
- Records gain `allDecidingRulesInPrompt` beside `goldRuleInPrompt` (which keeps
  its meaning: one deciding rule among the System 3 selections), reasoning
  tokens and the reasoning effort the provider reports, and `unpriced` in place
  of a $0 cost.
- `gpt-6-luna` joins the rate table with the date its rate was checked; the
  dry run prints every rate and its check date so the owner re-checks before
  spending. `--bake-off` is unchanged; Luna is named with `--model gpt-6-luna`.
- No reasoning-effort parameter is sent (REQ-188's standing constraint), so
  Luna runs at its default effort; changing effort is a separate experiment.

## 5. Design — the investigation

Each phase names who runs it, what it costs, and the decision it feeds.

### Phase 0 — offline evidence (build, free)

1. Create the base and head worktrees, tooling commits applied on top; record both SHAs, and record a
   new comparison rather than mixing revisions if either has moved.
2. Run the evidence trace over all 392 approved cases from each worktree, then
   compare the two trace folders with `eval:evidence-trace:compare`: per-rule
   and complete-procedure coverage, the unchanged-input stratum size, and the
   cases whose coverage changed.
3. Run `npm run eval:rules-staleness` and `npm run eval:rules-coverage` on both
   worktrees. List the ten cases whose sources the refresh changed and the review
   provenance each carries at head (assumption A17).
4. Generate the diagnostic and held-out manifests from the trace.
5. Build arms A to D offline for every diagnostic case; record the observations
   that fix arm B's grouping; freeze B's revision.
6. Dry-run every paid phase below to print its call count and dollar estimate.
7. Commit the findings and runbook to `docs/eval/answer-quality-investigation/`
   (`OFFLINE-FINDINGS.md`, `RUNBOOK.md`) — outside the work folder, which close
   deletes (assumption A19).

### Phase 1 — grader check (paid, owner cap)

Before any comparison, the owner names the judge model (assumption A13) and it
stays fixed for every phase. Run a small GPT-4.1 batch on the diagnostic set
under the repaired grader, then the owner adjudicates a mix of about twelve
answers (correct, subtly wrong, ambiguous) without seeing the judge's score, and
the runbook records agreement. Every changed or failing answer on the three
named cases is read by a person; a second model's score alone is not proof.

### Phase 2 — the data refresh on GPT-4.1 (paid, owner cap)

Same manifest of eligible approved cases, base worktree then head worktree,
identical GPT-4.1 settings and grader, arm A. Default: the full paired cohort,
so the unchanged-input stratum doubles as the run-to-run noise control. If the
owner's cap is lower, run the changed-input stratum plus a seeded sample of the
unchanged stratum. The compare report lists every newly wrong case; the lost
608.2d case's answer is read. **Decision D1** follows.

### Phase 3 — evidence versus presentation (paid, owner cap)

GPT-4.1 fixed, head worktree, diagnostic manifest, arms A, B, C, D (and P once
approved), three independent answers per case for the named and disputed cases.
Every case is traced question → query → ranks → selected and dropped rules →
final evidence → answer → grade. **Decision D2** follows.

### Phase 4 — GPT-4.1 versus GPT-6 Luna (paid, owner cap)

One run, lineup `gpt-4.1` and `gpt-6-luna`, so the blind side-by-side ranking
runs (REQ-186). Inputs: arm A on the diagnostic and held-out manifests, and the
best validated evidence arm from Phase 3 on the diagnostic manifest; three
answers per case for critical cases, more where results disagree. Report
correctness first, then grounding, calibration, readability, rule ids not in
the committed index, failures and timeouts, latency against the 15-second
timeout, tokens and dollars. **Decision D3** follows.

### Phase 5 — decision and smallest follow-up (owner)

A readable report — paired refresh comparison, failure types with examples,
arm results, model cost and latency, every per-case regression, what remains
uncertain — becomes the intake for a follow-up through `thejudge-investigate`
then `graph-kickoff`. **Decision D4** follows.

## 6. Empirical decision points — preserved, not pre-decided

| # | Question | What decides it | Not decided here | If inconclusive |
| --- | --- | --- | --- | --- |
| D0 | Which model grades? | Owner, before Phase 1: must be stronger than every contestant, never one of them (REQ-186) | which model | keep `gpt-5` only if the owner judges it stronger than Luna |
| D1 | Should PR #273 merge? | Phase 0 data and source changes, required checks on the exact head, the lost 608.2d answer, Phase 2's newly wrong list | the merge itself (owner's) | recommend merge only with every newly wrong case explained or accepted by the owner |
| D2 | Evidence, presentation, or neither? | Phase 3: does C/D rescue failures A fails; does B | a retrieval design or prompt rewrite | report "neither rescued"; no fix proposed |
| D3 | Does Luna beat GPT-4.1, and only because evidence is missing? | Phase 4 on current and best evidence, blind-ranked, repeated | a migration | keep GPT-4.1 |
| D4 | What is the smallest follow-up? | D2 and D3 together; a retrieval candidate is built without gold labels and judged once on the held-out set; #266 is remeasured as one candidate | which candidate | preserve evidence, propose nothing |
| D5 | When may a follow-up fix ship? | Proposed rule for the follow-up to adopt: both tester cases pass adjudicated checks, offline gates pass, every newly wrong approved case is fixed or owner-accepted; no invented accuracy target; no ratchet raised to hide a regression | durable truth (package-scoped proposal only) | — |

## 7. Budget — call counts, not spending authority

All paid phases are sequential (REQ-188) and stop at the owner's cap (REQ-227).
One answer plus one lone grade is two calls; a two-model run adds one ranking
call per case per arm.

| Phase | Calls (formula) | Calls at default sizes |
| --- | --- | --- |
| 1 grader check | diagnostic cases × 2 | about 94 |
| 2 refresh, full paired | eligible cases × 2 sides × 2 | 1,568 at 392 cases |
| 3 arms | diagnostic cases × 4 arms × 2, plus 2 extra repeats on named and disputed cases | about 400 plus repeats |
| 4 models | (diagnostic + held-out) × (2 answers + 2 grades + 1 ranking) + diagnostic × 5 for the best arm, plus repeats | about 870 plus repeats |

Dollar figures come from the dry run in Phase 0 against the rate table, which
the owner re-checks before spending. For scale only: REQ-188's note estimates a
GPT-4.1 case at about $0.02 with grading.

## 8. Boundaries kept

- **Mock first:** `ASK_AI_PROVIDER` unset stays mock; every new command dry-runs
  without a key or network; only `--confirm-live-calls` with a cap spends.
- **Provider modularity:** no change to `AskAiProvider`, the provider factory,
  routes, the request schema, or the frontend. Evaluation code uses the existing
  minimal Responses client shape with an injectable client.
- **Stack order:** In-Depth stack order is untouched; no case changes its
  `gameState`.
- **Gold answers stay apart from runtime evidence:** reference answers never
  enter any answer prompt; deciding-rule labels shape only arms C and D on the
  diagnostic set; no runtime query or retrieval tuning reads held-out labels.
- **Never a build gate:** answer scores and compare reports never fail a build;
  only the new tooling's unit tests (fake clients) run in `quality:check`.
- **No corpus edits to improve a score;** no ratchet raised to hide a loss.

## 9. Product-truth proposal

`GATE-QUESTIONS.md` proposes eleven stable-ID changes:

| ID | Kind | One line |
| --- | --- | --- |
| REQ-226 | new | Named experiment runs with fixed case lists, repeats, identity record, own folder, and a regrade mode (also carries the system-map edit) |
| REQ-227 | new | Save as you go, resume, hard spending cap, unpriced models refused |
| REQ-228 | new | Paired before/after comparison report, never a verdict |
| REQ-229 | new | Offline evidence trace: rank, selected, available-to-answer, exceptions |
| REQ-230 | new | Diagnostic prompt arms confined to a diagnostic set; held-out set |
| REQ-185 | amend | Defines "live prompt" as a player's prompt and names the arm exception |
| REQ-186 | amend | Judge told what the prompt actually carried; inputs part of rubric revision |
| REQ-187 | amend | Rubric revision note for the judge-input change |
| REQ-188 | amend | Combo catalog, reasoning tokens, unpriced, experiment mode |
| REQ-189 | amend | New record fields; experiment runs never write the committed file |
| NFR-018 | amend | The validation track names the experiment tooling |

### Amendment set (grep, line level, 2026-10-07)

Each hit of a rule this design changes, with its disposition:

| Hit | Rule | Disposition |
| --- | --- | --- |
| `functional-requirements.md` REQ-185 constraint "never enter a live prompt" | gold data separation | amended (REQ-185 block) |
| REQ-222 constraint "eval data never enters a live prompt (NFR-018)" | gold data separation | unchanged — the gate builds only production prompts; REQ-185's new definition covers the term |
| REQ-189 constraint "never becomes runtime prompt context" | gold data separation | unchanged — arms are not runtime |
| `non-functional-requirements.md` NFR-018 constraint "never becomes runtime prompt context" | gold data separation | unchanged wording; NFR-018 amended for dependencies only |
| REQ-177 constraint "never becomes runtime prompt context" | benchmark data | unrelated, unchanged |
| REQ-186 layer-2 criterion "the assembled prompt's supplemental rule ids" and note "The judge prompt carries the question, answer, reference, rule ids, and rubric" | judge inputs | amended (REQ-186 block) |
| REQ-188 criterion "the four data files `createConfiguredApp.ts` loads" | evaluation prompt parity | amended (REQ-188 block) |
| REQ-188 constraint "no reasoning-effort ... parameter" | request parameters | amended to name reasoning models generally; rule kept |
| REQ-189 criterion "a recorded run **merges** into the committed results file" | result destination | amended (experiment runs excluded) |
| `system-map.md` Answer-quality baseline summary "Writes a small committed scores file merged per case" | result destination | amended (inside the REQ-226 block) |
| `goals-and-non-goals.md` "automated answer-quality gating" line | never a gate | unchanged — still never a gate |
| `in-depth/README.md` and `quick-lookup/README.md` | player behavior | unchanged — no player-visible change |
| `integrations-and-data.md` provider configuration | provider config | unchanged — production configuration untouched |

The code-adjacent `apps/backend/src/eval/worked-solutions/README.md` is updated
at build to describe experiment runs, the trace, arms and manifests.

### Stable IDs and PR #266

REQ-220 and REQ-221 stay reserved by the deferred draft docs PR #266 (the
cards-attached rule-retrieval proposal). REQ-222 to REQ-225 are already live
truth from the rules test harness, so this package's new IDs start at REQ-226.
This package neither uses nor withdraws #266's reservation. Its approach is
remeasured as one retrieval candidate in Phase 3 and D4; the follow-up package
then either revives #266 under its reserved IDs or closes it and releases them.
#266's content was not opened here (intake-cited, citation only).

## 10. Material assumptions

The ladder rungs are from `PRD/instructions/preparation-contract.md`: 1 active
requirements, 2 tested behavior, 3 local patterns, 4 smallest reversible scope,
5 preserve user-visible behavior, 6 no new dependency or contract without scope.

| # | Assumption | Rung | Evidence |
| --- | --- | --- | --- |
| A1 | New IDs start at REQ-226, not REQ-222 | 1 | REQ-222–225 are headings in `functional-requirements.md`; REQ-220/221 reserved by #266 (`STATUS.md` row on the #266 branch; owner memory) |
| A2 | "Before" means the recorded base commit `3e973ced`, not the deployed AWS app; checking the deployed revision is an optional runbook step | 4 | intake states AWS was not checked; `scripts/aws-deploy.sh` pins `gpt-4.1`, 15 s, 2 retries, local embeddings |
| A3 | No paid call in this package's build; paid phases run after merge under owner caps | 1, 4 | REQ-188 confirmation gate; driver's authorised scope; intake's "do not add `--confirm-live-calls` until … authorized" |
| A4 | Extend the existing command and modules rather than add a new tool | 3 | `executeEvaluation`'s injected `deps`; REQ-188/189 structure |
| A5 | Experiment runs never touch the committed `results.json`; routine runs unchanged | 4, 5 | REQ-189 merge rule; fixed `RESULTS_RELATIVE_PATH` |
| A6 | Old revisions are measured by running the tooling from each revision's own worktree with the tooling commits applied on top, with no cross-checkout import; a run records the commit it executes from | 4 | owner's `edit` verdict on REQ-226 (2026-10-07); base and head predate the tooling |
| A7 | The judge fix restores REQ-186's stated input and adds excerpt text and labelled deciding ids; the rubric revision bumps | 1 | REQ-186 layer 2 vs `judge.ts` line 112 and `ruleIds: caseEntry.expected.decidingRuleIds` |
| A8 | No reasoning-effort parameter; Luna at its default; reported effort recorded | 1 | REQ-188 constraint |
| A9 | Evaluation answer calls keep the SDK's default timeout and retries; runtime suitability is read from recorded latency and REQ-228's slower-than-15-seconds count | 1 | owner's `edit` verdict on REQ-188 (2026-10-07) |
| A10 | Evaluation loads the combo catalog when combo enrichment is on | 2 | `comboEnrichmentEnabled` defaults true; deploy does not set it; `loadPromptResources` omits it |
| A11 | An unpriced model blocks a capped live run | 4 | `computeCallCostUsd` returns 0 for unknown models |
| A12 | Luna's rate enters the table with a check date; the owner re-checks before spending | 4 | intake rates are evidence only; REQ-188 note "re-checked before a live run" |
| A13 | The owner names the judge before Phase 1; it is fixed for all phases | 1 | REQ-186: judge stronger than every answer model, never one of them; Luna's strength relative to `gpt-5` is unknown here |
| A14 | Arm C's bundle is mechanical (deciding rules, parents, lettered subrules), no new labelling | 4 | `decidingRuleIds` exist on every case; the 514.3/514.3a pattern |
| A15 | Diagnostic about 47 cases, held-out 80, seeded; adjustable at build from Phase 0 counts with a recorded reason | 4 | measured pools: 14 partial, 91 none, 287 full |
| A16 | Wording variants deferred; held-out related cases stand in | 4 | REQ-185: variants are future `layers.variants` entries |
| A17 | The ten re-snapshotted cases count only if their head review provenance is an owner verdict; otherwise excluded and counted | 1 | REQ-224: only the owner's apply sets `approved` |
| A18 | #266's reservation untouched; its approach remeasured as a candidate | 4 | driver instruction; intake |
| A19 | Findings and runbook live in `docs/eval/answer-quality-investigation/` | 3 | close deletes `PRD/work/<slug>/` (graph contract, Propose / apply / close) |
| A20 | The follow-up release rule (D5) is a package-scoped proposal, not durable truth | 4 | intake labels it "for owner review"; no REQ needs it yet |
| A21 | The merge decision for #273 is a recommendation; the comparison uses pinned SHAs whether or not #273 merges first | 1, 4 | intake; owner merges all PRs |
| A22 | The structured-state stratum is empty today and reported as such | 2 | 0 approved cases with a `gameState` |
| A23 | Phase 2 defaults to the full paired cohort; falls back to changed stratum plus a seeded sample under a lower cap | 4 | unchanged-input stratum doubles as the noise control |
| A24 | REQ-228, REQ-229 and REQ-230 follow the REQ-226 rule too: the evidence trace drops `--subject` / `--subject-b`, measures the checkout it runs from (refuses uncommitted changes, records its commit), and compares two revisions with `eval:evidence-trace:compare` over two trace folders, each produced from its own worktree; "subject" is reworded to the checkout a command runs from (or the revision), with no change of substance. The compare command's form copies REQ-228's `eval:answer-quality:compare -- <a> <b>` and the `eval:rules-review:render`/`:apply` naming | 1, 3 | owner's `edit` verdict on REQ-226, quoted in `GRAPH-RUN.md` `## Gate verdicts`: "Drop the cross-checkout `--subject` import: the run records the commit it executes from, and two revisions are compared by running the tooling from each revision's own worktree with the tooling commits applied on top."; gate-qc attempt 2 findings 1–2 (`QUALITY-CHECK.md`); `package.json` script names |

## 11. Blockers

None. No question meets all three conditions of the genuine-blocker test: the
spending caps and the judge choice are owner inputs before paid phases, and the
smaller option (no spend) decides no product behavior.

## 12. Build verification

Focused, offline, no network:

- unit tests with injected fake clients for REQ-226 to REQ-230 and the amended
  REQ-186 to REQ-189 behavior, under `scripts/*.test.mjs` and
  `apps/backend/src/eval/**`;
- `npm run eval:answer-quality` dry run (no key) prints unpriced models and every
  rate's check date, and makes no network call;
- the evidence trace, run from the revision that wrote the committed
  `baseline.json` (the base worktree, tooling commits applied on top), reproduces
  its hit and miss for every approved case (parity check); no cross-checkout
  import;
- arms tests (same-evidence, bundle-only, no reference answer) pass for every
  diagnostic case;
- the regression guard still shows `eval:answer-quality` and the new compare and
  trace commands in no gate script;
- `npm run quality:check` before the code PR.

## 13. Suggested slice boundaries (for map-out)

A experiment runs and identity (REQ-226) · B checkpoint, resume, cap, unpriced
(REQ-227) · C grader repair and runtime parity (REQ-186–189) · D evidence trace
(REQ-229) · E arms and manifests (REQ-230, REQ-185) · F compare report (REQ-228)
· G Phase 0 run, findings, runbook, NFR-018, system map, eval README.

## 14. Citations (recorded, not opened)

- Owner intake: `intake/GRAPH-BRIEF.md` (read; evidence, not authority)
- `PRD/work/probe-answer-quality/FINDINGS-integration.md`,
  `FINDINGS-retrieval.md`, `FINDINGS-evaluation.md` (launch checkout; not opened)
- PR #273, `https://github.com/ChrisMiho/TheJudge/pull/273` (not opened)
- PR #266, draft, head `9211fa62` (not opened)
- Model and pricing pages for GPT-4.1, GPT-6 Luna and API pricing at
  `developers.openai.com` (not opened)
