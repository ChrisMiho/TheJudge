# Findings — five passes of the practice suite, today's prompt

Run 2026-10-10 from `.worktrees/probe-pft` (`9a9852dc`), runs `pft-pass1`–`pft-pass5`: 1,184 questions × 5 = 5,920 answers, Luna at today's setting, judge gpt-6.1-sol (rubric 2026-10-10.1). Every answer used the local embedder and reported `gpt-6-luna`. Total $45.38. Counts only (privacy: no question text, ids or per-question results; those stay in the worktree's gitignored `output/practice-suite/`).

"Agree" = judge Correctness 2 against the suite's answer. That is agreement, not correctness: the suite's answers are community-written. A 27-question spot check of hard ones found 25 hold up, 2 doubtful, 0 wrong.

## Headline

- **Each pass agrees on 67–69%** (795–821 of 1,184). The passes differ by up to 26 questions, about 2 points.
- **One question in three is a coin flip.** Of 1,184 questions, 594 agree in all 5 passes, 219 in none, and **371 (31%) flip at least once**. A single run cannot tell a fixed question from a lucky one; any suite comparison needs repeats.
- **Harder labels disagree more.** Never-agree share: level 0 10%, level 1 16%, level 2 16%, level 3 33%, Corner Case 39%; intermediate 36%, complicated 5 of 6.
- **Retrieval reach helps a little.** When every cited rule reached the prompt (159 questions), 59% always agree and 15% never; otherwise (1,025) 49% and 19%.
- **Time:** median 7.9 s, p95 24.2 s; 135 of 5,920 answers (2.3%) went over 30 s. The eval has no cutoff; the live app would time those out.
- **The halves match:** tuning half 300 always / 107 never of 602; check half 294 / 112 of 582.

## Where she disagrees most (sections and tags with 20+ questions)

Share = questions agreeing in 2 or fewer of 5 passes.

| Rules area | Questions | Share mostly disagreeing |
| --- | --- | --- |
| Tag: last known information | 30 | 60% |
| 510 combat damage | 22 | 55% |
| 704 state-based actions (tag 73) | 92 | 52% |
| 205 type line / subtypes | 26 | 50% |
| Tag: layers / 613 | 64 / 67 | 50% / 46% |
| Tag: leaving the game | 45 | 49% |
| Tag: damage | 83 | 48% |
| Tag: multiplayer | 40 | 48% |
| 400 zones | 37 | 46% |
| Tag: face-down objects | 34 | 44% |
| Tag: type-changing effects | 82 | 40% |
| Tag: zone changes | 238 | 38% |

Best areas: reading cards 4%, alternative costs 4%, special actions 14%, casting spells 18%, targets 21%.

This matches the hard-25 diagnosis: the weak spots are judging an object at the moment it moves (last known information, zone changes, leaving play), layers and type-changing, and state-based actions / damage.

## Raw aggregate output

```
By half  (n / always / majority / minority / never)
  check: 582 / 294 / 120 / 56 / 112
  tuning: 602 / 300 / 117 / 78 / 107

By level  (n / always / majority / minority / never)
  0: 134 / 82 / 28 / 11 / 13
  1: 482 / 272 / 85 / 49 / 76
  2: 362 / 173 / 88 / 42 / 59
  3: 147 / 46 / 30 / 23 / 48
  corner: 59 / 21 / 6 / 9 / 23

By complexity  (n / always / majority / minority / never)
  complicated: 6 / 1 / 0 / 0 / 5
  intermediate: 86 / 18 / 19 / 18 / 31
  simple: 1092 / 575 / 218 / 116 / 183

By rules section  (n / always / majority / minority / never)
  100: 4 / 1 / 1 / 1 / 1
  101: 16 / 7 / 2 / 3 / 4
  102: 2 / 1 / 1 / 0 / 0
  103: 20 / 8 / 3 / 3 / 6
  104: 11 / 4 / 1 / 2 / 4
  105: 4 / 3 / 0 / 0 / 1
  106: 19 / 11 / 3 / 1 / 4
  107: 25 / 14 / 3 / 2 / 6
  108: 4 / 2 / 0 / 1 / 1
  109: 17 / 10 / 2 / 1 / 4
  110: 7 / 6 / 0 / 0 / 1
  111: 17 / 5 / 2 / 2 / 8
  112: 2 / 1 / 0 / 0 / 1
  113: 66 / 29 / 14 / 9 / 14
  115: 9 / 4 / 3 / 1 / 1
  116: 7 / 3 / 3 / 0 / 1
  117: 29 / 10 / 11 / 6 / 2
  118: 43 / 28 / 7 / 5 / 3
  119: 2 / 1 / 0 / 1 / 0
  120: 19 / 8 / 2 / 6 / 3
  121: 14 / 4 / 3 / 0 / 7
  122: 14 / 9 / 2 / 0 / 3
  201: 17 / 9 / 3 / 0 / 5
  202: 18 / 14 / 2 / 2 / 0
  204: 3 / 3 / 0 / 0 / 0
  205: 26 / 10 / 3 / 4 / 9
  208: 5 / 1 / 2 / 2 / 0
  300: 4 / 3 / 0 / 0 / 1
  301: 5 / 2 / 1 / 1 / 1
  302: 10 / 4 / 3 / 0 / 3
  303: 19 / 7 / 4 / 2 / 6
  304: 2 / 1 / 1 / 0 / 0
  305: 29 / 15 / 5 / 7 / 2
  306: 2 / 1 / 0 / 0 / 1
  307: 2 / 2 / 0 / 0 / 0
  400: 37 / 14 / 6 / 6 / 11
  401: 3 / 1 / 0 / 0 / 2
  402: 1 / 1 / 0 / 0 / 0
  404: 1 / 1 / 0 / 0 / 0
  405: 15 / 4 / 8 / 3 / 0
  406: 8 / 1 / 2 / 0 / 5
  500: 9 / 7 / 1 / 1 / 0
  502: 3 / 1 / 1 / 0 / 1
  503: 2 / 0 / 0 / 1 / 1
  504: 1 / 0 / 1 / 0 / 0
  505: 4 / 0 / 1 / 2 / 1
  506: 9 / 4 / 3 / 2 / 0
  508: 26 / 12 / 5 / 3 / 6
  509: 13 / 7 / 2 / 0 / 4
  510: 22 / 2 / 8 / 1 / 11
  511: 2 / 1 / 0 / 1 / 0
  514: 17 / 10 / 5 / 1 / 1
  601: 82 / 42 / 21 / 6 / 13
  602: 20 / 10 / 4 / 1 / 5
  603: 154 / 71 / 31 / 28 / 24
  604: 11 / 4 / 5 / 1 / 1
  605: 18 / 9 / 1 / 1 / 7
  606: 5 / 3 / 1 / 0 / 1
  607: 12 / 7 / 1 / 2 / 2
  608: 130 / 60 / 32 / 17 / 21
  609: 15 / 7 / 2 / 3 / 3
  610: 9 / 2 / 3 / 3 / 1
  611: 31 / 19 / 4 / 4 / 4
  612: 3 / 1 / 2 / 0 / 0
  613: 67 / 27 / 9 / 14 / 17
  614: 120 / 54 / 27 / 13 / 26
  615: 5 / 2 / 0 / 2 / 1
  616: 42 / 16 / 13 / 6 / 7
  700: 18 / 14 / 3 / 0 / 1
  701: 64 / 32 / 13 / 8 / 11
  702: 229 / 126 / 45 / 20 / 38
  703: 5 / 1 / 1 / 2 / 1
  704: 92 / 23 / 21 / 22 / 26
  705: 1 / 1 / 0 / 0 / 0
  707: 43 / 22 / 8 / 6 / 7
  708: 7 / 1 / 3 / 1 / 2
  709: 7 / 7 / 0 / 0 / 0
  712: 9 / 4 / 1 / 2 / 2
  714: 10 / 2 / 2 / 3 / 3
  715: 5 / 3 / 1 / 0 / 1
  722: 5 / 3 / 0 / 0 / 2
  723: 3 / 1 / 0 / 2 / 0
  726: 8 / 5 / 0 / 2 / 1
  727: 1 / 0 / 0 / 0 / 1
  729: 10 / 4 / 2 / 2 / 2
  800: 15 / 7 / 1 / 1 / 6
  801: 1 / 0 / 0 / 0 / 1
  805: 2 / 0 / 1 / 0 / 1
  809: 1 / 0 / 0 / 0 / 1
  810: 4 / 1 / 1 / 0 / 2
  903: 7 / 2 / 2 / 0 / 3

By tag  (n / always / majority / minority / never)
  "Can't" effects: 33 / 15 / 7 / 3 / 8
  (none): 2 / 2 / 0 / 0 / 0
  Abilities: 109 / 53 / 20 / 12 / 24
  Activated abilities: 79 / 43 / 14 / 9 / 13
  Additional Costs: 12 / 7 / 3 / 2 / 0
  Adventurer cards: 4 / 2 / 1 / 0 / 1
  Alternative Costs: 28 / 25 / 2 / 0 / 1
  Auras: 47 / 21 / 10 / 4 / 12
  Banding: 1 / 0 / 0 / 1 / 0
  Bestow: 2 / 2 / 0 / 0 / 0
  Card names: 16 / 8 / 3 / 2 / 3
  Casting spells: 164 / 98 / 36 / 11 / 19
  Cleanup Step: 5 / 4 / 1 / 0 / 0
  Color-changing effects: 12 / 6 / 1 / 3 / 2
  Combat: 83 / 29 / 20 / 9 / 25
  Commander: 13 / 4 / 5 / 0 / 4
  Continuous effects: 133 / 65 / 21 / 19 / 28
  Control-changing effects: 51 / 23 / 12 / 6 / 10
  Copy effects: 83 / 39 / 16 / 9 / 19
  Costs: 98 / 62 / 15 / 11 / 10
  Counters: 49 / 23 / 9 / 2 / 15
  Damage: 83 / 28 / 15 / 10 / 30
  Delayed Triggers: 13 / 7 / 2 / 2 / 2
  Dependency: 15 / 5 / 2 / 6 / 2
  Discard: 7 / 5 / 0 / 2 / 0
  Double-faced cards: 12 / 5 / 4 / 2 / 1
  Drawing a card: 36 / 14 / 8 / 3 / 11
  Duration: 5 / 3 / 0 / 1 / 1
  Equipment: 16 / 7 / 4 / 4 / 1
  Evergreen keywords: 98 / 45 / 24 / 8 / 21
  Exchanges: 1 / 1 / 0 / 0 / 0
  Face-down objects: 34 / 10 / 9 / 4 / 11
  Fight: 2 / 2 / 0 / 0 / 0
  Flipping a Coin: 1 / 1 / 0 / 0 / 0
  Graveyard: 20 / 12 / 3 / 2 / 3
  Intervening If: 9 / 4 / 3 / 1 / 1
  Lands: 52 / 23 / 14 / 9 / 6
  Last known information: 30 / 5 / 7 / 4 / 14
  Layers: 64 / 23 / 9 / 16 / 16
  Leaving the game: 45 / 17 / 6 / 9 / 13
  Libraries: 20 / 9 / 5 / 3 / 3
  Life: 23 / 12 / 2 / 2 / 7
  Linked abilities: 15 / 8 / 1 / 4 / 2
  Mana: 54 / 32 / 9 / 4 / 9
  Mana abilities: 55 / 26 / 10 / 4 / 15
  Mana value: 15 / 12 / 1 / 2 / 0
  Meld cards: 1 / 0 / 0 / 0 / 1
  Miscellaneous: 6 / 2 / 0 / 2 / 2
  Morph cards: 9 / 6 / 3 / 0 / 0
  Multiplayer: 40 / 15 / 6 / 6 / 13
  Non-evergreen keywords: 194 / 105 / 32 / 22 / 35
  Numbers and symbols: 35 / 17 / 5 / 7 / 6
  Phasing: 8 / 2 / 4 / 1 / 1
  Planeswalkers: 12 / 7 / 2 / 0 / 3
  Prevention effects: 14 / 6 / 1 / 3 / 4
  Reading cards: 26 / 18 / 7 / 0 / 1
  Regenerate: 1 / 0 / 1 / 0 / 0
  Replacement effects: 228 / 107 / 45 / 20 / 56
  Resolving objects: 190 / 103 / 42 / 19 / 26
  Sagas: 11 / 3 / 2 / 3 / 3
  Silly: 2 / 1 / 0 / 0 / 1
  Special actions: 35 / 21 / 9 / 0 / 5
  Split cards: 8 / 7 / 0 / 0 / 1
  Starting the game: 20 / 10 / 2 / 2 / 6
  State-based actions: 73 / 20 / 15 / 15 / 23
  Static abilities: 65 / 38 / 9 / 7 / 11
  Subgame: 1 / 1 / 0 / 0 / 0
  Subgames: 1 / 1 / 0 / 0 / 0
  Subtypes: 14 / 6 / 4 / 2 / 2
  Targets: 78 / 39 / 23 / 5 / 11
  Text-changing effects: 10 / 5 / 3 / 1 / 1
  The stack: 78 / 29 / 30 / 11 / 8
  Timing and priority: 57 / 25 / 15 / 10 / 7
  Tokens: 43 / 17 / 11 / 5 / 10
  Transform: 5 / 3 / 1 / 1 / 0
  Triggered abilities: 273 / 138 / 55 / 42 / 38
  Trivia: 3 / 1 / 0 / 1 / 1
  Turn structure: 53 / 26 / 13 / 7 / 7
  Turn-based actions: 12 / 7 / 1 / 0 / 4
  Two-Headed Giant: 12 / 5 / 3 / 0 / 4
  Type-changing effects: 82 / 32 / 17 / 14 / 19
  Types: 13 / 9 / 0 / 1 / 3
  Variables: 8 / 6 / 1 / 0 / 1
  Vehicles: 3 / 0 / 1 / 2 / 0
  Zone-changes: 238 / 94 / 54 / 30 / 60

By retrieval reach  (n / always / majority / minority / never)
  allDecidingRulesInPrompt=False: 1025 / 500 / 204 / 126 / 195
  allDecidingRulesInPrompt=True: 159 / 94 / 33 / 8 / 24

```
