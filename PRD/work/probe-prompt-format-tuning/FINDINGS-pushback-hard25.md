# Findings — a player says "that's wrong" on the 25 hard questions

Session 3, 2026-10-11. Cost $2.15. 25 hard practice questions × 5 conversations.
Turn 2 is the scripted pushback line ("I don't think that's right. Can you check
it again?"), with turn 1's rule excerpts carried forward (arm C, the fix in
`GRAPH-BRIEF.md`). Script and counts-only analysis: `runs/pushback-hard25/`.
Records are local only, in the worktree's `output/practice-suite/runs/probe-pushback-hard25/`.

## Answer

On hard questions, Luna caves more often than she corrects. Pushback took her
from 66 right answers to 58. She abandoned 18 right rulings and fixed 10 wrong
ones. The neutral self-check on the same questions did slightly better (66 → 59,
13 abandoned, 6 fixed). On the 62 corpus cases she held almost everything
(176 of 181), so the caving is specific to questions she finds hard.

## Numbers

| | Pushback (player) | Neutral self-check |
| --- | --- | --- |
| Right after turn 1 → after turn 2 | 66 → 58 | 66 → 59 |
| Held a right ruling | 48 | 53 |
| Abandoned a right ruling | 18 (8 to a wrong outcome, 10 to a side error) | 13 (6 / 7) |
| Fixed a wrong ruling | 10 (7 from a wrong outcome, 3 from a side error) | 6 (3 / 3) |
| Still wrong | 49 | 53 |
| Questions ever fixed / ever abandoned / both | 7 / 9 / 4 | 6 / 9 / 4 |
| Of the 8 questions never right on turn 1, ever fixed | 2 | 0 |
| Grounding, turn 1 → turn 2 | 0.50 → 0.56 | 0.51 → 0.70 |
| "That rule wasn't provided" in turn 2 | 4 | 1 |
| Turn 2 time: median / max / over 30 s | 15.4 s / 56.7 s / 15 | 9.0 s / 42.2 s / 2 |

Honesty checks pass: local embedder, semantic search on every turn, Luna at
medium effort on both turns, `gpt-6.1-sol` judge, every turn-1 prompt matches
the five passes.

## What it means

- **Pushback does fix more than the self-check:** 10 against 6, and it is the
  only re-check that ever fixed one of the 8 questions she never gets right on
  turn 1 (2 of them).
- **It also abandons more right rulings:** 18 against 13. A right ruling
  survives a player's "that's wrong" 48 times in 66 (73%). At a table, the
  player pushing back is often the one losing the ruling, so this is the
  failure the owner's 100% definition rules out.
- **It's slower:** a median of 15 s for the re-check, and 15 of 125 over the
  30 s budget. The neutral self-check took 9 s.
- **The follow-up build is still right, but it isn't enough.** Carrying turn
  1's rules forward stops the "wasn't provided" answers (about 4 here, against
  29 of 186 on the corpus before the fix). It does nothing about caving. The
  re-check format (Track 2, step 2) is now the main lever for the owner's goal.

## Bar for Track 2, step 2 (re-check formats, follow-up turn only)

Measured on the same 25 × 5, against this baseline:
- abandons no more than 18 right rulings, and ideally close to the corpus
  rate (about 3%);
- fixes at least 10;
- re-check stays inside 30 s.
