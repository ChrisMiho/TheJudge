Nothing required yet (FYI): the existing harness needs fresh paired results and explicit comparison controls.

# Evaluation readiness and comparison protocol

The harness can generate useful fresh evidence, but the saved scores cannot establish whether the data refresh improves answers. Run a new, fixed-cohort before/after comparison with GPT-4.1 first, then test retrieval and prompt changes, and compare answer models only after those inputs are held steady. Green offline tests alone do not establish answer correctness or absence of retrieval regressions.

Read-only investigation on 2026-10-07. Base: `3e973ced8d406ba7d608ca60598ed7ea13457385`. PR #273 head: `07cc3ab6363570ccb4e450820d1eee990abc6dbb`. No provider calls, paid evaluations, case approvals, product edits, merges, or baseline changes were made. Commands below are a future execution protocol, not evidence that runs happened.

## Measured corpus and saved results

| Measure | Base checkout | PR #273 head |
|---|---:|---:|
| Cases | 393 | 400 |
| Approved | 392 | 392 |
| Draft | 0 | 7 |
| Rejected | 1 | 1 |
| Stale against each revision's own snapshots | 0 | 0 |

Base approved tiers: 80 tier 1, 310 tier 2, and 2 tier 3. `node --import tsx scripts/rules-staleness.mjs` confirmed no stale cases, no pending query-vector re-freezes, and no missing vectors on base. PR head counts/staleness were computed from Git blobs and the shared `compareSnapshot` function without checking out or modifying the PR.

The 392 approved cases retain their IDs, question text, and reference answers across the two revisions. This is a suitable paired cohort after reference validity is checked. The 7 new drafts cannot enter answer-quality scoring until owner approval; show them as separate coverage additions, never as improvements in the old cohort.

Ten original approved cases become stale when their original snapshots are checked against the refreshed data. PR #273 updates those snapshots, producing its zero-stale result. The cases are `boast-tuskeri-firewalker`, `combat-flying-and-shadow`, `copies-quicksilver-gargantuan-and-tarmogoyf`, `exhaust-afterburner-expert`, `forecast-sky-hussar`, `max-speed-amonkhet-raceway`, `necropotence-silence-borne-upon-a-wind-cleanup`, `replacement-lifegain-and-draw-replacements-combine`, `shuffle-sylvan-primordial`, and `token-created-by-name-uses-oracle-card`. Confirm the supporting-text changes still support the unchanged references and the approval provenance. Updating hashes alone does not validate a reference. Only the token case changes `reviewedOn`; the other nine already show the same date on base.

The committed `apps/backend/src/eval/answer-quality/results.json` contains 144 records: 18 cases × 4 models × 2 caps. They were generated on 2026-09-07 under rubric `2026-09-07.1`; every record lacks both a prompt hash and reference-answer hash. Current rubric is `2026-10-06.1` (`rubric.ts:77`). Historical 18/18 scores for some legs therefore are not a current baseline. The default `--changed` run should select all 392 current approved cases: 18 have obsolete unhashed records, 374 were never scored. It will cost a full run, not a small incremental refresh.

## The offline ratchet already changed in the PR

The PR's `apps/backend/src/eval/rules-gate/baseline.json` changes `multiplayer-only-blood-ends-your-nightmares-opponents` from hits `[608.2d, 701.21a]` to hit `[701.21a]`, miss `[608.2d]`. It also adds hits for deathtouch and frenzy and seven new case entries. Preserve and compare the original baseline before accepting this as non-regression. The gate uses the checked-out baseline, so passing against an edited baseline cannot demonstrate that an old hit survived. `rulesGate.ts:250` normally refuses to lower the baseline unless `--allow-regressions` is passed.

Retrieve the exact evidence with:

```sh
git diff 3e973ced8d406ba7d608ca60598ed7ea13457385 07cc3ab6363570ccb4e450820d1eee990abc6dbb -- apps/backend/src/eval/rules-gate/baseline.json
```

This loss is a retrieval finding, not proof the answer is wrong. Include this case in the first targeted answer comparison and explain whether another prompt section still supplies the deciding rule.

## What the harness measures and where comparisons can mislead

- Production prompt preparation is reused, with attached cards, committed card text/rulings, and the actual retrieval query embedding (`scripts/lib/prompt-fidelity.mjs:41,110,155`). Local embeddings are the default. The runner refuses silent lexical fallback. The generated answer call uses the same `{model,input}` shape as the production provider, but bypasses its timeout/error wrapper (`eval-answer-quality.mjs:525`; `openAiResponsesProvider.ts:29`). It is an answer-quality instrument, not a deployment availability or timeout test.
- `--changed` keys records by case, answer model, and cap, then checks prompt and reference hashes (`answer-quality-run.mjs:31,46`). It does **not** invalidate a record because the judge, rubric, generation settings, or alias's underlying model changed. Do not use it as the experimental selector. Use an explicit frozen cohort; with the current unchanged 392 approved cases, `--all` provides that cohort, subject to preflight comparison of selected IDs.
- The displayed headline checks approval, staleness, and reference hash, but not current prompt hash or current judge/rubric (`answer-quality-run.mjs:172`). A partially refreshed file can mix evidence from different product states. Build the report only from the fresh records for the exact experiment, not the merged headline.
- `goldRuleInPrompt` means **at least one** deciding rule appeared in System 3 (`prompt-fidelity.mjs:103`). The retrieval report's case pass requires **all** expected deciding IDs (`eval-worked-solutions.mjs:67`). Keep all-rule coverage, per-rule recall, and answer correctness separate. A rule can also be present elsewhere in the full prompt; inspect that separately from System 3 coverage.
- The judge currently receives expected rule IDs labeled as IDs actually attached, rather than the actual selected rule excerpts (`eval-answer-quality.mjs:540`; `judge.ts:112`). The grounding rubric says it assesses use of excerpts the prompt actually attached (`rubric.ts:42`). Therefore grounding cannot presently prove faithful use of retrieved evidence. Treat that score as provisional; supply actual prompt evidence to a diagnostic grader or repair the evaluation instrument before relying on it to compare prompt organization. A grading change requires the same revised grader on both arms.
- Both judge paths receive `question`, reference answer, and answer text, but not structured `gameState` or the attached card texts. Ensure the reference fully states the decisive situation; otherwise add identical serialized context to both grading arms before claiming improvements on complex game-state questions.
- `undetermined` scores are excluded from the fully-correct numerator but included in `graded` (`answer-quality-run.mjs:186`). Report invalid/missing/undetermined counts explicitly and rerun or manually review them; do not present them as measured rules failures. Lone-judge failures lose their reason in the stored transcript, though ranking failures retain one.
- `compareRecords` checks reference hash, judge, rubric, and embedding-provider label (`artifact.ts:283`) but not case ID, cap, or complete data/config identity. Missing fields on both records can compare equal. Explicitly pair the same case and cap and require known, matching grading identity. For model-only comparisons, require identical prompt hashes too. For data/prompt experiments, prompt changes are intentional and should be recorded rather than rejected.
- The direct Responses calls set neither reasoning effort nor output limits. A model comparison currently compares provider defaults as well as model IDs. Record resolved model IDs and generation settings; use a judge distinct from candidates. The implementation flags judge/candidate overlap but does not prevent it.

## Preserve experiments before overwriting them

`--output-dir` controls transcripts only. `resultsPath` is fixed to `apps/backend/src/eval/answer-quality/results.json` (`eval-answer-quality.mjs:786`); each fresh case/model/cap replaces that prior record (`answer-quality-run.mjs:149`). Transcript filenames also repeat unless each run uses a distinct directory (`artifact.ts:214`). Archive each completed result file immediately beside its run's transcripts and manifest. Do not allow concurrent runs in the same checkout.

Manifest requirements: full code commit plus dirty diff hash, data-file hashes (rule index, topics, rule embeddings, card detail, card rulings, combo data where applicable), cohort IDs and reference hashes, case payload hashes, answer and judge model IDs/settings, rubric revision, cap, embedding model/version/config, query vectors or vector identity, run start/end, and run label. Capture the exact prompts and generated answers. The current artifact's short commit and embedding-provider label do not capture all these inputs.

An answer call exception terminates the run before the final aggregate write; earlier transcripts can survive, but there is no per-case result checkpoint/resume protocol (`eval-answer-quality.mjs:525,654`). For a large run, add resumable per-call recording or execute documented small cohorts with a failure policy. There is no CLI case-ID list or hard spend cap today. A fixed seed samples the same IDs only when candidate membership is identical.

## Agent execution sequence

1. Freeze base and PR head in separate worktrees, install the same dependencies, and establish local embedding cache availability. Record original baselines and manifests before modifications. Inspect the ten snapshot refreshes and the known lost hit. Do not merge merely to measure the PR.
2. Run corpus/schema/coverage tests and the existing offline rules gate on both revisions. Report actual rule hits against the original baseline, even if the PR's own gate passes. Run the semantic retrieval report on both and compare the common case IDs; report new drafts separately.
3. Use GPT-4.1, cap 10, local embeddings, the same judge and rubric, and the fixed 392-case approved cohort. First use a smaller identical sample plus both owner tester cases and the lost-hit case for operational validation; the CLI cannot select that custom union, so use the exported runner with an explicit case list or add a manifest selector. Then run the full paired cohort. Preserve each result/transcript set before doing anything else.
4. Report per-case transitions (wrong→right, right→wrong, unchanged), separate tiers 1–2 from tier 3, and show undetermined/error cases. Review every right→wrong change and both tester cases against authoritative references. Net score alone can hide regressions. Re-run discordant cases to distinguish unstable generation/grading from durable changes; keep repeats as separate trial records. If useful, report a paired uncertainty interval, not unpaired averages or an invented success threshold.
5. Hold the refreshed data, approved references, GPT-4.1, cap, and grader fixed while testing one retrieval or prompt-format intervention at a time. Use the same original cohort plus a separately reported challenge set. Inspect exact prompt deltas and retrieval traces to attribute improvements.
6. On the winning data/prompt setup, run GPT-4.1 and explicitly chosen alternative API model IDs on identical prompts. Blind ranking works only across multiple models within the same cap/run; it does not compare old/new GPT-4.1 answers across separate runs. Do not assume the hard-coded `--bake-off` lineup reflects the owner's requested candidate. Obtain verified model identity, availability, settings, and current pricing before configuring alternatives.
7. Produce a reviewable merge recommendation with corpus validity, paired scores, known regressions, actual answer/judge costs, latency, and remaining uncertainty. Merge/deploy authorization remains a later action, outside this investigation.

Useful commands for the future agent, executed in **each correct worktree**:

```sh
node --import tsx scripts/rules-staleness.mjs
npm --workspace apps/backend run test -- src/eval/rules-gate/rulesGate.test.ts src/eval/caseRequest.test.ts
EMBEDDING_PROVIDER=local npm run eval:worked-solutions -- --output output/answer-quality/base/retrieval.txt
EMBEDDING_PROVIDER=local npm run eval:answer-quality -- --all --model gpt-4.1 --excerpt-cap 10 --output-dir output/answer-quality/base
```

Use `candidate` instead of `base` in the PR worktree. The final command is a plan, not an answer run; it can still make a models-list network request when credentials are configured (`eval-answer-quality.mjs:839`). To make that planning path strictly offline, invoke exported `run` with `loadLocalEnv: () => ({env:{EMBEDDING_PROVIDER:'local'},sources:[]})` and an empty process env, using existing local model files. Do not casually assume a normal dry run is network-free.

After explicit live-call authorization and budget agreement, append `--confirm-live-calls` to the selected answer command. Immediately archive its scores with:

```sh
cp apps/backend/src/eval/answer-quality/results.json output/answer-quality/base/results.json
```

These are existing commands, not a complete automated paired-report implementation. The manifest selector, resumable history, budget enforcement, reliable grounding inputs, and paired report are tooling gaps to shape into the agent's work package if required for unattended execution.

## Cost and run limits

The default single-model full cohort is 392 answer calls + 392 lone-judge calls = 784 calls. Two paired revisions total 1,568 calls before retries. A two-model final comparison at one cap adds 784 answers + 784 lone judgments + 392 rankings = 1,960 calls. A 20-case single-model smoke run is 40 calls per revision. The built-in four-model bake-off at one cap would make 3,528 calls on 392 cases.

Cost estimates use hard-coded prices, characters/4 for input tokens, 600 answer-output tokens, and fixed judge assumptions (`eval-answer-quality.mjs:96,107`). Unknown model prices are silently omitted from estimates and counted as $0 for actual recorded cost (`:337,371`). There is no enforced dollar budget, output-token cap, or run-level timeout. The old saved dollar total predates judge-cost accounting. Do not reuse it as a forecast. Verify current official rates, include reasoning/output token use and judge calls, agree a monetary ceiling and stop conditions, and report unpriced usage explicitly before any paid comparison. This probe did not verify current API prices or model availability.

## Measurement method

Read and validated base cases via `loadGoldCases`; loaded current committed source indexes via `loadSnapshotSources`; compared each case using `compareSnapshot`. Loaded the three PR-head source blobs with `git show`, decompressed card data in memory, and supplied equivalent accessor functions to that same shared comparator. Applied only the PR's changed/new case blobs in memory to enumerate its corpus. Compared existing case questions/references and summarized the saved score artifact. No credentials were read or displayed, and no data/cache files were generated.
