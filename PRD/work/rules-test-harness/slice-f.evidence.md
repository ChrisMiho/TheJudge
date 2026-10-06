# Slice F evidence

## F7 — the text-route mechanics were each checked

2026-10-06: every mechanic whose case does not use a ruling on a card that carries the keyword in Scryfall's `keywords` field (the text-route and manual-route mechanics) was read against its chosen ruling before its question was written, and the case kept only when the ruling is about the mechanic.

Routes chosen for the 255 mechanic cases (all `draft`, `source.pool` `mechanic`):

- 222 cases answered by a WotC ruling on a card whose keywords carry the mechanic (tier 2, ruling text verbatim, read from `cardRulingsByOracleId.json.br`).
- 28 cases answered by a WotC ruling on a card whose oracle text or ruling text names the mechanic (tier 2): 701.2 Activate, 701.3 Attach, 701.5 Cast, 701.6 Counter (Ionize), 701.7 Create, 701.8 Destroy, 701.9 Discard, 701.12 Exchange, 701.13 Exile, 701.18 Play, 701.20 Reveal, 701.21 Sacrifice, 701.23 Search (Hunting Cheetah), 701.24 Shuffle, 701.26 Tap and Untap (Snow Day), 701.31 Planeswalk, 701.38 Vote, 701.54 The Ring Tempts You, 701.55 Face a Villainous Choice, 701.64 Harness, 702.39 Provoke (Hunter Sliver), 702.60 Ripple, 702.64 Absorb (Lymph Sliver), 702.68 Frenzy (Frenzy Sliver), 702.70 Poisonous, 702.145 Daybound and Nightbound, 702.159 Visit, 702.186 Infinity (The Soul Stone). In each, the ruling is about how the mechanic works: the first automatic pick for 701.6 Counter, 701.23 Search and 702.68 Frenzy was rejected because its ruling was about something else (a +1/+1 counter, a card-specific search clause, a card whose name contained the word), and a ruling about the mechanic itself was chosen instead; 701.42 Meld, 702.10 Haste, 702.111 Menace and 702.156 Ravenous were re-picked for a ruling that was only a link, about an acorn card, about a joke card or about the card's other ability.
- 5 cases fall back to the rule's own text as tier 1, because no committed ruling is about the mechanic: 701.32 Set in Motion and 702.59 Recover (no card or ruling at all), 701.33 Abandon (scheme rulings are about specific schemes), 701.52 Roll to Visit Your Attractions (its only ruling, on Command Performance, already answers 701.51 Open an Attraction) and 702.147 Decayed (its one ruling is about the renew ability on the same card).

The family split in the corpus: 66 keyword actions (701.2 to 701.68 without 701.45), 98 keyword abilities in 702.2 to 702.100 (without Trample, already covered by a migrated case) and 91 in 702.101 to 702.192 (without 702.158 Space Sculptor). 66 + 98 + 91 = 255.

## Ratchet baseline

2026-10-06: `npm run eval:rules-gate:baseline` recorded 273 cases: 214 with every deciding rule reaching the prompt and 59 with a miss (the two first-ship misses plus 57 mechanic cases whose mechanic's first rule did not reach the prompt at cap 10). The misses are recorded, not hidden. No case failed the card, state or vector checks.
