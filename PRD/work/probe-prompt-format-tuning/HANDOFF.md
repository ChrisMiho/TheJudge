# Handoff — prompt-format tuning toward 100%

Written 2026-10-10 at the end of the session that built and ran the recipe test
and the practice suite. Start the fresh session with:

```
/thejudge-investigate PRD/work/probe-prompt-format-tuning/HANDOFF.md
```

## The question

How should the prompt Luna (GPT-6 Luna, the model that answers players) receives
be organized so she answers every rules question right? Use the new local
practice suite (about 1,245 judge-style questions) to find where she
goes wrong, then find a prompt format that fixes those misses without breaking
anything she already gets right.

The owner wants this session to **manage the investigation**: measure, find the
patterns, propose and test format changes, and land either a plain answer or a
`GRAPH-BRIEF.md` that `/graph-kickoff` can build.

## Before starting: ask the owner one thing

The owner has said he has more ideas on how the prompt's data should be
organized. Only the first (the layer-and-timing recipe below) has been shared and
tested. **Ask for the rest first** and fold them into the candidates.

## Where things stand (all measured 2026-10-10 on `main`)

**Today's prompt (arm A) is already strong.** Graded strictly by the judge
(`gpt-6.1-sol`, rubric revision `2026-10-10.1`; "right" = Correctness 2, so a
right outcome with a real side error scores 1 and counts as wrong):

| Set | Right | What the misses are |
| --- | --- | --- |
| 18 hard layer/timing cases, 6 answers each | 101 of 108 | Necropotence + Silence + Borne Upon a Wind cleanup, Quick Lookup: **4 of 6 wrong outcome** (the only real weak spot). The other 3 misses are right outcomes marked down for a side error (Academy Manufactor + Esix, Clone copying a frogified Serra Angel, Necropotence In-Depth) |
| 44 ordinary diagnostic cases, 1 answer each | 43 of 44 | Vengeful Archon damage prevention: right outcome, side error |

**The first new format failed.** Arm R added rule 613's layer list (with 7a–7d),
a timing ladder and a step-by-step recipe. It scored 96 of 108 against A's 101,
broke no ordinary case, and added about 1.2 s per answer. Verdict: don't ship.
The full report is `docs/eval/resolution-recipe/REPORT.md` (on `main`); read it
first. The key lesson: **the losses were on cases where an attached Wizards
ruling already prints the answer** (47 → 41 of 48). The recipe pulled Luna into
re-deriving layers instead of trusting the ruling in front of her. Where the
prompt does not hand over the answer, the recipe was level or one ahead, and it
fixed the Necropotence cleanup case (2 → 5 of 6). A candidate the numbers point
to, not a decision: "trust an attached ruling first; work through the steps only
when no ruling settles it".

**The practice suite is built and loaded, but never run.**
- 1,485 questions imported into `output/practice-suite/` (gitignored, local only),
  1,245 usable as cases. Set aside: 78 unresolved card, 2 ambiguous card,
  159 with no cited rule, 1 duplicate answer. 61 more are tagged "Unsupported
  answers" and are left out of runs unless `--include-unsupported`.
- Commands (REQ-232 in `PRD/sections/functional-requirements.md` is the spec):
  - free, no provider call: `npm run eval:worked-solutions -- --suite practice`
    — does the rule each question cites reach Luna's prompt? Split by level,
    complexity and Comprehensive Rules section.
  - paid: `npm run eval:answer-quality -- --suite practice --run-id <id> --model gpt-6-luna [--sample N --seed S] [--level …] [--complexity …] [--suite-tag …] --max-cost-usd <≤15>`
    — dry run without `--confirm-live-calls`. A 200-question sample estimates
    **$2.35**; the full 1,245 would be about $14.6 by estimate (real spend has run
    near 60% of the estimate, so roughly $9). Keep every live run at
    `--max-cost-usd` 15 or less, and split the full set into two runs.

## Three constraints that shape the plan (challenge them with the owner if needed)

1. **Practice-suite answers are community-written, not ground truth.** A suite result
   is "agrees with the practice suite", never "correct" (REQ-232, REQ-186). A
   disagreement may be Luna's error or the suite's. Use the suite to **find
   patterns** of disagreement, then check the pattern against the Comprehensive
   Rules and Wizards rulings before treating it as a Luna weakness.
2. **The suite runs today's prompt only.** By the accepted REQ-232, a suite run
   refuses any arm but A. Old-versus-new format comparisons run on the committed
   corpus (`npm run eval:answer-quality` with a manifest and `--arm A --arm X`),
   where answers are owner-approved. Two ways to bring a practice-suite finding into
   that comparison:
   - write a corpus case in the project's own words with a Wizards answer and
     approve it by hand (REQ-185's promotion rule: nothing from the suite is
     copied, no wording, no question id); or
   - propose amending REQ-232 to allow arm comparisons on the suite, which is a
     product decision for the owner at a `define` gate, not something to just
     switch on.
3. **"100%" needs a definition before it is a target.** Two identical runs of
   today's prompt differed by 3 right answers out of 54 (the noise floor), and
   the strict rubric marks a right outcome with a side error as wrong. Suggest to
   the owner a measurable goal, for example: no case wrong by majority across 6
   repeats, no systematic error pattern left in the suite's disagreements, and no
   answer over the 30-second limit. Avoid tuning on the same questions you
   measure on: hold back a seeded half of the suite as a check set.

## A suggested shape (the session decides)

1. Run the free retrieval check over the whole suite. It costs nothing and shows
   where the needed rule never reaches the prompt; that is a retrieval problem,
   not a format one.
2. Run a seeded paid sample of today's prompt (200 questions, about $2.35) on
   the tuning half. Group the disagreements by level, complexity, rules section
   and tag; read the transcripts; sort each pattern into "Luna is wrong",
   "the suite's answer is wrong or ambiguous", or "rule never reached the prompt".
3. For each real Luna pattern, propose a format change, and write or select
   corpus cases that exercise it.
4. Compare old versus new on the corpus diagnostic set and the hard set, with the
   accepted G4 decision rule in `docs/eval/resolution-recipe/RUNBOOK.md`
   (beat the noise floor in both halves, lose no case outright, no answer over
   30 s, break no ordinary case).
5. Confirm on the held-back half of the suite with today's prompt versus the
   winner only if REQ-232 is amended to allow it; otherwise confirm on held-out
   corpus cases.

## Mechanics that cost time on 2026-10-10

- **Paid runs refuse the main checkout** while it has untracked files (the
  owner's `PRD/work/` folders, including this one). Run from a clean worktree:
  `git worktree add --detach .worktrees/<name> origin/main`, then `npm ci` and
  `node scripts/warm-embedding-model-cache.mjs` inside it. The practice suite
  lives in the main checkout's `output/practice-suite/`; copy it into the worktree's
  `output/practice-suite/` (gitignored there too) for a suite run.
- **Paid runs need the owner's go-ahead.** The auto-mode allow rule for
  `npm run eval:*` is in the owner's settings; every live run passes
  `--max-cost-usd` 15 or less. Dry run first, and stop if a figure differs from
  the plan.
- **Prices in the tool were last checked 2026-10-08**
  (`MODEL_PRICING_USD_PER_MILLION_TOKENS` in `scripts/eval-answer-quality.mjs`).
- **Compare reports overwrite one saved file** (`output/answer-quality/compare-<a>-<b>.*`
  ignores arm and repeats). Keep each printed comparison separately.
- **Check every run is honest** before reading it: every record's
  `embeddingProvider` should be `local` (no silent fallback to keyword
  retrieval), and `reportedModel` should be the model asked for.
- Backups of the recipe runs (transcripts and the five printed comparisons):
  `~/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10/`.

## Privacy rules (non-negotiable)

Practice-suite questions stay local only. No suite
question text, answer text, card roll, converted case or per-question result goes
into any committed file, PR body, receipt, commit message or `PRD/` text —
counts, levels, rules sections and tags only. Never name the suite's source.
Findings that
need examples describe the rules pattern in the project's own words.

## Where to write

Only inside `PRD/work/probe-prompt-format-tuning/` (untracked, inert to the
lifecycle): a `PROBE.md` ledger, `FINDINGS-*.md` for evidence, and a
`GRAPH-BRIEF.md` if the outcome is a build. A prompt change itself ships through
`/graph-kickoff`, never from the probe.
