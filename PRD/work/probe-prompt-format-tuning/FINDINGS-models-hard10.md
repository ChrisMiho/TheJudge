# Findings — Luna vs Sol on the 10 hardest questions

Session 3, 2026-10-11. Cost: Luna $0.94, Sol $2.83. Scripts and counts-only
analysis: `runs/model-compare/`. Records are local only, in the worktree's
`output/practice-suite/runs/probe-models-hard10/`.

**Setup:** the 10 hard-25 questions Luna gets right least often (8 right in 150
earlier answers). Each model answers with today's production prompt, then hears
"I don't think that's right. Can you check it again?" with turn 1's rules
carried forward. Each question runs 5 times. Every answer is graded by
`gpt-6.1-sol` (today's judge) and by `gpt-6-luna` (a candidate cheap judge). No
effort setting was sent; both models reported medium. Terra was dropped because
it costs about the same as Sol. Astra was deferred.

## Answer

**Sol is not the answer for first rulings.** On these questions it's no better
than Luna (9 of 50 against 8 of 50), and it costs 14 times as much per answer.

**Sol is better at re-checking:** it fixed 7 wrong rulings under pushback to
Luna's 2. Both abandoned 5 right rulings. Sol was also faster.

**The cheap judge works.** Luna as a judge agreed with Sol on right/not-right
for 191 of 200 answers (96%).

## Numbers (Sol judge; Luna judge in brackets)

| | Luna | Sol |
| --- | --- | --- |
| First answer right | 8 / 50 (6) | 9 / 50 (7) |
| First answer, wrong outcome | 33 (31) | 33 (31) |
| Right after pushback | 5 (7) | 11 (10) |
| Held / abandoned / fixed / still wrong | 3 / 5 / 2 / 40 | 4 / 5 / 7 / 34 |
| Questions ever right first time | 4 of 10 | 3 of 10 |
| First answer: median / over 30 s | 16.3 s / 5 | 8.4 s / 1 |
| Re-check: median / over 30 s | 17.3 s / 8 | 13.8 s / 3 |
| Cost per answer | $0.0015 | $0.0205 |
| Output tokens per answer, median (reasoning) | 1,733 (1,552) | 1,068 (852) |

## What it means

- **Both models fail these 10 the same way.** Both give a wrong outcome on 33 of
  50 first answers. In today's prompt the deciding rule is missing for almost
  all of these questions, and the "ask what's unclear" run showed that even with
  the rules present, the misses are reasoning slips on the same few weak spots.
  A stronger model of the same family doesn't clear them. Astra would show
  whether any model does. That's the one question left that only a top-tier
  model can answer.
- **Re-checking is where Sol earns its price.** Fixed 7 to 2 at the same
  abandon rate is a hint, not proof: 50 conversations, so one standard error is
  about 3. It points at an escalation design: Luna answers, and Sol takes over
  only when a player disputes the ruling. Disputes are rare, so the cost stays
  close to Luna's.
- **Sol is faster on hard questions,** because it reasons in fewer tokens. A
  Sol re-check fits the 30 s budget better than a Luna one.
- **Judge:** Sol as judge did not favour Sol's own answers. Both judges scored
  both models the same way, with Luna's judge slightly more lenient on each.
  `gpt-6-luna` is a viable judge for probe runs at about a twentieth of the
  cost. Keep `gpt-6.1-sol` for any number that goes into a decision record
  until a larger agreement check passes.

## Suggested next test (not run)

**Escalation on the hard 25 × 5:** reuse the existing Luna first answers from
the pushback run, and have Sol answer only the pushback turn. Compare against
Luna re-checking herself (held 48, abandoned 18, fixed 10). Only the turn-2 Sol
calls are new: about $2.50 for answers, plus a few cents with the Luna judge.
