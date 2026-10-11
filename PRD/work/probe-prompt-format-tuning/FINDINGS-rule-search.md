# Findings — why off-topic rules fill the slots, and does "search on the steps" help

Session 3, 2026-10-11. Both probes are free (no API calls, local embedder) and
print counts only. Scripts: `runs/missing-rules/length-bias-probe.mjs` and
`runs/missing-rules/step-search-probe.mjs`, run from `.worktrees/probe-pft`.

## 1. Off-topic rules: a length bias in the word-match half

**Answer:** the rules that turn up on almost every question are among the
longest in the Comprehensive Rules. The word-match half of the rule search adds
up a score for every question word a rule contains, with no correction for
length. A 300-word rule contains most common game words, so it scores well
on nearly any question.

| Rule | Share of prompts | Length (search tokens; average rule 33) | Word-match alone would pick it | Meaning search alone would pick it |
| --- | --- | --- | --- | --- |
| 800.4a | 39% | 239 | 81% | 26% |
| 608.2f | 27% | 163 | 74% | 20% |
| 712.13a | 24% | 142 | 77% | 18% |
| 712.21c | 20% | 139 | 66% | 25% |
| 120.4d | 16% | 214 | 85% | 11% |
| 707.10 | 13% | 232 | 91% | 1% |

All five most frequent rules sit in the longest 1% of the index. The rules
picked for a typical prompt average 83 search tokens, against 33 for the rule
book as a whole.

**Fixing it doesn't help the rulings.** The probe re-runs production's blend
(checked: it reproduces production's top 10 on all 1,181 questions) with the
word-match score corrected for length in several ways:

| Search variant | Deciding-rule citations in prompt (of 2,469) | Questions with every deciding rule | Avg picked-rule length |
| --- | --- | --- | --- |
| **Production (today)** | **473** | **159** | 83 |
| Length-corrected, strong (BM25 b=0.75) | 444 | 142 | 39 |
| Length-corrected, medium (b=0.5) | 462 | 148 | 47 |
| Length-corrected, light (b=0.3) | 473 | 154 | 57 |
| Divide by √length | 449 | 143 | 39 |
| Meaning search alone | 397 | 134 | 45 |
| Word match alone | 365 | 106 | 108 |

With the long rules pushed out, the freed slots go to other rules that also
aren't the deciding one. The deciding rules rank around 300th whatever the
setting, so no re-weighting reaches them. Production's setting already finds
the most deciding rules. On the hard 25 the picture is the same: 5 citations
today, 4 under every length-corrected variant.

**What a fix would buy:** shorter prompts (about 10 × 40 fewer search tokens of
rule text per prompt), and less off-topic text in front of Luna. Whether that
off-topic text hurts her rulings is untested. Not worth a build on today's
evidence.

## 2. "Search on the steps": free pre-test on recorded step lists

The hard-25 breakdown run already recorded Luna's step lists (25 questions × 4
lists, 8.2 steps per list on average). The probe ran production rule search on
those lists instead of on the question. It checks that production's top 10 for
each question still matches the recorded run.

| Search on | Deciding-rule citations in prompt (of 236) | Lists with every deciding rule (of 100) | Questions where any list gets every rule (of 25) |
| --- | --- | --- | --- |
| **The question (today)** | **20** | **12** | **3** |
| The whole step list | 42 | 11 | 3 |
| Question + step list | 42 | 11 | 3 |
| Each step separately, merged to 10 | 36 | 11 | 3 |
| Question's top 5 + steps' top 5 | 27 | 12 | 3 |
| Question's 10 + steps' 10 (20 slots) | 38 | 12 | 3 |

**Answer:** searching on the steps roughly doubles the deciding rules that
arrive (8% → 18%), but it never completes the set for a single extra question.
The step lists name only 16 of the 236 deciding rules by number, so the gain
comes from the step wording, not from Luna recalling rule numbers.

**What it predicts for a paid test:** small. Even with every deciding rule
handed to her, Luna went from 66 to 75 of 125 on these questions. A search that
adds a few more of those rules, on no extra question completely, should land
well inside that gap. One standard error on 125 answers is about 5–6, and
even the every-rule ceiling (+9) only cleared about two of them, so a paid test
would likely come back "no clear difference". It would also add a
full model call (median ~7 s) before every answer.

Caveat: these step lists were written with today's prompt in view, so they had
already seen the rules today's search finds. A pre-step that sees only the
question and the cards might write different lists.

## Where this leaves the "missing rules" track

The deciding rule is abstract. The question is about specific cards. Neither
half of the search links the two. Re-weighting the search doesn't do it, and
neither does searching on Luna's own step wording. The remaining levers sit
outside rule search: curated topics that carry the deciding rules for the
known weak spots (the moment a card is checked, layer-4 ordering, "becomes"
wording), or a different retrieval idea altogether.
