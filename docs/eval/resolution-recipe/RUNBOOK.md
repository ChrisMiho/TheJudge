# Runbook: does the layer-and-timing recipe help Luna on hard interactions?

Written 2026-10-10 by the build of the `resolution-recipe-eval` package.
**No paid call was made in the build. Every run below is yours to launch, after the code PR merges.**

What this answers, in game terms: when a player asks about a hard layer or timing
interaction (Blood Moon with Urborg, Humility with Opalescence, a death trigger against
Kalitas), does the AI answer better if its prompt carries a step-by-step resolution
recipe, and does the longer prompt make answers slower than the 30-second wait a player
gets (the failure screen shows after 30 s)? The recipe lives only in the test harness as
"arm R". Today's real prompt is "arm A". Players see nothing from any of this. Adopting the
recipe as real prompt text would be a separate package, judged once on the held-out cases.

## What you decide before spending anything

| Input | Your choice | Note |
| --- | --- | --- |
| Caps | `--max-cost-usd 6` for `rr-hard`, `3` for `rr-regression`, `2` for a follow-up | Every live run passes a cap of **15 USD or less**; the run stops cleanly before passing it |
| Answer model | `gpt-6-luna` | The model that answers players today |
| Judge model | `gpt-6.1-sol` (the tool's default) | Stronger than Luna and fixed for both arms. Printed by every dry run |
| Rates | re-check | Every dry run prints each rate with the date it was checked. Re-check the provider's pricing page; a moved rate is edited in `scripts/eval-answer-quality.mjs` (`MODEL_PRICING_USD_PER_MILLION_TOKENS`, `MODEL_RATE_CHECKED_ON`) before any spend |
| Launching | you | A paid run needs the `autoMode.allow` rule for the answer-quality command in your Claude Code settings, and you launch it yourself (a `!` command in the session, or a plain terminal). An agent does not start a paid run |

## What it costs

The dry run's own estimate (character-count method, no reasoning tokens beyond a small
assumed output), measured at the build:

| Run | Cases | Arms | Repeats | Answers | Estimate | Cap |
| --- | --- | --- | --- | --- | --- | --- |
| `rr-hard` | the 18 hard cases | A, R | 6 | 216 (+216 judge calls) | about $2.56 | `--max-cost-usd 6` |
| `rr-regression` | the 44 other diagnostic cases (ordinary lookups) | A, R | 1 | 88 (+88 judge calls) | about $1.03 | `--max-cost-usd 3` |
| follow-up, only if needed | each regression case R turned right to wrong | A, R | 6 | at most 12 per case | about $0.14 per case | `--max-cost-usd 2` |

Total about **$3.59** by the estimate, **likely nearer $2** by what the 2026-10-09 runs
actually spent (the judge is about $0.005 per answer on record against the $0.011 the
estimate assumes). The judge is most of the cost.

Why the estimate is safe against Luna's reasoning: the estimate assumes 600 answer output
tokens. Luna's recorded output (reasoning included, billed as output) is a mean of 323
tokens overall and 1,286 on the hardest cases (maximum 2,026), at $0.50 per million output
tokens. Even 10,000 tokens cost $0.005, so a recipe that quintupled Luna's reasoning would
add about $0.50 to `rr-hard`. The judge assumption in the estimate is about twice the
recorded judge cost, an over-count of roughly $1 on `rr-hard` alone. The cap, not the
estimate, is the real limit.

## Step 0: check the checkout

Run from a clean checkout of `main` that contains the merged code. An experiment run
refuses a checkout with uncommitted changes. The local embedding model must be warm
(`apps/backend/data/models/` is gitignored, so a fresh worktree has none; run
`node scripts/warm-embedding-model-cache.mjs` there first).

```bash
git status --short                       # expect nothing
npm run eval:answer-quality:manifests -- --check
```

`--check` verifies the committed case lists: every listed case present, approved, current
and matching its hashes, the diagnostic and held-out lists apart. It prints, without
failing, how far a fresh seeded draw would drift. Expect "Check passed". A failure names
the case; fix that before spending.

## Step 1: emit the two run manifests

Both are written under `output/` (gitignored). The 18 hard cases are the nine interactions
in both flows: the 16 cases of the `resolution-recipe-hard-set` group plus the two lookup
cases that already existed (`necropotence-silence-borne-upon-a-wind-cleanup`,
`academy-manufactor-esix-treasure`).

```bash
HARD=academy-manufactor-esix-treasure,academy-manufactor-esix-treasure-in-depth,layers-blood-moon-urborg-dependency,layers-blood-moon-urborg-dependency-in-depth,layers-clone-copies-frogified-serra-angel,layers-clone-copies-frogified-serra-angel-in-depth,layers-humility-then-opalescence,layers-humility-then-opalescence-in-depth,layers-mycosynth-lattice-march-dependency,layers-mycosynth-lattice-march-dependency-in-depth,layers-turn-to-frog-after-giant-growth-counter,layers-turn-to-frog-after-giant-growth-counter-in-depth,necropotence-silence-borne-upon-a-wind-cleanup,necropotence-silence-borne-upon-a-wind-cleanup-in-depth,replacement-kalitas-blood-artist-no-dies-trigger,replacement-kalitas-blood-artist-no-dies-trigger-in-depth,triggers-apnap-blood-artists-at-one-life,triggers-apnap-blood-artists-at-one-life-in-depth

npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-hard.json --from approved --ids $HARD
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-regression.json --from diagnostic --exclude $HARD
```

## Step 2: dry runs first (spend nothing)

Without `--confirm-live-calls` a run prints its plan, the call counts, the estimate and
every rate, and makes no provider request. Before it prints, the run proves each In-Depth
case is asked exactly as the live app would ask it (the prompt from the case's own request
must equal the prompt from the request the app's schema parses) and refuses, naming the
case, if not.

```bash
npm run eval:answer-quality -- --run-id rr-hard --manifest output/answer-quality/manifests/rr-hard.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 6
npm run eval:answer-quality -- --run-id rr-regression --manifest output/answer-quality/manifests/rr-regression.json --model gpt-6-luna --arm A --arm R --max-cost-usd 3
```

Expect `Arms: A (A.1), R (R.1)`, `216 answer calls, 216 lone judge calls` and about $2.56
for `rr-hard`, and `88 answer calls, 88 lone judge calls` and about $1.03 for
`rr-regression`. If a figure differs, stop and find out why.

## Step 3: the paid runs (your step)

Your go-ahead is the `--confirm-live-calls` flag; nothing else spends. A run makes its
calls one at a time, so start the second run only after the first has finished.

```bash
npm run eval:answer-quality -- --run-id rr-hard --manifest output/answer-quality/manifests/rr-hard.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 6 --confirm-live-calls
npm run eval:answer-quality -- --run-id rr-regression --manifest output/answer-quality/manifests/rr-regression.json --model gpt-6-luna --arm A --arm R --max-cost-usd 3 --confirm-live-calls
```

After an interruption, add `--resume rr-hard` (or `rr-regression`) to the same command; it
continues against the cap the run recorded. `--retry-errors` re-asks failed answers.

## Step 4: read the numbers

All offline, no network. Each prints counts and names no winner.

```bash
# the noise floor N: arm A's repeats 1-3 against arm A's repeats 4-6 on the same prompts
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm A --repeats-a 1-3 --repeats-b 4-6
# R against A, half against half (the like-for-like comparison)
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R --repeats 1-3
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R --repeats 4-6
# R against A, every repeat
npm run eval:answer-quality:compare -- rr-hard rr-hard --arm-a A --arm-b R
# the ordinary cases
npm run eval:answer-quality:compare -- rr-regression rr-regression --arm-a A --arm-b R
```

Per side the report gives right answers out of all graded answers (every repeat counted),
the per-case majorities, unstable cases, `latencyMs` p50 and p95, answers slower than 30 s,
and how many of those were right, in every breakdown (so In-Depth and Quick Lookup are
read apart; request kind is the "game" and "lookup" lines). A comparison of two halves of
one arm is labelled a noise-floor comparison. Comparing a side with itself is refused.

`latencyMs` is the harness's wall clock around the provider call. Production's own measure
(`providerElapsedMs`) exists only in production logs, and production adds prompt build,
embedding and network on top, so read the 30-second comparison as a lower bound.

If R turns a regression case from right to wrong, ask that case again six times under each
arm before believing it (cap 2 USD), for example:

```bash
npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-mover.json --from diagnostic --ids <the mover's id>
npm run eval:answer-quality -- --run-id rr-mover --manifest output/answer-quality/manifests/rr-mover.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 2
```

(Dry run first, then the same command with `--confirm-live-calls`.)

## The decision rule (G4, accepted 2026-10-10, fixed before any money is spent)

Each hard case is answered six times under A and six under R. Split each arm's six answers
into two sets of three. Arm A's first three against arm A's last three shows how much the
score moves by pure chance: the noise floor N. Per flow (Quick Lookup and In-Depth judged
separately, never pooled):

1. R must beat A by more right answers than the noise floor in both halves (R's first three
   against A's first three, and R's last three against A's last three);
2. R must lose no case outright: no case right by majority under A and wrong by majority
   under R;
3. any answer slower than 30 seconds counts as wrong, because a player would have seen the
   failure screen instead (REQ-231, REQ-014: the 30-second answer limit, and the failure
   screen shown after it);
4. on the 44 ordinary cases, R must turn no case from right to wrong that holds up when
   re-asked six times under each arm.

Both flows pass: **ship candidate** (a separate package then changes the real prompt and is
judged once on the held-out cases). R behind A by more than the noise floor in either flow,
or failing rule 2, 3 or 4: **don't ship**. Anything else: **test more**.

The compare report prints the right-but-over-30-seconds count that rule 3 needs. The rule
is applied by the person writing the report, to the numbers the compare commands print. It is never re-tuned after the numbers are seen, and the compare command never
declares a winner.

## Group the results by "answer already in an attached ruling"

For some interactions the prompt already prints a Wizards of the Coast card ruling that
states the answer, so those cases test whether Luna reads its prompt, not whether the
recipe helps it reason. The report shows the results in these groups beside each other, so
a win that comes only from the first group is visible:

| Group | Case ids (each in a lookup and an In-Depth case) |
| --- | --- |
| The ruling states the answer | `layers-blood-moon-urborg-dependency`, `layers-humility-then-opalescence`, `layers-turn-to-frog-after-giant-growth-counter`, `layers-clone-copies-frogified-serra-angel` (and their `-in-depth` twins): 8 cases |
| The ruling states part of it | `replacement-kalitas-blood-artist-no-dies-trigger`, `layers-mycosynth-lattice-march-dependency` (and twins): 4 cases |
| Needs reasoning the prompt does not hand over | `necropotence-silence-borne-upon-a-wind-cleanup`, `academy-manufactor-esix-treasure`, `triggers-apnap-blood-artists-at-one-life` (and twins): 6 cases |

Academy Manufactor with Esix is also the regression check: an earlier layers-flavoured
sentence once pushed a model toward layers on a replacement question, and the recipe must
not do that again.

## Where the result goes

Write `docs/eval/resolution-recipe/REPORT.md` after the runs: the compare outputs, the
verdict under the rule above, and the groups. The build does not write it. Copy the run
folders (`output/answer-quality/runs/rr-*`, gitignored) somewhere safe if you want the
transcripts kept.

## If a step fails

| Symptom | Meaning |
| --- | --- |
| `--check` fails | A listed case was edited or went stale since the lists were drawn; the message names it |
| The run refuses a case, naming it, before any call | An In-Depth case would be asked differently from the live app, or an arm may not run on that case |
| `Arm R is refused` | `apps/backend/src/eval/answer-quality/arm-r-recipe.json` is missing, lacks `approvedOn`, or the layers paragraph it replaces no longer appears exactly once in the prompt. A new wording is a new revision (R.2), never an edit of R.1 |
| The run refuses an uncommitted checkout | Commit or stash, or run from a clean worktree |
| A rate is `unpriced` | Add the model's rate and check date to the rate table before any spend |
