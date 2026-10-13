# Six card-wording entries for the concept map

Problem: when a card says "whenever", "rather than pay its mana cost", "gain control of", "gets −2/−2", "sacrifice this creature:" or "choose two —", rule search often misses the rules that decide the question (603, 118.9, 613, 704.5f/g, 602, 601), because card wording does not look like rule-book wording.
Outcome: six new entries in the concept map (`apps/backend/src/gameRulesConceptMap.ts`, REQ-234) turn that wording into rule-book words before search, and the rule-search model is retrained on the final search setup, so Luna gets those rules.
Non-goals: no change to the existing 78 entries, retrieval caps, or prompt layout; no new rule-search recipe.
Intake: `intake/GRAPH-BRIEF.md` (evidence, not authority). It cites sibling files in the launch checkout, not opened here: `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-proposals.md`, `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch`, `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/HANDOFF.md`.

## Prior run

- `PRD/instructions/receipts/right-rules-in-order-2026-10-12.md` — added the 78th concept-map entry (type-setting) and the rule-search model `rule-search-d2c2e500a4c6`; REQ-234 requires any map change to be a separate owner-reviewed edit, and REQ-236 requires retraining after search changes land.
- `PRD/instructions/receipts/exact-curated-rule-exclusion-2026-10-08.md` — earlier rule-search ground (exact curated rule exclusion); keyword match only.
