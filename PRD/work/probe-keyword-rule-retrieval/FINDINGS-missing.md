# Probe A — is the keyword knowledge really missing from the prompt? (2026-10-07)

Evidence for a kickoff. Not product truth. Written by the probe driver from Probe A's
returned report (the harness returns subagent findings as text); spot-checked against
`measure-missing.out.txt` (summary lines and the `absorb-lymph-sliver` block).

## Short version

No. In all 63 cases the official ruling the case was written from is already
in the prompt, word for word — and the case's expected answer *is* that ruling.

- **COVERED: 62 of 63.** The prompt already states the answer.
- **PARTLY: 1 of 63** (`epic-undying-flames`). The prompt answers the question
  asked ("no damage"), but the expected answer adds "the epic lock still
  applies", which only the missing rule 702.50a supports. The ruling in the
  prompt says the opposite on a literal read: "Undying Flames does nothing."
- **MISSING: 0 of 63.**

What that means for a player: on these 63 questions the AI is not short of
facts. When it gets one wrong, the cause is how it reads the prompt, not what
the prompt carries. A keyword → rule lookup would raise the rules gate's count
but would not give the AI any knowledge it lacks on these cases.

Three more things the measurement showed:

1. **The missing rule is usually not the deciding rule.** Each of these cases
   names one keyword rule, almost always the `a` sub-rule, as its tag. Often
   the `a` sub-rule only says "Flying is an evasion ability." In 32 of 63 cases
   a *sibling* sub-rule of the same keyword (b, c, …) already reaches the
   prompt, and in several it is the exact deciding sentence (absorb 702.64b,
   blight 701.68b, connive 701.50e, triple 701.11b, toxic 702.164c). In about
   27 more the answer rests on the card's own wording or on a non-keyword rule
   (targeting, resolution order, layers), and the keyword is incidental.
2. **Reminder text is common but not what decides.** 41 of 63 prompts carry
   the keyword's reminder text on the attached card. It restates the keyword's
   meaning. It decides the answer in only a handful of cases (banding: "you
   divide that creature's combat damage, not its controller"), and in every
   one of those the ruling also states it.
3. **The rulings cap drops nothing.** The per-card cap is 100 rulings
   (`MAX_RULINGS_PER_CARD`), and the largest card here has 21 (Double Stroke).
   Every source ruling sits between position 1 and 9 of its card's rulings.

Every one of the 63 is a tier-2 lookup case with `source.authority:
wotc-card-ruling` and `pool: mechanic`. That explains the result: the corpus
built these cases by phrasing an official ruling as a question, and the prompt
carries every ruling of every attached card (REQ-222's card check enforces it).
These cases test whether the AI reads the ruling. They do not test retrieval.

## Method

- Code under test: `.worktrees/implement-niche-interaction-rule-tests` at
  `f98b8feb` (PR #276 head), read and run only. `git status` in the worktree
  stayed clean after every run.
- Script: `measure-missing.mjs` (this folder). It loads the worktree's modules
  by absolute path and, for each case in `keyword-gap-cases.json`, builds the
  gate's prompt the same way the gate does: `buildCaseRequest` → schema parse →
  `checkReFreeze` (every vector fresh) → `preparePromptInput` with the
  committed indexes, the frozen vector and cap 10. A second call with
  `supplementalRuleCap: 500` gives the full System 3 ranking; the script checks
  that its first ten picks equal the cap-10 picks.
- Run:
  `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests && npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-missing.mjs`
- Output: `measure-missing.out.txt`, one block per case (question, expected
  answer, System 2 topics, System 3 picks, attached cards' oracle and reminder
  text, the source ruling with its position, rulings naming the keyword, sibling
  sub-rules with ranks), summary at the end.
- Checks: (a) missed rule text or id in the whitespace-normalized prompt: 0/63;
  (b) keyword reminder text on an attached card: 41/63; (c) source ruling
  (matched exactly against `expected.answer`) printed in the prompt: 63/63, 0
  dropped by the cap; (d) System 3 hybrid rank with the frozen vector.
- Offline throughout: committed data, frozen vectors, no network, no model call,
  no embedder. Verdicts are Probe A's, by reading each block: COVERED = the
  prompt states the expected short answer (ruling or reminder text); PARTLY =
  some but not the deciding detail; MISSING = only the missed rule states it.

Sample, `absorb-lymph-sliver`, from the prompt the gate scores:

```
ADDITIONAL RELEVANT RULE EXCERPTS
702.64b. 702.64b Each absorb ability can prevent only N damage from any one source at any one time. It will apply separately to damage from other sources, ...
...
oracleText: All Sliver creatures have absorb 1. (If a source would deal damage to a Sliver, prevent 1 of that damage.)
OFFICIAL RULINGS (WotC reference)
Lymph Sliver
- 2021-03-19: If multiple sources would deal damage to a Sliver at once, prevent 1 damage from each of those sources.
QUESTION
If two sources deal damage at the same time to a Sliver that has absorb 1, is 1 damage prevented from each source?
```

## Per-case table

Reminder? = the attached card's reminder text for the keyword is in the prompt.
Ruling = the source ruling is in the prompt (position among that card's rulings).
S3 rank = where System 3 ranks the missed rule (top 10 reach the prompt).
Siblings in prompt = other sub-rules of the same keyword rule already in the prompt.

| Case | Missed | Reminder? | Ruling | S3 rank | Siblings in prompt | Verdict | Reason |
|---|---|---|---|---|---|---|---|
| absorb-lymph-sliver | 702.64a | yes | yes (2/4) | 13 | 702.64b | COVERED | Ruling: "prevent 1 damage from each of those sources"; 702.64b says the same. |
| activate-chronatog | 701.2a | no | yes (1/1) | 12 | – | COVERED | Ruling: "You can only activate the ability once each turn for each Chronatog." |
| affinity-frogmyr-enforcer | 702.41a | yes | yes (8/8) | 17 | – | COVERED | Ruling: "When casting Frogmyr Enforcer prototyped, its affinity for artifacts ability will still apply." |
| amass-crush-dissent | 701.47a | yes | yes (8/8) | 192 | 701.47d | COVERED | Ruling: "You amass 2 even if the controller of the spell pays {2}." |
| amplify-canopy-crawler | 702.38a | yes | yes (1/1) | 122 | – | COVERED | Ruling: "The number of +1/+1 counters for the ability is checked when the ability resolves." |
| banding-ayesha-tanaka | 702.22a | yes | yes (2/5) | 80 | 702.22h, j, k | COVERED | Ruling: "its controller assigns damage for creatures blocking or blocked by it"; the reminder text and 702.22j/k (ranked #1 and #2) say it too. |
| behold-celestial-reunion | 701.4a | no | yes (5/6) | 40 | – | COVERED | Ruling: "doesn't allow you to behold kindred cards or kindred permanents". |
| blight-auntie-ool-cursewretch | 701.68a | yes | yes (4/6) | 30 | 701.68b | COVERED | Ruling: "you can't choose to blight"; 701.68b (#4) is the same sentence. |
| cast-voidstone-gargoyle | 701.5a | no | yes (3/5) | 266 | – | COVERED | Ruling: "The named card can be cast face down." |
| champion-wren-s-run-packmaster | 702.72a | yes | yes (2/2) | 81 | – | COVERED | Ruling: "gives deathtouch to all Wolf permanents you control, not just the tokens". |
| clash-whirlpool-whelm | 701.30a | yes | yes (3/3) | 21 | 701.30b, d | COVERED | Ruling: "You choose the target when you play Whirlpool Whelm, not when you clash." |
| combat-horizon-drake-protection-from-lands | 702.16a, 702.16b | no | yes (1/1) | 25, 22 | 702.16j | COVERED | Ruling: "can't be the target of activated or triggered abilities from lands (including your own Teetering Peaks". |
| commander-devoid-color-identity | 702.114a | yes | yes (2/8) | 14 | – | COVERED | Ruling: "Devoid doesn't affect the color identity of the card for the purposes of the Commander variant." |
| connive-mask-of-the-schemer | 701.50a | yes | yes (1/4) | 22 | 701.50e | COVERED | Ruling: "draw X cards, discard X cards, then … put … +1/+1 counters"; 701.50e (#1) says the same. |
| create-regal-bloodlord | 701.7a | no | yes (4/4) | 37 | – | COVERED | Ruling: "You create only one Bat token, no matter how much life you gained." |
| cumulative-upkeep-mwonvuli-ooze | 702.24a | yes | yes (2/2) | 35 | – | COVERED | Ruling: "Its power/toughness changes when the cumulative upkeep resolves, not when it triggers." |
| cycling-esper-sojourners | 702.29a | yes | yes (4/4) | 148 | 702.29c | COVERED | Ruling: "You can cycle this card even if there are no targets … the cycling ability itself has no targets." |
| daybound-and-nightbound-shady-traveler-stalking-predator | 702.145a | yes | yes (2/9) | 17 | 702.145b, d, g | COVERED | Ruling: "Day and night are designations that the game itself can have. The game starts as neither." |
| deathtouch-wurmcoil-engine | 702.2a | no | yes (1/2) | 11 | 702.2b, c, d, f | COVERED | Ruling: "It must be clear to all players which token has deathtouch and which token has lifelink." |
| defender-ageless-sentinels | 702.3a | yes | yes (1/2) | 143 | 702.3b | COVERED | Ruling: "Once it stops being a Wall, it can attack because it also loses Defender." |
| detain-azorius-justiciar | 701.35a | yes | yes (7/7) | 20 | – | COVERED | Ruling: "can be controlled by the same opponent or by different opponents." |
| dfc-bolas-copy-exile-and-return-transformed | 701.27a | no | yes (3/11) | 22 | 701.27g | COVERED | Ruling: "will only exile it. It won't return to the battlefield at all." |
| enchant-rancor | 702.5a | no | yes (1/1) | 96 | – | COVERED | Ruling: "the Aura spell doesn't resolve … its ability won't trigger." |
| epic-undying-flames | 702.50a | yes | yes (1/1) | 60 | – | **PARTLY** | The question ("does it deal any damage?") is answered by the ruling: "Undying Flames does nothing." The expected short answer adds "the epic lock and the upkeep copies still apply". Only 702.50a supports that, and the ruling's "does nothing" contradicts it on a literal read. |
| equip-demonmail-hauberk | 702.6a | no | yes (1/1) | 12 | 702.6c | COVERED | Ruling: "You can sacrifice the creature Demonmail Hauberk is equipping in order to equip it to another creature." |
| exalted-akrasan-squire | 702.83a | yes | yes (1/6) | 13 | – | COVERED | Ruling: "Exalted abilities will resolve before blockers are declared." |
| explore-nicanzil-current-conductor | 701.44a | no | yes (1/9) | 99 | – | COVERED | Ruling: "it still explores … will still trigger." |
| face-a-villainous-choice-the-dalek-emperor | 701.55a | no | yes (1/3) | 25 | – | COVERED | Ruling: "can always choose either option, even if one or both of the options are impossible". |
| fading-parallax-nexus | 702.32a | yes | yes (1/1) | 240 | – | COVERED | Ruling: "The target opponent chooses which card to exile." |
| fear-inkfathom-witch | 702.36a | yes | yes (5/5) | 26 | 702.36b | COVERED | Ruling: "Inkfathom Witch doesn't cause creatures to lose their abilities." |
| first-strike-pit-spawn | 702.7a | no | yes (1/1) | 21 | 702.7b, c | COVERED | Ruling: "its ability will exile the creature it damages before that creature can deal damage back." |
| flying-kinscaer-harpoonist | 702.9a | no | yes (1/1) | 11 | 702.9b | COVERED | Ruling: "You may target a creature that doesn't have flying." |
| frenzy-frenzy-sliver | 702.68a | yes | yes (3/3) | 11 | – | COVERED | Ruling: "It will trigger even if that creature was put onto the battlefield attacking". |
| graft-vigean-hydropon | 702.58a | yes | yes (1/1) | 30 | – | COVERED | Ruling: "Even though this creature can't attack, it doesn't have defender." |
| hidden-agenda-double-stroke | 702.106a | yes | yes (2/21) | 188 | – | COVERED | Ruling: "must be face up before that ability's trigger condition is met … Turning it face up afterward won't have any effect." |
| infect-blackcleave-goblin | 702.90a | yes | yes (5/6) | 26 | 702.90b, c, e | COVERED | Ruling: "Infect's effect applies to any damage, not just combat damage." |
| intimidate-bladetusk-boar | 702.13a | yes | yes (1/2) | 33 | 702.13b | COVERED | Ruling: "what colors it is matters only as the defending player declares blockers." |
| manifest-wildcall | 701.40a | yes | yes (9/14) | 32 | 701.40e | COVERED | Ruling: "If you choose 0 for X, you'll just manifest the top card of your library." |
| mayhem-oscorp-industries | 702.187a | yes | yes (2/3) | 12 | 702.187b, c | COVERED | Ruling: "only if you have available land plays remaining." |
| meld-mishra-claimed-by-gix | 701.42a | no | yes (7/16) | 17 | – | COVERED | Ruling: "you select one object with that name to exile." |
| melee-wulfgar-of-icewind-dale | 702.121a | yes | yes (2/2) | 52 | – | COVERED | Ruling: "will cause its melee ability to trigger an additional time." |
| menace-boggart-brute | 702.111a | yes | yes (1/1) | 68 | 702.111b | COVERED | Ruling: "removing one or more of those blockers from combat won't change or undo that block." |
| mill-incarnation-technique | 701.17a | no | yes (6/7) | 35 | 701.17d | COVERED | Ruling: "You choose which creature to bring back after you mill five cards." |
| ninjutsu-azra-smokeshaper | 702.49a | yes | yes (6/6) | 13 | – | COVERED | Ruling: "can be activated only after blockers have been declared." |
| offering-patron-of-the-kitsune | 702.48a | yes | yes (2/2) | >500 | – | COVERED | Ruling: "You may gain one life per attacking creature". |
| play-act-on-impulse | 701.18a | yes | yes (1/4) | 161 | 701.18c | COVERED | Ruling: "Any cards you don't play will remain exiled." |
| protection-azorius-first-wing | 702.16a | no | yes (2/3) | 31 | 702.16c, f, j, n, p | COVERED | Ruling: "doesn't have protection from creatures that are enchanted." |
| prototype-blitz-automaton | 702.160a | yes | yes (5/7) | 31 | – | COVERED | Ruling: "The prototype ability functions in any zone that the spell could be cast from." |
| reach-canopy-spider | 702.17a | yes | yes (1/1) | 11 | 702.17b, c | COVERED | Ruling and 702.17b (#2): flying "can only be blocked by creatures with flying or reach"; the reminder text says "can block creatures with flying". |
| reinforce-brighthearth-banneret | 702.77a | yes | yes (1/3) | 45 | – | COVERED | Ruling: "costs {1} less to cast, not {2} less." |
| replacement-regenerate-planeswalker-loyalty-zero | 701.19a | no | yes (1/2) | 11 | – | COVERED | Ruling: "it won't prevent that planeswalker from being put into its owner's graveyard when its loyalty becomes 0." |
| ripple-thrumming-stone | 702.60a | yes | yes (2/2) | 18 | – | COVERED | Ruling: "you may cast either half of that split card (Hit or Run) without paying its mana cost." |
| scry-condescend | 701.22a | yes | yes (2/2) | 29 | 701.22b | COVERED | Ruling: "You scry 2 even if the spell's controller pays {X}." |
| shuffle-sylvan-primordial | 701.24a | no | yes (3/3) | 12 | 701.24b, c, d | COVERED | Ruling: "You search and shuffle your library only once." |
| skulk-farbog-revenant | 702.118a | yes | yes (2/2) | 46 | 702.118b | COVERED | Ruling: "Skulk matters only as blockers are chosen … won't cause the attacking creature to become unblocked." |
| soulbond-deadeye-navigator | 702.95a | yes | yes (1/2) | 15 | 702.95b, c | COVERED | Ruling: "the pair will immediately be broken … the pair can then be reunited." |
| tap-and-untap-snow-day | 701.26a | no | yes (2/2) | 33 | – | COVERED | Ruling: "You may choose tapped creatures as targets. Those creatures won't untap". |
| toxic-annex-sentry | 702.164a | yes | yes (5/7) | 23 | 702.164b, c | COVERED | Ruling: "deals combat damage to a creature or planeswalker … toxic has no effect"; 702.164c is #1. |
| triggers-obstinate-baloth-discard-and-raiders-wake | 701.9a | no | yes (4/4) | 106 | – | COVERED | Ruling: "you've still discarded it … (such as that of Raiders' Wake) will still trigger." |
| triple-tifa-s-limit-break | 701.11a | no | yes (5/7) | 15 | 701.11b, c | COVERED | Ruling: "To triple … +X/+Y, where X is twice that creature's power"; 701.11b, which is in the prompt, is the same sentence. |
| undaunted-coastal-breach | 702.125a | yes | yes (1/2) | 17 | – | COVERED | Ruling: "won't cause you to have to pay more mana." |
| venture-into-the-dungeon-zalto-fire-giant-duke | 701.49a | yes | yes (7/12) | 15 | 701.49c | COVERED | Ruling: "If Zalto is dealt lethal damage, you will still get to venture into the dungeon." |
| visit-swinging-ship | 702.159a | no | yes (1/4) | 66 | – | COVERED | Ruling: "it won't have any effect. No additional combat phase will be created." |

## The 12 cases with no matching keyword tag

All 12 are COVERED by the source ruling in the prompt: absorb-lymph-sliver
(granted, not printed as a tag), activate-chronatog, cast-voidstone-gargoyle,
create-regal-bloodlord, face-a-villainous-choice-the-dalek-emperor (only tag is
Affinity), frenzy-frenzy-sliver (granted), play-act-on-impulse,
ripple-thrumming-stone (granted), shuffle-sylvan-primordial,
tap-and-untap-snow-day, triggers-obstinate-baloth-discard-and-raiders-wake,
visit-swinging-ship. No lookup keyed on keyword tags could reach these, and none
needs one.

## Deciding-rule labels that look wrong

The corpus convention is one 701/702 id per mechanic case, used as its tag, and the
gate scores that tag as the deciding rule. It often points at the wrong sub-rule or
the wrong rule.

- **Deciding sentence is a sibling already in the prompt:** absorb 702.64b (top 10),
  blight 701.68b (#4), connive 701.50e (#1), triple 701.11b (top 10), toxic 702.164c
  (#1), banding 702.22j/k (#1, #2), reach 702.17b (#2), infect 702.90b/c (top 10).
- **Deciding sentence is a sibling that just misses:** face-a-villainous-choice
  701.55b (#11), dfc-bolas 701.27c (#17), explore 701.44c (#29), soulbond 702.95e (#23).
- **Answer rests on the card's own wording; keyword incidental:** amass, amplify,
  champion, create, fading, flying-kinscaer, manifest, melee-wulfgar, mill, offering,
  play, reinforce, scry, shuffle, visit, behold, venture (e.g. offering-patron: the
  question is about the Patron's attack trigger; 702.48a ranks below 500).
- **Answer rests on a non-keyword rule:** activate-chronatog (602.5b), clash (601.2c),
  enchant-rancor (608.2b), fear-inkfathom-witch (613 layers), graft-vigean-hydropon
  (702.3 defender), commander-devoid (903.4), undaunted (601.2f), ripple (709 split
  cards), hidden-agenda (603 trigger conditions), deathtouch-wurmcoil (no rule: token
  bookkeeping), tap-and-untap-snow-day (targeting).
- The rest fit their tag reasonably (cumulative upkeep, cycling, defender, equip,
  exalted, first strike, intimidate, menace, mayhem, meld, ninjutsu, protection ×2,
  prototype, regenerate, skulk, discard, daybound, cast, affinity), though the tagged
  `a` sub-rule is often only a header.

## What this means for the candidate fix

A keyword → defining-rule lookup would put the 701/702 `a` rule in front of the AI
for most of these 63 but add no deciding knowledge the prompt lacks: 62 are already
answered verbatim by the ruling. The one PARTLY case is better fixed in the corpus
(its expected answer and its source ruling disagree). The gate's 63 "keyword misses"
mostly measure the labelling convention, not a knowledge gap.

If the goal is fewer wrong answers on keyword questions, the evidence points to the
other track: questions where the knowledge is present and the answer still goes
wrong (the prompt-presentation package). Separately, the corpus could re-point each
mechanic case's deciding id to the sub-rule that decides it.
