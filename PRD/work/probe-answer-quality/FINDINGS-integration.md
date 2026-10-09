Nothing required yet (FYI): preserve a reproducible before/after comparison before treating the data refresh as an answer-quality improvement.

# Integration and model findings

## Repository and PR state, checked 2026-10-07

- Local main / PR #273 base: `3e973ced8d406ba7d608ca60598ed7ea13457385`.
- [PR #273](https://github.com/ChrisMiho/TheJudge/pull/273) head: `07cc3ab6363570ccb4e450820d1eee990abc6dbb`. Open and mergeable; static, backend, three frontend shards, and coverage checks succeeded. Deployment was skipped. This establishes CI status, not answer correctness or the actual production revision.
- Test-review PRs #271 and #272 are already in main. The harness exists; building it again would duplicate work.
- Main coverage: 393 total cases, 392 approved, one rejected. PR #273 adds seven drafts covering six new mechanics; approved count remains 392. Its 264 mechanics include 256 approved, six draft, and two excluded. Draft coverage is not approved answer coverage.
- PR #273 changes data, prompt goldens, case dependency hashes, coverage, frozen vectors, the retrieval baseline, and refresh wrapper code. The title alone understates its review scope.
- Its baseline changes the Blood Ends Your Nightmares multiplayer case from hitting both `608.2d` and `701.21a` to missing `608.2d`. A PR comment explicitly calls this an accepted ranking regression. Preserve that exception in the evaluation report and test its answer; do not present a clean CI result as zero regressions. Other baseline changes add hits for deathtouch and frenzy plus the new cases.
- Ten existing cases have refreshed dependency hashes. The PR comment says their answers were reviewed and still hold. Recheck any changed reference/request when constructing a common cohort; do not assume changed hashes mean a changed answer.
- The latest PR content supersedes its first comment: heal, Power-up, and Teamwork are no longer excluded. There are seven drafts, not just the initial three.
- [PR #266](https://github.com/ChrisMiho/TheJudge/pull/266) is a deferred, draft, docs-only retrieval proposal at `9211fa623ea9a5dcc52fc17aa998ed9b4a929983`. It is not a shipped retrieval fix. Its historic measurements and rules-date assumptions need remeasurement. Its files survive in `.worktrees/kickoff-niche-interaction-rule-tests/PRD/work/niche-interaction-rule-tests/`.

Evidence commands: `gh pr list`, `gh pr view 273 --json ...`, `gh pr view 273 --comments`, `gh pr view 266 --json ...`, `git diff 3e973ced 07cc3ab6`, and `git show <revision>:<artifact>`. No PR was changed or merged.

## GPT-4.1 versus Luna

Repository deployment configuration explicitly selects `gpt-4.1`, a 15,000 ms SDK timeout, and two retries (`scripts/aws-deploy.sh:28`). Actual AWS configuration was not inspected. The production provider sends only `model` and the assembled `input` string (`apps/backend/src/providers/openAiResponsesProvider.ts:40`).

Official documentation fetched on 2026-10-07 confirms:

| Candidate | API ID | Relevant characteristic | Standard short-context USD / million input, output tokens |
| --- | --- | --- | --- |
| Current baseline | `gpt-4.1` (snapshot `gpt-4.1-2025-04-14`) | Non-reasoning model | $2.00 / $8.00 |
| Suggested challenger | `gpt-6-luna` | Reasoning model; effort supports none, low, medium (default), high, xhigh, max | $0.10 / $0.50 |

Sources: [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [API pricing](https://developers.openai.com/api/docs/pricing). Rates are time-sensitive; check again before a paid run. Reasoning-token use and the separate grading model affect total cost. Account access and MTG accuracy remain untested.

Recommendation: include Luna as a measured challenger; keep GPT-4.1 as the control. Availability, a larger context window, and reasoning support do not establish superiority on these cases. The repository's `--bake-off` lineup contains only GPT-4.1 mini, GPT-4.1, GPT-5 mini, and GPT-5 nano; use explicit model arguments for a new comparison.

The evaluator accepts arbitrary model IDs, but its pricing map omits Luna and treats unknown-model costs as zero (`scripts/eval-answer-quality.mjs:328–375`). Fix or explicitly supplement that accounting before approving a budget. It also sends no explicit reasoning effort. Record model/effort/API options and verify endpoint compatibility before comparing. Runtime timeout/retry behavior needs its own check; a successful offline evaluator call is not proof a player receives an answer within the deployed timeout.

## Consequence for the handoff

First freeze the two revisions, case cohort, grading rules, and full prompts. Compare data-only changes on GPT-4.1; isolate retrieval and presentation experiments next; compare models on identical evidence. Preserve all per-case losses even when aggregate scores rise. Produce a merge recommendation for #273 separately from any model-switch recommendation. No live evaluation or merge is authorized by this planning artifact itself.
