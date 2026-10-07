Review: prepare a controlled answer-quality investigation using the harness that already exists. The next agent should explain which changes improve answers and which introduce regressions before recommending a retrieval redesign or model switch.

# Graph-run brief — complex-interaction answer quality

## What the player gets

More reliable explanations of difficult Magic interactions, backed by comparisons against reviewed answers. Preserve good existing answers while fixing cases like Academy Manufactor + Esix and Necropotence + Silence + Borne Upon a Wind.

The owner asked for an agent-ready plan to integrate the latest data/test work, compare old and new responses, examine how evidence reaches the model, and assess GPT-4.1 versus Luna. This brief defines that investigation. It does not claim that a prompt fix, retrieval fix, or model upgrade has already won. Formal implementation slices belong to map-out after refinement.

## Verified starting point — do not rebuild the harness

Measured 2026-10-07:

| Item | Finding |
| --- | --- |
| Base revision | `3e973ced8d406ba7d608ca60598ed7ea13457385`, current local main |
| Pending data PR | #273, `https://github.com/ChrisMiho/TheJudge/pull/273`, head `07cc3ab6363570ccb4e450820d1eee990abc6dbb` |
| CI | Static, backend, frontend shards, coverage green at inspected head; deploy skipped |
| Already merged | Test harness and review work, including PRs #271 and #272 |
| Base corpus | 393 files: 392 approved, one rejected; approved tiers: 80 official-rule cases, 310 official-ruling cases, two owner-approved derived answers |
| PR corpus | 400 files: same 392 approved, seven drafts, one rejected; seven drafts cover six new mechanics |
| Paired cohort | All 392 approved IDs, questions and reference answers match between base and PR head |
| Refresh review | Ten approved cases acquire changed source dependencies; PR updates snapshots. Their references need source-review provenance even though head reports no stale cases |
| Historical scores | 144 records over only 18 cases; old rubric, no prompt/reference hashes. They are historical context, not a valid baseline for this study |
| Existing retrieval proposal | Deferred draft docs PR #266, head `9211fa623ea9a5dcc52fc17aa998ed9b4a929983`; not implemented |

PR #273 changes more than data: prompt goldens, dependency snapshots, coverage, frozen vectors, the rule-hit baseline, and refresh wrapper code. It explicitly accepts one lost rule hit: `608.2d` for `multiplayer-only-blood-ends-your-nightmares-opponents`; `701.21a` still hits. Carry this exception into the comparison and inspect its answer. Green CI is not proof of no answer regressions. Its earlier comment about excluding three Marvel mechanics is superseded: those mechanics now have draft rule-text cases.

Production deployment code specifies `gpt-4.1`, a 15-second SDK timeout, two retries, and local embeddings. Actual AWS revision/configuration was not checked. Establish that separately if “old” is intended to mean today's deployed app rather than the recorded base commit.

## What the current probe establishes

Offline production prompt preparation with the current committed case requests and frozen query vectors found:

| Case | Rules selected / missing | Evidence implication |
| --- | --- | --- |
| Academy Manufactor + Esix | None of four deciding rules arrive; hybrid ranks: 614.1a = 1916, 616.1 = 1111, 616.1e = 2329, 616.1f = 646 | A modest increase from ten excerpts cannot retrieve this rule set |
| Necropotence + Silence + Borne Upon a Wind | 514.1 arrives (rank 3); 514.2 absent (rank 29); 514.3a absent (rank 13) | Prompt includes 514.3's normal rule referring to an exception, but omits the exception 514.3a |

Both prompts contain every attached card's oracle text and committed rulings. Prompt lengths are 16,710 and 12,565 characters. These are current retrieval/assembly findings, not fresh live-answer grades. The older #266 report that cleanup was a retrieval hit used different question wording; do not reuse that result as current evidence that only reasoning is broken.

The rule gate tracks supplemental selected IDs, not every rule in the final prompt. Measure final text across curated topics, supplemental excerpts and card rulings; distinguish “selected in search” from “available to answer.” The static MTG preamble also contains a sentence conflating continuous effects and state-based actions with layers. Verify and test any correction independently; this inspection does not establish its effect on answers.

## Investigation sequence

### 1. Freeze inputs and validate the measuring tool

Use isolated checkouts of the exact base and PR head, preserving the owner's main checkout and existing worktrees. Recheck head SHAs before starting; if either changes, record a new comparison instead of silently mixing revisions.

Record code and data hashes, complete case/request/reference hashes, rules date, model IDs, API options, embedding provider/model, rubric, judge model, timeout/retry settings, and experiment identity. Archive full prompts, retrieval traces, answers, scores, latency and usage under unique run IDs before another run can replace them.

Validate the ten changed source dependencies against the unchanged reference answers; preserve existing review provenance. Exclude genuinely stale/unreviewed references and report the exclusion count. Keep seven new drafts out of scored results until owner review; report them separately as coverage pending review. Do not alter a question or expected answer to improve a score.

Check evaluator limitations before spending:

- Its committed score file is shared even with distinct `--output-dir` arguments. Preserve each baseline and candidate result file; extend result destination/run identity where needed so before/after records cannot overwrite each other.
- `--changed` is a convenience for routine runs, not a paired study or repeated trial. Explicitly freeze the case list for every arm; check model, judge, rubric and configuration identity as well as prompt/reference hashes before reusing results.
- Gold answers and deciding-rule labels may be used by the grader and diagnostic controls only. They must never enter ordinary answer prompts, runtime retrieval queries, or retrieval tuning on the held-out set.
- Confirm prompts prepared by the evaluation path match the deployed request path for attached cards, structured game state, combo enrichment and embeddings. A local semantic fallback must be reported as a different condition, never quietly accepted.
- The shared evaluation resource loader currently omits the runtime combo catalog. This does not affect the two tester questions, which lack explicit combo intent, but must be resolved or declared for combo cases before claiming universal runtime parity.
- Repair grounding inputs before relying on that score: the judge currently receives expected deciding-rule IDs labeled as attached IDs, and receives neither actual retrieved excerpts nor structured game state. Supply actual evidence and the decisive state consistently to both arms. Version the revised grader, then regrade both baseline and candidate; do not compare old and new grading definitions.
- Distinguish the existing `goldRuleInPrompt` flag (any one expected rule among supplemental selections) from all deciding rules actually present in the complete prompt. Report both per-rule coverage and complete-procedure coverage.
- Calibrate the grader on a small manually adjudicated mix of correct, subtly wrong, and ambiguous answers. Read all changed/failing critical-case answers; a second model's score alone is not proof of correctness.

### 2. Compare the data refresh on GPT-4.1

Run the same approved, non-stale cohort on base and PR head using identical GPT-4.1 configuration and grading. Target the common 392 cases after source review. Maintain separate tier-1/2 and tier-3 scores; both owner-derived tester cases remain explicit release checks even though they are reported separately.

Use exact production prompt preparation. Where full prompts are byte-identical, this is an unchanged-input stratum: report it, and label any reused answer as reused. An independently sampled control subset detects run-to-run variation. Do not call a single sampling difference an effect of refreshed data.

Report paired counts: right→right, wrong→right, right→wrong, wrong→wrong, and undetermined/error. List every newly wrong answer, reference change and missing case. Report results by mechanic/core rules area, tier, difficulty and structured-state versus lookup input. Show denominators and case IDs, not just an aggregate percentage.

Integration decision for #273: inspect its data/source changes, confirm required checks on the exact head, explicitly review the known lost `608.2d` hit and its answer, then give a concrete merge recommendation. Preserve baseline artifacts before merging. The planning request authorizes preparation, not an actual merge or deployment; the owner performs or authorizes that final action. A merge alone does not finish answer validation.

### 3. Separate retrieval, organization and model limitations

Start with the two tester cases, the known multiplayer regression, other measured failures, and representative passing controls. Partition cases into a diagnostic/tuning set and an untouched evaluation set before iterative changes. Include neutral wording variants and related interactions so a fix cannot win solely by recognizing the original two questions.

Trace each case through: user question and attached cards → retrieval query → candidate ranks → selected/dropped rules → final serialized evidence → answer → grade. Record missing parent rules, exceptions, definitions, truncated rulings, duplicated text and contradictory instructions. Missing official rulings should be distinguished from missing CR text; broader ingestion of release notes remains a separate scope decision.

Use controlled arms, keeping GPT-4.1 fixed:

| Arm | Change | Question answered |
| --- | --- | --- |
| A | Current refreshed prompt | What does the candidate app do now? |
| B | Same facts/evidence, clearer grouping and ordering only | Does presentation help without supplying additional facts? |
| C | Current presentation plus independently identified, complete deciding-rule bundle | Does supplying missing procedure/exception text rescue the answer? |
| D | Complete rule bundle plus the presentation from B | Do evidence completeness and presentation interact? |

Arm C/D are diagnostic controls that intentionally use known deciding rules, not a deployable retriever or a publishable production score. If they rescue failures, design a general retrieval candidate and then evaluate it without gold labels on held-out cases. Candidates include retrieving connected procedure/exception blocks, narrow evidence-based query expansion, and the old #266 replacement-effect proposal. Remeasure #266 on the refreshed corpus; do not implement it automatically. Earlier experiments found that indiscriminately adding all oracle text to the query worsened retrieval.

Keep evidence additions separate from changes to instructions, output format, or a request for an explicit game-state timeline. Prefer a concise player-visible explanation with decisive transitions; do not require disclosure of hidden chain-of-thought. Test a correction to the preamble separately if verified. Do not bundle a broad prompt rewrite, data refresh, cap change and model replacement into one unexplainable result.

### 4. Compare GPT-4.1 with Luna on identical inputs

Use explicit IDs: `gpt-4.1` as control and `gpt-6-luna` as the proposed challenger. Preserve resolved model/snapshot metadata. Test both on current evidence and the best validated candidate evidence; this reveals whether Luna merely compensates for evidence gaps.

Official docs checked 2026-10-07 describe GPT-4.1 as non-reasoning and Luna as a reasoning model supporting the Responses API. Luna defaults to medium effort and supports none/low/medium/high/xhigh/max. Repository answer calls currently set only model and input. Pin and record the intended effort for Luna; changing effort is another experimental variable.

Current standard short-context prices per million tokens: GPT-4.1 $2 input / $8 output; Luna $0.10 input / $0.50 output. Recheck before running. The evaluator pricing map does not include Luna and reports unknown-model costs as zero. Correct that accounting, include reasoning-token usage and grader costs, and test account access before the comparison. The old `--bake-off` flag does not include Luna.

Use correctness as the primary measure; also report grounding, calibration, readability, unsupported rule citations, failure/timeout rate, answer latency (including p50/p95), total usage and dollar cost. Measure against the actual 15-second SDK timeout plus retries and end-to-end request behavior. Evaluator success does not prove runtime suitability.

Repeat critical/disputed cases with at least three independent generations per arm as a diagnostic starting point. Expand when results disagree; three successes are not a statistical guarantee. Blind presentation order for manual comparisons and fix grader/rubric across arms. Keep budget and uncertainty visible. Retain GPT-4.1 if evidence is inconclusive; no migration is preselected.

### 5. Produce the decision and smallest justified follow-up

Deliver a readable report containing the paired data-refresh comparison, failure taxonomy with examples, controlled experiment results, model cost/latency comparison, per-case regressions, and remaining uncertainty. Distinguish observed results from hypotheses.

Proposed release rule for owner review: both original tester cases must pass adjudicated checks, existing offline invariants must pass, and every newly wrong approved case must be resolved or explicitly accepted. Do not invent an overall accuracy target before observing the baseline. Do not hide a critical regression behind an average improvement or raise a ratchet merely to silence it.

Only then propose the smallest product change supported by the results and route it through the existing lifecycle. If no candidate wins reliably, preserve the evidence and report that outcome. Clarification UX, new data-source ingestion, a deterministic rules engine, and a general multi-agent answer system are outside this initial package.

## Existing tooling and budget contract

Read `apps/backend/src/eval/worked-solutions/README.md` and inspect the commands at the selected revision. Useful existing commands:

```sh
npm run eval:rules-staleness
npm run eval:rules-coverage
npm run eval:worked-solutions
npm run eval:answer-quality -- --all --model gpt-4.1 --excerpt-cap 10 --output-dir <unique-run-path>
npm run eval:answer-quality -- --all --model gpt-4.1 --model gpt-6-luna --excerpt-cap 10 --output-dir <unique-run-path>
```

Answer-quality commands default to a cost preview; do not add `--confirm-live-calls` until the credential reuse choice and proposed batch budget are authorized. A preview with credentials may check access; inspect behavior first. Existing secret-loading rules and the OpenAI credential skill apply at execution, not as a reason to interrupt this read-only preparation.

At 392 eligible cases and one cap, a full single-model run entails 392 answers plus 392 grades = 784 calls. Two independent base/head runs entail 1,568 calls before repetitions. A two-model same-prompt run adds one blind ranking per case: 784 answers + 784 grades + 392 rankings = 1,960 calls. These are call counts, not dollar estimates or a spending authorization. Start with a bounded diagnostic cohort, use sequential calls, then expand within a concrete approved budget. Exclude drafts, report errors, and preserve partial progress if interrupted.

New comparison tooling must support distinct result destinations, fixed case manifests and repeat/run IDs where current flags cannot express the experiment. Add per-call checkpoint/resume and an enforced run budget before unattended large runs: today a call exception can terminate before the aggregate scores are saved, and no hard spend/output cap is enforced. Unknown-model costs must be reported as unpriced, never zero. Make changes through the implementation lifecycle, not by quietly changing production during investigation. Full required repository checks belong before a code PR; focused offline checks suffice for a read-only probe.

## Current-state PRD truth to amend only if the proposal requires it

- `PRD/sections/in-depth/README.md` and `PRD/sections/quick-lookup/README.md`: measured retrieval/prompt or answer behavior changes.
- `PRD/sections/functional-requirements.md`: existing answer-quality rules (REQ-185–190), current rules-harness requirements and any accepted retrieval contract changes. Resolve #266's reserved REQ-220/221 rather than duplicating its proposal.
- `PRD/sections/non-functional-requirements.md`: offline versus paid evaluation boundary, latency/cost expectations if changed.
- `PRD/sections/integrations-and-data.md`: evidence sources/provider configuration only if changed.
- `PRD/sections/system-map.md` and code-adjacent evaluator README: shipped tooling after implementation.

No new DEC entries. No PRD truth or product code was changed in this probe. Preserve mock-default operation, provider modularity, stack order, and separation of evaluation answers from runtime evidence.

## Evidence and handoff

Full evidence: `PRD/work/probe-answer-quality/FINDINGS-{integration,retrieval,evaluation}.md`. The decisions and starting numbers needed to execute this plan are inlined above; the next checkout need not see scratch artifacts. Rerun current-state measurements when revisions change.

Official model sources: [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [pricing](https://developers.openai.com/api/docs/pricing).

The graph run should produce a DESIGN-BRIEF for reproducible comparison tooling and this bounded investigation, with the necessary truth proposals and implementation slices. It must retain the empirical decision points; it must not assert a retrieval architecture or model winner before results exist. The eventual product fix may be a later package.

```text
$graph-kickoff "Prepare reproducible before/after answer evaluation for PR #273, isolate retrieval and prompt-organization failures, and compare GPT-4.1 with GPT-6 Luna before selecting a product fix" PRD/work/probe-answer-quality/GRAPH-BRIEF.md
```
