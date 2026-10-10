# Report: the layer-and-timing recipe does not help Luna

Run 2026-10-10 on `main` at `3c93ee2f`, following [RUNBOOK.md](RUNBOOK.md).

## What this means for a player

Nothing changes for players. Today's prompt (arm A) stays. Giving GPT-6 Luna a
step-by-step layer-and-timing recipe (arm R) made its answers to hard layer and
timing questions slightly worse, not better. It cost about a second more per
answer and never came near the 30-second limit.

**Verdict under the decision rule (G4, accepted before any money was spent):
don't ship.** Two of the four rules fail on their own.

## The decision rule, applied

Each of the 18 hard cases (nine interactions, each asked in Quick Lookup and in
In-Depth) was answered six times under each arm. "Right" means the judge gave
Correctness 2. The noise floor is arm A against itself, repeats 1–3 against
repeats 4–6.

| Flow | Noise floor (A 1–3 vs A 4–6) | R vs A, repeats 1–3 | R vs A, repeats 4–6 | All repeats |
| --- | --- | --- | --- | --- |
| In-Depth | 26 vs 27 (1) | R 26, A 26 | R 25, A 27 | R 51/54, A 53/54 |
| Quick Lookup | 23 vs 25 (2) | R 22, A 23 | R 23, A 25 | R 45/54, A 48/54 |

1. **R beats A by more than the noise floor in both halves, in both flows:
   fails.** R never beats A in either half of either flow. In In-Depth, R is
   behind by 2 in the second half against a noise floor of 1, which on its own
   means don't ship.
2. **R loses no case outright: fails.** Academy Manufactor with Esix (Quick
   Lookup) is right 5 of 6 under A and 2 of 6 under R.
3. **Answers over 30 seconds count as wrong: no effect.** None of the 304
   answers took 30 seconds. The slowest p95 in any comparison was 19.4 s (R,
   repeats 4–6, both flows together).
4. **R breaks no ordinary case: passes.** On the 44 ordinary diagnostic cases
   (one answer each), A got 43 right and R 44, with no case turned from right
   to wrong, so no follow-up re-asks were needed.

## Where the recipe hurt and helped

Grouped by whether the prompt already carries a Wizards card ruling that states
the answer (all repeats, right answers):

| Group | Quick Lookup A / R | In-Depth A / R |
| --- | --- | --- |
| The ruling states the answer (Blood Moon + Urborg, Humility + Opalescence, Turn to Frog, Clone of a frog) | 23 / 20 of 24 | 24 / 21 of 24 |
| The ruling states part of it (Kalitas, Mycosynth Lattice + March) | 12 / 12 of 12 | 12 / 12 of 12 |
| Needs reasoning the prompt does not hand over (Necropotence, Academy Manufactor, Blood Artists) | 13 / 13 of 18 | 17 / 18 of 18 |

The recipe's losses sit almost entirely in the first group: cases Luna already
answers by reading the printed ruling. The likely reading is that the recipe
pulls Luna into re-deriving the layer order itself instead of trusting the
ruling in front of it, and it sometimes derives it wrong. Where the prompt does
not hand over the answer, the recipe is level or one answer ahead.

Cases that moved (right answers out of 6):

| Case | A | R |
| --- | --- | --- |
| Academy Manufactor + Esix (Quick Lookup) | 5 | 2 |
| Clone copying a frogified Serra Angel (Quick Lookup) | 5 | 3 |
| Blood Moon + Urborg (In-Depth) | 6 | 4 |
| Blood Moon + Urborg (Quick Lookup) | 6 | 5 |
| Clone copying a frogified Serra Angel (In-Depth) | 6 | 5 |
| Necropotence + Silence + Borne Upon a Wind cleanup (Quick Lookup) | 2 | 5 |
| Necropotence + Silence + Borne Upon a Wind cleanup (In-Depth) | 5 | 6 |

**Academy Manufactor is not the old layers mistake.** The runbook flagged this
case because an earlier layers sentence once pushed a model toward layers on a
replacement question. None of R's wrong answers mentions layers. Three of the
four describe both replacement orders correctly but say Esix works whenever it
"hasn't been used", where Esix applies only to the first token-creation event
of each of your turns (the strict grade gives that a 1). The fourth applies
Esix first as if forced and misses the three-copy outcome.

## Speed and cost

| Run | Arm | Mean | p50 | p95 |
| --- | --- | --- | --- | --- |
| Hard cases | A | 7.7 s | 6.8 s | 16.6 s |
| Hard cases | R | 9.0 s | 7.4 s | 18.1 s |
| Ordinary cases | A | 3.8 s | 3.7 s | 6.0 s |
| Ordinary cases | R | 4.9 s | 4.1 s | 8.3 s |

These are the harness's own timings around the provider call; production adds
prompt build, embedding and network, so read them as a lower bound.

Actual spend: $1.65 for the hard cases (cap $6) and $0.52 for the ordinary
cases (cap $3), **$2.17 in total** against a $3.59 estimate. The judge was most
of it.

## How the runs were made

- Answer model `gpt-6-luna` (every record reports it); judge `gpt-6.1-sol`;
  rubric revision `2026-10-10.1`; excerpt cap 10; arms A (A.1) and R (R.1).
- Run ids `rr-hard` (216 answers, 0 errors) and `rr-regression` (88 answers,
  0 errors), both at commit `3c93ee2f`, from a clean worktree with the local
  embedding model warm. Every record shows the local embedder, so no answer fell
  back to keyword retrieval. Each case got one prompt per arm across all six
  repeats; R's prompt is about 940 characters longer.
- The comparisons are the five `eval:answer-quality:compare` commands in the
  runbook's step 4. The run folders and the five printed comparisons are kept
  outside the repo in the owner's `TheJudge-backups/resolution-recipe-2026-10-10/`.

## What would be worth trying next

Not a decision, just what the numbers point to. The recipe does no good where
the prompt already prints the answer, and the only clear gain is on a case
(Necropotence cleanup) that needs step-by-step timing. A narrower recipe that
tells Luna to trust an attached ruling first, and to work through the steps only
when no ruling settles the question, would be a different arm (R.2) and a new
measurement.
