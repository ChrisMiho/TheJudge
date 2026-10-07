# Runbook: the paid half of the answer-quality investigation

Written 2026-10-07 by the build of the `answer-quality-investigation` package.
**No paid phase was run in the build. Phases 1 to 5 below have never been run.** The
free half (Phase 0) is in `OFFLINE-FINDINGS.md`.

What this answers, in game terms: when the judge gives a player a shaky answer on a hard
interaction, was the rule never in front of the model (missing evidence), was it in front
of it but badly laid out (presentation), or does the model reason badly even with the right
rules (the model)? And did PR #273's data refresh make answers worse anywhere?

## What you decide before spending anything

| Input | Your choice | Note |
| --- | --- | --- |
| Judge model (**D0**) | ______ | Must be stronger than both GPT-4.1 and GPT-6 Luna, and never one of them (REQ-186). It stays fixed for every phase. Set it with `ANSWER_QUALITY_JUDGE_MODEL=<model>`; the default is `gpt-5`, which is kept only if you judge it stronger than Luna |
| Cap, Phase 1 | $____ | `--max-cost-usd`; the run stops cleanly before passing it |
| Cap, Phase 2 | $____ | |
| Cap, Phase 3 | $____ | |
| Cap, Phase 4 | $____ | |
| Rates | re-check | The dry run prints every rate with the date it was checked (below). Re-check the provider's pricing page; a rate that has moved is edited in `scripts/eval-answer-quality.mjs` (`MODEL_PRICING_USD_PER_MILLION_TOKENS`, `MODEL_RATE_CHECKED_ON`) before any spend |
| The ten re-snapshotted cases | confirm | See step 0.4 |
| Arm P wording | optional | Arm P (one corrected preamble sentence) is built but refused until you approve its wording in `apps/backend/src/eval/answer-quality/arm-p-correction.json` (`replaces`, `correction`, `approvedOn`) |

### Rates in the rate table (printed by every dry run)

```
Rates (USD per million tokens, input / output; re-check before spending):
  gpt-4.1-mini: $0.4 / $1.6 -- check date: not re-checked since the table was written
  gpt-4.1: $2 / $8 -- check date: 2026-10-07
  gpt-5-mini: $0.25 / $2 -- check date: not re-checked since the table was written
  gpt-5-nano: $0.05 / $0.4 -- check date: not re-checked since the table was written
  gpt-5: $1.25 / $10 -- check date: not re-checked since the table was written
  gpt-6-luna: $0.1 / $0.5 -- check date: 2026-10-07
```

`gpt-4.1` and `gpt-6-luna` carry the 2026-10-07 check from the intake brief (official
pricing page). `gpt-5`, the default judge, was **not** re-checked: check it first. A model
with no rate prints as `unpriced` and a live run refuses to start with it.

## What the dry runs say (no key, no network, 2026-10-07)

One answer plus its lone grade is two calls; a two-model run adds one ranking call per case
and arm. Estimates use the dry run's character-count method with the default judge `gpt-5`.
**They exclude reasoning tokens beyond a small assumed output**, so a reasoning judge or
Luna can cost several times the figure: treat them as scale, and the cap as the real limit.

| Phase | Run (commands below) | Calls | Estimate |
| --- | --- | --- | --- |
| 1 grader check | 46 diagnostic cases, GPT-4.1, arm A | 92 | $1.03 |
| 2 refresh, per side | 382 cases (the 392 minus the ten unconfirmed) | 764 | $8.38 |
| 2 refresh, both sides | base then head | 1,528 | $16.76 |
| 3 arms | 46 cases x arms A, B, C, D | 368 | $4.11 |
| 3 repeats | 3 named and disputed cases x 4 arms x 3 answers | 72 | $0.81 |
| 4 models, arm A | 126 cases (diagnostic + held-out) x GPT-4.1 and Luna | 630 | $5.90 |
| 4 models, evidence arm | 46 diagnostic cases x arm C x both models | 230 | $2.17 |
| 4 repeats | 3 named cases x both models x 3 answers | 45 | $0.43 |
| **All phases** | | **2,965** | **$31.21** |

(Phase 2's arm is A throughout; the arms in Phase 3 run on the diagnostic set only. The
total adds Phase 2 once for both sides.)

## Step 0: set up the two revisions and the owner checks

The tooling measures **the checkout it runs from**; it never imports code across
checkouts. PR #273's base (`3e973ced`) and head (`07cc3ab6`) both predate it, so each is
measured from its own worktree with the tooling committed on top. Run these from the
launch checkout; the worktrees stay local.

```bash
BRANCH=thejudge-auto/answer-quality-investigation-work   # the code PR's branch (merge it first and use main if you prefer)
TOOLING=$(git diff --name-only 3e973ced $BRANCH -- . ':!PRD' ':!docs')   # about 35 files, none of them data

for REV in base:3e973ced head:07cc3ab6; do
  NAME=${REV%%:*}; SHA=${REV##*:}
  git worktree add --detach .worktrees/aq-$NAME $SHA
  (cd .worktrees/aq-$NAME && git checkout $BRANCH -- $TOOLING && git commit -m "tooling: answer-quality investigation (applied on top of $SHA)")
  (cd .worktrees/aq-$NAME && npm ci && cp -R ../../apps/backend/data/models apps/backend/data/models)
done
```

The copy of `apps/backend/data/models` avoids downloading the embedding model again; any
checkout that already has it will do. Record each worktree's tooling commit:
`git -C .worktrees/aq-base rev-parse HEAD` and the same for `aq-head`. Use them as
`--expect-commit` below.

**0.1 Trace both revisions (free).**

```bash
(cd .worktrees/aq-base && npm run eval:evidence-trace -- --out base --expect-commit <base-tooling-sha>)
(cd .worktrees/aq-head && npm run eval:evidence-trace -- --out head --expect-commit <head-tooling-sha>)
npm run eval:evidence-trace:compare -- .worktrees/aq-base/output/evidence-trace/base .worktrees/aq-head/output/evidence-trace/head
```

This prints both commits, per-case prompt-hash equality (the **unchanged-input stratum**
size, which `OFFLINE-FINDINGS.md` could not measure), how coverage differs, and any case in
only one trace. Check that the base trace's hit and miss matches `baseline.json` (the
command prints `392 cases held against baseline.json`).

**0.2 Staleness and coverage on both** (free): `npm run eval:rules-staleness` and
`npm run eval:rules-coverage` in each worktree. Expect no stale case at either.

**0.3 Check the manifests still fit the head.** The committed manifests pin each case's
question and reference-answer hash; the refresh left both byte-identical for all 392, so a
dry run in the head worktree should list every case (any refusal names the case).

**0.4 Confirm the ten re-snapshotted cases** (`OFFLINE-FINDINGS.md` section 4). Each reads
`approved` at the head, but no case file records an owner verdict. If you confirm them, use
`all-approved.json` for Phase 2 below instead of `primary-cohort.json`.

**0.5 Build the run manifests** (uncommitted, under `output/`, in the *launch* checkout; copy
them to a path both worktrees can read):

```bash
M=output/answer-quality/manifests
npm run eval:answer-quality:manifests -- --emit $M/all-approved.json --from approved
npm run eval:answer-quality:manifests -- --emit $M/primary-cohort.json --from approved \
  --exclude boast-tuskeri-firewalker,combat-flying-and-shadow,copies-quicksilver-gargantuan-and-tarmogoyf,exhaust-afterburner-expert,forecast-sky-hussar,max-speed-amonkhet-raceway,necropotence-silence-borne-upon-a-wind-cleanup,replacement-lifegain-and-draw-replacements-combine,shuffle-sylvan-primordial,token-created-by-name-uses-oracle-card
npm run eval:answer-quality:manifests -- --emit $M/diagnostic-plus-held-out.json --from diagnostic --from held-out
npm run eval:answer-quality:manifests -- --emit $M/named-and-disputed.json --from diagnostic \
  --ids academy-manufactor-esix-treasure,necropotence-silence-borne-upon-a-wind-cleanup,multiplayer-only-blood-ends-your-nightmares-opponents
```

## How every live command looks

```bash
ASK_AI_PROVIDER=openai ANSWER_QUALITY_JUDGE_MODEL=<your judge> \
  npm run eval:answer-quality -- --run-id <id> --manifest <file> [--model <m> ...] [--arm <X> ...] \
  [--repeat <n>] --expect-commit <tooling-sha> --max-cost-usd <your cap> --confirm-live-calls
```

Credentials load as for any live run (REQ-188). Run the **same command without
`--confirm-live-calls`** first: it prints the plan, the calls, the estimate and every rate,
and makes no provider call. The run saves every finished call as it goes. If it stops (the
cap, a crash, a provider outage), continue with `--resume <id>`; failed answers are
re-asked only with `--retry-errors`; a new cap is `--max-cost-usd` again on the resume.

## Phase 1: check the grader (D0)

Question it answers: can the judge be trusted on these cases? It must come first.

```bash
# in the head worktree, GPT-4.1, arm A, the 46 diagnostic cases (92 calls, about $1.03)
npm run eval:answer-quality -- --run-id phase-1-grader-check \
  --manifest apps/backend/src/eval/answer-quality/manifests/diagnostic.json \
  --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls
```

Then you adjudicate about twelve answers (correct, subtly wrong, ambiguous) from
`output/answer-quality/runs/phase-1-grader-check/transcripts/` **without looking at the
judge's score**, and note how often you and the judge agree. Every changed or failing answer
on the three named cases is read by a person; a second model's score alone is not proof.
Do not go on if the judge disagrees with you often: choose another judge (D0).

## Phase 2: did the refresh make answers worse? (D1)

The same GPT-4.1, the same judge, the same manifest, base worktree then head worktree.

```bash
(cd .worktrees/aq-base && npm run eval:answer-quality -- --run-id phase-2-base --manifest ../../output/answer-quality/manifests/primary-cohort.json --expect-commit <base-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-2-head --manifest ../../output/answer-quality/manifests/primary-cohort.json --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
npm run eval:answer-quality:compare -- .worktrees/aq-base/output/answer-quality/runs/phase-2-base .worktrees/aq-head/output/answer-quality/runs/phase-2-head
```

(`aq-base` and `aq-head` each keep their runs under their own `output/`.) Default: the full
paired cohort, so the unchanged-input stratum doubles as the run-to-run noise control. If your
cap is lower, run the changed-input cases plus a seeded sample of the unchanged ones. The
report lists every newly wrong case by name; read the lost-608.2d case's answer.
**Decision D1** follows (see below).

## Phase 3: evidence, presentation, or neither? (D2)

GPT-4.1 fixed, head worktree, the 46 diagnostic cases under arms A, B, C and D, then three
answers each for the named cases.

```bash
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-3-arms --manifest apps/backend/src/eval/answer-quality/manifests/diagnostic.json --arm A --arm B --arm C --arm D --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-3-repeats --manifest ../../output/answer-quality/manifests/named-and-disputed.json --arm A --arm B --arm C --arm D --repeat 3 --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality:compare -- phase-3-arms phase-3-arms --arm-a A --arm-b C)   # and A/B, A/D, B/D
```

Arms C and D read the case's deciding-rule labels, so their results print under "DIAGNOSTIC
CONTROL -- NOT A PRODUCT SCORE": they answer "would complete evidence rescue this?", never
"how good is the product?". Arm P joins once you approve its wording. Trace each case from
the question to the grade with the evidence trace. **Decision D2** follows.

## Phase 4: GPT-4.1 against GPT-6 Luna (D3)

One run per input, a two-model lineup so the blind side-by-side ranking runs (REQ-186).
Luna is named with `--model gpt-6-luna`; no reasoning-effort setting is sent, so it runs at
its default effort and the run records the effort the provider reports.

```bash
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-4-arm-a --manifest ../../output/answer-quality/manifests/diagnostic-plus-held-out.json --model gpt-4.1 --model gpt-6-luna --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-4-best-arm --manifest apps/backend/src/eval/answer-quality/manifests/diagnostic.json --arm <best arm from phase 3, C or D> --model gpt-4.1 --model gpt-6-luna --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality -- --run-id phase-4-repeats --manifest ../../output/answer-quality/manifests/named-and-disputed.json --model gpt-4.1 --model gpt-6-luna --repeat 3 --expect-commit <head-tooling-sha> --max-cost-usd <cap> --confirm-live-calls)
(cd .worktrees/aq-head && npm run eval:answer-quality:compare -- phase-4-arm-a phase-4-arm-a --model-a gpt-4.1 --model-b gpt-6-luna)
```

Report correctness first, then grounding, calibration, readability, rule ids not in the
committed index, failures and timeouts, latency against the 15,000 ms production timeout
(the report counts answers slower than it), tokens and dollars. Only arm A runs on the
held-out set in this package. **Decision D3** follows.

## Phase 5: the decision and the smallest follow-up (D4, D5)

You write a readable report: the paired refresh comparison, failure types with examples,
arm results, model cost and latency, every per-case regression, and what remains uncertain.
It becomes the intake for a follow-up through `thejudge-investigate`, then `graph-kickoff`.

## Decisions, preserved and not pre-decided

| # | Question | What decides it | Not decided here | If inconclusive |
| --- | --- | --- | --- | --- |
| D0 | Which model grades? | You, before Phase 1: stronger than every contestant, never one of them | which model | keep `gpt-5` only if you judge it stronger than Luna |
| D1 | Should PR #273 merge? | Phase 0 data and source changes, required checks on the exact head, the lost 608.2d answer, Phase 2's newly wrong list | the merge itself (yours) | recommend merge only with every newly wrong case explained or accepted by you |
| D2 | Evidence, presentation, or neither? | Phase 3: does C or D rescue failures A fails; does B | a retrieval design or prompt rewrite | report "neither rescued"; no fix proposed |
| D3 | Does Luna beat GPT-4.1, and only because evidence is missing? | Phase 4 on current and best evidence, blind-ranked, repeated | a migration | keep GPT-4.1 |
| D4 | What is the smallest follow-up? | D2 and D3 together; a retrieval candidate is built without gold labels and judged once on the held-out set; PR #266 is re-measured as one candidate | which candidate | preserve evidence, propose nothing |
| D5 | When may a follow-up fix ship? | Proposed rule for the follow-up to adopt: both tester cases pass adjudicated checks, offline gates pass, every newly wrong approved case is fixed or accepted by you; no invented accuracy target; no ratchet raised to hide a regression | durable truth (package-scoped proposal only) | n/a |

## Safety rails you can rely on

- A live run needs `--confirm-live-calls` **and** `--max-cost-usd`; a model with no rate
  refuses to start; the run stops before passing the cap and lists every record it did not
  complete.
- A run refuses a dirty checkout and a different `--expect-commit`, and a manifest naming a
  missing, unapproved, stale or changed case.
- Arms C and D refuse any case outside the diagnostic set; a live run refuses an arm whose
  revision is not frozen (B.1 is frozen; D.1 follows it; P needs your approved wording).
- Nothing here writes `results.json`, edits a case, or becomes a build gate; none of these
  commands is in `quality:check` or CI (a test asserts it).
