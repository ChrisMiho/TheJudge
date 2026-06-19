# Game rules retrieval
Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032

## How it works

Game rules retrieval is three related reference systems that feed prompt assembly
without changing the submitted game state. System 1 is card rulings: submitted stack
and zone cards are collected by card ID, resolved against the committed rulings index
derived from Scryfall bulk `rulings`, filtered to `source === "wotc"`, and emitted as
`OFFICIAL RULINGS` only for matched submitted cards. If no submitted card intersects
the committed card metadata oracle IDs, the rulings section is omitted.

System 2 is the curated baseline. It always includes core rules topics, then adds
conditional buckets from card-agnostic game-state signals only: `turnPhase`,
`combatStep`, and populated zone presence. Card names, oracle text, and keywords do
not affect System 2. This replaces the prior "all topics every request" baseline with
a smaller `GAME RULES (reference)` section that still covers the stable vocabulary the
model needs for stack, priority, zones, targets, combat, delayed triggers, and related
common interactions.

System 3 is supplemental retrieval. It builds a query from the user's question plus
card/context text, scores official rule excerpts with IDF-weighted lexical matching,
question and keyword boosts, exact rule-ID and parent rule-ID bonuses, then selects at
most five excerpts. Ties prefer the highest matching IDF signal, then ascending rule
ID. Before scoring output is selected, System 3 excludes rule IDs already selected by
System 2, so the prompt does not print the same rule in both `GAME RULES (reference)`
and `ADDITIONAL RELEVANT RULE EXCERPTS`.

## Data flow

Input is the normalized prompt context plus startup-loaded artifacts: card rulings,
curated game-rules topics, the rule excerpt index, token statistics, and keyword
vocabulary. Prompt preparation first collects submitted cards for System 1. It then
selects System 2 topics from game-state signals and derives the selected curated rule
IDs from those topics.

Those curated rule IDs become the exclusion set for System 3. Supplemental retrieval
tokenizes the question and oracle/context text, applies keyword and IDF resources,
scores the rule index, drops entries whose rule IDs are already in the System 2 set,
and returns the top five excerpts plus debug data when mock enrichment diagnostics are
enabled. Prompt rendering places the resulting sections as curated rules, then
supplemental excerpts, then official rulings.

The output is reference text for the prompt. Missing or unparsable artifacts degrade by
omitting the affected section or disabling that boost path; they do not create an API
shape change or a deterministic rules-engine answer.

## Where it lives

- System 1: `apps/backend/src/cardRulings.ts`
- System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRules.ts`
- System 3: `apps/backend/src/gameRulesRetrieval.ts`
- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`

## Worked example

A user asks whether a creature with deathtouch changes combat damage assignment during
the combat damage step, with a populated battlefield and the relevant card metadata in
the request. System 2 sees `turnPhase: combat`, the combat step, and populated zones;
it selects the always-on topics plus combat and battlefield-oriented curated topics.
Those topics render in `GAME RULES (reference)`.

System 3 then searches the question and card/context text for more specific rule
excerpts. Tokens from the direct question carry more weight than incidental card text,
rules-related keywords receive their boost, and any explicit rule number in the query
can pull in an exact or parent match. If a combat damage rule is already present in the
System 2 topic set, that rule ID is excluded from System 3 so the supplemental block
uses its five slots for additional relevant context rather than duplicating the
baseline.

System 1 independently checks the submitted card IDs against the rulings index. If one
of those cards has WotC rulings in the committed data, the rulings block appears after
the rules sections. If none match, the prompt still contains the selected game-rules
reference material and simply omits `OFFICIAL RULINGS`.

## Invariants / gotchas

- System 1 is card-specific and ruling-specific; it only emits WotC rulings for
  submitted cards that match the committed rulings/card metadata index.
- System 2 is intentionally card-agnostic. It is driven by `turnPhase`, `combatStep`,
  and populated-zone presence, not card names, oracle text, or keywords.
- System 3 is deduplicated against the System 2 selection, so the same rule ID never
  appears once as curated baseline and again as supplemental retrieval.
- System 3 is capped at five supplemental excerpts per request.
- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032.
- Q-001, the System 3 keyword-vocabulary derivation strategy, remains open. This file
  references that question but does not resolve it.
- These systems provide prompt reference context only. They do not validate legality,
  simulate board state, or override submitted zones, stack order, targets, notes, or
  card oracle text.
