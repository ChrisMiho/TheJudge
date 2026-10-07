# Sweep finding — batch-013
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/output/rules-review/batch-013.md
- Scored against: committed CR (effective 2026-08-07), cardDetailByOracleId, cardRulingsByOracleId
- Items: 25

## sba-constricting-sliver-returning-creature — confirmed (slot: approve)
Constricting Sliver 2014-07-18 ruling is verbatim and matches 610.3; outcome No holds (the returning Pretender also only copies "a creature you control", which points the same way).

## continuous-all-white-creatures-until-end-of-turn — confirmed (slot: approve)
Reference is the 611.2c example verbatim; set of affected objects is locked when the effect begins, so No / does-not-work is right.

## continuous-arbiter-enchantment-enters-trigger — confirmed (slot: approve)
611.2e example verbatim; "is an enchantment" applies simultaneously with entering, so the enters trigger fires; current Arbiter oracle matches.

## continuous-prevent-all-creature-damage-this-turn — confirmed (slot: approve)
611.2c second example verbatim; a rules-modifying effect applies to later creatures, so Yes / works.

## continuous-static-ability-changes-token-as-it-enters — confirmed (slot: approve)
611.3c example verbatim; the creature enters as a 2/2, so No / does-not-work matches.

## layers-hand-size-timestamp-praetors-counsel — confirmed (slot: approve)
Praetor's Counsel 2011-06-01 ruling verbatim; outcome right (the governing rule is 613.11 rules-modifying effects in timestamp order, not 613.7 alone, but rule ids do not score).

## layers-hand-size-timestamp-thought-eater — confirmed (slot: approve)
Thought Eater 2009-10-01 ruling verbatim; Rack then Eater = 4-3 = 1, Eater then Rack = 4 (613.11 timestamp order); short answer's "sets the maximum" is loose but the outcome is right.

## layers-honor-of-the-pure-color-changes — confirmed (slot: approve)
613.5 example verbatim; Honor of the Pure oracle matches; 3/3 while white, 2/2 once red.

## layers-independent-effects-use-timestamp — confirmed (slot: approve)
613.9 example verbatim; question states the no-dependency premise, so last timestamp wins.

## layers-noncreature-artifacts-become-creatures — confirmed (slot: approve)
613.6 example verbatim; the set fixed in layer 4 carries into layer 7b.

## layers-switch-power-toughness-then-plus-five — confirmed (slot: approve)
613.4d example verbatim; arithmetic re-derived: 1/4 unswitched, +5/+0 gives 6/4, switched 4/6.

## layers-two-switches-cancel — confirmed (slot: approve)
613.4d third example verbatim; two 7d switches cancel, 1/4.

## academy-manufactor-esix-treasure — confirmed (slot: approve)
Tier 3 re-derived: 616.1/616.1e affected player picks order, 616.1f re-checks; Manufactor first gives 3 tokens Esix can replace with 3 copies; Esix first gives 1 creature copy Manufactor cannot touch (614.5 one opportunity); Esix 2021-04-16 "applies before anything that modifies how those tokens enter" does not bear on Manufactor, which replaces the creation event; outcome depends is right.

## copies-morphic-tide-and-sakashimas-student — confirmed (slot: approve)
Morphic Tide 2012-06-01 ruling verbatim; 614.12 checks only what is already on the battlefield, so No.

## replacement-byrke-and-branching-evolution — confirmed (slot: approve)
Byrke 2024-07-26 ruling verbatim; doubling is putting counters (122.6), so Branching Evolution applies.

## replacement-damia-thought-reflection-draw — confirmed (slot: approve)
Damia 2011-09-22 ruling verbatim; 7-4 = 3 draws, each replaced by two (614.1a), so six.

## replacement-felix-and-charging-tuskodon — wrong-verdict (slot: approve)
Felix 2024-04-12 ruling is verbatim and correct, but the question opens with "Felix Five-Boots' last ability does not change replacement effects", which is the ruling's answer stated as a premise; should be edit: drop that first sentence so the case tests whether the model knows Felix only re-triggers triggered abilities.

## replacement-jailer-and-colossus-replacement — confirmed (slot: approve)
Yixlid Jailer 2021-03-19 ruling verbatim; Colossus oracle matches; replaced event never happens (614.6), so No.

## replacement-orb-of-dreams-enters-untapped — confirmed (slot: approve)
614.12 example verbatim; Orb oracle matches; enters untapped.

## replacement-rhythm-of-the-wild-leaves-with-creature — confirmed (slot: approve)
Rhythm of the Wild 2019-05-03 ruling verbatim; Rescuer Sphinx oracle matches; riot still applies (614.12 existing continuous effects).

## replacement-rukarumel-and-bramblewood-paragon — confirmed (slot: approve)
Rukarumel 2023-07-28 ruling verbatim; Bramblewood oracle matches; Runeclaw Bear is not in the committed card index but the question needs only that it is a nontoken creature card.

## replacement-saheeli-three-artifacts-sculpting-steel — confirmed (slot: approve)
Saheeli Rai 2016-09-20 ruling verbatim; current −7 text matches; 614.12 vs 603.6a split is correct.

## replacement-sutured-ghoul-cannot-exile-entering-cards — confirmed (slot: approve)
614.13a example verbatim; Sutured Ghoul oracle matches; No.

## replacement-two-devour-effects-one-sacrifice — confirmed (slot: approve)
614.13b example verbatim; Thunder-Thrash Elder is red with devour 3; question states the devour 5 premise; 0/3/5 counters.

## replacement-yixlid-jailer-and-enters-tapped — confirmed (slot: approve)
614.12 example verbatim; both oracles match; the ability is checked as it would exist on the battlefield, so it enters tapped.
