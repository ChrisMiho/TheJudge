# Probe C — are the non-keyword rule gaps really missing from the prompt? (2026-10-07)

Evidence for a kickoff. Not product truth. Written by the probe driver from Probe C's
returned report (the harness returns subagent findings as text). Driver spot-checks:
the REQ-179 exclusion code (`apps/backend/src/gameRulesRetrieval.ts` ~line 700:
`excludeRuleIds.has(entry.ruleId) || entry.parentRuleIds.some(...)`), the
`abilities-trigger-basics` topic (`ruleNumbers` 603.1, 603.2, 603.3; 926 characters;
no 603.2e text), and the `triggers-becomes-tapped-not-entering-tapped` block in
`measure-missing-nonkeyword.out.txt`.

## Short version

Almost never. Of the 37 cases whose deciding rule outside 701/702 never reaches the
prompt: **35 COVERED, 1 PARTLY, 1 MISSING.**

- 34 are official card rulings (`wotc-card-ruling`, pool `two-card-ruling`, tier 2);
  the source ruling is in the prompt word for word in all 34 and the expected answer
  is that ruling.
- 2 are Comprehensive Rules examples (`wotc-comprehensive-rules`, pool `cr-example`,
  tier 1, no cards attached).
- 1 is the owner-approved tester case (`owner-approved-derived`, pool `tester`, tier 3).
- All 37 are lookup mode with no game state, so System 2 carries only the four
  always-on topics, plus REQ-220's replacement topic in 3 cases (crafty-cutpurse,
  szadek, hydra).
- `triggers-damage-prevented-no-trigger` is the weakest COVERED: 615.6 (#2, "If damage
  that would be dealt is prevented, it never happens.") plus 603.2 in an always-on
  topic state it between them; no single sentence says it outright.

For a player: on 35 of 37 the AI already has what it needs; a wrong answer there is a
reading problem, not a retrieval gap.

## The two real gaps — different causes, both fixable

**1. MISSING: `triggers-becomes-tapped-not-entering-tapped` — the REQ-179 exclusion.**
A player asks whether a "becomes tapped" trigger fires when a permanent enters tapped.
Only 603.2e says it doesn't. REQ-179 excludes a curated parent rule's lettered
sub-rules from System 3 on the premise that the topic carries them. The always-on
topic `abilities-trigger-basics` lists 603.1, 603.2 and 603.3 but its excerpt carries
only each parent's own sentence. So **41 sub-rules are shut out of System 3 on every
lookup prompt** without the prompt ever carrying them: 603.2a–h, 603.3a–d, 603.1a–b,
117.1a–d, 117.3a–d, 115.1a–e, 115.10a–b, 400.7a–m.
Counterfactual (exclude only the exact curated rule numbers): 603.2e ranks **#1** here,
603.2g ranks **#1** in `damage-prevented`, 603.3b #243 in `goreclaw` (covered by its
ruling anyway). Fix to scope: exclude only the rule numbers a topic actually carries
(or have the topic carry the sub-rules) — one exclusion test in
`gameRulesRetrieval.ts`. Must be measured over the whole corpus before building: freeing
41 candidates changes System 3 on every lookup prompt.

**2. PARTLY: `necropotence-silence-borne-upon-a-wind-cleanup` (the tester case) — a
stem rule without its exception.** Present: 703.4p (#5) restates 514.2 ("all 'until
end of turn' and 'this turn' effects end"). Absent: 514.3a, the deciding half: "If so,
those state-based actions are performed, then those triggered abilities are put on the
stack, then the active player gets priority. Players may cast spells and activate
abilities." The prompt carries 514.3 (#2), which ends "…no player receives priority
during the cleanup step… subject to the following exception:" — read alone, it points
toward the wrong answer. 724.1f (#4) says the same for turn-ending effects. 514.3a
ranks **#13**, just outside the ten. Fix to scope: when System 3 picks a rule whose
text ends in a colon, also pull in its lettered sub-rules (here exactly 514.3a; 514.3
is the only colon-ending pick across all 37 top tens). Raising the cap to 13 would also
work but costs every prompt.

## Case quality

No expected answer disagrees with its source (34 rulings match exactly; both CR
examples match verbatim; the tester derivation agrees with 514.1–514.3a).

About 15 cases carry a weak or wrong deciding-rule label; in 10 the rule that actually
decides is already in the prompt, so the gate counts a miss with no knowledge gap:
- `copies-copy-of-permanent-spell-not-created`: labelled 111.1/707.10; decided by
  111.13 (#1) "The token is not 'created' for the purposes of any replacement effects
  or triggered abilities…"; 608.3f (#2), 707.10f (#5) agree.
- both `layers-hand-size-*`: labelled 613.7; decided by 613.11 (#2 / #5).
- `replacement-crafty-cutpurse`: labelled 614.12; decided by 616.1b (REQ-220 topic).
- `replacement-byrke`: labelled 614.1a/122.6; decided by 614.16 (#1).
- `replacement-regenerate-planeswalker`: 704.5i restated by 306.9 (#7); 614.8 (#10).
- `triggers-quagnoth`: labelled 113.6 (a stem); 113.6k (#3) operative.
- `dfc-modal`: 712.8f weak; 601.3e (#4) in prompt; 712.11c (#286) fits better.
- `combat-ward-of-piety`: 615.1 is prevention; Ward of Piety redirects (614.9, #57).
- `copies-null-profusion`: 707.12 pushes the wrong way; the point is a copy isn't a
  card (108.2, #1530).
- Generic or incidental: 608.2 (dark-depths), 510.2 (wicker), 614.1a
  (quest-for-pure-flame), 707.2 (bloodlord; 707.5 #12 fits better).

Near misses ranked #11–#20: 614.12 #20, 514.3a #13, 614.12 #17, 704.5i #15, 704.5m
#19, 118.9 #14. Only 514.3a changes what the prompt knows.

Game-state-gated topics never fire in lookup mode (`layers-timestamps-dependencies`,
`replacement-effects-basics`, `replacement-etb-effects`, `damage-basics`,
`copying-spells-abilities`, `effects-resolution-targets`); each carries a missed rule
or relative, but none of these cases needs it.

## Method

- Code under test: `.worktrees/implement-niche-interaction-rule-tests` at `f98b8feb`
  (PR #276 head), read and run only; `git status` clean.
- Script `measure-missing-nonkeyword.mjs` (adapted from Probe A; `measure-missing.mjs`
  unchanged), output `measure-missing-nonkeyword.out.txt`:
  `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests && npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-missing-nonkeyword.mjs`
- Prompt built as the gate builds it: `buildCaseRequest` → schema parse →
  `checkReFreeze` (37/37 fresh) → `preparePromptInput`, committed indexes, frozen
  vector, cap 10; a cap-3000 run gives the full ranking (first ten match cap 10 in every
  case).
- Recorded per case: (a) missed rule text in prompt 0/37; (b) source and source ruling
  in prompt 34/34, none dropped by the 100-ruling cap; (c) every ruling of every
  attached card; (d) ranks of the missed rule and its parent / sibling / same-section
  rules; (e) topics selected and every topic carrying a missed rule or relative; (f) the
  better-fitting deciding rule with rank; (g) colon-ending stem picks; (h) the REQ-179
  counterfactual (exact-only exclusion).
- Offline: committed data, frozen vectors, no network, no model call. Verdicts are
  Probe C's, from reading each case.

## Per case

| Case | Missed | Source | Ruling | Missed-rule rank | Related rules in prompt | Verdict | Reason |
|---|---|---|---|---|---|---|---|
| combat-quest-for-pure-flame-divided-damage | 614.1a | card ruling, t2 | #3/11 | #967 | 601.2d #3, 115.7f #6 | COVERED | Ruling: "the damage is divided before Quest for Pure Fire's effect doubles it." Label incidental. |
| combat-vengeful-archon-prevent-which-damage | 615.1, 616.1 | card ruling, t2 | #6/10 | #157, #284 | 615.10 #2, 615.4 #8, 615.8 #9 | COVERED | Ruling: "you choose which of that damage to prevent." REQ-220 topic not added (one card says "prevent"). |
| combat-ward-of-piety-redirected-damage | 510.2, 615.1 | card ruling, t2 | #1/1 | #53, #394 | 615.13 #2 | COVERED | Ruling: "Redirected damage retains its information… It's still combat damage." Label: redirection is 614.9 (#57). |
| combat-wicker-warcrawler-counter-after-damage | 510.2 | card ruling, t2 | #1/1 | #70 | none in 510.x | COVERED | Ruling: "put on … at end of combat, after combat damage has already been dealt." |
| combat-wither-applies-to-noncombat-damage | 120.3 | card ruling, t2 | #1/1 | #192 | 702.80a #1, 120.3e #2, 120.3d #7 | COVERED | Ruling: "Wither applies to any damage dealt to creatures by the affected creature." |
| copies-bloodlord-and-phantasmal-image | 707.2 | card ruling, t2 | #1/3 | #39 | 707.11 #6, 707.10 #8, 707.9d #9 | COVERED | Ruling: "…is not a Vampire creature spell." 707.5 (#12) fits better. |
| copies-copy-of-permanent-spell-not-created | 111.1, 707.10 | card ruling, t2 | #8/9 | #81, #87 | 111.13 #1, 608.3f #2, 707.10e–g #4–6 | COVERED | 111.13: "The token is not 'created' for the purposes of…". Label wrong. |
| copies-morphic-tide-and-sakashimas-student | 614.12, 707.2 | card ruling, t2 | #2/6 | #20, #23 | 707.6 #1, 614.13a #2, 707.4 #5, 707.3 #10 | COVERED | Ruling: "won't be able to enter as a copy of a permanent that's entering at the same time." |
| copies-null-profusion-and-isochron-scepter | 707.12 | card ruling, t2 | #3/4 | #61 | 707.10 #1 | COVERED | Ruling: "It won't trigger when you play a copy of a card." Label flag (108.2). |
| dfc-modal-double-faced-card-legality | 712.12, 712.8f | card ruling, t2 | #6/7 | #150, #867 | 601.3e #4 | COVERED | Ruling: "consider only the characteristics of the face you're playing." |
| dfc-sever-the-bloodline-double-faced-name | 712.8d | card ruling, t2 | #11/13 | #1604 | 712.18 #1, 712.13a #2, 712.9 #5 | COVERED | Ruling: "A double-faced creature only has the name of the face that's up." |
| layers-hand-size-timestamp-praetors-counsel | 613.7 | card ruling, t2 | #1/2 | #897 | 613.11 #2, 402.2 #8 | COVERED | Ruling: "apply them in timestamp order." 613.11 fits better. |
| layers-hand-size-timestamp-thought-eater | 613.7 | card ruling, t2 | #1/1 | #893 | 613.11 #5, 402.2 #2 | COVERED | Same ruling text; 613.11. |
| necropotence-silence-borne-upon-a-wind-cleanup | 514.2, 514.3a | owner-derived, tester, t3 | n/a | #29, #13 | 514.3 #2, 514.1 #3, 724.1f #4, 703.4p #5 | **PARTLY** | 703.4p covers 514.2; absent 514.3a ("then the active player gets priority. Players may cast spells…"); 514.3 ends "subject to the following exception:". |
| replacement-byrke-and-branching-evolution | 122.6, 614.1a | card ruling, t2 | #1/1 | #188, #57 | 614.16 #1, 614.5 #3, 614.12 #7 | COVERED | Ruling: "Replacement effects that modify the number of counters … apply to this ability as normal." |
| replacement-crafty-cutpurse-anointed-procession | 614.12 | card ruling, t2 | #2/7 | #17 | REQ-220 topic (616.1, 616.1b), 614.16 #2, 614.5 #3 | COVERED | Ruling: "Crafty Cutpurse's effect applies before that of Anointed Procession." |
| replacement-damia-thought-reflection-draw | 614.11, 614.1a | card ruling, t2 | #2/4 | #272, #2703 | 121.2 #5 | COVERED | Ruling: "Effects can modify the number of cards you'll draw… you'll draw six cards." |
| replacement-felix-and-charging-tuskodon | 614.1 | card ruling, t2 | #4/5 | #1631 | 614.5 #5, 701.10g #9 | COVERED | Ruling: "Replacement effects are unaffected by Felix's last ability." |
| replacement-invoke-the-ancients-parallel-lives | 614.1a, 616.1 | card ruling, t2 | #1/2 | #1794, #921 | 614.16 #2 | COVERED | Ruling: "you will make that choice for each of those tokens individually." |
| replacement-jailer-and-colossus-replacement | 614.1a | card ruling, t2 | #7/7 | #103 | 614.12 #2, 614.6 #10 | COVERED | Ruling: "the card is never actually put into the graveyard." |
| replacement-regenerate-planeswalker-loyalty-zero | 704.5i | card ruling, t2 | #1/2 | #15 | 701.8b #1, 306.9 #7, 614.8 #10 | COVERED | 306.9 states the same as 704.5i. |
| replacement-rukarumel-and-bramblewood-paragon | 614.12, 616.1 | card ruling, t2 | #1/2 | #161, #1374 | none | COVERED | Ruling: "Replacement effects that modify creatures of a certain type as they enter will apply after you apply this effect." |
| replacement-saheeli-three-artifacts-sculpting-steel | 603.6a | card ruling, t2 | #2/8 | #62 | 614.12 #3, 614.13a #6, 707.5 #10 | COVERED | Ruling: "Replacement effects, such as that of Sculpting Steel, won't see the others…" |
| replacement-szadek-and-mending-hands | 615.1 | card ruling, t2 | #1/1 | #40 | REQ-220 topic, 615.9 #4, 615.7 #6 | COVERED | Ruling: "that player chooses which effect applies first." |
| replacement-unpreventable-damage-hydra | 615.1 | card ruling, t2 | #1/2 | #121 | 615.12 #3, 615.13 #7, REQ-220 topic | COVERED | Ruling: "it will be dealt as normal and won't cause Phyrexian Hydra to put -1/-1 counters on itself." |
| resolution-goreclaw-and-brawl-bash-ogre | 603.3b | card ruling, t2 | #2/3 | excluded (REQ-179); #243 if exact-only | 603.3 (topic, parent only) | COVERED | Ruling: "you may have that ability resolve before Goreclaw's last ability." |
| resolution-intellect-devourer-leaves-before-resolving | 610.3b | card ruling, t2 | #2/3 | #701 | none | COVERED | Ruling: "opponents won't exile any cards from their hands." |
| resolution-soulfire-grand-master-exile-spell | 608.2n | card ruling, t2 | #1/3 | #69 | 608.2f #1 | COVERED | Ruling: "won't be put into your hand because it's not put into your graveyard." |
| sba-aura-and-permanent-destroyed-together | 704.5m | card ruling, t2 | #4/5 | #19 | 404.3 #1 | COVERED | Ruling: "you decide the order… the Aura … is put into your graveyard on top of it." |
| sba-constricting-sliver-returning-creature | 610.3 | card ruling, t2 | #10/14 | #413 | none | COVERED | Ruling: "The two creatures aren't on the battlefield at the same time." |
| triggers-becomes-tapped-not-entering-tapped | 603.2e | CR example, t1 (no cards) | n/a | excluded (REQ-179); **#1** if exact-only | 603.2 (topic, parent only), 603.6d #5 | **MISSING** | Only 603.2e: "…doesn't trigger if the permanent enters the battlefield in that state." |
| triggers-damage-prevented-no-trigger | 603.2g | CR example, t1 (no cards) | n/a | excluded (REQ-179); **#1** if exact-only | 615.6 #2, 120.4b #7, 603.2 (topic) | COVERED (borderline) | 615.6 + 603.2 together; 603.2g blocked by REQ-179. |
| triggers-dark-depths-leaves-before-resolving | 608.2 | card ruling, t2 | #2/3 | #92 | 608.2k #2, 113.7a #5, 608.2b #7 | COVERED | Ruling: "you won't be able to sacrifice it, so you won't create Marit Lage." |
| triggers-dark-power-and-gaeas-cradle | 106.12a | card ruling, t2 | #1/5 | #70 | none in 106.x | COVERED | Ruling: "If a land is tapped for mana but doesn't produce any… won't trigger." |
| triggers-devouring-hellion-and-kronch-wrangler | 614.12 | card ruling, t2 | #1/3 | #88 | 614.13b #4, 603.6a #5 | COVERED | Ruling: "those abilities won't trigger." |
| triggers-quagnoth-discard-and-yixlid-jailer | 113.6 | card ruling, t2 | #9/9 | #615 | 113.6k #3 | COVERED | Ruling: "If Yixlid Jailer is on the battlefield, it won't trigger." |
| triggers-satoru-and-aven-interrupter | 118.9 | card ruling, t2 | #1/1 | #14 | 118.8d #6, 118.8 #8, 118.9c #9 | COVERED | Ruling: "you paid mana for additional costs or cost increases… won't trigger." |
