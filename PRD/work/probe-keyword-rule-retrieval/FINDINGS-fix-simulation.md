# Probe B — would a keyword lookup legitimately fix the keyword gap? (2026-10-07)

Evidence for a kickoff. Not product truth. Offline only: committed data, frozen
query vectors, no embedder, no network, no model call. Written by the probe driver
from Probe B's returned report (the harness returns subagent findings as text);
headline numbers spot-checked against `measure-fix.out.txt` (lines 18–128).

## Short version

**What a player would get.** When a card with a keyword is attached (Flying,
Cascade, Mill, Ninjutsu...), the AI would always see that keyword's own rule
from the Comprehensive Rules, even when the rule search drops it today.

**Probe B's recommendation, if built: V1 as a "fill" block (V1f).** Take the
keyword's `a` rule only, and add it only when System 3 (the ten scored rule
excerpts) did not already pick it. System 3 keeps ranking exactly as it does today.

- **Gaps closed.** 49 of the 63 keyword-gap cases become complete (every deciding
  rule reaches the prompt). Across all 99 gap cases, 49 close. The corpus goes from
  293 to 342 complete cases out of 392.
- **Regressions: none.** System 3 does not move, so no recorded rule is lost, the
  `eval:worked-solutions` count stays 287, and the context-eval harness's labelled
  checks stay 14/14. The rules gate stays green; a baseline raise records 51 new
  rules as carried by the block. One prompt golden changes
  (`quick-lookup-multi-keyword-card`).
- **Prompt cost.** Over the 392 test cases the block adds nothing at the median,
  459 characters at p95 and 1,449 at most (today's prompt is about 14,300 at the
  median). On real boards: a random 5-card board adds 508 characters at the median
  and 1,432 at p95 (upper bound) — about a quarter of one System 3 section (5,544).

**Why not V2 (the whole rule family).** One more case (702.16b, Horizon Drake) for
about four times the cost; a 5-card board adds 7,492 characters at p95 and one card
(Old Fogey) 16,573 alone. Built with its rules excluded from System 3 it also drops
the context-eval harness's labelled checks to 11/14.

**Why "fill", not the excluded shape curated topics use.** Excluding the block's
rules from System 3 closes the same 49 cases but moves existing numbers:
`eval:worked-solutions` falls 287 → 108 (179 cases' keyword rule moves from System 3
into the block — still in the prompt), and 28 cases lose an unrelated System 3 pick
(the hybrid score min-max normalises over non-excluded candidates, and the keyword
rule is usually the top lexical match). Fill moves nothing.

**What the lookup cannot reach.** 12 of the 63 have no keyword tag: 7 plain actions
(activate, cast, create, discard, play, shuffle, tap) and 5 granted or named keywords
(Lymph Sliver's absorb, Frenzy Sliver, Thrumming Stone's ripple, Visit, villainous
choice). A plain-verb trigger fires on 61.9% of all cards — not worth it. A
named-keyword-in-text trigger closes the 5, fires on 14.8% of cards at ~72 characters
median — a reasonable optional second step.

**Caveat on the size of the win.** 47 of the 49 closed cases are mechanic cases,
written one per keyword and naming that keyword's defining rule as deciding. The
lookup delivers exactly that rule, so the closure is largely structural. Read with
`FINDINGS-missing.md`: in all 63 the source ruling already answers the question.

## Method

- Code under test: `.worktrees/implement-niche-interaction-rule-tests` at `f98b8feb`
  (PR #276 head), read and run only; `git status --short --ignored` identical before
  and after.
- Script `measure-fix.mjs` (this folder), output `measure-fix.out.txt`:
  `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests && npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-fix.mjs`
- Base check: the real `evaluateRulesGate` gives 392 scored, ok, 0 regressions,
  0 cases differ from `baseline.json`; 293 complete, 99 gap; all 63 keyword-gap
  cases among them.
- Mapping (Scryfall keyword → CR rule family, from the rule index, which has no title
  entries), tiers in order: A the `a` rule's subject is the keyword or it opens
  "To <verb>"; B a keyword-action verb in the `a` rule's first sentence; C a later
  sub-rule names a variant (Megamorph, Hexproof from); D landwalk / typecycling.
- Excluded variants V1/V2: patched into production prompt preparation without editing
  code (synthetic curated topics appended and pushed onto `ALWAYS_ON_TOPIC_IDS` per
  case, as in `niche-interaction-rule-tests/measure-rules-gate.mjs`); real
  `evaluateRulesGate` / `preparePromptInput` run unmodified; asserts the patch took
  effect where it fires and is byte-identical where it does not.
- Fill variants V1f/V2f: computed exactly from the base run (System 3 and topics
  unchanged by definition; the block is appended text of keyword rules neither
  carried).
- Costs: block characters as `formatGameRulesSection` lays them out (equal to the
  measured GAME RULES growth in every case); card pool = all 37,564 cards alone, then
  20,000 seeded random 5-card boards (any / creatures only); pool costs ignore
  dedup against System 3, so they are an upper bound for fill.
- Other suites: context-eval System 3 calls reproduced with parity asserted against
  `preparePromptInput`, scored with production `evaluateSystem3RelevanceChecks`;
  benchmark via production `scoreBenchmark`; `eval:worked-solutions` measure with the
  gate's frozen vectors.
- Not run: the vitest suites themselves (would need the feature in the worktree's
  code); outcomes measured through the same functions they call.

## 1. Mapping coverage (873 distinct Scryfall keywords, 37,564 cards)

| Outcome | Keywords | Card-keyword tags |
|---|---|---|
| Maps to a 702 keyword-ability family | 215 | 17,477 |
| Maps to a 701 keyword-action family | 45 | 3,549 |
| No rule: CR 207.2c ability word (Landfall, Threshold, Delirium, Domain, Raid, Heroic…) | 60 | 1,348 |
| No rule: other (Treasure, Food, Role token tags; Prepared, Power-up, Heal, Corrupted…; 528 one-card named abilities) | 553 | 1,438 |

Tiers: A 219, B 13, C 9, D 19. No keyword matched two families at the same tier;
Manifest kept 701.40 over Manifest dread; "Double" (701.10) does not collide with
"Double strike" (702.4); "Wind Walk" kept out of landwalk. 231 of 258 rule families
are reached by some keyword; the 27 never reached are plain actions Scryfall does not
tag, plus Planechase/Archenemy actions, vote, the Ring tempts you, villainous choice,
harness, absorb, poisonous, space sculptor, visit, ∞.

## 2. Rules gate over the whole corpus (392 cases, real gate, cap 10)

| | Base | V1 excluded | V2 excluded | **V1f fill** | V2f fill |
|---|---|---|---|---|---|
| Complete cases | 293 | 342 | 343 | **342** | 343 |
| Keyword-gap cases now complete (of 63) | — | 49 | 50 | **49** | 50 |
| All gap cases now complete (of 99) | — | 49 | 50 | **49** | 50 |
| Missed 701/702 rules now reaching (of 64) | — | 51 | 52 | **51** | 52 |
| Gate failures / regressions | 0 / 0 | 0 / 0 | 0 / 0 | **0 / 0** | 0 / 0 |
| Cases whose System 3 selection changes | — | 192 | 227 | **0** | 0 |
| Unrelated System 3 picks displaced | — | 28 cases | 32 cases | **0** | 0 |
| `eval:worked-solutions` measure | 287 | 108 | 107 | **287** | 287 |
| First-ship 18 (test asserts 16 of 18) | 16 | 16 | 16 | **16** | 16 |
| Block fires | — | 292 / 392 | 292 / 392 | **163 / 392** | 209 / 392 |
| Fires and carries a deciding rule the prompt lacked | — | 51 | 51 | **51** | 51 |
| Fires and carries no deciding rule | — | 62 | 61 | **112** | 158 |

Most common unneeded families: Flying ×16, Trample ×7, Transform ×5, Menace ×5,
Double ×5. The 14 keyword-gap cases V1 leaves open: the 12 with no keyword tag,
`combat-horizon-drake-protection-from-lands` (needs 702.16b; V2 closes it), and
`replacement-regenerate-planeswalker-loyalty-zero` (still misses 704.5i). Of the 49
closed, 47 are mechanic-pool cases; the other two are `commander-devoid-color-identity`
and `dfc-bolas-copy-exile-and-return-transformed`.

## 3. Prompt cost — test corpus (characters added per case)

| | p50 | p95 | p99 | max | mean |
|---|---|---|---|---|---|
| V1 excluded: block | 244 | 720 | 1,089 | 1,705 | 278 |
| V1 excluded: whole prompt | 255 | 1,478 | 2,187 | 4,085 | 408 |
| V2 excluded: block | 562 | 4,324 | 6,521 | 6,927 | 980 |
| V2 excluded: whole prompt | 814 | 4,642 | 6,810 | 7,764 | 1,272 |
| **V1f fill** | **0** | **459** | **869** | **1,449** | **110** |
| V2f fill | 119 | 3,316 | 4,694 | 6,521 | 586 |

Reference today: whole prompt p50 14,306 / p95 19,388; System 3 section p50 5,544 /
p95 9,554; GAME RULES section p50 4,092; all 24 curated topics 25,808.

## 4. Prompt cost — real card pool

| | V1 | V2 |
|---|---|---|
| Cards with any block | 15,584 (41.5%) | 15,584 (41.5%) |
| One card, cards with a block: p50 / p95 / max | 222 / 711 / 3,638 | 771 / 4,625 / 16,573 |
| Random 5-card board: p50 / p95 / p99 / max | 508 / 1,432 / 1,900 / 4,344 | 2,017 / 7,492 / 10,282 / 19,660 |
| 5 random creatures: p50 / p95 / max | 625 / 1,571 / 3,040 | 3,047 / 9,042 / 18,261 |
| Rule text per keyword family: p50 / p95 / max | 241 / 632 / 1,118 | 515 / 2,137 / 4,765 |

Largest single card: Old Fogey (10 keywords), 3,638 (V1) / 16,573 (V2). Fill only
lowers these.

## 5. Other suites

| Suite | V1 excluded | V2 excluded | **V1f fill** | V2f fill |
|---|---|---|---|---|
| Context-eval labelled System 3 checks, lexical / semantic (base 14/14) | 14 / 14 | 11 / 11 | **14 / 14** | 14 / 14 |
| Prompt goldens that change (of 31) | 3 | 3 | **1** | 3 |
| Retrieval benchmark | unchanged | unchanged | unchanged | unchanged |
| Rules gate | green | green | green | green |

Build note: the gate counts curated-topic rules through
`enrichmentDebug.curatedGameRules.topics`; a separate keyword section would need the
gate taught to read its ids, or the 51 closures will not show.

## 6. The 12 cases the keyword tag cannot reach

| Case | Missing rule | What it would take |
|---|---|---|
| activate-chronatog | 701.2a | plain-verb trigger |
| cast-voidstone-gargoyle | 701.5a | plain-verb trigger |
| create-regal-bloodlord | 701.7a | plain-verb trigger |
| play-act-on-impulse | 701.18a | plain-verb trigger |
| shuffle-sylvan-primordial | 701.24a | plain-verb trigger |
| tap-and-untap-snow-day | 701.26a | plain-verb trigger |
| triggers-obstinate-baloth-discard-and-raiders-wake | 701.9a | plain-verb trigger |
| absorb-lymph-sliver | 702.64a (granted) | named-keyword trigger |
| frenzy-frenzy-sliver | 702.68a (granted) | named-keyword trigger |
| ripple-thrumming-stone | 702.60a (granted) | named-keyword trigger |
| visit-swinging-ship | 702.159a (untagged) | named-keyword trigger |
| face-a-villainous-choice-the-dalek-emperor | 701.55a | named-keyword trigger |

Plain-verb trigger: fires on 61.9% of all cards, rules say what every player knows —
not worth it. Named-keyword trigger: closes the 5, fires on 14.8% of cards (median 72
characters, p95 602), carries a deciding family in 10 of 53 corpus firings —
reasonable optional step, built as fill. Question-side trigger: closes all 12 but is
circular (mechanic questions were written around the mechanic's name); a plain action
is named in 206 of 392 questions and decides only 16 — not recommended.

## Probe B's recommendation

V1 as fill (V1f): same 49 cases as V2 bar one; System 3, `eval:worked-solutions` and
the labelled harness checks unchanged; one golden changes; at most 1,432 characters at
p95 on a random 5-card board. Build notes: own prompt section after System 3; skip
rules System 3 picked or a topic carries; never feed System 3's exclusion set; teach
the gate to count the block (the `inTopic` route); raise the baseline (51 rules);
optional named-keyword trigger; leave plain actions alone.
