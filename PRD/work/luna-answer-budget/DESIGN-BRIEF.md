# Design brief — luna-answer-budget

**Ask:** Decide. Answer the ten verdict slots in `GATE-QUESTIONS.md`; this brief
is the evidence behind them. Refinement ran under graph control
(graph-20261009-142138, node 3), so every material assumption below is recorded
with its source instead of being asked live.

## What the player gets

- **More right answers on hard rules questions.** The judge's live answers move
  from GPT-4.1 to GPT-6 Luna. In the 2026-10-09 paid investigation Luna got 125
  of 126 hard rules questions right; GPT-4.1 got 120.
- **The hardest questions finish instead of failing.** Today a long answer is
  cut off at 15 seconds, retried, and then the server is shut off at 20
  seconds partway through the retry. The player sees "Miho is working on it".
  After this change each answer gets one 30-second budget. Every Luna answer
  measured fit inside it (the slowest took 22.7 s).
- **No player waits on the AI for more than about 30 seconds.** A quick hiccup
  (a dropped connection, an OpenAI server error) is still retried, but only
  inside that same 30 seconds. A slow answer that runs out the clock is not
  started over. When the budget runs out, the player gets today's failure
  screen: "Miho is working on it", the question and cards kept, and the retry
  button on its 13-second cooldown (REQ-014).
- **A typical answer takes about a second longer** (median 3.8 s instead of
  2.7 s). The waiting panel already has lines at 15 and 25 seconds, so it
  already covers waits this long (REQ-023).
- **The built-in rules summary stops telling the AI a wrong rule.** Today every
  prompt says state-based actions use the layer system. They don't: layers
  (rule 613) order continuous effects; state-based actions (rule 704) are
  checked separately whenever a player would receive priority.
- **Follow-up questions get the same model and the same 30-second budget.**
  They have no waiting panel; the inline "thinking" indicator in the follow-up
  composer carries the wait, as it does today for waits up to 20 s.

## Scope — one change, five parts

1. **Model.** The deployed answer model becomes `gpt-6-luna` at its default
   reasoning effort. Nothing sends a reasoning-effort value (REQ-188's "model and
   prompt only" rule stands).
2. **One answer budget.** One overall 30-second budget per player request
   covers the whole AI call, every attempt included. A fast failure may retry
   while budget remains. No attempt runs past the budget and no retry starts
   after it is spent. An expired budget fails as `PROVIDER_TIMEOUT` (HTTP 504),
   never `PROVIDER_UNAVAILABLE`.
3. **Server limit.** The AWS Lambda function timeout (the server's hard
   stop) becomes 40 seconds and is set on every deploy, not only when the
   stack is first created.
4. **Layers sentence.** The one owner-approved sentence in the built-in rules
   summary is corrected, and every prompt golden that carries it is
   regenerated with only that sentence changed.
5. **Eval defaults follow the deployed model.** The routine answer-quality run
   grades `gpt-6-luna` by default, its default judge moves to `gpt-6.1-sol`,
   and the comparison report holds latency against the new 30-second budget.

## Decisions taken as inputs (owner, recorded in the intake)

The intake records these as the owner's decisions of 2026-10-09. They are inputs
to the proposal, not re-litigated here; the owner still answers every slot.

| # | Decision | Where it lands |
| --- | --- | --- |
| D1 | Deploy `gpt-6-luna` (more accurate, preferred blind 78 to 47, about a twentieth of the cost; accepted costs: cites rule numbers less often, slower typical answer) | REQ-231 (new), REQ-188 |
| D2 | The answer budget is 30 s | REQ-231, NFR-002 |
| D3 | No reasoning-effort setting; Luna runs at its default effort | REQ-231, REQ-188 |
| D4 | One overall budget; any retry fits inside it; a slow answer is never started over | REQ-231 |
| D5 | Lambda limit above the budget, about 40 s | REQ-231 |
| D6 | NFR-002's "under 3 seconds" is amended | NFR-002 and its goals echo, REQ-181, REQ-182, REQ-188, REQ-190 |
| D7 | The corrected layers sentence rides in this run, as a factual correction, not a measured win | code only; REQ-230 note |
| D8 | Excerpt cap stays at 10 (Luna was measured at cap 10) | REQ-182 note |
| D9 | No retrieval change | non-goal |

The corrected sentence (verbatim, `apps/backend/src/eval/answer-quality/arm-p-correction.json`, approved 2026-10-08):

- replaces: "Continuous effects and state-based actions use a layer system."
- with: "Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704)."

## Fixed behaviour of the answer budget

Map-out picks the mechanism (for example an abort signal on the overall
deadline passed alongside the SDK's own per-attempt timeout). These behaviours
are fixed:

- The budget starts when the provider call starts and covers every attempt of
  that one request. Prompt assembly and local embedding happen before it and
  count against the Lambda limit, not the budget.
- `OPENAI_TIMEOUT_MS` keeps its name and now means the overall budget. Code
  default and deployed value: `30000`.
- `OPENAI_MAX_RETRIES` keeps its name. Code default and deployed value: `1`.
  `0` becomes a valid value meaning "never retry".
- No single attempt outlives the overall deadline. No retry starts once the
  budget is spent. A slow answer that used up the budget is never restarted.
- Every way the budget can expire maps to `PROVIDER_TIMEOUT` (504) with the
  "Miho is working on it" message. Today's `/timeout|timed out/` match would
  misread the SDK's abort error ("Request was aborted.", `APIUserAbortError`)
  as `PROVIDER_UNAVAILABLE`; the build must classify it by cause, not message.
- Offline tests with fake clients prove three things: a slow attempt is cut off
  at the deadline and maps to `PROVIDER_TIMEOUT`; a fast failure retries inside
  the budget; no retry starts after the budget is spent. No test makes a
  network call.
- Mock stays the local default. Mock behaviour, mock goldens and the frozen
  `{ answer }` HTTP contract do not change.

## Stale fallbacks — disposition

Two defaults name an old model, and both are stale already.

| Fallback | Today | Disposition | Why |
| --- | --- | --- | --- |
| Bootstrap default, `scripts/aws-bootstrap.sh:17-19` | `gpt-4.1-mini`, `15000`, `2` | **Align** to `gpt-6-luna`, `30000`, `1` | Not just cosmetic: bootstrap's own `update-function-configuration` (line 643-647) writes `OPENAI_MODEL=$openai_model` into the live function. A bootstrap re-run today (the owner runs it to attach policies) silently downgrades production to `gpt-4.1-mini` with a 15 s / 2-retry client until the next deploy. That same call also gains `--timeout 40`, so a re-run never resets the limit either. |
| Provider-factory fallback, `apps/backend/src/providers/createAskAiProvider.ts:14-16` | `?? "gpt-4.1-mini"`, `?? 15000`, `?? 2` | **Align** to `gpt-6-luna`, `30000`, `1` | Unreachable through `readServerConfig`: `ASK_AI_PROVIDER=openai` refuses to start without `OPENAI_MODEL`, and config always fills timeout and retries in openai mode. Aligning keeps the code from contradicting the PRD (REQ-188's code-default note). Map-out may import config's defaults instead of repeating literals, but `DEFAULT_OPENAI_TIMEOUT_MS` must keep its name and `const NAME = 30000` form in `config/index.ts`, because the eval script reads it by regex. |

## Assumptions (assumption ladder, preparation contract)

| # | Assumption | Ladder rung and evidence |
| --- | --- | --- |
| A1 | Deployed and default retry count is 1 | Rung 4, smallest scope that keeps decision D4's "a fast failure may retry". The intake suggests 1. |
| A2 | `OPENAI_MAX_RETRIES=0` becomes valid ("never retry"); `scripts/openai-verify-credentials.mjs` parses it the same way | Rung 4: a one-line relaxation that lets the owner turn retries off without code. The intake names it as part of slice A. Positive values behave as today. |
| A3 | The budget covers the provider call only, not prompt assembly | Rung 3: the provider owns the client; the Lambda limit (40 s) covers assembly, embedding and the error reply (decision D5). A player's worst wait is about 30 s plus assembly (sub-second warm; a cold start measured 2.4 s on 2026-09-08). |
| A4 | Lambda timeout is exactly 40 s, set by `aws-deploy.sh`'s existing `update-function-configuration` call and by both bootstrap calls | Decision D5 ("about 40 s"); rung 3, the deploy script already re-applies configuration on every deploy. The Function URL has no gateway cap of its own (`docs/aws/deployment.md`), so nothing between player and Lambda cuts the request earlier. The frontend sets no request timeout (no `AbortController` on the ask call in `apps/frontend/src`). |
| A5 | `ASSUMED_TIMEOUT_MS` in `scripts/lib/answer-compare.mjs` **stays 15000**, and its comment says it is the pre-budget value | Deviates from the intake (which says 30000). The fallback only applies to a run whose identity record has no `productionTimeoutMs`; that field was added 2026-10-07 (commit `9352c683`), when production was 15 s. Setting it to 30000 would misreport those older runs. New runs record their own value (30000 after this change). |
| A6 | The compare report's label changes from "per-attempt timeout" to "production timeout" | Rung 5: the same label must stay true for runs from both eras. |
| A7 | The follow-up composer's inline indicator is acceptable for waits up to 30 s; no UI change | Rung 5 (preserve user-visible behaviour) plus the intake's non-goal "no new UI". Follow-ups already wait up to 20 s today. |
| A8 | REQ-023's 40-second waiting-panel line stays, though it becomes practically unreachable | Rung 5: no UI change. The budget ends the wait near 30 s, as the 20 s Lambda limit did before. |
| A9 | Arm P (the diagnostic arm that swaps in the corrected sentence) is left as is; after the change it refuses to run because its sentence no longer appears | Rung 4. Its refusal message already says why. The REQ-230 slot records this and how the adopted correction gets judged. |
| A10 | The routine judge default moves in both copies (`judge.ts` and `scripts/eval-answer-quality.mjs`), which are deliberately duplicated and kept in step | Rung 3, the files' own comments. `gpt-6.1-sol` is already in the rate table (checked 2026-10-08). |
| A11 | The four-model bake-off lineup (`--bake-off`) is unchanged | Rung 4: not part of the ask. Luna stays one `--model` flag away. |
| A12 | NFR-002's "Decrypt Stack flow under 20 seconds" stays | Rung 5: it measures the player's input flow; a typical answer (about 4 s) keeps it. The hardest questions can exceed it, and the NFR-002 slot says so in plain terms. |

## Non-goals

- No reasoning-effort setting or knob (decision D3).
- No retrieval change, no excerpt-cap change (decisions D8, D9).
- No UI change: waiting panel, follow-up indicator, REQ-014 copy and 13-second
  cooldown all stay.
- No change to the `{ answer }` contract, the error taxonomy, or mock behaviour.
- No paid or live OpenAI call in the build. Live checks are owner-run.
- No retirement of arm P; no change to the bake-off lineup.
- Reserved concurrency stays 5. Note the risk: answers can now hold a slot for
  up to about 30 s instead of 20 s, so five slow answers at once would make a
  sixth player wait for a slot. Out of scope; named for the receipt.

## Post-deploy check (owner-run, recorded in the receipt)

The answer times above were measured from the eval machine straight to OpenAI.
The production server adds prompt build, local embedding and cold start, never
measured. 22.7 s leaves about 7 s of margin. After the first deploy:

1. Ask one live tier-3 question (Necropotence + Silence + Borne Upon a Wind, or
   Academy Manufactor + Esix) and time it.
2. In the same CloudWatch tail, read the `ask_ai.provider_invocation_completed`
   line's `providerElapsedMs`.
3. In the same tail, confirm semantic retrieval served it, not the lexical
   fallback (production fell back twice before on arm64 bindings).
4. Confirm the function's configuration reads timeout 40 s, `gpt-6-luna`,
   `30000`, `1`.

Optional, paid, owner-run, after merge: an arm-A experiment run on the held-out
manifest, the measurement REQ-230 asks for when a product change adopts an arm's
idea (REQ-230 slot).

## Expected slices (map-out confirms)

- **A — answer budget.** Provider deadline across attempts, abort-to-timeout
  mapping, config defaults (30000, 1, accept 0), factory fallbacks, credentials
  verifier in step, offline budget tests.
- **B — deploy config.** `aws-deploy.sh` model, budget, retries and
  `--timeout 40`; bootstrap defaults and both bootstrap calls;
  `docs/aws/deployment.md`; `.env.example`; root and provider READMEs.
- **C — layers sentence.** `mtgReference.ts:20` and regeneration of the 31
  prompt goldens; any golden diff beyond that sentence is a defect.
- **D — eval defaults and docs.** `DEFAULT_LINEUP`, both judge-default copies,
  compare-report label and comments, tests that assert the defaults,
  worked-solutions README.
- PRD truth from the approved `GATE-QUESTIONS.md` applies with the slice that
  ships the behaviour it describes.

## Product truth touched (slots in `GATE-QUESTIONS.md`)

| Stable ID | Change |
| --- | --- |
| NFR-002 (+ goals echo) | "Under 3 seconds" becomes "about 4 s typical, every answer inside the 30 s budget"; 2026-10-09 times recorded |
| REQ-181 | Drops the under-3-second wording |
| REQ-182 | Drops the under-3-second wording; cap caveat records Luna at cap 10 |
| REQ-186 | Routine judge default `gpt-5` becomes `gpt-6.1-sol` |
| REQ-188 | Default lineup, latency line, effort constraint, timeout wording, code-default note, deployed-model sentence |
| REQ-190 | Under-three-second wording |
| REQ-226 | Identity record holds the production answer timeout, not "per-attempt" |
| REQ-228 | Compare report holds latency against 30,000 ms (15,000 ms before) |
| REQ-230 | Note: arm P's correction became production text; how it is judged; arm P now refuses |
| REQ-231 (new, reserved) | Live answers: deployed model, one answer budget, timeout mapping, Lambda limit; plus the In-Depth, Quick Lookup and system-map provider passages that cite it |

Not changed: `integrations-and-data.md` error taxonomy (504 `PROVIDER_TIMEOUT`
already exists), REQ-014, REQ-023, REQ-022's and REQ-190's dated notes.

## Intake citations (paths recorded, not opened)

- `PRD/work/luna-answer-budget/intake/GRAPH-BRIEF.md` (read; evidence)
- `PRD/work/probe-luna-time-limit/FINDINGS-time-limit.md`
- `PRD/work/probe-answer-quality/REPORT.md`, `PAID-RUN.md`, `PHASE-4-BLIND-REVIEW.md`
- `~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/`
- `docs/eval/answer-quality-investigation/RUNBOOK.md` (also a grep hit below)

All numbers in this brief come from the intake; none were re-derived. The code
reads behind the stale-fallback and assumption rows (bootstrap lines 140-160 and
643-647, `createAskAiProvider.ts`, `config/index.ts`, `answer-compare.mjs`,
`diagnostic-arms.mjs`, frontend request code) were done in this node at the
worktree's `HEAD` (`73e2e312`, branched from `main` `a28c048f`).

## Amendment set (line-level grep)

Command, run from the worktree root at `73e2e312`:

```bash
grep -rnE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git -i 'gpt-4\.1|OPENAI_TIMEOUT_MS|OPENAI_MAX_RETRIES|15000|15,000|--timeout 20|maxRetries|under 3 seconds|under-3-second|under-three-second|(^|[^0-9])3-second|defaults to `gpt-5`|DEFAULT_JUDGE_MODEL|ASSUMED_TIMEOUT_MS|per-attempt|state-based actions use a layer system|1769 MB, 20 s' PRD/sections README.md apps scripts docs
```

Terms added beyond the intake's list, and why: `15,000` (REQ-228's comma form);
`under-3-second`, `under-three-second`, `3-second` (NFR-002's echoes in
REQ-181, REQ-182, REQ-188, REQ-190, NFR-002's cold-start line and the goals
risk line, which the intake's phrase missed); `` defaults to `gpt-5` `` and
`DEFAULT_JUDGE_MODEL` (the routine judge, REQ-186); `ASSUMED_TIMEOUT_MS` and
`per-attempt` (the timeout reference, which also surfaced REQ-226); the layers
sentence (the prompt goldens); `1769 MB, 20 s` (the deployment diagram's Lambda
limit).

**366 hits:** amend 105, keep 161, keep as history 98, out of scope 2.

Found by reading, not by the grep (no grep term matches them), and also amended:
REQ-188's reasoning-effort constraint (`functional-requirements.md:4531`, whose
"opened only if a reasoning model wins … and misses NFR-002" trigger has now
fired), REQ-230's adopted-arm constraint and notes (`:6040`, `:6051`), the
In-Depth and Quick Lookup provider passages (`in-depth/README.md:428`,
`quick-lookup/README.md:299`) and `system-map.md` § OpenAI provider (`:113`).

| # | Hit (file:line) | Disposition | Reason |
| --- | --- | --- | --- |
| 1 | `README.md:116` | amend | recommended model becomes gpt-6-luna |
| 2 | `README.md:117` | amend | OPENAI_TIMEOUT_MS becomes the overall answer budget, default 30000 |
| 3 | `README.md:118` | amend | OPENAI_MAX_RETRIES default 1, 0 allowed, retries only inside the budget |
| 4 | `PRD/sections/functional-requirements.md:402` | keep as history | REQ-022 dated note: gpt-4.1 scored 16/18 at five, 18/18 at ten on 2026-09-09; a true record of that run |
| 5 | `PRD/sections/functional-requirements.md:4298` | amend | REQ-181 slot: drop the under-3-second wording |
| 6 | `PRD/sections/functional-requirements.md:4335` | amend | REQ-182 slot: drop the under-3-second wording |
| 7 | `PRD/sections/functional-requirements.md:4347` | amend | REQ-182 slot: cap caveat records Luna measured at cap 10 |
| 8 | `PRD/sections/functional-requirements.md:4453` | amend | REQ-186 slot: judge default gpt-5 becomes gpt-6.1-sol |
| 9 | `PRD/sections/functional-requirements.md:4511` | amend | REQ-188 slot: default lineup becomes gpt-6-luna |
| 10 | `PRD/sections/functional-requirements.md:4518` | amend | REQ-188 slot: latency line cites the amended NFR-002 |
| 11 | `PRD/sections/functional-requirements.md:4532` | amend | REQ-188 slot: per-attempt timeout wording becomes the answer budget |
| 12 | `PRD/sections/functional-requirements.md:4541` | keep as history | REQ-188 dated cost note (2026-10-06) about gpt-4.1 run 3 |
| 13 | `PRD/sections/functional-requirements.md:4542` | keep as history | REQ-188 dated estimate note (2026-09-07) with that day's list prices |
| 14 | `PRD/sections/functional-requirements.md:4543` | amend | REQ-188 slot: code-default model note follows the aligned factory fallback |
| 15 | `PRD/sections/functional-requirements.md:4544` | amend | REQ-188 slot: only the sentence naming gpt-4.1 as today's deployed model changes; the measurements stay |
| 16 | `PRD/sections/functional-requirements.md:4592` | amend | REQ-190 slot: under-three-second wording; gpt-4.1 latency kept as the then-deployed model's |
| 17 | `PRD/sections/functional-requirements.md:4602` | keep as history | REQ-190 dated run-3 note; its standing caveat lives on REQ-182, which this run amends |
| 18 | `PRD/sections/functional-requirements.md:5934` | amend | REQ-226 slot: identity record holds the production answer timeout, not per-attempt |
| 19 | `PRD/sections/functional-requirements.md:5985` | amend | REQ-228 slot: compare report holds latency against the 30,000 ms budget |
| 20 | `PRD/sections/goals-and-non-goals.md:20` | amend | NFR-002 slot (goals echo): success metric follows the amended target |
| 21 | `PRD/sections/goals-and-non-goals.md:60` | amend | NFR-002 slot (goals echo): product-risk line cites the amended metric |
| 22 | `PRD/sections/non-functional-requirements.md:19` | amend | NFR-002 slot: the three-second target becomes about 4 s typical plus the 30 s budget |
| 23 | `PRD/sections/non-functional-requirements.md:20` | amend | NFR-002 slot: cold-start line no longer cites the 3-second target |
| 24 | `PRD/sections/non-functional-requirements.md:22` | keep as history | past-tense product-risk note ("This was an active risk"); the new NFR-002 note records the 2026-10-09 times |
| 25 | `apps/frontend/public/data/cardMetadata.json:1` | out of scope | false positive: the digit run 15000 inside a Scryfall image URL timestamp in minified card data |
| 26 | `apps/backend/src/app.contract.test.ts:210` | keep | fixture OPENAI_MODEL value in contract tests; no live call, no default involved |
| 27 | `apps/backend/src/app.contract.test.ts:240` | keep | fixture OPENAI_MODEL value in contract tests; no live call, no default involved |
| 28 | `apps/backend/src/config/index.ts:4` | amend | default becomes 30000; keep the constant's name and literal form (the eval regex reads it) |
| 29 | `apps/backend/src/config/index.ts:5` | amend | default retries become 1 |
| 30 | `apps/backend/src/config/index.ts:27` | keep | config field name; unchanged |
| 31 | `apps/backend/src/config/index.ts:100` | keep | parsing unchanged (positive integer); meaning becomes the overall budget |
| 32 | `apps/backend/src/config/index.ts:101` | amend | accept 0 (never retry) as well as positive integers |
| 33 | `apps/backend/src/config/index.ts:122` | keep | default wiring unchanged; the constant carries the new value |
| 34 | `apps/backend/src/config/index.ts:123` | keep | default wiring unchanged; the constant carries the new value |
| 35 | `apps/backend/src/providers/openAiResponsesProvider.ts:9` | keep | config field stays; the mechanism around it is map-out's call |
| 36 | `apps/backend/src/providers/openAiResponsesProvider.ts:34` | amend | client wiring gains the overall deadline across attempts; mechanism is map-out's call |
| 37 | `apps/backend/src/providers/openAiResponsesProvider.test.ts:21` | keep | fake-client fixture; new budget tests (slow attempt, fast-failure retry, no retry after budget) are added beside it |
| 38 | `apps/backend/src/providers/openAiResponsesProvider.test.ts:40` | keep | fake-client fixture; new budget tests (slow attempt, fast-failure retry, no retry after budget) are added beside it |
| 39 | `apps/backend/src/providers/openAiResponsesProvider.test.ts:67` | keep | fake-client fixture; new budget tests (slow attempt, fast-failure retry, no retry after budget) are added beside it |
| 40 | `apps/backend/src/config/index.test.ts:19` | keep | mock mode leaves retries undefined; unchanged |
| 41 | `apps/backend/src/config/index.test.ts:41` | keep | mock mode leaves retries undefined; unchanged |
| 42 | `apps/backend/src/config/index.test.ts:54` | keep | explicit fixture model id |
| 43 | `apps/backend/src/config/index.test.ts:59` | keep | echoes the explicit fixture model id |
| 44 | `apps/backend/src/config/index.test.ts:60` | amend | asserts the default budget: becomes 30000 |
| 45 | `apps/backend/src/config/index.test.ts:61` | amend | asserts the default retries: becomes 1 |
| 46 | `apps/backend/src/config/index.test.ts:68` | keep | explicit fixture model id (trim test) |
| 47 | `apps/backend/src/config/index.test.ts:73` | keep | echoes the explicit fixture model id |
| 48 | `apps/backend/src/config/index.test.ts:74` | amend | asserts the default budget: becomes 30000 |
| 49 | `apps/backend/src/config/index.test.ts:75` | amend | asserts the default retries: becomes 1 |
| 50 | `apps/backend/src/config/index.test.ts:82` | keep | explicit fixture model id |
| 51 | `apps/backend/src/config/index.test.ts:83` | keep | explicit override value; still valid |
| 52 | `apps/backend/src/config/index.test.ts:84` | keep | explicit override value; still valid |
| 53 | `apps/backend/src/config/index.test.ts:88` | keep | echoes the explicit override |
| 54 | `apps/backend/src/config/index.test.ts:134` | keep | explicit fixture model id (missing-key test) |
| 55 | `apps/backend/src/config/index.test.ts:139` | keep | invalid-timeout test still holds |
| 56 | `apps/backend/src/config/index.test.ts:144` | keep | explicit fixture model id |
| 57 | `apps/backend/src/config/index.test.ts:145` | keep | "abc" stays invalid |
| 58 | `apps/backend/src/config/index.test.ts:147` | keep | error message unchanged |
| 59 | `apps/backend/src/config/index.test.ts:150` | amend | 0 becomes valid: the invalid-retries test uses a negative or non-integer value, and a new test accepts 0 |
| 60 | `apps/backend/src/config/index.test.ts:155` | keep | explicit fixture model id |
| 61 | `apps/backend/src/config/index.test.ts:156` | amend | "0" is now valid; the test input changes to a still-invalid value |
| 62 | `apps/backend/src/config/index.test.ts:158` | keep | error message unchanged for a still-invalid value |
| 63 | `apps/backend/src/providers/createAskAiProvider.test.ts:41` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 64 | `apps/backend/src/providers/createAskAiProvider.test.ts:42` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 65 | `apps/backend/src/providers/createAskAiProvider.test.ts:43` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 66 | `apps/backend/src/providers/createAskAiProvider.test.ts:72` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 67 | `apps/backend/src/providers/createAskAiProvider.test.ts:73` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 68 | `apps/backend/src/providers/createAskAiProvider.test.ts:74` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 69 | `apps/backend/src/providers/createAskAiProvider.test.ts:104` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 70 | `apps/backend/src/providers/createAskAiProvider.test.ts:105` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 71 | `apps/backend/src/providers/createAskAiProvider.test.ts:106` | keep | explicit config fixture passed to the factory, not a default; budget tests are added beside it |
| 72 | `apps/backend/src/providers/createAskAiProvider.ts:14` | amend | stale fallback aligned to the deployed model gpt-6-luna (see Stale fallbacks) |
| 73 | `apps/backend/src/providers/createAskAiProvider.ts:15` | amend | stale fallback aligned to config's default 30000 |
| 74 | `apps/backend/src/providers/createAskAiProvider.ts:16` | amend | stale fallback aligned to config's default 1 |
| 75 | `apps/frontend/public/data/cardScanMap.json:1` | out of scope | false positive: the digit run 15000 inside a Scryfall image URL timestamp in minified card data |
| 76 | `apps/backend/src/index.ts:34` | keep | list of env-var names filled from the local file; names unchanged |
| 77 | `apps/backend/src/eval/answer-quality/artifact.test.ts:29` | keep | fixture model ids in artifact tests; no default involved |
| 78 | `apps/backend/src/eval/answer-quality/artifact.test.ts:41` | keep | fixture model ids in artifact tests; no default involved |
| 79 | `apps/backend/src/eval/answer-quality/artifact.test.ts:45` | keep | fixture model ids in artifact tests; no default involved |
| 80 | `apps/backend/src/eval/answer-quality/artifact.test.ts:176` | keep | fixture model ids in artifact tests; no default involved |
| 81 | `apps/backend/src/eval/answer-quality/artifact.test.ts:193` | keep | fixture model ids in artifact tests; no default involved |
| 82 | `apps/backend/src/eval/answer-quality/artifact.test.ts:202` | keep | fixture model ids in artifact tests; no default involved |
| 83 | `apps/backend/src/eval/answer-quality/artifact.test.ts:204` | keep | fixture model ids in artifact tests; no default involved |
| 84 | `apps/backend/src/eval/answer-quality/artifact.test.ts:213` | keep | fixture model ids in artifact tests; no default involved |
| 85 | `apps/backend/src/eval/answer-quality/artifact.test.ts:232` | keep | fixture model ids in artifact tests; no default involved |
| 86 | `apps/backend/src/eval/answer-quality/artifact.test.ts:236` | keep | fixture model ids in artifact tests; no default involved |
| 87 | `apps/backend/src/eval/answer-quality/artifact.test.ts:237` | keep | fixture model ids in artifact tests; no default involved |
| 88 | `apps/backend/src/eval/answer-quality/artifact.test.ts:279` | keep | fixture model ids in artifact tests; no default involved |
| 89 | `apps/backend/src/eval/answer-quality/artifact.test.ts:282` | keep | fixture model ids in artifact tests; no default involved |
| 90 | `apps/backend/src/eval/answer-quality/artifact.test.ts:326` | keep | fixture model ids in artifact tests; no default involved |
| 91 | `apps/backend/src/eval/answer-quality/judge.ts:76` | amend | routine judge default becomes gpt-6.1-sol |
| 92 | `apps/backend/src/eval/answer-quality/judge.ts:82` | amend | doc comment names the new default |
| 93 | `apps/backend/src/eval/answer-quality/judge.ts:86` | keep | reads the constant; unchanged |
| 94 | `apps/backend/src/eval/answer-quality/arm-p-correction.json:2` | keep | owner-approved source of the correction; arm P refuses after the change (REQ-230 slot) |
| 95 | `apps/backend/src/providers/README.md:18` | amend | default 30000, described as the overall answer budget |
| 96 | `apps/backend/src/providers/README.md:19` | amend | default 1, 0 allowed, retries only inside the budget |
| 97 | `apps/backend/src/eval/answer-quality/results.json:25` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 98 | `apps/backend/src/eval/answer-quality/results.json:39` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 99 | `apps/backend/src/eval/answer-quality/results.json:45` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 100 | `apps/backend/src/eval/answer-quality/results.json:51` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 101 | `apps/backend/src/eval/answer-quality/results.json:57` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 102 | `apps/backend/src/eval/answer-quality/results.json:90` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 103 | `apps/backend/src/eval/answer-quality/results.json:109` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 104 | `apps/backend/src/eval/answer-quality/results.json:166` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 105 | `apps/backend/src/eval/answer-quality/results.json:185` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 106 | `apps/backend/src/eval/answer-quality/results.json:242` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 107 | `apps/backend/src/eval/answer-quality/results.json:261` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 108 | `apps/backend/src/eval/answer-quality/results.json:318` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 109 | `apps/backend/src/eval/answer-quality/results.json:337` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 110 | `apps/backend/src/eval/answer-quality/results.json:394` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 111 | `apps/backend/src/eval/answer-quality/results.json:413` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 112 | `apps/backend/src/eval/answer-quality/results.json:470` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 113 | `apps/backend/src/eval/answer-quality/results.json:489` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 114 | `apps/backend/src/eval/answer-quality/results.json:546` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 115 | `apps/backend/src/eval/answer-quality/results.json:565` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 116 | `apps/backend/src/eval/answer-quality/results.json:622` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 117 | `apps/backend/src/eval/answer-quality/results.json:641` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 118 | `apps/backend/src/eval/answer-quality/results.json:698` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 119 | `apps/backend/src/eval/answer-quality/results.json:717` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 120 | `apps/backend/src/eval/answer-quality/results.json:774` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 121 | `apps/backend/src/eval/answer-quality/results.json:793` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 122 | `apps/backend/src/eval/answer-quality/results.json:850` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 123 | `apps/backend/src/eval/answer-quality/results.json:869` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 124 | `apps/backend/src/eval/answer-quality/results.json:926` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 125 | `apps/backend/src/eval/answer-quality/results.json:945` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 126 | `apps/backend/src/eval/answer-quality/results.json:1002` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 127 | `apps/backend/src/eval/answer-quality/results.json:1021` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 128 | `apps/backend/src/eval/answer-quality/results.json:1078` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 129 | `apps/backend/src/eval/answer-quality/results.json:1097` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 130 | `apps/backend/src/eval/answer-quality/results.json:1154` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 131 | `apps/backend/src/eval/answer-quality/results.json:1173` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 132 | `apps/backend/src/eval/answer-quality/results.json:1230` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 133 | `apps/backend/src/eval/answer-quality/results.json:1249` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 134 | `apps/backend/src/eval/answer-quality/results.json:1306` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 135 | `apps/backend/src/eval/answer-quality/results.json:1325` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 136 | `apps/backend/src/eval/answer-quality/results.json:1382` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 137 | `apps/backend/src/eval/answer-quality/results.json:1401` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 138 | `apps/backend/src/eval/answer-quality/results.json:1458` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 139 | `apps/backend/src/eval/answer-quality/results.json:1477` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 140 | `apps/backend/src/eval/answer-quality/results.json:1534` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 141 | `apps/backend/src/eval/answer-quality/results.json:1553` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 142 | `apps/backend/src/eval/answer-quality/results.json:1610` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 143 | `apps/backend/src/eval/answer-quality/results.json:1629` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 144 | `apps/backend/src/eval/answer-quality/results.json:1686` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 145 | `apps/backend/src/eval/answer-quality/results.json:1705` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 146 | `apps/backend/src/eval/answer-quality/results.json:1762` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 147 | `apps/backend/src/eval/answer-quality/results.json:1781` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 148 | `apps/backend/src/eval/answer-quality/results.json:1838` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 149 | `apps/backend/src/eval/answer-quality/results.json:1857` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 150 | `apps/backend/src/eval/answer-quality/results.json:1914` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 151 | `apps/backend/src/eval/answer-quality/results.json:1933` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 152 | `apps/backend/src/eval/answer-quality/results.json:1990` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 153 | `apps/backend/src/eval/answer-quality/results.json:2009` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 154 | `apps/backend/src/eval/answer-quality/results.json:2066` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 155 | `apps/backend/src/eval/answer-quality/results.json:2085` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 156 | `apps/backend/src/eval/answer-quality/results.json:2142` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 157 | `apps/backend/src/eval/answer-quality/results.json:2161` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 158 | `apps/backend/src/eval/answer-quality/results.json:2218` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 159 | `apps/backend/src/eval/answer-quality/results.json:2237` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 160 | `apps/backend/src/eval/answer-quality/results.json:2294` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 161 | `apps/backend/src/eval/answer-quality/results.json:2313` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 162 | `apps/backend/src/eval/answer-quality/results.json:2370` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 163 | `apps/backend/src/eval/answer-quality/results.json:2389` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 164 | `apps/backend/src/eval/answer-quality/results.json:2446` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 165 | `apps/backend/src/eval/answer-quality/results.json:2465` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 166 | `apps/backend/src/eval/answer-quality/results.json:2522` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 167 | `apps/backend/src/eval/answer-quality/results.json:2541` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 168 | `apps/backend/src/eval/answer-quality/results.json:2598` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 169 | `apps/backend/src/eval/answer-quality/results.json:2617` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 170 | `apps/backend/src/eval/answer-quality/results.json:2674` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 171 | `apps/backend/src/eval/answer-quality/results.json:2693` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 172 | `apps/backend/src/eval/answer-quality/results.json:2750` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 173 | `apps/backend/src/eval/answer-quality/results.json:2769` | keep as history | committed 2026-09-07 run-3 bake-off scores file; a measurement record, rewritten only by a live run |
| 174 | `apps/backend/src/eval/fixtures/commander-spellbook-lookup-multi-card-partial.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 175 | `apps/backend/src/eval/answer-quality/artifact.ts:51` | keep | artifact field name; unchanged |
| 176 | `apps/backend/src/prompt/mtgReference.ts:20` | amend | the layers sentence correction (owner-approved text) |
| 177 | `apps/backend/src/eval/fixtures/counterspell-stack.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 178 | `apps/backend/src/eval/fixtures/full-context.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 179 | `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-intent.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 180 | `apps/backend/src/eval/fixtures/near-cap-stack.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 181 | `apps/backend/src/eval/fixtures/simple-interaction.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 182 | `apps/backend/src/eval/fixtures/quick-lookup-card.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 183 | `apps/backend/src/eval/fixtures/player-counters.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 184 | `apps/backend/src/eval/fixtures/commander-spellbook-complete-no-intent.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 185 | `apps/backend/src/eval/fixtures/commander-spellbook-partial-explicit-intent.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 186 | `apps/backend/src/eval/fixtures/quick-lookup-no-card.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 187 | `apps/backend/src/eval/fixtures/commander-spellbook-wrong-zone.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 188 | `apps/backend/src/eval/fixtures/commander-spellbook-unresolved-template.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 189 | `apps/backend/src/eval/fixtures/combat-deathtouch.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 190 | `apps/backend/src/eval/fixtures/commander-spellbook-lookup-multi-card-complete.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 191 | `apps/backend/src/eval/fixtures/commander-spellbook-degraded.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 192 | `scripts/eval-answer-compare.mjs:7` | keep | usage example with an explicit --model; still valid |
| 193 | `scripts/openai-verify-credentials.mjs:6` | amend | default in step with config: 30000 |
| 194 | `scripts/openai-verify-credentials.mjs:7` | amend | default in step with config: 1 |
| 195 | `scripts/openai-verify-credentials.mjs:97` | keep | variable declaration |
| 196 | `scripts/openai-verify-credentials.mjs:99` | keep | parsing unchanged |
| 197 | `scripts/openai-verify-credentials.mjs:100` | amend | accept 0, in step with config |
| 198 | `scripts/openai-verify-credentials.mjs:110` | keep | passes the parsed value |
| 199 | `scripts/eval-answer-quality.mjs:5` | amend | header names the deployed model gpt-6-luna |
| 200 | `scripts/eval-answer-quality.mjs:106` | amend | comment names OPENAI_MODEL=gpt-6-luna |
| 201 | `scripts/eval-answer-quality.mjs:107` | amend | DEFAULT_LINEUP becomes ["gpt-6-luna"] |
| 202 | `scripts/eval-answer-quality.mjs:109` | keep | the named four-model bake-off lineup is unchanged |
| 203 | `scripts/eval-answer-quality.mjs:118` | amend | the script's copy of the judge default becomes gpt-6.1-sol, in step with judge.ts |
| 204 | `scripts/eval-answer-quality.mjs:122` | keep | rate row for a still-runnable model |
| 205 | `scripts/eval-answer-quality.mjs:123` | keep | rate row for a still-runnable model |
| 206 | `scripts/eval-answer-quality.mjs:141` | keep | rate check date for a still-runnable model |
| 207 | `scripts/eval-answer-quality.mjs:142` | keep | rate check date for a still-runnable model |
| 208 | `scripts/eval-answer-quality.mjs:339` | keep | reads the constant; unchanged |
| 209 | `scripts/eval-answer-quality.mjs:674` | keep | eval client keeps SDK defaults (REQ-188) |
| 210 | `scripts/eval-answer-quality.mjs:972` | keep | reads the constant by name; name kept |
| 211 | `scripts/eval-answer-quality.mjs:975` | keep | regex depends on the constant's name and literal form, which config keeps |
| 212 | `scripts/eval-answer-quality.mjs:1029` | keep | eval client keeps SDK defaults (REQ-188) |
| 213 | `scripts/eval-answer-quality.mjs:1030` | amend | comment: per-attempt timeout becomes the production answer timeout |
| 214 | `scripts/aws-bootstrap.sh:17` | amend | stale fallback gpt-4.1-mini aligned to gpt-6-luna (a re-run otherwise downgrades the live model) |
| 215 | `scripts/aws-bootstrap.sh:18` | amend | fallback aligned to 30000 |
| 216 | `scripts/aws-bootstrap.sh:19` | amend | fallback aligned to 1 |
| 217 | `scripts/aws-bootstrap.sh:148` | amend | create-function --timeout 20 becomes 40 |
| 218 | `scripts/aws-bootstrap.sh:150` | keep | env block references the variables above; unchanged |
| 219 | `scripts/aws-bootstrap.sh:645` | amend | this update-function-configuration also sets --timeout 40, so a re-run on an existing stack matches |
| 220 | `scripts/aws-deploy.sh:29` | amend | deployed model becomes gpt-6-luna |
| 221 | `scripts/aws-deploy.sh:30` | amend | deployed budget becomes 30000 |
| 222 | `scripts/aws-deploy.sh:31` | amend | deployed retries become 1 |
| 223 | `scripts/aws-deploy.sh:96` | amend | this update-function-configuration also sets --timeout 40 on every deploy |
| 224 | `scripts/lib/experiment-run.mjs:254` | keep | eval client keeps SDK defaults (REQ-188) |
| 225 | `scripts/lib/experiment-run.mjs:255` | amend | comment: per-attempt timeout becomes the production answer timeout |
| 226 | `scripts/lib/rules-review.test.mjs:229` | keep | fixture model id in case-selection tests |
| 227 | `scripts/lib/rules-review.test.mjs:251` | keep | fixture model id in case-selection tests |
| 228 | `scripts/lib/answer-compare.mjs:13` | amend | header comment: per-attempt timeout becomes the production answer timeout |
| 229 | `scripts/lib/answer-compare.mjs:24` | amend | doc comment: the fallback is the pre-budget production timeout, used only for runs that predate the identity field |
| 230 | `scripts/lib/answer-compare.mjs:25` | keep | value stays 15000: a run without productionTimeoutMs predates the field (2026-10-07) and ran under 15 s production; 30000 would misreport it (deviates from the intake, see Assumptions) |
| 231 | `scripts/lib/answer-compare.mjs:181` | keep | reads the recorded value first; unchanged |
| 232 | `scripts/lib/answer-compare.mjs:330` | amend | report label: per-attempt timeout becomes production timeout (true for both eras) |
| 233 | `apps/backend/.env.example:8` | amend | template model becomes gpt-6-luna |
| 234 | `apps/backend/.env.example:10` | amend | template budget becomes 30000 |
| 235 | `apps/backend/.env.example:11` | amend | template retries become 1 |
| 236 | `apps/backend/src/eval/fixtures/ambiguous-wording.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 237 | `apps/backend/src/eval/fixtures/quick-lookup-off-domain.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 238 | `apps/backend/src/eval/fixtures/multi-step-stack.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 239 | `apps/backend/src/eval/fixtures/quick-lookup-phrasing-answered.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 240 | `apps/backend/src/eval/fixtures/follow-up-chat.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 241 | `apps/backend/src/eval/fixtures/commander-spellbook-lookup-unrelated.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 242 | `apps/backend/src/eval/fixtures/multi-zone.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 243 | `apps/backend/src/eval/fixtures/mana-spent-explicit-fallback.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 244 | `scripts/eval-answer-quality.test.mjs:14` | keep | imports the constant |
| 245 | `scripts/eval-answer-quality.test.mjs:94` | amend | asserts DEFAULT_LINEUP: becomes ["gpt-6-luna"] |
| 246 | `scripts/eval-answer-quality.test.mjs:96` | amend | asserts the parsed default lineup: becomes ["gpt-6-luna"] |
| 247 | `scripts/eval-answer-quality.test.mjs:108` | keep | fixture model id in eval tests; no default involved |
| 248 | `scripts/eval-answer-quality.test.mjs:109` | keep | fixture model id in eval tests; no default involved |
| 249 | `scripts/eval-answer-quality.test.mjs:115` | keep | compares to the constant |
| 250 | `scripts/eval-answer-quality.test.mjs:178` | keep | builds the access list from the constants |
| 251 | `scripts/eval-answer-quality.test.mjs:213` | keep | fixture model id in eval tests; no default involved |
| 252 | `scripts/eval-answer-quality.test.mjs:214` | keep | fixture model id in eval tests; no default involved |
| 253 | `scripts/eval-answer-quality.test.mjs:220` | keep | fixture model id in eval tests; no default involved |
| 254 | `scripts/eval-answer-quality.test.mjs:236` | keep | builds the access list from the constants |
| 255 | `scripts/eval-answer-quality.test.mjs:241` | keep | compares to the constant |
| 256 | `scripts/eval-answer-quality.test.mjs:268` | keep | fixture model id in eval tests; no default involved |
| 257 | `scripts/eval-answer-quality.test.mjs:289` | keep | fixture model id in eval tests; no default involved |
| 258 | `scripts/eval-answer-quality.test.mjs:299` | keep | fixture model id in eval tests; no default involved |
| 259 | `scripts/eval-answer-quality.test.mjs:309` | keep | fixture model id in eval tests; no default involved |
| 260 | `scripts/eval-answer-quality.test.mjs:319` | keep | fixture model id in eval tests; no default involved |
| 261 | `scripts/eval-answer-quality.test.mjs:329` | keep | fixture model id in eval tests; no default involved |
| 262 | `scripts/eval-answer-quality.test.mjs:332` | keep | fixture model id in eval tests; no default involved |
| 263 | `scripts/eval-answer-quality.test.mjs:397` | keep | builds the access list from the constants |
| 264 | `scripts/eval-answer-quality.test.mjs:476` | keep | fixture model id in eval tests; no default involved |
| 265 | `scripts/eval-answer-quality.test.mjs:558` | keep | fixture model id in eval tests; no default involved |
| 266 | `scripts/eval-answer-quality.test.mjs:575` | keep | fixture model id in eval tests; no default involved |
| 267 | `scripts/eval-answer-quality.test.mjs:691` | keep | fixture model id in eval tests; no default involved |
| 268 | `scripts/eval-answer-quality.test.mjs:699` | keep | fixture model id in eval tests; no default involved |
| 269 | `scripts/eval-answer-quality.test.mjs:700` | keep | fixture model id in eval tests; no default involved |
| 270 | `scripts/eval-answer-quality.test.mjs:709` | keep | fixture model id in eval tests; no default involved |
| 271 | `scripts/eval-answer-quality.test.mjs:713` | keep | fixture model id in eval tests; no default involved |
| 272 | `scripts/eval-answer-quality.test.mjs:726` | keep | fixture model id in eval tests; no default involved |
| 273 | `scripts/eval-answer-quality.test.mjs:734` | keep | fixture model id in eval tests; no default involved |
| 274 | `scripts/eval-answer-quality.test.mjs:750` | keep | fixture model id in eval tests; no default involved |
| 275 | `scripts/eval-answer-quality.test.mjs:770` | keep | fixture model id in eval tests; no default involved |
| 276 | `scripts/eval-answer-quality.test.mjs:795` | keep | fixture model id in eval tests; no default involved |
| 277 | `scripts/eval-answer-quality.test.mjs:798` | keep | fixture model id in eval tests; no default involved |
| 278 | `scripts/eval-answer-quality.test.mjs:919` | keep | fixture model id in eval tests; no default involved |
| 279 | `scripts/eval-answer-quality.test.mjs:975` | keep | fixture model id in eval tests; no default involved |
| 280 | `scripts/eval-answer-quality.test.mjs:993` | keep | fixture model id in eval tests; no default involved |
| 281 | `scripts/eval-answer-quality.test.mjs:1026` | keep | fixture model id in eval tests; no default involved |
| 282 | `scripts/eval-answer-quality.test.mjs:1047` | keep | fixture model id in eval tests; no default involved |
| 283 | `scripts/eval-answer-quality.test.mjs:1092` | amend | access list mirrors today's default lineup and judge; follows the new defaults (prefer the constants) if the test relies on them |
| 284 | `scripts/eval-answer-quality.test.mjs:1122` | amend | access list mirrors today's default lineup and judge; follows the new defaults (prefer the constants) if the test relies on them |
| 285 | `scripts/eval-answer-quality.test.mjs:1152` | amend | access list mirrors today's default lineup and judge; follows the new defaults (prefer the constants) if the test relies on them |
| 286 | `scripts/eval-answer-quality.test.mjs:1203` | keep | fixture model id in eval tests; no default involved |
| 287 | `scripts/eval-answer-quality.test.mjs:1248` | amend | access list mirrors today's default lineup and judge; follows the new defaults (prefer the constants) if the test relies on them |
| 288 | `scripts/eval-answer-quality.test.mjs:1312` | keep | fixture model id in eval tests; no default involved |
| 289 | `scripts/eval-answer-quality.test.mjs:1393` | keep | eval client keeps SDK defaults (REQ-188) |
| 290 | `scripts/eval-answer-quality.test.mjs:1425` | keep | fixture model id in eval tests; no default involved |
| 291 | `scripts/eval-answer-quality.test.mjs:1521` | amend | access list mirrors today's default lineup and judge; follows the new defaults (prefer the constants) if the test relies on them |
| 292 | `scripts/eval-answer-quality.test.mjs:1547` | amend | test title: per-attempt timeout becomes the production answer timeout |
| 293 | `scripts/eval-answer-quality.test.mjs:1548` | amend | reads the config constant: becomes 30000 |
| 294 | `scripts/eval-answer-quality.test.mjs:1566` | keep | fixture model id in eval tests; no default involved |
| 295 | `scripts/lib/diagnostic-arms.test.mjs:51` | keep | synthetic prompt text for arm P unit tests; does not read mtgReference.ts |
| 296 | `scripts/lib/diagnostic-arms.test.mjs:215` | keep | synthetic prompt text for arm P unit tests; does not read mtgReference.ts |
| 297 | `scripts/lib/diagnostic-arms.test.mjs:231` | keep | synthetic prompt text for arm P unit tests; does not read mtgReference.ts |
| 298 | `apps/backend/src/eval/worked-solutions/README.md:216` | amend | deployed model named as gpt-6-luna |
| 299 | `docs/aws/deployment.md:36` | amend | architecture diagram Lambda limit 20 s becomes 40 s |
| 300 | `docs/aws/secrets.md:14` | keep | lists the variable names only; names unchanged, values stay unstated |
| 301 | `apps/backend/src/eval/answer-quality/judge.test.ts:3` | keep | imports the constant |
| 302 | `apps/backend/src/eval/answer-quality/judge.test.ts:31` | keep | compares to the constant |
| 303 | `apps/backend/src/eval/answer-quality/judge.test.ts:32` | amend | asserts the default judge id: becomes gpt-6.1-sol |
| 304 | `apps/backend/src/eval/answer-quality/judge.test.ts:40` | keep | proves OPENAI_MODEL never sets the judge; fixture id |
| 305 | `apps/backend/src/eval/answer-quality/judge.test.ts:44` | keep | fixture model ids in judge tests; no default involved |
| 306 | `apps/backend/src/eval/answer-quality/judge.test.ts:45` | keep | fixture model ids in judge tests; no default involved |
| 307 | `apps/backend/src/eval/answer-quality/judge.test.ts:126` | keep | fixture model ids in judge tests; no default involved |
| 308 | `apps/backend/src/eval/answer-quality/judge.test.ts:127` | keep | fixture model ids in judge tests; no default involved |
| 309 | `apps/backend/src/eval/answer-quality/judge.test.ts:141` | keep | fixture model ids in judge tests; no default involved |
| 310 | `apps/backend/src/eval/answer-quality/judge.test.ts:170` | keep | fixture model ids in judge tests; no default involved |
| 311 | `apps/backend/src/eval/answer-quality/judge.test.ts:177` | keep | fixture model ids in judge tests; no default involved |
| 312 | `apps/backend/src/eval/answer-quality/judge.test.ts:179` | keep | fixture model ids in judge tests; no default involved |
| 313 | `apps/backend/src/eval/answer-quality/judge.test.ts:224` | keep | fixture model ids in judge tests; no default involved |
| 314 | `apps/backend/src/eval/answer-quality/judge.test.ts:225` | keep | fixture model ids in judge tests; no default involved |
| 315 | `apps/backend/src/eval/answer-quality/judge.test.ts:398` | keep | fixture model ids in judge tests; no default involved |
| 316 | `apps/backend/src/eval/fixtures/battlefield-skip.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 317 | `apps/backend/src/eval/fixtures/state-based-actions.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 318 | `apps/backend/src/eval/fixtures/cascade-keyword.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 319 | `apps/backend/src/eval/fixtures/quick-lookup-multi-keyword-card.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 320 | `apps/backend/src/eval/fixtures/upkeep-trigger.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 321 | `apps/backend/src/eval/fixtures/zero-cards.prompt.golden.txt:30` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 322 | `apps/backend/src/eval/fixtures/quick-lookup-multi-card.prompt.golden.txt:32` | amend | prompt golden carries the layers sentence; regenerated in the layers slice, only that sentence may differ |
| 323 | `scripts/lib/experiment-run.test.mjs:111` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 324 | `scripts/lib/experiment-run.test.mjs:112` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 325 | `scripts/lib/experiment-run.test.mjs:113` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 326 | `scripts/lib/experiment-run.test.mjs:133` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 327 | `scripts/lib/experiment-run.test.mjs:230` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 328 | `scripts/lib/experiment-run.test.mjs:255` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 329 | `scripts/lib/experiment-run.test.mjs:257` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 330 | `scripts/lib/experiment-run.test.mjs:267` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 331 | `scripts/lib/experiment-run.test.mjs:269` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 332 | `scripts/lib/experiment-run.test.mjs:336` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 333 | `scripts/lib/experiment-run.test.mjs:521` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 334 | `scripts/lib/experiment-run.test.mjs:596` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 335 | `scripts/lib/experiment-run.test.mjs:621` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 336 | `scripts/lib/experiment-run.test.mjs:656` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 337 | `scripts/lib/experiment-run.test.mjs:659` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 338 | `scripts/lib/experiment-run.test.mjs:660` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 339 | `scripts/lib/experiment-run.test.mjs:742` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 340 | `scripts/lib/experiment-run.test.mjs:773` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 341 | `scripts/lib/experiment-run.test.mjs:785` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 342 | `scripts/lib/experiment-run.test.mjs:806` | keep | explicit fixture model ids and an explicit productionTimeoutMs fixture; no default involved |
| 343 | `scripts/lib/answer-quality-run.mjs:192` | keep | doc example of a headline string; any model id |
| 344 | `scripts/lib/answer-compare.test.mjs:86` | keep | explicit fixture value; no default involved |
| 345 | `scripts/lib/answer-compare.test.mjs:109` | keep | explicit fixture value; no default involved |
| 346 | `scripts/lib/answer-compare.test.mjs:279` | keep | explicit fixture value; no default involved |
| 347 | `scripts/lib/answer-compare.test.mjs:280` | keep | explicit fixture value; no default involved |
| 348 | `scripts/lib/answer-compare.test.mjs:285` | keep | explicit fixture value; no default involved |
| 349 | `scripts/lib/answer-compare.test.mjs:288` | keep | explicit fixture value; no default involved |
| 350 | `scripts/lib/answer-compare.test.mjs:296` | amend | asserts the report label; follows line 330's new wording |
| 351 | `docs/eval/answer-quality-investigation/RUNBOOK.md:16` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 352 | `docs/eval/answer-quality-investigation/RUNBOOK.md:29` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 353 | `docs/eval/answer-quality-investigation/RUNBOOK.md:30` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 354 | `docs/eval/answer-quality-investigation/RUNBOOK.md:37` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 355 | `docs/eval/answer-quality-investigation/RUNBOOK.md:50` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 356 | `docs/eval/answer-quality-investigation/RUNBOOK.md:55` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 357 | `docs/eval/answer-quality-investigation/RUNBOOK.md:143` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 358 | `docs/eval/answer-quality-investigation/RUNBOOK.md:157` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 359 | `docs/eval/answer-quality-investigation/RUNBOOK.md:173` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 360 | `docs/eval/answer-quality-investigation/RUNBOOK.md:187` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 361 | `docs/eval/answer-quality-investigation/RUNBOOK.md:194` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 362 | `docs/eval/answer-quality-investigation/RUNBOOK.md:195` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 363 | `docs/eval/answer-quality-investigation/RUNBOOK.md:196` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 364 | `docs/eval/answer-quality-investigation/RUNBOOK.md:197` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 365 | `docs/eval/answer-quality-investigation/RUNBOOK.md:201` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
| 366 | `docs/eval/answer-quality-investigation/RUNBOOK.md:218` | keep as history | runbook of the finished 2026-10-08/09 paid investigation; records what was run then |
