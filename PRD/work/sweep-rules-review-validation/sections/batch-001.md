# Sweep finding — batch-001
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/output/rules-review/batch-001.md
- Scored against: committed CR (effective 2026-08-07), cardDetailByOracleId, cardRulingsByOracleId
- Items: 25

## activate-chronatog — confirmed (slot: approve)
Chronatog ruling 2004-10-04 is verbatim ("once each turn for each Chronatog"); 701.2a is the mechanic tag; applied status is approved even though the slot was hand-fixed from "Accept".

## attach-reckless-crew — confirmed (slot: approve)
Reckless Crew ruling 2021-02-05 is verbatim; the question asks exactly what it answers (simultaneous attach); 701.3a is the tag.

## behold-celestial-reunion — confirmed (slot: approve)
Celestial Reunion ruling 2025-11-17 is verbatim and matches current Oracle ("behold two creatures of that type"); 701.4a defines behold by [quality], so creature-only is correct; outcome does-not-work matches the "No".

## cast-voidstone-gargoyle — confirmed (slot: approve)
Ruling 2007-02-01 is verbatim and still holds: 708.4 and 702.37c say a face-down spell is checked with its no-name face-down characteristics, so a name lock does not apply.

## counter-ionize — confirmed (slot: approve)
Ionize ruling 2018-10-05 is verbatim; legal target, not countered, 2 damage still dealt; short answer and outcome agree.

## create-regal-bloodlord — confirmed (slot: approve)
Regal Bloodlord ruling 2018-07-13 ("only one Bat token") is verbatim; it is an intervening-if trigger once per end step, so "No" and does-not-work are right.

## destroy-knight-of-the-mists — confirmed (slot: approve)
Knight of the Mists ruling 2004-10-04 is verbatim; "target Knight" has no controller restriction under current Oracle.

## discard-mind-maggots — confirmed (slot: approve)
Mind Maggots ruling 2004-10-04 is verbatim; "any number" includes zero.

## triggers-obstinate-baloth-discard-and-raiders-wake — confirmed (slot: approve)
Obstinate Baloth ruling 2017-11-17 is verbatim (the 2022-10-14 restatement agrees); Raiders' Wake triggers on "an opponent discards", which matches the question's frame; only one 701/702 id (701.9a).

## double-maro-s-gone-nuts — confirmed (slot: edit)
The edit holds: Maro's Gone Nuts is playtest content (rulings 2019-11-12). The replacement in the note checks out: Unleash Fury ruling 2020-06-23 is verbatim, and 701.10b says doubling gives "+X/+0, where X is that creature's power as the spell or ability ... resolves".

## triple-tifa-s-limit-break — confirmed (slot: approve)
Tifa's Limit Break ruling 2025-06-06 is verbatim, and 701.11b ("X is twice that creature's power") backs the "No" and the does-not-work outcome.

## exchange-arcanum-wings — confirmed (slot: approve)
Arcanum Wings ruling 2007-05-01 ("simultaneous, and happens on resolution") is verbatim; 701.12a supports it.

## exile-hikari-twilight-guardian — confirmed (slot: approve)
Hikari ruling 2004-12-01 is verbatim; the Oracle text says "you may exile Hikari", so "No" and does-not-work are right.

## combat-brontodon-and-hunt-the-weak — confirmed (slot: approve)
Belligerent Brontodon ruling 2017-09-29 is verbatim; 701.14a says fight uses "damage equal to its power"; only one 701/702 id.

## combat-treefolk-umbra-and-savage-swipe — confirmed (slot: approve)
Treefolk Umbra ruling 2019-06-14 is verbatim and current Oracle still says "assigns combat damage equal to its toughness"; 701.14a uses power for a fight.

## fight-primal-might — confirmed (slot: approve)
Primal Might ruling 2020-06-23 is verbatim; X=0 is legal, and the creatures still fight.

## goad-taunt-from-the-rampart — confirmed (slot: approve)
Taunt from the Rampart ruling 2023-06-16 is verbatim; 701.15b and 701.15c (multiple goaders add requirements) back "must attack the opponent that hasn't goaded it".

## investigate-expose-evil — confirmed (slot: approve)
Expose Evil ruling 2016-04-08 is verbatim; "up to two target creatures" allows zero targets.

## mill-incarnation-technique — confirmed (slot: approve)
Incarnation Technique ruling 2021-04-16 is verbatim; the Oracle sequence "Mill five cards, then return" makes the choice happen after the mill.

## play-act-on-impulse — confirmed (slot: approve)
Act on Impulse ruling 2014-07-18 ("remain exiled") is verbatim; 701.18a is the tag; outcome does-not-work matches the "No".

## regenerate-boneknitter — confirmed (slot: approve)
Boneknitter ruling 2004-10-04 is verbatim; the committed type line is "Creature — Zombie Cleric", and the production prompt prints it (apps/backend/src/prompt/promptFormatting.ts:195 `typeLine:`), so the premise reaches the model.

## replacement-regenerate-planeswalker-loyalty-zero — confirmed (slot: approve)
Reknit ruling 2008-05-01 is verbatim; 701.19a replaces only "would be destroyed", and 704.5i puts a 0-loyalty planeswalker in the graveyard, which is not destruction.

## reveal-scent-of-brine — confirmed (slot: approve)
Scent of Brine ruling 2004-10-04 is verbatim; the reveal is in the spell's effect text, not a cost, so "No" and does-not-work are right.

## multiplayer-only-blood-ends-your-nightmares-opponents — confirmed (slot: approve)
The scheme's ruling 2010-06-15 is verbatim. It matches Tajuru Preserver's 2010-06-15 ruling ("you just don't"). Under 608.2d the sacrifice is impossible, so that player discards two.

## sacrifice-fallen-angel — confirmed (slot: approve)
Fallen Angel ruling 2004-10-04 is verbatim; "Sacrifice a creature" includes itself, and 701.21a only requires that you control the permanent.
