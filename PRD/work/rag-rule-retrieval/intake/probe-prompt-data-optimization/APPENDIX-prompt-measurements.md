# Section share across 30 golden prompts (chars; ~4 chars/token)

| Section | Total chars | Share | Avg per prompt |
| --- | ---: | ---: | ---: |
| GAME RULES (reference) | 291,787 | 57.2% | 9,726 |
| ADDITIONAL RELEVANT RULE EXCERPTS | 106,581 | 20.9% | 3,553 |
| MTG REFERENCE | 45,000 | 8.8% | 1,500 |
| SYSTEM ROLE PREAMBLE | 14,130 | 2.8% | 471 |
| COMMANDER SPELLBOOK COMBO CONTEXT | 14,111 | 2.8% | 470 |
| ZONE: | 13,506 | 2.6% | 450 |
| INSTRUCTIONS | 10,773 | 2.1% | 359 |
| SCOPE | 3,470 | 0.7% | 116 |
| GENERAL GAME CONTEXT | 2,446 | 0.5% | 82 |
| PHASE GUIDANCE | 2,260 | 0.4% | 75 |
| QUESTION | 2,080 | 0.4% | 69 |
| CARD (looked up) | 1,896 | 0.4% | 63 |
| OFFICIAL RULINGS | 1,735 | 0.3% | 58 |

Grand total: 509,775 chars, avg 16,993 chars/prompt (~4,248 tokens)

# Per-fixture: total, game-rules share, supplemental rule IDs, question

| Fixture | Total | S2 chars | S3 chars | Rulings chars | S3 rule IDs | Question |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| ambiguous-wording | 26,152 | 17,305 | 5,245 | 0 | 712.21c, 702.24a, 608.2c, 701.57a, 118.12 | can i do this before that resolves?? |
| battlefield-skip | 17,722 | 11,898 | 2,800 | 0 | 702.44c, 113.11, 701.6a, 608.2c, 707.11 | Does this still resolve if no board effects matter? |
| cascade-keyword | 22,167 | 17,305 | 1,470 | 0 | 702.85a, 702.108a, 702.85b, 702.108b, 702.85c | When I cascade into a noncreature spell, does prowess trigger on my creature before or aft |
| combat-deathtouch | 20,579 | 12,925 | 4,242 | 0 | 702.19b, 122.1b, 702.19c, 702.19f, 702.19e | My 4/4 attacker is blocked by a 1/1 with deathtouch. How much combat damage do I have to a |
| commander-spellbook-complete-no-intent | 17,537 | 9,501 | 3,190 | 0 | 702.75a, 614.13c, 702.170a, 701.23b, 701.23c | How does this resolve? |
| commander-spellbook-degraded | 16,316 | 9,501 | 3,638 | 0 | 616.1f, 702.75a, 614.13c, 702.170a, 701.23b | Do I have a combo on board right now? |
| commander-spellbook-lookup-attached-intent | 12,771 | 4,094 | 3,703 | 264 | 603.7c, 111.10t, 614.13c, 702.75a, 712.21c | Does this card combo with anything? |
| commander-spellbook-lookup-multi-card-complete | 16,442 | 4,094 | 6,494 | 328 | 400.6, 702.75a, 712.21c, 123.6c, 616.1f | How do these cards combo with each other? |
| commander-spellbook-lookup-multi-card-partial | 12,493 | 4,094 | 2,487 | 305 | 702.72a, 712.21c, 702.141a, 111.10t, 701.61a | Does either of these cards combo with anything? |
| commander-spellbook-lookup-unrelated | 12,426 | 4,094 | 5,032 | 264 | 712.21c, 608.2f, 701.23c, 702.88a, 614.13c | What does this ability do when it resolves? |
| commander-spellbook-partial-explicit-intent | 17,805 | 9,501 | 3,109 | 0 | 616.1f, 707.9a, 707.9b, 205.3f, 601.1 | Do I have a combo on board right now? |
| commander-spellbook-unresolved-template | 18,692 | 9,501 | 4,613 | 0 | 732.2a, 707.10e, 616.1g, 104.4b, 104.4f | Does this loop go infinite? |
| commander-spellbook-wrong-zone | 19,462 | 9,501 | 4,454 | 0 | 702.75a, 702.59a, 607.5, 712.21c, 614.13c | Is this a combo if I get it back? |
| counterspell-stack | 21,837 | 11,898 | 6,839 | 0 | 800.4a, 712.21c, 608.2f, 613.5, 608.2c | Counterspell is on top of the stack targeting my Divination. When everyone passes priority |
| follow-up-chat | 18,864 | 11,898 | 3,763 | 0 | 707.5, 702.62a, 702.44c, 122.8, 122.9 | What if the Opt player had also held a Negate — could they counter the Counterspell? |
| full-context | 26,748 | 17,305 | 5,904 | 0 | 603.8, 118.12, 807.5b, 732.2a, 603.10a | How does this interaction resolve? |
| mana-spent-explicit-fallback | 17,766 | 11,898 | 2,805 | 0 | 702.44c, 702.44a, 702.191a, 608.2c, 702.62a | Show mana spent details for these stack entries. |
| multi-step-stack | 25,235 | 17,305 | 4,274 | 0 | 702.47c, 728.1, 702.44c, 702.62a, 712.21c | Walk me through the full stack resolution. |
| multi-zone | 17,001 | 11,898 | 1,722 | 0 | 601.3b, 601.3c, 702.8a, 601.3d, 601.5a | Does Snapcaster Mage's flash-back target survive the graveyard check? |
| near-cap-stack | 19,365 | 11,898 | 2,886 | 0 | 601.2, 602.2, 701.2a, 701.5a, 608.2g | Resolve the stack |
| player-counters | 17,001 | 9,501 | 4,399 | 0 | 608.2b, 104.3j, 704.6c, 903.10a, 400.6 | What is the current poison and commander damage state in this game? |
| quick-lookup-card | 8,962 | 4,094 | 1,623 | 246 | 702.2b, 702.2c, 704.5h, 122.1b, 701.8b | What does this ability do? |
| quick-lookup-multi-card | 8,604 | 4,094 | 984 | 328 | 702.2c, 702.170a, 702.2b, 702.2, 702.2a | Do these abilities interact during combat? |
| quick-lookup-no-card | 8,519 | 4,094 | 1,610 | 0 | 702.85, 702.85a, 702.85b, 702.85c, 604.5 | How does cascade work? |
| quick-lookup-off-domain | 6,917 | 4,094 | 0 | 0 |  | How do I bake sourdough bread? |
| quick-lookup-phrasing-answered | 8,752 | 4,094 | 1,812 | 0 | 102.1, 602.5d, 602.5e, 112.2a, 113.11 | What does it mean when people say a deck has a combo? |
| simple-interaction | 18,743 | 11,898 | 4,121 | 0 | 702.174j, 704.4, 800.4a, 107.15, 107.8 | What happens here? |
| state-based-actions | 24,935 | 17,305 | 4,416 | 0 | 704.5g, 120.5, 701.8b, 608.2f, 400.6 | Do state-based actions apply now? My opponent's 2/2 has 2 damage on it — does rule 704.5g  |
| upkeep-trigger | 18,472 | 10,303 | 5,048 | 0 | 603.5, 603.4, 601.2c, 500.6, 603.3b | It's my upkeep. My Phyrexian Arena's beginning-of-upkeep trigger and my opponent's beginni |
| zero-cards | 11,460 | 4,896 | 3,898 | 0 | 727.4, 103.5, 732.2a, 116.2g, 116.2k | We just drew our opening hands. Who has priority? |

# System 2 topic titles per fixture

- ambiguous-wording: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- battlefield-skip: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- cascade-keyword: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- combat-deathtouch: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Combat Damage Assignment; Combat Phase Structure; Damage Basics; Lifelink and Deathtouch Damage; Marked and Lethal Damage; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-complete-no-intent: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-degraded: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-lookup-attached-intent: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-lookup-multi-card-complete: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-lookup-multi-card-partial: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-lookup-unrelated: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-partial-explicit-intent: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-unresolved-template: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- commander-spellbook-wrong-zone: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- counterspell-stack: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- follow-up-chat: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- full-context: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- mana-spent-explicit-fallback: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- multi-step-stack: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- multi-zone: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- near-cap-stack: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- player-counters: 10 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- quick-lookup-card: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- quick-lookup-multi-card: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- quick-lookup-no-card: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- quick-lookup-off-domain: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- quick-lookup-phrasing-answered: 4 topics — Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
- simple-interaction: 9 topics — Triggered Ability Basics; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- state-based-actions: 15 topics — Triggered Ability Basics; Zone-Change Triggered Abilities; Copying Spells and Abilities; Resolving Targeted Spells and Abilities; Impossible Actions and Sources; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Casting Spells: Choices and Targets; Casting Spells: Costs and Completion; Stack and Priority; Targets; Zones and Zone Changes
- upkeep-trigger: 11 topics — Delayed Triggered Abilities; Triggered Ability Basics; Zone-Change Triggered Abilities; Layer Order; Power/Toughness Layers; Timestamps and Dependencies; Replacement Effect Basics; Replacement Effects as Permanents Enter; Stack and Priority; Targets; Zones and Zone Changes
- zero-cards: 5 topics — Delayed Triggered Abilities; Triggered Ability Basics; Stack and Priority; Targets; Zones and Zone Changes
