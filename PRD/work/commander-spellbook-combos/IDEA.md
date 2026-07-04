# commander-spellbook-combos

Players often need to know whether cards on the table (or a card they are looking up) participate in known infinite or game-winning combos, but that knowledge lives in Commander Spellbook and is not available inside TheJudge.

Outcome: bring Commander Spellbook’s community combo catalog into the app so users can see combos for a card, and later so Ask AI and board-aware flows can use the same data. Cards join on Scryfall `oracle_id` (already TheJudge `cardId`). Prefer a static, human-approved refresh pipeline (index by oracle id plus trimmed combo detail), consistent with rulings and card metadata — not a runtime-only dependency on the live CSB API for the primary path. Candidate surfaces to refine: card-centric combo list/detail, capped prompt enrichment when all pieces are in game context, find-my-combos for staged cards, and a full combo browser.

Non-goals: not an official rules source or rules engine; no replacing Scryfall metadata or WotC rulings; no hosting a public CSB mirror for third parties; no bracket-estimation product in the first cut unless refinement explicitly adds it.
