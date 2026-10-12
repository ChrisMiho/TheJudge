# Game rules retrieval
Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181, REQ-190, REQ-220, REQ-233, REQ-234, REQ-235, REQ-236, REQ-237, REQ-238, REQ-239, REQ-240, REQ-241, REQ-242, REQ-244

## How it works

Game rules retrieval is three related reference systems that feed prompt assembly
without changing the submitted game state. System 1 is card rulings: submitted stack
and zone cards are collected by card ID, resolved against the committed rulings index
derived from Scryfall bulk `rulings`, filtered to `source === "wotc"`, and printed
directly under each matched card's block, at its first appearance, framed as that card's
rulings to apply only when the situation matches (REQ-241). If no submitted card intersects
the committed card metadata oracle IDs, no rulings are printed.

System 2 is the curated baseline. It always includes core rules topics, then adds
conditional buckets from game-state signals: `turnPhase` and `combatStep`. In In-Depth,
the topics populated zones used to add (spell casting, copying, layers, replacement
effects and zone-change triggers) are added instead when a card's concept terms (the
fixed concept map, REQ-234) or the question's words match a fixed trigger table built from
the rule book's own titles (REQ-242). One topic is gated on card wording in both modes:
when two or more cards —
attached in a lookup, or on the stack or in any zone in a game — carry replacement or
prevention wording ("instead", "prevent"), it adds the replacement-effect interaction
rules (CR 614.1a, 616.1, 616.1a–g, 616.2; REQ-220).
Card names and keywords never affect System 2. A topic rule that introduces a list
carries its list (117.3a–d, 400.7's twelve sub-rules), and the layer and delayed-trigger
topics carry 613.4d, 613.8b and 603.7a–c (REQ-240). This replaces the prior "all topics every request" baseline with
a smaller `GAME RULES (reference)` section that still covers the stable vocabulary the
model needs for stack, priority, zones, targets, combat, delayed triggers, and related
common interactions.

System 3 is supplemental retrieval. It builds a query from the user's question plus a
compact per-card signal — each submitted or attached card's name, type line, and
keyword list — plus fixed rule-book terms: the concept terms the committed concept map
draws from each card's wording (REQ-234), in In-Depth the current turn step's name, and,
for an obsolete term in the question, its glossary definition (REQ-233); deliberately not
the cards' full oracle text, which floods the query and was measured to drop recall@5 from
0.577 to 0.026 on a labelled benchmark. Word matching strips sentence dots, stems every
word on both sides, and gives every card keyword the keyword weight (REQ-233, REQ-180).
It then ranks official rule excerpts and selects at most fifteen: up to thirteen from this
main ranking (on the semantic path, only candidates scoring at least 0.6 of the top
unboosted blend, or citing a rule number the question names, REQ-190), and up to two
reserved for per-card search, in which each card's own oracle text is embedded and ranked
on its own and the best cards' top hits fill the reserved slots (REQ-235). Each attached
card's keyword rules then arrive as whole sets beside the excerpts (REQ-235). Ranking is hybrid: when the
embedding-provider seam is active the query is embedded and cosine-ranked against a
committed per-rule embedding vector, that cosine score and the IDF-weighted lexical
score are each normalised against the query's own top score, and the two are blended by
a single tuned weight (0.65 meaning, REQ-182), with the exact rule-ID and parent rule-ID boost merged into the
blended score so a cited rule number (for example "rule 613.9") is still pulled even
when semantic similarity misses it. The IDF-weighted lexical scorer alone is retained as
the mock/offline default, as the source of the exact-rule-ID boost, and as the fallback
whenever query embedding fails — so those settings are never worse than System 3's
earlier lexical-only behaviour. The blend exists because semantic-only ranking, measured
2026-09-05 on the 156-pair benchmark, was better overall (recall@5 0.85 vs 0.58 clean,
0.83 vs 0.53 with cards) but lost an expected rule on short lookup-mode questions — a
card name, type line, and one keyword — in three of eight labelled fixtures, scoring 9
of 12 checks against lexical's 12 of 12 (REQ-182). Ties prefer the highest matching
signal, then rule-book order (REQ-233). Before output is selected, System 3 excludes rule IDs already selected by
System 2 — exactly the rule numbers the selected topics list, because a topic prints only
the rules it lists; a lettered sub-rule of a listed parent that the topic does not list
competes like any other rule (REQ-179) — and the prompt does not print the same rule in
both `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS`.
A delivered excerpt that introduces a list brings its list items, which use no slot
(REQ-240), and the section prints in rule-book order, grouped under path labels
(REQ-239), with "see rule X" pointers carrying what they point at (REQ-244).

The query embedder is chosen by the `EMBEDDING_PROVIDER` seam (`mock` | `local` |
`openai`), which mirrors the `ASK_AI_PROVIDER` boundary. `mock` (the default) does no
embedding and uses lexical only, so the default runs with no model access. `local`
(the shipped semantic provider) embeds the query in-process with a bundled
`all-MiniLM-L6-v2` model fine-tuned on Magic rules questions (REQ-236) in a few
milliseconds — no external call, so System 3 keeps its "no per-request external call"
posture. The model is stored in the project's private S3 bucket, named and hashed in a
committed manifest, and fetched only when the deploy package is built (REQ-237).
`openai` is seam-selectable for live mode only and is never the default; its vector size
does not match the committed rule vectors, and that mismatch is reported loudly rather
than silently falling back. The per-rule embeddings are a committed offline artifact built
alongside `gameRulesRuleIndex.json`, rebuilt on CR refresh and whenever the model is
retrained, and record the model that built them; a mismatch with the running model
disables the semantic path with an error-level diagnostic (REQ-237). The vectors are
searched in-process with cosine, with no vector database (REQ-181).

The rule index the corpus is built from excludes the Comprehensive Rules source
document's table of contents and heading-only entries, so no searchable entry is a
duplicate or a bare heading, parses every rule faithfully (no title glued to a rule, no
real rule dropped, no two-letter rule id merged), and records the rule book's glossary,
edition, source hash and part titles (REQ-179).

## Data flow

Input is the normalized prompt context plus startup-loaded artifacts: card rulings,
curated game-rules topics, the rule excerpt index, token statistics, and keyword
vocabulary. Prompt preparation first collects submitted cards for System 1. It then
selects System 2 topics from game-state signals, the card-wording gate (REQ-220) and, in
In-Depth, the wording and question triggers (REQ-242), and derives the selected curated
rule IDs from those topics.

Those curated rule IDs become the exclusion set for System 3. When a semantic embedding
provider is active, the async route handler embeds the query, and each card's oracle text
for per-card search, first and passes the vectors into prompt preparation as an option, so
`preparePromptInput` stays synchronous. Supplemental retrieval builds the query from the
question plus the per-card keyword signal and concept terms (and, in In-Depth, the turn
step), ranks the rule index (cosine over the committed rule embeddings when a query
vector is present, IDF-weighted lexical otherwise or on embedding failure) with the
exact-rule-ID boost merged in, drops entries whose own rule ID is already in the
System 2 set (a listed parent rule ID does not drop its sub-rules), and returns up to
fifteen excerpts — two slots reserved for per-card hits, and on the semantic path
main-ranking candidates scoring under 0.6 of the top unboosted blend dropped unless the
question cites their rule number (REQ-190). Each attached card's keyword rules (its Scryfall
keywords that name a 701/702 rule) then add that rule's lettered pieces as one whole set
after the excerpts, skipping pieces already chosen, under a 6,000-character budget
(REQ-235). Debug data comes with it when mock enrichment diagnostics are enabled. Prompt rendering prints each card's
rulings under the card, then the curated rules, then the supplemental excerpts in rule-book order.

The output is reference text for the prompt. Missing or unparsable artifacts degrade by
omitting the affected section or disabling that boost path; they do not create an API
shape change or a deterministic rules-engine answer (canonical rule: `goals-and-non-goals.md` Scope Notes).

## Where it lives

- System 1: `apps/backend/src/cardRulings.ts`
- System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRules.ts`
- System 3: `apps/backend/src/gameRulesRetrieval.ts`; the shared word matching and Porter stemmer `apps/backend/src/gameRulesStemmer.ts` (REQ-233)
- Concept map: one committed module, `apps/backend/src/gameRulesConceptMap.ts` (REQ-234); In-Depth topic trigger table beside `gameRulesTopicSelection.ts` (REQ-242); the rules-section layout `apps/backend/src/prompt/ruleLayout.ts` (REQ-239, REQ-240, REQ-244)
- Search model: the committed manifest `apps/backend/data/embeddingModel.manifest.json`, the fetch script `scripts/fetch-embedding-model.mjs` and the owner-run training pipeline under `scripts/` (REQ-236, REQ-237)
- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed rule index, whose 701/702 pieces carry their keyword rule's title as data (REQ-179), the committed per-rule embeddings artifact (REQ-181), the rule-book glossary `apps/backend/data/gameRulesGlossary.json` and edition record `gameRulesBookMeta.json` (REQ-179), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json.br` (REQ-180)
- Embedding-provider seam: `EMBEDDING_PROVIDER` flag, mirroring the `ASK_AI_PROVIDER` boundary under `apps/backend/src/providers/`

## Worked example

A user asks whether a creature with deathtouch changes combat damage assignment during
the combat damage step, with a populated battlefield and the relevant card metadata in
the request. System 2 sees `turnPhase: combat`, the combat step, and populated zones;
it selects the always-on topics plus the combat-step topics, and any battlefield-oriented
topic the cards' wording or the question matches (REQ-242).
Those topics render in `GAME RULES (reference)`.

System 3 then retrieves more specific rule excerpts. It builds the query from the
question plus the attached cards' names, type lines, keywords and concept terms, and the
combat damage step's name — not their full oracle text — embeds it with the active
provider, and cosine-ranks it against the
committed rule embeddings, so the excerpts that actually address deathtouch and
combat-damage assignment surface even when they share few literal words with the
question. Any explicit rule number in the query still pulls in an exact or parent match
through the merged boost. Each card's own text is searched separately, and its best hit
can take one of two reserved slots. If a combat damage rule is already listed in the System 2
topic set, that exact rule ID is excluded from System 3 so the supplemental block uses
its slots for additional relevant context rather than duplicating the baseline; the
rule's lettered sub-rules, which the topic does not print, still compete for those slots.

System 1 independently checks the submitted card IDs against the rulings index. If one
of those cards has WotC rulings in the committed data, they print directly under that
card's block. If none match, the prompt still contains the selected game-rules
reference material and simply prints no rulings.

## Invariants / gotchas

- System 1 is card-specific and ruling-specific; it only emits WotC rulings for
  submitted cards that match the committed rulings/card metadata index, under each
  card's block (REQ-241).
- System 2 is driven by `turnPhase` and `combatStep`, plus card wording in two fixed
  forms: two or more cards whose oracle text says "instead" or "prevent" add the
  replacement-effect interaction topic (REQ-220), and, in In-Depth, the cards' concept
  terms and the question's words select the formerly zone-gated topics through a fixed
  trigger table (REQ-242). Card names and keywords never select a System 2 topic, and
  relevance scoring stays System 3's job.
- System 3 is deduplicated against the System 2 selection by exact rule ID, so the same
  rule ID never appears once as curated baseline and again as supplemental retrieval.
  Exact matching is enough only because each curated topic prints exactly the rules it
  lists; a test over the committed game-rules data holds every topic to that and fails
  if a topic ever carries a rule it does not list (REQ-179).
- System 3 is capped at fifteen supplemental search excerpts per request — thirteen main-ranking slots plus two reserved for per-card search (REQ-235) — raised from five to ten on 2026-09-09 and to up-to-fifteen with a 0.6 relevance cutoff on 2026-10-12 (REQ-190). The cutoff applies on the semantic path only; the lexical-only fallback keeps a plain top-N. Keyword-set rules (REQ-235, up to 6,000 characters per prompt) come on top of the cap and are not counted against it.
- System 3 ranking is a hybrid blend (normalised cosine over committed rule embeddings
  plus normalised lexical IDF overlap) with the exact-rule-ID boost merged in and
  lexical alone retained as the mock/offline default and the failure fallback; those
  settings are never worse than the prior lexical-only behaviour (REQ-181, REQ-182).
  Semantic-only ranking measured better overall but worse on short lookup-mode questions
  (a card name, type line, and one keyword), which is what the blend exists to fix — see
  REQ-182's notes for the measured sweep.
- The shipped semantic path uses a bundled local model — the Magic-trained MiniLM, fetched
  from private storage only at packaging (REQ-236, REQ-237) — so System 3 keeps its "no
  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
  per-request call, and that is never the default.
- Every committed vector file records the model that built it; a mismatch with the
  running model, or a query vector of the wrong size, is reported loudly and never
  silently ranked (REQ-181, REQ-237).
- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032, which
  measures the semantic path via committed frozen query embeddings — no live embedding
  or AI call — and by a committed offline labelled benchmark (REQ-177). The human
  relevance report is held to the harness's verdict by a parity test (REQ-177).
- The concept map and the In-Depth topic trigger table are fixed, committed tables; no
  model call produces search terms or selects topics at request time (REQ-234, REQ-242).
- A query vector whose size differs from the committed rule vectors' (OpenAI's 1,536 against 384) is reported loudly — one error-level diagnostic naming both sizes — and the lexical path serves the question; it is never silently ranked as a semantic result (REQ-181).
- Q-001, the System 3 keyword-vocabulary derivation strategy, is answered: per-card
  Scryfall `keywords` in the committed backend artifact, unioned at query time
  (REQ-180). The hand-curated vocabulary is retained only for detecting a keyword named
  in the question text.
- These systems provide prompt reference context only. They do not validate legality,
  simulate board state, or override submitted zones, stack order, targets, notes, or
  card oracle text (canonical rule: `goals-and-non-goals.md` Scope Notes).
