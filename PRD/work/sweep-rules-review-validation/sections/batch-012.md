# Sweep finding — batch-012
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/output/rules-review/batch-012.md
- Scored against: committed CR (effective 2026-08-07), cardDetailByOracleId, cardRulingsByOracleId
- Items: 25

## combat-blocked-by-creature-later-turned-white — confirmed (slot: approve)
Reference is the verbatim 509.3f example; the blocker's color is checked as it becomes a blocking creature, so "No" / does-not-work holds.

## combat-flying-and-shadow — confirmed (slot: approve)
Reference is the verbatim 509.1b example ("Different evasion abilities are cumulative"); "No" / does-not-work holds.

## combat-wicker-warcrawler-counter-after-damage — confirmed (slot: approve)
Ruling 2008-05-01 is verbatim on Wicker Warcrawler; oracle says "at end of combat" (after 510.2 damage) while Dusk Urchins' counter goes on with the attack/block trigger, so "No" holds.

## necropotence-silence-borne-upon-a-wind-cleanup — confirmed (slot: approve)
Re-derived: 514.1 discard triggers Necropotence; 514.2 ends Silence's "this turn" effect; 514.3a puts the waiting trigger on the stack and gives the active player priority; Borne Upon a Wind is an Instant (committed type line), so "Yes" / works holds.

## combat-quest-for-pure-flame-divided-damage — confirmed (slot: approve)
Ruling 2009-10-01 is verbatim (including the ruling's own "Quest for Pure Fire" typo); division is announced at cast (601.2d) and the doubling is a replacement at damage time (614.1a), so "Yes" holds.

## copies-null-profusion-and-isochron-scepter — confirmed (slot: edit)
Ruling 2007-02-01 verbatim; the edit note is right: 707.12 says the copy "becomes cast", and the trigger misses because a copy is not a card (701.18b "To play a card means to play that card ... or to cast that card").

## resolution-goreclaw-and-brawl-bash-ogre — confirmed (slot: approve)
Ruling 2018-07-13 verbatim on Goreclaw; both attack triggers are the same controller's and 603.3b lets them be stacked in any order, so "Yes" holds.

## triggers-becomes-tapped-not-entering-tapped — confirmed (slot: approve)
Verbatim 603.2e text and example ("doesn't trigger if the permanent enters the battlefield in that state"); "No" holds.

## triggers-damage-prevented-no-trigger — confirmed (slot: approve)
Verbatim 603.2g example ("An event that's prevented or replaced won't trigger anything"); "No" holds.

## triggers-dark-power-and-gaeas-cradle — wrong-verdict (slot: edit)
The edit note's premise is false: 106.12a says a "tapped for mana" trigger "triggers whenever such a mana ability resolves and produces mana", so the 2010-06-15 "won't trigger" ruling is current and the question/answer are correct as written; the slot should be approve (603.7a is off-topic but the deciding id never scores), or at most an edit that swaps 603.7a for 106.12a without rewording the question.

## triggers-devouring-hellion-and-kronch-wrangler — confirmed (slot: approve)
Ruling 2019-05-03 verbatim; sacrifice happens as the Hellion enters (614.12), so the sacrificed Wrangler is not on the battlefield when 603.6a checks for enters triggers; "No" holds.

## triggers-dies-trigger-same-time-as-artifact — confirmed (slot: approve)
Verbatim 603.10a example (leaves-the-battlefield triggers look back in time); "triggers twice" / works holds.

## triggers-exile-at-next-end-step-no-longer-a-creature — confirmed (slot: approve)
Verbatim 603.7c example (a delayed trigger still affects the object after it changes characteristics); "Yes" / works holds.

## triggers-intervening-if-life-total — confirmed (slot: approve)
Verbatim 603.4 example; the intervening-if is rechecked on resolution, so at 39 life the ability does nothing; "No" holds and the attached Felidar Sovereign oracle matches.

## triggers-karlov-triggers-per-life-gain-event — confirmed (slot: approve)
Ruling 2015-11-04 verbatim on Karlov; one trigger per life-gain event (603.2), so "Yes" / works holds.

## triggers-lifestaff-and-planar-cleansing — confirmed (slot: approve)
Ruling 2011-01-01 verbatim on Sylvok Lifestaff; a dies trigger looks back in time (603.10a), so "Yes, gain 3 life" holds.

## triggers-reflexive-trigger-only-for-its-own-sacrifice — confirmed (slot: approve)
Verbatim 603.12 example; the attached Heart-Piercer Manticore oracle matches the quoted ability; "No" holds.

## resolution-cannot-choose-sacrifice-without-creatures — confirmed (slot: approve)
Verbatim 608.2d example ("can't choose an option that's illegal or impossible"); "No" holds.

## resolution-clone-cannot-copy-land-creature-under-worms — confirmed (slot: approve)
Verbatim 608.3e example; the question states Dryad Arbor is a land creature, so Clone would enter as a land and goes to the graveyard; "No" holds.

## resolution-destroy-all-nonblack-white-and-black — confirmed (slot: approve)
Verbatim 608.2j example; a white-and-black creature is black, so "nonblack" misses it; "No" holds.

## resolution-illegal-target-no-lifegain — confirmed (slot: approve)
Verbatim 608.2b example ("If all its targets ... are now illegal, the spell or ability doesn't resolve"); "No life" holds.

## resolution-intellect-devourer-leaves-before-resolving — wrong-verdict (slot: edit)
Edit stands (ruling 2022-06-10 verbatim; dropping the unrelated sorcery Devour Intellect is right) but the note cites the wrong replacement rule: 611.2b governs "for as long as" continuous effects, while this "exiles ... until this creature leaves" effect is 610.3b ("the specified event has already occurred ... after that ability triggered, the object doesn't move"); the note should say 610.3b.

## resolution-scroll-of-isildur-illegal-target — confirmed (slot: approve)
Ruling 2023-06-16 verbatim; with its only target illegal the chapter ability doesn't resolve (608.2b), so the Ring doesn't tempt; "No" holds.

## resolution-soulfire-grand-master-exile-spell — confirmed (slot: approve)
Ruling 2014-11-24 verbatim; Temporal Trespass exiles itself instead of reaching the graveyard (608.2n), so the "instead of into your graveyard" replacement never applies; "No" holds.

## triggers-dark-depths-leaves-before-resolving — confirmed (slot: approve)
Ruling 2022-12-08 verbatim and current oracle reads "sacrifice it. If you do, create Marit Lage", so a Depths that already left can't be sacrificed and no token is made; "No" holds (608.2 is generic but never scores).
