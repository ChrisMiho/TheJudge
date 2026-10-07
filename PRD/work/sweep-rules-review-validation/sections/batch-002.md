# Sweep finding — batch-002
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/output/rules-review/batch-002.md
- Scored against: committed CR (effective 2026-08-07), cardDetailByOracleId, cardRulingsByOracleId
- Items: 25

## scry-condescend — confirmed (slot: approve)
Condescend ruling 2017-11-17 is verbatim in the committed rulings; scry 2 is a separate instruction that happens whether or not {X} is paid, so "Yes" / works holds.

## search-hunting-cheetah — confirmed (slot: approve)
Ruling 2004-10-04 is verbatim; 701.23b ("isn't required to find some or all of those cards even if they're present") backs "No" / does-not-work.

## shuffle-sylvan-primordial — confirmed (slot: approve)
Ruling 2013-01-24 is verbatim; 701.23h ("The player searches that library only once") backs one search and one shuffle, so "No" / does-not-work holds.

## surveil-deadly-visit — confirmed (slot: approve)
Ruling 2018-10-05 is verbatim; surveil happens during resolution and death triggers go on the stack only afterward (next priority), so "Yes" is true under both the question's "put on the stack" and the ruling's "resolve" wording; pre-screen approve holds.

## tap-and-untap-snow-day — confirmed (slot: approve)
Ruling 2021-04-16 is verbatim and matches current Oracle ("Tap up to two target creatures" with no untapped requirement); 701.26a only stops the tap itself, the don't-untap clause still applies, so "Yes" / works holds.

## transform-civilized-scholar-homicidal-brute — confirmed (slot: approve)
Ruling 2011-09-22 is verbatim; the intervening-if "didn't attack this turn" is true for a creature that could not attack, so "Yes" / works holds.

## dfc-bolas-copy-exile-and-return-transformed — confirmed (slot: approve)
Ruling 2018-07-13 is verbatim and current; 712.14a ("a card that isn't a double-faced card ... stays in its current zone") decides "No" / does-not-work. 712.9 is a near-miss cite (712.14a is exact), but rule ids do not score and the two-card-ruling pool is gate-neutral.

## convert-soundwave-sonic-spy-soundwave-superior-captain — confirmed (slot: approve)
Ruling 2022-10-14 is verbatim; 701.28a says convert follows the transform rules 701.27a–f, and nothing in the committed CR contradicts the ruling, so "Yes" / works holds.

## fateseal-spin-into-myth — confirmed (slot: approve)
Ruling 2007-05-01 says "controlled", the question says "owner"; 701.29a lets you fateseal any opponent, so "No" is correct under either wording and the pre-screen approve holds.

## clash-whirlpool-whelm — confirmed (slot: approve)
Ruling 2007-10-01 is verbatim ("play" is old wording for cast); targets are chosen on casting (601.2c), before the clash on resolution, so "No" / does-not-work holds.

## planeswalk-bad-wolf-bay — confirmed (slot: approve)
Ruling 2023-10-13 is verbatim; 701.31c ("Abilities may also instruct a player to planeswalk") makes it part of the chaos ability's resolution, so "Yes" / works holds.

## set-in-motion-rule-text — confirmed (slot: approve)
Tier 1, reference is 701.32a verbatim ("Only the archenemy may set a scheme card in motion"); Supervillain Rumble (904.12c) makes every player an archenemy, so it does not create a counterexample; "No" / does-not-work holds.

## abandon-rule-text — confirmed (slot: approve)
Tier 1, reference is 701.33a verbatim ("Only a face-up ongoing scheme card may be abandoned"); non-ongoing schemes leave via 904.10, so "No" / does-not-work holds.

## proliferate-contagion-engine — confirmed (slot: approve)
Ruling 2011-01-01 is verbatim and consistent with the 2023-02-04 ruling (no responses once resolution starts); both proliferates happen in one resolution, so "No" / does-not-work holds.

## detain-azorius-justiciar — confirmed (slot: approve)
Ruling 2012-10-01 is verbatim; Oracle "up to two target creatures your opponents control" puts no same-opponent restriction, so "No" / does-not-work holds.

## populate-full-flowering — confirmed (slot: approve)
Ruling 2019-08-23 is verbatim; "Populate X times" with X=0 performs zero populates, so "No" / does-not-work holds.

## monstrosity-hydra-broodmaster — confirmed (slot: approve)
Ruling 2014-04-26 is verbatim; 701.37c ("The value of X in those abilities is equal to the value of X as that permanent became monstrous") backs "Yes" / works.

## vote-mob-verdict — confirmed (slot: approve)
Ruling 2024-02-02 is verbatim; Oracle "Each player secretly votes for another player" is mandatory and 701.38a has each player choose one option, so "No" / does-not-work holds.

## bolster-abzan-advantage — confirmed (slot: approve)
Ruling 2014-11-24 is verbatim; instructions resolve in printed order (608.2c), so the sacrifice precedes bolster and "Yes" / works holds.

## manifest-wildcall — confirmed (slot: approve)
Ruling 2014-11-24 is verbatim; X only scales the counters, the manifest instruction is unconditional, so "Yes" / works holds.

## support-expedition-raptor — confirmed (slot: approve)
Ruling 2016-01-22 is verbatim; 701.41a says "up to N other target creatures" with no controller restriction, so "Yes" / works holds.

## meld-mishra-claimed-by-gix — confirmed (slot: approve)
Ruling 2022-10-14 is verbatim; current Oracle reads "a creature named Phyrexian Dragon Engine" (singular), consistent with selecting one object, so "Yes" / works holds.

## exert-ahn-crop-champion — confirmed (slot: approve)
Ruling 2017-04-18 is verbatim; each exert's linked "when you do" trigger (701.43d) untaps all other creatures you control, so "Yes" / works holds.

## explore-nicanzil-current-conductor — confirmed (slot: approve)
Ruling 2023-11-10 is verbatim; 701.44b/701.44c (a permanent explores even if actions are impossible; last known information used after a zone change) back "Yes" / works.

## adapt-aeromunculus — confirmed (slot: approve)
Ruling 2019-01-25 is verbatim; 701.46a checks only "If this permanent has no +1/+1 counters on it" at resolution, so "Yes" / works holds.
