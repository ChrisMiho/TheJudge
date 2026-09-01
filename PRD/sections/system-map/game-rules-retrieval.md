# Game rules retrieval
Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-170

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

System 3 is supplemental retrieval. It builds a query from the user's question plus a
keyword signal — deliberately not raw concatenated card oracle text, which pollutes the
query and tanks recall on multi-card questions — then scores official rule excerpts and
selects at most five. Scoring is semantic-primary: when the embedding-provider seam is
active the query is embedded and cosine-ranked against a committed per-rule embedding
vector, with the exact rule-ID and parent rule-ID boost merged in so a cited rule number
(e.g. "rule 613.9") is still pulled even when semantic similarity misses it. The prior
IDF-weighted lexical scorer is retained as the mock/offline default, as a component of
the exact-rule-id boost, and as the fallback whenever query embedding fails — so System 3
is never worse than its earlier lexical-only behavior. Ties prefer the highest matching
signal, then ascending rule ID. Before output is selected, System 3 excludes rule IDs
already selected by System 2, so the prompt does not print the same rule in both `GAME
RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS`.

The query embedder is chosen by the `EMBEDDING_PROVIDER` seam (`mock` | `local` |
`openai`), which mirrors the `ASK_AI_PROVIDER` boundary. `mock` (the default) does no
embedding and uses lexical only, so the default runs with no model access. `local` (the
shipped semantic provider) embeds the query in-process with a bundled `all-MiniLM-L6-v2`
model in ~2ms — no external call, so System 3 keeps its "no per-request external call"
posture. `openai` is seam-selectable for live mode only and is never the default. The
per-rule embeddings are a committed offline artifact built alongside
`gameRulesRuleIndex.json` and rebuilt only on CR refresh; the ~3,432 vectors are searched
in-process with cosine, with no vector database (REQ-170).

## Data flow

Input is the normalized prompt context plus startup-loaded artifacts: card rulings,
curated game-rules topics, the rule excerpt index, token statistics, and keyword
vocabulary. Prompt preparation first collects submitted cards for System 1. It then
selects System 2 topics from game-state signals and derives the selected curated rule
IDs from those topics.

Those curated rule IDs become the exclusion set for System 3. When a semantic
embedding provider is active, the async route handler embeds the query first and injects
the query vector into prompt preparation as an option, so `preparePromptInput` stays
synchronous. Supplemental retrieval builds the query from the question plus the keyword
signal, ranks the rule index (cosine over the committed rule embeddings when a query
vector is present, IDF-weighted lexical otherwise or on embedding failure) with the
exact-rule-id boost merged in, drops entries whose rule IDs are already in the System 2
set, and returns the top five excerpts plus debug data when mock enrichment diagnostics
are enabled. Prompt rendering places the resulting sections as curated rules, then
supplemental excerpts, then official rulings.

The output is reference text for the prompt. Missing or unparsable artifacts degrade by
omitting the affected section or disabling that boost path; they do not create an API
shape change or a deterministic rules-engine answer.

## Where it lives

- System 1: `apps/backend/src/cardRulings.ts`
- System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRules.ts`
- System 3: `apps/backend/src/gameRulesRetrieval.ts`
- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, `apps/backend/data/gameRulesRuleEmbeddings.json` (committed per-rule vectors, REQ-170)
- Embedding-provider seam: `EMBEDDING_PROVIDER` flag, mirroring the `ASK_AI_PROVIDER` boundary under `apps/backend/src/providers/`

## Worked example

A user asks whether a creature with deathtouch changes combat damage assignment during
the combat damage step, with a populated battlefield and the relevant card metadata in
the request. System 2 sees `turnPhase: combat`, the combat step, and populated zones;
it selects the always-on topics plus combat and battlefield-oriented curated topics.
Those topics render in `GAME RULES (reference)`.

System 3 then retrieves more specific rule excerpts. It builds the query from the
question plus the keyword signal (not raw card oracle text), embeds it with the active
provider, and cosine-ranks it against the committed rule embeddings so the excerpts that
actually address deathtouch and combat-damage assignment surface even when they share
few literal keywords with the question; any explicit rule number in the query still
pulls in an exact or parent match through the merged boost. If a combat damage rule is
already present in the System 2 topic set, that rule ID is excluded from System 3 so the
supplemental block uses its five slots for additional relevant context rather than
duplicating the baseline.

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
- System 3 scoring is semantic-primary (cosine over committed rule embeddings) with the
  exact-rule-id boost merged in and lexical retained as the mock/offline default and the
  failure fallback; it is never worse than the prior lexical-only behavior (REQ-170).
- The shipped semantic path uses a bundled local model, so System 3 keeps its "no
  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
  per-request call, and that is not the default.
- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032, which
  measures the semantic path via committed frozen query embeddings — no live embedding
  or AI call.
- Q-001, the System 3 keyword-vocabulary derivation strategy, remains open. Semantic
  retrieval reduces reliance on the hand-derived vocabulary but does not remove it (the
  vocabulary still feeds the query keyword signal and the exact-rule-id boost); this file
  flags that interaction and does not resolve Q-001.
- These systems provide prompt reference context only. They do not validate legality,
  simulate board state, or override submitted zones, stack order, targets, notes, or
  card oracle text.
