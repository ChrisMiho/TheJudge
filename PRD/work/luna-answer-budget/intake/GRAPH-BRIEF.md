# Graph-run brief — Switch live answers to GPT-6 Luna under one 30-second answer budget

Self-contained intake for `graph-kickoff`. The investigate-first questions are **resolved with
data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- **More right answers on hard interactions.** The judge's live answers move from GPT-4.1 to
  GPT-6 Luna, which got 125 of 126 hard rules questions right against GPT-4.1's 120, and was
  right on every one of the 12 questions where the two disagreed.
- **The hardest questions now finish instead of failing.** Today a long answer is cut off: after
  15 s the request is retried, the server is shut off at 20 s partway through that retry, and the
  player sees "Miho is working on it". After this change each answer gets one 30-second budget,
  long enough for every Luna answer measured (the slowest took 22.7 s).
- **A player never waits more than about 30 s for an answer.** A quick hiccup (dropped
  connection, OpenAI server error) is still retried, but only inside that same budget. A slow
  answer that runs out the clock is not started over.
- **A typical answer takes about a second longer** (median 3.8 s instead of 2.7 s). The waiting
  panel already has lines planned at 15, 25 and 40 s, so it already covers waits this long.
- **The built-in rules summary stops telling the model a wrong rule.** Today it says state-based
  actions use the layer system; they don't.

## Why (measured — do not re-derive)

From the 2026-10-09 paid investigation (REPORT.md of `probe-answer-quality`, on `main` since
PR #279) and a no-cost re-analysis of its Phase 4 records. Grader `gpt-6.1-sol`; the counts
below include the owner's blind adjudication of all 12 disagreements.

**Accuracy and cost** (production prompt, 126 approved cases, same prompts for both models):

| | GPT-4.1 | GPT-6 Luna |
| --- | --- | --- |
| Right of 126 | 120 | 125 |
| Held-out right of 80 | 76 | 80 |
| Preferred in blind side-by-side | 47 | 78 (p ≈ 0.007) |
| Right where the two disagree (12 cases) | 3 | 12 |
| Cites and uses attached rules (0–2) | 1.26 | 0.89 |
| Cost per answer | ~1¢ | ~0.05¢ |

With every deciding rule added to the prompt, Luna still leads on accuracy (44 vs 42 of 46).

**Answer time**, all 181 Phase 4 answers per model, Luna at its default effort (`medium`, as the
provider reported on every call):

| | GPT-4.1 | GPT-6 Luna |
| --- | --- | --- |
| Median | 2.7 s | 3.8 s |
| 95th percentile | 5.8 s | 9.5 s |
| Over 15 s (today's limit) | 0 | 4 |
| Over 20 s | 0 | 2 |
| Over 30 s | 0 | **0** |
| Slowest | 7.7 s | 22.7 s |

Every Luna answer over 10 s was on one of the two hardest (tier-3) cases,
Necropotence + Silence + Borne Upon a Wind and Academy Manufactor + Esix. Answer time tracks
reasoning tokens (about 12 ms per token). The only correct Necropotence answer any model has
produced is Luna's longest one: 1,872 reasoning tokens, 22.7 s. GPT-4.1 answered Necropotence
26 times across the paid runs and never got it right.

**What happens today** (code read at `main` `a28c048f`):

- `scripts/aws-deploy.sh:29-31` deploys `gpt-4.1`, `OPENAI_TIMEOUT_MS=15000`,
  `OPENAI_MAX_RETRIES=2`. The Lambda timeout is 20 s, set only by `scripts/aws-bootstrap.sh:148`
  (`--timeout 20`); `aws-deploy.sh`'s `update-function-configuration` never sets it. Confirmed
  live on 2026-10-09 (`thejudge-api`: timeout 20 s, arm64, 1769 MB, `gpt-4.1`, 15000 ms,
  2 retries).
- The OpenAI SDK (`openai` 6.37.0, `node_modules/openai/client.js:375`) retries after a timeout,
  and its `timeout` applies per attempt. So a 15 s first try retries, and the Lambda kills the
  retry at 20 s. The backend's own `PROVIDER_TIMEOUT` (504) reply never gets sent.
- The player still sees the app's own message: the frontend catch path
  (`apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts:138-197`) falls back to
  "Miho is working on it" plus the 13 s retry cooldown (REQ-014) for a 502 with any body or none.
  This corrects REPORT.md's "likely a raw error".
- `apps/backend/src/config/index.ts:82-92` rejects `OPENAI_MAX_RETRIES=0`. Only whole numbers 1
  or higher pass.
- The provider (`apps/backend/src/providers/openAiResponsesProvider.ts`) sends `model` and
  `input` only — no reasoning-effort setting. That stays true (decision 3).

## Decisions already made — do not re-litigate

1. **Switch the deployed answer model to `gpt-6-luna`** (owner, 2026-10-09). It is more
   accurate, the blind side-by-side prefers it, and it costs about a twentieth as much.
   Accepted costs: it cites rule numbers less often, and a typical answer is slower.
2. **The answer budget is 30 s** (owner, 2026-10-09 hand-off). It fits every Luna answer
   measured.
3. **No reasoning-effort setting** (owner, 2026-10-09). Luna runs at its default effort, and
   nothing sends an effort value. Lowering effort is unmeasured, and the evidence points against
   it: the correct hard answers are the long-reasoning ones. No effort knob gets built, and
   REQ-188's "no effort is ever sent" stands.
4. **One overall 30 s budget, and any retry must fit inside it** (owner, 2026-10-09). A fast
   failure may retry within the budget. A slow answer that uses up the budget is never started
   over. A player's total wait is about 30 s at most.
5. **The Lambda limit goes above the budget, about 40 s** (owner hand-off). That leaves room for
   prompt assembly and local embedding before the call, and for the error reply after it.
6. **NFR-002's "normal AI latency target under 3 seconds" is amended** to match the switch
   (owner hand-off). Proposed wording is under "PRD truth to amend"; refinement finalizes it.
7. **The corrected layers sentence rides in this run** (owner hand-off). It is the exact text the
   owner approved on 2026-10-08
   (`apps/backend/src/eval/answer-quality/arm-p-correction.json`):
   - replaces: "Continuous effects and state-based actions use a layer system."
   - with: "Continuous effects use a layer system (rule 613); state-based actions are not part
     of it and are checked separately whenever a player would receive priority (rule 704)."
   - It ships as a factual correction, not as a measured accuracy win. On its own it measured as
     a small-sample lead only (Academy Manufactor: 3 of 4 right with it vs 1 of 5 without).
8. **Excerpt cap stays at 10.** REQ-182 says to re-decide the cap if the model changes to a
   smaller one. Luna was measured at cap 10 (its 125 of 126 above), so ten is already validated
   for it.
9. **No retrieval change.** The investigation found reasoning, not missing rules or layout, is
   the lever. PR #266 and any retrieval redesign stay out.

## Design direction (converged)

- **Model:** `scripts/aws-deploy.sh` sets `openai_model="gpt-6-luna"`. The bootstrap default
  (`aws-bootstrap.sh:17`, `gpt-4.1-mini`) and the factory fallback
  (`createAskAiProvider.ts:14`, `gpt-4.1-mini`) are already stale. Refinement decides whether
  to align them or leave them as documented fallbacks; either way, name it.
- **One answer budget:** the OpenAI provider enforces one overall deadline per player request,
  `OPENAI_TIMEOUT_MS=30000`, measured across all attempts, not per attempt. A natural shape is
  passing the SDK an abort signal on the overall deadline alongside its own per-attempt
  `timeout`, keeping a small retry count (for example 1) so a fast transient failure retries
  inside the budget. When the overall deadline fires, the error must still map to
  `PROVIDER_TIMEOUT` (504), not `PROVIDER_UNAVAILABLE`. The SDK raises an abort as
  `APIUserAbortError` ("Request was aborted."), which today's `/timeout|timed out/` match in
  `openAiResponsesProvider.ts` would misclassify. The exact mechanism is map-out's call; the
  behaviour above is fixed.
- **Lambda timeout ships with every deploy:** `aws-deploy.sh`'s existing
  `update-function-configuration` call also sets `--timeout 40`, so the limit goes live on merge
  without waiting on a manual bootstrap re-run. `aws-bootstrap.sh:148` matches it for fresh
  stacks.
- **Retry config:** if the design wants zero SDK retries anywhere, `config/index.ts` must accept
  `OPENAI_MAX_RETRIES=0`. Today it rejects 0. Keep `scripts/openai-verify-credentials.mjs`
  parsing in step with it.
- **Layers sentence:** a one-line text edit in `apps/backend/src/prompt/mtgReference.ts:20`. It
  changes every prompt, so every prompt golden under `apps/backend/src/eval/fixtures/` that
  contains it needs regenerating. Only that sentence may change in them.
- **Eval tooling follows the deployed model:** `scripts/eval-answer-quality.mjs`
  `DEFAULT_LINEUP` becomes `["gpt-6-luna"]` (REQ-188: a routine run grades the deployed model).
  The production-timeout reference the compare report reads must reflect the new budget:
  `DEFAULT_OPENAI_TIMEOUT_MS` in `config/index.ts` is read by regex
  (`eval-answer-quality.mjs:972-975`), so keep that constant's name and form, and update
  `scripts/lib/answer-compare.mjs:25` `ASSUMED_TIMEOUT_MS` to 30000.
- **Routine judge default:** REQ-186 requires the judge to be stronger than every contestant.
  The routine default is still `gpt-5` (`apps/backend/src/eval/answer-quality/judge.ts:76`,
  `scripts/eval-answer-quality.mjs:118`). With Luna deployed, move it to `gpt-6.1-sol`, the
  judge the owner trusted for the investigation. Otherwise a routine run grades the product with
  a judge that may be weaker than the model it grades.

## Current-state PRD truth to amend

Enumerated by line-level grep at `a28c048f` over `PRD/sections`, `README.md`, `apps`, `scripts`
and `docs` for `gpt-4.1`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `15000`, `--timeout 20`,
`maxRetries`, and "under 3 seconds". Refinement re-runs the grep and gives every hit a
disposition row, inside blocked files too.

PRD files:

- `PRD/sections/non-functional-requirements.md:19`, NFR-002: "normal AI latency target under
  3 seconds". Proposed: "a typical AI answer arrives in about 4 seconds; the hardest
  interactions may take up to 30 seconds, covered by the waiting panel (REQ-023); no answer
  request runs past 30 seconds before the player sees the failure path (REQ-014)".
- `PRD/sections/goals-and-non-goals.md:20`: "AI response latency is under 3 seconds in normal
  conditions". It echoes NFR-002, so amend it the same way.
- `PRD/sections/functional-requirements.md`:
  - REQ-182 (line 4347): the cap caveat names "the deployed `gpt-4.1`". Record that Luna was
    measured at cap 10 (decision 8).
  - REQ-188 (lines 4511, 4532, 4543, 4544): the default lineup "is the deployed model alone,
    `gpt-4.1`"; the "production's per-attempt timeout" wording; the code-default note; and
    "The deployed model is `gpt-4.1`".
  - REQ-186 (line 4453): the judge default `gpt-5` moves to `gpt-6.1-sol`.
  - REQ-228 (line 5973 block): "slower than the production per-attempt client timeout … (15,000
    ms today)". This becomes the overall answer budget, 30,000 ms.
  - line 402 (REQ-178 note): "the deployed model `gpt-4.1` scored…" is a dated historical
    measurement. Keep it as history; refinement confirms that disposition.
- `PRD/sections/in-depth/README.md` § "Provider boundary and diagnostics" (line 428),
  `PRD/sections/quick-lookup/README.md` § "Provider boundary" (line 299), and
  `PRD/sections/system-map.md` § "OpenAI provider" (line 113): add one line on the overall answer
  budget and its timeout mapping where the spec describes the live path.
- No new DEC. The decision log is retired.

Non-PRD docs to keep in step: `README.md:116-118`, `apps/backend/.env.example:8-11`,
`apps/backend/src/providers/README.md:18-19`, `apps/backend/src/eval/worked-solutions/README.md:216`,
`scripts/eval-answer-quality.mjs:5,106-107`, `docs/aws/secrets.md:14` (lists the variables; the
values stay unstated).

## Constraints (don't rediscover)

- **Mock stays the local default.** `ASK_AI_PROVIDER=mock` behaviour, mock goldens, and the
  frozen `{ answer }` HTTP contract don't change.
- **No paid call in the build.** The build makes no live OpenAI call. Live checks are owner-run
  with `!`, as in the paid investigation.
- **The production server's own overhead was never measured.** Answer times above were measured
  from the eval machine straight to OpenAI; the Lambda adds prompt build, local embedding and
  cold start. 22.7 s leaves about 7 s of margin. Include a post-deploy check in the receipt:
  one live tier-3 question, timed, plus the `ask_ai.provider_invocation_completed`
  `providerElapsedMs` log line in CloudWatch.
- **Native chain after deploy:** prod has fallen back to lexical retrieval twice on arm64
  bindings. The post-deploy check also confirms semantic retrieval in the same log tail.
- **Follow-up turns** use the same provider and get the same budget, but show no waiting panel
  (inline composer, DEC-041). The inline indicator carries waits of up to 30 s. Refinement
  confirms that is acceptable; it is not a new UI.
- **REQ-014 stays:** the "Miho is working on it" copy, the 13 s cooldown, and state preservation
  are unchanged.
- **Prompt goldens:** only the layers sentence may differ in regenerated goldens; any other diff
  is a defect.
- **Tests stay offline:** cover the budget with fake clients — a slow attempt aborts at the
  deadline and maps to `PROVIDER_TIMEOUT`, a fast failure retries inside the budget, and no retry
  starts after the budget is spent.

## Evidence + reusable tooling

- `PRD/work/probe-luna-time-limit/FINDINGS-time-limit.md` — the latency analysis and code reads
  behind every number above.
- `PRD/work/probe-answer-quality/REPORT.md`, `PAID-RUN.md`, `PHASE-4-BLIND-REVIEW.md` — the
  paid investigation, on `main`.
- Raw run records: `~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/`
  (Phase 4 `calls.jsonl`, with per-call `latencyMs` and `reasoningTokens`).
- Re-measure tooling: `npm run eval:answer-quality` and `eval:answer-quality:compare`, with the
  runbook at `docs/eval/answer-quality-investigation/RUNBOOK.md`.

## What the graph run should produce

A DESIGN-BRIEF for one change covering five things: switch the deployed answer model to
`gpt-6-luna` at default effort; enforce one 30 s answer budget inside which any retry must fit,
mapped to `PROVIDER_TIMEOUT`; set the Lambda timeout to about 40 s on every deploy; correct the
layers sentence; and move the eval defaults (lineup, routine judge, timeout reference) to match.
GATE-QUESTIONS proposes the amendments to NFR-002 and its goals echo, REQ-182, REQ-186,
REQ-188, REQ-228, and the three provider-boundary specs. Expected slices, for map-out to
confirm: (A) the answer budget and its tests, plus the retry-config fix; (B) the deploy and
bootstrap config — model, budget, Lambda timeout; (C) the layers sentence and golden regen;
(D) the eval defaults and docs. Decisions 1–9 are closed; do not reopen the model choice, the
effort setting or the 30 s figure.

## How to hand this off

/graph-kickoff "Switch live answers to GPT-6 Luna at default effort under one 30-second answer budget (Lambda ~40 s, retries inside the budget), amend NFR-002, and correct the layers sentence" PRD/work/probe-luna-time-limit/GRAPH-BRIEF.md
