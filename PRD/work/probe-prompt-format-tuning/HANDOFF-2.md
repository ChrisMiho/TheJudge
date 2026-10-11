# Handoff 2: prompt-format tuning toward 100%

Written 2026-10-11, at the end of the session that ran
[`HANDOFF.md`](HANDOFF.md). To pick up in a fresh session, run:

```
/thejudge-investigate PRD/work/probe-prompt-format-tuning/HANDOFF-2.md
```

## Where we are

The owner's goal is 100%. Their definition: if Luna is wrong the first time, being told so
makes her re-check and land on the right answer, and a right answer holds
instead of caving.

- **One build is ready and not yet started:** follow-ups keep their first-turn rules, and the
  answer-quality eval gains a pushback mode. Everything that build needs is in
  [`GRAPH-BRIEF.md`](GRAPH-BRIEF.md). Handoff:
  `/graph-kickoff "Follow-ups keep their first-turn rule excerpts, and the answer-quality eval gains a pushback follow-up mode" PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md`
- **Six attempts to get more out of Luna herself all lost to today's setup:**
  - the layer/timing recipe;
  - describing tasks before answering;
  - high effort;
  - low effort;
  - adding battlefield/stack rules topics to Quick Lookup;
  - an automatic self-check after every answer.

  Don't re-test these. The numbers are in [`PROBE.md`](PROBE.md).
- **Session 2 (2026-10-11):** the pushback test on the hard 25 is running, and
  the missing-rule measurement is done. See "Session 2 progress".

## Where we landed on "Luna describes her tasks"

This was the owner's idea. Before ruling, Luna lists the steps the question needs
her to take. A judge then grades the list as complete, missing a step, or wrong
against the checked answer. The goal is to see where she trips.

**1. The owner's theory holds as a pattern.** When her list is right, her ruling
is almost always right. When the list skips a step, the ruling often goes wrong
at exactly that step.

| Set | Complete list → ruling right | List missing a step → ruling right | List wrong → ruling right |
| --- | --- | --- | --- |
| 18 hard corpus cases × 6 | 51 of 53 (96%) | 45 of 54 (83%) | 0 of 1 |
| 25 hard practice questions × 4 | 18 of 25 (72%) | 29 of 64 (45%) | 0 of 11 |

All 12 lists the judge called "wrong" led to a wrong ruling. On the corpus, the
two real weak spots show it most clearly:
- Necropotence + Silence + Borne Upon a Wind: the list skips the cleanup step
  that ends "this turn" effects.
- Academy Manufactor + Esix: the list skips the player's choice of which
  replacement applies first.

In both, the skipped step is the one the wrong ruling gets wrong.

**2. Making her write the list first doesn't raise her score.** On the hard
corpus she scored 96 of 108 versus 101 for today's prompt, and took twice as long
(median 14.5 s vs 6.8 s, 2 answers over 30 s). On the hard 25 she scored 47 of
100, against today's 62% on the same questions. This fits the wider pattern:
every "make Luna deliberate more" variant lost. Extra deliberation pulls her
away from the attached Wizards ruling.

**3. A complete list isn't enough on the hardest questions.** On the hard 25, 7
complete lists still ended in a wrong ruling. On phased-out cards she named the
right step in 3 of 4 lists and still ruled wrong. The rules test agrees: with
every deciding rule added to the prompt, 8 of the 25 stayed wrong.

**4. Its real value is as a diagnostic, and that's how we used it.** The
skipped steps gave us the map of where she trips. Misses on the hard 25 group
like this:

| Where she trips | Misses | Deciding rules |
| --- | --- | --- |
| Judges a card by the wrong moment (after it enters or leaves, not as it enters or just before) | 19 | 614.12, 614.17a, 611.3c, 303.4g, 400.6, 601.3e |
| Layer 4 ordering (applies an earlier type change again; misses dependency) | 8 | 613.6, 613.8 |
| "Becomes an X" wording (adds vs replaces subtypes) | 8 | 205.1a, 205.3d, 305.7 |
| Hedging when the scenario settles it | 4 | 107.2, 110.1 |
| Phased-out cards | 4 | 702.26e |
| Judge/reference disagreement, not Luna | 4 | (none) |
| Applies a neighbouring sub-rule | 3 | 103.8 |
| Casting order (legality locked before costs) | 3 | 601.2e–h |

The deciding rule reached her prompt in only 2 of the 25 questions. Those 2 were
always right. Adding the rules fixed some of the misses (type wording 1/10 → 5/10;
neighbouring rule 1/5 → 3/5), but two gaps remain even with every rule present.
Those are **layer ordering** and **judging a card at the moment it enters or
leaves**. They are reasoning gaps, not missing information.

**Owner direction (2026-10-11):** the step list is a dev-time tool, never
production. The goal is to flush out ambiguity in the prompt handed to Luna.
Once that's fixed, production Luna just answers, with no self-check on a first
answer. The one place a re-check belongs is when a player questions her ruling.
That is the second track below.

**Track 1: the step list as a prompt-ambiguity finder (dev only).**
- *Sharpen it.* Ask Luna to list each step and, for each one, the part of
  her prompt she's relying on: a rule excerpt, a Wizards ruling, card text,
  an instruction, or "nothing provided". The judge then sorts each miss into
  one of three kinds:
  - the prompt lacked it (a retrieval problem);
  - the prompt had it but she misused it (a reasoning problem);
  - the prompt's own wording was unclear or conflicting. This kind is the
    ambiguity the owner wants flushed out.
  Today's list can't tell these apart.
- *Where to run it.* On the 25 hard practice questions and the 18 hard corpus
  cases first, then on the 219 practice questions she never gets right across
  the five passes. The second set costs about $3–5.
- *Then aim the fix* at whichever kind dominates:
  - prompt wording for real ambiguity;
  - retrieval for missing rules;
  - a short nudge for the two reasoning gaps (for example, "name which moment's
    game state each check uses").
  Test any fix on new corpus cases written in the project's own words. Promoting
  those cases needs owner approval (REQ-185).
- *Caution from the data so far.* The deciding rule was absent in 23 of 25 hard
  questions, so expect "the prompt lacked it" to dominate over "the wording was
  unclear".

**Track 2: tune how she re-checks when a player questions her.**
- *Unmeasured where it matters.* The pushback test ran only on the 62 corpus
  cases. There she holds right rulings well (176 of 181) and fixes some wrong ones
  (4 of 5 today, 7 with the carry-forward fix). Nobody has pushed back on the 25
  hard questions, where she's wrong most often.
- *Warning sign.* The automatic neutral self-check on the hard 25 flipped 6
  right outcomes to wrong and fixed 6. A re-check that caves as often as it
  corrects gains nothing. The player pushing back is often the one losing the
  ruling.
- *Step 1: baseline.* Run a scripted "that's wrong, check again" on the hard
  25 × 5, with turn 1's rules carried forward (arm C). Score held / flipped
  (outcome vs side) / fixed / still wrong. `runs/selfcheck-corpus/selfcheck-probe.mjs`
  already does two turns on the hard 25 with carry-forward; swap its check
  text. It costs about $2.
- *Step 2: re-check formats, follow-up turn only.* Here "describe your steps"
  may earn its place, because it runs only when a player disputes the ruling.
  Candidates:
  - list your steps and their sources, then re-rule;
  - name the specific step the player might be disputing, and check that step
    against the cited rule;
  - restate the ruling with the rule quoted if it holds.
  Keep the 30 s budget. The bar to beat: more fixed, and no more outcome flips
  than baseline.

## Session 2 progress (2026-10-11)

The owner set this path: (1) run the pushback test on the hard 25, (2) look
for the missing rules, (3) then ask Luna what's unclear. One change was agreed:
step 3 runs on the prompt with every deciding rule added, so missing rules
can't muddy it.

### 1. Pushback on the hard 25: running, or resume it

- **Script:** `runs/pushback-hard25/pushback-hard25-probe.mjs`. It's a copy of the
  self-check probe with the turn-2 text set to the pushback line ("I don't think
  that's right. Can you check it again?"). Turn 1's rules carry forward (arm C).
  It runs 25 × 5 = 125 conversations, with its own $6 hard stop.
- **Dry run passed:** all 25 first-turn prompts match the five passes, and the
  estimate is $2.43–$2.95.
- **Live run:** started 15:03 UTC from the previous session. 12 of 125 were done
  at handoff, at about 3 a minute. If that session closed, the run stopped. It
  resumes from disk. From `.worktrees/probe-pft`, run:
  `npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/pushback-hard25/pushback-hard25-probe.mjs --set hard25 --live`.
  The owner launches live runs with `!`. Records go to the worktree's
  `output/rulesguru/runs/probe-pushback-hard25/` (local only).
- **Analyze:** `node runs/pushback-hard25/analyze.mjs`. It prints counts only,
  for pushback and the neutral self-check on the same 25 side by side:
  held / flipped (outcome vs side) / fixed / still wrong, per-question fix and
  flip counts, grounding, "wasn't provided", time, cost and honesty checks.
  Tested on the self-check data, it reproduces the ledger (66 → 59, flipped
  6 outcome / 7 side, fixed 6).
- **What to look for:**
  - Does a player's "that's wrong" fix more and flip fewer than the neutral
    self-check did? The self-check fixed 6 and flipped 6 outcomes.
  - Of the 8 questions she never gets right on turn 1, how many does pushback
    ever fix? The self-check fixed 0.

### 2. Missing rules: measured (free, no API calls)

Script: `runs/missing-rules/rule-rank-probe.mjs`. It uses production retrieval
(cap 10, local embedder) on every practice question, and finds where each
deciding rule lands in the rule search. It prints counts only. Per-question
detail goes to the worktree's `output/rulesguru/reports/pft-rule-ranks-{suite,hard25}.json`
(local only).

| | Whole suite (1,181 questions*) | Hard 25 |
| --- | --- | --- |
| Deciding-rule citations | 2,469 | 59 |
| In Luna's prompt | 473 (19%): 131 via a curated topic, 342 via rule search | 5 (8%) |
| Missing from the rule index entirely | 0 | 0 |
| Missing, ranked 11–20 | 116 | 3 |
| Missing, ranked 21–100 | 344 | 13 |
| Missing, ranked below 100 | 1,536 | 38 |
| Missing rule's sibling or parent is in the prompt | 272 of 1,996 | 12 of 54 |
| Questions with every deciding rule in the prompt: cap 10 / 20 / 30 / 50 | 159 / 199 / 225 / 252 | 3 / 3 / 3 / 3 |

\*3 questions skipped because production would reject them (more than 10 cards).

What it means:
- **The missing rules aren't near misses.** Three in four missing rules rank
  below 100th, so raising the excerpt cap barely helps: every rule arrives for
  159 → 199 questions at 20, 252 at 50, and none of the extra hard-25
  questions. Ranking by meaning alone (cosine) is no better.
- **Why:** a practice question talks about specific cards and a board. The
  deciding rule is abstract ("a replacement effect that modifies how a permanent
  enters…"). The question text doesn't look like the rule text, so neither half
  of the search finds it.
- **Off-topic rules crowd the 10 slots.** The same few rules turn up on any
  question: 800.4a (a player leaving a multiplayer game) in 39% of prompts,
  608.2f in 27%, the double-faced card rules 712.13a / 712.21c in 24% / 20%,
  and 120.4d in 16%. Why they rank so high is unexamined. Likely suspects: the
  card signal (type line and keywords), or generic words in the question.
- **Candidate fix (untested): search on the steps, not the question.** First
  have Luna, or a cheaper model, list the steps the question needs, the way
  the step-list test already does. Then run rule search on those steps and
  answer with the rules found. The step list names rule concepts ("replacement
  effects applying to an entering permanent"), which is what rule text looks
  like. This joins the step-list idea to the retrieval gap. The ceiling to beat
  is the every-rule-added test: 75 of 125 on the hard 25, against 66 of 125 today (the self-check run's first answers).
  The cost is an extra call before the answer, so time it against the 30 s
  budget. It's a pre-step, not Luna checking herself.
- **Old number:** the free retrieval check in session 1 said every cited rule
  reached the prompt for 126 questions. This probe counts 159, because it also
  credits rules a curated topic carries. Use 159 from here on.

### 3. Ask what's unclear: not started

This is the sharpened step list from Track 1 (steps plus the prompt part each
step relies on). Run it on the prompt with every deciding rule added, so a miss
can only be unclear wording or a reasoning slip. The every-rule-added script is
`runs/oracle-suite/oracle-suite-probe.mjs`. The step-list script is
`runs/breakdown-suite/breakdown-suite-probe.mjs`. Combine the two.

## Next steps (recommended order)

1. **Kick off the build** from `GRAPH-BRIEF.md` (command above). It's independent
   of everything below.
2. **Finish and analyze the pushback run** (see 1 above). Record it in `PROBE.md`.
3. **Test "search on the steps"** on the hard 25 × 5. Compare it with today's
   setup and the every-rule-added ceiling. Also find out why 800.4a and similar
   rules rank so high (free).
4. **Ask what's unclear** on the every-rule-added prompt (see 3 above).
5. **Re-check formats on pushback only** (Track 2, step 2), aimed by step 2's
   result.
6. **Stronger-model test, Sol: deferred** until after the above, at the owner's
   word.
   - Swap Luna for Sol (`gpt-6-sol` in discussion) on the hard 25 × 5 and the 62
     corpus cases × 3.
   - About 2 cents an answer. Cap at `--max-cost-usd 15`.
   - Use a judge other than Sol (for example `gpt-6-astra`). Confirm both ids
     are available first.
   - The probe scripts hard-code `MODEL` and `EXPECTED_JUDGE` near the top.

## How to run things (don't rediscover)

- **Worktree:** `.worktrees/probe-pft`, detached at `9a9852dc`, with `npm ci`
  done and the embedder warm. It holds all local practice-suite run data under
  `output/rulesguru/`. Don't remove it without asking the owner. Paid runs refuse
  a checkout with untracked files, which is why they run there and not from main.
- **Every live run:** dry run first, and stop if a figure differs from the plan.
  Pass `--max-cost-usd` ≤ 15. Check that every record shows `embeddingProvider`
  `local` and that `reportedModel` matches the requested model.
- **REQ-232:** a suite run refuses any arm but A. The owner approved comparing
  settings on the hard 25 in local probe scripts only, as an informed exception.
- **"Right"** means Correctness 2 from the judge, rubric `2026-10-10.1`. A
  practice-suite answer is "agrees with RulesGuru", never ground truth. The
  owner sided with the strict judge: a right outcome with a real side error
  scores 1.
- **Variance:** 31% of practice questions flip between passes, so compare
  settings with repeats (×5 on the hard 25, ×3 or ×6 on the corpus), never single
  runs.
- **Hard 25 list and verdicts:** worktree
  `output/rulesguru/reports/pft-hard25.json` and `pft-hard25-verify.json` (local
  only). One answer cites a stale rule number: old 726, now 727.

## Privacy (non-negotiable)

Practice-suite (RulesGuru) questions are used with permission, local only. No
question text, answer text, card list, converted case or per-question result
goes into any committed file, PR body, receipt, commit message or `PRD/` text.
Use counts, levels, rules sections and tags only. Describe examples in the
project's own words. Data lives in the gitignored `output/rulesguru/` in the
worktree. Write nothing about how the permission was obtained beyond "used with
permission, local only".

## Loose ends

- `FINDINGS-pushback.md` and `FINDINGS-breakdown.md` were never written. The
  subagent harness blocks subagents from writing .md reports. The breakdown
  section above covers the breakdown findings. Pushback detail is in
  `GRAPH-BRIEF.md` and `runs/pushback*/`.
- One subagent's oversized tool result containing practice-question text was
  saved under `~/.claude/projects/.../tool-results/`. It is local only, and the
  owner was told.
- Total spend so far: about $75, plus up to $3 for the hard-25 pushback run.
