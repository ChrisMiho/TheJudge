# Gate questions — luna-answer-budget

**Decide:** ten items. Answer each verdict slot below (accept, edit, or
reject; a reason is required for edit or reject), then merge the docs PR to
start the build.

- `REQ-231` (new) — the core of the change. Live answers come from GPT-6 Luna
  at its default effort; each answer gets one 30-second budget with any retry
  inside it; a spent budget shows the normal failure screen; the server's hard
  stop rises to 40 seconds.
- `NFR-002` (amended, with its echo in the goals page) — the speed target
  moves from "under 3 seconds" to "about 4 seconds typical, never more than
  30 seconds on the AI".
- `REQ-181`, `REQ-182`, `REQ-190` (amended) — three rules-search requirements
  stop quoting the old 3-second target; REQ-182 also records that Luna was
  measured at the ten-excerpt cap.
- `REQ-186`, `REQ-188` (amended) — the routine answer-quality run grades Luna
  by default, with `gpt-6.1-sol` as its default judge.
- `REQ-226`, `REQ-228` (amended) — the comparison report measures slow answers
  against the new 30-second budget.
- `REQ-230` (amended note) — the corrected layers sentence becomes the real
  prompt text, and the slot says how that correction gets judged.

Recommendation: accept all ten. The owner already chose Luna, the 30-second
budget, no effort setting, the 40-second server limit and the layers sentence
on 2026-10-09; these slots write those choices into the product spec. Every
slot after `REQ-231` follows from it; rejecting `REQ-231` means rejecting the
others too.

Full evidence, assumptions, the stale-fallback dispositions and the line-level
amendment set (366 rows): `DESIGN-BRIEF.md` in this folder.

## REQ-231 — live answers: Luna, one 30-second budget, a 40-second server limit (new)

**What this decides:** which AI model answers players, and how long a player
can wait on it before seeing the failure screen.

**In plain terms:** live answers move from GPT-4.1 to GPT-6 Luna, run at
Luna's default reasoning effort (no effort setting is sent). Luna got 125 of
126 hard rules questions right in the 2026-10-09 paid test; GPT-4.1 got 120.
Each answer gets one 30-second budget for the whole AI call. A quick hiccup — a
dropped connection or an OpenAI server error — may be retried once, but only
inside those same 30 seconds; a slow answer that runs out the clock is never
started over. When the budget runs out the player sees today's failure screen:
"Miho is working on it", their question and cards kept, and the retry button on
its 13-second cooldown (REQ-014). The server's own hard stop (the AWS Lambda
timeout, today 20 seconds) rises to 40 seconds and is set on every deploy, so
the server has room to build the prompt before the call and send the error
after it. Today a long answer is cut off at 15 s, retried, and killed at 20 s
mid-retry. Follow-up questions get the same model and the same budget; their
inline "thinking" indicator carries the wait. New id, reserved here.

**What happens if you say no:** live answers stay on GPT-4.1 with a 15-second
per-try timeout, two retries and a 20-second server limit. The hardest
questions keep failing with "Miho is working on it", and none of the slots
below apply.

**Proposed diff** — `PRD/sections/functional-requirements.md`, new section
appended after `### REQ-230`:

```diff
   - the preamble sentence P targets is the one the owner's intake brief reports as mixing up continuous effects, state-based actions, and layers; its correction is verified and owner-approved before P runs
+
+### REQ-231
+- Title: Live answers use the deployed model inside one answer budget
+- Priority: high
+- Description: Every live AI answer — a lookup, an In-Depth answer, and every follow-up turn — comes from the deployed answer model, `gpt-6-luna`, at its default reasoning effort, and the AI call for one player request runs inside one overall time budget. A player never waits on the AI longer than the budget before seeing either the answer or the failure path (REQ-014).
+- Acceptance Criteria:
+  - the deployed answer model is `gpt-6-luna`: `scripts/aws-deploy.sh` sets `OPENAI_MODEL=gpt-6-luna` on every deploy, and the provider sends model and prompt only — no reasoning-effort value (REQ-188)
+  - the answer budget is 30,000 ms (`OPENAI_TIMEOUT_MS`; code default and deployed value `30000`), measured across every attempt of one request, never per attempt; it starts when the provider call starts, so prompt assembly and local embedding before it are outside the budget and inside the server limit below
+  - a fast failure (a dropped connection or a provider server error) may be retried while budget remains (`OPENAI_MAX_RETRIES`; code default and deployed value `1`; `0` means never retry); no attempt runs past the budget, and no retry starts once the budget is spent
+  - a slow answer that uses up the budget is never started over
+  - when the budget runs out, however it runs out, the request fails with `PROVIDER_TIMEOUT` (HTTP 504, the error taxonomy in `integrations-and-data.md`) — never `PROVIDER_UNAVAILABLE` — and the player sees the failure path: "Miho is working on it", state preserved, retry on its 13-second cooldown (REQ-014)
+  - the server's hard limit, the AWS Lambda function timeout, is 40 seconds — above the budget, so prompt assembly and embedding before the call and the error reply after it fit; `scripts/aws-deploy.sh` sets it on every deploy, and `scripts/aws-bootstrap.sh` both creates the function with it and re-applies it, with the same model, budget and retry defaults, whenever it re-configures an existing function
+  - offline tests with fake clients prove: a slow attempt is cut off at the budget and maps to `PROVIDER_TIMEOUT`; a fast failure retries inside the budget; no retry starts after the budget is spent; no test makes a network call
+- Constraints:
+  - mock stays the local default (`ASK_AI_PROVIDER` unset → mock); mock behaviour, mock goldens, and the `{ answer }` HTTP contract are unchanged
+  - no UI change: the waiting panel (REQ-023) and the follow-up composer's inline indicator carry waits up to the budget
+  - no live provider call in tests or in the build; live checks are owner-run
+- Dependencies:
+  - REQ-014 (the failure path a spent budget lands on)
+  - REQ-023 (the waiting panel that covers long waits)
+  - REQ-188 (no reasoning-effort value is sent)
+  - NFR-002 (the latency targets this budget serves)
+- Notes:
+  - chosen 2026-10-09 by the owner on the paid answer-quality investigation (production prompt, 126 approved cases, owner-adjudicated): `gpt-6-luna` 125 right against `gpt-4.1`'s 120, all 12 disagreements to Luna, preferred blind 78 to 47, about 0.05¢ per answer against about 1¢; it cites rule numbers less often (1.26 → 0.89 of 2) and a typical answer is slower. Answer time over 181 answers per model, eval machine straight to OpenAI: Luna median 3.8 s, p95 9.5 s, 4 over 15 s, 2 over 20 s, none over 30 s, slowest 22.7 s (the only correct Necropotence answer any model has given). Every Luna answer over 10 s was on one of the two hardest cases, and answer time tracks reasoning tokens, so the correct hard answers are the long ones — which is why no lower effort is set
+  - the excerpt cap stays at 10: Luna was measured at cap 10 (REQ-182's caveat)
+  - the prior state this replaces: `gpt-4.1` with a 15-second timeout per attempt and 2 retries, under a 20-second Lambda limit set only when the function was first created. A long answer was retried at 15 s and the server was stopped at 20 s mid-retry, so the backend's own `PROVIDER_TIMEOUT` reply was never sent; the player still saw "Miho is working on it" through the frontend's fallback for any failed request
+  - the production server's own overhead (prompt build, local embedding, cold start) was never measured; 22.7 s leaves about 7 s of margin. The first deploy's receipt records one timed live tier-3 question, the `ask_ai.provider_invocation_completed` log line's `providerElapsedMs`, and that semantic retrieval, not the lexical fallback, served it
```

**Proposed diff** — `PRD/sections/in-depth/README.md`, `### Provider boundary and diagnostics`:

```diff
   normalized error shape ("Miho is working on it"). (DEC-020, DEC-011, DEC-017,
   DEC-033, REQ-027)
+- Built: the live path asks the deployed answer model, `gpt-6-luna`, at its
+  default reasoning effort, and gives each answer — the first answer and every
+  follow-up turn — one 30-second budget for the whole AI call, retries
+  included. A quick failure may retry inside the budget; a slow answer is never
+  started over. When the budget runs out the request fails as
+  `PROVIDER_TIMEOUT` (HTTP 504), so the player sees "Miho is working on it" and
+  the retry cooldown instead of a longer wait. (REQ-231, REQ-014)
 - Built: `askAiResponseSchema` accepts optional `context`, `diagnostics`, and
```

**Proposed diff** — `PRD/sections/quick-lookup/README.md`, `### Provider boundary`:

```diff
   normalized error shape (the "Miho is working on it" copy). (DEC-020, DEC-017,
   DEC-033)
+- Built: the live path's model and answer budget are the game mode's: the
+  deployed `gpt-6-luna` at its default reasoning effort, one 30-second budget
+  per lookup with any retry inside it, and a spent budget failing as
+  `PROVIDER_TIMEOUT` (HTTP 504). (REQ-231)
 - Built: regression is pinned by golden fixtures under
```

**Proposed diff** — `PRD/sections/system-map.md`, `### OpenAI provider`:

```diff
 - Status: shipped
-- Summary: OpenAI Responses-API provider implementing the shared provider interface.
+- Summary: OpenAI Responses-API provider implementing the shared provider interface. The deployed model is `gpt-6-luna` at its default reasoning effort; each request gets one 30-second answer budget (`OPENAI_TIMEOUT_MS`) with any retry inside it (`OPENAI_MAX_RETRIES`), and a spent budget maps to `PROVIDER_TIMEOUT` (504).
 - Lives in: `apps/backend/src/providers/openAiResponsesProvider.ts`, `askAiProvider.ts`
-- Backed by: DEC-020, DEC-033
+- Backed by: DEC-020, DEC-033, REQ-231
```

- Verdict:
- Reason:

## NFR-002 — the speed target follows the new model (amended, with the goals echo)

**What this decides:** what "fast enough" means for an AI answer, now that the
answering model is slower but more accurate.

**In plain terms:** today the spec promises a normal AI answer in under 3
seconds. That was written for GPT-4.1, whose typical answer took 2.7 s. Luna's
typical answer takes 3.8 s, and the hardest questions take up to 22.7 s. The
target becomes: a typical answer in about 4 seconds, and the hardest ones may
take up to 30 seconds, covered by the waiting panel (REQ-023), with no answer
waiting on the AI past its 30-second budget before the player sees the failure
screen (REQ-231, REQ-014). The "add a card in under 5 seconds" and "Decrypt
Stack flow in under 20 seconds" targets are unchanged; the flow target still
holds for a typical answer, while a hardest-case question can run past it.
The same wording moves into the goals page's success metric and its
product-risk line, which repeat this target. The times are recorded in a dated
note.

**What happens if you say no:** the spec keeps promising under 3 seconds while
the deployed model's typical answer takes about 4, so the target is broken on
day one and the requirements that quote it (REQ-181, REQ-182, REQ-188,
REQ-190) keep quoting a number nobody meets.

**Proposed diff** — `PRD/sections/non-functional-requirements.md`, `### NFR-002`:

```diff
 - Constraints:
   - card add flow under 5 seconds
   - Decrypt Stack flow under 20 seconds
-  - normal AI latency target under 3 seconds
-  - cold-start model readiness — wall-clock time from backend process start to the first System 3 query embedding returning, with the model read from the packaged on-disk cache and no network call — is measured and recorded, and stays a small enough share of the 3-second answer target that a cold request still meets it
+  - a typical AI answer (the median) arrives in about 4 seconds; the hardest interactions may take up to 30 seconds, and the waiting panel (REQ-023) covers that wait
+  - no answer waits on the AI past its 30-second answer budget (REQ-231): when the budget runs out the player gets the failure path (REQ-014) instead of a longer wait
+  - cold-start model readiness — wall-clock time from backend process start to the first System 3 query embedding returning, with the model read from the packaged on-disk cache and no network call — is measured and recorded, and stays a small share of the typical-answer target above
 - Notes:
```

and a new note appended after the existing cold-start note (the last line of
NFR-002):

```diff
   - **Cold start with the bundled embedding model (REQ-181), measured 2026-09-05** on a local Darwin arm64 checkout with a warmed on-disk cache, one run: importing `@huggingface/transformers` 120.3 ms, building the quantised feature-extraction pipeline 57.4 ms, first query embedding 3.6 ms — cold-start model readiness 181.2 ms — plus 3.7 ms to parse the 5.65 MB rule-embeddings artifact (1.442 MB after REQ-183's int8 re-encoding — this figure predates that change) and 3.6 ms for the 2.04 MB rule index. Steady-state query embedding averaged 1.05 ms over 20 runs. So the semantic path adds roughly 185 ms to a cold process and about 1 ms per answer thereafter. AWS Lambda x86 with a cold filesystem is slower than this machine: the deployed figure is read from the function's own cold-start log line, and this local measurement bounds it rather than replacing it.
+  - **Answer time by model, measured 2026-10-09** over the paid answer-quality investigation's 181 answers per model, from the eval machine straight to OpenAI (prompt build, local embedding and cold start on the server are not included): `gpt-4.1` median 2.7 s, p95 5.8 s, slowest 7.7 s; `gpt-6-luna` at its default effort median 3.8 s, p95 9.5 s, 4 answers over 15 s, 2 over 20 s, none over 30 s, slowest 22.7 s. The under-3-seconds target was written for `gpt-4.1`; it was amended to the targets above when the deployed model moved to `gpt-6-luna` for accuracy (REQ-231). The server-side time is checked once after that deploy and recorded in its receipt.
```

**Proposed diff** — `PRD/sections/goals-and-non-goals.md`, `## Success Metrics` and `## Product risks`:

```diff
 - user can complete a full Decrypt Stack flow in under 20 seconds
-- AI response latency is under 3 seconds in normal conditions
+- a typical AI answer arrives in about 4 seconds, and no answer waits on the AI for more than 30 seconds (NFR-002)
 - users can retry without losing stack/question state
```

```diff
-- **Prompt size vs AI latency:** Game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case when all 23 curated topics ship). This is an active risk to the 3-second latency success metric, not a temporary scope tradeoff. Monitor after ship.
+- **Prompt size vs AI latency:** Game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case when all 23 curated topics ship). This is an active risk to the typical-answer latency success metric (about 4 seconds, NFR-002), not a temporary scope tradeoff. Monitor after ship.
```

- Verdict:
- Reason:

## REQ-181 — the meaning-based rule search stops quoting "under 3 seconds" (amended)

**What this decides:** one constraint line in the rule search that matches a
player's question to rules by meaning (System 3's semantic path).

**In plain terms:** the line says this search keeps the "under 3 seconds"
answer target, because embedding a question costs about 2 milliseconds. The
3-second target is being replaced (NFR-002 slot), so the line now points at the
new typical-answer target instead. The search itself does not change.

**What happens if you say no:** the line keeps citing a target that no longer
exists.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-181`, Constraints:

```diff
-  - NFR-002's under-3-second answer target holds; an in-process query embedding adds about 2 milliseconds
+  - NFR-002's typical-answer target (about 4 seconds) holds; an in-process query embedding adds about 2 milliseconds
```

- Verdict:
- Reason:

## REQ-182 — the blended rule search: new speed wording, and Luna measured at the ten-excerpt cap (amended)

**What this decides:** two lines in the requirement for the blended rule search
(meaning-match plus word-match, which picks up to ten extra rule excerpts per
prompt).

**In plain terms:** first, the same "under 3 seconds" line as REQ-181 points at
the new typical-answer target. Second, the requirement carries a warning: the
ten-excerpt cap was measured on GPT-4.1, smaller models did worse with ten, and
"if the deployed model is ever changed to a smaller one, this cap is
re-decided". The model is changing now. Luna was measured at cap 10 — 125 of
126 right — so ten stands for Luna and is not re-decided. The line records
that, and that Luna was not measured at other caps.

**What happens if you say no:** the cap warning keeps naming GPT-4.1 as the
deployed model, and a later reader cannot tell whether the cap was checked for
Luna.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-182`:

```diff
-  - NFR-002's under-3-second answer target holds; blending adds arithmetic over the already-scored candidate list and no additional model call
+  - NFR-002's typical-answer target (about 4 seconds) holds; blending adds arithmetic over the already-scored candidate list and no additional model call
```

```diff
-  - the cap moved from 5 to 10 excerpts on 2026-09-09 (`rule-excerpt-cap-ten`) on REQ-190's run-3 measurement, which is model-dependent: the deployed `gpt-4.1` improved 16 → 18 fully correct of 18, while the smaller `gpt-4.1-mini` regressed 17 → 15 and `gpt-5-nano` 15 → 13 — extra lower-ranked excerpts distract a smaller model more than they inform it. If the deployed answer model is ever changed to a smaller one, this cap is re-decided in the same package, not inherited
+  - the cap moved from 5 to 10 excerpts on 2026-09-09 (`rule-excerpt-cap-ten`) on REQ-190's run-3 measurement, which is model-dependent: the then-deployed `gpt-4.1` improved 16 → 18 fully correct of 18, while the smaller `gpt-4.1-mini` regressed 17 → 15 and `gpt-5-nano` 15 → 13 — extra lower-ranked excerpts distract a smaller model more than they inform it. If the deployed answer model is ever changed to a smaller one, this cap is re-decided in the same package, not inherited
+  - the deployed answer model moved to `gpt-6-luna` in the `luna-answer-budget` change (REQ-231). It was measured at cap 10 — 125 of 126 approved rules cases right, owner-adjudicated, 2026-10-09 — so ten stands for it and is not re-decided; it was not measured at any other cap
```

- Verdict:
- Reason:

## REQ-186 — the routine quality check's default judge becomes gpt-6.1-sol (amended)

**What this decides:** which AI model grades answers in a routine
answer-quality run when nobody names a judge.

**In plain terms:** the answer-quality run (an on-demand, paid check the owner
runs; never part of the build) has a "judge" model that scores each answer
against the approved reference answer. REQ-186 requires the judge to be
stronger than every model it grades. Its default today is `gpt-5`. With Luna
deployed, a routine run would grade Luna with a judge that may be weaker than
Luna. The default moves to `gpt-6.1-sol`, the judge the owner trusted for the
2026-10-09 investigation. The `ANSWER_QUALITY_JUDGE_MODEL` setting still
overrides it.

**What happens if you say no:** a routine run grades Luna with `gpt-5` unless
the owner remembers to set the judge by hand each time.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-186`, Acceptance Criteria:

```diff
-  - the judge model is selected by its own explicit setting, `ANSWER_QUALITY_JUDGE_MODEL` (`resolveJudgeModel`), recorded in the run artifact, and defaults to `gpt-5` when unset — mirroring the explicit-selection seam `ASK_AI_PROVIDER` and `EMBEDDING_PROVIDER` already use, so a judge change is visible in the artifact rather than invisible in a score. It never defaults to an answer model, and `judgeMatchesAnswerModel` flags any run whose judge model id matches an answer model id
+  - the judge model is selected by its own explicit setting, `ANSWER_QUALITY_JUDGE_MODEL` (`resolveJudgeModel`), recorded in the run artifact, and defaults to `gpt-6.1-sol` when unset — mirroring the explicit-selection seam `ASK_AI_PROVIDER` and `EMBEDDING_PROVIDER` already use, so a judge change is visible in the artifact rather than invisible in a score. The default moved from `gpt-5` when the deployed model became `gpt-6-luna` (REQ-231), so a routine run's judge stays stronger than the model it grades; `gpt-6.1-sol` judged the 2026-10-09 investigation. It never defaults to an answer model, and `judgeMatchesAnswerModel` flags any run whose judge model id matches an answer model id
```

- Verdict:
- Reason:

## REQ-188 — the routine quality check grades Luna by default (amended)

**What this decides:** six lines in the answer-quality run requirement that
name the deployed model, the old speed target, and the old timeout.

**In plain terms:** a routine answer-quality run is meant to grade "the setup
players actually get". So its default model moves from GPT-4.1 to Luna. The
line about latency points at the new speed target. The line saying "a
reasoning-effort setting is opened only if a reasoning model wins on
correctness and misses NFR-002" has now fired: Luna won and missed the old 3
seconds. The owner chose to deploy it at default effort and amend the target
instead, so the line records that and keeps "no effort value is ever sent".
The line about evaluation calls keeping the SDK's own timeout now compares
against production's answer budget instead of its "per-attempt timeout". The
code-default note follows the aligned fallback (Luna). The sentence calling
GPT-4.1 "the deployed model" becomes past tense; the measurements beside it
stay.

**What happens if you say no:** a routine run keeps grading GPT-4.1, which
players no longer get, and the requirement contradicts REQ-231.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-188`:

```diff
-  - the answer models are a lineup, given as a repeatable `--model` option; with none given, the lineup is the deployed model alone, `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`), so a routine run grades the setup players actually get. The four-model bake-off (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) is one flag away (`--bake-off`) or by naming those models explicitly. Every selected case is answered once per model per excerpt cap (REQ-190) through the same `preparePromptInput` path, so prompt, retrieval, and cap are identical across models. The judge model (REQ-186) is never in the lineup
+  - the answer models are a lineup, given as a repeatable `--model` option; with none given, the lineup is the deployed model alone, `gpt-6-luna` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`, REQ-231), so a routine run grades the setup players actually get. The four-model bake-off (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) is one flag away (`--bake-off`) or by naming those models explicitly. Every selected case is answered once per model per excerpt cap (REQ-190) through the same `preparePromptInput` path, so prompt, retrieval, and cap are identical across models. The judge model (REQ-186) is never in the lineup
```

```diff
-  - wall-clock latency per call is recorded in the artifact (REQ-189), so the bake-off cannot crown a model the 3-second answer target (NFR-002) cannot use; latency is recorded and reported, never a pass or fail
+  - wall-clock latency per call is recorded in the artifact (REQ-189), so the bake-off cannot crown a model NFR-002's answer targets cannot use (a typical answer in about 4 seconds, every answer inside REQ-231's 30-second budget); latency is recorded and reported, never a pass or fail
```

```diff
-  - no reasoning-effort, verbosity, or other per-model request parameter is added to the provider call: `openAiResponsesProvider.ts` sends model and prompt only, so reasoning models (the gpt-5 family, `gpt-6-luna`) run at their default reasoning effort in this run, and the run records the effort the provider reports. A reasoning-effort setting is a follow-up package, opened only if a reasoning model wins on correctness and its recorded latency misses NFR-002 — never a change made inside this requirement
-  - evaluation answer calls keep the OpenAI SDK's default timeout and retry count: the client is built with the API key alone, so they are not set to production's per-attempt timeout or retries. Whether a model is fast enough for players is read from the recorded per-call latency and the comparison report's count of answers slower than that timeout (REQ-228), never forced by the client
+  - no reasoning-effort, verbosity, or other per-model request parameter is added to the provider call: `openAiResponsesProvider.ts` sends model and prompt only, so reasoning models (the gpt-5 family, `gpt-6-luna`) run at their default reasoning effort in this run, and the run records the effort the provider reports. The 2026-10-09 investigation found a reasoning model, `gpt-6-luna`, more accurate at its default effort with latency over the old 3-second target; the owner deployed it at that effort and amended NFR-002 to its measured latency rather than add an effort setting (REQ-231). An effort setting stays a separate package, opened only on a measured need — never a change made inside this requirement
+  - evaluation answer calls keep the OpenAI SDK's default timeout and retry count: the client is built with the API key alone, so they are not set to production's answer budget or retries. Whether a model is fast enough for players is read from the recorded per-call latency and the comparison report's count of answers slower than that budget (REQ-228), never forced by the client
```

```diff
-  - the code default when `OPENAI_MODEL` is unset is `gpt-4.1-mini` (`apps/backend/src/providers/createAskAiProvider.ts`); the run itself never reads that variable
+  - the code default when `OPENAI_MODEL` is unset is `gpt-6-luna`, the deployed model (`apps/backend/src/providers/createAskAiProvider.ts`; unreachable in practice, because `ASK_AI_PROVIDER=openai` refuses to start without `OPENAI_MODEL`); the run itself never reads that variable
```

```diff
-  - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 estimate — the gpt-5 judge's reasoning output was far smaller than assumed): the first two runs passed no query embedding and attached no card, so both ranked lexically under a `local` label and the three tier-2 prompts carried no ruling; the prompt-fidelity criterion above was added and the run repeated. Run 3 (the committed baseline, `gitCommit b3f860f`, semantic for all 18 cases): fully correct of 18 at cap 5 / cap 10 — `gpt-4.1-mini` 17 / 15, `gpt-4.1` 16 / 18, `gpt-5-mini` 17 / 18, `gpt-5-nano` 15 / 13; mean latency `gpt-4.1` 3.4–3.5 s, `gpt-4.1-mini` 4.3–5.5 s, `gpt-5-mini` 13.5–20.7 s, `gpt-5-nano` 22.9–27.7 s; mean blind rank `gpt-4.1` 1.8, `gpt-5-mini` 1.9, `gpt-4.1-mini` 2.7–2.9, `gpt-5-nano` 3.3–3.6. The deployed model is `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`), and this run is what moved the deployed cap from five to ten on 2026-09-09 (`rule-excerpt-cap-ten`, REQ-190), so its cap-10 row is today's product and its cap-5 row is the superseded baseline. Full record: the `ai-answer-quality-baseline` package's slice E doc, promoted to its receipt at cleanup
+  - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 estimate — the gpt-5 judge's reasoning output was far smaller than assumed): the first two runs passed no query embedding and attached no card, so both ranked lexically under a `local` label and the three tier-2 prompts carried no ruling; the prompt-fidelity criterion above was added and the run repeated. Run 3 (the committed baseline, `gitCommit b3f860f`, semantic for all 18 cases): fully correct of 18 at cap 5 / cap 10 — `gpt-4.1-mini` 17 / 15, `gpt-4.1` 16 / 18, `gpt-5-mini` 17 / 18, `gpt-5-nano` 15 / 13; mean latency `gpt-4.1` 3.4–3.5 s, `gpt-4.1-mini` 4.3–5.5 s, `gpt-5-mini` 13.5–20.7 s, `gpt-5-nano` 22.9–27.7 s; mean blind rank `gpt-4.1` 1.8, `gpt-5-mini` 1.9, `gpt-4.1-mini` 2.7–2.9, `gpt-5-nano` 3.3–3.6. The deployed model was `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`) until the `luna-answer-budget` change moved it to `gpt-6-luna` (REQ-231), and this run is what moved the deployed cap from five to ten on 2026-09-09 (`rule-excerpt-cap-ten`, REQ-190), so its cap-10 row is the `gpt-4.1`-era product baseline and its cap-5 row the superseded one. Full record: the `ai-answer-quality-baseline` package's slice E doc, promoted to its receipt at cleanup
```

- Verdict:
- Reason:

## REQ-190 — the excerpt-cap requirement stops quoting "under three seconds" (amended)

**What this decides:** one line in the requirement that sets the ten-excerpt
cap and says how it relates to the speed target.

**In plain terms:** the line says the cap is not re-checked against the
"under three seconds" target because GPT-4.1's answer time didn't move between
five and ten excerpts. The line now points at NFR-002's new targets, keeps the
GPT-4.1 measurement as the then-deployed model's, and notes that Luna was
measured at ten only.

**What happens if you say no:** the line keeps citing a removed target and
calls GPT-4.1 the deployed model.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-190`:

```diff
-  - NFR-002's under-three-second answer target is not re-gated by the cap: the deployed model's answer latency was measured unchanged across cap 5 and cap 10 (3.4 → 3.5 s, run 3), and end-to-end production request latency has never been sampled at either cap — that sampling is a separate parked package, not a precondition of this cap
+  - NFR-002's answer targets are not re-gated by the cap: the then-deployed `gpt-4.1`'s answer latency was measured unchanged across cap 5 and cap 10 (3.4 → 3.5 s, run 3), `gpt-6-luna` was measured at cap 10 only (REQ-231's note), and end-to-end production request latency has never been sampled at either cap — that sampling is a separate parked package, not a precondition of this cap
```

- Verdict:
- Reason:

## REQ-226 — a run records production's answer timeout, not a "per-attempt" one (amended)

**What this decides:** one word-level fix in what an experiment run writes
into its identity record (the file that says exactly what a run ran against).

**In plain terms:** each experiment run records the production timeout of the
code it ran from, so the comparison report can count how many answers would
have been too slow for players. Today the record calls it "the production
per-attempt timeout". After this change production's timeout is one overall
budget, not per attempt, so the wording says "answer timeout" and names both
meanings by era. The recorded number comes from the same place as before.

**What happens if you say no:** the identity record keeps describing a
per-attempt timeout that production no longer has.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-226`, Acceptance Criteria:

```diff
-  - the identity record holds: run id; the commit executed from; the SHA-256 of each file in `apps/backend/data/` and of each listed case file, and of the rule index; the manifest's SHA-256 and its case list (ids and hashes); answer model ids as requested and as the provider reports them; the request options sent (model and input only, REQ-188); the client timeout and retry count; `ASK_AI_PROVIDER`; `EMBEDDING_PROVIDER` and the embedding model id; whether the combo catalog was loaded; excerpt caps; arms and their revision ids; repeat count; judge model; rubric revision; the rate table with the date each rate was checked; the spending cap and any later change to it (REQ-227); the production per-attempt timeout at the revision the run executed from, which the comparison report holds latency against (REQ-228); for a regrade run, the source run id and manifest hash; and the UTC start time
+  - the identity record holds: run id; the commit executed from; the SHA-256 of each file in `apps/backend/data/` and of each listed case file, and of the rule index; the manifest's SHA-256 and its case list (ids and hashes); answer model ids as requested and as the provider reports them; the request options sent (model and input only, REQ-188); the client timeout and retry count; `ASK_AI_PROVIDER`; `EMBEDDING_PROVIDER` and the embedding model id; whether the combo catalog was loaded; excerpt caps; arms and their revision ids; repeat count; judge model; rubric revision; the rate table with the date each rate was checked; the spending cap and any later change to it (REQ-227); the production answer timeout at the revision the run executed from (`DEFAULT_OPENAI_TIMEOUT_MS`: the overall answer budget from REQ-231 on, a per-attempt timeout before it), which the comparison report holds latency against (REQ-228); for a regrade run, the source run id and manifest hash; and the UTC start time
```

- Verdict:
- Reason:

## REQ-228 — the comparison report measures slow answers against 30 seconds (amended)

**What this decides:** the time limit the side-by-side comparison report uses
when it counts "answers too slow for players".

**In plain terms:** the comparison report (an offline tool that compares two
answer-quality runs case by case) counts answers slower than production's
timeout. Today that is "15,000 ms per attempt". After this change production
allows 30,000 ms for the whole answer, so a run made from the new code is held
against 30 seconds. A run made before this change keeps its own 15-second
figure, and a very old run that never recorded one is assumed to be 15 seconds,
because that is what production used when it ran.

**What happens if you say no:** the report keeps describing a 15-second
per-attempt limit that production no longer uses.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-228`, Acceptance Criteria:

```diff
-  - per side it reports: answer latency mean, p50 and p95; the count of answers slower than the production per-attempt client timeout of the revision that side's run executed from (15,000 ms today); error and timeout counts; input, output and reasoning tokens; answer cost and judge cost apart, with unpriced models shown as unpriced (REQ-227)
+  - per side it reports: answer latency mean, p50 and p95; the count of answers slower than the production answer timeout of the revision that side's run executed from (the 30,000 ms overall answer budget from REQ-231 on; 15,000 ms per attempt before it, which is also assumed for a run whose identity record predates the field); error and timeout counts; input, output and reasoning tokens; answer cost and judge cost apart, with unpriced models shown as unpriced (REQ-227)
```

- Verdict:
- Reason:

## REQ-230 — the corrected layers sentence becomes the real prompt, and how it gets judged (amended note)

**What this decides:** how the spec records that this change adopts a
diagnostic experiment's idea as real prompt text, and what that means for the
experiment.

**In plain terms:** every prompt carries a short built-in rules summary. One
sentence in it says "Continuous effects and state-based actions use a layer
system." That is wrong: layers (rule 613) order continuous effects; state-based
actions (rule 704) are checked separately whenever a player would receive
priority. The owner approved a corrected sentence on 2026-10-08, and the
investigation tested it as "arm P" — a diagnostic variant of the prompt with
that one sentence swapped. This change makes the corrected sentence the real
prompt text. REQ-230 says a product change that adopts an arm's idea is judged
by a normal run (arm A) of the changed code on the held-out case set (cases
kept apart from the ones used to design the arms). That run is paid, and the
build makes no paid call, so the note says it happens after merge, owner-run,
and until then the fix counts as a factual correction, not a measured accuracy
gain (on its own it measured only a small-sample lead: Academy Manufactor 3 of
4 right with it, 1 of 5 without). The note also records that arm P now refuses
to run, because the sentence it swaps no longer appears in the prompt.

**What happens if you say no:** the sentence still changes in the code (that is
the owner's 2026-10-08 decision), but the spec doesn't say how the adopted
correction gets judged or why arm P stops working.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-230`, Notes (appended after the last note):

```diff
   - the preamble sentence P targets is the one the owner's intake brief reports as mixing up continuous effects, state-based actions, and layers; its correction is verified and owner-approved before P runs
+  - the `luna-answer-budget` change (REQ-231's package) adopted P's owner-approved correction (2026-10-08) as production prompt text — "Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704)." — as a factual fix. The judging this requirement's constraint asks for (arm A run from the changed revision on the held-out manifest) is a paid, owner-run experiment after merge, never part of the build; until it runs, the change is recorded as a factual correction, not a measured accuracy change (alone it measured only a small-sample lead: Academy Manufactor 3 of 4 right with it, 1 of 5 without). Because the sentence P replaces no longer appears in the production prompt, P now refuses to run (its sentence must appear exactly once) until a new correction is approved
```

- Verdict:
- Reason:

## Blocker questions

None. Every open point met the assumption ladder in
`PRD/instructions/preparation-contract.md` without a genuine decision blocker;
each assumption and its evidence is in `DESIGN-BRIEF.md` § Assumptions.
