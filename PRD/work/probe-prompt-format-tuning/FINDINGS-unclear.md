# Findings — "ask what's unclear" on the hard 25

Session 3, 2026-10-11. Cost $2.66. 25 hard practice questions × 4. Script and
counts-only analysis: `runs/unclear-hard25/`. Records are local only, in the
worktree's `output/rulesguru/runs/probe-unclear-hard25/`.

**Setup:** every deciding rule was added to Luna's prompt (the same additions as
the every-rule run that scored 75 of 125). She first listed her steps, naming the
part of the prompt each step relies on, and anything she found unclear. Then
she ruled. A judge (`gpt-6.1-sol`) sorted every point where her reasoning left
the reference answer into three kinds:

- **lacked:** the prompt didn't carry what the step needed;
- **misused:** the prompt carried it plainly, and she got it wrong;
- **unclear:** the prompt's own wording was ambiguous or conflicting.

## Answer

**The prompt's wording isn't what trips her. Applying the rules is.** With every
deciding rule in front of her, 148 of 175 misses (85%) were rules she had and
misapplied. Only 16 were blamed on unclear wording, and none of those pointed at
our own instructions. A prompt rewrite has little to aim at. The gap is
reasoning, which points at the model rather than the prompt.

## Numbers

| | Count |
| --- | --- |
| Rulings right | 53 of 100 (answering straight with every rule: 60%) |
| Step list complete / missing a step / wrong | 37 / 49 / 14 |
| Ruling right when the list was complete / missing / wrong | 27 of 37 / 25 of 49 / 1 of 14 |
| Conversations with at least one miss | 75 of 100 |
| Misses: misused / unclear / lacked | 148 / 16 / 11 |
| Misused, by prompt part: rule excerpt / card text / ruling / instruction | 128 / 14 / 4 / 2 |
| Unclear, by prompt part: Wizards ruling / rule excerpt / none | 12 / 3 / 1 |
| Lacked, by prompt part: card text / none | 7 / 4 |
| Time for steps + ruling, median | 28.5 s |

**Rules she most often had and misapplied:** 613.8a and 305.7 (8 each), 614.12
(7), and 614.1c (5). Next, at 4 each: 613.6, 614.17a, 303.4g, 205.1a, 601.2e,
105.3, 616.1, 704.5n, 405.1, 107.5 and 608.3e. These are the same weak spots the
session-2 diagnosis found:

- layer dependency and ordering;
- the moment a card is checked as it enters or leaves;
- "becomes" type wording;
- casting order.

**The "unclear" misses:**
- 12 point at a Wizards ruling attached to the prompt that is misleading for this
  question. This fits the earlier pattern of a ruling for a nearby situation
  pulling her off course.
- 3 point at the Comprehensive Rules' own banding wording (702.22).
- None point at our prompt instructions.

**Her own "unclear" flags are mostly noise.** She flagged 206 items in 85 of 100
conversations. The judge found 60 of them real, and only 18 both real and tied
to an actual miss. Asking Luna what confuses her doesn't find what makes her
wrong.

Honesty checks pass: Luna at medium effort on both turns, local embedder, every
base prompt matches the five passes. 72 of 100 prompts carry every
suite-cited rule; the other 28 lack a rule the answer check judged
non-deciding, the same as in the every-rule run.

## What it means for the plan

- **Track 1 (prompt-ambiguity hunt): close it.** There is little prompt
  ambiguity to fix. The one lead is Wizards rulings that mislead on nearby
  situations (12 misses). That's a retrieval-precision question, not wording.
- **The model comparison is the right next question.** If the misses are
  reasoning, a stronger model is the lever. The Sol run on the hard 10 answers
  it directly.
